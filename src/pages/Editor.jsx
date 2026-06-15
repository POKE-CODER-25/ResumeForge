import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ResumePreview from '../components/ResumePreview'
import {
  RESUME_WORKFLOW_CLEARED_EVENT,
  resolveActiveEditableResume,
} from '../data/uploadedResumeData'
import { analyzeResumeHealth } from '../utils/resumeHealthEngine'

function Editor() {
  const [activeResume, setActiveResume] = useState(resolveActiveEditableResume)
  const report = analyzeResumeHealth(activeResume.resumeData)

  useEffect(() => {
    function handleWorkflowCleared() {
      setActiveResume(resolveActiveEditableResume())
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    }
  }, [])

  return (
    <div className="page-surface editor-page">
      <div className="container">
        <PageHeader
          eyebrow="Live Editor"
          title="Refine every detail"
          description="Edit your resume in context and review focused improvement suggestions alongside your content."
          actions={<Link className="button button-primary" to="/download">Continue to download <Icon name="arrowRight" size={17} /></Link>}
        />
        <div className="workspace-source-row">
          <span className={`analysis-source ${activeResume.source.startsWith('Uploaded') ? 'uploaded' : ''}`}>
            {activeResume.source}
          </span>
          {activeResume.uploadedResume && !activeResume.uploadedResume.importedForEditing && (
            <span className="analysis-source uploaded">Uploaded Resume Analysis Available</span>
          )}
        </div>
        <div className="editor-workspace">
          <section className="preview-panel">
            <div className="panel-toolbar"><div><span className="live-dot" /> Resume preview</div><span>Auto layout</span></div>
            <div className="editor-resume-stage">
              <ResumePreview resumeData={activeResume.resumeData} />
            </div>
          </section>
          <aside className="suggestions-panel">
            <div className="panel-toolbar"><div><Icon name="sparkle" size={18} /> Improvement suggestions</div><span className="suggestion-count">{report.resumeDoctor.length}</span></div>
            <div className="editor-suggestion-list">
              {report.resumeDoctor.slice(0, 5).map((item) => (
                <article className="editor-suggestion" key={`${item.issue}-${item.section}`}>
                  <span>{item.section} · {item.priority} priority</span>
                  <strong>{item.issue}</strong>
                  <p>{item.improvedText}</p>
                </article>
              ))}
              {report.resumeDoctor.length === 0 && (
                <div className="suggestion-empty"><span className="feature-icon"><Icon name="check" size={24} /></span><h3>No critical fixes detected</h3><p>Your latest editable resume passes the current deterministic checks.</p></div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Editor
