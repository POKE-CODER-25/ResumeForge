import { normalizeResumeData } from '../data/resumeData.js'

export const RESUME_TEMPLATES = [
  {
    id: 'classic-engineering',
    name: 'Classic Engineering Resume',
  },
]

function safeString(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : ''
}

function hasContent(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return false
  }

  return Object.entries(entry).some(
    ([key, value]) => key !== 'id' && safeString(value),
  )
}

export function splitList(value) {
  return safeString(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatRange(start, end) {
  return [safeString(start), safeString(end)].filter(Boolean).join(' - ')
}

function formatUrl(value) {
  return safeString(value).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

export function getResumeFileBaseName(resumeData) {
  const data = normalizeResumeData(resumeData)
  const name = safeString(data.personalDetails.fullName)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return name ? `ResumeForge-${name}-Resume` : 'ResumeForge-Resume'
}

export function createClassicEngineeringResume(resumeData) {
  const data = normalizeResumeData(resumeData)
  const { personalDetails, skills } = data

  const contactItems = [
    personalDetails.email,
    personalDetails.phone,
    personalDetails.location,
  ].map(safeString).filter(Boolean)

  const links = [
    ['LinkedIn', personalDetails.linkedin],
    ['GitHub', personalDetails.github],
    ['Portfolio', personalDetails.portfolio],
  ]
    .map(([label, url]) => ({
      label,
      url: safeString(url),
      display: formatUrl(url) || label,
    }))
    .filter((link) => link.url)

  const sections = [
    {
      id: 'summary',
      title: 'Professional Summary',
      type: 'paragraph',
      content: safeString(data.summary),
    },
    {
      id: 'education',
      title: 'Education',
      type: 'education',
      items: data.education.filter(hasContent).map((entry) => ({
        title: safeString(entry.degree),
        organization: [entry.institution, entry.location].map(safeString).filter(Boolean).join(', '),
        date: formatRange(entry.startYear, entry.endYear),
        details: entry.cgpa ? [`CGPA: ${safeString(entry.cgpa)}`] : [],
      })),
    },
    {
      id: 'skills',
      title: 'Skills',
      type: 'skills',
      groups: [
        ['Technical', skills.technicalSkills],
        ['Tools', skills.tools],
        ['Professional', skills.softSkills],
      ]
        .map(([label, value]) => ({ label, values: splitList(value) }))
        .filter((group) => group.values.length > 0),
    },
    {
      id: 'projects',
      title: 'Projects',
      type: 'projects',
      items: data.projects.filter(hasContent).map((entry) => ({
        title: safeString(entry.title),
        techStack: safeString(entry.techStack),
        description: safeString(entry.description),
        links: [
          ['Live', entry.liveLink],
          ['GitHub', entry.githubLink],
        ]
          .map(([label, url]) => ({ label, url: safeString(url) }))
          .filter((link) => link.url),
        bullets: splitList(entry.highlights),
      })),
    },
    {
      id: 'experience',
      title: 'Experience',
      type: 'experience',
      items: data.experience.filter(hasContent).map((entry) => ({
        title: safeString(entry.role),
        organization: [entry.company, entry.location].map(safeString).filter(Boolean).join(', '),
        date: formatRange(entry.startDate, entry.endDate),
        bullets: splitList(entry.responsibilities),
      })),
    },
    {
      id: 'certifications',
      title: 'Certifications',
      type: 'certifications',
      items: data.certifications.filter(hasContent).map((entry) => ({
        title: safeString(entry.title),
        issuer: safeString(entry.issuer),
        year: safeString(entry.year),
        link: safeString(entry.link),
      })),
    },
  ].filter((section) => {
    if (section.type === 'paragraph') {
      return Boolean(section.content)
    }
    if (section.type === 'skills') {
      return section.groups.length > 0
    }
    return section.items.length > 0
  })

  return {
    templateId: RESUME_TEMPLATES[0].id,
    templateName: RESUME_TEMPLATES[0].name,
    personalDetails: {
      fullName: safeString(personalDetails.fullName),
      targetRole: safeString(personalDetails.targetRole),
      contactItems,
      links,
    },
    sections,
  }
}

function addLines(lines, values = []) {
  values.filter(Boolean).forEach((value) => lines.push(value))
}

export function formatResumeAsText(resumeData) {
  const resume = createClassicEngineeringResume(resumeData)
  const lines = []
  const { personalDetails } = resume

  addLines(lines, [
    personalDetails.fullName || 'Your Name',
    personalDetails.targetRole,
    [...personalDetails.contactItems, ...personalDetails.links.map((link) => `${link.label}: ${link.url}`)].join(' | '),
  ])

  resume.sections.forEach((section) => {
    lines.push('', section.title.toUpperCase())

    if (section.type === 'paragraph') {
      lines.push(section.content)
      return
    }

    if (section.type === 'skills') {
      section.groups.forEach((group) => lines.push(`${group.label}: ${group.values.join(', ')}`))
      return
    }

    section.items.forEach((item) => {
      if (section.type === 'education') {
        addLines(lines, [
          [item.title, item.date].filter(Boolean).join(' | '),
          item.organization,
          ...item.details,
        ])
        return
      }

      if (section.type === 'projects') {
        addLines(lines, [
          [item.title, item.techStack].filter(Boolean).join(' | '),
          item.description,
          ...item.links.map((link) => `${link.label}: ${link.url}`),
          ...item.bullets.map((bullet) => `- ${bullet}`),
        ])
        return
      }

      if (section.type === 'experience') {
        addLines(lines, [
          [item.title, item.date].filter(Boolean).join(' | '),
          item.organization,
          ...item.bullets.map((bullet) => `- ${bullet}`),
        ])
        return
      }

      addLines(lines, [
        [item.title, item.issuer, item.year].filter(Boolean).join(' | '),
        item.link ? `Credential: ${item.link}` : '',
      ])
    })
  })

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}
