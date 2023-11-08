<script lang="ts">
import { Button } from '@/components';
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle, } from '@headlessui/vue'

export default {
  components: {
    Button,
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
  },

  props: {
    modelValue: Boolean
  },

  emits: ['update:modelValue'],

  methods: {
    closeModal() {
      this.$emit('update:modelValue', false);
    },
    confirm() {
      this.closeModal();
    },
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
                    <p class="text-md text-lg text-gray-500 text-center">
                      The multi-sig tool will require you to connect a wallet to
                      sign transactions. This will either be a wallet with a SOL
                      balance to fund creating a multi-sig account, or a wallet
                      that is one of the signers for an existing multi-sig
                      account.
                    </p>
                </div>

                <div class="mt-10 flex gap-4 justify-center ">
                    <Button @click="confirm" variant="secondary">I Understand</Button>
                </div>
                </DialogPanel>
            </TransitionChild>
            </div>
        </div>
        </Dialog>
    </TransitionRoot>
</template>