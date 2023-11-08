<script lang="ts">
export default {
    props: {
        modelValue: Boolean
    },

    emits: ['update:modelValue'],

    methods: {
        toggle() {
            this.$emit('update:modelValue', !this.modelValue);
        },
    }
}
</script>

<template>
    <div class="flex items-center ">
        <button type="button" @click="toggle" :class="{ 'bg-indigo-600': modelValue, 'bg-gray-200': !modelValue }"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            role="switch" aria-checked="false" aria-labelledby="annual-billing-label">
            <span aria-hidden="true" :class="{ 'translate-x-5': modelValue, 'translate-x-0': !modelValue }"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
        </button>
        <span class="ml-3" id="annual-billing-label">
            <span class="text-md text-slate-400" v-if="modelValue">Enabled</span>
        </span>
    </div>
</template>