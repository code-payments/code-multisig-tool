<script lang="ts">
import { Button, Layout } from '@/components';
import { useWallet, WalletMultiButton } from 'solana-wallets-vue';

export default {
  components: {
    Button,
    Layout,
    WalletMultiButton
  },
  setup() {
    const wallet = useWallet();
    return {
      wallet
    }
  },
  methods: {
    isConnected() {
      return this.wallet.connected.value;
    },

    onSkip() {
      this.$bus.emit('goto:actionlist');
    },

    onConfirm() {
      this.$bus.emit('goto:actionlist');
    },

    onBack() {
      this.$bus.emit('goto:home');
    }

  },
}
</script>

<template>
  <Layout :header="true">
    <div class="grid h-screen place-items-center mt-0 sm:mt-[-5rem]">
      <div class="max-w-5xl">

        <p class="font-display text-4xl tracking-tight text-white">
          Connect Wallet
        </p>

        <p class="mt-3 mb-2 text-sm sm:text-2xl tracking-tight text-slate-400">
          Please select the wallet that you will use to either create a new multi-sig or mint account, or sign multi-sig transactions with.
        </p>

        <div class="mt-10 mb-2 justify-start flex">
          <WalletMultiButton />
        </div>

        <div class="mt-10 flex gap-4 justify-end">
          <Button variant="secondary" @click="onBack()">Go Back</Button>
          <Button variant="primary"  @click="onSkip()" v-if="!isConnected()">Connect Later</Button>
          <Button variant="primary"  @click="onConfirm()" v-else>Confirm Wallet</Button>
        </div>
      </div>
    </div>
  </Layout>
</template>
