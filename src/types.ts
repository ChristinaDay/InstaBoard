export interface SavedPost {
  json_filename: string
  shortcode: string
  post_url: string
  taken_at_timestamp: string
  taken_at_iso: string
  owner_username: string
  owner_full_name: string
  owner_id: string
  owner_is_private: string
  owner_is_verified: string
  owner_followers: string
  owner_post_count: string
  is_video: string
  video_duration: string
  has_audio: string
  like_count: string
  comment_count: string
  video_view_count: string
  video_play_count: string
  music_artist: string
  music_track: string
  uses_original_audio: string
  caption_text: string
  hashtags: string
  media_files: string
  // Optional: can be added by enriching saved_index.csv from local JSON metadata
  location_name?: string
  location_city?: string
  location_region?: string
  // Optional: can be added by enriching saved_index.csv with local annotations
  my_tags?: string
  my_notes?: string
  my_northstar?: string
  my_lenses?: string
}

export interface NormalizedSavedPost {
  id: string
  shortcode: string
  postUrl: string
  takenAt: Date | null
  ownerUsername: string
  ownerFullName: string
  ownerId: string
  isVideo: boolean
  videoDurationSeconds?: number
  hasAudio: boolean
  likeCount?: number
  commentCount?: number
  videoViewCount?: number
  videoPlayCount?: number
  musicArtist?: string
  musicTrack?: string
  usesOriginalAudio: boolean
  captionText: string
  hashtags: string[]
  mediaFiles: string[]
  locationName?: string
  locationCity?: string
  locationRegion?: string
  myTags?: string[]
  myNotes?: string
  myNorthstar?: boolean
  myLenses?: string[]
  raw: SavedPost
}


