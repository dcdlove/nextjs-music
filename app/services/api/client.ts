/**
 * API 客户端基础模块
 * 提供统一的请求封装和错误处理
 */

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 请求配置
 */
interface RequestConfig extends RequestInit {
  timeout?: number
}

/**
 * 默认超时时间 (毫秒)
 */
const DEFAULT_TIMEOUT = 30000

/**
 * 创建带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  config: RequestConfig = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchConfig } = config

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 处理响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      `请求失败: ${response.statusText}`,
      response.status,
      response.statusText
    )
  }

  // 检查内容类型
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>
  }

  // 非 JSON 响应返回原始文本
  return response.text() as Promise<T>
}

/**
 * API 客户端
 */
export const apiClient = {
  /**
   * GET 请求
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await fetchWithTimeout(url, {
      ...config,
      method: 'GET',
    })
    return handleResponse<T>(response)
  },

  /**
   * POST 请求
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetchWithTimeout(url, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  },
}
