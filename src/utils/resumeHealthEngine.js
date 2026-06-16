import { normalizeResumeData } from '../data/resumeData.js'

const STRONG_TECHNOLOGIES = [
  'react native', 'next.js', 'node.js', 'typescript', 'postgresql',
  'javascript', 'firebase', 'mongodb', 'python', 'docker', 'flutter',
  'react', 'aws',
]

const STRONG_ACTION_WORDS = [
  'built', 'implemented', 'deployed', 'designed', 'developed',
  'optimized', 'integrated', 'engineered', 'automated', 'launched',
  'reduced', 'improved', 'increased', 'delivered',
]

const WEAK_PHRASES = [
  'made website',
  'made a website',
  'created app',
  'created an app',
  'worked on project',
  'worked on a project',
  'did project',
  'did a project',
  'helped with',
  'basic app',
  'basic application',
  'simple website',
]

const SECTION_LABELS = {
  personalDetails: 'Personal Details',
  summary: 'Professional Summary',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  certifications: 'Certifications',
}

const SECTION_WEIGHTS = {
  personalDetails: 5,
  summary: 3,
  education: 4,
  skills: 4,
  projects: 4,
  experience: 3,
  certifications: 2,
}

const EMPTY_HEALTH_REPORT = {
  overallScore: 0,
  sectionCompletenessScore: 0,
  technicalStrengthScore: 0,
  impactStrengthScore: 0,
  professionalReadinessScore: 0,
  strengths: ['Resume structure is ready for you to add professional details'],
  weaknesses: ['Missing professional summary'],
  missingSections: Object.values(SECTION_LABELS),
  recommendations: ['Go to Builder to create your resume'],
  resumeDoctor: [],
  doctorSuggestions: [],
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasEntry(entries, fields) {
  return entries.some((entry) => fields.some((field) => hasText(entry[field])))
}

function clampCategory(score) {
  return Math.max(0, Math.min(25, Math.round(score)))
}

function unique(items) {
  return [...new Set(items)]
}

function uniqueDoctorItems(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = `${item.issue}|${item.section}|${item.originalText || ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function parseSkills(data) {
  const skills = data?.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)
    ? data.skills
    : {}

  return unique(
    [skills.technicalSkills, skills.tools]
      .join(',')
      .split(/[,;\n|]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
  )
}

function countTerms(text, terms) {
  const normalizedText = text.toLowerCase()
  return terms.filter((term) => normalizedText.includes(term)).length
}

function containsMeasurableResult(text) {
  return /(?:\b\d[\d,]*(?:\.\d+)?\s*(?:%|x|\+|users?|customers?|requests?|downloads?|seconds?|ms|hours?|days?))|(?:\b(?:hundreds?|thousands?|millions?)\s+of\b)/i.test(text)
}

function containsTechnicalDetail(text) {
  return /\b(?:api|database|authentication|authorization|responsive|real-time|cloud|frontend|backend|deployment|deployed|hosting|components?|testing|performance|sql|nosql)\b/i.test(text)
    || countTerms(text, STRONG_TECHNOLOGIES) > 0
}

function adaptTextInput(text) {
  return {
    ...normalizeResumeData(),
    summary: text,
    sourceType: 'text',
    sourceText: text,
  }
}

function adaptInput(input) {
  if (typeof input === 'string') {
    return adaptTextInput(input)
  }

  if (input?.type === 'text' && typeof input.text === 'string') {
    return adaptTextInput(input.text)
  }

  return {
    ...normalizeResumeData(input?.data ?? input),
    sourceType: 'structured',
    sourceText: '',
  }
}

function getSectionState(data, skills) {
  const personalFields = ['fullName', 'email', 'phone', 'location']
  const completedPersonalFields = personalFields.filter((field) => (
    hasText(data.personalDetails[field])
  )).length

  return {
    personalDetails: {
      present: completedPersonalFields >= 2,
      completion: completedPersonalFields / personalFields.length,
    },
    summary: {
      present: hasText(data.summary),
      completion: hasText(data.summary) ? Math.min(data.summary.trim().length / 100, 1) : 0,
    },
    education: {
      present: hasEntry(data.education, ['degree', 'institution']),
      completion: hasEntry(data.education, ['degree', 'institution']) ? 1 : 0,
    },
    skills: {
      present: skills.length > 0,
      completion: Math.min(skills.length / 7, 1),
    },
    projects: {
      present: hasEntry(data.projects, ['title', 'description', 'highlights']),
      completion: hasEntry(data.projects, ['title', 'description', 'highlights']) ? 1 : 0,
    },
    experience: {
      present: hasEntry(data.experience, ['role', 'company', 'responsibilities']),
      completion: hasEntry(data.experience, ['role', 'company', 'responsibilities']) ? 1 : 0,
    },
    certifications: {
      present: hasEntry(data.certifications, ['title', 'issuer']),
      completion: hasEntry(data.certifications, ['title', 'issuer']) ? 1 : 0,
    },
  }
}

function scoreCompleteness(sectionState) {
  return clampCategory(
    Object.entries(SECTION_WEIGHTS).reduce((total, [section, weight]) => (
      total + (weight * sectionState[section].completion)
    ), 0),
  )
}

function scoreTechnicalStrength(data, skills) {
  const searchableSkills = skills.join(' ').toLowerCase()
  const modernTechnologyCount = STRONG_TECHNOLOGIES.filter((technology) => (
    searchableSkills.includes(technology)
  )).length
  const projectTechText = data.projects.map((project) => project.techStack).join(' ')
  const projectTechnologyCount = countTerms(projectTechText, STRONG_TECHNOLOGIES)

  return {
    score: clampCategory(
      Math.min(skills.length, 8)
      + Math.min(modernTechnologyCount * 1.2, 7)
      + (hasText(data.personalDetails.github) ? 4 : 0)
      + (hasText(data.personalDetails.portfolio) ? 3 : 0)
      + Math.min(projectTechnologyCount, 3),
    ),
    modernTechnologyCount,
    projectTechnologyCount,
  }
}

function getWritingEntries(data) {
  const projectEntries = data.projects.map((project, index) => ({
    section: 'Projects',
    label: project.title || `Project ${index + 1}`,
    text: [project.description, project.highlights].filter(hasText).join('\n'),
  }))
  const experienceEntries = data.experience.map((entry, index) => ({
    section: 'Experience',
    label: entry.role || `Experience ${index + 1}`,
    text: entry.responsibilities,
  }))

  return [...projectEntries, ...experienceEntries].filter((entry) => hasText(entry.text))
}

function scoreImpactStrength(data, writingEntries) {
  const impactText = writingEntries.map((entry) => entry.text).join('\n')
  if (!impactText) {
    return {
      score: 0,
      weakEntries: [],
      strongActionCount: 0,
      measurableEntryCount: 0,
      technicalEntryCount: 0,
    }
  }

  const weakEntries = writingEntries.filter((entry) => countTerms(entry.text, WEAK_PHRASES) > 0)
  const strongActionCount = countTerms(impactText, STRONG_ACTION_WORDS)
  const measurableEntryCount = writingEntries.filter((entry) => containsMeasurableResult(entry.text)).length
  const technicalEntryCount = writingEntries.filter((entry) => containsTechnicalDetail(entry.text)).length
  const detailedEntryCount = writingEntries.filter((entry) => entry.text.trim().length >= 70).length
  const hasDeploymentLink = data.projects.some((project) => hasText(project.liveLink))

  return {
    score: clampCategory(
      Math.min(strongActionCount * 1.5, 7)
      + Math.min(detailedEntryCount * 2, 4)
      + Math.min(measurableEntryCount * 4, 7)
      + Math.min(technicalEntryCount * 1.5, 4)
      + (hasDeploymentLink ? 3 : 0)
      - Math.min(weakEntries.length * 3, 6),
    ),
    weakEntries,
    strongActionCount,
    measurableEntryCount,
    technicalEntryCount,
  }
}

function scoreProfessionalReadiness(data, sectionState) {
  return clampCategory(
    (hasText(data.personalDetails.linkedin) ? 4 : 0)
    + (hasText(data.personalDetails.github) ? 5 : 0)
    + (hasText(data.personalDetails.portfolio) ? 5 : 0)
    + (sectionState.certifications.present ? 5 : 0)
    + (sectionState.experience.present ? 6 : 0),
  )
}

function buildFeedback(data, sectionState, skills, technical, impact, writingEntries) {
  const strengths = []
  const weaknesses = []
  const recommendations = []

  if (skills.length >= 7 && technical.modernTechnologyCount >= 3) {
    strengths.push('Strong technical stack with relevant modern technologies')
  } else if (skills.length > 0) {
    strengths.push('Technical skills section is present')
  }
  if (data.projects.filter((project) => hasText(project.title)).length >= 2) {
    strengths.push('Multiple projects demonstrate practical experience')
  } else if (sectionState.projects.present) {
    strengths.push('A project is included to demonstrate applied skills')
  }
  if (hasText(data.personalDetails.portfolio)) {
    strengths.push('Portfolio is available for recruiters')
  }
  if (hasText(data.personalDetails.github)) {
    strengths.push('GitHub profile supports technical credibility')
  }
  if (impact.strongActionCount >= 4) {
    strengths.push('Descriptions use strong action-oriented language')
  }
  if (impact.measurableEntryCount > 0) {
    strengths.push('Achievements include measurable results')
  }

  if (!sectionState.summary.present) {
    weaknesses.push('Missing professional summary')
  } else if (data.summary.trim().length < 70) {
    weaknesses.push('Professional summary is too brief')
  }
  if (!sectionState.certifications.present) {
    weaknesses.push('Missing certifications')
  }
  if (!sectionState.experience.present) {
    weaknesses.push('Limited experience section')
  }
  if (impact.weakEntries.length > 0 || (sectionState.projects.present && impact.strongActionCount < 2)) {
    weaknesses.push('Project descriptions need stronger action language')
  }
  if (writingEntries.length > 0 && impact.measurableEntryCount === 0) {
    weaknesses.push('Achievements lack measurable results')
  }
  if (skills.length < 6) {
    weaknesses.push('Technical skills coverage is limited')
  }
  if (!hasText(data.personalDetails.linkedin)) {
    weaknesses.push('LinkedIn profile is not included')
  }
  if (!hasText(data.personalDetails.github)) {
    weaknesses.push('GitHub profile is not included')
  }
  if (!hasText(data.personalDetails.portfolio)) {
    weaknesses.push('Portfolio is not included')
  }

  if (writingEntries.length > 0 && impact.measurableEntryCount === 0) {
    recommendations.push('Add measurable achievements such as users served, performance gains, or time saved')
  }
  if (sectionState.projects.present && !data.projects.some((project) => hasText(project.liveLink))) {
    recommendations.push('Add deployment links for completed projects')
  }
  if (impact.strongActionCount < 2 && sectionState.projects.present) {
    recommendations.push('Start project bullets with strong verbs such as built, implemented, or deployed')
  }
  if (impact.technicalEntryCount === 0 && writingEntries.length > 0) {
    recommendations.push('Name the technologies, APIs, databases, and authentication used in each project')
  }
  if (!sectionState.certifications.present) {
    recommendations.push('Add relevant certifications or verified professional courses')
  }
  if (!hasText(data.personalDetails.portfolio)) {
    recommendations.push('Add a portfolio link that showcases live work and case studies')
  }
  if (!sectionState.summary.present) {
    recommendations.push('Write a concise professional summary tailored to your target role')
  }

  if (strengths.length === 0) {
    strengths.push('Resume structure is ready for you to add professional details')
  }

  return {
    strengths: unique(strengths),
    weaknesses: unique(weaknesses),
    recommendations: unique(recommendations),
  }
}

function createDoctorItem({
  issue,
  whyItMatters,
  improvedText,
  section,
  priority,
  originalText,
}) {
  return {
    issue,
    whyItMatters,
    ...(hasText(originalText) ? { originalText: originalText.trim() } : {}),
    improvedText,
    section,
    priority,
  }
}

function buildImprovedWriting(entry, skills) {
  const technologyText = skills.slice(0, 3).join(', ')
  const technologyClause = technologyText
    ? ` using ${technologyText}`
    : ''

  if (entry.section === 'Experience') {
    return `Implemented a production-focused solution${technologyClause}, improving a defined workflow and supporting measurable outcomes for users or the business.`
  }

  return `Built and deployed a responsive web application${technologyClause} with reusable components, structured data handling, and a clear real-world purpose.`
}

function buildResumeDoctor(data, sectionState, skills, impact, writingEntries) {
  const doctorItems = []
  const technologyExamples = skills.slice(0, 4).join(', ') || 'modern development tools'
  const targetRole = data.personalDetails.targetRole.trim() || 'software developer'
  const projectNames = data.projects
    .map((project) => project.title.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' and ')
  const projectContext = projectNames ? ` through projects such as ${projectNames}` : ''

  if (!sectionState.summary.present || data.summary.trim().length < 70) {
    doctorItems.push(createDoctorItem({
      issue: sectionState.summary.present ? 'Professional summary is too brief' : 'Professional summary is missing',
      whyItMatters: 'Recruiters use the opening summary to understand your role, technical focus, and value within a few seconds.',
      originalText: data.summary,
      improvedText: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} with hands-on experience building reliable applications using ${technologyExamples}${projectContext}. Focused on clean implementation, practical problem-solving, and delivering measurable user and business outcomes.`,
      section: 'Professional Summary',
      priority: 'high',
    }))
  }

  if (!hasText(data.personalDetails.github)) {
    doctorItems.push(createDoctorItem({
      issue: 'GitHub profile is missing',
      whyItMatters: 'A GitHub profile gives technical recruiters evidence of code quality, consistency, documentation, and project ownership.',
      improvedText: 'Add your GitHub profile URL and pin 3-5 relevant repositories with clear README files, setup instructions, screenshots, and live links.',
      section: 'Personal Details',
      priority: 'high',
    }))
  }

  if (!hasText(data.personalDetails.portfolio)) {
    doctorItems.push(createDoctorItem({
      issue: 'Portfolio link is missing',
      whyItMatters: 'A portfolio helps recruiters verify live work quickly and understand the problem, process, stack, and outcome behind each project.',
      improvedText: 'Add a portfolio with 2-4 focused case studies showing the project purpose, your contribution, technologies used, screenshots, source code, and deployment.',
      section: 'Personal Details',
      priority: 'medium',
    }))
  }

  if (!sectionState.certifications.present) {
    doctorItems.push(createDoctorItem({
      issue: 'Certifications or learning proof are missing',
      whyItMatters: 'Verified learning can strengthen an early-career resume when professional experience is limited and shows continued skill development.',
      improvedText: 'Add role-relevant certifications, verified courses, technical workshops, or learning credentials with the issuer, completion year, and credential URL.',
      section: 'Certifications',
      priority: sectionState.experience.present ? 'low' : 'medium',
    }))
  }

  impact.weakEntries.forEach((entry) => {
    doctorItems.push(createDoctorItem({
      issue: `Weak wording in ${entry.label}`,
      whyItMatters: 'Generic phrases describe activity but do not communicate ownership, technical depth, or the result of the work.',
      originalText: entry.text,
      improvedText: buildImprovedWriting(entry, skills),
      section: entry.section,
      priority: 'high',
    }))
  })

  writingEntries
    .filter((entry) => !containsMeasurableResult(entry.text))
    .slice(0, 3)
    .forEach((entry) => {
      doctorItems.push(createDoctorItem({
        issue: `No measurable outcome in ${entry.label}`,
        whyItMatters: 'Metrics show scale and make your contribution credible by connecting technical work to a visible result.',
        originalText: entry.text,
        improvedText: `${buildImprovedWriting(entry, skills)} Add a verified result, for example: served 500+ users, reduced load time by 30%, automated 5 hours of weekly work, or deployed the product publicly.`,
        section: entry.section,
        priority: 'high',
      }))
    })

  if (writingEntries.length > 0 && impact.technicalEntryCount === 0) {
    doctorItems.push(createDoctorItem({
      issue: 'Project and experience details lack technical depth',
      whyItMatters: 'Naming implementation details helps reviewers understand what you can build rather than only what the product does.',
      improvedText: 'Add the technologies used, authentication approach, database, APIs, deployment status, performance work, and the real-world purpose to each relevant bullet.',
      section: sectionState.projects.present ? 'Projects' : 'Experience',
      priority: 'medium',
    }))
  }

  if (!sectionState.experience.present) {
    doctorItems.push(createDoctorItem({
      issue: 'Experience section is missing',
      whyItMatters: 'Recruiters look for evidence that you applied skills with ownership, deadlines, collaboration, or real users.',
      improvedText: 'Include internships, freelance work, volunteering, campus roles, open-source contributions, or substantial project leadership. Describe what you owned, how you built it, and the result.',
      section: 'Experience',
      priority: sectionState.projects.present ? 'medium' : 'high',
    }))
  }

  return uniqueDoctorItems(doctorItems)
}

function calibrateOverallScore(rawScore, data, sectionState, skills, technical, impact) {
  const presentSectionCount = Object.values(sectionState).filter((section) => section.present).length
  const hasStrongSkills = skills.length >= 7 && technical.modernTechnologyCount >= 3
  const hasStrongProjects = sectionState.projects.present
    && impact.strongActionCount >= 2
    && impact.technicalEntryCount > 0
  const hasClearSummary = data.summary.trim().length >= 70
  const hasTechnicalOrMeasuredImpact = impact.measurableEntryCount > 0
    || (impact.technicalEntryCount >= 2 && impact.strongActionCount >= 3)
  const hasCredentialOrExperience = sectionState.certifications.present
    || sectionState.experience.present
  const premiumSignals = [
    hasStrongSkills,
    hasStrongProjects,
    hasText(data.personalDetails.github),
    hasText(data.personalDetails.portfolio),
    hasClearSummary,
    hasTechnicalOrMeasuredImpact,
    hasCredentialOrExperience,
  ]

  let ceiling = 100
  if (presentSectionCount <= 2) {
    ceiling = 25
  } else if (presentSectionCount <= 3) {
    ceiling = 45
  } else if (!sectionState.projects.present && !sectionState.experience.present) {
    ceiling = 60
  } else if (!premiumSignals.every(Boolean)) {
    ceiling = 85
  }

  const calibratedScore = presentSectionCount >= 4 && rawScore > 0
    ? Math.max(20, rawScore)
    : rawScore

  return Math.max(0, Math.min(100, ceiling, Math.round(calibratedScore)))
}

export function analyzeResumeHealth(input) {
  try {
    const data = adaptInput(input)
    const skills = parseSkills(data)
    const sectionState = getSectionState(data, skills)
    const writingEntries = getWritingEntries(data)
    const sectionCompletenessScore = scoreCompleteness(sectionState)
    const technical = scoreTechnicalStrength(data, skills)
    const impact = scoreImpactStrength(data, writingEntries)
    const professionalReadinessScore = scoreProfessionalReadiness(data, sectionState)
    const feedback = buildFeedback(data, sectionState, skills, technical, impact, writingEntries)
    const missingSections = Object.entries(sectionState)
      .filter(([, state]) => !state.present)
      .map(([section]) => SECTION_LABELS[section])
    const rawScore = sectionCompletenessScore
      + technical.score
      + impact.score
      + professionalReadinessScore
    const overallScore = calibrateOverallScore(
      rawScore,
      data,
      sectionState,
      skills,
      technical,
      impact,
    )
    const resumeDoctor = buildResumeDoctor(
      data,
      sectionState,
      skills,
      impact,
      writingEntries,
    )

    return {
      overallScore,
      sectionCompletenessScore,
      technicalStrengthScore: technical.score,
      impactStrengthScore: impact.score,
      professionalReadinessScore,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      missingSections,
      recommendations: feedback.recommendations,
      resumeDoctor,
      doctorSuggestions: resumeDoctor,
    }
  } catch {
    return EMPTY_HEALTH_REPORT
  }
}

export default analyzeResumeHealth
