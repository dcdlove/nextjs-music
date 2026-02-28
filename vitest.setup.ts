import '@testing-library/jest-dom/vitest'

// 模拟 localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// 模拟 AudioContext
class MockAudioContext {
  state = 'running'
  createAnalyser = () => ({
    fftSize: 512,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 256,
    getByteFrequencyData: () => {},
  })
  createMediaElementSource = () => ({
    connect: () => {},
  })
  destination = {}
  resume = () => Promise.resolve()
  suspend = () => Promise.resolve()
  close = () => Promise.resolve()
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
})

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: MockAudioContext,
})
