export type AnnotationFlags = {
  northstar?: boolean
  enjoyWork?: boolean
}

export type PostAnnotation = {
  postId: string
  tags: string[]
  notes?: string
  flags: AnnotationFlags
  updatedAt: string // ISO
}

export type AnnotationStore = Record<string, PostAnnotation>

const STORAGE_KEY = 'instaboard_annotations_v1'

export function loadAnnotations(): AnnotationStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as AnnotationStore
  } catch {
    return {}
  }
}

export function saveAnnotations(store: AnnotationStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
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

  const next: PostAnnotation = {
    postId,
    tags,
    notes: patch.notes ?? current?.notes ?? '',
    flags: { ...(current?.flags ?? {}), ...(patch.flags ?? {}) },
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

export function getAllTags(store: AnnotationStore): string[] {
  const set = new Set<string>()
  for (const ann of Object.values(store)) {
    for (const t of ann.tags) set.add(t)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}


