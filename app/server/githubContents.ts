import 'server-only'

export interface GitHubRepoConfig {
  owner: string
  repo: string
  branch: string
  token: string
  musicDir: string
  playlistPath: string
  avatarDir: string
  avatarMapPath: string
}

interface GitHubContentResponse {
  sha: string
  content: string
  encoding: string
}

interface PutContentResponse {
  content: {
    sha: string
    path: string
  }
  commit: {
    sha: string
  }
}

export class GitHubContentsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  ) {
    super(message)
    this.name = 'GitHubContentsError'
  }
}

const GITHUB_API_BASE = 'https://api.github.com'

function trimPath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}

function encodePath(path: string): string {
  return trimPath(path).split('/').map(encodeURIComponent).join('/')
}

function buildContentUrl(config: GitHubRepoConfig, filePath: string): string {
  return `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${encodePath(filePath)}`
}

function buildReadUrl(config: GitHubRepoConfig, filePath: string): string {
  return `${buildContentUrl(config, filePath)}?ref=${encodeURIComponent(config.branch)}`
}

function getHeaders(token?: string, extra?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const data = await response.json() as { message?: string }
    return data.message || response.statusText
  } catch {
    return response.statusText
  }
}

export function getGitHubRepoConfig(): GitHubRepoConfig {
  const owner = process.env.GITHUB_OWNER || 'dcdlove'
  const repo = process.env.GITHUB_REPO || 'oss'
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token = process.env.GITHUB_TOKEN || ''
  const musicDir = trimPath(process.env.GITHUB_MUSIC_DIR || 'music')
  const playlistPath = trimPath(process.env.GITHUB_PLAYLIST_PATH || `${musicDir}/data.json`)
  const avatarDir = trimPath(process.env.GITHUB_AVATAR_DIR || 'img')
  const avatarMapPath = trimPath(process.env.GITHUB_AVATAR_MAP_PATH || `${avatarDir}/singer-avatars.json`)

  return {
    owner,
    repo,
    branch,
    token,
    musicDir,
    playlistPath,
    avatarDir,
    avatarMapPath,
  }
}

export function assertGitHubToken(config: GitHubRepoConfig): void {
  if (!config.token) {
    throw new GitHubContentsError('Missing GITHUB_TOKEN environment variable', 500)
  }
}

export interface RepoFile {
  sha: string
  text: string
}

export async function getRepoFile(
  filePath: string,
  config: GitHubRepoConfig,
  options?: { allowNotFound?: boolean }
): Promise<RepoFile | null> {
  const response = await fetch(buildReadUrl(config, filePath), {
    method: 'GET',
    headers: getHeaders(config.token || undefined),
    cache: 'no-store',
  })

  if (response.status === 404 && options?.allowNotFound) {
    return null
  }

  if (!response.ok) {
    const details = await readErrorBody(response)
    throw new GitHubContentsError(`Failed to read file: ${filePath}`, response.status, details)
  }

  const data = await response.json() as GitHubContentResponse

  // For binary files, GitHub may return encoding: "none" or other values
  // Only decode if it's base64 encoded
  if (data.encoding !== 'base64') {
    // Return minimal info for non-base64 files (binary files like audio)
    return { sha: data.sha, text: '' }
  }

  const text = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')
  return { sha: data.sha, text }
}

export async function putRepoFile(params: {
  filePath: string
  content: string | Buffer
  message: string
  config: GitHubRepoConfig
  sha?: string
}): Promise<{ sha: string; commitSha: string; path: string }> {
  const { filePath, content, message, config, sha } = params
  assertGitHubToken(config)

  const base64Content = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content, 'utf8').toString('base64')

  const response = await fetch(buildContentUrl(config, filePath), {
    method: 'PUT',
    headers: getHeaders(config.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!response.ok) {
    const details = await readErrorBody(response)
    throw new GitHubContentsError(`Failed to write file: ${filePath}`, response.status, details)
  }

  const data = await response.json() as PutContentResponse
  return {
    sha: data.content.sha,
    commitSha: data.commit.sha,
    path: data.content.path,
  }
}

export async function deleteRepoFile(params: {
  filePath: string
  sha: string
  message: string
  config: GitHubRepoConfig
}): Promise<void> {
  const { filePath, sha, message, config } = params
  assertGitHubToken(config)

  const response = await fetch(buildContentUrl(config, filePath), {
    method: 'DELETE',
    headers: getHeaders(config.token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      sha,
      branch: config.branch,
    }),
  })

  if (!response.ok) {
    const details = await readErrorBody(response)
    throw new GitHubContentsError(`Failed to delete file: ${filePath}`, response.status, details)
  }
}
