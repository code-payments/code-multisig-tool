<script lang="ts">
import * as web3 from "@solana/web3.js";

import { getProvider, getInspectorLinkWithoutSigs, shortenSignature } from '@/types';
import { Button, Layout, } from '@/components';

/*
Submit Multi-sig Transaction:

    * sign transaction
        * transaction: transaction hex

    buttons: sign transaction, cancel
*/


export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      transaction: "",
      sigs: [] as string[],
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
      return this.sigs.length > 0;
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
        const signed = web3.Transaction.from(Buffer.from(this.transaction, 'base64'));

        const { connection } = getProvider();
        const rawTransaction = signed.serialize({ requireAllSignatures: false });
        const sig = await connection().sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          preflightCommitment: 'confirmed',
        });

        console.log('Transaction sent', sig);

        this.sigs.push(sig);

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
          Your transaction has been submitted to the blockchain. Please check on it.
        </p>

        <div v-if="sigs.length > 0" class="mt-5">
          <ul role="list" class="space-y-9">
            <li>
              <ul role="list" class="mt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800">
                <li class="relative" v-for="sig in sigs" :key="sig">
                  <a target="_blank" :href="`http://explorer.solana.com/tx/${sig}`" class="block w-full pl-3.5 before:pointer-events-none
                      before:absolute before:-left-1 before:top-1/2 before:h-1.5
                      before:w-1.5 before:-translate-y-1/2 before:rounded-full
                      text-slate-500 before:hidden before:bg-slate-300
                      hover:text-slate-600 hover:before:block dark:text-slate-400
                      dark:before:bg-slate-700 dark:hover:text-slate-300">{{ shorten(sig) }}</a>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
        </div>
      </div>
    </div>

    <div v-else class="py-20">

      <div class="mx-auto max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Submit a Signed Multi-Sig Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you submit a multi-sig transaction to the blockchain.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Transaction (base64)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Please paste the base64 encoded transaction below.
          </p>
          <textarea v-model="transaction" class="w-full h-64 mt-5 p-3 text-sm text-slate-400 bg-slate-800 rounded-lg"></textarea>

        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="secondary" v-if="transaction" :href="getInspectorLink(transaction)" target="_blank">Inspect Transaction</Button>
          <Button variant="primary" :disabled="!isValid()" @click="onConfirm()">Submit Transaction</Button>
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