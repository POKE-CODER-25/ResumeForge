import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { reportCards } from '../data/appData'

function CredentialReport() {
  return (
    <div className="page-surface">
      <div className="container">
        <PageHeader
          eyebrow="Credential Report"
          title="Resume Health Report"
          description="A clear view of what is working, what needs attention, and which sections can strengthen your application."
          actions={<Link className="button button-primary" to="/editor">Open editor <Icon name="arrowRight" size={17} /></Link>}
        />
        <section className="health-overview">
          <div className="large-score"><div className="score-ring report-score"><strong>--</strong><span>/100</span></div><div><span className="status-label">Analysis pending</span><h2>Complete your profile to unlock your score.</h2><p>Your health score will evaluate completeness, clarity, impact, and structure.</p></div></div>
          <Link className="button button-secondary" to="/builder">Complete profile</Link>
        </section>
        <div className="report-grid">
          {reportCards.map((card) => (
            <article className="report-card" key={card.title}>
              <div className="report-card-top"><span className={`report-icon ${card.tone}`}><Icon name={card.icon} size={20} /></span><span>Preview</span></div>
              <h2>{card.title}</h2>
              <strong>{card.value}</strong>
              <p>{card.description}</p>
              <div className="skeleton-lines"><span /><span /><span /></div>
            </article>
          ))}
        </div>
        <div className="report-note"><Icon name="shield" size={20} /><div><strong>Private by design</strong><p>Your report is based only on the resume information you provide.</p></div></div>
      </div>
    </div>
  )
}

export default CredentialReport
