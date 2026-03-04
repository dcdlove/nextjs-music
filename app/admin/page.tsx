'use client'

import { FormEvent, useMemo, useState } from 'react'

interface UploadResult {
  message: string
  code: number
  httpStatus?: number
  details?: string
  data?: {
    singer: string
    title: string
    ext: string
    fileName: string
    songPath: string
    playlistPath: string
    playlistUpdated: boolean
  }
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

  // 常见格式：歌手-歌名 / 歌手 - 歌名 / 歌手_歌名 / 歌手—歌名
  const match = baseName.match(/^(.+?)\s*[-—_]\s*(.+)$/)
  if (!match) return null

  const singer = match[1].trim()
  const title = match[2].trim()
  if (!singer || !title) return null

  return { singer, title }
}

export default function AdminUploadPage() {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [singer, setSinger] = useState('')
  const [title, setTitle] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const fileSizeText = useMemo(() => {
    if (!file) return '未选择文件'
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`
  }, [file])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      setResult({ message: '请先选择歌曲文件', code: 400 })
      return
    }
    if (!singer.trim() || !title.trim()) {
      setResult({ message: '歌手和歌曲名不能为空', code: 400 })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('singer', singer)
      formData.append('title', title)
      formData.append('overwrite', String(overwrite))

      const res = await fetch('/api/admin/songs', {
        method: 'POST',
        headers: {
          'x-admin-token': token,
        },
        body: formData,
      })

      const raw = await res.text()
      let parsed: Partial<UploadResult> | null = null
      if (raw) {
        try {
          parsed = JSON.parse(raw) as Partial<UploadResult>
        } catch {
          parsed = null
        }
      }

      if (parsed && typeof parsed === 'object') {
        setResult({
          message: parsed.message || (res.ok ? '上传成功' : '上传失败'),
          code: typeof parsed.code === 'number' ? parsed.code : (res.ok ? 0 : res.status || 500),
          httpStatus: res.status,
          details: parsed.details,
          data: parsed.data,
        })
      } else {
        setResult({
          message: res.ok ? '上传成功' : `上传失败（HTTP ${res.status}）`,
          code: res.ok ? 0 : (res.status || 500),
          httpStatus: res.status,
          details: raw || res.statusText || '服务端未返回详细信息',
        })
      }
    } catch (error) {
      setResult({
        message: '提交失败',
        code: 500,
        details: error instanceof Error ? error.message : '网络异常或服务不可用',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">歌曲上传管理</h1>
        <p className="text-white/60 text-sm mb-8">
          上传到 GitHub 仓库 <code className="bg-white/10 px-1.5 py-0.5 rounded">dcdlove/oss</code>，并自动更新播放列表文件。
        </p>

        <section className="mb-6 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-cyan-200 mb-2">Token 使用说明</h2>

          <details className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <summary className="cursor-pointer text-sm text-white/90">
              如何获取 GitHub Token（Fine-grained PAT）
            </summary>
            <div className="mt-3 text-xs text-white/75 space-y-2 leading-6">
              <p>1. 打开 GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens。</p>
              <p>2. 点击 Generate new token，Resource owner 选择你的账号，Repository 选择 <code className="bg-white/10 px-1 rounded">dcdlove/oss</code>。</p>
              <p>3. Repository permissions 里至少开启：Contents = Read and write，Metadata = Read-only。</p>
              <p>4. 生成后复制 token，保存到服务端环境变量 <code className="bg-white/10 px-1 rounded">GITHUB_TOKEN</code>（Vercel 或本地 .env.local）。</p>
              <p>5. 另外设置一个独立的 <code className="bg-white/10 px-1 rounded">ADMIN_TOKEN</code> 作为本页面提交口令。</p>
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noreferrer"
                className="inline-block text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
              >
                直达 GitHub Fine-grained Token 创建页
              </a>
            </div>
          </details>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6">
          <label className="block space-y-1">
            <span className="text-sm text-white/70">管理口令 (ADMIN_TOKEN)</span>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-md border border-white/20 text-white/80 hover:bg-white/10"
                aria-label={showToken ? '隐藏口令' : '显示口令'}
              >
                {showToken ? '隐藏' : '显示'}
              </button>
            </div>
          </label>

          <div>
            <label className="block space-y-1">
              <span className="text-sm text-white/70">歌手</span>
              <input
                value={singer}
                onChange={(e) => setSinger(e.target.value)}
                className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-white/70">歌曲名</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm text-white/70">歌曲文件</span>
              <input
                type="file"
                accept=".mp3"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null
                  setFile(selectedFile)
                  if (!selectedFile) return

                  const parsed = extractSingerAndTitle(selectedFile.name)
                  if (parsed) {
                    setSinger(parsed.singer)
                    setTitle(parsed.title)
                    return
                  }

                  const baseName = stripSongFileExtension(selectedFile.name)
                  if (baseName) {
                    setTitle(baseName)
                  }
                }}
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:bg-cyan-500/20 file:text-cyan-200 hover:file:bg-cyan-500/30"
                required
              />
              <p className="text-xs text-white/50">{fileSizeText}</p>
              <p className="text-xs text-white/50">选择文件后会自动尝试从文件名解析“歌手-歌名”，最终上传文件名固定为 .lkmp3</p>
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="rounded"
            />
            文件同名时覆盖
          </label>

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-cyan-500/80 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-semibold"
          >
            {uploading ? '上传中...' : '上传并更新播放列表'}
          </button>
        </form>

        {result && (
          <section className={`mt-6 rounded-2xl border p-4 ${
            result.code === 0 ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10'
          }`}>
            <p className="font-semibold mb-2">结果：{result.message}</p>
            {typeof result.httpStatus === 'number' && (
              <p className="text-sm text-white/70 mb-2">HTTP 状态：{result.httpStatus}</p>
            )}
            {result.details && (
              <p className="text-sm text-white/70 mb-2">详情：{result.details}</p>
            )}
            {result.data && (
              <pre className="text-xs whitespace-pre-wrap break-all text-white/80">{JSON.stringify(result.data, null, 2)}</pre>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
