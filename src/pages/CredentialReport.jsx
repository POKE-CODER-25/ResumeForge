import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumeUpload from '../components/ResumeUpload'
import {
  ACTIVE_RESUME_CHANGED_EVENT,
  getActiveResumeData,
  saveActiveResumeData,
} from '../data/activeResumeData'
import {
  defaultResumeData,
  getResumeCompletion,
  normalizeResumeData,
  saveResumeData,
} from '../data/resumeData'
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

function getSafeActiveAnalysis(options) {
  try {
    const active = getActiveResumeData(options)
    return {
      ...active,
      resumeData: normalizeResumeData(active?.resumeData || defaultResumeData),
      source: typeof active?.source === 'string' ? active.source : 'default',
      sourceLabel: typeof active?.sourceLabel === 'string' ? active.sourceLabel : 'Builder Resume',
      uploadedResume: active?.uploadedResume || null,
    }
  } catch {
    return {
      resumeData: normalizeResumeData(defaultResumeData),
      source: 'default',
      sourceLabel: 'Builder Resume',
      uploadedResume: null,
    }
  }
}

function getSafeUploadedResume() {
  try {
    return loadUploadedResumeData()
  } catch {
    return null
  }
}

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
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : []

  return (
    <article className={`health-feedback-card ${tone}`}>
      <div className="health-card-heading">
        <span><Icon name={icon} size={19} /></span>
        <div><h2>{title}</h2><small>{safeItems.length} identified</small></div>
      </div>
      {safeItems.length > 0 ? (
        <ul className="health-list">
          {safeItems.map((item) => <li key={item}><Icon name={tone === 'positive' ? 'check' : 'target'} size={16} />{item}</li>)}
        </ul>
      ) : <p className="health-empty">{emptyMessage}</p>}
    </article>
  )
}

function DoctorCard({ item }) {
  const safeItem = item && typeof item === 'object' ? item : {}

  return (
    <article className="doctor-suggestion">
      <div className="doctor-card-top">
        <span className={`priority-badge ${safeItem.priority || 'medium'}`}>{safeItem.priority || 'medium'} priority</span>
        <span className="doctor-section">{safeItem.section || 'Resume'}</span>
      </div>
      <h3>{safeItem.issue || 'Resume improvement'}</h3>
      <div className="doctor-reason">
        <strong>Why it matters</strong>
        <p>{safeItem.whyItMatters || 'Complete resume data helps generate a stronger health report.'}</p>
      </div>
      {safeItem.originalText && (
        <div className="doctor-original">
          <strong>Current version</strong>
          <p>{safeItem.originalText}</p>
        </div>
      )}
      <div className="doctor-improvement">
        <strong>Suggested improvement</strong>
        <p>{safeItem.improvedText || 'Go to Builder to create or complete your resume.'}</p>
      </div>
    </article>
  )
}

function CredentialReport() {
  const navigate = useNavigate()
  const [activeAnalysis, setActiveAnalysis] = useState(() => (
    getSafeActiveAnalysis({
      includeUploadedAnalysis: true,
      preferUploadedAnalysis: true,
    })
  ))
  const [uploadedResume, setUploadedResume] = useState(getSafeUploadedResume)
  const [uploadedFile, setUploadedFile] = useState(() => {
    const stored = getSafeUploadedResume()
    return stored ? { name: stored.filename } : null
  })
  const [uploadError, setUploadError] = useState('')
  const [uploadWarning, setUploadWarning] = useState(() => (
    getSafeUploadedResume()?.warning || ''
  ))
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUploadedPreview, setShowUploadedPreview] = useState(false)
  const normalizedResumeData = useMemo(() => (
    normalizeResumeData(activeAnalysis?.resumeData || defaultResumeData)
  ), [activeAnalysis])
  const hasResumeData = getResumeCompletion(normalizedResumeData) > 0
  const isUploadedSource = activeAnalysis?.source === 'uploaded-analysis'
    || activeAnalysis?.source === 'uploaded-import'
  const report = analyzeResumeHealth(normalizedResumeData)
  const safeResumeDoctor = Array.isArray(report.resumeDoctor) ? report.resumeDoctor : []
  const scoreStatus = getScoreStatus(report.overallScore)
  const sourceLabel = activeAnalysis?.source === 'editor-approved'
    ? 'Analyzing Editor-Approved Resume'
    : isUploadedSource
      ? 'Analyzing Uploaded Resume'
      : 'Analyzing Builder Resume'

  useEffect(() => {
    function handleWorkflowCleared() {
      setActiveAnalysis(getSafeActiveAnalysis({ includeUploadedAnalysis: true }))
      setUploadedFile(null)
      setUploadedResume(null)
      setUploadError('')
      setUploadWarning('')
      setShowUploadedPreview(false)
      setIsProcessing(false)
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    window.addEventListener(ACTIVE_RESUME_CHANGED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
      window.removeEventListener(ACTIVE_RESUME_CHANGED_EVENT, handleWorkflowCleared)
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
      setUploadedResume(getSafeUploadedResume() || storedUpload)
      setActiveAnalysis({
        resumeData: analysis.resumeData,
        source: 'uploaded-analysis',
        sourceLabel: 'Uploaded Resume',
        uploadedResume: storedUpload,
      })
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
    saveActiveResumeData(uploadedResume.parsedResume, 'uploaded-import')
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
        {!hasResumeData && (
          <section className="health-overview">
            <div className="large-score">
              <div>
                <span className="status-label">No resume data</span>
                <h2>No resume data found. Go to Builder to create your resume.</h2>
              </div>
            </div>
            <Link className="button button-primary" to="/builder">Go to Builder <Icon name="arrowRight" size={17} /></Link>
          </section>
        )}
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
              <span>{String(uploadedResume.extractedText || '').length.toLocaleString()} characters</span>
            </div>
            <div className="uploaded-preview-grid">
              <div>
                <h3>Plain text preview</h3>
                <pre>{String(uploadedResume.extractedText || '')}</pre>
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
                  {sourceLabel}
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
          {safeResumeDoctor.length > 0 ? (
            <div className="doctor-suggestion-list">
              {safeResumeDoctor.map((item, index) => (
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
  const data = normalizeResumeData(resumeData || defaultResumeData)
  const personal = data.personalDetails
  const sections = [
    ['Name', personal.fullName],
    ['Target role', personal.targetRole],
    ['Location', personal.location],
    ['Links', [
      personal.linkedin,
      personal.github,
      personal.portfolio,
    ].filter(Boolean).join('\n')],
    ['Summary', data.summary],
    ['Education', data.education.map((entry) => (
      [
        entry.degree,
        entry.institution,
        entry.location,
        [entry.startYear, entry.endYear].filter(Boolean).join(' - '),
        entry.cgpa && `CGPA: ${entry.cgpa}`,
      ].filter(Boolean).join(' | ')
    )).filter(Boolean).join('\n')],
    ['Grouped skills', data.skills.tools || data.skills.technicalSkills],
    ['Projects', data.projects.map((entry) => (
      [
        entry.title,
        entry.description,
        entry.techStack && `Stack: ${entry.techStack}`,
        entry.highlights,
        entry.liveLink,
        entry.githubLink,
      ].filter(Boolean).join('\n')
    )).filter(Boolean).join('\n\n')],
    ['Experience', data.experience.map((entry) => entry.role || entry.company).filter(Boolean).join(', ')],
    ['Certifications', data.certifications.map((entry) => (
      [entry.title, entry.issuer].filter(Boolean).join(' - ')
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
