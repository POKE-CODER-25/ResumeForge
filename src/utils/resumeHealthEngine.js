import { normalizeResumeData } from '../data/resumeData.js'

const STRONG_TECHNOLOGIES = [
  'react native',
  'next.js',
  'node.js',
  'typescript',
  'postgresql',
  'javascript',
  'firebase',
  'mongodb',
  'python',
  'docker',
  'flutter',
  'react',
  'aws',
]

const STRONG_ACTION_WORDS = [
  'built',
  'implemented',
  'deployed',
  'designed',
  'developed',
  'optimized',
  'integrated',
  'engineered',
]

const WEAK_PHRASES = [
  'made website',
  'worked on project',
  'created app',
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

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasEntry(entries, fields) {
  return entries.some((entry) => fields.some((field) => hasText(entry[field])))
}

function clampScore(score) {
  return Math.max(0, Math.min(25, Math.round(score)))
}

function unique(items) {
  return [...new Set(items)]
}

function parseSkills(data) {
  return unique(
    [data.skills.technicalSkills, data.skills.tools]
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
  return /\b\d+(?:\.\d+)?\s*(?:%|x|\+|users?|customers?|requests?|seconds?|ms|hours?|days?)?\b/i.test(text)
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

function getSectionState(data) {
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
      completion: hasText(data.summary) ? Math.min(data.summary.trim().length / 120, 1) : 0,
    },
    education: {
      present: hasEntry(data.education, ['degree', 'institution']),
      completion: hasEntry(data.education, ['degree', 'institution']) ? 1 : 0,
    },
    skills: {
      present: parseSkills(data).length > 0,
      completion: Math.min(parseSkills(data).length / 5, 1),
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
  return clampScore(
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
  const skillBreadthScore = Math.min(skills.length, 10)
  const modernStackScore = Math.min(modernTechnologyCount * 1.5, 9)
  const githubScore = hasText(data.personalDetails.github) ? 3 : 0
  const portfolioScore = hasText(data.personalDetails.portfolio) ? 3 : 0

  return {
    score: clampScore(skillBreadthScore + modernStackScore + githubScore + portfolioScore),
    modernTechnologyCount,
  }
}

function getImpactText(data) {
  const projectText = data.projects.flatMap((project) => [
    project.description,
    project.highlights,
  ])
  const experienceText = data.experience.map((entry) => entry.responsibilities)

  return [...projectText, ...experienceText].filter(hasText).join('\n')
}

function scoreImpactStrength(data) {
  const impactText = getImpactText(data)
  if (!impactText) {
    return {
      score: 0,
      hasWeakPhrase: false,
      strongActionCount: 0,
      hasMeasurableImpact: false,
    }
  }

  const strongActionCount = countTerms(impactText, STRONG_ACTION_WORDS)
  const hasWeakPhrase = countTerms(impactText, WEAK_PHRASES) > 0
  const hasMeasurableImpact = containsMeasurableResult(impactText)
  const detailedDescriptionScore = Math.min(impactText.trim().length / 40, 8)
  const actionWordScore = Math.min(strongActionCount * 3, 10)
  const measurableScore = hasMeasurableImpact ? 5 : 0
  const projectLinkScore = data.projects.some((project) => hasText(project.liveLink)) ? 2 : 0
  const weakPhrasePenalty = hasWeakPhrase ? 4 : 0

  return {
    score: clampScore(
      detailedDescriptionScore + actionWordScore + measurableScore
      + projectLinkScore - weakPhrasePenalty,
    ),
    hasWeakPhrase,
    strongActionCount,
    hasMeasurableImpact,
  }
}

function scoreProfessionalReadiness(data, sectionState) {
  const checks = [
    hasText(data.personalDetails.linkedin),
    hasText(data.personalDetails.github),
    hasText(data.personalDetails.portfolio),
    sectionState.certifications.present,
    sectionState.experience.present,
  ]

  return checks.filter(Boolean).length * 5
}

function buildFeedback(data, sectionState, skills, technical, impact) {
  const strengths = []
  const weaknesses = []
  const recommendations = []

  if (skills.length >= 6 && technical.modernTechnologyCount >= 2) {
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
  if (impact.strongActionCount >= 3) {
    strengths.push('Descriptions use strong action-oriented language')
  }
  if (impact.hasMeasurableImpact) {
    strengths.push('Achievements include measurable results')
  }

  if (!sectionState.summary.present) {
    weaknesses.push('Missing professional summary')
  } else if (data.summary.trim().length < 60) {
    weaknesses.push('Professional summary is too brief')
  }

  if (!sectionState.certifications.present) {
    weaknesses.push('Missing certifications')
  }
  if (!sectionState.experience.present) {
    weaknesses.push('Limited experience section')
  }
  if (sectionState.projects.present && (impact.strongActionCount < 2 || impact.hasWeakPhrase)) {
    weaknesses.push('Project descriptions need stronger action language')
  }
  if (getImpactText(data) && !impact.hasMeasurableImpact) {
    weaknesses.push('Achievements lack measurable results')
  }
  if (skills.length < 5) {
    weaknesses.push('Technical skills coverage is limited')
  }
  if (!hasText(data.personalDetails.linkedin)) {
    weaknesses.push('LinkedIn profile is not included')
  }

  if (!impact.hasMeasurableImpact && getImpactText(data)) {
    recommendations.push('Add measurable achievements such as percentages, users, or time saved')
  }
  if (sectionState.projects.present && !data.projects.some((project) => hasText(project.liveLink))) {
    recommendations.push('Add deployment links for completed projects')
  }
  if (impact.strongActionCount < 2 && sectionState.projects.present) {
    recommendations.push('Start project bullets with strong verbs such as built, implemented, or deployed')
  }
  if (!sectionState.certifications.present) {
    recommendations.push('Add relevant certifications or verified professional courses')
  }
  if (!hasText(data.personalDetails.portfolio)) {
    recommendations.push('Add a portfolio link that showcases your best work')
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

function buildDoctorSuggestions(data, weaknesses, skills) {
  const technologyExamples = skills.slice(0, 3).join(', ') || 'React, Firebase, and modern development tools'
  const targetRole = data.personalDetails.targetRole.trim() || 'software developer'

  return weaknesses.map((weakness) => {
    if (weakness === 'Missing professional summary' || weakness === 'Professional summary is too brief') {
      return {
        weakness,
        suggestion: `Add: "Passionate ${targetRole} experienced in building reliable applications using ${technologyExamples}, with a focus on clean user experiences and measurable results."`,
      }
    }

    if (weakness === 'Project descriptions need stronger action language') {
      return {
        weakness,
        suggestion: 'Replace "Made a website" with "Built and deployed a responsive web application using React and Firebase with real-time data synchronization."',
      }
    }

    if (weakness === 'Achievements lack measurable results') {
      return {
        weakness,
        suggestion: 'Add the scale and outcome: "Optimized API requests to reduce page load time by 35% and improve the experience for 1,000+ users."',
      }
    }

    if (weakness === 'Missing certifications') {
      return {
        weakness,
        suggestion: 'Add relevant verified credentials with the issuer, completion year, and credential link.',
      }
    }

    if (weakness === 'Limited experience section') {
      return {
        weakness,
        suggestion: 'Include internships, freelance work, volunteering, or substantial project roles and describe the outcomes you owned.',
      }
    }

    if (weakness === 'Technical skills coverage is limited') {
      return {
        weakness,
        suggestion: 'List languages, frameworks, databases, cloud platforms, and developer tools you can use confidently.',
      }
    }

    return {
      weakness,
      suggestion: 'Add a complete LinkedIn URL and ensure the profile headline matches your target role.',
    }
  })
}

export function analyzeResumeHealth(input) {
  const data = adaptInput(input)
  const sectionState = getSectionState(data)
  const skills = parseSkills(data)
  const sectionCompletenessScore = scoreCompleteness(sectionState)
  const technical = scoreTechnicalStrength(data, skills)
  const impact = scoreImpactStrength(data)
  const professionalReadinessScore = scoreProfessionalReadiness(data, sectionState)
  const feedback = buildFeedback(data, sectionState, skills, technical, impact)
  const missingSections = Object.entries(sectionState)
    .filter(([, state]) => !state.present)
    .map(([section]) => SECTION_LABELS[section])
  const overallScore = (
    sectionCompletenessScore
    + technical.score
    + impact.score
    + professionalReadinessScore
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
    doctorSuggestions: buildDoctorSuggestions(data, feedback.weaknesses, skills),
  }
}

export default analyzeResumeHealth
