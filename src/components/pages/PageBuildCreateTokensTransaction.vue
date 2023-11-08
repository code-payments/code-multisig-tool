<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getAssociatedNonceKeypair, getInspectorLinkWithoutSigs, shortenSignature, getWallet } from '@/types';
import { Button, Layout } from '@/components';

export async function buildCreateTokensTransaction(
  mintConfig: {
    address: web3.PublicKey,
    amount: number,
  },
  signers: web3.PublicKey[],
  noncePassword: string,
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const tokenInfo = await token.getMint(connection(), mintConfig.address);
  if (!tokenInfo) {
    throw new Error('Token not found');
  }

  if (!tokenInfo.mintAuthority) {
    throw new Error('Token mint authority not found. The mint is finalized.');
  }
  
  const multisigInfo = await token.getMultisig(connection(), tokenInfo.mintAuthority);
  if (!multisigInfo) {
    throw new Error('Multisig not found');
  }

  const multisig = multisigInfo.address;
  const nonceKeypair = getAssociatedNonceKeypair(multisig, noncePassword);
  const tokenATA = await token.getAssociatedTokenAddress(mintConfig.address, multisig);

  const nonceInfo = await connection().getNonce(nonceKeypair.publicKey);
  if (!nonceInfo) {
    throw new Error('Nonce not found');
  }

  // get the valid signers
  const validSigners = Array.from({ length: 11 }, (_, i) => (multisigInfo as any)[`signer${i + 1}`].toBase58());

  // check that the signers are valid
  for (const signer of signers) {
    if (!validSigners.includes(signer.toBase58())) {
      throw new Error('Invalid signer');
    }
  }

  const ix = [
    web3.SystemProgram.nonceAdvance({
      noncePubkey: nonceKeypair.publicKey,
      authorizedPubkey: nonceKeypair.publicKey,
    }),
    token.createMintToInstruction(
      mintConfig.address,
      tokenATA,
      multisig,
      mintConfig.amount * Math.pow(10, tokenInfo.decimals),
      signers
    ),
  ];

  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = nonceInfo?.nonce;
  tx.partialSign(nonceKeypair);

  return await signTransaction(tx);
}

export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      mintAddress: "",
      signers: "",
      amount: 0,
      noncePassword: "",
      transaction: "",
      inspect: "",
    }
  },
  mounted() {
    this.transaction = "";
  },
  methods: {
    shorten(sig: string): string {
      return shortenSignature(sig);
    },

    hasSubmitted() {
      return this.transaction.length > 0;
    },

    async onConfirm() {
      if (!this.isValid()) {
        return;
      }

      const signers = this.getValidSigners(this.signers);
      const mintAddress = new web3.PublicKey(this.mintAddress);
      const signed = await buildCreateTokensTransaction({
        address: mintAddress,
        amount: this.amount,
      },
      signers,
      this.noncePassword);

      this.transaction = signed.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');
      
      this.inspect = getInspectorLinkWithoutSigs(signed);

    },

    onBack() {
      this.$bus.emit('goto:actionlist');
    },

    isValid() {
      if (!this.mintAddress) {
        console.log("no mint address");
        return false;
      }

      if (!this.noncePassword) {
        console.log("no nonce password");
        return false;
      }

      if (!this.signers) {
        console.log("no signers");
        return false;
      }

      // Check the validity of each signer as a public key
      const signers = this.parseValidSigners(this.signers);
      for (const signer of signers) {
        try {
          new web3.PublicKey(signer);
        } catch (err) {
          return false;
        }
      }

      // Check the validity of the nonce password
      if (this.noncePassword.length < 2) {
        console.log("invalid nonce password");
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

    getKeypairFromHex(val: string) {
      return web3.Keypair.fromSecretKey(Buffer.from(val, 'hex'));
    },

    getPublicKeyFromHexKeypair(val: string) {
      try {
        const keypair = this.getKeypairFromHex(val);
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
          <Button :href="inspect" target="_blank">Inspect Transaction</Button>
        </div>
      </div>
    </div>

    <div v-else class="grid place-items-center py-20">

      <div class="max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Build A Create Tokens Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you build a transaction to mint new tokens, you'll need to
            get signatures from the multi-sig account holders.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Address (base58)</h3>
          <input v-model="mintAddress" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Amount</h3>
          <p class="mt-3 text-sm text-slate-400">
            How many tokens should be minted to the multi-sig associated token account?
          </p>
          <input v-model="amount" type="number"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Signers List</h3>
          <p class="mt-3 text-sm text-slate-400">
            List out the public keys that will sign for the transaction. Review
            the multi-sig account to determine the minimum amount of signers.
            Use commas between base58 encoded public keys.
          </p>
          <textarea v-model="signers" type="text" rows="5"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Nonce Password</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the durable nonce password that was used when creating the multi-sig account?
          </p>
          <input v-model="noncePassword" type="text" rows="5"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />
        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary" :disabled="!isValid()" @click="onConfirm()">Build Transaction</Button>
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