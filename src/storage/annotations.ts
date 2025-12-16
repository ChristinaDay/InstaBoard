export type AnnotationFlags = {
  northstar?: boolean
  enjoyWork?: boolean
}

export type AnnotationCategory =
  | 'direction_identity'
  | 'skill_building'
  | 'opportunity_hunting'
  | 'portfolio_planning'
  | 'production'

export type PostAnnotation = {
  postId: string
  tags: string[]
  notes?: string
  flags: AnnotationFlags
  categories: AnnotationCategory[]
  updatedAt: string // ISO
}

export type AnnotationStore = Record<string, PostAnnotation>

const STORAGE_KEY_V1 = 'instaboard_annotations_v1'
const STORAGE_KEY_V2 = 'instaboard_annotations_v2'

function normalizeCategories(value: unknown): AnnotationCategory[] {
  const allowed: AnnotationCategory[] = [
    'direction_identity',
    'skill_building',
    'opportunity_hunting',
    'portfolio_planning',
    'production',
  ]

  if (!Array.isArray(value)) return []
  const set = new Set<AnnotationCategory>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const normalized = item.trim().toLowerCase()
    const match = allowed.find((c) => c === normalized)
    if (match) set.add(match)
  }
  return Array.from(set)
}

export function loadAnnotations(): AnnotationStore {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown
      if (!parsed || typeof parsed !== 'object') return {}
      return parsed as AnnotationStore
    }

    // Migrate v1 → v2 if present
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (!rawV1) return {}
    const parsed = JSON.parse(rawV1) as unknown
    if (!parsed || typeof parsed !== 'object') return {}

    const store = parsed as Record<string, any>
    const migrated: AnnotationStore = {}
    for (const [postId, ann] of Object.entries(store)) {
      migrated[postId] = {
        postId,
        tags: Array.isArray(ann?.tags) ? ann.tags : [],
        notes: typeof ann?.notes === 'string' ? ann.notes : '',
        flags: typeof ann?.flags === 'object' && ann?.flags ? ann.flags : {},
        categories: [],
        updatedAt: typeof ann?.updatedAt === 'string' ? ann.updatedAt : new Date().toISOString(),
      }
    }
    // Persist migration
    saveAnnotations(migrated)
    return migrated
  } catch {
    return {}
  }
}

export function saveAnnotations(store: AnnotationStore) {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store))
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '_')
}

export function upsertAnnotation(
  store: AnnotationStore,
  postId: string,
  patch: Partial<Omit<PostAnnotation, 'postId' | 'updatedAt'>> & { tags?: string[] },
): AnnotationStore {
  const current = store[postId]
  const nextTags =
    patch.tags ??
    current?.tags ??
    []

  const tags = Array.from(new Set(nextTags.map(normalizeTag).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )

  const categories = normalizeCategories(patch.categories ?? current?.categories ?? [])

  const next: PostAnnotation = {
    postId,
    tags,
    notes: patch.notes ?? current?.notes ?? '',
    flags: { ...(current?.flags ?? {}), ...(patch.flags ?? {}) },
    categories,
    updatedAt: new Date().toISOString(),
  }

  return { ...store, [postId]: next }
}

export function removeTag(store: AnnotationStore, postId: string, tag: string): AnnotationStore {
  const current = store[postId]
  if (!current) return store
  const target = normalizeTag(tag)
  const nextTags = current.tags.filter((t) => t !== target)
  return upsertAnnotation(store, postId, { tags: nextTags })
}

export function addTag(store: AnnotationStore, postId: string, tag: string): AnnotationStore {
  const current = store[postId]
  const nextTags = [...(current?.tags ?? []), tag]
  return upsertAnnotation(store, postId, { tags: nextTags })
}

export function bulkAddTag(
  store: AnnotationStore,
  postIds: string[],
  tag: string,
): { store: AnnotationStore; changed: number } {
  const normalizedTag = normalizeTag(tag)
  if (!normalizedTag) return { store, changed: 0 }

  let changed = 0
  const next: AnnotationStore = { ...store }

  for (const postId of postIds) {
    const current = next[postId]
    const currentTags = current?.tags ?? []
    if (currentTags.includes(normalizedTag)) continue

    const updated = upsertAnnotation(next, postId, { tags: [...currentTags, normalizedTag] })
    // upsertAnnotation clones; keep reference for subsequent updates
    Object.assign(next, updated)
    changed += 1
  }

  return { store: next, changed }
}

export function getAllTags(store: AnnotationStore): string[] {
  const set = new Set<string>()
  for (const ann of Object.values(store)) {
    for (const t of ann.tags) set.add(t)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}


