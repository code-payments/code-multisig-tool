<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as mnemonic from '@code-wallet/mnemonic';

import { WalletMultiButton } from "solana-wallets-vue";
import { getInspectorLinkWithoutSigs, shortenSignature, getWallet, getReviewerLink } from '@/types';
import { Button, Layout, SectionParsedTransaction } from '@/components';
import { inject } from "vue";

const defaultPath = "m/44'/501'/0'/0'";

export async function addHardwareSignatureToTransaction(
  transaction: string,
): Promise<web3.Transaction> {
  const { signTransaction } = getWallet();

  const tx = web3.Transaction.from(Buffer.from(transaction, 'base64'));
  return await signTransaction(tx);
}

export async function addPaperWalletSignatureToTransaction(
  transaction: string,
  seed: string,
  path: string = defaultPath,
): Promise<web3.Transaction> {
  const tx = web3.Transaction.from(Buffer.from(transaction, 'base64'));

  if (!seed) {
    throw new Error('Invalid seed');
  }
  if (!path) {
    throw new Error('Invalid path');
  }

  tx.partialSign(getKeypairFromMnemonic(seed, path));

  return tx;
}

export async function addKeypairSignatureToTransaction(
  transaction: string,
  keypair: string,
): Promise<web3.Transaction> {
  const tx = web3.Transaction.from(Buffer.from(transaction, 'base64'));

  if (!keypair) {
    throw new Error('Invalid keypair');
  }

  tx.partialSign(getKeypairFromJson(keypair));
  return tx;
}

function getKeypairFromMnemonic(val: string, path: string = defaultPath) {
  const descriptor = mnemonic.Derive.descriptorFromMnemonic(new mnemonic.Path(path), val);
  const key = descriptor.toKeypair();
  const secret = new Uint8Array([...key.privateKey, ...key.publicKey]);
  return web3.Keypair.fromSecretKey(secret);
}

function getKeypairFromJson(val: string) {
  return web3.Keypair.fromSecretKey(Buffer.from(JSON.parse(val), 'hex'));
}

function getPublicKeyFromJsonKeypair(val: string) {
  try {
    const keypair = getKeypairFromJson(val);
    return keypair.publicKey.toBase58();
  } catch (err) {
    return 'Invalid keypair';
  }
}

export default {
  components: {
    Button,
    Layout,
    SectionParsedTransaction,
    WalletMultiButton,
  },
  setup() {
    const providedTx = inject('tx', '');
    return { providedTx };
  },
  data() {
    return {
      source: "hardware",
      seed: "",
      path: defaultPath,
      keypair: "",
      transaction: "",
      inspect: "",
    }
  },
  mounted() {
    this.transaction = this.providedTx;
    this.keypair = "";
    this.seed = "";
  },
  methods: {
    shorten(sig: string): string {
      return shortenSignature(sig);
    },

    hasSubmitted() {
      return this.inspect.length > 0;
    },

    getInspectorLink(val: string) {
      const tx = web3.Transaction.from(Buffer.from(val, 'base64'));
      return getInspectorLinkWithoutSigs(tx);
    },

    async onConfirm() {
      if (!this.isValid()) {
        return;
      }

      try {
        let signed: web3.Transaction;
        if (this.source == "hardware") {
          signed = await addHardwareSignatureToTransaction(this.transaction);
        } else if (this.source == "paper") {
          signed = await addPaperWalletSignatureToTransaction(this.transaction, this.seed, this.path);
        } else if (this.source == "keypair") {
          signed = await addKeypairSignatureToTransaction(this.transaction, this.keypair);
        } else {
          throw new Error("Invalid source");
        }

        this.transaction = signed.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64');

        this.inspect = getReviewerLink(this.transaction);
      } catch (err) {
        console.log(err);
        this.$bus.emit('open:error', err);
      }
      
    },

    onBack() {
      this.$bus.emit('goto:actionlist');
    },

    onMakeSeedPhrase() {
      this.seed = mnemonic.MnemonicPhrase.generate(mnemonic.MnemonicType.Long).getPhrase();
      this.path = defaultPath;
    },

    onMakeKeypair() {
      const key = mnemonic.MnemonicPhrase.generate(mnemonic.MnemonicType.Long).toKeypair()
      this.keypair = JSON.stringify([...key.privateKey, ...key.publicKey]);
    },

    isValid() {

      if (!this.transaction) {
        console.log("no transaction");
        return false;
      }

      return true;
    },

    parseValidSigners(val: string) {
      const delimiter = /[\n,]/;
      const validSigners = val.split(delimiter).map((s) => s.trim());
      return validSigners;
    },

    getValidSigners(val: string): web3.PublicKey[] {
      const validSigners = this.parseValidSigners(val);
      return validSigners.map((s) => new web3.PublicKey(s));
    },

    getPublicKeyFromMnemonic(val: string, path: string = defaultPath) {
      try {
        const keypair = getKeypairFromMnemonic(val, path);
        return keypair.publicKey.toBase58();
      } catch (err) {
        return 'Invalid keypair';
      }
    },

    getPublicKeyFromJsonKeypair(val: string) {
      try {
        const keypair = getKeypairFromJson(val);
        return keypair.publicKey.toBase58();
      } catch (err) {
        return 'Invalid keypair';
      }
    },
  },
}
</script>

<template>
  <Layout :header="true">

    <div v-if="hasSubmitted()" class="grid h-screen place-items-center mt-0 sm:mt-[-5rem]">
      <div class="max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Action Completed
        </p>

        <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
          Here is your transaction body. Please forward it to the multi-sig signers for them to sign.
        </p>

        <textarea class="w-full h-64 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg" v-model="transaction" readonly></textarea>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button :href="inspect" target="_blank">Review Transaction</Button>
        </div>
      </div>
    </div>

    <div v-else class="py-20">

      <div class="mx-auto max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Sign a Multi-Sig Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you add your signature to a multi-sig transaction.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Signer</h3>
          <p class="mt-3 text-sm text-slate-400">
            Select where the signature is coming from. We strongly recommend a digital wallet device.
          </p>
          <select v-model="source" class="w-full lg:w-1/4 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg">
            <option value="hardware">Connected Wallet</option>
            <option value="paper">Paper Wallet</option>
            <option value="keypair">Raw Keypair</option>
          </select>
          
          <div class="pl-5 pb-5 border-l-4 border-slate-500" v-if="source == 'hardware'">

            <h3 class="text-2xl font-medium leading-6 text-white mt-10">Hardware Wallet</h3>
            <p class="mt-3 mb-10 text-sm text-slate-400">
              Please check or connect the wallet using the button below.
            </p>

            <WalletMultiButton/>

          </div>

          <div class="pl-5 border-l-4 border-slate-500" v-if="source == 'paper'">

            <h3 class="text-2xl font-medium leading-6 text-white mt-10">Paper wallet</h3>
            <p class="mt-3 text-sm text-slate-400">
              We recommend using a hardware wallet instead, otherwise make sure you're on a properly <a href="https://en.wikipedia.org/wiki/Air_gap_(networking)" class="underline">air-gapped</a> machine. Learn more about paper wallets on the <a href="https://docs.solana.com/wallet-guide/paper-wallet" class="underline">Solana documentation</a> page.
              <br><br>
              You can generate a paper wallet using the following command:<br>
              <code class="text-slate-400 ring-1 ring-slate-700 rounded-md py-1 px-2">solana-keygen new --no-bip39-passphrase --no-outfile --derivation-path m/44'/501'/0'/0'</code>
            </p>

            <h3 class="text-lg font-medium leading-6 text-white mt-10">Seed Phrase</h3>
            <p class="mt-3 text-sm text-slate-400">
              What is your 12 or 24 word seed phrase? Or <button @click="onMakeSeedPhrase()" class="underline">generate one</button>.
            </p>
            <textarea v-model="seed" class="w-full h-20 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg"></textarea>

            <h3 class="text-lg font-medium leading-6 text-white mt-10">Derivation Path</h3>
            <p class="mt-3 text-sm text-slate-400">
              What path would you like to use to derive your public key?
            </p>
            <input v-model="path" type="text"
              class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

            <p class="mt-5 text-sm text-slate-400" v-if="seed && path">
              Public key: <span class="text-yellow-600">{{ getPublicKeyFromMnemonic(seed, path) }}</span>
            </p>
          </div>

          <div class="pl-5 border-l-4 border-slate-500" v-if="source == 'keypair'">
            <h3 class="text-2xl font-medium leading-6 text-white mt-10">Raw Keypair</h3>
            <p class="mt-5 text-sm text-slate-400">
              What is your raw keypair (solana cli JSON file)? Or <button @click="onMakeKeypair()" class="underline">generate one</button>.
            </p>
            <textarea v-model="keypair" class="w-full h-20 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg"></textarea>

            <p class="mt-5 text-sm text-slate-400" v-if="keypair">
              Public key: <span class="text-yellow-600">{{ getPublicKeyFromJsonKeypair(keypair) }}</span>
            </p>
          </div>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Transaction (base64)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Please paste the base64 encoded transaction below.
          </p>
          <textarea v-model="transaction" class="w-full h-64 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg"></textarea>

          <div v-if="transaction" class="mt-10">
            <SectionParsedTransaction :transaction="transaction" />
          </div>
        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="secondary" v-if="transaction" :href="getInspectorLink(transaction)" target="_blank">In Explorer</Button>
          <Button variant="primary" :disabled="!isValid()" @click="onConfirm()">Sign Transaction</Button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>