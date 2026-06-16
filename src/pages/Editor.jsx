import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumePreview from '../components/ResumePreview'
import {
  getActiveResumeData,
  saveActiveResumeData,
} from '../data/activeResumeData'
import {
  createResumeEntry,
  normalizeResumeData,
  saveResumeData,
} from '../data/resumeData'
import {
  getSuggestionId,
  loadEditorReviewStatuses,
  saveEditorReviewStatuses,
} from '../data/resumeEditorData'
import {
  RESUME_WORKFLOW_CLEARED_EVENT,
} from '../data/uploadedResumeData'
import { analyzeResumeHealth } from '../utils/resumeHealthEngine'

const repeatableFields = {
  education: [
    ['Degree', 'degree'], ['Institution', 'institution'], ['Location', 'location'],
    ['Start year', 'startYear'], ['End year', 'endYear'], ['CGPA / Grade', 'cgpa'],
  ],
  projects: [
    ['Project title', 'title'], ['Tech stack', 'techStack'],
    ['Description', 'description', true], ['Highlights', 'highlights', true],
    ['Live link', 'liveLink'], ['GitHub link', 'githubLink'],
  ],
  experience: [
    ['Role', 'role'], ['Company', 'company'], ['Location', 'location'],
    ['Start date', 'startDate'], ['End date', 'endDate'],
    ['Responsibilities and achievements', 'responsibilities', true],
  ],
  certifications: [
    ['Certification title', 'title'], ['Issuer', 'issuer'],
    ['Year', 'year'], ['Credential link', 'link'],
  ],
}

const sectionLabels = {
  education: 'Education',
  projects: 'Projects',
  experience: 'Experience',
  certifications: 'Certifications',
}

function getValue(event) {
  return event?.target?.value ?? ''
}

const guidancePatterns = [
  /add a verified result/gi,
  /for example:?/gi,
  /example:/gi,
  /served 500\+ users/gi,
  /reduced load time by 30%/gi,
  /automated 5 hours of weekly work/gi,
  /or deployed the product publicly/gi,
]

function normalizeComparableText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.!?;:,\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeSuggestionText(value) {
  const text = String(value || '')
  const guidanceIndex = text.search(/(?:add a verified result|for example:?|example:)/i)
  const resumeText = guidanceIndex >= 0 ? text.slice(0, guidanceIndex) : text

  return guidancePatterns
    .reduce((current, pattern) => current.replace(pattern, ''), resumeText)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

function isGuidanceOnlyText(value) {
  const sanitized = sanitizeSuggestionText(value)
  return !sanitized || !/[a-z0-9]/i.test(sanitized)
}

function fieldContainsText(fieldValue, text) {
  const comparableField = normalizeComparableText(fieldValue)
  const comparableText = normalizeComparableText(text)
  return Boolean(
    comparableText
    && (
      comparableField === comparableText
      || comparableField.includes(comparableText)
      || comparableField.split('\n').some((line) => normalizeComparableText(line) === comparableText)
    ),
  )
}

function isDuplicateResumeText(resumeData, text) {
  const data = normalizeResumeData(resumeData)
  const searchableFields = [
    data.summary,
    ...data.projects.flatMap((project) => [project.description, project.highlights]),
    ...data.experience.map((entry) => entry.responsibilities),
  ]

  return searchableFields.some((field) => fieldContainsText(field, text))
}

function replaceLineOrText(value, original, replacement) {
  const lines = String(value || '').split('\n')
  const lineIndex = lines.findIndex((line) => fieldContainsText(line, original))
  if (lineIndex >= 0) {
    lines[lineIndex] = replacement
    return lines.join('\n')
  }

  if (fieldContainsText(value, original)) {
    return String(value || '').replace(original, replacement)
  }

  return null
}

function getProjectLabelFromSuggestion(suggestion) {
  const issue = String(suggestion?.issue || '')
  const match = issue.match(/\bin\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

function findProjectForSuggestion(data, suggestion) {
  const original = suggestion.originalText?.trim()
  if (original) {
    const project = data.projects.find((entry) => (
      fieldContainsText(entry.description, original)
      || fieldContainsText(entry.highlights, original)
    ))
    if (project) {
      return project
    }
  }

  const projectLabel = getProjectLabelFromSuggestion(suggestion)
  if (!projectLabel) {
    return null
  }

  return data.projects.find((entry) => (
    normalizeComparableText(entry.title) === normalizeComparableText(projectLabel)
  )) || null
}

function replaceSuggestionText(resumeData, suggestion, sanitizedText) {
  const original = suggestion.originalText?.trim()
  if (!original || !sanitizedText) {
    return null
  }

  const data = normalizeResumeData(resumeData)
  const section = suggestion.section
  const targets = section === 'Projects'
    ? { key: 'projects', fields: ['description', 'highlights'] }
    : section === 'Experience'
      ? { key: 'experience', fields: ['responsibilities'] }
      : null

  if (!targets) {
    return null
  }

  const targetProject = section === 'Projects'
    ? findProjectForSuggestion(data, suggestion)
    : null
  let replaced = false
  const entries = data[targets.key].map((entry) => {
    if (replaced) {
      return entry
    }
    if (targetProject && entry.id !== targetProject.id) {
      return entry
    }

    for (const field of targets.fields) {
      const nextValue = replaceLineOrText(entry[field], original, sanitizedText)
      if (nextValue !== null) {
        replaced = true
        return { ...entry, [field]: nextValue }
      }
    }
    return entry
  })

  return replaced ? { ...data, [targets.key]: entries } : null
}

function appendProjectSuggestion(resumeData, suggestion, sanitizedText) {
  const data = normalizeResumeData(resumeData)
  const targetProject = findProjectForSuggestion(data, suggestion)
  const fallbackProject = data.projects.find((project) => (
    project.title || project.description || project.highlights
  ))
  const projectToUpdate = targetProject || fallbackProject

  if (!projectToUpdate) {
    return null
  }

  return {
    ...data,
    projects: data.projects.map((project) => {
      if (project.id !== projectToUpdate.id) {
        return project
      }

      return {
        ...project,
        highlights: [project.highlights, sanitizedText].filter(Boolean).join('\n'),
      }
    }),
  }
}

function Editor() {
  const [activeResume, setActiveResume] = useState(getActiveResumeData)
  const [resumeData, setResumeData] = useState(() => activeResume.resumeData)
  const [reviewStatuses, setReviewStatuses] = useState(loadEditorReviewStatuses)
  const [saveStatus, setSaveStatus] = useState('Saved automatically')
  const [appendRequest, setAppendRequest] = useState('')
  const saveStatusTimer = useRef(null)
  const appliedSuggestionIds = useRef(new Set())
  const [initialSuggestions, setInitialSuggestions] = useState(() => (
    analyzeResumeHealth(activeResume.resumeData).resumeDoctor
  ))
  const report = useMemo(() => analyzeResumeHealth(resumeData), [resumeData])

  useEffect(() => {
    function handleWorkflowCleared() {
      const nextSource = getActiveResumeData()
      setActiveResume(nextSource)
      setResumeData(nextSource.resumeData)
      setInitialSuggestions(analyzeResumeHealth(nextSource.resumeData).resumeDoctor)
      setReviewStatuses({})
      appliedSuggestionIds.current = new Set()
      setAppendRequest('')
      setSaveStatus('Saved automatically')
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
      if (saveStatusTimer.current) {
        window.clearTimeout(saveStatusTimer.current)
      }
    }
  }, [])

  function commitResume(nextResume) {
    const normalized = normalizeResumeData(nextResume)
    setSaveStatus('Unsaved changes')
    setResumeData(normalized)
    if (saveResumeData(normalized)) {
      saveActiveResumeData(normalized, 'editor-approved')
      if (saveStatusTimer.current) {
        window.clearTimeout(saveStatusTimer.current)
      }
      saveStatusTimer.current = window.setTimeout(() => {
        setSaveStatus('Last saved just now')
      }, 350)
    }
  }

  function updateObject(section, field, value) {
    commitResume({
      ...resumeData,
      [section]: {
        ...resumeData[section],
        [field]: value,
      },
    })
  }

  function updateSummary(value) {
    commitResume({ ...resumeData, summary: value })
  }

  function updateEntry(section, id, field, value) {
    commitResume({
      ...resumeData,
      [section]: resumeData[section].map((entry) => (
        entry.id === id ? { ...entry, [field]: value } : entry
      )),
    })
  }

  function addEntry(section) {
    const entry = createResumeEntry(section)
    if (entry) {
      commitResume({
        ...resumeData,
        [section]: [...resumeData[section], entry],
      })
    }
  }

  function removeEntry(section, id) {
    commitResume({
      ...resumeData,
      [section]: resumeData[section].filter((entry) => entry.id !== id),
    })
  }

  function setSuggestionStatus(suggestion, status) {
    const suggestionId = getSuggestionId(suggestion)
    if (status === 'applied') {
      appliedSuggestionIds.current.add(suggestionId)
    }
    const nextStatuses = { ...reviewStatuses, [suggestionId]: status }
    setReviewStatuses(nextStatuses)
    saveEditorReviewStatuses(nextStatuses)
    setAppendRequest('')
  }

  function applySuggestion(suggestion) {
    const suggestionId = getSuggestionId(suggestion)
    if (appliedSuggestionIds.current.has(suggestionId) || reviewStatuses[suggestionId] === 'applied') {
      return
    }

    const sanitizedText = sanitizeSuggestionText(suggestion.improvedText)
    if (!sanitizedText || isGuidanceOnlyText(suggestion.improvedText)) {
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    if (isDuplicateResumeText(resumeData, sanitizedText)) {
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    if (suggestion.section === 'Professional Summary') {
      commitResume({ ...resumeData, summary: sanitizedText })
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    if (suggestion.section === 'Experience' && !suggestion.originalText) {
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    const replacedResume = replaceSuggestionText(resumeData, suggestion, sanitizedText)
    if (replacedResume) {
      commitResume(replacedResume)
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    if (suggestion.section === 'Projects') {
      setAppendRequest(suggestionId)
    }
  }

  function appendProjectBullet(suggestion) {
    const suggestionId = getSuggestionId(suggestion)
    if (appliedSuggestionIds.current.has(suggestionId) || reviewStatuses[suggestionId] === 'applied') {
      return
    }

    const sanitizedText = sanitizeSuggestionText(suggestion.improvedText)
    if (!sanitizedText || isGuidanceOnlyText(suggestion.improvedText) || isDuplicateResumeText(resumeData, sanitizedText)) {
      setSuggestionStatus(suggestion, 'applied')
      return
    }

    const nextResume = appendProjectSuggestion(resumeData, suggestion, sanitizedText)
    if (!nextResume) {
      return
    }

    if (nextResume !== resumeData) {
      commitResume(nextResume)
    }
    setSuggestionStatus(suggestion, 'applied')
  }

  const counts = initialSuggestions.reduce((summary, suggestion) => {
    const status = reviewStatuses[getSuggestionId(suggestion)]
    if (status === 'applied') {
      summary.applied += 1
    } else if (status === 'skipped') {
      summary.skipped += 1
    } else {
      summary.remaining += 1
    }
    return summary
  }, { applied: 0, skipped: 0, remaining: 0 })
  const sourceLabel = activeResume.source === 'uploaded-import'
    ? 'Editing Uploaded Resume Import'
    : 'Editing Resume Builder Data'

  return (
    <div className="page-surface editor-page">
      <div className="container editor-container">
        <PageHeader
          eyebrow="Consent-Based Editor"
          title="Final resume improvement workspace"
          description="Edit every section, review deterministic suggestions, and apply only the changes you approve."
          actions={(
            <div className="editor-header-actions">
              <Link className="button button-secondary" to="/credential-report">Back to Health Report</Link>
              <Link className="button button-primary" to="/download">Continue to Download <Icon name="arrowRight" size={17} /></Link>
            </div>
          )}
        />

        <div className="editor-status-bar">
          <span className={`analysis-source ${activeResume.source === 'uploaded-import' ? 'uploaded' : ''}`}>{sourceLabel}</span>
          <span className={`editor-save-status ${saveStatus === 'Unsaved changes' ? 'unsaved' : ''}`}>
            <span className="live-dot" /> {saveStatus}
          </span>
        </div>

        <section className="review-summary">
          <div><span>Review All Suggestions</span><strong>{initialSuggestions.length}</strong></div>
          <div><span>Applied</span><strong>{counts.applied}</strong></div>
          <div><span>Skipped</span><strong>{counts.skipped}</strong></div>
          <div><span>Remaining</span><strong>{counts.remaining}</strong></div>
        </section>

        <div className="consent-editor-layout">
          <div className="editor-form-column">
            <PersonalEditor data={resumeData.personalDetails} onUpdate={updateObject} />
            <EditorSection title="Professional Summary" icon="document">
              <FormField
                label="Summary"
                name="editor-summary"
                value={resumeData.summary}
                onChange={(event) => updateSummary(getValue(event))}
                multiline
                rows={5}
              />
            </EditorSection>
            <RepeatableEditorSection section="education" entries={resumeData.education} onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
            <EditorSection title="Skills" icon="target">
              <div className="form-grid">
                <FormField label="Technical skills" name="editor-technical-skills" value={resumeData.skills.technicalSkills} onChange={(event) => updateObject('skills', 'technicalSkills', getValue(event))} multiline rows={3} />
                <FormField label="Tools and grouped skills" name="editor-tools" value={resumeData.skills.tools} onChange={(event) => updateObject('skills', 'tools', getValue(event))} multiline rows={3} />
                <FormField label="Professional skills" name="editor-soft-skills" value={resumeData.skills.softSkills} onChange={(event) => updateObject('skills', 'softSkills', getValue(event))} multiline rows={3} />
              </div>
            </EditorSection>
            <RepeatableEditorSection section="projects" entries={resumeData.projects} onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
            <RepeatableEditorSection section="experience" entries={resumeData.experience} onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
            <RepeatableEditorSection section="certifications" entries={resumeData.certifications} onAdd={addEntry} onRemove={removeEntry} onUpdate={updateEntry} />
          </div>

          <aside className="editor-preview-column">
            <div className="panel-toolbar"><div><span className="live-dot" /> Final resume preview</div><span>{report.overallScore}/100</span></div>
            <div className="editor-resume-stage"><ResumePreview resumeData={resumeData} /></div>
          </aside>
        </div>

        <section className="consent-suggestions-panel">
          <div className="consent-suggestions-heading">
            <div><span className="status-label">Resume Doctor</span><h2>Review every proposed change</h2></div>
            <p>Nothing is applied without your approval.</p>
          </div>
          <div className="consent-suggestion-grid">
            {initialSuggestions.map((suggestion) => {
              const suggestionId = getSuggestionId(suggestion)
              const status = reviewStatuses[suggestionId]
              const sanitizedText = sanitizeSuggestionText(suggestion.improvedText)
              const hasExactReplacement = Boolean(
                replaceSuggestionText(resumeData, suggestion, sanitizedText),
              )
              return (
                <SuggestionCard
                  key={suggestionId}
                  suggestion={suggestion}
                  status={status}
                  appendRequested={appendRequest === suggestionId}
                  canApply={suggestion.section === 'Professional Summary'
                    || suggestion.section === 'Projects'
                    || (suggestion.section === 'Experience' && hasExactReplacement)}
                  hasProject={resumeData.projects.some((project) => project.title || project.description || project.highlights)}
                  onApply={applySuggestion}
                  onAppend={appendProjectBullet}
                  onCancelAppend={() => setAppendRequest('')}
                  onSkip={(item) => setSuggestionStatus(item, 'skipped')}
                />
              )
            })}
            {initialSuggestions.length === 0 && (
              <div className="suggestion-empty"><span className="feature-icon"><Icon name="check" size={24} /></span><h3>No critical fixes detected</h3><p>Your latest resume passes the current deterministic checks.</p></div>
            )}
          </div>
        </section>

        <div className="editor-footer-actions">
          <Link className="button button-secondary" to="/download">Skip Editor and Download</Link>
          <Link className="button button-primary button-large" to="/download">Continue to Download <Icon name="arrowRight" size={18} /></Link>
        </div>
      </div>
    </div>
  )
}

function EditorSection({ title, icon, children }) {
  return (
    <section className="resume-form-section editor-form-section">
      <div className="form-section-heading">
        <span><Icon name={icon} size={20} /></span>
        <div><h2>{title}</h2><p>Changes are saved locally and reflected in the preview.</p></div>
      </div>
      {children}
    </section>
  )
}

function PersonalEditor({ data, onUpdate }) {
  const fields = [
    ['Full name', 'fullName'], ['Target role', 'targetRole'],
    ['Email', 'email'], ['Phone', 'phone'], ['Location', 'location'],
    ['LinkedIn', 'linkedin'], ['GitHub', 'github'], ['Portfolio', 'portfolio'],
  ]

  return (
    <EditorSection title="Personal Details" icon="file">
      <div className="form-grid">
        {fields.map(([label, field]) => (
          <FormField
            key={field}
            label={label}
            name={`editor-personal-${field}`}
            value={data[field]}
            onChange={(event) => onUpdate('personalDetails', field, getValue(event))}
          />
        ))}
      </div>
    </EditorSection>
  )
}

function RepeatableEditorSection({ section, entries, onAdd, onRemove, onUpdate }) {
  const fields = repeatableFields[section]
  return (
    <EditorSection title={sectionLabels[section]} icon={section === 'projects' ? 'sparkle' : section === 'experience' ? 'trend' : section === 'education' ? 'award' : 'shield'}>
      <div className="editor-repeatable-list">
        {entries.map((entry, index) => (
          <div className="repeatable-entry" key={entry.id}>
            <div className="entry-heading">
              <strong>{sectionLabels[section]} {index + 1}</strong>
              <button type="button" onClick={() => onRemove(section, entry.id)}>Remove</button>
            </div>
            <div className="form-grid">
              {fields.map(([label, field, multiline]) => (
                <FormField
                  key={field}
                  label={label}
                  name={`editor-${section}-${entry.id}-${field}`}
                  value={entry[field]}
                  onChange={(event) => onUpdate(section, entry.id, field, getValue(event))}
                  multiline={Boolean(multiline)}
                  rows={multiline ? 4 : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="add-entry-button editor-add-entry" type="button" onClick={() => onAdd(section)}>
        <Icon name="plus" size={16} /> Add {sectionLabels[section]}
      </button>
    </EditorSection>
  )
}

function SuggestionCard({
  suggestion,
  status,
  appendRequested,
  canApply,
  hasProject,
  onApply,
  onAppend,
  onCancelAppend,
  onSkip,
}) {
  return (
    <article className={`consent-suggestion-card ${status || ''}`}>
      <div className="doctor-card-top">
        <span className={`priority-badge ${suggestion.priority}`}>{suggestion.priority} priority</span>
        <span className="doctor-section">{suggestion.section}</span>
      </div>
      <h3>{suggestion.issue}</h3>
      <div className="suggestion-copy"><strong>Why it matters</strong><p>{suggestion.whyItMatters}</p></div>
      {suggestion.originalText && (
        <div className="doctor-original"><strong>Current version</strong><p>{suggestion.originalText}</p></div>
      )}
      <div className="doctor-improvement"><strong>Suggested improvement</strong><p>{suggestion.improvedText}</p></div>

      {status ? (
        <div className={`suggestion-decision ${status}`}>
          <Icon name={status === 'applied' ? 'check' : 'close'} size={16} />
          {status === 'applied' ? 'Suggestion applied' : 'Original kept'}
        </div>
      ) : appendRequested ? (
        <div className="append-confirmation">
          <p>Exact text was not found. Add this suggestion as a new bullet to the first project?</p>
          <div>
            <button className="button button-primary" type="button" disabled={!hasProject} onClick={() => onAppend(suggestion)}>Add as new bullet</button>
            <button className="button button-secondary" type="button" onClick={onCancelAppend}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="suggestion-actions">
          {canApply && <button className="button button-primary" type="button" onClick={() => onApply(suggestion)}>Apply Suggestion</button>}
          <button className="button button-secondary" type="button" onClick={() => onSkip(suggestion)}>Keep Original</button>
          <button className="suggestion-dismiss" type="button" onClick={() => onSkip(suggestion)}>Dismiss</button>
        </div>
      )}
    </article>
  )
}

export default Editor
