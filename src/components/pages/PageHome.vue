<script setup lang="ts">
import { ref } from 'vue'
import { Button, Layout, DialogWalletRequired } from '@/components';

const showModal = ref(false);
function openModal() {
  showModal.value = true;
}
</script>

<template>
  <div>
    <Layout>
      <div class="grid h-screen place-items-center text-center mt-0 sm:mt-[-5rem]">
        <div class="max-w-2xl">
          <p class="mt-10 text-xl sm:text-2xl tracking-tight text-slate-400">
            The multi-sig tool enables users to create a new multi-sig account,
            build different types of transactions such as mint, transfer, and
            update metadata, sign these transactions, and finally submit them.
            <br/><br/>
            This tool helps ensure security and accountability in transactions
            by requiring multiple signatures before they can be executed.
          </p>

          <div class="mt-8 flex gap-4 justify-center ">
            <Button href="http://github.com" variant="secondary">View on GitHub</Button>
            <Button @click="openModal()">Get started</Button>
          </div>

        </div>
      </div>
    </Layout>

    <DialogWalletRequired v-model="showModal" @update:model-value="$bus.emit('goto:feepage')" /> 
  </div>
</template>
