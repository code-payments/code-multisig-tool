<script lang="ts">
import { ref, defineComponent, provide } from 'vue';

import { 
  PageActionList,
  PageBuildCreateMetadataTransaction,
  PageBuildCreateTokensTransaction,
  PageBuildSetAuthorityTransaction,
  PageBuildTransferTokensTransaction,
  PageCreateNewMint,
  PageCreateNewMultiSigAccount,
  PageNewCreateTokenAccount,
  PageCreateNewNonceAccount,
  PageReviewMultiSigTransaction,
  PageSignMultiSigTransaction,
  PageSubmitMultiSigTransaction,
} from '../src/components';

enum AppState {
  ActionList,

  CreateNewMultiSigAccount,
  CreateNewTokenAccount,
  CreateNewMintAccount,
  CreateNewNonceAccount,

  BuildCreateMintMetadataTransaction,
  BuildUpdateMintMetadataTransaction,
  BuildCreateTokensTransaction,
  BuildTransferTransaction,
  BuildSetAuthorityTransaction,

  ReviewMultiSigTransaction,
  SignMultiSigTransaction,
  SubmitMultiSigTransaction,
}

const appState = ref(AppState.ActionList);
const tx = ref('');


export default defineComponent({

  setup() {
    provide('tx', tx);

    return {
    };
  },

  mounted() {
    // TODO: maybe use a router instead?

    // Keeping it simple for now, until we
    // have more pages or more complex routing.
    const goto = (page: AppState) => {
      window.scrollTo(0, 0);
      history.pushState({}, '');
      appState.value = page;
    }

    // Handle the back button
    window.addEventListener('popstate', (event) => {
      switch (appState.value) {
        default:
          appState.value = AppState.ActionList;
          break;
      }
    });

    this.$bus.on('goto:actionlist', () => {
      window.location.hash = '';
      goto(AppState.ActionList);
    });

    this.$bus.on('goto:createnewmultisigaccount', () => {
      goto(AppState.CreateNewMultiSigAccount);
    });

    this.$bus.on('goto:createnewtokenaccount', () => {
      goto(AppState.CreateNewTokenAccount);
    });

    this.$bus.on('goto:createnewmintaccount', () => {
      goto(AppState.CreateNewMintAccount);
    });

    this.$bus.on('goto:createnewnonceaccount', () => {
      goto(AppState.CreateNewNonceAccount);
    });

    this.$bus.on('goto:buildtransfertransaction', () => {
      goto(AppState.BuildTransferTransaction);
    });

    this.$bus.on('goto:buildcreatetokenstransaction', () => {
      goto(AppState.BuildCreateTokensTransaction);
    });

    this.$bus.on('goto:buildcreatemintmetadatatransaction', () => {
      goto(AppState.BuildCreateMintMetadataTransaction);
    });

    this.$bus.on('goto:buildupdatemintmetadatatransaction', () => {
      goto(AppState.BuildUpdateMintMetadataTransaction);
    });

    this.$bus.on('goto:buildsetauthoritytransaction', () => {
      goto(AppState.BuildSetAuthorityTransaction);
    });

    this.$bus.on('goto:reviewmultisigtransaction', (val: string) => {
      tx.value = val;
      goto(AppState.ReviewMultiSigTransaction);
    });

    this.$bus.on('goto:signmultisigtransaction', (val: string) => {
      tx.value = val;
      goto(AppState.SignMultiSigTransaction);
    });

    this.$bus.on('goto:submitmultisigtransaction', (val: string) => {
      tx.value = val;
      goto(AppState.SubmitMultiSigTransaction);
    });

    // Pull the transaction out of the URL hash if it exists
    const hash = window.location.hash;
    if (hash) {
      console.log("hash: " + hash)
      //this.$bus.emit('goto:reviewmultisigtransaction', decodeURIComponent(hash.substring(1)));
      tx.value = decodeURIComponent(hash.substring(1));
      appState.value = AppState.ReviewMultiSigTransaction;
    }
  },

  methods: {
    activePage() {
      switch (appState.value) {
        case AppState.ActionList:
          return PageActionList;
        case AppState.CreateNewMultiSigAccount:
          return PageCreateNewMultiSigAccount;
        case AppState.CreateNewTokenAccount:
          return PageNewCreateTokenAccount;
        case AppState.CreateNewMintAccount:
          return PageCreateNewMint;
        case AppState.CreateNewNonceAccount:
          return PageCreateNewNonceAccount;
        case AppState.BuildCreateMintMetadataTransaction:
          return PageBuildCreateMetadataTransaction;
        case AppState.BuildCreateTokensTransaction:
          return PageBuildCreateTokensTransaction;
        case AppState.BuildTransferTransaction:
          return PageBuildTransferTokensTransaction;
        case AppState.BuildSetAuthorityTransaction:
          return PageBuildSetAuthorityTransaction;
        case AppState.ReviewMultiSigTransaction:
          return PageReviewMultiSigTransaction;
        case AppState.SignMultiSigTransaction:
          return PageSignMultiSigTransaction;
        case AppState.SubmitMultiSigTransaction:
          return PageSubmitMultiSigTransaction;
        default:
          return PageActionList;
      }
    }
  }
})
</script>

<template>
  <transition mode="out-in">
    <component :is="activePage()"/>
  </transition>
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

