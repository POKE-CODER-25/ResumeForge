export const RESUME_STORAGE_KEY = 'resumeforge.resume.v1'

const repeatableSections = ['education', 'projects', 'experience', 'certifications']

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function asString(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}

function hasPrimitiveText(value) {
  return typeof value === 'string' || typeof value === 'number'
}

const entryFactories = {
  education: () => ({
    id: createId(),
    degree: '',
    institution: '',
    location: '',
    startYear: '',
    endYear: '',
    cgpa: '',
  }),
  projects: () => ({
    id: createId(),
    title: '',
    techStack: '',
    description: '',
    liveLink: '',
    githubLink: '',
    highlights: '',
  }),
  experience: () => ({
    id: createId(),
    role: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
  }),
  certifications: () => ({
    id: createId(),
    title: '',
    issuer: '',
    year: '',
    link: '',
  }),
}

export function createResumeEntry(section) {
  const factory = entryFactories[section]
  return factory ? factory() : null
}

export function createInitialResumeData() {
  return {
    personalDetails: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      targetRole: '',
    },
    summary: '',
    education: [createResumeEntry('education')],
    skills: {
      technicalSkills: '',
      softSkills: '',
      tools: '',
    },
    projects: [createResumeEntry('projects')],
    experience: [createResumeEntry('experience')],
    certifications: [createResumeEntry('certifications')],
  }
}

export const defaultResumeData = createInitialResumeData()

function normalizeRecord(value, defaults) {
  const source = isRecord(value) ? value : {}

  return Object.fromEntries(
    Object.keys(defaults).map((key) => [key, asString(source[key])]),
  )
}

function normalizeEntries(entries, section) {
  const factory = entryFactories[section]
  if (!factory) {
    return []
  }

  const sourceEntries = Array.isArray(entries)
    ? entries
    : hasPrimitiveText(entries)
      ? [entries]
      : null

  if (!sourceEntries) {
    return [factory ? factory() : null].filter(Boolean)
  }

  const normalizedEntries = sourceEntries
    .map((entry) => {
      const defaults = factory()

      if (!isRecord(entry)) {
        const text = asString(entry)
        if (!text.trim()) {
          return null
        }

        const fallbackField = {
          education: 'degree',
          projects: 'title',
          experience: 'role',
          certifications: 'title',
        }[section]

        return {
          ...defaults,
          [fallbackField]: text,
          id: createId(),
        }
      }

      const normalized = normalizeRecord(entry, defaults)
      return {
        ...normalized,
        id: asString(entry.id) || createId(),
      }
    })
    .filter(Boolean)

  return normalizedEntries.length > 0 ? normalizedEntries : [factory()]
}

export function normalizeResumeData(value) {
  const initial = createInitialResumeData()
  const source = isRecord(value) ? value : {}

  return {
    personalDetails: normalizeRecord(source.personalDetails, initial.personalDetails),
    summary: asString(source.summary),
    education: normalizeEntries(source.education, 'education'),
    skills: normalizeRecord(source.skills, initial.skills),
    projects: normalizeEntries(source.projects, 'projects'),
    experience: normalizeEntries(source.experience, 'experience'),
    certifications: normalizeEntries(source.certifications, 'certifications'),
  }
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && 'localStorage' in window
}

export function loadResumeData() {
  if (!canUseLocalStorage()) {
    return createInitialResumeData()
  }

  try {
    const storedData = window.localStorage.getItem(RESUME_STORAGE_KEY)
    if (!storedData) {
      return createInitialResumeData()
    }

    return normalizeResumeData(JSON.parse(storedData))
  } catch {
    try {
      window.localStorage.removeItem(RESUME_STORAGE_KEY)
    } catch {
      // Storage can be blocked by browser privacy settings.
    }
    return createInitialResumeData()
  }
}

export function saveResumeData(resumeData) {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    window.localStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify(normalizeResumeData(resumeData)),
    )
    return true
  } catch {
    return false
  }
}

export function clearResumeData() {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(RESUME_STORAGE_KEY)
    } catch {
      // The in-memory form can still be reset when storage is unavailable.
    }
  }

  return createInitialResumeData()
}

export function getResumeCompletion(resumeData) {
  const data = normalizeResumeData(resumeData)
  const entryValues = (entries) => entries.flatMap((entry) => (
    Object.entries(entry)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value)
  ))

  const values = [
    ...Object.values(data.personalDetails),
    data.summary,
    ...Object.values(data.skills),
    ...repeatableSections.flatMap((section) => entryValues(data[section])),
  ]

  if (values.length === 0) {
    return 0
  }

  const completed = values.filter((value) => asString(value).trim()).length
  return Math.round((completed / values.length) * 100)
}
