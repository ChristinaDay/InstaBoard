import { useMemo, useState } from 'react'
import { useSavedPosts } from './hooks/useSavedPosts'
import type { NormalizedSavedPost } from './types'
import { SearchBar } from './components/SearchBar'
import { Gallery } from './components/Gallery'
import { ItemDetailModal } from './components/ItemDetailModal'
import { MapView } from './components/MapView'
import { useAnnotations } from './hooks/useAnnotations'
import type { AnnotationCategory } from './storage/annotations'
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
  const [categoryFilters, setCategoryFilters] = useState<AnnotationCategory[]>([])
  const [careerLensesOnly, setCareerLensesOnly] = useState(false)
  const [selected, setSelected] = useState<NormalizedSavedPost | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkTagDraft, setBulkTagDraft] = useState('')
  const [bulkTagStatus, setBulkTagStatus] = useState('')

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

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const locQ = locationQuery.trim().toLowerCase()
    const tagQ = tagQuery.trim().toLowerCase()

    return posts.filter((post) => {
      if (videosOnly && !post.isVideo) return false

      const ann = annotations.get(post.id)
      if (northstarOnly && !ann?.flags?.northstar) return false
      if (tagQ) {
        const tags = ann?.tags ?? []
        const tagHay = tags.join(' ').toLowerCase()
        if (!tagHay.includes(tagQ)) return false
      }
      if (careerLensesOnly) {
        const cats = ann?.categories ?? []
        if (cats.length === 0) return false
      }
      if (categoryFilters.length > 0) {
        const cats = ann?.categories ?? []
        const matches = categoryFilters.some((c) => cats.includes(c))
        if (!matches) return false
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
    categoryFilters,
    careerLensesOnly,
    annotations,
  ])

  const toggleSelected = (post: NormalizedSavedPost) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(post.id)) next.delete(post.id)
      else next.add(post.id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectAllFiltered = () => setSelectedIds(new Set(filteredPosts.map((p) => p.id)))

  const applyBulkTag = () => {
    const tag = bulkTagDraft.trim()
    if (!tag) return
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    annotations.bulkAddTag(ids, tag)
    setBulkTagDraft('')
    setBulkTagStatus(`Added tag “${tag}” to ${ids.length} posts.`)
    window.setTimeout(() => setBulkTagStatus(''), 3500)
  }

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
            onClick={() => {
              setView('map')
              setSelectionMode(false)
              clearSelection()
            }}
            role="tab"
            aria-selected={view === 'map'}
          >
            Map
          </button>
        </div>

        {view === 'grid' && (
          <div className="app-selectbar">
            <label className="searchbar-toggle" title="Select multiple posts to apply a tag in bulk.">
              <input
                type="checkbox"
                checked={selectionMode}
                onChange={(e) => {
                  const enabled = e.target.checked
                  setSelectionMode(enabled)
                  setBulkTagStatus('')
                  if (!enabled) clearSelection()
                }}
              />
              <span>Select</span>
            </label>

            {selectionMode && (
              <>
                <span className="app-selectbar-count">{selectedIds.size} selected</span>
                <button type="button" className="app-selectbar-btn" onClick={selectAllFiltered}>
                  Select all (filtered)
                </button>
                <button type="button" className="app-selectbar-btn" onClick={clearSelection}>
                  Clear
                </button>
                <div className="app-selectbar-bulk">
                  <input
                    className="searchbar-input app-selectbar-input"
                    type="search"
                    placeholder="Add tag to selected…"
                    value={bulkTagDraft}
                    onChange={(e) => setBulkTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyBulkTag()
                    }}
                  />
                  <button
                    type="button"
                    className="app-selectbar-apply"
                    onClick={applyBulkTag}
                    disabled={selectedIds.size === 0 || !bulkTagDraft.trim()}
                    title={
                      selectedIds.size === 0
                        ? 'Select at least one post'
                        : !bulkTagDraft.trim()
                          ? 'Enter a tag'
                          : 'Apply tag to selected posts'
                    }
                  >
                    Apply
                  </button>
                </div>
                {bulkTagStatus && <span className="app-selectbar-status">{bulkTagStatus}</span>}
              </>
            )}
          </div>
        )}

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
          <div className="app-category-filters" aria-label="Lens filters">
            <button
              type="button"
              className={
                categoryFilters.includes('direction_identity')
                  ? 'app-category-chip active'
                  : 'app-category-chip'
              }
              onClick={() =>
                setCategoryFilters((prev) =>
                  prev.includes('direction_identity')
                    ? prev.filter((c) => c !== 'direction_identity')
                    : [...prev, 'direction_identity'],
                )
              }
              title={categoryHelp.direction_identity}
            >
              Direction / identity
            </button>
            <button
              type="button"
              className={
                categoryFilters.includes('skill_building') ? 'app-category-chip active' : 'app-category-chip'
              }
              onClick={() =>
                setCategoryFilters((prev) =>
                  prev.includes('skill_building')
                    ? prev.filter((c) => c !== 'skill_building')
                    : [...prev, 'skill_building'],
                )
              }
              title={categoryHelp.skill_building}
            >
              Skill building
            </button>
            <button
              type="button"
              className={
                categoryFilters.includes('opportunity_hunting')
                  ? 'app-category-chip active'
                  : 'app-category-chip'
              }
              onClick={() =>
                setCategoryFilters((prev) =>
                  prev.includes('opportunity_hunting')
                    ? prev.filter((c) => c !== 'opportunity_hunting')
                    : [...prev, 'opportunity_hunting'],
                )
              }
              title={categoryHelp.opportunity_hunting}
            >
              Opportunity hunting
            </button>
            <button
              type="button"
              className={
                categoryFilters.includes('portfolio_planning')
                  ? 'app-category-chip active'
                  : 'app-category-chip'
              }
              onClick={() =>
                setCategoryFilters((prev) =>
                  prev.includes('portfolio_planning')
                    ? prev.filter((c) => c !== 'portfolio_planning')
                    : [...prev, 'portfolio_planning'],
                )
              }
              title={categoryHelp.portfolio_planning}
            >
              Portfolio planning
            </button>
      </div>
          <label className="searchbar-toggle">
            <input
              type="checkbox"
              checked={northstarOnly}
              onChange={(e) => setNorthstarOnly(e.target.checked)}
            />
            <span>Northstar only</span>
          </label>
          <label
            className="searchbar-toggle"
            title="Only show posts you’ve assigned to at least one career Lens (Direction/identity, Skill building, Opportunity hunting, Portfolio planning)."
          >
            <input
              type="checkbox"
              checked={careerLensesOnly}
              onChange={(e) => setCareerLensesOnly(e.target.checked)}
            />
            <span>Career lenses only</span>
          </label>
        </div>

        {loading && <p className="status-text">Loading saved posts…</p>}
        {error && !loading && <p className="status-text error">Error: {error}</p>}
        {!loading && !error && view === 'grid' && (
          <Gallery
            posts={filteredPosts}
            onSelect={(post) => setSelected(post)}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
          />
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
                categories: annotations.get(selected.id)?.categories ?? [],
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
        onSetCategories={(categories) => {
          if (!selected) return
          annotations.setCategories(selected.id, categories)
        }}
      />
      </div>
  )
}

export default App
