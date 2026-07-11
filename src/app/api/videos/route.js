import { NextResponse } from 'next/server'
import { getChannelVideos } from '@/lib/youtube'

export async function GET() {
  try {
    const data = await getChannelVideos()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API/Videos] Error fetching videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
