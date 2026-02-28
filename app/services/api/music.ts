/**
 * 音乐 API 服务
 * 封装音乐相关的 API 调用逻辑
 */

import { apiClient, ApiError } from './client'
import { Song } from '@/app/types'

/**
 * 原始歌曲数据 (从 data.json 获取)
 */
interface RawSongData {
  singer: string
  title: string
  ext: string
}

/**
 * 播放列表响应
 */
interface PlaylistResponse {
  rows: RawSongData[]
}

/**
 * CDN 配置
 */
const CDN_CONFIG = {
  /** jsDelivr CDN 基础 URL */
  jsdelivr: 'https://cdn.jsdelivr.net/gh/dcdlove/oss/music',
  /** 本地代理 API 路径 */
  proxyPath: '/api/res2',
  /** 默认代理域名 */
  defaultProxy: 'ghfast.top',
} as const

/**
 * 检测是否为移动端
 */
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  const userAgent = navigator.userAgent
  const mobileAgents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
  return mobileAgents.some((agent) => userAgent.includes(agent))
}

/**
 * 构建歌曲 URL
 * @param song - 原始歌曲数据
 * @param isMobile - 是否移动端
 * @returns 处理后的歌曲信息
 */
const buildSongUrls = (song: RawSongData, isMobile: boolean): Song => {
  const fileName = `${song.singer}-${song.title}.lk${song.ext.replace('.', '')}`

  // 移动端使用代理 API（URL 不需要整体编码）
  // PC 端使用 CDN 直链（需要编码后由使用方解码）
  const url = isMobile
    ? `/api/res2?name=${encodeURIComponent(encodeURIComponent(song.singer))}-${encodeURIComponent(encodeURIComponent(song.title))}.lk${song.ext.replace('.', '')}`
    : encodeURIComponent(`${CDN_CONFIG.jsdelivr}/${fileName}`)

  // 备用地址始终使用 CDN（编码）
  const url2 = encodeURIComponent(`${CDN_CONFIG.jsdelivr}/${fileName}`)

  return {
    ...song,
    url,
    url2,
  }
}

/**
 * 音乐 API 服务
 */
export const musicApi = {
  /**
   * 获取播放列表
   * @param dataUrl - 数据文件路径，默认为 './data.json'
   */
  async fetchPlaylist(dataUrl: string = './data.json'): Promise<Song[]> {
    const response = await apiClient.get<PlaylistResponse>(dataUrl)

    if (!response.rows || !Array.isArray(response.rows)) {
      throw new ApiError('无效的播放列表数据格式', 500, 'Invalid Data')
    }

    const isMobile = isMobileDevice()
    return response.rows.map((song) => buildSongUrls(song, isMobile))
  },

  /**
   * 构建音频流 URL
   * @param fileName - 文件名 (如 "歌手-歌曲名.lkmp3")
   * @param proxy - 代理域名
   */
  buildAudioStreamUrl(fileName: string, proxy: string = CDN_CONFIG.defaultProxy): string {
    return `${CDN_CONFIG.proxyPath}?name=${encodeURIComponent(fileName)}&proxy=${proxy}`
  },

  /**
   * 获取 CDN 直链
   * @param singer - 歌手名
   * @param title - 歌曲名
   * @param ext - 扩展名
   */
  getCdnUrl(singer: string, title: string, ext: string): string {
    return `${CDN_CONFIG.jsdelivr}/${singer}-${title}.lk${ext.replace('.', '')}`
  },
}
