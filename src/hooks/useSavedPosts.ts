import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import type { NormalizedSavedPost, SavedPost } from '../types'

interface UseSavedPostsResult {
  posts: NormalizedSavedPost[]
  loading: boolean
  error: string | null
}

function toBool(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  const normalized = String(value).toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number') return value
  if (value == null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizePost(raw: SavedPost): NormalizedSavedPost {
  const mediaFilesRaw = raw.media_files ?? ''
  const mediaFiles =
    mediaFilesRaw
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      // ignore sidecar text/metadata files
      .filter((name) => {
        const lower = name.toLowerCase()
        return !lower.endsWith('.txt') && !lower.endsWith('.json') && !lower.endsWith('.json.xz')
      }) ?? []

  const hashtagsRaw = raw.hashtags ?? ''
  const hashtags =
    hashtagsRaw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean) ?? []

  const takenAt =
    raw.taken_at_iso && !Number.isNaN(Date.parse(raw.taken_at_iso))
      ? new Date(raw.taken_at_iso)
      : null

  return {
    id: raw.shortcode || raw.json_filename,
    shortcode: raw.shortcode,
    postUrl: raw.post_url,
    takenAt,
    ownerUsername: raw.owner_username,
    ownerFullName: raw.owner_full_name,
    ownerId: raw.owner_id,
    isVideo: toBool(raw.is_video),
    videoDurationSeconds: toNumber(raw.video_duration),
    hasAudio: toBool(raw.has_audio),
    likeCount: toNumber(raw.like_count),
    commentCount: toNumber(raw.comment_count),
    videoViewCount: toNumber(raw.video_view_count),
    videoPlayCount: toNumber(raw.video_play_count),
    musicArtist: raw.music_artist || undefined,
    musicTrack: raw.music_track || undefined,
    usesOriginalAudio: toBool(raw.uses_original_audio),
    captionText: raw.caption_text ?? '',
    hashtags,
    mediaFiles,
    locationName: raw.location_name || undefined,
    locationCity: raw.location_city || undefined,
    locationRegion: raw.location_region || undefined,
    raw,
  }
}

export function useSavedPosts(): UseSavedPostsResult {
  const [posts, setPosts] = useState<NormalizedSavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const parseCsv = (path: string, onError?: () => void) => {
      Papa.parse<SavedPost>(path, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.error('CSV parse errors', results.errors)
          }
          const data = (results.data ?? []).filter((row) => row && row.json_filename)
          const normalized = data.map(normalizePost)
          setPosts(normalized)
          setLoading(false)
        },
        error: (err) => {
          console.error('CSV load error', err)
          if (onError) {
            onError()
            return
          }
          setError(err.message ?? `Failed to load ${path}`)
          setLoading(false)
        },
      })
    }

    // Prefer enriched CSV (adds location columns) when present; fall back to the original.
    parseCsv('/saved_index_with_location.csv', () => parseCsv('/saved_index.csv'))
  }, [])

  return { posts, loading, error }
}


