import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, apiClient } from './client'

// 模拟 fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiError', () => {
  it('创建带有状态码的错误', () => {
    const error = new ApiError('Not Found', 404, 'Not Found')

    expect(error.message).toBe('Not Found')
    expect(error.status).toBe(404)
    expect(error.statusText).toBe('Not Found')
    expect(error.name).toBe('ApiError')
  })
})

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('get', () => {
    it('成功获取 JSON 响应', async () => {
      const mockData = { rows: [{ id: 1 }] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      })

      const result = await apiClient.get('/api/data')

      expect(result).toEqual(mockData)
    })

    it('处理非 JSON 响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('plain text'),
      })

      const result = await apiClient.get('/api/text')

      expect(result).toBe('plain text')
    })

    it('抛出 ApiError 当响应不成功', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(apiClient.get('/api/not-found')).rejects.toThrow(ApiError)
    })

    it('支持自定义超时', async () => {
      // 使用 AbortController 模拟超时
      mockFetch.mockImplementationOnce((url, options) => {
        return new Promise((_, reject) => {
          if (options?.signal) {
            const abortError = new Error('The operation was aborted')
            abortError.name = 'AbortError'
            reject(abortError)
          }
        })
      })

      await expect(
        apiClient.get('/api/slow', { timeout: 1 })
      ).rejects.toThrow()
    })
  })

  describe('post', () => {
    it('发送 JSON 数据', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      })

      const result = await apiClient.post('/api/data', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('发送无 body 的 POST 请求', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      })

      await apiClient.post('/api/action')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/action',
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      )
    })
  })
})
