<script lang="ts">
import * as web3 from "@solana/web3.js";

import { getInspectorLinkWithoutSigs, shortenSignature, getWallet } from '@/types';
import { Button, Layout, SectionParsedTransaction } from '@/components';

export async function addSignatureToTransaction(
  transaction: string,
): Promise<web3.Transaction> {
  const { signTransaction } = getWallet();

  const tx = web3.Transaction.from(Buffer.from(transaction, 'base64'));
  console.log(tx);

  return await signTransaction(tx);
}


export default {
  components: {
    Button,
    Layout,
    SectionParsedTransaction
  },
  data() {
    return {
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
        const signed = await addSignatureToTransaction(this.transaction);

        this.transaction = signed.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64');

        this.inspect = getInspectorLinkWithoutSigs(signed);
      } catch (err) {
        console.log(err);
        this.$bus.emit('open:error', err);
      }
      
    },

    onBack() {
      this.$bus.emit('goto:actionlist');
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

    <div v-else class="py-20">

      <div class="mx-auto max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Sign a Multi-Sig Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you add your signature to a multi-sig transaction.
          </p>

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
          <Button variant="secondary" v-if="transaction" :href="getInspectorLink(transaction)" target="_blank">Inspect Transaction</Button>
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