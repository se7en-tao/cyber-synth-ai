import { ref } from 'vue'

export interface AIConfig {
  oscillatorType: 'sine' | 'sawtooth' | 'square' | 'triangle'
  filterFrequency: number
  colorPalette: [number, number]
  particleSpeed: number
  reverbWet: number
  mood: string
}

const PRESETS: Record<string, AIConfig> = {
  rain: {
    oscillatorType: 'sine',
    filterFrequency: 800,
    colorPalette: [168, 200],
    particleSpeed: 0.8,
    reverbWet: 0.6,
    mood: '寂静的赛博朋克雨夜'
  },
  supernova: {
    oscillatorType: 'sawtooth',
    filterFrequency: 2000,
    colorPalette: [338, 30],
    particleSpeed: 2.5,
    reverbWet: 0.3,
    mood: '炽热的超新星爆发'
  },
  void: {
    oscillatorType: 'triangle',
    filterFrequency: 400,
    colorPalette: [270, 320],
    particleSpeed: 0.4,
    reverbWet: 0.8,
    mood: '深邃的虚空深渊'
  },
  neon: {
    oscillatorType: 'square',
    filterFrequency: 1500,
    colorPalette: [300, 60],
    particleSpeed: 1.5,
    reverbWet: 0.4,
    mood: '霓虹闪烁的都市夜'
  }
}

const KEYWORDS: Record<string, string> = {
  '雨': 'rain',
  '寂静': 'rain',
  '冷': 'rain',
  '冰': 'rain',
  '爆发': 'supernova',
  '炽热': 'supernova',
  '火': 'supernova',
  '热': 'supernova',
  '超新星': 'supernova',
  '虚空': 'void',
  '深渊': 'void',
  '深': 'void',
  '暗': 'void',
  '霓虹': 'neon',
  '都市': 'neon',
  '城市': 'neon',
  '夜': 'neon',
  '闪烁': 'neon'
}

function matchPreset(input: string): string {
  for (const [keyword, preset] of Object.entries(KEYWORDS)) {
    if (input.includes(keyword)) {
      return preset
    }
  }
  const presets = Object.keys(PRESETS)
  return presets[Math.floor(Math.random() * presets.length)]
}

export function useAIConfig() {
  const currentConfig = ref<AIConfig>(PRESETS.neon)
  const isLoading = ref(false)

  async function generateConfig(userInput: string): Promise<AIConfig> {
    isLoading.value = true

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

    const presetKey = matchPreset(userInput)
    const config = PRESETS[presetKey]

    isLoading.value = false
    currentConfig.value = config

    return config
  }

  return {
    currentConfig,
    isLoading,
    generateConfig,
    presets: PRESETS
  }
}
