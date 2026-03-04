'use client'

import { FormEvent, useMemo, useState, useRef, useCallback, useEffect } from 'react'

// 内联 SVG 图标组件
const Icons: Record<string, () => React.ReactElement> = {
  Music: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
  Clipboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  ),
}

interface ApiResult {
  message: string
  code: number
  httpStatus?: number
  details?: string
  data?: Record<string, unknown>
}

function stripSongFileExtension(fileName: string): string {
  if (!fileName) return ''
  if (/\.lkmp3$/i.test(fileName)) {
    return fileName.replace(/\.lkmp3$/i, '')
  }
  return fileName.replace(/\.[^/.]+$/, '')
}

function extractSingerAndTitle(fileName: string): { singer: string; title: string } | null {
  const baseName = stripSongFileExtension(fileName).trim()
  if (!baseName) return null

  const match = baseName.match(/^(.+?)\s*[-—_]\s*(.+)$/)
  if (!match) return null

  const singer = match[1].trim()
  const title = match[2].trim()
  if (!singer || !title) return null

  return { singer, title }
}

async function parseApiResult(res: Response): Promise<ApiResult> {
  const raw = await res.text()
  let parsed: Partial<ApiResult> | null = null

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<ApiResult>
    } catch {
      parsed = null
    }
  }

  if (parsed && typeof parsed === 'object') {
    return {
      message: parsed.message || (res.ok ? '操作成功' : '操作失败'),
      code: typeof parsed.code === 'number' ? parsed.code : (res.ok ? 0 : res.status || 500),
      httpStatus: res.status,
      details: parsed.details,
      data: parsed.data,
    }
  }

  return {
    message: res.ok ? '操作成功' : `操作失败（HTTP ${res.status}）`,
    code: res.ok ? 0 : (res.status || 500),
    httpStatus: res.status,
    details: raw || res.statusText || '服务端未返回详细信息',
  }
}

// VU Meter 组件 - 模拟音频电平表
function VUMeter({ active, progress }: { active: boolean; progress: number }) {
  const bars = Array.from({ length: 12 })

  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((_, i) => {
        const threshold = (i / bars.length) * 100
        const isActive = active && progress >= threshold
        const isWarning = i >= bars.length - 3

        return (
          <div
            key={i}
            className={`
              w-1.5 rounded-sm transition-all duration-100
              ${isActive
                ? isWarning
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  : i >= bars.length - 6
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                    : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]'
                : 'bg-slate-700/50'
              }
            `}
            style={{
              height: `${20 + (i * 5)}%`,
              transitionDuration: active ? '50ms' : '300ms',
            }}
          />
        )
      })}
    </div>
  )
}

// 模拟进度动画
function useUploadProgress(active: boolean) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95
        const increment = Math.random() * 15 + 2
        return Math.min(prev + increment, 95)
      })
    }, 200)

    return () => clearInterval(interval)
  }, [active])

  return progress
}

// 自定义文件输入区域
function FileDropZone({
  file,
  onFileSelect,
  accept,
  icon: Icon,
  label,
  maxSize,
  progress,
  uploading,
  onClear,
  supportPaste = false,
  pasteLabel
}: {
  file: File | null
  onFileSelect: (file: File) => void
  accept: string
  icon: () => JSX.Element
  label: string
  maxSize?: string
  progress?: number
  uploading?: boolean
  onClear?: () => void
  supportPaste?: boolean
  pasteLabel?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteHint, setShowPasteHint] = useState(false)

  const handleClick = () => inputRef.current?.click()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      onFileSelect(dropped)
    }
  }, [onFileSelect])

  // 粘贴功能
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!supportPaste) return
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          onFileSelect(file)
          e.preventDefault()
          break
        }
      }
    }
  }, [supportPaste, onFileSelect])

  useEffect(() => {
    if (!supportPaste) return

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste, supportPaste])

  // 显示粘贴提示
  useEffect(() => {
    if (!supportPaste) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        setShowPasteHint(true)
        setTimeout(() => setShowPasteHint(false), 2000)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [supportPaste])

  const fileSizeText = useMemo(() => {
    if (!file) return maxSize || ''
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`
  }, [file, maxSize])

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden group cursor-pointer
        border-2 rounded-xl p-5 transition-all duration-300
        ${isDragging
          ? 'border-amber-400/60 bg-amber-500/10'
          : file
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50'
        }
      `}
    >
      {uploading && progress !== undefined && progress > 0 && (
        <div className="absolute inset-0 flex items-center gap-0.5 px-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full bg-amber-400/30"
              style={{
                transform: `scaleY(${Math.sin((Date.now() / 100) + i * 0.3) * 0.3 + 0.5})`,
                opacity: i < (progress / 100) * 20 ? 1 : 0.2
              }}
            />
          ))}
        </div>
      )}

      <div className="relative">
        {/* 文件选中状态 */}
        {file ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              {uploading ? (
                <div className="w-6 h-6 border-3 border-emerald-400/60 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <Icons.Check />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-300 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">{fileSizeText}</p>
            </div>
            {!uploading && onClear && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Icons.X />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className={`
              w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-all duration-300
              ${isDragging ? 'bg-amber-500/20 text-amber-400 scale-110' : 'bg-slate-700/50 text-slate-500 group-hover:text-slate-400 group-hover:scale-105'}
            `}>
              {uploading ? (
                <div className="w-8 h-8 border-3 border-amber-400/60 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <Icon />
              )}
            </div>
            <p className={`text-sm font-medium mb-1 ${isDragging ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {isDragging ? '释放文件' : label}
            </p>
            <p className="text-xs text-slate-600">{fileSizeText}</p>
            {supportPaste && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Icons.Clipboard />
                <span>或按 Ctrl+V {pasteLabel || '粘贴图片'}</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const selected = e.target.files?.[0]
            if (selected) onFileSelect(selected)
          }}
          className="hidden"
        />
      </div>

      {/* 粘贴成功提示 */}
      {showPasteHint && file && !uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-xl animate-pulse">
          <span className="text-emerald-300 font-medium">已粘贴图片</span>
        </div>
      )}
    </div>
  )
}

// LED 指示灯
function LED({ active, color = 'green' }: { active: boolean; color?: 'green' | 'red' | 'amber' }) {
  const colors = {
    green: 'bg-emerald-400 shadow-emerald-400/50',
    red: 'bg-red-400 shadow-red-400/50',
    amber: 'bg-amber-400 shadow-amber-400/50'
  }

  return (
    <div className={`
      w-2 h-2 rounded-full transition-all duration-200
      ${active ? colors[color] : 'bg-slate-700'}
      ${active ? 'shadow-[0_0_8px_currentColor]' : ''}
    `} />
  )
}

// 螺丝装饰
function Screw({ className }: { className?: string }) {
  return (
    <div className={`
      w-3 h-3 rounded-full bg-slate-700/50 border border-slate-600/30
      flex items-center justify-center
      ${className}
    `}>
      <div className="w-2 h-0.5 bg-slate-600/40 rotate-45" />
    </div>
  )
}

export default function AdminUploadPage() {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const tokenRef = useRef<HTMLInputElement>(null)

  // 歌曲上传状态
  const [singer, setSinger] = useState('')
  const [title, setTitle] = useState('')
  const [overwriteSong, setOverwriteSong] = useState(false)
  const [songFile, setSongFile] = useState<File | null>(null)
  const [songUploading, setSongUploading] = useState(false)
  const [songResult, setSongResult] = useState<ApiResult | null>(null)
  const songProgress = useUploadProgress(songUploading)

  // 头像上传状态
  const [avatarSinger, setAvatarSinger] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [overwriteAvatar, setOverwriteAvatar] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarResult, setAvatarResult] = useState<ApiResult | null>(null)
  const avatarProgress = useUploadProgress(avatarUploading)

  // 指引展开状态
  const [showGuide, setShowGuide] = useState(false)

  const handleSongSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!songFile) {
      setSongResult({ message: '请先选择歌曲文件', code: 400 })
      return
    }
    if (!singer.trim() || !title.trim()) {
      setSongResult({ message: '歌手和歌曲名不能为空', code: 400 })
      return
    }

    setSongUploading(true)
    setSongResult(null)

    try {
      const formData = new FormData()
      formData.append('file', songFile)
      formData.append('singer', singer)
      formData.append('title', title)
      formData.append('overwrite', String(overwriteSong))

      const res = await fetch('/api/admin/songs', {
        method: 'POST',
        headers: {
          'x-admin-token': token,
        },
        body: formData,
      })

      const result = await parseApiResult(res)
      setSongResult(result)

      if (result.code === 0) {
        setSongFile(null)
        setSinger('')
        setTitle('')
      }
    } catch (error) {
      setSongResult({
        message: '提交失败',
        code: 500,
        details: error instanceof Error ? error.message : '网络异常或服务不可用',
      })
    } finally {
      setSongUploading(false)
    }
  }

  const handleAvatarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!avatarFile) {
      setAvatarResult({ message: '请先选择头像文件', code: 400 })
      return
    }
    if (!avatarSinger.trim()) {
      setAvatarResult({ message: '歌手名不能为空', code: 400 })
      return
    }

    setAvatarUploading(true)
    setAvatarResult(null)

    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('singer', avatarSinger)
      formData.append('overwrite', String(overwriteAvatar))

      const res = await fetch('/api/admin/avatars', {
        method: 'POST',
        headers: {
          'x-admin-token': token,
        },
        body: formData,
      })

      const result = await parseApiResult(res)
      setAvatarResult(result)

      if (result.code === 0) {
        setAvatarFile(null)
        setAvatarSinger('')
      }
    } catch (error) {
      setAvatarResult({
        message: '提交失败',
        code: 500,
        details: error instanceof Error ? error.message : '网络异常或服务不可用',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 lg:p-8">
      {/* 背景纹理 */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950/80"></div>
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* 顶部标题栏 */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center">
              <Icons.Upload />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-200 bg-clip-text text-transparent">
                  上传控制台
                </span>
              </h1>
              <p className="text-slate-500 text-sm font-mono mt-1">
                GITHUB REPOSITORY · DCDLOVE/OSS
              </p>
            </div>
          </div>
        </header>

        {/* Token 认证面板 */}
        <section className="relative mb-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 rounded-2xl blur-sm"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>

            <Screw className="absolute top-3 left-3" />
            <Screw className="absolute top-3 right-3" />
            <Screw className="absolute bottom-3 left-3" />
            <Screw className="absolute bottom-3 right-3" />

            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <Icons.Lock />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-1">
                    管理口令 (ADMIN_TOKEN)
                  </label>
                  <p className="text-xs text-slate-500">输入管理口令以解锁上传功能</p>
                </div>
                <LED active={!!token} color="green" />
              </div>

              <div className="relative">
                <input
                  ref={tokenRef}
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••••••••"
                  className={`
                    w-full bg-slate-950/50 border rounded-lg px-4 py-3 pr-24
                    font-mono text-sm tracking-wider
                    placeholder:text-slate-600
                    transition-all duration-200
                    focus:outline-none focus:ring-2
                    ${token
                      ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                      : 'border-slate-700/50 focus:border-amber-500/40 focus:ring-amber-500/20'
                    }
                  `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs rounded-md border border-slate-700/50 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-all"
                  aria-label={showToken ? '隐藏口令' : '显示口令'}
                >
                  {showToken ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>
          </div>
        </section>

   

        {/* 上传区域 - 双栏布局 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 歌曲上传面板 */}
          <form onSubmit={handleSongSubmit} className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-amber-500/20 to-cyan-500/20 rounded-2xl blur-sm"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden h-full">
              <div className="h-1 bg-gradient-to-r from-cyan-400/30 via-amber-400/30 to-cyan-400/30"></div>

              <Screw className="absolute top-3 left-3" />
              <Screw className="absolute top-3 right-3" />

              <div className="p-6 flex flex-col h-full">
                {/* 标题和 VU 表 */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Icons.Music />
                    </div>
                    <div>
                      <h2 className="font-semibold">歌曲上传</h2>
                      <p className="text-xs text-slate-500">music/ 目录</p>
                    </div>
                  </div>
                  <VUMeter active={songUploading} progress={songProgress} />
                </div>

                {/* 文件选择 */}
                <div className="mb-4">
                  <FileDropZone
                    file={songFile}
                    onFileSelect={(file) => {
                      setSongFile(file)
                      const parsed = extractSingerAndTitle(file.name)
                      if (parsed) {
                        setSinger(parsed.singer)
                        setTitle(parsed.title)
                      } else {
                        const baseName = stripSongFileExtension(file.name)
                        if (baseName) setTitle(baseName)
                      }
                    }}
                    accept=".mp3,audio/mpeg"
                    icon={Icons.Music}
                    label="点击或拖拽 MP3 文件"
                    maxSize="最大 4 MB"
                    progress={songProgress}
                    uploading={songUploading}
                    onClear={() => {
                      setSongFile(null)
                      setSinger('')
                      setTitle('')
                    }}
                  />
                </div>

                {/* 元数据输入 */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">歌手</label>
                    <input
                      type="text"
                      value={singer}
                      onChange={(e) => setSinger(e.target.value)}
                      placeholder="歌手名称"
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">歌曲</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="歌曲名称"
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 底部操作区 */}
                <div className="mt-auto pt-4 border-t border-slate-700/30">
                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={overwriteSong}
                        onChange={(e) => setOverwriteSong(e.target.checked)}
                        className="rounded border-slate-600 text-amber-400 focus:ring-amber-400/20"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">覆盖同名</span>
                    </label>

                    <button
                      type="submit"
                      disabled={songUploading || !songFile || !token}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                        bg-gradient-to-r from-cyan-500/80 to-cyan-600/80 hover:from-cyan-500 hover:to-cyan-600
                        border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]
                        text-white
                      "
                    >
                      {songUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <span className="w-4 h-4"><Icons.Upload /></span>
                          上传歌曲
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {songResult && (
              <div className={`
                relative mt-3 p-3 rounded-xl border flex items-start gap-3
                ${songResult.code === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
                }
              `}>
                {songResult.code === 0 ? (
                  <span className="w-5 h-5 text-emerald-400 flex-shrink-0"><Icons.Check /></span>
                ) : (
                  <span className="w-5 h-5 text-red-400 flex-shrink-0"><Icons.AlertTriangle /></span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${songResult.code === 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {songResult.message}
                  </p>
                  {songResult.details && (
                    <p className="text-xs text-slate-400 mt-0.5">{songResult.details}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSongResult(null)}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Icons.X />
                </button>
              </div>
            )}
          </form>

          {/* 头像上传面板 */}
          <form onSubmit={handleAvatarSubmit} className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden h-full">
              <div className="h-1 bg-gradient-to-r from-purple-400/30 via-amber-400/30 to-purple-400/30"></div>

              <Screw className="absolute top-3 left-3" />
              <Screw className="absolute top-3 right-3" />

              <div className="p-6 flex flex-col h-full">
                {/* 标题和 VU 表 */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Icons.Image />
                    </div>
                    <div>
                      <h2 className="font-semibold">歌手头像</h2>
                      <p className="text-xs text-slate-500">img/ 目录</p>
                    </div>
                  </div>
                  <VUMeter active={avatarUploading} progress={avatarProgress} />
                </div>

                {/* 文件选择 - 支持粘贴 */}
                <div className="mb-4">
                  <FileDropZone
                    file={avatarFile}
                    onFileSelect={setAvatarFile}
                    accept="image/*"
                    icon={Icons.Image}
                    label="点击、拖拽或粘贴图片"
                    maxSize="最大 2 MB"
                    progress={avatarProgress}
                    uploading={avatarUploading}
                    onClear={() => {
                      setAvatarFile(null)
                      setAvatarSinger('')
                    }}
                    supportPaste={true}
                    pasteLabel="粘贴图片"
                  />
                </div>

                {/* 歌手输入 */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">歌手</label>
                  <input
                    type="text"
                    value={avatarSinger}
                    onChange={(e) => setAvatarSinger(e.target.value)}
                    placeholder="输入歌手名（用于映射）"
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    required
                  />
                </div>

                {/* 底部操作区 */}
                <div className="mt-auto pt-4 border-t border-slate-700/30">
                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={overwriteAvatar}
                        onChange={(e) => setOverwriteAvatar(e.target.checked)}
                        className="rounded border-slate-600 text-amber-400 focus:ring-amber-400/20"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">覆盖同名</span>
                    </label>

                    <button
                      type="submit"
                      disabled={avatarUploading || !avatarFile || !token}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                        bg-gradient-to-r from-purple-500/80 to-purple-600/80 hover:from-purple-500 hover:to-purple-600
                        border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]
                        text-white
                      "
                    >
                      {avatarUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <span className="w-4 h-4"><Icons.Upload /></span>
                          上传头像
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {avatarResult && (
              <div className={`
                relative mt-3 p-3 rounded-xl border flex items-start gap-3
                ${avatarResult.code === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
                }
              `}>
                {avatarResult.code === 0 ? (
                  <span className="w-5 h-5 text-emerald-400 flex-shrink-0"><Icons.Check /></span>
                ) : (
                  <span className="w-5 h-5 text-red-400 flex-shrink-0"><Icons.AlertTriangle /></span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${avatarResult.code === 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {avatarResult.message}
                  </p>
                  {avatarResult.details && (
                    <p className="text-xs text-slate-400 mt-0.5">{avatarResult.details}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarResult(null)}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Icons.X />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 底部状态栏 */}
        <footer className="text-center py-6 border-t border-slate-800/50">
          <p className="text-xs text-slate-600 font-mono">
            SERENDIPITY MUSIC PLAYER · ADMIN CONSOLE v1.0
          </p>
        </footer>
      </div>
    </main>
  )
}
