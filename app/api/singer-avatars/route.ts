import { NextResponse } from 'next/server'
import { getGitHubRepoConfig, getRepoFile } from '@/app/server/githubContents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AvatarMap = Record<string, string>

function normalizeAvatarMap(input: unknown): AvatarMap | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null
  }

  const result: AvatarMap = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim()) {
      result[key.trim()] = value.trim()
    }
  }
  return result
}

function buildRawFileUrl(owner: string, repo: string, branch: string, filePath: string): string {
  const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`
}

async function readAvatarMapFromRaw(config: ReturnType<typeof getGitHubRepoConfig>): Promise<AvatarMap | null> {
  const rawUrl = buildRawFileUrl(config.owner, config.repo, config.branch, config.avatarMapPath)
  const response = await fetch(rawUrl, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const text = await response.text()
  const parsed = JSON.parse(text)
  return normalizeAvatarMap(parsed)
}

export async function GET() {
  const config = getGitHubRepoConfig()

  try {
    const remoteFile = await getRepoFile(config.avatarMapPath, config, { allowNotFound: true })

    if (remoteFile) {
      const parsed = JSON.parse(remoteFile.text)
      const normalized = normalizeAvatarMap(parsed)
      if (normalized) {
        return NextResponse.json(normalized, {
          headers: {
            'Cache-Control': 'no-store',
            'x-avatar-map-source': 'github-contents',
          },
        })
      }
    }
  } catch (error) {
    console.warn('[avatar-map] failed to fetch remote avatar map:', error)
  }

  try {
    const rawAvatarMap = await readAvatarMapFromRaw(config)
    if (rawAvatarMap) {
      return NextResponse.json(rawAvatarMap, {
        headers: {
          'Cache-Control': 'no-store',
          'x-avatar-map-source': 'github-raw',
        },
      })
    }
  } catch (error) {
    console.warn('[avatar-map] failed to fetch avatar map from raw.githubusercontent.com:', error)
  }

  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'x-avatar-map-source': 'empty',
    },
  })
}
