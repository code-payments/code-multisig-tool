<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

import { getProvider, getWallet, shortenSignature } from '@/types';
import { Button, Layout } from '@/components';

/*
Build New Mint Transaction:
    * create a mint
        * decimals: number | 5
        * keypair: secret key
        * mint authority: multi-sig account
    * create metadata
        * token name: string
        * token symbol: string
        * metadata uri: string | undefined (optional)
    * create an ata

    >> base58 encoded tx

    buttons: create transaction, cancel
*/

const DefaultDecimals = 5;
const DefaultMintKeypair = Buffer.from(web3.Keypair.generate().secretKey).toString('hex');

export async function signNewMintTx(
  mintConfig: {
    decimals: number,
  },
  multisig: web3.PublicKey,
  mintKeypair: web3.Keypair = web3.Keypair.generate(),
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const mintLamports = await token.getMinimumBalanceForRentExemptMint(connection());
  const tokenATA = await token.getAssociatedTokenAddress(mintKeypair.publicKey, multisig);

  const ix = [
    web3.SystemProgram.createAccount({
      fromPubkey: feePayer,
      newAccountPubkey: mintKeypair.publicKey,
      space: token.MINT_SIZE,
      lamports: mintLamports,
      programId: token.TOKEN_PROGRAM_ID,
    }),
    token.createInitializeMintInstruction(
      mintKeypair.publicKey,
      mintConfig.decimals,
      multisig,
      multisig,
      token.TOKEN_PROGRAM_ID),
    token.createAssociatedTokenAccountInstruction(
      feePayer,
      tokenATA,
      multisig,
      mintKeypair.publicKey,
    ),
  ];

  const bh = await connection().getRecentBlockhash();
  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;
  tx.partialSign(mintKeypair);

  return await signTransaction(tx);
}


export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      mintKeypair: DefaultMintKeypair,
      mintAuthority: "",
      decimals: DefaultDecimals,
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
        const mintKeypair = this.getKeypairFromHex(this.mintKeypair);
        const mintAuthority = new web3.PublicKey(this.mintAuthority);

        const signed = await signNewMintTx(
          {
            decimals: this.decimals,
          },
          mintAuthority,
          mintKeypair,
        );

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

      if (!this.mintKeypair) {
        console.log("no mint keypair");
        return false;
      }

      if (!this.mintAuthority) {
        console.log("no mint authority");
        return false;
      }

      if (this.decimals < 0 || this.decimals > 9) {
        console.log("invalid decimals");
        return false;
      }

      // Check the validity of the multi-sig keypair
      try {
        this.getKeypairFromHex(this.mintKeypair);
      } catch (err) {
        console.log("invalid mint keypair");
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
          Create New Mint
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you create a new mint owned by a multi-sig
            account. If you have not created the multi-sig account, please do so
            first.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Decimals (0 to 9)</h3>
          <p class="mt-3 text-sm text-slate-400">
            How many decimals does the token have?
          </p>
          <input v-model="decimals" type="number"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Address (Hex)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Please provide a keypair for the mint. This keypair determins the
            public key address of the mint. You can use the generated keypair
            but it is recommended that this value is generated throught the
            solana-keygen program.
          </p>
          <textarea v-model="mintKeypair" rows="3"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />
          <p class="mt-3 text-sm text-slate-400">
            <span class="font-bold">Mint PublicKey:</span> {{ getPublicKeyFromHexKeypair(mintKeypair) }}
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Authority (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the public key of the multi-sig account that will be the mint authority?
          </p>
          <input v-model="mintAuthority" type="text"
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