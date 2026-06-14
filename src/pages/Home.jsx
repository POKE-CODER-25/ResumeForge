import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

const features = [
  { icon: 'sparkle', title: 'AI-powered resume intelligence', text: 'Turn your background into focused, role-ready content with intelligent guidance.' },
  { icon: 'trend', title: 'Resume Health Report', text: 'See strengths, gaps, and practical opportunities before you start applying.' },
  { icon: 'edit', title: 'Live editing', text: 'Refine every section in a focused workspace with contextual improvements.' },
  { icon: 'download', title: 'Download-ready resume', text: 'Prepare a polished resume for the format your next application requires.' },
]

const workflow = ['Analyze', 'Improve', 'Generate', 'Edit', 'Download']

function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="sparkle" size={15} /> Smarter resumes. Stronger applications.</span>
            <h1>Build a resume that proves your <span>potential.</span></h1>
            <p>ResumeForge combines structured resume building with practical intelligence, helping you shape a clear, credible, and application-ready story.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/builder">
                Start building free <Icon name="arrowRight" size={18} />
              </Link>
              <Link className="button button-secondary button-large" to="/credential-report">
                View health report
              </Link>
            </div>
            <div className="trust-row">
              <span><Icon name="check" size={16} /> Structured guidance</span>
              <span><Icon name="check" size={16} /> ATS-conscious</span>
              <span><Icon name="check" size={16} /> Your content, your control</span>
            </div>
          </div>

          <div className="hero-product">
            <div className="product-window">
              <div className="window-bar">
                <span className="window-dot" /><span className="window-dot" /><span className="window-dot" />
                <span>Resume Health Report</span>
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
            <div className="floating-note"><Icon name="sparkle" size={18} /><span><strong>Smart suggestion</strong>Use a stronger action verb here</span></div>
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
            <span className="eyebrow">Everything you need</span>
            <h2>From scattered experience to a clear professional story.</h2>
            <p>Build with a guided process designed around the questions recruiters actually ask.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon"><Icon name={feature.icon} size={23} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <Link to="/builder">Explore feature <Icon name="arrowRight" size={16} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div><span className="eyebrow">Your next application starts here</span><h2>Forge a resume built for what comes next.</h2></div>
          <Link className="button button-light button-large" to="/builder">Create your resume <Icon name="arrowRight" size={18} /></Link>
        </div>
      </section>
    </>
  )
}

export default Home
