import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { downloadFormats } from '../data/appData'

function Download() {
  return (
    <div className="page-surface">
      <div className="container narrow-container">
        <PageHeader
          eyebrow="Export Resume"
          title="Ready when you are"
          description="Choose the format that fits your application workflow. Download functionality will be enabled in a future release."
        />
        <div className="download-layout">
          <section className="download-main">
            <div className="download-status"><span className="feature-icon"><Icon name="download" size={24} /></span><div><h2>Choose your format</h2><p>Your final resume will be prepared using your latest editor changes.</p></div></div>
            <div className="format-list">
              {downloadFormats.map((format, index) => (
                <article className={index === 0 ? 'format-card selected' : 'format-card'} key={format.name}>
                  <span className="format-icon"><Icon name="file" size={24} /><small>{format.name}</small></span>
                  <div><div className="format-title"><h3>{format.name}</h3>{index === 0 && <span>Recommended</span>}</div><p>{format.description}</p><small>{format.detail} · {format.extension}</small></div>
                  <button type="button" disabled aria-label={`Download ${format.name}`}><Icon name="download" size={19} /></button>
                </article>
              ))}
            </div>
            <button className="button button-primary button-large full-button" type="button" disabled>Download resume <Icon name="download" size={18} /></button>
            <p className="prototype-note">Download actions are disabled in this foundation prototype.</p>
          </section>
          <aside className="download-preview">
            <div className="mini-paper"><span className="mini-name" /><span className="mini-role" /><hr />{[1, 2, 3, 4].map((item) => <div key={item}><b /><span /><span /><span /></div>)}</div>
            <strong>Resume preview</strong><p>Your completed resume will appear here.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Download
