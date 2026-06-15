import { useRef, useState } from 'react'
import Icon from './Icon'
import { validateResumeFile } from '../utils/resumeTextExtractor'

function ResumeUpload({
  file = null,
  error = '',
  warning = '',
  isProcessing = false,
  onFile = () => {},
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  function selectFile(nextFile) {
    const validationError = validateResumeFile(nextFile)
    if (validationError) {
      onFile(null, validationError)
      return
    }
    onFile(nextFile, '')
  }

  function handleInput(event) {
    const nextFile = event.target.files?.[0]
    if (nextFile) {
      selectFile(nextFile)
    }
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    const nextFile = event.dataTransfer.files?.[0]
    if (nextFile) {
      selectFile(nextFile)
    }
  }

  function openPicker() {
    if (!isProcessing) {
      inputRef.current?.click()
    }
  }

  return (
    <section className="resume-upload-panel">
      <div className="upload-panel-copy">
        <span className="report-icon"><Icon name="document" size={20} /></span>
        <div>
          <span className="status-label">Local analysis</span>
          <h2>Analyze Existing Resume</h2>
          <p>Upload a resume and receive a Resume Health Score and Resume Doctor suggestions.</p>
        </div>
      </div>

      <div
        className={`resume-drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false)
          }
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleInput}
          hidden
        />
        {file ? (
          <div className="uploaded-file">
            <span className="uploaded-file-icon"><Icon name="file" size={20} /></span>
            <div>
              <strong>{file.name}</strong>
              <span>{isProcessing ? 'Extracting and analyzing locally...' : 'Ready - click to replace'}</span>
            </div>
          </div>
        ) : (
          <div className="drop-zone-empty">
            <span><Icon name="download" size={23} /></span>
            <strong>{isDragging ? 'Drop your resume here' : 'Drag and drop your resume'}</strong>
            <p>or click to browse from your device</p>
            <small>PDF, DOCX, or TXT - maximum 10 MB</small>
          </div>
        )}
      </div>

      {error && <p className="upload-message error" role="alert">{error}</p>}
      {!error && warning && <p className="upload-message warning" role="status">{warning}</p>}
      <p className="upload-privacy"><Icon name="shield" size={15} /> Files are processed locally. Only extracted text is stored in this browser until you remove it.</p>
    </section>
  )
}

export default ResumeUpload
