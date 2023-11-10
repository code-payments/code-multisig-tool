<script lang="ts">
import { Button } from '@/components';
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle, } from '@headlessui/vue'
import { nextTick } from 'process';
import { WalletMultiButton } from 'solana-wallets-vue';

export default {
  components: {
    Button,
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
    WalletMultiButton
},

  props: {
    modelValue: Boolean,
    errorMessage: String
  },

  emits: ['update:modelValue'],

  methods: {
    closeModal() {
      this.$emit('update:modelValue', false);
    },
    confirm() {
      this.closeModal();
    },
    settings() {
        this.closeModal();
        nextTick(() => {
            this.$bus.emit('open:settings');
        });
    },
    isConnectionError(message: any) {
      return message.toString().includes("not connected");
    }
  }
}
</script>

<template>
    <TransitionRoot appear :show="modelValue" as="template">
        <Dialog as="div" @close="closeModal" class="relative z-10">
        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
            leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
            <div class="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                leave-to="opacity-0 scale-95">
                <DialogPanel
                class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div class="mt-8">
                    <p class="text-xl text-gray-800 text-center">
                      Unable to complete the action
                    </p>
                    <p class="mt-5 text-md text-gray-500 text-center">
                      Are you sure you have a wallet connected? Please check the message below for more details.
                    </p>
                    <p class="mt-10 rounded-md text-xs p-4 ring ring-gray-100 text-gray-800">Error: {{ errorMessage }}</p>
                </div>

                
                <div v-if="isConnectionError(errorMessage)" class="flex justify-center mt-10">
                  <WalletMultiButton />
                </div>

                <div class="mt-10 flex justify-end">
                    <Button @click="confirm()" variant="secondary">Continue</Button>
                </div>
                </DialogPanel>
            </TransitionChild>
            </div>
        </div>
        </Dialog>
    </TransitionRoot>
</template>