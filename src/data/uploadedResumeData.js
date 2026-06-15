import {
  clearResumeData,
  normalizeResumeData,
} from './resumeData.js'

export const UPLOADED_RESUME_STORAGE_KEY = 'resumeforge.uploadedResume.v1'
export const UPLOADED_RESUME_IMPORT_KEY = 'resumeforge.uploadedResumeImport.v1'
export const RESUME_WORKFLOW_CLEARED_EVENT = 'resumeforge-storage-cleared'

const LEGACY_UPLOADED_RESUME_KEYS = [
  'resumeforge.uploadedResume',
  'resumeforge.uploadedResumeData',
  'resumeforge.uploadedResumeFilename',
  'resumeforge.uploadedResumeSource',
  'resumeforge.importedResume',
  'resumeforge.editorReview.v1',
  'resumeforge.activeResume.v1',
]

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function asString(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeHealthReport(value) {
  if (!isRecord(value)) {
    return null
  }

  return {
    ...value,
    overallScore: Number.isFinite(value.overallScore) ? value.overallScore : 0,
  }
}

export function normalizeUploadedResumeData(value) {
  if (!isRecord(value)) {
    return null
  }

  const filename = asString(value.filename).trim()
  const extractedText = asString(value.extractedText).trim()
  if (!filename || !extractedText) {
    return null
  }

  return {
    filename,
    extractedText,
    parsedResume: normalizeResumeData(value.parsedResume),
    healthReport: normalizeHealthReport(value.healthReport),
    analysisSource: 'Uploaded Resume Analysis',
    warning: asString(value.warning),
    importedForEditing: Boolean(value.importedForEditing),
    importedAt: asString(value.importedAt),
    updatedAt: asString(value.updatedAt) || new Date().toISOString(),
  }
}

export function loadUploadedResumeData() {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    const storedData = window.localStorage.getItem(UPLOADED_RESUME_STORAGE_KEY)
    if (!storedData) {
      return null
    }
    return normalizeUploadedResumeData(JSON.parse(storedData))
  } catch {
    return null
  }
}

export function saveUploadedResumeData(value) {
  if (!canUseLocalStorage()) {
    return false
  }

  const normalized = normalizeUploadedResumeData(value)
  if (!normalized) {
    return false
  }

  try {
    window.localStorage.setItem(
      UPLOADED_RESUME_STORAGE_KEY,
      JSON.stringify(normalized),
    )
    return true
  } catch {
    return false
  }
}

export function markUploadedResumeImported() {
  const current = loadUploadedResumeData()
  if (!current) {
    return null
  }

  const updated = {
    ...current,
    importedForEditing: true,
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (!saveUploadedResumeData(updated)) {
    return null
  }

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(UPLOADED_RESUME_IMPORT_KEY, 'true')
    } catch {
      // The uploaded record still carries the import state.
    }
  }

  return updated
}

export function clearUploadedResumeWorkflow() {
  const uploaded = loadUploadedResumeData()
  let importedBuilderData = Boolean(uploaded?.importedForEditing)

  if (canUseLocalStorage()) {
    try {
      importedBuilderData = importedBuilderData
        || window.localStorage.getItem(UPLOADED_RESUME_IMPORT_KEY) === 'true'
    } catch {
      // Continue with the state available from the uploaded resume record.
    }
  }

  if (importedBuilderData) {
    clearResumeData()
  }

  let cleared = false
  try {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(UPLOADED_RESUME_STORAGE_KEY)
      window.localStorage.removeItem(UPLOADED_RESUME_IMPORT_KEY)
      LEGACY_UPLOADED_RESUME_KEYS.forEach((key) => {
        window.localStorage.removeItem(key)
      })
      cleared = true
    }
  } catch {
    cleared = false
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    const StorageClearedEvent = window.CustomEvent || globalThis.CustomEvent
    if (typeof StorageClearedEvent === 'function') {
      window.dispatchEvent(new StorageClearedEvent(RESUME_WORKFLOW_CLEARED_EVENT))
    }
  }

  return cleared
}
