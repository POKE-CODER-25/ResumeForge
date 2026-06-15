import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { loadResumeData } from '../data/resumeData'
import { analyzeResumeHealth } from '../utils/resumeHealthEngine'

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

function CredentialReport() {
  const report = analyzeResumeHealth(loadResumeData())
  const scoreStatus = getScoreStatus(report.overallScore)

  return (
    <div className="page-surface">
      <div className="container">
        <PageHeader
          eyebrow="Credential Report"
          title="Resume Health Report"
          description="A clear view of what is working, what needs attention, and which sections can strengthen your application."
          actions={<Link className="button button-primary" to="/builder">Improve resume <Icon name="arrowRight" size={17} /></Link>}
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
              <span className="status-label">{scoreStatus.label}</span>
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
            <span className="report-icon"><Icon name="sparkle" size={20} /></span>
            <div>
              <span className="status-label">Resume Doctor</span>
              <h2>Practical fixes for your weakest areas</h2>
              <p>Deterministic suggestions based on the content in your Builder.</p>
            </div>
          </div>
          {report.doctorSuggestions.length > 0 ? (
            <div className="doctor-suggestion-list">
              {report.doctorSuggestions.map((item) => (
                <article className="doctor-suggestion" key={item.weakness}>
                  <strong>{item.weakness}</strong>
                  <p>{item.suggestion}</p>
                </article>
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
