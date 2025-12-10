import type { NormalizedSavedPost } from '../types'

import './Gallery.css'

interface GalleryItemProps {
  post: NormalizedSavedPost
  onSelect: (post: NormalizedSavedPost) => void
}

export function GalleryItem({ post, onSelect }: GalleryItemProps) {
  const imageFile =
    post.mediaFiles.find((name) => /\.(jpe?g|png|webp)$/i.test(name)) ?? post.mediaFiles[0]
  const src = imageFile ? `/saved/${imageFile}` : undefined
  const hasMultiple = post.mediaFiles.length > 1

  return (
    <button className="gallery-item" onClick={() => onSelect(post)} type="button">
      {src ? (
        <div className="gallery-item-media">
          <img
            src={src}
            alt={post.captionText?.slice(0, 120) || post.shortcode}
            loading="lazy"
          />
          {hasMultiple && (
            <div className="gallery-item-badge gallery-item-badge-multi" aria-label="Carousel post">
              ⧉
            </div>
          )}
          {post.isVideo && (
            <div className="gallery-item-badge gallery-item-badge-video" aria-label="Video post">
              ▶
            </div>
          )}
        </div>
      ) : (
        <div className="gallery-item-placeholder">No media</div>
      )}
    </button>
  )
}


