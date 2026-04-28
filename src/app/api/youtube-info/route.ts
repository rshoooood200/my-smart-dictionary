import { NextRequest, NextResponse } from 'next/server'

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null
  
  // Clean the URL
  url = url.trim()
  
  // Patterns for different YouTube URL formats
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // Live URL: https://www.youtube.com/live/VIDEO_ID
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  // If the URL is just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }
  
  return null
}

// Helper function to convert any YouTube URL to embed URL
function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

// Helper function to get thumbnail URLs
function getThumbnailUrls(videoId: string) {
  return {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  
  const videoId = extractYouTubeId(url)
  
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }
  
  try {
    // Try to fetch video info using noembed (free, no API key needed)
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    
    const response = await fetch(noembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      
      const thumbnails = getThumbnailUrls(videoId)
      
      return NextResponse.json({
        success: true,
        videoId,
        embedUrl: getEmbedUrl(videoId),
        title: data.title || '',
        authorName: data.author_name || '',
        authorUrl: data.author_url || '',
        thumbnail: thumbnails.high,
        thumbnails,
        duration: null,
        provider: 'youtube'
      })
    }
    
    // Fallback: just return the basic info we can derive
    const thumbnails = getThumbnailUrls(videoId)
    
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: getEmbedUrl(videoId),
      title: '',
      authorName: '',
      authorUrl: '',
      thumbnail: thumbnails.high,
      thumbnails,
      duration: null,
      provider: 'youtube'
    })
    
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    
    // Return basic info even on error
    const thumbnails = getThumbnailUrls(videoId)
    
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: getEmbedUrl(videoId),
      title: '',
      authorName: '',
      authorUrl: '',
      thumbnail: thumbnails.high,
      thumbnails,
      duration: null,
      provider: 'youtube',
      warning: 'Could not fetch full video info'
    })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url } = body
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }
  
  const videoId = extractYouTubeId(url)
  
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
  }
  
  try {
    // Try to fetch video info using noembed
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    
    const response = await fetch(noembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      const thumbnails = getThumbnailUrls(videoId)
      
      return NextResponse.json({
        success: true,
        videoId,
        embedUrl: getEmbedUrl(videoId),
        title: data.title || '',
        authorName: data.author_name || '',
        authorUrl: data.author_url || '',
        thumbnail: thumbnails.high,
        thumbnails,
        duration: null,
        provider: 'youtube'
      })
    }
    
    // Fallback
    const thumbnails = getThumbnailUrls(videoId)
    
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: getEmbedUrl(videoId),
      title: '',
      thumbnail: thumbnails.high,
      thumbnails,
      duration: null,
      provider: 'youtube'
    })
    
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    
    const thumbnails = getThumbnailUrls(videoId)
    
    return NextResponse.json({
      success: true,
      videoId,
      embedUrl: getEmbedUrl(videoId),
      title: '',
      thumbnail: thumbnails.high,
      thumbnails,
      duration: null,
      provider: 'youtube',
      warning: 'Could not fetch full video info'
    })
  }
}
