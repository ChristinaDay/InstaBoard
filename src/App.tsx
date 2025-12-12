import { useMemo, useState } from 'react'
import { useSavedPosts } from './hooks/useSavedPosts'
import type { NormalizedSavedPost } from './types'
import { SearchBar } from './components/SearchBar'
import { Gallery } from './components/Gallery'
import { ItemDetailModal } from './components/ItemDetailModal'
import './index.css'

function App() {
  const { posts, loading, error } = useSavedPosts()
  const [query, setQuery] = useState('')
  const [videosOnly, setVideosOnly] = useState(false)
  const [selected, setSelected] = useState<NormalizedSavedPost | null>(null)

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return posts.filter((post) => {
      if (videosOnly && !post.isVideo) return false

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
  }, [posts, query, videosOnly])

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Insta-Board</h1>
          <p>Local, private moodboard built from your Instagram saved posts.</p>
        </div>
      </header>

      <main className="app-main">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          videosOnly={videosOnly}
          onVideosOnlyChange={setVideosOnly}
        />

        {loading && <p className="status-text">Loading saved posts…</p>}
        {error && !loading && <p className="status-text error">Error: {error}</p>}
        {!loading && !error && (
          <Gallery posts={filteredPosts} onSelect={(post) => setSelected(post)} />
        )}
      </main>

      <ItemDetailModal post={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default App
