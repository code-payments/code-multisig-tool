<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { findMetadataPda } from '@metaplex-foundation/js';

import { getProvider, getAssociatedNonceKeypair, shortenSignature, getWallet, getReviewerLink } from '@/types';
import { Button, Layout } from '@/components';

/*
Build New Mint Transaction:
    * advance nonce
    * create metadata
        * token name: string
        * token symbol: string
        * metadata uri: string | undefined (optional)

    >> base58 encoded tx

    buttons: create transaction, cancel
*/

export async function buildCreateMetadataTransaction(
  mintConfig: {
    address: web3.PublicKey,
    tokenName: string,
    symbol: string,
    metadata: string,
    updateAuthority: web3.PublicKey,
  },
  signers: web3.PublicKey[],
  noncePassword: string,
): Promise<web3.Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const metadataPDA = findMetadataPda(mintConfig.address);
  console.log('metadataPDA', metadataPDA.toBase58());

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

  // get the valid signers
  const validSigners = Array.from({ length: 11 }, (_, i) => (multisigInfo as any)[`signer${i + 1}`].toBase58());

  // check that the signers are valid
  for (const signer of signers) {
    if (!validSigners.includes(signer.toBase58())) {
      throw new Error('Invalid signer');
    }
  }

  const multisig = multisigInfo.address;
  const nonceKeypair = getAssociatedNonceKeypair(multisig, noncePassword);

  
  const nonceInfo = await connection().getNonce(nonceKeypair.publicKey);
  if (!nonceInfo) {
    throw new Error('Nonce not found');
  }

  const tokenMetadata = {
    name: mintConfig.tokenName,
    symbol: mintConfig.symbol,
    uri: mintConfig.metadata,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  } as DataV2;

  const temp = web3.Keypair.generate();

  const ix = [
    web3.SystemProgram.nonceAdvance({
      noncePubkey: nonceKeypair.publicKey,
      authorizedPubkey: nonceKeypair.publicKey,
    }),
    token.createSetAuthorityInstruction(
      mintConfig.address,
      multisig,
      token.AuthorityType.MintTokens,
      temp.publicKey,
      signers,
    ),
    createCreateMetadataAccountV2Instruction({
      metadata: metadataPDA,
      mint: mintConfig.address,
      mintAuthority: temp.publicKey,
      payer: feePayer,
      updateAuthority: mintConfig.updateAuthority,
    },
      {
        createMetadataAccountArgsV2:
        {
          data: tokenMetadata,
          isMutable: true
        }
      }
    ),
    token.createSetAuthorityInstruction(
      mintConfig.address,
      temp.publicKey,
      token.AuthorityType.MintTokens,
      multisig,
    ),
  ];

  const tx = new web3.Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = nonceInfo?.nonce;
  tx.partialSign(nonceKeypair, temp);

  return await signTransaction(tx);
}


export default {
  components: {
    Button,
    Layout,
  },
  data() {
    return {
      tokenName: "",
      tokenSymbol: "",
      mintAddress: "",
      metadataUri: "",
      updateAuthority: "",
      signers: "",
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

      try {
        const signers = this.getValidSigners(this.signers);
        const mintAddress = new web3.PublicKey(this.mintAddress);
        const updateAuthority = new web3.PublicKey(this.updateAuthority);
        const signed = await buildCreateMetadataTransaction({
          address: mintAddress,
          tokenName: this.tokenName,
          symbol: this.tokenSymbol,
          metadata: this.metadataUri,
          updateAuthority,
        },
        signers,
        this.noncePassword);

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

    isValid() {

      if (!this.tokenName) {
        console.log("no token name");
        return false;
      }

      if (!this.tokenSymbol) {
        console.log("no token symbol");
        return false;
      }

      if (this.metadataUri.length > 0 && !this.metadataUri.startsWith('http')) {
        console.log("invalid metadata uri");
        return false;
      }

      if (!this.noncePassword) {
        console.log("no nonce password");
        return false;
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
          <Button :href="inspect" target="_blank">Review Transaction</Button>
        </div>
      </div>
    </div>

    <div v-else class="grid place-items-center py-20">

      <div class="max-w-5xl">
        <p class="font-display text-3xl tracking-tight text-white">
          Build A Create Mint Metadata Transaction
        </p>

        <div>
          <p class="mt-3 mb-2 text-lg tracking-tight text-slate-400">
            This page will help you build a transaction to create a mint
            metadata account. Once the transaction is created, you'll need to
            get signatures from the multi-sig account holders.
          </p>

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Name</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the name of the token you are creating? This is usually a single word.
          </p>
          <input v-model="tokenName" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Symbol</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the symbol of the token you are creating? This is usually 3-4 characters.
          </p>
          <input v-model="tokenSymbol" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Metadata URI (Optional URI)</h3>
          <p class="mt-3 text-sm text-slate-400">
            What is the URI of the metadata for this token? If you do not know what this is yet, leave it
            blank. It can be changed later.
          </p>
          <input v-model="metadataUri" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Mint Address (base58)</h3>
          <input v-model="mintAddress" type="text"
            class="mt-3 p-2 text-md tracking-tight text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 w-full bg-transparent outline-none" />

          <h3 class="text-2xl font-medium leading-6 text-white mt-10">Update Authority (base58)</h3>
          <p class="mt-3 text-sm text-slate-400">
            Who should be able to modify the metadata? Unfortunately, this must be a standard account, not a multi-sig account.
          </p>  
          <input v-model="updateAuthority" type="text"
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