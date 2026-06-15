import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumeUpload from '../components/ResumeUpload'
import { loadResumeData, saveResumeData } from '../data/resumeData'
import {
  clearUploadedResumeWorkflow,
  loadUploadedResumeData,
  markUploadedResumeImported,
  RESUME_WORKFLOW_CLEARED_EVENT,
  saveUploadedResumeData,
} from '../data/uploadedResumeData'
import { analyzeResumeHealth } from '../utils/resumeHealthEngine'
import { extractResumeText } from '../utils/resumeTextExtractor'
import { analyzeResumeText } from '../utils/resumeTextAnalyzer'

const categoryMeta = [
  { key: 'sectionCompletenessScore', label: 'Section Completeness', icon: 'document' },
  { key: 'technicalStrengthScore', label: 'Technical Strength', icon: 'target' },
  { key: 'impactStrengthScore', label: 'Impact Strength', icon: 'trend' },
  { key: 'professionalReadinessScore', label: 'Professional Readiness', icon: 'shield' },
]

function getScoreStatus(score) {
  if (score >= 85) {
    return { label: 'Application ready', title: 'Your resume has a strong professional foundation.' }
  }
  if (score >= 65) {
    return { label: 'Good progress', title: 'A few focused improvements will strengthen your resume.' }
  }
  if (score >= 40) {
    return { label: 'Needs attention', title: 'Complete key sections and sharpen your impact statements.' }
  }
  return { label: 'Early draft', title: 'Add core resume details to build a stronger report.' }
}

function FeedbackCard({ title, icon, tone, items, emptyMessage }) {
  return (
    <article className={`health-feedback-card ${tone}`}>
      <div className="health-card-heading">
        <span><Icon name={icon} size={19} /></span>
        <div><h2>{title}</h2><small>{items.length} identified</small></div>
      </div>
      {items.length > 0 ? (
        <ul className="health-list">
          {items.map((item) => <li key={item}><Icon name={tone === 'positive' ? 'check' : 'target'} size={16} />{item}</li>)}
        </ul>
      ) : <p className="health-empty">{emptyMessage}</p>}
    </article>
  )
}

function DoctorCard({ item }) {
  return (
    <article className="doctor-suggestion">
      <div className="doctor-card-top">
        <span className={`priority-badge ${item.priority}`}>{item.priority} priority</span>
        <span className="doctor-section">{item.section}</span>
      </div>
      <h3>{item.issue}</h3>
      <div className="doctor-reason">
        <strong>Why it matters</strong>
        <p>{item.whyItMatters}</p>
      </div>
      {item.originalText && (
        <div className="doctor-original">
          <strong>Current version</strong>
          <p>{item.originalText}</p>
        </div>
      )}
      <div className="doctor-improvement">
        <strong>Suggested improvement</strong>
        <p>{item.improvedText}</p>
      </div>
    </article>
  )
}

function CredentialReport() {
  const navigate = useNavigate()
  const [builderData, setBuilderData] = useState(loadResumeData)
  const [uploadedResume, setUploadedResume] = useState(loadUploadedResumeData)
  const [uploadedFile, setUploadedFile] = useState(() => {
    const stored = loadUploadedResumeData()
    return stored ? { name: stored.filename } : null
  })
  const [uploadError, setUploadError] = useState('')
  const [uploadWarning, setUploadWarning] = useState(() => (
    loadUploadedResumeData()?.warning || ''
  ))
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUploadedPreview, setShowUploadedPreview] = useState(false)
  const isUploadedSource = uploadedResume !== null
  const report = isUploadedSource
    ? uploadedResume.healthReport || analyzeResumeHealth(uploadedResume.parsedResume)
    : analyzeResumeHealth(builderData)
  const scoreStatus = getScoreStatus(report.overallScore)
  const sourceLabel = isUploadedSource
    ? 'Uploaded Resume Analysis'
    : 'Resume Builder Data'

  useEffect(() => {
    function handleWorkflowCleared() {
      setBuilderData(loadResumeData())
      setUploadedFile(null)
      setUploadedResume(null)
      setUploadError('')
      setUploadWarning('')
      setShowUploadedPreview(false)
      setIsProcessing(false)
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    }
  }, [])

  async function handleUpload(file, validationError) {
    if (validationError || !file) {
      setUploadError(validationError || 'Choose a PDF, DOCX, or TXT resume.')
      return
    }

    setUploadedFile(file)
    setUploadError('')
    setUploadWarning('')
    setIsProcessing(true)

    try {
      const text = await extractResumeText(file)
      const analysis = analyzeResumeText(text)
      const healthReport = analyzeResumeHealth(analysis.resumeData)
      const storedUpload = {
        filename: file.name,
        extractedText: text,
        parsedResume: analysis.resumeData,
        healthReport,
        analysisSource: 'Uploaded Resume Analysis',
        warning: analysis.warning,
        importedForEditing: false,
        updatedAt: new Date().toISOString(),
      }
      saveUploadedResumeData(storedUpload)
      setUploadedResume(loadUploadedResumeData() || storedUpload)
      setUploadWarning(analysis.warning)
    } catch {
      setUploadedFile(uploadedResume ? { name: uploadedResume.filename } : null)
      setUploadError('We could not extract readable text from this file.')
    } finally {
      setIsProcessing(false)
    }
  }

  function removeUpload() {
    clearUploadedResumeWorkflow()
  }

  function improveResume() {
    if (!uploadedResume) {
      navigate('/builder')
      return
    }

    saveResumeData(uploadedResume.parsedResume)
    const importedUpload = markUploadedResumeImported()
    if (importedUpload) {
      setUploadedResume(importedUpload)
    }
    navigate('/builder', {
      state: { importedResume: true },
    })
  }

  return (
    <div className="page-surface">
      <div className="container">
        <PageHeader
          eyebrow="Credential Report"
          title="Resume Health Report"
          description="A clear view of what is working, what needs attention, and which sections can strengthen your application."
          actions={<button className="button button-primary" type="button" onClick={improveResume}>Improve resume <Icon name="arrowRight" size={17} /></button>}
        />
        <ResumeUpload
          file={uploadedFile}
          error={uploadError}
          warning={uploadWarning}
          isProcessing={isProcessing}
          onFile={handleUpload}
        />
        {uploadedResume && (
          <section className="uploaded-resume-actions">
            <div>
              <span className="analysis-source uploaded">Uploaded Resume Analysis</span>
              <strong>{uploadedResume.filename}</strong>
            </div>
            <div>
              <button className="button button-secondary" type="button" onClick={() => setShowUploadedPreview((current) => !current)}>
                {showUploadedPreview ? 'Hide Preview' : 'Preview Uploaded Resume'}
              </button>
              <button className="remove-uploaded-resume" type="button" onClick={removeUpload}>
                Remove Uploaded Resume
              </button>
            </div>
          </section>
        )}
        {uploadedResume && showUploadedPreview && (
          <section className="uploaded-resume-preview">
            <div className="uploaded-preview-heading">
              <div><span className="status-label">Extracted content</span><h2>{uploadedResume.filename}</h2></div>
              <span>{uploadedResume.extractedText.length.toLocaleString()} characters</span>
            </div>
            <div className="uploaded-preview-grid">
              <div>
                <h3>Plain text preview</h3>
                <pre>{uploadedResume.extractedText}</pre>
              </div>
              <div>
                <h3>Parsed sections</h3>
                <ParsedResumeSummary resumeData={uploadedResume.parsedResume} />
              </div>
            </div>
          </section>
        )}
        <section className="health-overview">
          <div className="large-score">
            <div
              className="score-ring report-score"
              style={{ '--score': `${report.overallScore}%` }}
              aria-label={`Resume health score ${report.overallScore} out of 100`}
            >
              <strong>{report.overallScore}</strong><span>/100</span>
            </div>
            <div>
              <div className="analysis-labels">
                <span className="status-label">{scoreStatus.label}</span>
                <span className={`analysis-source ${isUploadedSource ? 'uploaded' : ''}`}>
                  Analysis Source: {sourceLabel}
                </span>
              </div>
              <h2>{scoreStatus.title}</h2>
              <p>Based on completeness, technical depth, impact, and professional readiness.</p>
            </div>
          </div>
          <Link className="button button-secondary" to="/editor">Open editor</Link>
        </section>

        <section className="health-category-grid" aria-label="Health score categories">
          {categoryMeta.map((category) => {
            const score = report[category.key]
            return (
              <article className="health-category-card" key={category.key}>
                <div className="health-category-top">
                  <span className="report-icon"><Icon name={category.icon} size={19} /></span>
                  <strong>{score}<small>/25</small></strong>
                </div>
                <h2>{category.label}</h2>
                <div className="health-progress" aria-label={`${category.label}: ${score} out of 25`}>
                  <span style={{ width: `${score * 4}%` }} />
                </div>
              </article>
            )
          })}
        </section>

        <section className="health-feedback-grid">
          <FeedbackCard title="Strengths" icon="trend" tone="positive" items={report.strengths} emptyMessage="Add more resume details to identify strengths." />
          <FeedbackCard title="Weak Areas" icon="target" tone="warning" items={report.weaknesses} emptyMessage="No major weak areas detected." />
          <FeedbackCard title="Missing Sections" icon="search" tone="missing" items={report.missingSections} emptyMessage="All recommended sections are present." />
          <FeedbackCard title="Recommendations" icon="lightbulb" tone="recommendation" items={report.recommendations} emptyMessage="Your resume currently meets the core checks." />
        </section>

        <section className="doctor-panel">
          <div className="doctor-panel-heading">
            <span className="doctor-panel-icon"><Icon name="document" size={21} /></span>
            <div>
              <span className="status-label">Resume Doctor</span>
              <h2>Turn weak content into recruiter-ready evidence</h2>
              <p>Prioritized, deterministic improvements based on the exact content in your {sourceLabel.toLowerCase()}.</p>
            </div>
          </div>
          {report.resumeDoctor.length > 0 ? (
            <div className="doctor-suggestion-list">
              {report.resumeDoctor.map((item, index) => (
                <DoctorCard
                  item={item}
                  key={`${item.issue}-${item.section}-${index}`}
                />
              ))}
            </div>
          ) : (
            <p className="doctor-clear">No critical fixes are needed. Continue tailoring the resume for each role.</p>
          )}
        </section>

        <div className="report-note"><Icon name="shield" size={20} /><div><strong>Private by design</strong><p>Files are processed locally. Only extracted text is stored in this browser until you remove it.</p></div></div>
      </div>
    </div>
  )
}

function ParsedResumeSummary({ resumeData }) {
  const personal = resumeData.personalDetails
  const sections = [
    ['Name', personal.fullName],
    ['Target role', personal.targetRole],
    ['Location', personal.location],
    ['Links', [
      personal.linkedin,
      personal.github,
      personal.portfolio,
    ].filter(Boolean).join('\n')],
    ['Summary', resumeData.summary],
    ['Education', resumeData.education.map((entry) => (
      [
        entry.degree,
        entry.institution,
        entry.location,
        [entry.startYear, entry.endYear].filter(Boolean).join(' - '),
        entry.cgpa && `CGPA: ${entry.cgpa}`,
      ].filter(Boolean).join(' | ')
    )).filter(Boolean).join('\n')],
    ['Grouped skills', resumeData.skills.tools || resumeData.skills.technicalSkills],
    ['Projects', resumeData.projects.map((entry) => (
      [
        entry.title,
        entry.description,
        entry.techStack && `Stack: ${entry.techStack}`,
        entry.highlights,
        entry.liveLink,
        entry.githubLink,
      ].filter(Boolean).join('\n')
    )).filter(Boolean).join('\n\n')],
    ['Experience', resumeData.experience.map((entry) => entry.role || entry.company).filter(Boolean).join(', ')],
    ['Certifications', resumeData.certifications.map((entry) => (
      [entry.title, entry.issuer].filter(Boolean).join(' — ')
    )).filter(Boolean).join('\n')],
  ]

  return (
    <dl className="parsed-section-list">
      {sections.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || 'Not identified'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default CredentialReport
