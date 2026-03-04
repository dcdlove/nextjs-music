import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getGitHubRepoConfig, getRepoFile } from '@/app/server/githubContents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PlaylistPayload {
  message?: string
  code?: number
  rows: Array<{
    singer: string
    title: string
    ext: string
    null?: boolean
  }>
}

function normalizePlaylistPayload(input: unknown): PlaylistPayload | null {
  if (!input || typeof input !== 'object') return null
  const rows = (input as { rows?: unknown }).rows
  if (!Array.isArray(rows)) return null

  return {
    message: (input as { message?: string }).message || '成功',
    code: (input as { code?: number }).code ?? 0,
    rows: rows as PlaylistPayload['rows'],
  }
}

async function readLocalPlaylist(): Promise<PlaylistPayload> {
  const localPath = path.join(process.cwd(), 'public', 'data.json')
  const content = await fs.readFile(localPath, 'utf8')
  const parsed = JSON.parse(content)
  const normalized = normalizePlaylistPayload(parsed)

  if (!normalized) {
    throw new Error('Invalid local playlist format')
  }

  return normalized
}

export async function GET() {
  try {
    const config = getGitHubRepoConfig()
    const remoteFile = await getRepoFile(config.playlistPath, config, { allowNotFound: true })

    if (remoteFile) {
      const parsed = JSON.parse(remoteFile.text)
      const normalized = normalizePlaylistPayload(parsed)
      if (normalized) {
        return NextResponse.json(normalized, {
          headers: {
            'Cache-Control': 'no-store',
          },
        })
      }
    }
  } catch (error) {
    console.warn('[playlist] failed to fetch remote playlist, falling back to local file:', error)
  }

  try {
    const localPlaylist = await readLocalPlaylist()
    return NextResponse.json(localPlaylist, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { message: '播放列表读取失败', code: 500, rows: [] },
      { status: 500 }
    )
  }
}

