import { useEffect, useMemo, useState } from 'react'
import type { AnnotationStore, PostAnnotation } from '../storage/annotations'
import {
  addTag,
  bulkAddTag,
  getAllTags,
  loadAnnotations,
  removeTag,
  saveAnnotations,
  upsertAnnotation,
} from '../storage/annotations'
import type { AnnotationCategory } from '../storage/annotations'

export function useAnnotations() {
  const [store, setStore] = useState<AnnotationStore>({})

  useEffect(() => {
    setStore(loadAnnotations())
  }, [])

  useEffect(() => {
    saveAnnotations(store)
  }, [store])

  const allTags = useMemo(() => getAllTags(store), [store])

  const get = (postId: string): PostAnnotation | undefined => store[postId]

  return {
    store,
    allTags,
    get,
    setNotes: (postId: string, notes: string) => setStore((s) => upsertAnnotation(s, postId, { notes })),
    setFlags: (postId: string, flags: PostAnnotation['flags']) =>
      setStore((s) => upsertAnnotation(s, postId, { flags })),
    setCategories: (postId: string, categories: AnnotationCategory[]) =>
      setStore((s) => upsertAnnotation(s, postId, { categories })),
    addTag: (postId: string, tag: string) => setStore((s) => addTag(s, postId, tag)),
    removeTag: (postId: string, tag: string) => setStore((s) => removeTag(s, postId, tag)),
    bulkAddTag: (postIds: string[], tag: string) =>
      setStore((s) => {
        const result = bulkAddTag(s, postIds, tag)
        return result.store
      }),
    exportJson: () => JSON.stringify(store, null, 2),
    importJson: (jsonString: string) => {
      const parsed = JSON.parse(jsonString) as AnnotationStore
      setStore(parsed || {})
    },
    clear: () => setStore({}),
  }
}


