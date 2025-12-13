import type { NormalizedSavedPost } from '../types'

import './Gallery.css'

interface GalleryItemProps {
  post: NormalizedSavedPost
  onSelect: (post: NormalizedSavedPost) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelected?: (post: NormalizedSavedPost) => void
}

export function GalleryItem({
  post,
  onSelect,
  selectionMode = false,
  isSelected = false,
  onToggleSelected,
}: GalleryItemProps) {
  const imageFile =
    post.mediaFiles.find((name) => /\.(jpe?g|png|webp)$/i.test(name)) ?? post.mediaFiles[0]
  const src = imageFile ? `/saved/${imageFile}` : undefined
  const hasMultiple = post.mediaFiles.length > 1

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelected?.(post)
      return
    }
    onSelect(post)
  }

  return (
    <button
      className={isSelected ? 'gallery-item selected' : 'gallery-item'}
      onClick={handleClick}
      type="button"
      aria-pressed={selectionMode ? isSelected : undefined}
    >
      {src ? (
        <div className="gallery-item-media">
          <img
            src={src}
            alt={post.captionText?.slice(0, 120) || post.shortcode}
            loading="lazy"
          />
          {selectionMode && (
            <div className={isSelected ? 'gallery-item-select active' : 'gallery-item-select'}>
              ✓
            </div>
          )}
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


