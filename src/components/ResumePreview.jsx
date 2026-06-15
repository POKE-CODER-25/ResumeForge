import { normalizeResumeData } from '../data/resumeData'

function safeString(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}

function hasContent(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return false
  }

  return Object.entries(entry).some(
    ([key, value]) => key !== 'id' && safeString(value).trim(),
  )
}

function toList(value) {
  return safeString(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function displayUrl(value) {
  return safeString(value).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

function ResumePreview({ resumeData = null }) {
  const data = normalizeResumeData(resumeData)
  const {
    personalDetails,
    summary,
    education,
    skills,
    projects,
    experience,
    certifications,
  } = data
  const contactItems = [
    personalDetails.email,
    personalDetails.phone,
    personalDetails.location,
  ].filter(Boolean)
  const profileLinks = [
    ['LinkedIn', personalDetails.linkedin],
    ['GitHub', personalDetails.github],
    ['Portfolio', personalDetails.portfolio],
  ].filter(([, value]) => Boolean(value))
  const visibleEducation = education.filter(hasContent)
  const visibleProjects = projects.filter(hasContent)
  const visibleExperience = experience.filter(hasContent)
  const visibleCertifications = certifications.filter(hasContent)
  const skillGroups = [
    ['Technical', skills.technicalSkills],
    ['Tools', skills.tools],
    ['Professional', skills.softSkills],
  ].filter(([, value]) => safeString(value).trim())
  const hasSummary = safeString(summary).trim()

  return (
    <article className="builder-resume" aria-label="Live resume preview">
      <header className="builder-resume-header">
        <h1>{personalDetails.fullName || 'Your Name'}</h1>
        <p>{personalDetails.targetRole || 'Target Role'}</p>
        {(contactItems.length > 0 || profileLinks.length > 0) && (
          <div className="builder-resume-contact">
            {contactItems.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
            {profileLinks.map(([label, value]) => (
              <a href={value} key={label} target="_blank" rel="noreferrer">
                {displayUrl(value) || label}
              </a>
            ))}
          </div>
        )}
      </header>

      {hasSummary && (
        <section className="builder-resume-section">
          <h2>Professional Summary</h2>
          <p className="resume-summary">{summary}</p>
        </section>
      )}

      {visibleExperience.length > 0 && (
        <section className="builder-resume-section">
          <h2>Experience</h2>
          {visibleExperience.map((entry, entryIndex) => {
            const responsibilities = toList(entry.responsibilities)
            return (
              <div className="resume-entry" key={entry.id || `experience-${entryIndex}`}>
                <div className="resume-entry-heading">
                  <div>
                    <h3>{entry.role || 'Role'}</h3>
                    <strong>{entry.company || 'Company'}{entry.location && `, ${entry.location}`}</strong>
                  </div>
                  <span>{[entry.startDate, entry.endDate].filter(Boolean).join(' - ')}</span>
                </div>
                {responsibilities.length > 0 && (
                  <ul>{responsibilities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                )}
              </div>
            )
          })}
        </section>
      )}

      {visibleProjects.length > 0 && (
        <section className="builder-resume-section">
          <h2>Projects</h2>
          {visibleProjects.map((entry, entryIndex) => {
            const highlights = toList(entry.highlights)
            return (
              <div className="resume-entry" key={entry.id || `project-${entryIndex}`}>
                <div className="resume-entry-heading">
                  <div className="project-heading">
                    <h3>{entry.title || 'Project Title'}</h3>
                    {entry.techStack && <strong>| {entry.techStack}</strong>}
                  </div>
                  <span className="project-links">
                    {entry.liveLink && <a href={entry.liveLink} target="_blank" rel="noreferrer">Live</a>}
                    {entry.githubLink && <a href={entry.githubLink} target="_blank" rel="noreferrer">GitHub</a>}
                  </span>
                </div>
                {entry.description && <p>{entry.description}</p>}
                {highlights.length > 0 && (
                  <ul>{highlights.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                )}
              </div>
            )
          })}
        </section>
      )}

      {visibleEducation.length > 0 && (
        <section className="builder-resume-section">
          <h2>Education</h2>
          {visibleEducation.map((entry, index) => (
            <div className="resume-entry compact-entry" key={entry.id || `education-${index}`}>
              <div className="resume-entry-heading">
                <div>
                  <h3>{entry.degree || 'Degree'}</h3>
                  <strong>{entry.institution || 'Institution'}{entry.location && `, ${entry.location}`}</strong>
                </div>
                <span>{[entry.startYear, entry.endYear].filter(Boolean).join(' - ')}</span>
              </div>
              {entry.cgpa && <p>CGPA: {entry.cgpa}</p>}
            </div>
          ))}
        </section>
      )}

      {skillGroups.length > 0 && (
        <section className="builder-resume-section resume-skills">
          <h2>Skills</h2>
          {skillGroups.map(([label, value]) => (
            <p key={label}><strong>{label}:</strong> {toList(value).join(', ')}</p>
          ))}
        </section>
      )}

      {visibleCertifications.length > 0 && (
        <section className="builder-resume-section">
          <h2>Certifications</h2>
          {visibleCertifications.map((entry, index) => (
            <div className="certification-entry" key={entry.id || `certification-${index}`}>
              <p>
                <strong>{entry.title || 'Certification'}</strong>
                {entry.issuer && `, ${entry.issuer}`}
              </p>
              <span>
                {entry.year}
                {entry.link && <a href={entry.link} target="_blank" rel="noreferrer">Credential</a>}
              </span>
            </div>
          ))}
        </section>
      )}

      {!hasSummary && visibleExperience.length === 0 && visibleProjects.length === 0
        && visibleEducation.length === 0 && skillGroups.length === 0 && visibleCertifications.length === 0 && (
          <div className="resume-preview-empty">
            <strong>Your resume will take shape here.</strong>
            <p>Start entering your details to build a clean engineering resume in real time.</p>
          </div>
        )}
    </article>
  )
}

export default ResumePreview
