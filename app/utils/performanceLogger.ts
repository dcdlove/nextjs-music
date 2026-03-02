/**
 * 性能分析日志工具
 * 用于定位卡顿问题的诊断工具
 */

// 是否启用性能日志（开发环境默认开启）
const ENABLED = process.env.NODE_ENV === 'development'

// 日志颜色配置
const COLORS = {
  render: '#3b82f6',    // 蓝色 - 组件渲染
  state: '#10b981',     // 绿色 - 状态更新
  animation: '#f59e0b', // 橙色 - 动画帧
  heavy: '#ef4444',     // 红色 - 重计算
} as const

/**
 * 性能计时器
 */
class PerformanceTimer {
  private startTime: number
  private name: string
  private category: keyof typeof COLORS

  constructor(name: string, category: keyof typeof COLORS) {
    this.name = name
    this.category = category
    this.startTime = performance.now()
  }

  /**
   * 结束计时并输出日志
   */
  end(extraInfo?: Record<string, unknown>): number {
    const duration = performance.now() - this.startTime
    const color = COLORS[this.category]

    if (ENABLED) {
      const threshold = this.getThreshold()
      const isSlow = duration > threshold

      console.log(
        `%c[${this.category.toUpperCase()}] ${this.name}: ${duration.toFixed(2)}ms${isSlow ? ' ⚠️ SLOW!' : ''}`,
        `color: ${color}; font-weight: ${isSlow ? 'bold' : 'normal'};`,
        extraInfo || ''
      )

      // 使用 Performance API 记录
      performance.mark(`${this.name}-end`)
      performance.measure(`${this.name}`, `${this.name}-start`, `${this.name}-end`)
    }

    return duration
  }

  private getThreshold(): number {
    switch (this.category) {
      case 'animation': return 16.67  // 60fps = 16.67ms per frame
      case 'render': return 8         // 渲染应该 < 8ms
      case 'state': return 5          // 状态更新应该 < 5ms
      case 'heavy': return 50         // 重计算允许更长
      default: return 16
    }
  }
}

/**
 * 开始性能计时
 */
export function startTimer(name: string, category: keyof typeof COLORS = 'render'): PerformanceTimer {
  if (ENABLED) {
    performance.mark(`${name}-start`)
  }
  return new PerformanceTimer(name, category)
}

/**
 * 记录组件渲染
 */
export function logRender(componentName: string, props?: Record<string, unknown>): void {
  if (!ENABLED) return

  console.log(
    `%c[RENDER] ${componentName}`,
    `color: ${COLORS.render};`,
    props || ''
  )
}

/**
 * 记录状态更新
 */
export function logStateChange(storeName: string, changes: Record<string, unknown>): void {
  if (!ENABLED) return

  console.log(
    `%c[STATE] ${storeName} updated:`,
    `color: ${COLORS.state};`,
    changes
  )
}

/**
 * 记录动画帧率
 */
export class FrameRateMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private name: string
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor(name: string) {
    this.name = name
  }

  /**
   * 记录一帧
   */
  tick(): void {
    this.frameCount++
  }

  /**
   * 开始监控（每秒输出一次帧率）
   */
  start(): void {
    if (!ENABLED) return

    this.intervalId = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - this.lastTime) / 1000
      const fps = Math.round(this.frameCount / elapsed)

      console.log(
        `%c[ANIMATION] ${this.name} FPS: ${fps}${fps < 50 ? ' ⚠️ LOW FPS!' : ''}`,
        `color: ${COLORS.animation}; font-weight: ${fps < 50 ? 'bold' : 'normal'};`
      )

      this.frameCount = 0
      this.lastTime = now
    }, 1000)
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

/**
 * 记录内存使用
 */
export function logMemoryUsage(): void {
  if (!ENABLED) return

  // @ts-expect-error - memory API 可能不存在
  const memory = performance.memory
  if (memory) {
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2)

    console.log(
      `%c[MEMORY] Used: ${usedMB}MB / Total: ${totalMB}MB`,
      `color: #8b5cf6;`
    )
  }
}

/**
 * 创建节流日志函数（避免日志过多）
 */
export function createThrottledLog(interval: number): (message: string, style: string, data?: unknown) => void {
  let lastLogTime = 0

  return (message: string, style: string, data?: unknown) => {
    const now = performance.now()
    if (now - lastLogTime >= interval) {
      console.log(message, style, data ?? '')
      lastLogTime = now
    }
  }
}

// 全局性能监控开关
if (ENABLED && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).perfLog = {
    startTimer,
    logRender,
    logStateChange,
    FrameRateMonitor,
    logMemoryUsage,
  }
}
