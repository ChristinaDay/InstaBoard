import Masonry from 'react-masonry-css'
import type { NormalizedSavedPost } from '../types'
import { GalleryItem } from './GalleryItem'

import './Gallery.css'

interface GalleryProps {
  posts: NormalizedSavedPost[]
  onSelect: (post: NormalizedSavedPost) => void
}

const breakpointColumns = {
  default: 5,
  1400: 4,
  1024: 3,
  768: 2,
  480: 1,
}

export function Gallery({ posts, onSelect }: GalleryProps) {
  if (!posts.length) {
    return <p className="gallery-empty">No saved posts match your filters.</p>
  }

  return (
    <div className="gallery">
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {posts.map((post) => (
          <GalleryItem key={post.id} post={post} onSelect={onSelect} />
        ))}
      </Masonry>
    </div>
  )
}


