<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAIConfig, type AIConfig } from '../composables/useAIConfig'

const emit = defineEmits<{
  configChange: [config: AIConfig]
  toggleBlindMode: []
}>()

const { generateConfig, isLoading, currentConfig } = useAIConfig()
const inputValue = ref('')
const blindMode = ref(false)

function handleSubmit() {
  if (!inputValue.value.trim() || isLoading.value) return

  generateConfig(inputValue.value).then(config => {
    emit('configChange', config)
  })
}

function selectPreset(preset: string) {
  inputValue.value = preset
  handleSubmit()
}

function toggleBlindModeHandler() {
  blindMode.value = !blindMode.value
  emit('toggleBlindMode')
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    toggleBlindModeHandler()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="control-panel" :class="{ 'blind-active': blindMode }">
    <div class="panel-header">
      <div class="title">
        <span class="icon">◈</span>
        AI 情绪调音
      </div>
      <div class="status" :class="{ active: !isLoading }">
        {{ isLoading ? '解析中...' : '就绪' }}
      </div>
    </div>

    <div class="panel-body">
      <div class="input-group">
        <input
          v-model="inputValue"
          type="text"
          placeholder="描述你的情绪场景..."
          @keyup.enter="handleSubmit"
          :disabled="isLoading"
        />
        <button @click="handleSubmit" :disabled="isLoading || !inputValue.trim()">
          <span v-if="isLoading" class="spinner">◐</span>
          <span v-else>→</span>
        </button>
      </div>

      <div class="presets">
        <div class="preset-label">快速预设</div>
        <div class="preset-buttons">
          <button @click="selectPreset('寂静的赛博朋克雨夜')">雨夜</button>
          <button @click="selectPreset('炽热的超新星爆发')">超新星</button>
          <button @click="selectPreset('深邃的虚空深渊')">虚空</button>
          <button @click="selectPreset('霓虹闪烁的都市夜')">霓虹</button>
        </div>
      </div>

      <div class="blind-mode-section">
        <button class="blind-toggle" @click="toggleBlindModeHandler" :class="{ active: blindMode }">
          <span class="blind-icon">{{ blindMode ? '⌨' : '⌨' }}</span>
          {{ blindMode ? '退出盲打模式' : '极客盲打模式' }}
        </button>
        <div class="blind-hint">按 Tab 键快速切换</div>
      </div>

      <div class="current-config" v-if="currentConfig">
        <div class="config-row">
          <span class="label">波形</span>
          <span class="value">{{ currentConfig.oscillatorType }}</span>
        </div>
        <div class="config-row">
          <span class="label">滤波</span>
          <span class="value">{{ currentConfig.filterFrequency }}Hz</span>
        </div>
        <div class="config-row">
          <span class="label">速度</span>
          <span class="value">{{ currentConfig.particleSpeed.toFixed(1) }}x</span>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <span class="hint">按 Enter 应用配置</span>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 280px;
  background: rgba(10, 10, 20, 0.85);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #9ca3af;
  box-shadow:
    0 0 20px rgba(0, 255, 204, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.control-panel.blind-active {
  border-color: rgba(0, 255, 65, 0.5);
  box-shadow:
    0 0 30px rgba(0, 255, 65, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 255, 204, 0.1);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00ffcc;
  font-weight: 600;
  letter-spacing: 1px;
}

.blind-active .title {
  color: #00ff41;
}

.icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 0, 85, 0.2);
  color: #ff0055;
  transition: all 0.3s;
}

.status.active {
  background: rgba(0, 255, 204, 0.2);
  color: #00ffcc;
}

.blind-active .status.active {
  background: rgba(0, 255, 65, 0.2);
  color: #00ff41;
}

.panel-body {
  padding: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.input-group input {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  color: #e5e7eb;
  font-family: inherit;
  font-size: 11px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: #00ffcc;
}

.input-group input::placeholder {
  color: #6b7280;
}

.input-group button {
  width: 36px;
  background: rgba(0, 255, 204, 0.1);
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 4px;
  color: #00ffcc;
  cursor: pointer;
  transition: all 0.2s;
}

.input-group button:hover:not(:disabled) {
  background: rgba(0, 255, 204, 0.2);
}

.input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.presets {
  margin-bottom: 16px;
}

.preset-label {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.preset-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-buttons button {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #9ca3af;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-buttons button:hover {
  background: rgba(0, 255, 204, 0.1);
  border-color: rgba(0, 255, 204, 0.3);
  color: #00ffcc;
}

.blind-mode-section {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px dashed rgba(0, 255, 65, 0.3);
}

.blind-toggle {
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 255, 65, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.3);
  border-radius: 4px;
  color: #00ff41;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.blind-toggle:hover {
  background: rgba(0, 255, 65, 0.1);
}

.blind-toggle.active {
  background: rgba(0, 255, 65, 0.2);
  border-color: #00ff41;
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
}

.blind-icon {
  font-size: 14px;
}

.blind-hint {
  font-size: 9px;
  color: #4b5563;
  text-align: center;
  margin-top: 6px;
}

.current-config {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 10px 12px;
}

.config-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.config-row .label {
  color: #6b7280;
}

.config-row .value {
  color: #00ffcc;
}

.blind-active .config-row .value {
  color: #00ff41;
}

.panel-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 255, 204, 0.1);
  text-align: center;
}

.hint {
  font-size: 10px;
  color: #4b5563;
}
</style>