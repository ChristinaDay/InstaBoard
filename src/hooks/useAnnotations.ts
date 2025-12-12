import { useEffect, useMemo, useState } from 'react'
import type { AnnotationStore, PostAnnotation } from '../storage/annotations'
import {
  addTag,
  getAllTags,
  loadAnnotations,
  removeTag,
  saveAnnotations,
  upsertAnnotation,
} from '../storage/annotations'

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
    addTag: (postId: string, tag: string) => setStore((s) => addTag(s, postId, tag)),
    removeTag: (postId: string, tag: string) => setStore((s) => removeTag(s, postId, tag)),
    exportJson: () => JSON.stringify(store, null, 2),
    importJson: (jsonString: string) => {
      const parsed = JSON.parse(jsonString) as AnnotationStore
      setStore(parsed || {})
    },
    clear: () => setStore({}),
  }
}


