export const EDITOR_REVIEW_STORAGE_KEY = 'resumeforge.editorReview.v1'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function getSuggestionId(suggestion) {
  const value = [
    suggestion?.section,
    suggestion?.issue,
    suggestion?.originalText,
    suggestion?.improvedText,
  ].filter(Boolean).join('|')

  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return `suggestion-${Math.abs(hash)}`
}

export function loadEditorReviewStatuses() {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EDITOR_REVIEW_STORAGE_KEY) || '{}',
    )
    if (!isRecord(stored)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(stored).filter(([, status]) => (
        status === 'applied' || status === 'skipped'
      )),
    )
  } catch {
    try {
      window.localStorage.removeItem(EDITOR_REVIEW_STORAGE_KEY)
    } catch {
      // Editor can continue with in-memory statuses.
    }
    return {}
  }
}

export function saveEditorReviewStatuses(statuses) {
  if (!canUseLocalStorage() || !isRecord(statuses)) {
    return false
  }

  try {
    window.localStorage.setItem(
      EDITOR_REVIEW_STORAGE_KEY,
      JSON.stringify(statuses),
    )
    return true
  } catch {
    return false
  }
}
