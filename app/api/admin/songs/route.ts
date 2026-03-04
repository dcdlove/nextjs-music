import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import {
  deleteRepoFile,
  getGitHubRepoConfig,
  getRepoFile,
  GitHubContentsError,
  putRepoFile,
} from '@/app/server/githubContents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PlaylistRow {
  singer: string
  title: string
  ext: string
  null?: boolean
}

interface PlaylistPayload {
  message: string
  code: number
  rows: PlaylistRow[]
}

function normalizeName(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
}

function getAdminTokenFromRequest(req: NextRequest, formData: FormData): string {
  const fromHeader = req.headers.get('x-admin-token')
  if (fromHeader) return fromHeader

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim()
  }

  const fromBody = formData.get('token')
  return typeof fromBody === 'string' ? fromBody : ''
}

function getUploadLimitMb(): number {
  const fallback = process.env.VERCEL ? 4 : 80
  const configured = Number(process.env.MAX_UPLOAD_MB || fallback)
  if (!Number.isFinite(configured) || configured <= 0) {
    return fallback
  }
  return configured
}

function normalizePlaylist(input: unknown): PlaylistPayload {
  if (!input || typeof input !== 'object') {
    return { message: '成功', code: 0, rows: [] }
  }

  const rows = Array.isArray((input as { rows?: unknown }).rows)
    ? ((input as { rows: PlaylistRow[] }).rows)
    : []

  return {
    message: (input as { message?: string }).message || '成功',
    code: (input as { code?: number }).code ?? 0,
    rows,
  }
}

function buildSongFileName(singer: string, title: string): string {
  return `${singer}-${title}.lkmp3`
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const expectedToken = process.env.ADMIN_TOKEN || ''
  const requestToken = getAdminTokenFromRequest(req, formData)

  if (!expectedToken) {
    return NextResponse.json(
      { message: '服务端未配置 ADMIN_TOKEN', code: 500 },
      { status: 500 }
    )
  }

  if (requestToken !== expectedToken) {
    return NextResponse.json(
      { message: '无权限上传', code: 401 },
      { status: 401 }
    )
  }

  const singerInput = formData.get('singer')
  const titleInput = formData.get('title')
  const fileInput = formData.get('file')
  const overwriteInput = formData.get('overwrite')

  if (typeof singerInput !== 'string' || typeof titleInput !== 'string') {
    return NextResponse.json(
      { message: '缺少 singer 或 title', code: 400 },
      { status: 400 }
    )
  }

  if (!(fileInput instanceof File)) {
    return NextResponse.json(
      { message: '缺少上传文件', code: 400 },
      { status: 400 }
    )
  }

  const singer = normalizeName(singerInput)
  const title = normalizeName(titleInput)
  if (!singer || !title) {
    return NextResponse.json(
      { message: '歌手名和歌曲名不能为空', code: 400 },
      { status: 400 }
    )
  }

  const originalExt = path.extname(fileInput.name).toLowerCase()
  if (originalExt !== '.mp3' && originalExt !== '.lkmp3') {
    return NextResponse.json(
      { message: '仅支持上传 mp3 文件', code: 400 },
      { status: 400 }
    )
  }
  const fileExt = '.mp3'

  const maxUploadMb = getUploadLimitMb()
  const maxUploadBytes = maxUploadMb * 1024 * 1024
  if (fileInput.size > maxUploadBytes) {
    return NextResponse.json(
      { message: `文件大小超过限制（${maxUploadMb}MB）`, code: 413 },
      { status: 413 }
    )
  }

  const config = getGitHubRepoConfig()
  const songFileName = buildSongFileName(singer, title)
  const songPath = `${config.musicDir}/${songFileName}`
  const overwrite = String(overwriteInput || '').toLowerCase() === 'true'

  try {
    const existingSong = await getRepoFile(songPath, config, { allowNotFound: true })
    if (existingSong && !overwrite) {
      return NextResponse.json(
        { message: '文件已存在，如需覆盖请勾选 overwrite', code: 409 },
        { status: 409 }
      )
    }

    const fileBuffer = Buffer.from(await fileInput.arrayBuffer())
    const uploadResult = await putRepoFile({
      filePath: songPath,
      content: fileBuffer,
      message: existingSong
        ? `chore(music): update ${songFileName}`
        : `feat(music): add ${songFileName}`,
      config,
      sha: existingSong?.sha,
    })

    let playlistUpdated = false
    try {
      const playlistFile = await getRepoFile(config.playlistPath, config, { allowNotFound: true })
      const playlist = normalizePlaylist(playlistFile ? JSON.parse(playlistFile.text) : null)
      const row: PlaylistRow = { singer, title, ext: fileExt, null: false }

      const existingIndex = playlist.rows.findIndex(
        item => item.singer === singer && item.title === title
      )

      if (existingIndex >= 0) {
        playlist.rows[existingIndex] = {
          ...playlist.rows[existingIndex],
          ...row,
        }
      } else {
        playlist.rows.push(row)
      }

      await putRepoFile({
        filePath: config.playlistPath,
        content: `${JSON.stringify(playlist, null, 2)}\n`,
        message: existingIndex >= 0
          ? `chore(playlist): update ${singer}-${title}`
          : `feat(playlist): add ${singer}-${title}`,
        config,
        sha: playlistFile?.sha,
      })
      playlistUpdated = true
    } catch (playlistError) {
      if (!existingSong) {
        try {
          await deleteRepoFile({
            filePath: songPath,
            sha: uploadResult.sha,
            message: `revert(music): rollback ${songFileName}`,
            config,
          })
        } catch (rollbackError) {
          console.error('Failed to rollback uploaded file:', rollbackError)
        }
      }
      throw playlistError
    }

    return NextResponse.json({
      message: '上传成功',
      code: 0,
      data: {
        singer,
        title,
        ext: fileExt,
        fileName: songFileName,
        songPath,
        playlistPath: config.playlistPath,
        playlistUpdated,
      },
    })
  } catch (error) {
    if (error instanceof GitHubContentsError) {
      return NextResponse.json(
        { message: error.message, code: error.status, details: error.details },
        { status: error.status }
      )
    }

    const message = error instanceof Error ? error.message : '上传失败'
    return NextResponse.json(
      { message, code: 500 },
      { status: 500 }
    )
  }
}
