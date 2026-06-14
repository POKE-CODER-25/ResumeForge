export const navigationItems = [
  { label: 'Home', path: '/' },
  { label: 'Builder', path: '/builder' },
  { label: 'Health Report', path: '/credential-report' },
  { label: 'Editor', path: '/editor' },
  { label: 'Download', path: '/download' },
]

export const builderSections = [
  { title: 'Personal Details', description: 'Contact information and professional headline', icon: 'file', status: 'Start here' },
  { title: 'Education', description: 'Degrees, institutions, and academic highlights', icon: 'award', status: 'Not started' },
  { title: 'Skills', description: 'Technical, professional, and domain expertise', icon: 'target', status: 'Not started' },
  { title: 'Projects', description: 'Selected work with measurable outcomes', icon: 'sparkle', status: 'Not started' },
  { title: 'Experience', description: 'Roles, responsibilities, and achievements', icon: 'trend', status: 'Not started' },
  { title: 'Certifications', description: 'Credentials, courses, and professional training', icon: 'shield', status: 'Not started' },
]

export const reportCards = [
  { title: 'Strengths', value: '3 identified', description: 'Clear education history, strong skills coverage, and relevant project work.', icon: 'trend', tone: 'success' },
  { title: 'Weak Areas', value: '2 opportunities', description: 'Add measurable results and make experience statements more concise.', icon: 'target', tone: 'warning' },
  { title: 'Missing Sections', value: '1 recommended', description: 'A short professional summary would improve recruiter readability.', icon: 'search', tone: 'info' },
]

export const downloadFormats = [
  { name: 'PDF', description: 'Best for applications and preserving visual layout.', detail: 'Recommended', extension: '.pdf' },
  { name: 'DOCX', description: 'Editable format for recruiters and custom updates.', detail: 'Microsoft Word', extension: '.docx' },
  { name: 'TXT', description: 'Plain text for forms and maximum ATS compatibility.', detail: 'Plain text', extension: '.txt' },
]
