'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

/**
 * 错误边界 Props
 */
interface ErrorBoundaryProps {
  children: ReactNode
  /** 自定义错误回退 UI */
  fallback?: ReactNode
  /** 错误发生时的回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * 错误边界 State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示回退 UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props

    // 输出错误日志
    console.error('ErrorBoundary 捕获到错误:', error)
    console.error('组件堆栈:', errorInfo.componentStack)

    // 调用自定义错误处理
    onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // 使用自定义回退 UI 或默认 UI
      if (fallback) {
        return fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-red-500/10 rounded-xl border border-red-500/20">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">出错了</h2>
          <p className="text-white/60 text-sm mb-4 text-center max-w-md">
            {error?.message || '组件渲染时发生错误'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      )
    }

    return children
  }
}

/**
 * 音频播放器专用错误边界
 */
export class AudioErrorBoundary extends Component<{
  children: ReactNode
}, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    console.error('音频播放器错误:', error)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError } = this.state
    const { children } = this.props

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-xl font-bold text-white mb-2">播放器加载失败</h2>
          <p className="text-white/60 text-sm mb-4">
            请检查网络连接或刷新页面重试
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            重新加载
          </button>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary
