import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'

function Editor() {
  return (
    <div className="page-surface editor-page">
      <div className="container">
        <PageHeader
          eyebrow="Live Editor"
          title="Refine every detail"
          description="Edit your resume in context and review focused improvement suggestions alongside your content."
          actions={<Link className="button button-primary" to="/download">Continue to download <Icon name="arrowRight" size={17} /></Link>}
        />
        <div className="editor-workspace">
          <section className="preview-panel">
            <div className="panel-toolbar"><div><span className="live-dot" /> Resume preview</div><span>Auto layout</span></div>
            <div className="resume-paper">
              <div className="resume-heading"><div><span className="placeholder-line name" /><span className="placeholder-line role" /></div><span className="avatar-placeholder" /></div>
              <div className="resume-contact"><span /><span /><span /></div>
              {['Professional Summary', 'Experience', 'Education', 'Skills'].map((section, index) => (
                <div className="resume-section" key={section}>
                  <h3>{section}</h3>
                  {index === 1 && <div className="resume-job"><span className="placeholder-line medium" /><span className="placeholder-line short" /></div>}
                  <span className="placeholder-line full" /><span className="placeholder-line full" /><span className="placeholder-line partial" />
                </div>
              ))}
              <div className="preview-empty"><Icon name="edit" size={22} /><strong>Your editable resume preview</strong><p>Complete the builder to populate this workspace.</p><Link to="/builder">Go to builder</Link></div>
            </div>
          </section>
          <aside className="suggestions-panel">
            <div className="panel-toolbar"><div><Icon name="sparkle" size={18} /> Improvement suggestions</div><span className="suggestion-count">0</span></div>
            <div className="suggestion-empty"><span className="feature-icon"><Icon name="lightbulb" size={24} /></span><h3>Suggestions will appear here</h3><p>As you add resume content, ResumeForge will surface focused ideas for clarity, impact, and completeness.</p></div>
            <div className="suggestion-example"><span>Example insight</span><strong>Make achievements measurable</strong><p>Replace general responsibilities with specific outcomes where possible.</p><button type="button" disabled>Apply suggestion</button></div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Editor
