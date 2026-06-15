import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumePreview from '../components/ResumePreview'
import {
  getActiveResumeData,
  saveActiveResumeData,
} from '../data/activeResumeData'
import {
  clearResumeData,
  createResumeEntry,
  getResumeCompletion,
  loadResumeData,
  normalizeResumeData,
  saveResumeData,
} from '../data/resumeData'
import { RESUME_WORKFLOW_CLEARED_EVENT } from '../data/uploadedResumeData'

const repeatableSections = {
  education: {
    title: 'Education',
    description: 'Add degrees, institutions, academic dates, and results.',
    icon: 'award',
    entryLabel: 'Education',
  },
  projects: {
    title: 'Projects',
    description: 'Showcase relevant builds, technology choices, and outcomes.',
    icon: 'sparkle',
    entryLabel: 'Project',
  },
  experience: {
    title: 'Experience',
    description: 'Describe professional roles with concise, outcome-focused statements.',
    icon: 'trend',
    entryLabel: 'Experience',
  },
  certifications: {
    title: 'Certifications',
    description: 'Add verified credentials and professional learning.',
    icon: 'shield',
    entryLabel: 'Certification',
  },
}

function getInputValue(event) {
  return event?.target?.value ?? ''
}

function SectionHeader({ icon = 'file', title = '', description = '' }) {
  return (
    <div className="form-section-heading">
      <span><Icon name={icon} size={20} /></span>
      <div><h2>{title}</h2><p>{description}</p></div>
    </div>
  )
}

function Builder() {
  const location = useLocation()
  const [activeSource, setActiveSource] = useState(getActiveResumeData)
  const [resumeData, setResumeData] = useState(() => activeSource.resumeData || loadResumeData())
  const completion = getResumeCompletion(resumeData)

  useEffect(() => {
    saveResumeData(resumeData)
    saveActiveResumeData(
      resumeData,
      activeSource.source === 'uploaded-import'
        ? 'uploaded-import'
        : activeSource.source === 'editor-approved'
          ? 'editor-approved'
          : 'builder',
    )
  }, [resumeData, activeSource.source])

  useEffect(() => {
    function handleWorkflowCleared() {
      const nextSource = getActiveResumeData()
      setActiveSource(nextSource)
      setResumeData(nextSource.resumeData)
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    }
  }, [])

  function updateObject(section, field, value) {
    setResumeData((current) => {
      const safeCurrent = normalizeResumeData(current)
      const sectionData = safeCurrent[section]
      if (!sectionData || Array.isArray(sectionData)) {
        return safeCurrent
      }

      return {
        ...safeCurrent,
        [section]: {
          ...sectionData,
          [field]: value ?? '',
        },
      }
    })
  }

  function updateEntry(section, id, field, value) {
    setResumeData((current) => {
      const safeCurrent = normalizeResumeData(current)
      const entries = Array.isArray(safeCurrent[section]) ? safeCurrent[section] : []

      return {
        ...safeCurrent,
        [section]: entries.map((entry) => (
          entry.id === id ? { ...entry, [field]: value ?? '' } : entry
        )),
      }
    })
  }

  function addEntry(section) {
    const newEntry = createResumeEntry(section)
    if (!newEntry) {
      return
    }

    setResumeData((current) => {
      const safeCurrent = normalizeResumeData(current)
      const entries = Array.isArray(safeCurrent[section]) ? safeCurrent[section] : []

      return {
        ...safeCurrent,
        [section]: [...entries, newEntry],
      }
    })
  }

  function removeEntry(section, id) {
    setResumeData((current) => {
      const safeCurrent = normalizeResumeData(current)
      const entries = Array.isArray(safeCurrent[section]) ? safeCurrent[section] : []

      return {
        ...safeCurrent,
        [section]: entries.filter((entry) => entry.id !== id),
      }
    })
  }

  function handleClear() {
    if (window.confirm('Clear all resume details and start again?')) {
      setResumeData(clearResumeData())
    }
  }

  const safeResumeData = normalizeResumeData(resumeData)
  const personal = safeResumeData.personalDetails

  return (
    <div className="page-surface builder-page">
      <div className="container builder-container">
        <PageHeader
          eyebrow="Builder Workspace"
          title="Resume Builder"
          description="Enter your information and watch it become a clean, application-ready engineering resume."
          actions={(
            <button className="button button-secondary clear-button" type="button" onClick={handleClear}>
              Clear form
            </button>
          )}
        />

        {location.state?.importedResume && activeSource.uploadedResume?.importedForEditing && (
          <div className="import-success" role="status">
            <Icon name="check" size={18} />
            <div><strong>Uploaded resume loaded into editor.</strong><span>You can now refine the parsed content in the Builder.</span></div>
          </div>
        )}

        <div className="workspace-source-row">
          <span className={`analysis-source ${activeSource.source.includes('uploaded') ? 'uploaded' : ''}`}>
            {activeSource.sourceLabel}
          </span>
          {activeSource.uploadedResume && !activeSource.uploadedResume.importedForEditing && (
            <span className="analysis-source uploaded">Uploaded Resume Analysis Available</span>
          )}
        </div>

        <div className="progress-card builder-progress">
          <div><span>Profile completion</span><strong>{completion}%</strong></div>
          <div className="progress-track"><span style={{ width: `${Math.max(completion, 2)}%` }} /></div>
          <p>Your draft is saved automatically in this browser.</p>
        </div>

        <div className="functional-builder-layout">
          <form className="resume-form" onSubmit={(event) => event.preventDefault()}>
            <section className="resume-form-section">
              <SectionHeader
                icon="file"
                title="Personal Details"
                description="Add the contact and profile information recruiters need."
              />
              <div className="form-grid">
                <FormField label="Full name" name="fullName" value={personal.fullName} onChange={(event) => updateObject('personalDetails', 'fullName', getInputValue(event))} placeholder="Alex Morgan" />
                <FormField label="Target role" name="targetRole" value={personal.targetRole} onChange={(event) => updateObject('personalDetails', 'targetRole', getInputValue(event))} placeholder="Software Engineer" />
                <FormField label="Email" name="email" type="email" value={personal.email} onChange={(event) => updateObject('personalDetails', 'email', getInputValue(event))} placeholder="alex@example.com" />
                <FormField label="Phone" name="phone" type="tel" value={personal.phone} onChange={(event) => updateObject('personalDetails', 'phone', getInputValue(event))} placeholder="+1 555 012 3456" />
                <FormField label="Location" name="location" value={personal.location} onChange={(event) => updateObject('personalDetails', 'location', getInputValue(event))} placeholder="Austin, TX" />
                <FormField label="LinkedIn" name="linkedin" type="url" value={personal.linkedin} onChange={(event) => updateObject('personalDetails', 'linkedin', getInputValue(event))} placeholder="https://linkedin.com/in/..." />
                <FormField label="GitHub" name="github" type="url" value={personal.github} onChange={(event) => updateObject('personalDetails', 'github', getInputValue(event))} placeholder="https://github.com/..." />
                <FormField label="Portfolio" name="portfolio" type="url" value={personal.portfolio} onChange={(event) => updateObject('personalDetails', 'portfolio', getInputValue(event))} placeholder="https://yourportfolio.com" />
              </div>
            </section>

            <section className="resume-form-section">
              <SectionHeader
                icon="document"
                title="Professional Summary"
                description="Write a concise overview of your background, strengths, and direction."
              />
              <div className="form-grid">
                <FormField
                  label="Summary"
                  name="summary"
                  value={safeResumeData.summary}
                  onChange={(event) => {
                    const value = getInputValue(event)
                    setResumeData((current) => ({ ...normalizeResumeData(current), summary: value }))
                  }}
                  placeholder="Engineering professional with experience building..."
                  multiline
                  rows={5}
                  hint="Aim for 2-4 focused sentences."
                />
              </div>
            </section>

            <RepeatableFormSection
              section="education"
              config={repeatableSections.education}
              entries={safeResumeData.education}
              onAdd={addEntry}
              onRemove={removeEntry}
              onUpdate={updateEntry}
            />

            <section className="resume-form-section">
              <SectionHeader
                icon="target"
                title="Skills"
                description="Group relevant capabilities so recruiters can scan them quickly."
              />
              <div className="form-grid">
                <FormField label="Technical skills" name="technicalSkills" value={safeResumeData.skills.technicalSkills} onChange={(event) => updateObject('skills', 'technicalSkills', getInputValue(event))} placeholder="JavaScript, React, Node.js, SQL" multiline rows={3} hint="Separate skills with commas." />
                <FormField label="Tools" name="tools" value={safeResumeData.skills.tools} onChange={(event) => updateObject('skills', 'tools', getInputValue(event))} placeholder="Git, Docker, AWS, Figma" multiline rows={3} hint="Separate tools with commas." />
                <FormField label="Soft skills" name="softSkills" value={safeResumeData.skills.softSkills} onChange={(event) => updateObject('skills', 'softSkills', getInputValue(event))} placeholder="Communication, leadership, problem solving" multiline rows={3} hint="Separate skills with commas." />
              </div>
            </section>

            <RepeatableFormSection
              section="projects"
              config={repeatableSections.projects}
              entries={safeResumeData.projects}
              onAdd={addEntry}
              onRemove={removeEntry}
              onUpdate={updateEntry}
            />

            <RepeatableFormSection
              section="experience"
              config={repeatableSections.experience}
              entries={safeResumeData.experience}
              onAdd={addEntry}
              onRemove={removeEntry}
              onUpdate={updateEntry}
            />

            <RepeatableFormSection
              section="certifications"
              config={repeatableSections.certifications}
              entries={safeResumeData.certifications}
              onAdd={addEntry}
              onRemove={removeEntry}
              onUpdate={updateEntry}
            />

            <div className="builder-form-actions">
              <button className="button button-secondary" type="button" onClick={handleClear}>Clear form</button>
              <Link className="button button-primary button-large" to="/credential-report">
                Continue to Credential Report <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          </form>

          <aside className="live-preview-column">
            <div className="live-preview-toolbar">
              <div><span className="live-dot" /> Live preview</div>
              <span>{completion}% complete</span>
            </div>
            <div className="builder-preview-stage">
              <ResumePreview resumeData={safeResumeData} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function RepeatableFormSection({
  section = '',
  config = {},
  entries = [],
  onAdd = () => {},
  onRemove = () => {},
  onUpdate = () => {},
}) {
  const safeEntries = Array.isArray(entries) ? entries : []
  const safeConfig = {
    icon: config.icon || 'file',
    title: config.title || '',
    description: config.description || '',
    entryLabel: config.entryLabel || 'Entry',
  }

  return (
    <section className="resume-form-section">
      <div className="repeatable-section-header">
        <SectionHeader icon={safeConfig.icon} title={safeConfig.title} description={safeConfig.description} />
        <button className="add-entry-button" type="button" onClick={() => onAdd(section)}>
          <Icon name="plus" size={17} /> Add {safeConfig.entryLabel}
        </button>
      </div>

      {safeEntries.length === 0 && (
        <button className="empty-entry-button" type="button" onClick={() => onAdd(section)}>
          <Icon name="plus" size={18} /> Add your first {safeConfig.entryLabel.toLowerCase()}
        </button>
      )}

      <div className="repeatable-entry-list">
        {safeEntries.map((entry, index) => (
          <div className="repeatable-entry" key={entry?.id || `${section}-${index}`}>
            <div className="entry-heading">
              <strong>{safeConfig.entryLabel} {index + 1}</strong>
              <button type="button" onClick={() => onRemove(section, entry?.id)}>Remove</button>
            </div>
            <EntryFields section={section} entry={entry} onUpdate={onUpdate} />
          </div>
        ))}
      </div>
    </section>
  )
}

function EntryFields({ section = '', entry = {}, onUpdate = () => {} }) {
  const safeEntry = entry && typeof entry === 'object' ? entry : {}
  const field = (name) => ({
    name: `${section}-${safeEntry.id || 'entry'}-${name}`,
    value: safeEntry[name] ?? '',
    onChange: (event) => onUpdate(
      section,
      safeEntry.id,
      name,
      getInputValue(event),
    ),
  })

  if (section === 'education') {
    return (
      <div className="form-grid">
        <FormField label="Degree" {...field('degree')} placeholder="B.Tech in Computer Science" />
        <FormField label="Institution" {...field('institution')} placeholder="University name" />
        <FormField label="Location" {...field('location')} placeholder="City, State" />
        <FormField label="CGPA / Grade" {...field('cgpa')} placeholder="8.7 / 10" />
        <FormField label="Start year" {...field('startYear')} placeholder="2021" />
        <FormField label="End year" {...field('endYear')} placeholder="2025" />
      </div>
    )
  }

  if (section === 'projects') {
    return (
      <div className="form-grid">
        <FormField label="Project title" {...field('title')} placeholder="Project name" />
        <FormField label="Tech stack" {...field('techStack')} placeholder="React, Node.js, PostgreSQL" />
        <FormField label="Description" {...field('description')} placeholder="What the project does and why it matters." multiline rows={3} />
        <FormField label="Highlights" {...field('highlights')} placeholder="Improved load time by 40%&#10;Built role-based access control" multiline rows={4} hint="Use a new line for each resume bullet." />
        <FormField label="Live link" {...field('liveLink')} type="url" placeholder="https://project.example.com" />
        <FormField label="GitHub link" {...field('githubLink')} type="url" placeholder="https://github.com/..." />
      </div>
    )
  }

  if (section === 'experience') {
    return (
      <div className="form-grid">
        <FormField label="Role" {...field('role')} placeholder="Software Engineer Intern" />
        <FormField label="Company" {...field('company')} placeholder="Company name" />
        <FormField label="Location" {...field('location')} placeholder="City, State or Remote" />
        <FormField label="Start date" {...field('startDate')} placeholder="Jun 2025" />
        <FormField label="End date" {...field('endDate')} placeholder="Present" />
        <FormField label="Responsibilities and achievements" {...field('responsibilities')} placeholder="Built a reusable component system...&#10;Reduced API response time by 25%..." multiline rows={5} hint="Use a new line for each resume bullet." />
      </div>
    )
  }

  return (
    <div className="form-grid">
      <FormField label="Certification title" {...field('title')} placeholder="AWS Certified Cloud Practitioner" />
      <FormField label="Issuer" {...field('issuer')} placeholder="Amazon Web Services" />
      <FormField label="Year" {...field('year')} placeholder="2026" />
      <FormField label="Credential link" {...field('link')} type="url" placeholder="https://..." />
    </div>
  )
}

export default Builder
