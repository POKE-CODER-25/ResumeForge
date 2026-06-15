import {
  createInitialResumeData,
  getResumeCompletion,
  loadResumeData,
  normalizeResumeData,
} from './resumeData.js'
import { loadUploadedResumeData } from './uploadedResumeData.js'

export const ACTIVE_RESUME_STORAGE_KEY = 'resumeforge.activeResume.v1'
export const ACTIVE_RESUME_CHANGED_EVENT = 'resumeforge-active-resume-changed'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

function dispatchActiveResumeChanged() {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }
  const ResumeEvent = window.CustomEvent || globalThis.CustomEvent
  if (typeof ResumeEvent === 'function') {
    window.dispatchEvent(new ResumeEvent(ACTIVE_RESUME_CHANGED_EVENT))
  }
}

export function loadActiveResumeRecord() {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    const value = JSON.parse(
      window.localStorage.getItem(ACTIVE_RESUME_STORAGE_KEY) || 'null',
    )
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null
    }
    if (!['editor-approved', 'builder', 'uploaded-import'].includes(value.source)) {
      return null
    }
    return {
      source: value.source,
      resumeData: normalizeResumeData(value.resumeData),
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    }
  } catch {
    try {
      window.localStorage.removeItem(ACTIVE_RESUME_STORAGE_KEY)
    } catch {
      // Fall back to Builder/default data.
    }
    return null
  }
}

export function saveActiveResumeData(resumeData, source = 'builder') {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    window.localStorage.setItem(
      ACTIVE_RESUME_STORAGE_KEY,
      JSON.stringify({
        source,
        resumeData: normalizeResumeData(resumeData),
        updatedAt: new Date().toISOString(),
      }),
    )
    dispatchActiveResumeChanged()
    return true
  } catch {
    return false
  }
}

export function clearActiveResumeData() {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    window.localStorage.removeItem(ACTIVE_RESUME_STORAGE_KEY)
    dispatchActiveResumeChanged()
    return true
  } catch {
    return false
  }
}

export function getActiveResumeData({
  includeUploadedAnalysis = false,
  preferUploadedAnalysis = false,
} = {}) {
  const active = loadActiveResumeRecord()
  const uploaded = loadUploadedResumeData()

  if (active?.source === 'editor-approved') {
    return {
      resumeData: active.resumeData,
      source: 'editor-approved',
      sourceLabel: 'Editor-Approved Resume',
      uploadedResume: uploaded,
    }
  }

  if (active?.source === 'uploaded-import' && uploaded?.importedForEditing) {
    return {
      resumeData: active.resumeData,
      source: 'uploaded-import',
      sourceLabel: 'Uploaded Resume Import',
      uploadedResume: uploaded,
    }
  }

  if (active?.source === 'builder' && getResumeCompletion(active.resumeData) > 0) {
    return {
      resumeData: active.resumeData,
      source: 'builder',
      sourceLabel: 'Builder Resume',
      uploadedResume: uploaded,
    }
  }

  if (includeUploadedAnalysis && preferUploadedAnalysis && uploaded?.importedForEditing !== true) {
    return {
      resumeData: uploaded.parsedResume,
      source: 'uploaded-analysis',
      sourceLabel: 'Uploaded Resume',
      uploadedResume: uploaded,
    }
  }

  const builderData = loadResumeData()
  if (getResumeCompletion(builderData) > 0) {
    return {
      resumeData: builderData,
      source: uploaded?.importedForEditing ? 'uploaded-import' : 'builder',
      sourceLabel: uploaded?.importedForEditing
        ? 'Uploaded Resume Import'
        : 'Builder Resume',
      uploadedResume: uploaded,
    }
  }

  if (includeUploadedAnalysis && uploaded) {
    return {
      resumeData: uploaded.parsedResume,
      source: 'uploaded-analysis',
      sourceLabel: 'Uploaded Resume',
      uploadedResume: uploaded,
    }
  }

  return {
    resumeData: createInitialResumeData(),
    source: 'default',
    sourceLabel: 'Builder Resume',
    uploadedResume: uploaded,
  }
}
