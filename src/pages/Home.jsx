import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

const features = [
  { icon: 'laptop', title: 'Resume Builder', text: 'Create structured resume sections with a clean live preview.' },
  { icon: 'monitor', title: 'Resume Health Report', text: 'Score completeness, technical strength, impact, and readiness.' },
  { icon: 'compass', title: 'Resume Doctor', text: 'Review practical suggestions before applying any changes.' },
  { icon: 'fileText', title: 'Upload Resume Checker', text: 'Upload an existing resume and inspect the parsed content locally.' },
  { icon: 'edit', title: 'Editor', text: 'Polish every section in a focused final review workspace.' },
  { icon: 'download', title: 'Download PDF/DOCX/TXT', text: 'Export the exact approved resume content in common formats.' },
]

const workflow = ['Analyze', 'Improve', 'Generate', 'Edit', 'Download']

function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="code" size={15} /> Professional resume utility</span>
            <h1>Build, analyze, improve, and download your resume.</h1>
            <p>ResumeForge is a focused workspace for students and developers who need a clear, reliable resume without a complicated workflow.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/builder">
                Start Building <Icon name="arrowRight" size={18} />
              </Link>
              <Link className="button button-secondary button-large" to="/credential-report">
                Check Existing Resume
              </Link>
            </div>
            <div className="trust-row">
              <span><Icon name="shield" size={16} /> Local-first workflow</span>
              <span><Icon name="ruler" size={16} /> Structured resume layout</span>
              <span><Icon name="compass" size={16} /> Review before export</span>
            </div>
          </div>

          <div className="hero-product">
            <div className="product-window">
              <div className="window-bar">
                <span className="window-dot" /><span className="window-dot" /><span className="window-dot" />
                <span>ResumeForge workspace</span>
              </div>
              <div className="product-content">
                <div className="score-panel">
                  <div className="score-ring"><strong>84</strong><span>/100</span></div>
                  <div><span className="status-label">Strong foundation</span><h3>Your resume is on the right track.</h3><p>Complete two improvements to strengthen impact.</p></div>
                </div>
                <div className="analysis-list">
                  <div><span className="analysis-icon good"><Icon name="check" size={16} /></span><p><strong>Skills coverage</strong><span>Aligned with target role</span></p><b>Strong</b></div>
                  <div><span className="analysis-icon"><Icon name="trend" size={16} /></span><p><strong>Achievement impact</strong><span>Add measurable outcomes</span></p><b>Improve</b></div>
                  <div><span className="analysis-icon"><Icon name="file" size={16} /></span><p><strong>Section completeness</strong><span>Professional summary missing</span></p><b>Add</b></div>
                </div>
              </div>
            </div>
                <div className="floating-note"><Icon name="compass" size={18} /><span><strong>Resume Doctor</strong>Review improvements before applying</span></div>
          </div>
        </div>
      </section>

      <section className="workflow-section">
        <div className="container">
          <span className="section-kicker">A complete resume workflow</span>
          <div className="workflow-row">
            {workflow.map((step, index) => (
              <div className="workflow-step" key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
                {index < workflow.length - 1 && <Icon name="chevronRight" size={18} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">ResumeForge tools</span>
            <h2>Simple online resume tools in one clean workspace.</h2>
            <p>Use the tool cards below to build, inspect, improve, edit, and export your resume with confidence.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon"><Icon name={feature.icon} size={23} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <Link to={feature.title === 'Upload Resume Checker' || feature.title === 'Resume Health Report' ? '/credential-report' : feature.title === 'Download PDF/DOCX/TXT' ? '/download' : feature.title === 'Editor' ? '/editor' : '/builder'}>
                  Open tool <Icon name="arrowRight" size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div><span className="eyebrow">Ready when you are</span><h2>Start with the builder or check an existing resume.</h2></div>
          <div className="cta-actions">
            <Link className="button button-primary button-large" to="/builder">Start Building <Icon name="arrowRight" size={18} /></Link>
            <Link className="button button-secondary button-large" to="/credential-report">Check Existing Resume</Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
