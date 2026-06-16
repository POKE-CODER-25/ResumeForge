import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import {
  ACTIVE_RESUME_CHANGED_EVENT,
  loadActiveResumeRecord,
} from '../data/activeResumeData'
import { downloadFormats } from '../data/appData'
import {
  loadResumeData,
  normalizeResumeData,
} from '../data/resumeData'
import {
  RESUME_WORKFLOW_CLEARED_EVENT,
} from '../data/uploadedResumeData'
import {
  downloadDocxResume,
  downloadPdfResume,
  downloadTxtResume,
} from '../utils/resumeExporters'
import {
  RESUME_TEMPLATES,
  createClassicEngineeringResume,
} from '../utils/resumeFormatters'

function getDownloadResumeSource() {
  const activeRecord = loadActiveResumeRecord()
  if (activeRecord?.source === 'editor-approved') {
    return {
      resumeData: normalizeResumeData(activeRecord.resumeData),
      source: 'editor-approved',
      sourceLabel: 'Editor-approved resume',
    }
  }

  return {
    resumeData: normalizeResumeData(loadResumeData()),
    source: 'builder',
    sourceLabel: 'Builder resume',
  }
}

function ResumeExportPreview({ resume, previewRef = null }) {
  const { personalDetails, sections } = resume
  const contactLine = [
    ...personalDetails.contactItems,
    ...personalDetails.links.map((link) => link.display),
  ].filter(Boolean)

  return (
    <article ref={previewRef} className="export-resume" aria-label="Final resume export preview">
      <header className="export-resume-header">
        <h1>{personalDetails.fullName || 'Your Name'}</h1>
        {personalDetails.targetRole && <p>{personalDetails.targetRole}</p>}
        {contactLine.length > 0 && (
          <div className="export-resume-contact">
            {contactLine.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
          </div>
        )}
      </header>

      {sections.map((section) => (
        <section className="export-resume-section" key={section.id}>
          <h2>{section.title}</h2>

          {section.type === 'paragraph' && <p className="export-summary">{section.content}</p>}

          {section.type === 'skills' && section.groups.map((group) => (
            <p className="export-skill-row" key={group.label}>
              <strong>{group.label}:</strong> {group.values.join(', ')}
            </p>
          ))}

          {section.type === 'education' && section.items.map((item, index) => (
            <div className="export-entry" key={`${section.id}-${index}`}>
              <div className="export-entry-heading">
                <div>
                  <h3>{item.title || 'Education'}</h3>
                  {item.organization && <strong>{item.organization}</strong>}
                </div>
                {item.date && <span>{item.date}</span>}
              </div>
              {item.details.map((detail) => <p key={detail}>{detail}</p>)}
            </div>
          ))}

          {section.type === 'projects' && section.items.map((item, index) => (
            <div className="export-entry" key={`${section.id}-${index}`}>
              <div className="export-entry-heading">
                <div>
                  <h3>
                    {item.title || 'Project'}
                    {item.techStack && <span> | {item.techStack}</span>}
                  </h3>
                </div>
                {item.links.length > 0 && (
                  <span>{item.links.map((link) => link.label).join(' / ')}</span>
                )}
              </div>
              {item.description && <p>{item.description}</p>}
              {item.links.map((link) => (
                <p className="export-link-line" key={`${link.label}-${link.url}`}>
                  {link.label}: {link.url}
                </p>
              ))}
              {item.bullets.length > 0 && (
                <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              )}
            </div>
          ))}

          {section.type === 'experience' && section.items.map((item, index) => (
            <div className="export-entry" key={`${section.id}-${index}`}>
              <div className="export-entry-heading">
                <div>
                  <h3>{item.title || 'Experience'}</h3>
                  {item.organization && <strong>{item.organization}</strong>}
                </div>
                {item.date && <span>{item.date}</span>}
              </div>
              {item.bullets.length > 0 && (
                <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              )}
            </div>
          ))}

          {section.type === 'certifications' && section.items.map((item, index) => (
            <div className="export-certification" key={`${section.id}-${index}`}>
              <p>
                <strong>{item.title || 'Certification'}</strong>
                {[item.issuer, item.year].filter(Boolean).length > 0 && (
                  <span> | {[item.issuer, item.year].filter(Boolean).join(' | ')}</span>
                )}
              </p>
              {item.link && <span>Credential: {item.link}</span>}
            </div>
          ))}
        </section>
      ))}
    </article>
  )
}

function Download() {
  const [downloadResume, setDownloadResume] = useState(getDownloadResumeSource)
  const [selectedFormat, setSelectedFormat] = useState('PDF')
  const [selectedTemplate, setSelectedTemplate] = useState(RESUME_TEMPLATES[0].id)
  const [exportStatus, setExportStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('Download ready')

  const exportResumeData = useMemo(
    () => normalizeResumeData(downloadResume.resumeData),
    [downloadResume.resumeData],
  )
  const exportResume = useMemo(
    () => createClassicEngineeringResume(exportResumeData),
    [exportResumeData],
  )

  useEffect(() => {
    function handleWorkflowCleared() {
      setDownloadResume(getDownloadResumeSource())
    }

    window.addEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
    window.addEventListener(ACTIVE_RESUME_CHANGED_EVENT, handleWorkflowCleared)
    return () => {
      window.removeEventListener(RESUME_WORKFLOW_CLEARED_EVENT, handleWorkflowCleared)
      window.removeEventListener(ACTIVE_RESUME_CHANGED_EVENT, handleWorkflowCleared)
    }
  }, [])

  async function handleDownload(formatName = selectedFormat) {
    const format = formatName.toLowerCase()
    const preparingMessage = formatName === 'PDF'
      ? 'Preparing PDF...'
      : `Preparing ${formatName}...`

    setSelectedFormat(formatName)
    setExportStatus('preparing')
    setStatusMessage(preparingMessage)

    try {
      if (format === 'pdf') {
        await downloadPdfResume(exportResumeData)
      } else if (format === 'docx') {
        await downloadDocxResume(exportResumeData)
      } else {
        downloadTxtResume(exportResumeData)
      }
      setExportStatus('ready')
      setStatusMessage('Download ready')
    } catch (error) {
      console.error(error)
      setExportStatus('failed')
      setStatusMessage('Failed to export, please try again')
    }
  }

  return (
    <div className="page-surface">
      <div className="container download-container">
        <PageHeader
          eyebrow="Export Resume"
          title="Download your professional resume"
          description="Export the latest approved resume data in a polished Classic Engineering Resume format."
        />
        <div className="workspace-source-row">
          <span className="analysis-source">
            Export source: {downloadResume.sourceLabel}
          </span>
        </div>

        <div className="download-layout">
          <section className="download-main">
            <div className="download-status">
              <span className="feature-icon"><Icon name="download" size={24} /></span>
              <div>
                <h2>Export options</h2>
                <p>{statusMessage}</p>
              </div>
            </div>

            <label className="template-selector">
              <span>Template</span>
              <select
                value={selectedTemplate}
                onChange={(event) => setSelectedTemplate(event.target.value)}
              >
                {RESUME_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>

            <div className="format-list">
              {downloadFormats.map((format, index) => (
                <article
                  className={selectedFormat === format.name ? 'format-card selected' : 'format-card'}
                  key={format.name}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedFormat === format.name}
                  onClick={() => setSelectedFormat(format.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedFormat(format.name)
                    }
                  }}
                >
                  <span className="format-icon"><Icon name="file" size={24} /><small>{format.name}</small></span>
                  <div>
                    <div className="format-title">
                      <h3>{format.name}</h3>
                      {index === 0 && <span>Recommended</span>}
                    </div>
                    <p>{format.description}</p>
                    <small>{format.detail} | {format.extension}</small>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDownload(format.name)
                    }}
                    disabled={exportStatus === 'preparing'}
                    aria-label={`Download ${format.name}`}
                  >
                    <Icon name="download" size={19} />
                  </button>
                </article>
              ))}
            </div>

            <button
              className="button button-primary button-large full-button"
              type="button"
              onClick={() => handleDownload(selectedFormat)}
              disabled={exportStatus === 'preparing'}
            >
              {exportStatus === 'preparing' ? statusMessage : `Download ${selectedFormat}`}
              <Icon name="download" size={18} />
            </button>
            <p className={`download-message ${exportStatus}`}>{statusMessage}</p>
          </section>

          <aside className="download-preview">
            <div className="preview-toolbar">
              <div>
                <Icon name="document" size={18} />
                <span>{exportResume.templateName}</span>
              </div>
              <span>A4 export preview</span>
            </div>
            <div className="download-resume-stage">
              <ResumeExportPreview resume={exportResume} />
            </div>
            <strong>Final preview</strong>
            <p>This is the exact resume content used for PDF, DOCX, and TXT exports.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Download
