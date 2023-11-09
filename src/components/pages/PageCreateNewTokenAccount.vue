
<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getWallet, shortenSignature } from '@/types';
import { Button, Layout } from '@/components';

/*
Build New Associated Token Account Transaction:
    * create a token account
        * mint: account
        * owner: multi-sig account
    >> base58 encoded tx

    buttons: create transaction, cancel
*/

export async function signNewAtaTx(
  mint: web3.PublicKey,
  multisig: web3.PublicKey,
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const tokenATA = await token.getAssociatedTokenAddress(mint, multisig);

  const ix = [
    token.createAssociatedTokenAccountInstruction(
      feePayer,
      tokenATA,
      multisig,
      mint,
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
      mint: "",
      multisig: "",
      sigs: [] as string[],
    }
  },
  mounted() {
    this.sigs = []
  },
  methods: {
    shorten(sig: string): string {
      return shortenSignature(sig);
    },

    hasSubmitted() {
      return this.sigs.length > 0;
    },

    async onConfirm() {
      if (!this.isValid()) {
        return;
      }

      try {
        const mint = new web3.PublicKey(this.mint);
        const multisig = new web3.PublicKey(this.multisig);

        const signed = await signNewAtaTx(
            mint,
            multisig,
        );

        const { connection } = getProvider();
        const rawTransaction = signed.serialize({ requireAllSignatures: false });
        console.log('Sending transaction', rawTransaction);
        const sig = await connection().sendRawTransaction(rawTransaction, {
          skipPreflight: false,
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

      if (!this.mint) {
        console.log("no mint pubkey");
        return false;
      }

      if (!this.multisig) {
        console.log("no multisig pubkey");
        return false;
      }

      return true;
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
          Your transaction to create a new mint account has been submitted to the blockchain. Please check on it.
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

    <div v-else class="grid place-items-center py-20">

      <div class="max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Create New Associated Token Account
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you create a new associated token account owned
            by a multi-sig. This account will be used to hold tokens of a
            specific mint. The fee-payer will be the connected wallet.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Token Mint (Base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the mint address of the token you want to create an associated token account for?
          </p>
          <input v-model="mint" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Owner (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the public key of the multi-sig account that will own this associated token account?
          </p>
          <input v-model="multisig" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />
        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
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