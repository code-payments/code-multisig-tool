<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getAssociatedNonceKeypair, getInspectorLinkWithoutSigs, shortenSignature, getWallet } from '@/types';
import { Button, Layout } from '@/components';

export async function signCreateAssociatedNonceAccountTx(
  multisig: web3.PublicKey,
  noncePassword: string,
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const nonceKeypair = getAssociatedNonceKeypair(multisig, noncePassword);
  const nonceSpace = web3.NONCE_ACCOUNT_LENGTH;
  const nonceLamports = await connection().getMinimumBalanceForRentExemption(nonceSpace);

  const ix = [
    web3.SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: nonceKeypair.publicKey,
      space: web3.NONCE_ACCOUNT_LENGTH,
      lamports: nonceLamports,
      programId: web3.SystemProgram.programId,
    }),
    web3.SystemProgram.nonceInitialize({
      noncePubkey: nonceKeypair.publicKey,
      authorizedPubkey: nonceKeypair.publicKey, // would be nice to use multisigKeypair here but that isn't supported
    }),
  ];

  const bh = await connection().getRecentBlockhash();
  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;
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
      multiSig: "",
      noncePassword: "",
      sigs: [] as string[],
    }
  },
  mounted() {
    this.sigs = [];
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
        const multiSig = new web3.PublicKey(this.multiSig);
        const signed = await signCreateAssociatedNonceAccountTx(
          multiSig,
          this.noncePassword,
        );

        //console.log(getInspectorLink(signed));

        const { connection } = getProvider();

        const rawTransaction = signed.serialize();
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

      // Check the validity of the multisig
      if (this.multiSig.length < 2) {
        return false;
      }

      // Check the validity of the nonce password
      if (this.noncePassword.length < 2) {
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
          Your transaction to create a new multi-sig account has been submitted to the blockchain. Please check on it.
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
          Create A New Multi-Sig Associated Nonce Account
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you create an associated durable nonce account.
            Use this for pre-existing multi-sig accounts or accounts that don't
            have an associated nonce account with this tool.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Multi-Sig (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            This will be the public key of the multi-sig account. 
          </p>
          <input v-model="multiSig" type="text" 
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Nonce Password</h3>
          <p class="mt-3 text-sm text-slate-400">
            This tool automatically creates a durable nonce account for you. The
            nonce keypair is derived from the public key of the multi-sig
            account and a password (It's not the end of the world if you lose
            this, you can always create another).
          </p>
          <input v-model="noncePassword" type="text" rows="5"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

        </div>

        <div class="mt-5 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary" :disabled="!isValid()" @click="onConfirm()">Submit
            Transaction</Button>
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