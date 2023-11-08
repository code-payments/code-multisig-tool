<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue';
import { SectionHeader, DialogWalletIssue } from '@/components';
import blurCyanUrl from '../../assets/blur-cyan.png';
import blurIndigoUrl from '../../assets/blur-indigo.png';

const showModal = ref(false);
const errorMessage = ref('');
const $bus = getCurrentInstance()?.appContext.config.globalProperties.$bus!;

$bus.on('open:error', (err: any) => {
  errorMessage.value = err.message
  showModal.value = true;
});
</script>

<template>

  <div class="bg-slate-900">
    <!-- Glow effects -->
    <div class="pointer-events-none">
      <!-- Top Left -->
      <img class="absolute bottom-full right-full -mr-72 -mb-[400px] opacity-50" :src="blurCyanUrl" width="530" height="530" />
      <!-- Bottom Right -->
      <div class="fixed w-full h-full bottom-0 right-0 overflow-hidden opacity-80">
        <img class="absolute -bottom-72 -right-64" :src="blurCyanUrl" alt="" width="530" height="530" />
        <img class="absolute -bottom-40 -right-44" :src="blurIndigoUrl" alt="" width="567" height="567" />
      </div>
    </div>

    <!-- Header & Content -->
    <div class="relative">
      <SectionHeader/>

      <div class="mt-[-6rem] pt-[4.5rem] lg:mt-[-6rem] lg:pt-[4.75rem] px-5">
        <slot></slot>
      </div>
    </div>

    <DialogWalletIssue v-model="showModal" :error-message="errorMessage" /> 
  </div>

</template>