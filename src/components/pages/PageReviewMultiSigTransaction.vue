<script lang="ts">
import * as web3 from "@solana/web3.js";

import { getReviewerLink, getInspectorLinkWithoutSigs, shortenSignature } from '@/types';
import { Button, Layout, SectionParsedTransaction } from '@/components';

import { inject } from "vue";


export default {
  components: {
    Button,
    Layout,
    SectionParsedTransaction,
  },
  setup() {
    const providedTx = inject('tx', '');
    return { providedTx };
  },
  data() {
    return {
      transaction: "",
    }
  },
  mounted() {
    this.transaction = this.providedTx;
  },
  methods: {
    shorten(sig: string): string {
      return shortenSignature(sig);
    },

    isFullySigned(val: string) {
      return web3.Transaction.from(Buffer.from(val, 'base64')).verifySignatures(true);
    },

    getShareLink(val: string) {
      return getReviewerLink(val);
    },

    getInspectorLink(val: string) {
      const tx = web3.Transaction.from(Buffer.from(val, 'base64'));
      return getInspectorLinkWithoutSigs(tx);
    },

    onBack() {
      this.$bus.emit('goto:actionlist');
    },

    onSign() {
      this.$bus.emit('goto:signmultisigtransaction', this.transaction);
    },

    onSubmit() {
      this.$bus.emit('goto:submitmultisigtransaction', this.transaction);
    },
  },
}
</script>

<template>
  <Layout :header="true">

    <div class="py-20">
      <div class="mx-auto max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Review a Multi-Sig Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page can be used to parse the details of a multi-sig transaction.
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
          <Button variant="secondary" v-if="transaction" :href="getShareLink(transaction)" target="_blank">Share Link</Button>
          <Button variant="secondary" v-if="transaction" :href="getInspectorLink(transaction)" target="_blank">View Explorer</Button>

          <Button variant="primary" v-if="transaction && !isFullySigned(transaction)" @click="onSign()" target="_blank">Sign</Button>
          <Button variant="primary" v-if="transaction && isFullySigned(transaction)" @click="onSubmit()" target="_blank">Submit</Button>
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