<script setup lang="ts">
import Logo from '~/components/Logo.vue'
import { openExtensionOptionsPage } from '~/utils/extensionPage'

function openOptionsPage() {
  void openExtensionOptionsPage(browser)
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo :size="60" />
    <div>Popup</div>
    <p class="mt-2 opacity-50">
      This is the popup page
    </p>
    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage</span>
    </div>
  </main>
</template>
