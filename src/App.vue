<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CyberCanvas from './components/CyberCanvas.vue'
import ControlPanel from './components/ControlPanel.vue'
import type { AIConfig } from './composables/useAIConfig'

const currentConfig = ref<AIConfig | undefined>(undefined)
const blindMode = ref(false)
const keypressRate = ref(0)

const canvasRef = ref<InstanceType<typeof CyberCanvas> | null>(null)

let keypressTimestamps: number[] = []
let rateInterval: number | null = null

function handleConfigChange(config: AIConfig) {
  currentConfig.value = config
}

function toggleBlindMode() {
  blindMode.value = !blindMode.value

  if (blindMode.value) {
    startKeypressTracking()
  } else {
    stopKeypressTracking()
  }
}

function startKeypressTracking() {
  keypressTimestamps = []

  rateInterval = window.setInterval(() => {
    const now = Date.now()
    keypressTimestamps = keypressTimestamps.filter(t => now - t < 2000)
    keypressRate.value = keypressTimestamps.length

    if (keypressTimestamps.length === 0 && blindMode.value) {
    }
  }, 100)
}

function stopKeypressTracking() {
  if (rateInterval) {
    clearInterval(rateInterval)
    rateInterval = null
  }
  keypressRate.value = 0
  keypressTimestamps = []
}

let lastMouseX = window.innerWidth / 2
let lastMouseY = window.innerHeight / 2

function handleGlobalKeydown(e: KeyboardEvent) {
  if (!blindMode.value) return

  if (e.key === 'Tab') return

  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  keypressTimestamps.push(Date.now())

  const count = Math.min(8, Math.ceil(keypressRate.value / 2) + 1)
  const x = lastMouseX + (Math.random() - 0.5) * 200
  const y = lastMouseY + (Math.random() - 0.5) * 100

  canvasRef.value?.spawnMatrixChars(x, y, count)
}

function handleGlobalMousemove(e: MouseEvent) {
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('mousemove', handleGlobalMousemove)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('mousemove', handleGlobalMousemove)
  stopKeypressTracking()
})
</script>

<template>
  <CyberCanvas
    ref="canvasRef"
    :config="currentConfig"
    :blind-mode="blindMode"
    :keypress-rate="keypressRate"
  />
  <ControlPanel
    @config-change="handleConfigChange"
    @toggle-blind-mode="toggleBlindMode"
  />

  <div v-if="blindMode" class="blind-mode-overlay">
    <div class="rate-display">
      <span class="rate-label">KEYS/s</span>
      <span class="rate-value">{{ keypressRate }}</span>
    </div>
    <div class="blind-hint">疯狂敲击键盘吧！按 Tab 退出</div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #05050a;
  overflow: hidden;
}
</style>

<style scoped>
.blind-mode-overlay {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.rate-display {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 65, 0.4);
  border-radius: 8px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Courier New', monospace;
}

.rate-label {
  font-size: 10px;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.rate-value {
  font-size: 24px;
  font-weight: bold;
  color: #00ff41;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
}

.blind-hint {
  font-size: 11px;
  color: #4b5563;
  font-family: 'Courier New', monospace;
}
</style>