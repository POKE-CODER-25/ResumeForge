import { normalizeResumeData } from '../data/resumeData.js'

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'profile', 'professional profile', 'objective', 'career objective', 'about me'],
  education: ['education', 'academic background', 'academics', 'qualifications'],
  skills: ['skills', 'technical skills', 'core skills', 'technologies', 'tech stack', 'competencies'],
  projects: ['projects', 'personal projects', 'academic projects', 'selected projects', 'project experience'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'internships', 'internship experience'],
  certifications: ['certifications', 'certificates', 'licenses', 'courses', 'credentials', 'achievements'],
}

const TECHNOLOGIES = [
  'JavaScript', 'TypeScript', 'React Native', 'React', 'Next.js', 'Node.js',
  'Express', 'Python', 'Java', 'C++', 'C#', 'Flutter', 'Dart', 'Firebase',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQL', 'AWS', 'Azure', 'Docker',
  'Kubernetes', 'Git', 'GitHub', 'HTML', 'CSS', 'Tailwind', 'Figma',
  'REST API', 'GraphQL', 'Redux', 'Spring Boot', 'Django', 'Flask',
]

const HEADING_LOOKUP = Object.entries(SECTION_ALIASES).reduce((lookup, [section, aliases]) => {
  aliases.forEach((alias) => lookup.set(alias, section))
  return lookup
}, new Map())

function cleanLine(line) {
  return line
    .replace(/^[\s•●▪◦■◆*-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeHeading(line) {
  return cleanLine(line).replace(/:$/, '').toLowerCase()
}

function identifyHeading(line) {
  const normalized = normalizeHeading(line)
  if (HEADING_LOOKUP.has(normalized)) {
    return { section: HEADING_LOOKUP.get(normalized), inlineText: '' }
  }

  for (const [alias, section] of HEADING_LOOKUP.entries()) {
    const prefix = `${alias}:`
    if (normalized.startsWith(prefix)) {
      return {
        section,
        inlineText: cleanLine(line).slice(prefix.length).trim(),
      }
    }
  }

  return null
}

function findFirstMatch(text, pattern) {
  return text.match(pattern)?.[0]?.trim() || ''
}

function findUrl(text, hostPattern) {
  const urls = text.match(/(?:https?:\/\/|www\.)[^\s,;|)]+/gi) || []
  return urls.find((url) => hostPattern.test(url)) || ''
}

function ensureProtocol(url) {
  if (!url) {
    return ''
  }
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function extractContactDetails(text, contactText) {
  const github = ensureProtocol(findUrl(text, /github\.com/i))
  const linkedin = ensureProtocol(findUrl(text, /linkedin\.com/i))
  const allUrls = contactText.match(/(?:https?:\/\/|www\.)[^\s,;|)]+/gi) || []
  const portfolio = ensureProtocol(allUrls.find((url) => (
    !/github\.com|linkedin\.com/i.test(url)
  )) || '')

  return {
    email: findFirstMatch(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i),
    phone: findFirstMatch(text, /(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{3,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}/),
    github,
    linkedin,
    portfolio,
  }
}

function findName(lines) {
  const excluded = /@|https?:|www\.|linkedin|github|\d{4,}|resume|curriculum vitae/i
  return lines
    .slice(0, 8)
    .map(cleanLine)
    .find((line) => (
      line.length >= 3
      && line.length <= 60
      && !excluded.test(line)
      && !identifyHeading(line)
      && /^[A-Za-z][A-Za-z.' -]+$/.test(line)
      && line.split(/\s+/).length <= 5
    )) || ''
}

function splitIntoSections(lines) {
  const sections = {
    summary: [],
    education: [],
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
  }
  const preamble = []
  let currentSection = ''

  lines.forEach((line) => {
    const heading = identifyHeading(line)
    if (heading) {
      currentSection = heading.section
      if (heading.inlineText) {
        sections[currentSection].push(heading.inlineText)
      }
      return
    }

    if (currentSection) {
      sections[currentSection].push(line)
    } else {
      preamble.push(line)
    }
  })

  return { sections, preamble }
}

function extractTechnologies(text) {
  const normalizedText = text.toLowerCase()
  return TECHNOLOGIES.filter((technology) => (
    normalizedText.includes(technology.toLowerCase())
  ))
}

function getSectionText(lines) {
  return lines.map(cleanLine).filter(Boolean).join('\n')
}

function getFirstContentLine(lines) {
  return lines.map(cleanLine).find(Boolean) || ''
}

function buildProject(sectionText, allText) {
  if (!sectionText) {
    return []
  }

  const lines = sectionText.split('\n').filter(Boolean)
  return [{
    title: getFirstContentLine(lines).slice(0, 100) || 'Resume Project',
    techStack: extractTechnologies(sectionText).join(', '),
    description: lines.slice(1).join('\n') || sectionText,
    highlights: lines.slice(1).join('\n'),
    githubLink: findUrl(sectionText, /github\.com/i),
    liveLink: ensureProtocol((sectionText.match(/(?:https?:\/\/|www\.)[^\s,;|)]+/gi) || [])
      .find((url) => !/github\.com/i.test(url)) || ''),
    sourceText: allText,
  }]
}

function getParsingConfidence(data, sections) {
  const recognizedSections = Object.values(sections).filter((lines) => (
    lines.some((line) => cleanLine(line))
  )).length
  const contactSignals = Object.values(data.personalDetails).filter(Boolean).length
  const confidence = recognizedSections * 2 + Math.min(contactSignals, 3)

  return {
    confidence,
    partial: confidence < 5,
  }
}

export function analyzeResumeText(text) {
  const cleanedText = String(text || '').trim()
  if (!cleanedText) {
    return {
      resumeData: normalizeResumeData(),
      partial: true,
      warning: 'We could not fully understand this resume. Partial analysis is shown.',
    }
  }

  try {
    const lines = cleanedText.split(/\n/).map((line) => line.trim()).filter(Boolean)
    const { sections, preamble } = splitIntoSections(lines)
    const contact = extractContactDetails(cleanedText, preamble.join('\n'))
    const summaryText = getSectionText(sections.summary)
      || preamble
        .map(cleanLine)
        .filter((line) => (
          line.length > 45
          && !/@|https?:|www\.|\b\d{3}[-.\s]?\d{3}/i.test(line)
        ))
        .slice(0, 2)
        .join(' ')
    const skillsText = getSectionText(sections.skills)
    const projectText = getSectionText(sections.projects)
    const experienceText = getSectionText(sections.experience)
    const educationText = getSectionText(sections.education)
    const certificationText = getSectionText(sections.certifications)
    const technologies = extractTechnologies(`${skillsText}\n${projectText}\n${cleanedText}`)

    const resumeData = normalizeResumeData({
      personalDetails: {
        fullName: findName(lines),
        email: contact.email,
        phone: contact.phone,
        linkedin: contact.linkedin,
        github: contact.github,
        portfolio: contact.portfolio,
      },
      summary: summaryText,
      education: educationText ? [{
        degree: getFirstContentLine(sections.education),
        institution: sections.education.map(cleanLine).filter(Boolean).slice(1).join(' - '),
      }] : [],
      skills: {
        technicalSkills: technologies.join(', '),
        tools: skillsText,
      },
      projects: buildProject(projectText, cleanedText),
      experience: experienceText ? [{
        role: getFirstContentLine(sections.experience),
        company: sections.experience.map(cleanLine).filter(Boolean)[1] || '',
        responsibilities: experienceText,
      }] : [],
      certifications: certificationText ? [{
        title: getFirstContentLine(sections.certifications),
        issuer: sections.certifications.map(cleanLine).filter(Boolean).slice(1).join(' - '),
      }] : [],
    })
    const confidence = getParsingConfidence(resumeData, sections)

    return {
      resumeData,
      partial: confidence.partial,
      warning: confidence.partial
        ? 'We could not fully understand this resume. Partial analysis is shown.'
        : '',
    }
  } catch {
    return {
      resumeData: normalizeResumeData(),
      partial: true,
      warning: 'We could not fully understand this resume. Partial analysis is shown.',
    }
  }
}

export default analyzeResumeText
