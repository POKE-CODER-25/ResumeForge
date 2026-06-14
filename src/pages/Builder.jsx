import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { builderSections } from '../data/appData'

function Builder() {
  return (
    <div className="page-surface">
      <div className="container">
        <PageHeader
          eyebrow="Resume Builder"
          title="Build your professional profile"
          description="Add your details section by section. You can review and improve everything before generating your resume."
          actions={<Link className="button button-secondary" to="/credential-report">Review health report <Icon name="arrowRight" size={17} /></Link>}
        />

        <div className="progress-card">
          <div><span>Profile completion</span><strong>0%</strong></div>
          <div className="progress-track"><span /></div>
          <p>Start with your personal details. Your progress saves as you complete each section.</p>
        </div>

        <div className="builder-layout">
          <div className="builder-sections">
            {builderSections.map((section, index) => (
              <article className="builder-card" key={section.title}>
                <span className="section-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="builder-icon"><Icon name={section.icon} size={22} /></span>
                <div><h2>{section.title}</h2><p>{section.description}</p></div>
                <span className={index === 0 ? 'section-status current' : 'section-status'}>{section.status}</span>
                <button type="button" aria-label={`Open ${section.title}`}><Icon name="plus" size={19} /></button>
              </article>
            ))}
          </div>
          <aside className="guide-card">
            <span className="feature-icon"><Icon name="lightbulb" size={22} /></span>
            <h3>Build with purpose</h3>
            <p>Focus on relevant accomplishments and measurable impact. ResumeForge will help identify opportunities once your sections are complete.</p>
            <div className="guide-list"><span><Icon name="check" size={16} /> Use concise statements</span><span><Icon name="check" size={16} /> Lead with outcomes</span><span><Icon name="check" size={16} /> Tailor to your role</span></div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Builder
