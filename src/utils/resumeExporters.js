import {
  createClassicEngineeringResume,
  formatResumeAsText,
  getResumeFileBaseName,
} from './resumeFormatters.js'

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function textRun(TextRun, text, options = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: options.size ?? 20,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
  })
}

function createBullet(Paragraph, TextRun, text) {
  return new Paragraph({
    children: [textRun(TextRun, text)],
    bullet: { level: 0 },
    spacing: { after: 60 },
  })
}

function createSectionHeading(Paragraph, HeadingLevel, title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    thematicBreak: true,
    spacing: { before: 180, after: 120 },
  })
}

function createEntryHeading(Paragraph, TextRun, title, meta = '') {
  return new Paragraph({
    children: [
      textRun(TextRun, title, { bold: true }),
      meta ? textRun(TextRun, ` | ${meta}`, { color: '334155' }) : textRun(TextRun, ''),
    ],
    spacing: { after: 40 },
  })
}

function buildDocxChildren(resume, docx) {
  const {
    AlignmentType,
    HeadingLevel,
    Paragraph,
    TextRun,
  } = docx

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [textRun(TextRun, resume.personalDetails.fullName || 'Your Name', {
        bold: true,
        size: 30,
        color: '0f172a',
      })],
      spacing: { after: 40 },
    }),
  ]

  if (resume.personalDetails.targetRole) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [textRun(TextRun, resume.personalDetails.targetRole, {
        bold: true,
        size: 21,
        color: '1d4ed8',
      })],
      spacing: { after: 50 },
    }))
  }

  const contactLine = [
    ...resume.personalDetails.contactItems,
    ...resume.personalDetails.links.map((link) => `${link.label}: ${link.url}`),
  ].join(' | ')

  if (contactLine) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [textRun(TextRun, contactLine, { size: 17, color: '475569' })],
      spacing: { after: 180 },
    }))
  }

  resume.sections.forEach((section) => {
    children.push(createSectionHeading(Paragraph, HeadingLevel, section.title))

    if (section.type === 'paragraph') {
      children.push(new Paragraph({
        children: [textRun(TextRun, section.content)],
        spacing: { after: 80 },
      }))
      return
    }

    if (section.type === 'skills') {
      section.groups.forEach((group) => {
        children.push(new Paragraph({
          children: [
            textRun(TextRun, `${group.label}: `, { bold: true }),
            textRun(TextRun, group.values.join(', ')),
          ],
          spacing: { after: 70 },
        }))
      })
      return
    }

    section.items.forEach((item) => {
      if (section.type === 'education') {
        children.push(createEntryHeading(Paragraph, TextRun, item.title || 'Education', item.date))
        if (item.organization) {
          children.push(new Paragraph({
            children: [textRun(TextRun, item.organization, { italics: true, color: '334155' })],
            spacing: { after: 40 },
          }))
        }
        item.details.forEach((detail) => children.push(new Paragraph({
          children: [textRun(TextRun, detail)],
          spacing: { after: 60 },
        })))
        return
      }

      if (section.type === 'projects') {
        children.push(createEntryHeading(Paragraph, TextRun, item.title || 'Project', item.techStack))
        if (item.description) {
          children.push(new Paragraph({
            children: [textRun(TextRun, item.description)],
            spacing: { after: 50 },
          }))
        }
        item.links.forEach((link) => children.push(new Paragraph({
          children: [textRun(TextRun, `${link.label}: ${link.url}`, { color: '1d4ed8' })],
          spacing: { after: 40 },
        })))
        item.bullets.forEach((bullet) => children.push(createBullet(Paragraph, TextRun, bullet)))
        return
      }

      if (section.type === 'experience') {
        children.push(createEntryHeading(Paragraph, TextRun, item.title || 'Experience', item.date))
        if (item.organization) {
          children.push(new Paragraph({
            children: [textRun(TextRun, item.organization, { italics: true, color: '334155' })],
            spacing: { after: 40 },
          }))
        }
        item.bullets.forEach((bullet) => children.push(createBullet(Paragraph, TextRun, bullet)))
        return
      }

      children.push(createEntryHeading(
        Paragraph,
        TextRun,
        item.title || 'Certification',
        [item.issuer, item.year].filter(Boolean).join(' | '),
      ))
      if (item.link) {
        children.push(new Paragraph({
          children: [textRun(TextRun, `Credential: ${item.link}`, { color: '1d4ed8' })],
          spacing: { after: 60 },
        }))
      }
    })
  })

  return children
}

export function downloadTxtResume(resumeData) {
  const fileName = `${getResumeFileBaseName(resumeData)}.txt`
  const blob = new Blob([formatResumeAsText(resumeData)], {
    type: 'text/plain;charset=utf-8',
  })
  downloadBlob(blob, fileName)
}

export async function downloadDocxResume(resumeData) {
  const docx = await import('docx')
  const { Document, Packer } = docx
  const resume = createClassicEngineeringResume(resumeData)
  const fileName = `${getResumeFileBaseName(resumeData)}.docx`
  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: buildDocxChildren(resume, docx),
      },
    ],
  })

  const blob = await Packer.toBlob(document)
  downloadBlob(blob, fileName)
}

export async function downloadPdfResume(resumeData) {
  const { jsPDF } = await import('jspdf')
  const resume = createClassicEngineeringResume(resumeData)
  const fileName = `${getResumeFileBaseName(resumeData)}.pdf`
  const pdf = new jsPDF('p', 'mm', 'a4')
  const layout = {
    marginX: 15,
    marginTop: 15,
    marginBottom: 12,
    pageWidth: pdf.internal.pageSize.getWidth(),
    pageHeight: pdf.internal.pageSize.getHeight(),
    contentWidth: pdf.internal.pageSize.getWidth() - 30,
  }
  const colors = {
    navy: [15, 23, 42],
    blue: [29, 78, 216],
    slate: [51, 65, 85],
    muted: [71, 85, 105],
    rule: [148, 163, 184],
  }
  let cursorY = layout.marginTop

  function setText(color, size, style = 'normal') {
    pdf.setFont('helvetica', style)
    pdf.setFontSize(size)
    pdf.setTextColor(...color)
  }

  function addPage() {
    pdf.addPage()
    cursorY = layout.marginTop
  }

  function remainingHeight() {
    return layout.pageHeight - layout.marginBottom - cursorY
  }

  function ensureSpace(height) {
    if (height > remainingHeight() && cursorY > layout.marginTop) {
      addPage()
    }
  }

  function usablePageHeight() {
    return layout.pageHeight - layout.marginTop - layout.marginBottom
  }

  function splitText(text, width = layout.contentWidth, size = 9) {
    pdf.setFontSize(size)
    return pdf.splitTextToSize(text, width).filter(Boolean)
  }

  function textHeight(lines, lineHeight) {
    return Math.max(lines.length, 1) * lineHeight
  }

  function drawWrappedText(text, x, width, options = {}) {
    const {
      size = 9,
      lineHeight = 4.2,
      color = colors.slate,
      style = 'normal',
      prefix = '',
    } = options
    const lines = splitText(text, width, size)
    setText(color, size, style)
    lines.forEach((line, index) => {
      pdf.text(`${index === 0 ? prefix : ''}${line}`, x, cursorY)
      cursorY += lineHeight
    })
  }

  function estimateParagraph(text, width = layout.contentWidth, size = 9, lineHeight = 4.2) {
    return textHeight(splitText(text, width, size), lineHeight)
  }

  function drawHeader() {
    const fullName = resume.personalDetails.fullName || 'Your Name'
    setText(colors.navy, 18, 'bold')
    pdf.text(fullName.toUpperCase(), layout.pageWidth / 2, cursorY, { align: 'center' })
    cursorY += 6

    if (resume.personalDetails.targetRole) {
      setText(colors.blue, 10, 'bold')
      pdf.text(resume.personalDetails.targetRole, layout.pageWidth / 2, cursorY, { align: 'center' })
      cursorY += 4.6
    }

    const contactLine = [
      ...resume.personalDetails.contactItems,
      ...resume.personalDetails.links.map((link) => `${link.label}: ${link.url}`),
    ].join(' | ')

    if (contactLine) {
      const lines = splitText(contactLine, layout.contentWidth, 8)
      setText(colors.muted, 8)
      lines.forEach((line) => {
        pdf.text(line, layout.pageWidth / 2, cursorY, { align: 'center' })
        cursorY += 3.5
      })
    }

    pdf.setDrawColor(...colors.navy)
    pdf.setLineWidth(0.6)
    pdf.line(layout.marginX, cursorY + 1.5, layout.pageWidth - layout.marginX, cursorY + 1.5)
    cursorY += 6.2
  }

  function sectionHeadingHeight() {
    return 7.4
  }

  function drawSectionHeading(title) {
    setText(colors.navy, 9.5, 'bold')
    pdf.text(title.toUpperCase(), layout.marginX, cursorY)
    cursorY += 2.4
    pdf.setDrawColor(...colors.rule)
    pdf.setLineWidth(0.25)
    pdf.line(layout.marginX, cursorY, layout.pageWidth - layout.marginX, cursorY)
    cursorY += 4.6
  }

  function entryHeadingHeight(item) {
    const title = [item.title, item.techStack].filter(Boolean).join(' | ')
    const meta = item.date || item.organization || [item.issuer, item.year].filter(Boolean).join(' | ')
    return Math.max(
      estimateParagraph(title || 'Entry', 122, 8.6, 3.9),
      meta ? estimateParagraph(meta, 48, 7.5, 3.5) : 0,
    )
  }

  function drawEntryHeading(item, fallbackTitle = 'Entry') {
    const title = [item.title || fallbackTitle, item.techStack].filter(Boolean).join(' | ')
    const meta = item.date || [item.issuer, item.year].filter(Boolean).join(' | ')
    const titleLines = splitText(title, 122, 8.6)
    const metaLines = meta ? splitText(meta, 48, 7.5) : []
    const startY = cursorY

    setText(colors.navy, 8.6, 'bold')
    titleLines.forEach((line, index) => pdf.text(line, layout.marginX, startY + (index * 3.9)))
    if (metaLines.length > 0) {
      setText(colors.muted, 7.5, 'bold')
      metaLines.forEach((line, index) => (
        pdf.text(line, layout.pageWidth - layout.marginX, startY + (index * 3.5), { align: 'right' })
      ))
    }
    cursorY += Math.max(textHeight(titleLines, 3.9), textHeight(metaLines, 3.5))
  }

  function drawOrganization(value) {
    if (!value) {
      return
    }
    setText(colors.slate, 8, 'italic')
    pdf.text(value, layout.marginX, cursorY)
    cursorY += 3.7
  }

  function estimateEntry(section, item) {
    let height = entryHeadingHeight(item)
    if (item.organization) {
      height += 3.7
    }
    if (item.description) {
      height += estimateParagraph(item.description, layout.contentWidth, 8.1, 3.8)
    }
    if (item.details) {
      height += item.details.reduce((sum, detail) => sum + estimateParagraph(detail, layout.contentWidth, 8, 3.7), 0)
    }
    if (item.links) {
      height += item.links.reduce((sum, link) => (
        sum + estimateParagraph(`${link.label}: ${link.url}`, layout.contentWidth, 7.6, 3.5)
      ), 0)
    }
    if (item.link) {
      height += estimateParagraph(`Credential: ${item.link}`, layout.contentWidth, 7.6, 3.5)
    }
    if (item.bullets) {
      height += item.bullets.reduce((sum, bullet) => (
        sum + estimateParagraph(bullet, layout.contentWidth - 5, 8, 3.7)
      ), 0)
    }
    if (section.type === 'certifications') {
      height += 0.8
    }
    return height + 3.2
  }

  function drawEntry(section, item) {
    drawEntryHeading(item, section.title)
    drawOrganization(item.organization)
    if (item.description) {
      drawWrappedText(item.description, layout.marginX, layout.contentWidth, { size: 8.1, lineHeight: 3.8 })
    }
    item.details?.forEach((detail) => drawWrappedText(detail, layout.marginX, layout.contentWidth, {
      size: 8,
      lineHeight: 3.7,
    }))
    item.links?.forEach((link) => drawWrappedText(`${link.label}: ${link.url}`, layout.marginX, layout.contentWidth, {
      size: 7.6,
      lineHeight: 3.5,
      color: colors.blue,
    }))
    if (item.link) {
      drawWrappedText(`Credential: ${item.link}`, layout.marginX, layout.contentWidth, {
        size: 7.6,
        lineHeight: 3.5,
        color: colors.blue,
      })
    }
    item.bullets?.forEach((bullet) => {
      drawWrappedText(bullet, layout.marginX + 4, layout.contentWidth - 5, {
        size: 8,
        lineHeight: 3.7,
        prefix: '- ',
      })
    })
    cursorY += section.type === 'certifications' ? 1.2 : 3.2
  }

  function estimateSection(section) {
    if (section.type === 'paragraph') {
      return sectionHeadingHeight() + estimateParagraph(section.content, layout.contentWidth, 8.6, 4)
    }
    if (section.type === 'skills') {
      return sectionHeadingHeight() + section.groups.reduce((sum, group) => (
        sum + estimateParagraph(`${group.label}: ${group.values.join(', ')}`, layout.contentWidth, 8.2, 3.8)
      ), 0) + 2.4
    }
    return sectionHeadingHeight() + section.items.reduce((sum, item) => (
      sum + estimateEntry(section, item)
    ), 0)
  }

  function estimateSectionLead(section) {
    if (section.type === 'paragraph') {
      return sectionHeadingHeight() + estimateParagraph(section.content, layout.contentWidth, 8.6, 4)
    }
    if (section.type === 'skills') {
      return sectionHeadingHeight() + section.groups.slice(0, 2).reduce((sum, group) => (
        sum + estimateParagraph(`${group.label}: ${group.values.join(', ')}`, layout.contentWidth, 8.2, 3.8)
      ), 0)
    }
    return sectionHeadingHeight() + estimateEntry(section, section.items[0])
  }

  drawHeader()

  resume.sections.forEach((section) => {
    const sectionHeight = estimateSection(section)
    if (section.type === 'certifications' && sectionHeight <= usablePageHeight()) {
      ensureSpace(sectionHeight)
    } else {
      ensureSpace(Math.min(estimateSectionLead(section), usablePageHeight()))
    }
    drawSectionHeading(section.title)

    if (section.type === 'paragraph') {
      drawWrappedText(section.content, layout.marginX, layout.contentWidth, {
        size: 8.6,
        lineHeight: 4,
      })
      cursorY += 2.4
      return
    }

    if (section.type === 'skills') {
      section.groups.forEach((group) => {
        const text = `${group.label}: ${group.values.join(', ')}`
        ensureSpace(estimateParagraph(text, layout.contentWidth, 8.2, 3.8) + 2)
        drawWrappedText(text, layout.marginX, layout.contentWidth, {
          size: 8.2,
          lineHeight: 3.8,
        })
      })
      cursorY += 2.4
      return
    }

    section.items.forEach((item, index) => {
      const itemHeight = estimateEntry(section, item)
      const remainingItems = section.items.length - index
      const keepLastCertificationsTogether = section.type === 'certifications' && remainingItems === 2
      const requiredHeight = keepLastCertificationsTogether
        ? itemHeight + estimateEntry(section, section.items[index + 1])
        : itemHeight
      ensureSpace(Math.min(requiredHeight, usablePageHeight()))
      drawEntry(section, item)
    })
  })

  pdf.save(fileName)
}
