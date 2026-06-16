import {
  createInitialResumeData,
  getResumeCompletion,
  loadResumeData,
  normalizeResumeData,
} from '../data/resumeData.js'

export const RESUME_STORAGE_KEY = 'resumeforge_active_resume'
const RESUME_CHANGED_EVENT = 'resumeforge-active-resume-storage-changed'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function createRecord(resumeData) {
  return {
    resumeData: normalizeResumeData(resumeData),
    updatedAt: new Date().toISOString(),
  }
}

function readRecord() {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    const record = JSON.parse(window.localStorage.getItem(RESUME_STORAGE_KEY) || 'null')
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return null
    }

    return {
      resumeData: normalizeResumeData(record.resumeData),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    }
  } catch {
    try {
      window.localStorage.removeItem(RESUME_STORAGE_KEY)
    } catch {
      // Continue with builder/default fallback.
    }
    return null
  }
}

function writeRecord(record) {
  if (!canUseLocalStorage()) {
    return record
  }

  try {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(record))
    window.dispatchEvent(new CustomEvent(RESUME_CHANGED_EVENT, { detail: record }))
  } catch {
    // In-memory callers still receive the normalized record.
  }

  return record
}

export function getActiveResume() {
  const stored = readRecord()
  if (stored) {
    return stored
  }

  const builderData = loadResumeData()
  const initialData = getResumeCompletion(builderData) > 0
    ? builderData
    : createInitialResumeData()

  return writeRecord(createRecord(initialData))
}

export function saveActiveResume(resumeData) {
  return writeRecord(createRecord(resumeData))
}

export function clearActiveResume() {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(RESUME_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(RESUME_CHANGED_EVENT))
  } catch {
    // Nothing else to clear.
  }
}

export function subscribeToResumeChanges(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {}
  }

  function handleChange(event) {
    if (event.type === 'storage' && event.key !== RESUME_STORAGE_KEY) {
      return
    }
    callback(getActiveResume())
  }

  window.addEventListener(RESUME_CHANGED_EVENT, handleChange)
  window.addEventListener('storage', handleChange)

  return () => {
    window.removeEventListener(RESUME_CHANGED_EVENT, handleChange)
    window.removeEventListener('storage', handleChange)
  }
}
