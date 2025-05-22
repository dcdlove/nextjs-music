// app/api/res/route.ts
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || ''
    const proxy = searchParams.get('proxy') || 'ghfast.top'

    const rangeHeader = req.headers.get('range') // 获取 Range 头
    const url = `https://${proxy}/https://github.com/dcdlove/oss/blob/main/music/${name}`

    try {
        const upstreamRes = await fetch(url, {
            headers: {
                accept: "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "i",
                "range": rangeHeader,
                "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "audio",
                "sec-fetch-mode": "no-cors",
                "sec-fetch-site": "cross-site",
                "sec-fetch-storage-access": "none",
                "Referer": "https://nextjs-music-xi.vercel.app/",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
        })

        if (!upstreamRes.ok && upstreamRes.status !== 206) {
            return new Response(`Fetch failed: ${upstreamRes.status}`, {
                status: upstreamRes.status,
            })
        }

        const headers = new Headers()
        // 只复制必要响应头，避免跨域问题
        const passHeaders = [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
            'content-disposition',
            'cache-control',
        ]
        passHeaders.forEach((key) => {
            const value = upstreamRes.headers.get(key)
            if (value) headers.set(key, value)
        })

        // 🚀 核心：直接转发 ReadableStream 流体，保证 fetch 响应边下边播
        return new Response(upstreamRes.body, {
            status: upstreamRes.status,
            headers,
        })

    } catch (err) {
        console.error('Fetch error:', err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
