const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt']

function getExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function validateResumeFile(file) {
  if (!(file instanceof File)) {
    return 'Choose a PDF, DOCX, or TXT resume.'
  }

  const extension = getExtension(file.name)
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return 'Unsupported file type. Upload a PDF, DOCX, or TXT file.'
  }

  if (file.size === 0) {
    return 'The selected file is empty.'
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'The file is too large. Upload a resume smaller than 10 MB.'
  }

  return ''
}

function cleanExtractedText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdfText(file) {
  const isNode = typeof window === 'undefined'
  const legacyPdfPath = 'pdfjs-dist/legacy/build/pdf.mjs'
  const legacyWorkerPath = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
  const pdfjs = isNode
    ? await import(/* @vite-ignore */ legacyPdfPath)
    : await import('pdfjs-dist')
  if (isNode) {
    await import(/* @vite-ignore */ legacyWorkerPath)
  } else {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
  }

  const document = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    let previousY = null
    const lines = []

    content.items.forEach((item) => {
      const y = item.transform?.[5]
      if (previousY !== null && typeof y === 'number' && Math.abs(y - previousY) > 4) {
        lines.push('\n')
      } else if (lines.length > 0 && lines.at(-1) !== '\n') {
        lines.push(' ')
      }
      lines.push(item.str)
      previousY = y
    })

    pages.push(lines.join(''))
  }

  return pages.join('\n\n')
}

async function extractDocxText(file) {
  const mammothModule = await import('mammoth')
  const mammoth = mammothModule.default ?? mammothModule
  const arrayBuffer = await file.arrayBuffer()
  const options = typeof window === 'undefined' && globalThis.Buffer
    ? { buffer: globalThis.Buffer.from(arrayBuffer) }
    : { arrayBuffer }
  const result = await mammoth.extractRawText(options)
  return result.value
}

export async function extractResumeText(file) {
  const validationError = validateResumeFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const extension = getExtension(file.name)
  let text

  if (extension === 'pdf') {
    text = await extractPdfText(file)
  } else if (extension === 'docx') {
    text = await extractDocxText(file)
  } else {
    text = await file.text()
  }

  const cleanedText = cleanExtractedText(text)
  if (!cleanedText) {
    throw new Error('We could not fully understand this resume. Partial analysis is shown.')
  }

  return cleanedText
}

export default extractResumeText
