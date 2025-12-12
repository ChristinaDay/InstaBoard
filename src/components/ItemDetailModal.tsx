import { useEffect, useState } from 'react'
import type { NormalizedSavedPost } from '../types'
import './Modal.css'

interface ItemDetailModalProps {
  post: NormalizedSavedPost | null
  onClose: () => void
}

export function ItemDetailModal({ post, onClose }: ItemDetailModalProps) {
  if (!post) return null

  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset to first slide whenever a new post is opened
  useEffect(() => {
    setCurrentIndex(0)
  }, [post.id])

  const mediaFiles = post.mediaFiles
  const totalSlides = mediaFiles.length

  const currentFile = mediaFiles[currentIndex] ?? mediaFiles[0]
  const isVideo = !!currentFile && /\.(mp4|mov|webm|m4v)$/i.test(currentFile)
  const src = currentFile ? `/saved/${currentFile}` : undefined
  const hasMultiple = totalSlides > 1
  const locationParts = [post.locationCity, post.locationRegion].filter(Boolean)
  const locationDisplay = locationParts.join(', ')

  const goPrev = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!totalSlides) return
    setCurrentIndex((index) => (index - 1 + totalSlides) % totalSlides)
  }

  const goNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!totalSlides) return
    setCurrentIndex((index) => (index + 1) % totalSlides)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
          ×
        </button>
        <div className="modal-content">
          {src && (
            <div className="modal-media">
              {isVideo ? (
                <video src={src} controls playsInline />
              ) : (
                <img src={src} alt={post.captionText || post.shortcode} />
              )}
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    className="modal-nav modal-nav-prev"
                    onClick={goPrev}
                    aria-label="Previous media"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="modal-nav modal-nav-next"
                    onClick={goNext}
                    aria-label="Next media"
                  >
                    ›
                  </button>
                  <div className="modal-counter">
                    {currentIndex + 1} / {totalSlides}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="modal-meta">
            <div className="modal-owner">
              <div className="modal-owner-username">@{post.ownerUsername}</div>
              {post.ownerFullName && <div className="modal-owner-name">{post.ownerFullName}</div>}
              {locationDisplay && <div className="modal-owner-name">{locationDisplay}</div>}
            </div>
            {post.captionText && <p className="modal-caption">{post.captionText}</p>}
            {post.hashtags.length > 0 && (
              <div className="modal-hashtags">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="modal-hashtag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="modal-footer">
              <a href={post.postUrl} target="_blank" rel="noreferrer">
                Open on Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


