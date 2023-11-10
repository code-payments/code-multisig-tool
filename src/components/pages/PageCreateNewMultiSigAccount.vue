<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getAssociatedNonceKeypair, getInspectorLinkWithoutSigs, shortenSignature, getWallet } from '@/types';
import { Button, Layout } from '@/components';

const DefaultRequiredSignatures = 3;
const DefaultMultiSigKeypair = Buffer.from(web3.Keypair.generate().secretKey).toString('hex');

export async function signCreateMultiSigAccountTx(
  reqSigners: number,
  validSigners: web3.PublicKey[],
  multisigKeypair: web3.Keypair = web3.Keypair.generate(),
  noncePassword: string,
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const nonceKeypair = getAssociatedNonceKeypair(multisigKeypair.publicKey, noncePassword);
  const nonceSpace = web3.NONCE_ACCOUNT_LENGTH;
  const multiSigSpace = token.MULTISIG_SIZE;

  const nonceLamports = await connection().getMinimumBalanceForRentExemption(nonceSpace);
  const multiSigLamports = await connection().getMinimumBalanceForRentExemption(multiSigSpace);

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
    web3.SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: multisigKeypair.publicKey,
      space: multiSigSpace,
      lamports: multiSigLamports,
      programId: token.TOKEN_PROGRAM_ID,
    }),
    token.createInitializeMultisigInstruction(
      multisigKeypair.publicKey,
      validSigners,
      reqSigners,
      token.TOKEN_PROGRAM_ID
    ),
  ];

  const bh = await connection().getRecentBlockhash();
  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;
  tx.partialSign(multisigKeypair, nonceKeypair);

  return await signTransaction(tx);
}

export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      requiredSignatures: DefaultRequiredSignatures,
      multiSigKeypair: DefaultMultiSigKeypair,
      validSigners: "",
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
        const validSigners = this.getValidSigners(this.validSigners);
        const multiSigKeypair = this.getKeypairFromHex(this.multiSigKeypair);

        const signed = await signCreateMultiSigAccountTx(
          this.requiredSignatures,
          validSigners,
          multiSigKeypair,
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
      const validSigners = this.parseValidSigners(this.validSigners);

      // Check the length of valid signers
      if (validSigners.length < this.requiredSignatures) {
        return false;
      }

      // Check the validity of each signer as a public key
      for (const signer of validSigners) {
        try {
          new web3.PublicKey(signer);
        } catch (err) {
          return false;
        }
      }

      // Check the validity of the multi-sig keypair
      try {
        this.getKeypairFromHex(this.multiSigKeypair);
      } catch (err) {
        return false;
      }

      // Check the validity of the nonce password
      if (this.noncePassword.length < 2) {
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
          Your transaction to create a new multi-sig account has been submitted to the blockchain. Please check on it.
        </p>

        <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
          Multi-sig: <a target="_blank" :href="`http://explorer.solana.com/address/${getPublicKeyFromHexKeypair(multiSigKeypair)}`" class="underline">{{ getPublicKeyFromHexKeypair(multiSigKeypair) }}</a>
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
          Create A New Multi-Sig Account
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you create a new multi-sig account with an
            associated durable nonce account. The multi-sig account can then be
            used to do other things.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Required Signatures</h3>
          <p class="mt-3 text-sm text-slate-400">
            The number of signatures required to execute a transaction on this multi-sig account.
          </p>
          <input v-model="requiredSignatures" type="number"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Valid Signers List</h3>
          <p class="mt-3 text-sm text-slate-400">
            List out the public keys that are valid signers for this multi-sig account. Use commas between base58
            encoded public keys.
          </p>
          <textarea v-model="validSigners" type="text" rows="5"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none font-mono" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Multi-Sig Keypair (Hex)</h3>
          <p class="mt-3 text-sm text-slate-400">
            This will be the public key of the multi-sig account. You can use the pre-generated one below or use a
            vanity keypair by grinding for it.
          </p>
          <input v-model="multiSigKeypair" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full lg:w-1/4 bg-transparent outline-none" />
          <p class="mt-3 text-sm text-slate-400">
            <span class="font-bold">Multi-Sig PublicKey:</span> {{ getPublicKeyFromHexKeypair(multiSigKeypair) }}
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Nonce Password</h3>
          <p class="mt-3 text-sm text-slate-400">
            This tool automatically creates a durable nonce account for you. The
            nonce keypair is derived from the public key of the multi-sig
            account and a password.
          </p>
          <input v-model="noncePassword" type="text" rows="5"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full lg:w-1/4 bg-transparent outline-none" />
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