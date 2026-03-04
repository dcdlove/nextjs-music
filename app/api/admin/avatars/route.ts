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

type AvatarMap = Record<string, string>

const ALLOWED_AVATAR_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.svg',
])

function normalizeSingerName(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
}

function sanitizeFileBaseName(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .replace(/\.+$/g, '')
}

function normalizeAvatarMap(input: unknown): AvatarMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const result: AvatarMap = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim()) {
      result[key.trim()] = value.trim()
    }
  }
  return result
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

function getAvatarUploadLimitMb(): number {
  const fallback = process.env.VERCEL ? 2 : 20
  const configured = Number(process.env.MAX_AVATAR_UPLOAD_MB || fallback)
  if (!Number.isFinite(configured) || configured <= 0) {
    return fallback
  }
  return configured
}

function buildRawGitHubUrl(owner: string, repo: string, branch: string, filePath: string): string {
  const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`
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
  const fileInput = formData.get('file')
  const overwriteInput = formData.get('overwrite')

  if (typeof singerInput !== 'string') {
    return NextResponse.json(
      { message: '缺少 singer', code: 400 },
      { status: 400 }
    )
  }

  if (!(fileInput instanceof File)) {
    return NextResponse.json(
      { message: '缺少上传文件', code: 400 },
      { status: 400 }
    )
  }

  const singer = normalizeSingerName(singerInput)
  if (!singer) {
    return NextResponse.json(
      { message: '歌手名不能为空', code: 400 },
      { status: 400 }
    )
  }

  const originalExt = path.extname(fileInput.name).toLowerCase()
  if (!ALLOWED_AVATAR_EXTENSIONS.has(originalExt)) {
    return NextResponse.json(
      { message: '头像仅支持 jpg/jpeg/png/webp/gif/avif/svg', code: 400 },
      { status: 400 }
    )
  }

  const maxUploadMb = getAvatarUploadLimitMb()
  const maxUploadBytes = maxUploadMb * 1024 * 1024
  if (fileInput.size > maxUploadBytes) {
    return NextResponse.json(
      { message: `文件大小超过限制（${maxUploadMb}MB）`, code: 413 },
      { status: 413 }
    )
  }

  const config = getGitHubRepoConfig()
  const safeSingerFileName = sanitizeFileBaseName(singer)
  if (!safeSingerFileName) {
    return NextResponse.json(
      { message: '歌手名无效，无法生成文件名', code: 400 },
      { status: 400 }
    )
  }

  const avatarFileName = `${safeSingerFileName}${originalExt}`
  const avatarPath = `${config.avatarDir}/${avatarFileName}`
  const overwrite = String(overwriteInput || '').toLowerCase() === 'true'

  try {
    const existingAvatar = await getRepoFile(avatarPath, config, { allowNotFound: true })
    if (existingAvatar && !overwrite) {
      return NextResponse.json(
        { message: '头像文件已存在，如需覆盖请勾选 overwrite', code: 409 },
        { status: 409 }
      )
    }

    const fileBuffer = Buffer.from(await fileInput.arrayBuffer())
    const uploadResult = await putRepoFile({
      filePath: avatarPath,
      content: fileBuffer,
      message: existingAvatar
        ? `chore(avatar): update ${avatarFileName}`
        : `feat(avatar): add ${avatarFileName}`,
      config,
      sha: existingAvatar?.sha,
    })

    let avatarMapUpdated = false
    try {
      const mapFile = await getRepoFile(config.avatarMapPath, config, { allowNotFound: true })
      const avatarMap = normalizeAvatarMap(mapFile ? JSON.parse(mapFile.text) : null)

      const rawUrl = buildRawGitHubUrl(config.owner, config.repo, config.branch, avatarPath)
      avatarMap[singer] = `${rawUrl}?v=${Date.now()}`

      await putRepoFile({
        filePath: config.avatarMapPath,
        content: `${JSON.stringify(avatarMap, null, 2)}\n`,
        message: `chore(avatar-map): set ${singer}`,
        config,
        sha: mapFile?.sha,
      })
      avatarMapUpdated = true
    } catch (avatarMapError) {
      if (!existingAvatar) {
        try {
          await deleteRepoFile({
            filePath: avatarPath,
            sha: uploadResult.sha,
            message: `revert(avatar): rollback ${avatarFileName}`,
            config,
          })
        } catch (rollbackError) {
          console.error('Failed to rollback uploaded avatar file:', rollbackError)
        }
      }
      throw avatarMapError
    }

    return NextResponse.json({
      message: '头像上传成功',
      code: 0,
      data: {
        singer,
        avatarFileName,
        avatarPath,
        avatarMapPath: config.avatarMapPath,
        avatarMapUpdated,
      },
    })
  } catch (error) {
    if (error instanceof GitHubContentsError) {
      return NextResponse.json(
        { message: error.message, code: error.status, details: error.details },
        { status: error.status }
      )
    }

    const message = error instanceof Error ? error.message : '头像上传失败'
    return NextResponse.json(
      { message, code: 500 },
      { status: 500 }
    )
  }
}
