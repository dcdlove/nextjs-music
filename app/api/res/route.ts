// app/api/res/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || ''
    const proxy = searchParams.get('proxy') || 'ghfast.top'

    const rangeHeader = req.headers.get('range') // 获取 Range 头
    const url = `https://${proxy}/https://github.com/dcdlove/oss/blob/main/music/${name}`



    try {
        console.log('Fetching:', url, 'Range:', rangeHeader)

        console.log('Fetch status:开始', proxy, url)
        const res = await fetch(url, {
            headers: {
                "accept": "*/*",
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
            "body": null,
            "method": "GET"
        })

      

        if (!res.ok && res.status !== 206) {
            return new NextResponse(`Fetch failed: ${res.status}`, { status: res.status })
        }

        const headers = new Headers({
            'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
            'Content-Length': res.headers.get('Content-Length') || '',
            'Accept-Ranges': res.headers.get('Accept-Ranges') || 'bytes',
        })

        // 如果是部分内容，还要加上 Content-Range
        const contentRange = res.headers.get('Content-Range')
        if (contentRange) {
            headers.set('Content-Range', contentRange)
            return new NextResponse(res.body, {
                status: 206,
                headers,
            })
        }

        return new NextResponse(res.body, {
            status: 200,
            headers,
        })

    } catch (err) {
        console.error('Fetch error:', err)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
