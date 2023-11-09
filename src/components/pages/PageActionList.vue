<script lang="ts">
import { Button, Layout } from '@/components';

export default {
  components: {
    Button,
    Layout,
  },
  setup() {
    return {
    }
  },
  methods: {
    goToCreateNewMultiSigAccount() {
      this.$bus.emit('goto:createnewmultisigaccount');
    },
    goToCreateNewTokenAccount() {
      this.$bus.emit('goto:createnewtokenaccount');
    },
    goToCreateNewMintAccount() {
      this.$bus.emit('goto:createnewmintaccount');
    },
    goToCreateNewNonceAccount() {
      this.$bus.emit('goto:createnewnonceaccount');
    },
    goToBuildCreateTokensTransaction() {
      this.$bus.emit('goto:buildcreatetokenstransaction');
    },
    goToBuildTransferTransaction() {
      this.$bus.emit('goto:buildtransfertransaction');
    },
    goToBuildCreateMintMetadataTransaction() {
      this.$bus.emit('goto:buildcreatemintmetadatatransaction');
    },
    goToBuildUpdateMintMetadataTransaction() {
      this.$bus.emit('goto:buildupdatemintmetadatatransaction');
    },
    goToBuildSetAuthorityTransaction() {
      this.$bus.emit('goto:buildsetauthoritytransaction');
    },
    goToReviewMultiSigTransaction() {
      this.$bus.emit('goto:reviewmultisigtransaction');
    },
    goToSignMultiSigTransaction() {
      this.$bus.emit('goto:signmultisigtransaction');
    },
    goToSubmitMultiSigTransaction() {
      this.$bus.emit('goto:submitmultisigtransaction');
    },
  },
}
</script>

<template>
  <Layout :header="true">
    <div class="mt-20 delay">
      <div class="mx-auto max-w-5xl">

        <p class="font-display text-4xl tracking-tight text-white">
          What would you like to do?
        </p>
        <p class="font-display text-xl text-slate-400">
          Choose from one of the actions below.
        </p>

        <div class="mx-auto mt-20 pb-20 lg:pb-0">
          <dl class="text-left space-y-20 pb-20 lg:space-y-0 lg:pb-0 lg:grid lg:gap-y-16 lg:gap-x-8 lg:grid-cols-3">
            <div class="lg:mx-auto flex max-w-xs flex-col gap-y-4">
              <dt class="text-base leading-7 text-slate-400"><span class="text-4xl mr-5">1.</span>Account Setup</dt>
              <ul class="mt-2">
                <li class="py-2"><Button variant="secondary" @click="goToCreateNewMultiSigAccount()">Create a new multi-sig account</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToCreateNewTokenAccount()">Create a new token account</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToCreateNewMintAccount()">Create a new mint account</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToCreateNewNonceAccount()">Create a new nonce account</Button></li>
              </ul>
            </div>

            <div class="lg:mx-auto flex max-w-xs flex-col lg:gap-y-4 lg:border-l lg:border-white/10 lg:pl-6">
              <dt class="text-base leading-7 text-slate-400"><span class="text-4xl mr-5">2.</span>Multi-sig Action</dt>
              <ul class="mt-2">
                <li class="py-2"><Button variant="secondary" @click="goToBuildTransferTransaction()">Assemble a <span class="uppercase text-xs">transfer</span> transaction</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToBuildCreateTokensTransaction()">Assemble a <span class="uppercase text-xs">mint_to</span> transaction</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToBuildSetAuthorityTransaction()">Assemble a <span class="uppercase text-xs">set_authority</span> transaction</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToBuildCreateMintMetadataTransaction()">Assemble a <span class="uppercase text-xs">create_metadata</span> transaction</Button></li>
              </ul>
            </div>

            <div class="lg:mx-auto flex max-w-xs flex-col lg:gap-y-4 lg:border-l lg:border-white/10 lg:pl-6">
              <dt class="text-base leading-7 text-slate-400"><span class="text-4xl mr-5">3.</span>Sign or Submit</dt>
              <ul class="mt-2">
                <li class="py-2"><Button variant="secondary" @click="goToReviewMultiSigTransaction()">Review a transaction</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToSignMultiSigTransaction()">Sign a transaction</Button></li>
                <li class="py-2"><Button variant="secondary" @click="goToSubmitMultiSigTransaction()">Submit a transaction</Button></li>
              </ul>
          </div>
        </dl>
      </div>


    </div>
  </div>
</Layout>
</template>

<style scoped>
.delay {
  animation: appear 500ms ease-in forwards;
  opacity: 0;
}

@keyframes appear {
  90% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
