import { useEffect, useState } from 'react'
import type { NormalizedSavedPost } from '../types'
import './Modal.css'
import './Curation.css'
import type { AnnotationCategory } from '../storage/annotations'

interface ItemDetailModalProps {
  post: NormalizedSavedPost | null
  onClose: () => void
  annotation?: {
    tags: string[]
    notes?: string
    flags: { northstar?: boolean; enjoyWork?: boolean }
    categories?: AnnotationCategory[]
  }
  onAddTag?: (tag: string) => void
  onRemoveTag?: (tag: string) => void
  onSetNotes?: (notes: string) => void
  onSetFlags?: (flags: { northstar?: boolean; enjoyWork?: boolean }) => void
  onSetCategories?: (categories: AnnotationCategory[]) => void
}

export function ItemDetailModal({
  post,
  onClose,
  annotation,
  onAddTag,
  onRemoveTag,
  onSetNotes,
  onSetFlags,
  onSetCategories,
}: ItemDetailModalProps) {
  if (!post) return null

  const categoryHelp: Record<AnnotationCategory, string> = {
    direction_identity:
      'Direction / identity: work that reflects who you want to be professionally (patterns in what you’re drawn to).',
    skill_building:
      'Skill building: techniques, tools, processes, and references you want to learn or practice.',
    opportunity_hunting:
      'Opportunity hunting: leads to pursue—studios, artists, vendors, projects, or places you might reach out to.',
    portfolio_planning:
      'Portfolio planning: portfolio candidates—things you could document, recreate, or ship to show your capabilities.',
  }

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
  const [tagDraft, setTagDraft] = useState('')

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

  const tags = annotation?.tags ?? []
  const notes = annotation?.notes ?? ''
  const northstar = !!annotation?.flags?.northstar
  const enjoyWork = !!annotation?.flags?.enjoyWork
  const categories = annotation?.categories ?? []

  const submitTag = () => {
    const value = tagDraft.trim()
    if (!value || !onAddTag) return
    onAddTag(value)
    setTagDraft('')
  }

  const toggleCategory = (category: AnnotationCategory) => {
    if (!onSetCategories) return
    const next = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category]
    onSetCategories(next)
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

            <div className="curation">
              <div className="curation-categories">
                <div className="curation-subtitle">Lens</div>
                <div className="curation-categories-row">
                  <button
                    type="button"
                    className={
                      categories.includes('direction_identity')
                        ? 'curation-chip active'
                        : 'curation-chip'
                    }
                    onClick={() => toggleCategory('direction_identity')}
                    title={categoryHelp.direction_identity}
                  >
                    Direction / identity
                  </button>
                  <button
                    type="button"
                    className={
                      categories.includes('skill_building') ? 'curation-chip active' : 'curation-chip'
                    }
                    onClick={() => toggleCategory('skill_building')}
                    title={categoryHelp.skill_building}
                  >
                    Skill building
                  </button>
                  <button
                    type="button"
                    className={
                      categories.includes('opportunity_hunting')
                        ? 'curation-chip active'
                        : 'curation-chip'
                    }
                    onClick={() => toggleCategory('opportunity_hunting')}
                    title={categoryHelp.opportunity_hunting}
                  >
                    Opportunity hunting
                  </button>
                  <button
                    type="button"
                    className={
                      categories.includes('portfolio_planning')
                        ? 'curation-chip active'
                        : 'curation-chip'
                    }
                    onClick={() => toggleCategory('portfolio_planning')}
                    title={categoryHelp.portfolio_planning}
                  >
                    Portfolio planning
                  </button>
                </div>
              </div>

              <div className="curation-flags">
                <button
                  type="button"
                  className={northstar ? 'curation-flag active' : 'curation-flag'}
                  onClick={() => onSetFlags?.({ northstar: !northstar })}
                >
                  Northstar
                </button>
                <button
                  type="button"
                  className={enjoyWork ? 'curation-flag active' : 'curation-flag'}
                  onClick={() => onSetFlags?.({ enjoyWork: !enjoyWork })}
                >
                  Enjoy at work
                </button>
              </div>

              <div className="curation-tags">
                <div className="curation-tags-row">
                  {tags.length ? (
                    tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="curation-tag"
                        onClick={() => onRemoveTag?.(t)}
                        title="Remove tag"
                      >
                        {t}
                        <span className="curation-tag-x">×</span>
                      </button>
                    ))
                  ) : (
                    <div className="curation-empty">No tags yet</div>
                  )}
                </div>

                <div className="curation-tag-add">
                  <input
                    className="curation-input"
                    value={tagDraft}
                    placeholder="Add tag (e.g. installation, finish_paint_patina)…"
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitTag()
                    }}
                  />
                  <button type="button" className="curation-add-btn" onClick={submitTag}>
                    Add
                  </button>
                </div>
              </div>

              <div className="curation-notes">
                <textarea
                  className="curation-textarea"
                  value={notes}
                  placeholder="Notes: why saved, technique, how it applies to your work, next step…"
                  onChange={(e) => onSetNotes?.(e.target.value)}
                  rows={6}
                />
              </div>
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


