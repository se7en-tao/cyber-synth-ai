<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as Tone from 'tone'
import type { AIConfig } from '../composables/useAIConfig'

interface MatrixChar {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  size: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
  hue: number
}

const props = defineProps<{
  config?: AIConfig
  blindMode: boolean
  keypressRate: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let particles: MatrixChar[] = []
let animationId: number
let lastNoteTime = 0
let synth: Tone.PolySynth | null = null
let reverb: Tone.Reverb | null = null
let filter: Tone.Filter | null = null
let kick: Tone.MembraneSynth | null = null
let hihat: Tone.MetalSynth | null = null
let lead: Tone.Synth | null = null
let kickLoop: Tone.Loop | null = null
let hihatLoop: Tone.Loop | null = null
let leadLoop: Tone.Loop | null = null

const PENTATONIC_NOTES = ['C', 'D', 'E', 'G', 'A']
const NOTE_PROBABILITY = 0.15
const PARTICLE_LIFETIME = 2000
const GRAVITY = 0.05

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}|/\\~^'

let currentConfig: AIConfig = {
  oscillatorType: 'sine',
  filterFrequency: 1200,
  colorPalette: [168, 338],
  particleSpeed: 1,
  reverbWet: 0.4,
  mood: 'default'
}

function initAudio() {
  filter = new Tone.Filter(currentConfig.filterFrequency, 'lowpass')
  reverb = new Tone.Reverb({ decay: 2.5, wet: currentConfig.reverbWet })
  synth = new Tone.PolySynth(Tone.Synth).toDestination()

  synth.set({
    oscillator: { type: currentConfig.oscillatorType }
  })

  synth.connect(filter)
  filter.connect(reverb)
  reverb.toDestination()

  kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
  }).toDestination()
  kick.volume.value = -6

  hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).toDestination()
  hihat.volume.value = -12

  lead = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }
  }).connect(filter)
  lead.volume.value = -8

  Tone.Transport.bpm.value = 120

  kickLoop = new Tone.Loop((time) => {
    kick?.triggerAttackRelease('C1', '8n', time, 0.8)
  }, '4n')

  hihatLoop = new Tone.Loop((time) => {
    if (props.keypressRate > 3) {
      hihat?.triggerAttackRelease('8n', time, 0.3)
    }
  }, '8n')

  leadLoop = new Tone.Loop((time) => {
    if (props.keypressRate > 5) {
      const notes = ['C4', 'E4', 'G4', 'A4', 'C5']
      const note = notes[Math.floor(Math.random() * notes.length)]
      lead?.triggerAttackRelease(note, '16n', time, 0.4)
    }
  }, '16n')
}

function startBeatLoop() {
  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start()
  }
  kickLoop?.start(0)
  hihatLoop?.start(0)
  leadLoop?.start(0)
}

function stopBeatLoop() {
  hihatLoop?.stop()
  leadLoop?.stop()
}

function updateAudioConfig() {
  if (!synth || !filter || !reverb) return

  synth.set({
    oscillator: { type: currentConfig.oscillatorType }
  })

  filter.frequency.value = currentConfig.filterFrequency
  reverb.wet.value = currentConfig.reverbWet

  if (kick) kick.volume.value = -6
  if (hihat) {
    hihat.volume.value = Math.min(-6, -12 + props.keypressRate * 2)
  }
  if (lead) {
    lead.volume.value = Math.min(-4, -8 + props.keypressRate * 1.5)
  }
}

function xToNote(x: number, width: number): string {
  const normalizedX = x / width
  const octave = Math.floor(normalizedX * 3) + 3
  const noteIndex = Math.floor((normalizedX * 5 * 3) % 5)
  return PENTATONIC_NOTES[noteIndex] + octave
}

function yToVolume(y: number, height: number): number {
  return Math.max(0.1, Math.min(0.8, 1 - y / height))
}

function triggerNote(x: number, y: number, width: number, height: number) {
  if (!synth) return

  const now = Date.now()
  if (now - lastNoteTime < 80) return
  if (Math.random() > NOTE_PROBABILITY) return

  lastNoteTime = now
  const note = xToNote(x, width)
  const volume = yToVolume(y, height)

  synth.triggerAttackRelease(note, '8n', Tone.now(), volume)
}

function createParticle(x: number, y: number): MatrixChar {
  const angle = Math.random() * Math.PI * 2
  const baseSpeed = Math.random() * 2 + 1
  const speed = baseSpeed * currentConfig.particleSpeed

  const palette = currentConfig.colorPalette
  const hue = palette[Math.floor(Math.random() * palette.length)]

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 1,
    size: Math.random() * 4 + 2,
    life: PARTICLE_LIFETIME,
    maxLife: PARTICLE_LIFETIME,
    hue,
    char: '',
    rotation: 0,
    rotationSpeed: 0
  }
}

function createMatrixChar(x: number, y: number): MatrixChar {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 1,
    char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
    size: Math.random() * 16 + 12,
    life: 2500 + Math.random() * 1000,
    maxLife: 2500 + Math.random() * 1000,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.1,
    hue: 120
  }
}

function hueToRGB(hue: number, alpha: number): string {
  const h = hue / 360
  const s = 1
  const l = 0.5

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h * 6) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (h < 1/6) { r = c; g = x; b = 0 }
  else if (h < 2/6) { r = x; g = c; b = 0 }
  else if (h < 3/6) { r = 0; g = c; b = x }
  else if (h < 4/6) { r = 0; g = x; b = c }
  else if (h < 5/6) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, ${alpha})`
}

function drawGrid() {
  if (!ctx) return

  const gridSize = 50
  const gridAlpha = 0.02 + (currentConfig.particleSpeed * 0.01)

  ctx.strokeStyle = `rgba(0, 255, 204, ${gridAlpha})`
  ctx.lineWidth = 1

  for (let x = 0; x < ctx.canvas.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, ctx.canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y < ctx.canvas.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(ctx.canvas.width, y)
    ctx.stroke()
  }
}

function updateParticles(deltaTime: number) {
  const speedFactor = currentConfig.particleSpeed

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx * speedFactor
    p.y += p.vy * speedFactor
    p.vy += GRAVITY * speedFactor
    p.life -= deltaTime
    p.rotation += p.rotationSpeed

    if (p.life <= 0 || p.y > ctx!.canvas.height + 50) {
      particles.splice(i, 1)
    }
  }
}

function drawParticles() {
  if (!ctx) return

  for (const p of particles) {
    const alpha = p.life / p.maxLife

    if (p.char) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.font = `bold ${p.size}px 'Courier New', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      ctx.shadowColor = `rgba(0, 255, 65, ${alpha})`
      ctx.shadowBlur = 10

      ctx.fillStyle = hueToRGB(p.hue, alpha)

      ctx.fillText(p.char, 0, 0)
      ctx.restore()
    } else {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)

      gradient.addColorStop(0, hueToRGB(p.hue, alpha * 0.9))
      gradient.addColorStop(0.5, hueToRGB(p.hue, alpha * 0.5))
      gradient.addColorStop(1, hueToRGB(p.hue, 0))

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }
}

let lastTime = 0

function animate(currentTime: number) {
  if (!ctx) return

  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  const fadeAlpha = props.blindMode ? 0.08 : 0.15 - (currentConfig.reverbWet * 0.05)
  ctx.fillStyle = `rgba(5, 5, 10, ${fadeAlpha})`
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  drawGrid()
  updateParticles(deltaTime)
  drawParticles()

  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const particleCount = Math.ceil(3 * currentConfig.particleSpeed)
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle(x, y))
  }

  triggerNote(x, y, canvasRef.value.width, canvasRef.value.height)
}

function handleResize() {
  if (!canvasRef.value || !ctx) return

  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
}

function handleClick() {
  if (Tone.context.state !== 'running') {
    Tone.start()
  }
}

function spawnMatrixChars(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * 100
    const offsetY = (Math.random() - 0.5) * 50
    particles.push(createMatrixChar(x + offsetX, y + offsetY))
  }
}

watch(() => props.config, (newConfig) => {
  if (newConfig) {
    currentConfig = newConfig
    updateAudioConfig()
  }
}, { immediate: true })

watch(() => props.blindMode, (isBlindMode) => {
  if (isBlindMode) {
    startBeatLoop()
  } else {
    stopBeatLoop()
  }
})

watch(() => props.keypressRate, () => {
  updateAudioConfig()
})

defineExpose({
  spawnMatrixChars
})

onMounted(() => {
  if (!canvasRef.value) return

  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight

  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  initAudio()

  window.addEventListener('resize', handleResize)
  canvasRef.value.addEventListener('mousemove', handleMouseMove)
  canvasRef.value.addEventListener('click', handleClick)

  lastTime = performance.now()
  animate(lastTime)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousemove', handleMouseMove)
    canvasRef.value.removeEventListener('click', handleClick)
  }

  cancelAnimationFrame(animationId)

  kickLoop?.dispose()
  hihatLoop?.dispose()
  leadLoop?.dispose()
  kick?.dispose()
  hihat?.dispose()
  lead?.dispose()
  synth?.dispose()
  reverb?.dispose()
  filter?.dispose()
})
</script>

<template>
  <canvas ref="canvasRef" class="cyber-canvas"></canvas>
</template>

<style scoped>
.cyber-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
}
</style>