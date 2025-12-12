import { useMemo, useState } from 'react'
import { useSavedPosts } from './hooks/useSavedPosts'
import type { NormalizedSavedPost } from './types'
import { SearchBar } from './components/SearchBar'
import { Gallery } from './components/Gallery'
import { ItemDetailModal } from './components/ItemDetailModal'
import { MapView } from './components/MapView'
import { useAnnotations } from './hooks/useAnnotations'
import './index.css'

function App() {
  const { posts, loading, error } = useSavedPosts()
  const annotations = useAnnotations()
  const [query, setQuery] = useState('')
  const [videosOnly, setVideosOnly] = useState(false)
  const [hasLocationOnly, setHasLocationOnly] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [tagQuery, setTagQuery] = useState('')
  const [northstarOnly, setNorthstarOnly] = useState(false)
  const [enjoyWorkOnly, setEnjoyWorkOnly] = useState(false)
  const [selected, setSelected] = useState<NormalizedSavedPost | null>(null)

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const locQ = locationQuery.trim().toLowerCase()
    const tagQ = tagQuery.trim().toLowerCase()

    return posts.filter((post) => {
      if (videosOnly && !post.isVideo) return false

      const ann = annotations.get(post.id)
      if (northstarOnly && !ann?.flags?.northstar) return false
      if (enjoyWorkOnly && !ann?.flags?.enjoyWork) return false
      if (tagQ) {
        const tags = ann?.tags ?? []
        const tagHay = tags.join(' ').toLowerCase()
        if (!tagHay.includes(tagQ)) return false
      }

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
  }, [
    posts,
    query,
    videosOnly,
    hasLocationOnly,
    locationQuery,
    tagQuery,
    northstarOnly,
    enjoyWorkOnly,
    annotations,
  ])

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

        <div className="app-curation-bar">
          <input
            className="searchbar-input app-curation-tag-input"
            type="search"
            placeholder="Tag filter (e.g. installation)…"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
          />
          <label className="searchbar-toggle">
            <input
              type="checkbox"
              checked={northstarOnly}
              onChange={(e) => setNorthstarOnly(e.target.checked)}
            />
            <span>Northstar only</span>
          </label>
          <label className="searchbar-toggle">
            <input
              type="checkbox"
              checked={enjoyWorkOnly}
              onChange={(e) => setEnjoyWorkOnly(e.target.checked)}
            />
            <span>Enjoy at work only</span>
          </label>
        </div>

        {loading && <p className="status-text">Loading saved posts…</p>}
        {error && !loading && <p className="status-text error">Error: {error}</p>}
        {!loading && !error && view === 'grid' && (
          <Gallery posts={filteredPosts} onSelect={(post) => setSelected(post)} />
        )}
        {!loading && !error && view === 'map' && (
          <MapView posts={filteredPosts} onSelect={(post) => setSelected(post)} />
        )}
      </main>

      <ItemDetailModal
        post={selected}
        onClose={() => setSelected(null)}
        annotation={
          selected
            ? {
                tags: annotations.get(selected.id)?.tags ?? [],
                notes: annotations.get(selected.id)?.notes ?? '',
                flags: annotations.get(selected.id)?.flags ?? {},
              }
            : undefined
        }
        onAddTag={(tag) => {
          if (!selected) return
          annotations.addTag(selected.id, tag)
        }}
        onRemoveTag={(tag) => {
          if (!selected) return
          annotations.removeTag(selected.id, tag)
        }}
        onSetNotes={(notes) => {
          if (!selected) return
          annotations.setNotes(selected.id, notes)
        }}
        onSetFlags={(flags) => {
          if (!selected) return
          annotations.setFlags(selected.id, flags)
        }}
      />
    </div>
  )
}

export default App
