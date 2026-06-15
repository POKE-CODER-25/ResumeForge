import { normalizeResumeData } from '../data/resumeData.js'

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'profile', 'professional profile', 'objective', 'career objective', 'about me'],
  education: ['education', 'academic background', 'academics', 'qualifications'],
  skills: ['skills', 'technical skills', 'core skills', 'technologies', 'tech stack', 'competencies'],
  projects: ['projects', 'personal projects', 'academic projects', 'selected projects', 'project experience'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'internship', 'internships', 'internship experience'],
  certifications: ['certification', 'certifications', 'certificate', 'certificates', 'licenses', 'course', 'courses', 'certificates & courses', 'credentials', 'achievements'],
}

const ROLE_WORDS = /\b(?:developer|engineer|designer|architect|analyst|manager|builder|specialist|consultant|scientist|strategist|product|frontend|backend|full[- ]?stack|data|ai|creative|systems?)\b/i
const BULLET_PATTERN = /^[\s•●▪◦■◆*-]+/

const HEADING_LOOKUP = Object.entries(SECTION_ALIASES).reduce((lookup, [section, aliases]) => {
  aliases.forEach((alias) => lookup.set(alias, section))
  return lookup
}, new Map())

function cleanLine(line) {
  return String(line || '')
    .replace(BULLET_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isBulletLine(line) {
  return /^[\s]*[•●▪◦■◆*-]\s*/.test(String(line || ''))
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

  if (/^(?:certifications?|certificates?|courses?)(?:\s*(?:&|and)\s*(?:certifications?|certificates?|courses?))?$/.test(normalized)) {
    return { section: 'certifications', inlineText: '' }
  }

  return null
}

function findFirstMatch(text, pattern) {
  return text.match(pattern)?.[0]?.trim() || ''
}

function trimUrlPunctuation(value) {
  return value
    .replace(/^[([{<"'`]+/, '')
    .replace(/[)\]}>.,;:!?"'`]+$/, '')
}

function extractUrls(text) {
  const urlPattern = /(?:https?:\/\/|www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:\/[^\s|,;()[\]{}<>]*)?/gi
  const sourceText = String(text || '')

  return [...sourceText.matchAll(urlPattern)]
    .filter((match) => sourceText[match.index - 1] !== '@')
    .map((match) => trimUrlPunctuation(match[0]))
    .filter((url) => (
      url
      && !/^\d+(?:\.\d+)+$/.test(url)
      && !/\.(?:js|ts|py|java|net)$/i.test(url)
    ))
}

function normalizeUrl(url) {
  if (!url) {
    return ''
  }
  const cleaned = trimUrlPunctuation(url)
  return /^https?:\/\//i.test(cleaned)
    ? cleaned
    : `https://${cleaned.replace(/^www\./i, '')}`
}

function findUrl(urls, hostPattern) {
  return normalizeUrl(urls.find((url) => hostPattern.test(url)) || '')
}

function extractContactDetails(text) {
  const urls = extractUrls(text)
  const github = findUrl(urls, /(?:^|\/\/)(?:www\.)?github\.com\//i)
  const linkedin = findUrl(urls, /(?:^|\/\/)(?:www\.)?linkedin\.com\/(?:in|pub)\//i)
  const portfolio = normalizeUrl(urls.find((url) => (
    !/(?:^|\/\/)(?:www\.)?(?:github\.com|linkedin\.com)\//i.test(url)
    && (
      /\.(?:web\.app|vercel\.app|netlify\.app)(?:\/|$)/i.test(url)
      || /\b(?:portfolio|personal|about|profile)\b/i.test(url)
      || /\.(?:com|dev|io|me|app|site|tech)(?:\/|$)/i.test(url)
    )
  )) || '')

  return {
    email: findFirstMatch(text, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i),
    phone: findFirstMatch(text, /(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{3,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}/),
    github,
    linkedin,
    portfolio,
  }
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
    if (currentSection === 'projects' && isStackLine(line)) {
      sections.projects.push(line)
      return
    }

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

function parseHeader(preamble, fullText) {
  const lines = preamble.map(cleanLine).filter(Boolean)
  const contact = extractContactDetails(fullText)
  const fullName = lines[0] && !/@|https?:|www\.|\d{4,}/i.test(lines[0])
    ? lines[0]
    : ''
  const roleLine = lines.slice(1, 4).find((line) => (
    ROLE_WORDS.test(line)
    && !/@|https?:|www\.|linkedin|github/i.test(line)
  )) || ''
  const targetRole = roleLine
    .split(/\s*[·|]\s*/)
    .map((role) => role.trim())
    .filter(Boolean)
    .join(' / ')
  const location = lines.find((line, index) => (
    index > 0
    && index < 7
    && /,\s*[A-Za-z][A-Za-z .'-]+$/.test(line)
    && !/@|https?:|www\.|linkedin|github|\d{4}/i.test(line)
    && line !== roleLine
  ))?.replace(/^\|\s*/, '') || ''

  return {
    fullName,
    targetRole,
    location,
    ...contact,
  }
}

function parseSummary(lines) {
  return lines
    .map(cleanLine)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitValues(value) {
  return value
    .split(/\s*(?:,|·|\||;)\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function unique(items) {
  return [...new Set(items)]
}

function parseSkills(lines) {
  const groups = []
  const ungrouped = []

  lines.map(cleanLine).filter(Boolean).forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0) {
      const name = line.slice(0, separatorIndex).trim()
      const values = splitValues(line.slice(separatorIndex + 1))
      if (values.length > 0) {
        groups.push({ name, values })
      }
    } else {
      ungrouped.push(...splitValues(line))
    }
  })

  const technicalValues = unique([
    ...groups.flatMap((group) => group.values),
    ...ungrouped,
  ])
  const groupedText = groups
    .map((group) => `${group.name}: ${group.values.join(', ')}`)
    .join('\n')
  const toolValues = unique(groups
    .filter((group) => /backend|infrastructure|design|strategy|tool|platform|cloud/i.test(group.name))
    .flatMap((group) => group.values))
  const softValues = unique(groups
    .filter((group) => /soft|professional|leadership|communication/i.test(group.name))
    .flatMap((group) => group.values))

  return {
    technicalSkills: technicalValues.join(', '),
    tools: groupedText || toolValues.join(', '),
    softSkills: softValues.join(', '),
    groups,
  }
}

function isStackLine(line) {
  return /^(?:stack|tech stack|technologies|built with)\s*:/i.test(cleanLine(line))
}

function isProjectTitleLine(lines, index) {
  const line = lines[index]
  if (!line || isBulletLine(line) || isStackLine(line) || extractUrls(line).length > 0) {
    return false
  }

  const cleaned = cleanLine(line)
  const nextLine = lines[index + 1] || ''
  return (
    cleaned.length <= 180
    && (
      isStackLine(nextLine)
      || (
        isBulletLine(nextLine)
        && cleaned.length <= 120
        && !/[.;]$/.test(cleaned)
      )
      || /\b(?:launched|development|completed|ongoing|present)\b.*\b(?:19|20)\d{2}\b/i.test(cleaned)
      || /(?:—|–|\s-\s|\||:).*\b(?:app|platform|system|website|dashboard|tool|game|project|launched|development|completed|ongoing|present|(?:19|20)\d{2})\b/i.test(cleaned)
      || (index === 0 && !isBulletLine(nextLine))
    )
  )
}

function parseProjectTitle(line) {
  const cleaned = cleanLine(line)
  const dashMatch = cleaned.match(/^(.+?)\s+[—–]\s+(.+)$/)
  if (dashMatch) {
    return {
      title: dashMatch[1].trim(),
      description: dashMatch[2].trim(),
    }
  }

  const pipeIndex = cleaned.indexOf('|')
  if (pipeIndex > 0) {
    return {
      title: cleaned.slice(0, pipeIndex).trim(),
      description: cleaned.slice(pipeIndex + 1).trim(),
    }
  }

  const hyphenMatch = cleaned.match(/^(.+?)\s+-\s+(.+)$/)
  if (hyphenMatch) {
    return {
      title: hyphenMatch[1].trim(),
      description: hyphenMatch[2].trim(),
    }
  }

  const colonIndex = cleaned.indexOf(':')
  if (colonIndex > 0) {
    return {
      title: cleaned.slice(0, colonIndex).trim(),
      description: cleaned.slice(colonIndex + 1).trim(),
    }
  }

  return { title: cleaned, description: '' }
}

function parseStack(line) {
  return cleanLine(line)
    .replace(/^(?:stack|tech stack|technologies|built with)\s*:\s*/i, '')
    .split(/\s*·\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

function parseProjects(lines) {
  const projects = []
  let current = null

  function finishProject() {
    if (!current) {
      return
    }
    projects.push({
      title: current.title,
      description: current.description,
      techStack: current.techStack,
      highlights: current.highlights.join('\n'),
      liveLink: current.liveLink,
      githubLink: current.githubLink,
    })
    current = null
  }

  lines.forEach((line, index) => {
    if (isProjectTitleLine(lines, index)) {
      finishProject()
      current = {
        ...parseProjectTitle(line),
        techStack: '',
        highlights: [],
        liveLink: '',
        githubLink: '',
      }
      return
    }

    if (!current) {
      return
    }

    if (isStackLine(line)) {
      current.techStack = parseStack(line)
      return
    }

    const urls = extractUrls(line)
    const github = findUrl(urls, /(?:^|\/\/)(?:www\.)?github\.com\//i)
    const liveLink = normalizeUrl(urls.find((url) => !/github\.com\//i.test(url)) || '')
    if (github) {
      current.githubLink = github
    }
    if (liveLink) {
      current.liveLink = liveLink
    }

    const content = cleanLine(line)
    if (!content || urls.length > 0) {
      return
    }

    if (!isBulletLine(line) && current.highlights.length > 0) {
      current.highlights[current.highlights.length - 1] = `${current.highlights.at(-1)} ${content}`
    } else {
      current.highlights.push(content)
    }
  })

  finishProject()
  return projects
}

function parseEducation(lines) {
  const content = lines.map(cleanLine).filter(Boolean)
  if (content.length === 0) {
    return []
  }

  const degreeLine = content[0]
  const institutionLine = content[1] || ''
  const yearMatch = degreeLine.match(/\b((?:19|20)\d{2})\s*[–—-]\s*((?:19|20)\d{2})(?:\s*\(([^)]+)\))?/)
  const cgpaMatch = content.join(' ').match(/\bCGPA\s*:\s*([^|·]+)/i)
  const institutionParts = institutionLine
    .replace(/\s*[·|]\s*CGPA\s*:.*$/i, '')
    .split(/\s*,\s*/)

  return [{
    degree: degreeLine
      .replace(/\s*\|\s*(?:19|20)\d{2}\s*[–—-]\s*(?:19|20)\d{2}.*$/i, '')
      .trim(),
    institution: institutionParts[0] || '',
    location: institutionParts.slice(1).join(', ').trim(),
    startYear: yearMatch?.[1] || '',
    endYear: yearMatch
      ? `${yearMatch[2]}${yearMatch[3] ? ` (${yearMatch[3]})` : ''}`
      : '',
    cgpa: cgpaMatch?.[1]?.trim() || '',
  }]
}

function splitTitleAndIssuer(line) {
  const cleaned = cleanLine(line)
  const match = cleaned.match(/^(.+?)\s+(?:—|–|\|)\s+(.+)$/)
    || cleaned.match(/^(.+?)\s+-\s+(.+)$/)
    || cleaned.match(/^(.+?)\s+(?:by|from)\s+(.+)$/i)
  return {
    title: match?.[1]?.trim() || cleaned,
    issuer: match?.[2]?.trim() || '',
  }
}

function parseCertifications(lines) {
  return lines
    .map(cleanLine)
    .filter((line) => (
      line
      && !/^["“”'‘’]/.test(line)
      && !/["“”'‘’]$/.test(line)
    ))
    .map((line) => {
      const { title, issuer } = splitTitleAndIssuer(line)
      const urls = extractUrls(line)
      return {
        title,
        issuer,
        year: line.match(/\b(?:19|20)\d{2}\b/)?.[0] || '',
        link: normalizeUrl(urls[0] || ''),
      }
    })
}

function parseExperience(lines) {
  const content = lines.map(cleanLine).filter(Boolean)
  if (content.length === 0) {
    return []
  }

  return [{
    role: content[0],
    company: content[1] || '',
    responsibilities: content.slice(2).join('\n') || content.join('\n'),
  }]
}

function getParsingConfidence(data, sections) {
  const recognizedSections = Object.values(sections).filter((lines) => (
    lines.some((line) => cleanLine(line))
  )).length
  const contactSignals = Object.values(data.personalDetails).filter(Boolean).length
  const confidence = recognizedSections * 2 + Math.min(contactSignals, 4)

  return {
    partial: confidence < 5,
  }
}

export function analyzeResumeText(text) {
  const cleanedText = String(text || '').trim()
  if (!cleanedText) {
    return {
      resumeData: normalizeResumeData(),
      skillGroups: [],
      partial: true,
      warning: 'We could not fully understand this resume. Partial analysis is shown.',
    }
  }

  try {
    const lines = cleanedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const { sections, preamble } = splitIntoSections(lines)
    const skills = parseSkills(sections.skills)
    const resumeData = normalizeResumeData({
      personalDetails: parseHeader(preamble, cleanedText),
      summary: parseSummary(sections.summary),
      education: parseEducation(sections.education),
      skills,
      projects: parseProjects(sections.projects),
      experience: parseExperience(sections.experience),
      certifications: parseCertifications(sections.certifications),
    })
    const confidence = getParsingConfidence(resumeData, sections)

    return {
      resumeData,
      skillGroups: skills.groups,
      partial: confidence.partial,
      warning: confidence.partial
        ? 'We could not fully understand this resume. Partial analysis is shown.'
        : '',
    }
  } catch {
    return {
      resumeData: normalizeResumeData(),
      skillGroups: [],
      partial: true,
      warning: 'We could not fully understand this resume. Partial analysis is shown.',
    }
  }
}

export default analyzeResumeText
