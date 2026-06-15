import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumeUpload from '../components/ResumeUpload'
import { loadResumeData } from '../data/resumeData'
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
  const [builderData] = useState(loadResumeData)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedData, setUploadedData] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadWarning, setUploadWarning] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const isUploadedSource = uploadedData !== null
  const report = analyzeResumeHealth(isUploadedSource ? uploadedData : builderData)
  const scoreStatus = getScoreStatus(report.overallScore)
  const sourceLabel = isUploadedSource ? 'Uploaded Resume' : 'Resume Builder'

  async function handleUpload(file, validationError) {
    if (validationError || !file) {
      setUploadError(validationError || 'Choose a PDF, DOCX, or TXT resume.')
      return
    }

    setUploadedFile(file)
    setUploadedData(null)
    setUploadError('')
    setUploadWarning('')
    setIsProcessing(true)

    try {
      const text = await extractResumeText(file)
      const analysis = analyzeResumeText(text)
      setUploadedData(analysis.resumeData)
      setUploadWarning(analysis.warning)
    } catch {
      const partialAnalysis = analyzeResumeText('')
      setUploadedData(partialAnalysis.resumeData)
      setUploadWarning('We could not fully understand this resume. Partial analysis is shown.')
    } finally {
      setIsProcessing(false)
    }
  }

  function removeUpload() {
    setUploadedFile(null)
    setUploadedData(null)
    setUploadError('')
    setUploadWarning('')
  }

  return (
    <div className="page-surface">
      <div className="container">
        <PageHeader
          eyebrow="Credential Report"
          title="Resume Health Report"
          description="A clear view of what is working, what needs attention, and which sections can strengthen your application."
          actions={<Link className="button button-primary" to="/builder">Improve resume <Icon name="arrowRight" size={17} /></Link>}
        />
        <ResumeUpload
          file={uploadedFile}
          error={uploadError}
          warning={uploadWarning}
          isProcessing={isProcessing}
          onFile={handleUpload}
          onRemove={removeUpload}
        />
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

        <div className="report-note"><Icon name="shield" size={20} /><div><strong>Private by design</strong><p>Your report is based only on the resume information you provide.</p></div></div>
      </div>
    </div>
  )
}

export default CredentialReport
