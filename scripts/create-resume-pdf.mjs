import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const outputPath = resolve('public/resume-minki-jung.pdf')

const lines = [
  { text: 'Minki Jung', x: 72, y: 720, size: 26, font: 'F2' },
  {
    text: 'Cybersecurity Student & Security Researcher',
    x: 72,
    y: 690,
    size: 14,
    font: 'F1',
  },
  { text: 'Email: minki@luxferre.cc', x: 72, y: 650, size: 11, font: 'F1' },
  { text: 'GitHub: https://github.com/jungmingi-lab', x: 72, y: 632, size: 11, font: 'F1' },
  { text: 'Website: https://luxferre.cc', x: 72, y: 614, size: 11, font: 'F1' },
  { text: 'Education', x: 72, y: 570, size: 15, font: 'F2' },
  {
    text: 'Daejeon University, AISW Department',
    x: 72,
    y: 548,
    size: 11,
    font: 'F1',
  },
  { text: 'Interests', x: 72, y: 506, size: 15, font: 'F2' },
  {
    text: 'Web Security, Vulnerability Research, CTF, Digital Forensics, AI Security',
    x: 72,
    y: 484,
    size: 11,
    font: 'F1',
  },
  { text: 'Projects', x: 72, y: 442, size: 15, font: 'F2' },
  {
    text: 'MorningStar - Information ecosystem health analysis AI platform',
    x: 72,
    y: 420,
    size: 11,
    font: 'F1',
  },
  {
    text: 'Parking King - Parking sharing and reservation service',
    x: 72,
    y: 402,
    size: 11,
    font: 'F1',
  },
  {
    text: 'AI-powered personalized meal recommendation service',
    x: 72,
    y: 384,
    size: 11,
    font: 'F1',
  },
  {
    text: 'IoT Hackathon - Time-series prediction and security challenge project',
    x: 72,
    y: 366,
    size: 11,
    font: 'F1',
  },
  { text: 'Portfolio', x: 72, y: 320, size: 15, font: 'F2' },
  {
    text: 'Security, vulnerability research, CTF, AI, and software development work.',
    x: 72,
    y: 298,
    size: 11,
    font: 'F1',
  },
]

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

const content = lines
  .map(
    (line) =>
      `BT /${line.font} ${line.size} Tf ${line.x} ${line.y} Td (${escapePdfText(
        line.text,
      )}) Tj ET`,
  )
  .join('\n')

const objects = [
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
  '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  `6 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
]

let pdf = '%PDF-1.4\n'
const offsets = [0]

for (const object of objects) {
  offsets.push(Buffer.byteLength(pdf))
  pdf += object
}

const xrefOffset = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n`
pdf += '0000000000 65535 f \n'
pdf += offsets
  .slice(1)
  .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
  .join('')
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, pdf)
console.log(`Created ${outputPath}`)
