<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getAssociatedNonceKeypair, getInspectorLinkWithoutSigs, shortenSignature, getWallet } from '@/types';
import { Button, Layout } from '@/components';

export async function buildTransferTokensTransaction(
  opts: {
    source: web3.PublicKey,
    destination: web3.PublicKey,
    amount: number,
  },
): Promise<web3.Transaction> {
  const { connection, } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const sourceInfo = await token.getAccount(connection(), opts.source);
  if (!sourceInfo) {
    throw new Error('Token account not found');
  }

  const mintInfo = await token.getMint(connection(), sourceInfo.mint);
  if (!mintInfo) {
    throw new Error('Token not found');
  }

  const ix = [
    token.createTransferCheckedInstruction(
      opts.source,
      sourceInfo.mint,
      opts.destination,
      sourceInfo.owner,
      opts.amount * Math.pow(10, mintInfo.decimals),
      mintInfo.decimals,
    ),
  ];

  const bh = await connection().getRecentBlockhash();
  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;

  return await signTransaction(tx);
}

export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      signers: "",
      amount: 0,
      source: "",
      destination: "",
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

      const source = new web3.PublicKey(this.source);
      const destination = new web3.PublicKey(this.destination);

      const signed = await buildTransferTokensTransaction({
        amount: this.amount,
        source,
        destination,
      });

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
      if (!this.source) {
        console.log("no source");
        return false;
      }

      if (!this.destination) {
        console.log("no destination");
        return false;
      }

      return true;
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
          Here is your transaction body. Please forward it to the mykinwallet signer for them to sign.
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
          Build A MyKinWallet Transfer Tokens Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you build a legacy transaction to transfer
            tokens from a NON-multi-sig token account to a destination, you'll
            need to get a signature from the MyKinWallet account holder
            <u>within 1 minute</u>.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Source Token Account (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Which token address should the funds be sent from?
          </p>
          <input v-model="source" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Destination Token Account (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Where should the tokens be sent to? (Note: this account should already exist!)
          </p>
          <input v-model="destination" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Amount</h3>
          <p class="mt-3 text-sm text-slate-400">
            How many tokens should be transfered?
          </p>
          <input v-model="amount" type="number"
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