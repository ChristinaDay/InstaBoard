import { useMemo } from 'react'
import type { NormalizedSavedPost } from '../types'
import type { AnnotationCategory, AnnotationStore } from '../storage/annotations'

type CountItem = { value: string; count: number }

type InsightsScope = 'filtered' | 'all'

const STOPWORDS = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'been',
    'but',
    'by',
    'can',
    'do',
    'for',
    'from',
    'had',
    'has',
    'have',
    'i',
    'if',
    'in',
    'into',
    'is',
    'it',
    'its',
    'just',
    'like',
    'love',
    'me',
    'more',
    'my',
    'no',
    'not',
    'of',
    'on',
    'or',
    'our',
    'out',
    'so',
    'that',
    'the',
    'their',
    'then',
    'there',
    'these',
    'this',
    'to',
    'too',
    'up',
    'was',
    'we',
    'were',
    'what',
    'with',
    'you',
    'your',
    // IG-ish filler
    'bio',
    'link',
    'dm',
    'shop',
    'available',
    'now',
    'new',
    'today',
    'soon',
    'video',
    'reel',
    'reels',
    'post',
    'ad',
    'paid',
    'credit',
    'credits',
  ].map((w) => w.toLowerCase()),
)

function normalizeToken(raw: string): string {
  const token = raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, '') // hashtags
    .replace(/^@+/, '') // mentions
    .replace(/https?:\/\/\S+/g, '') // urls
    .replace(/[^a-z0-9_]+/g, '') // keep simple word chars
  return token
}

function countTop(values: string[], limit: number): CountItem[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    const next = (counts.get(v) ?? 0) + 1
    counts.set(v, next)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.value.localeCompare(b.value)))
    .slice(0, limit)
}

const LENS_LABELS: Record<AnnotationCategory, string> = {
  direction_identity: 'Direction / identity',
  skill_building: 'Skills',
  opportunity_hunting: 'Opportunity hunting',
  portfolio_planning: 'Portfolio planning',
  production: 'Production',
}

export function InsightsPanel({
  allPosts,
  filteredPosts,
  annotationsStore,
  scope,
  onScopeChange,
  onSetQuery,
  onSetTagQuery,
  onToggleLensFilter,
  onClearLensFilters,
  lensHelp,
}: {
  allPosts: NormalizedSavedPost[]
  filteredPosts: NormalizedSavedPost[]
  annotationsStore: AnnotationStore
  scope: InsightsScope
  onScopeChange: (scope: InsightsScope) => void
  onSetQuery: (value: string) => void
  onSetTagQuery: (value: string) => void
  onToggleLensFilter: (lens: AnnotationCategory) => void
  onClearLensFilters: () => void
  lensHelp: Record<AnnotationCategory, string>
}) {
  const scopePosts = scope === 'filtered' ? filteredPosts : allPosts

  const insights = useMemo(() => {
    const hashtags: string[] = []
    const keywords: string[] = []
    const owners: string[] = []
    const myTags: string[] = []
    const lensCounts = new Map<AnnotationCategory, number>()

    for (const post of scopePosts) {
      if (post.ownerUsername) owners.push(post.ownerUsername.trim().toLowerCase())

      for (const h of post.hashtags ?? []) {
        const t = normalizeToken(h)
        if (!t || STOPWORDS.has(t)) continue
        hashtags.push(t)
      }

      const caption = post.captionText ?? ''
      if (caption) {
        const roughTokens = caption.split(/\s+/g)
        for (const raw of roughTokens) {
          const t = normalizeToken(raw)
          if (!t) continue
          if (t.length < 3) continue
          if (STOPWORDS.has(t)) continue
          if (/^\d+$/.test(t)) continue
          keywords.push(t)
        }
      }

      const ann = annotationsStore[post.id]
      if (ann?.tags?.length) {
        for (const t of ann.tags) {
          const token = normalizeToken(t)
          if (!token) continue
          myTags.push(token)
        }
      }
      if (ann?.categories?.length) {
        for (const c of ann.categories) {
          lensCounts.set(c, (lensCounts.get(c) ?? 0) + 1)
        }
      }
    }

    const topHashtags = countTop(hashtags, 24)
    const topKeywords = countTop(keywords, 24)
    const topOwners = countTop(owners, 18)
    const topMyTags = countTop(myTags, 18)
    const topLenses = Array.from(lensCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.value.localeCompare(b.value)))

    return { topHashtags, topKeywords, topOwners, topMyTags, topLenses }
  }, [annotationsStore, scopePosts])

  return (
    <section className="insights-panel" aria-label="Insights">
      <div className="insights-header">
        <div className="insights-title">
          <strong>Insights</strong>
          <span className="insights-subtitle">
            from {scope === 'filtered' ? 'filtered posts' : 'all posts'} ({scopePosts.length})
          </span>
        </div>
        <div className="insights-controls">
          <button
            type="button"
            className={scope === 'filtered' ? 'app-category-chip active' : 'app-category-chip'}
            onClick={() => onScopeChange('filtered')}
          >
            Filtered
          </button>
          <button
            type="button"
            className={scope === 'all' ? 'app-category-chip active' : 'app-category-chip'}
            onClick={() => onScopeChange('all')}
          >
            All
          </button>
        </div>
      </div>

      <div className="insights-grid">
        <div className="insights-block">
          <div className="insights-block-title">Top hashtags</div>
          <div className="insights-chips">
            {insights.topHashtags.length ? (
              insights.topHashtags.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="insights-chip"
                  title={`Search “${item.value}” (${item.count})`}
                  onClick={() => onSetQuery(item.value)}
                >
                  #{item.value} <span className="insights-chip-count">{item.count}</span>
                </button>
              ))
            ) : (
              <div className="insights-empty">No hashtags found in this scope.</div>
            )}
          </div>
        </div>

        <div className="insights-block">
          <div className="insights-block-title">Top caption keywords</div>
          <div className="insights-chips">
            {insights.topKeywords.length ? (
              insights.topKeywords.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="insights-chip"
                  title={`Search “${item.value}” (${item.count})`}
                  onClick={() => onSetQuery(item.value)}
                >
                  {item.value} <span className="insights-chip-count">{item.count}</span>
                </button>
              ))
            ) : (
              <div className="insights-empty">No keywords found in this scope.</div>
            )}
          </div>
        </div>

        <div className="insights-block">
          <div className="insights-block-title">Top creators</div>
          <div className="insights-chips">
            {insights.topOwners.length ? (
              insights.topOwners.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="insights-chip"
                  title={`Search “${item.value}” (${item.count})`}
                  onClick={() => onSetQuery(item.value)}
                >
                  @{item.value} <span className="insights-chip-count">{item.count}</span>
                </button>
              ))
            ) : (
              <div className="insights-empty">No creators found in this scope.</div>
            )}
          </div>
        </div>

        <div className="insights-block">
          <div className="insights-block-title">Your tags</div>
          <div className="insights-chips">
            {insights.topMyTags.length ? (
              insights.topMyTags.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="insights-chip"
                  title={`Filter by tag “${item.value}” (${item.count})`}
                  onClick={() => onSetTagQuery(item.value)}
                >
                  {item.value} <span className="insights-chip-count">{item.count}</span>
                </button>
              ))
            ) : (
              <div className="insights-empty">No tags yet (add some in a post modal).</div>
            )}
          </div>
        </div>

        <div className="insights-block insights-block-wide">
          <div className="insights-block-title">
            Your lenses
            <button type="button" className="insights-clear" onClick={onClearLensFilters}>
              Clear lens filters
            </button>
          </div>
          <div className="insights-chips">
            {insights.topLenses.length ? (
              insights.topLenses.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className="insights-chip"
                  title={lensHelp[item.value] ?? `Toggle lens filter ${LENS_LABELS[item.value]}`}
                  onClick={() => onToggleLensFilter(item.value)}
                >
                  {LENS_LABELS[item.value]}{' '}
                  <span className="insights-chip-count">{item.count}</span>
                </button>
              ))
            ) : (
              <div className="insights-empty">No lenses yet (set them in a post modal).</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


