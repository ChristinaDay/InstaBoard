import { useMemo, useState } from 'react'
import { useSavedPosts } from './hooks/useSavedPosts'
import type { NormalizedSavedPost } from './types'
import { SearchBar } from './components/SearchBar'
import { Gallery } from './components/Gallery'
import { ItemDetailModal } from './components/ItemDetailModal'
import { MapView } from './components/MapView'
import './index.css'

function App() {
  const { posts, loading, error } = useSavedPosts()
  const [query, setQuery] = useState('')
  const [videosOnly, setVideosOnly] = useState(false)
  const [hasLocationOnly, setHasLocationOnly] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [selected, setSelected] = useState<NormalizedSavedPost | null>(null)

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const locQ = locationQuery.trim().toLowerCase()

    return posts.filter((post) => {
      if (videosOnly && !post.isVideo) return false

      const hasLoc = !!(post.locationCity || post.locationRegion || post.locationName)
      if (hasLocationOnly && !hasLoc) return false
      if (locQ) {
        const locHay = [post.locationName ?? '', post.locationCity ?? '', post.locationRegion ?? '']
          .join(' ')
          .toLowerCase()
        if (!locHay.includes(locQ)) return false
      }

      if (!q) return true

      const haystacks = [
        post.captionText,
        post.ownerUsername,
        post.shortcode,
        post.hashtags.join(' '),
        post.locationName ?? '',
        post.locationCity ?? '',
        post.locationRegion ?? '',
      ]

      return haystacks.some((value) => value.toLowerCase().includes(q))
    })
  }, [posts, query, videosOnly, hasLocationOnly, locationQuery])

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Insta-Board</h1>
          <p>Local, private moodboard built from your Instagram saved posts.</p>
        </div>
      </header>

      <main className="app-main">
        <div className="app-view-toggle" role="tablist" aria-label="View toggle">
          <button
            type="button"
            className={view === 'grid' ? 'app-view-toggle-btn active' : 'app-view-toggle-btn'}
            onClick={() => setView('grid')}
            role="tab"
            aria-selected={view === 'grid'}
          >
            Grid
          </button>
          <button
            type="button"
            className={view === 'map' ? 'app-view-toggle-btn active' : 'app-view-toggle-btn'}
            onClick={() => setView('map')}
            role="tab"
            aria-selected={view === 'map'}
          >
            Map
          </button>
        </div>

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          videosOnly={videosOnly}
          onVideosOnlyChange={setVideosOnly}
          hasLocationOnly={hasLocationOnly}
          onHasLocationOnlyChange={setHasLocationOnly}
          locationQuery={locationQuery}
          onLocationQueryChange={setLocationQuery}
        />

        {loading && <p className="status-text">Loading saved posts…</p>}
        {error && !loading && <p className="status-text error">Error: {error}</p>}
        {!loading && !error && view === 'grid' && (
          <Gallery posts={filteredPosts} onSelect={(post) => setSelected(post)} />
        )}
        {!loading && !error && view === 'map' && (
          <MapView posts={filteredPosts} onSelect={(post) => setSelected(post)} />
        )}
      </main>

      <ItemDetailModal post={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default App
