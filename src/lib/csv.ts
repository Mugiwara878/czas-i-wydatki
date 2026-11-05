export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

export function detectDelimiter(firstLine: string): string {
  const candidates = [';', ',', '\t']
  let best = ';'
  let bestCount = -1
  for (const c of candidates) {
    const count = firstLine.split(c).length
    if (count > bestCount) {
      bestCount = count
      best = c
    }
  }
  return best
}

export function parseCsv(text: string, delimiter?: string): ParsedCsv {
  const cleanText = text.replace(/^﻿/, '').trim()
  const lines = cleanText.split(/\r\n|\r|\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const delim = delimiter ?? detectDelimiter(lines[0])

  function parseLine(line: string): string[] {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else if (char === '"') {
        inQuotes = true
      } else if (char === delim) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  }

  const [headerLine, ...rowLines] = lines
  const headers = parseLine(headerLine)
  const rows = rowLines.map(parseLine).filter((r) => r.some((cell) => cell !== ''))

  return { headers, rows }
}

export async function decodeFile(file: File, encoding: 'utf-8' | 'windows-1250'): Promise<string> {
  const buffer = await file.arrayBuffer()
  return new TextDecoder(encoding).decode(buffer)
}

const monthNamesPl: Record<string, string> = {
  stycznia: '01',
  lutego: '02',
  marca: '03',
  kwietnia: '04',
  maja: '05',
  czerwca: '06',
  lipca: '07',
  sierpnia: '08',
  września: '09',
  października: '10',
  listopada: '11',
  grudnia: '12',
}

export function parseDate(value: string): string | null {
  const v = value.trim()
  if (!v) return null

  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  m = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  m = v.match(/^(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/i)
  if (m) {
    const month = monthNamesPl[m[2].toLowerCase()]
    if (month) return `${m[3]}-${month}-${m[1].padStart(2, '0')}`
  }

  return null
}

export function parseAmount(value: string): number | null {
  const cleaned = value
    .replace(/PLN|zł/gi, '')
    .replace(/\s/g, '')
    .replace(/ /g, '')
    .trim()
  if (!cleaned) return null

  const normalized = cleaned.includes(',') && !cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '')

  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

const keywordToCategory: { keywords: string[]; category: string }[] = [
  { keywords: ['biedronka', 'lidl', 'żabka', 'zabka', 'carrefour', 'kaufland', 'auchan', 'aldi', 'mcdonald', 'kfc', 'restaurac', 'piekarnia', 'stokrotka', 'netto'], category: 'Jedzenie' },
  { keywords: ['uber', 'bolt', 'orlen', 'bp ', 'shell', 'mpk', 'paliwo', 'pkp', 'ryanair', 'wizzair', 'stacja'], category: 'Transport' },
  { keywords: ['czynsz', 'wspólnota', 'wspolnota', 'tauron', 'pge', 'pgnig', 'energa', 'wodociąg', 'wodociag'], category: 'Mieszkanie' },
  { keywords: ['netflix', 'spotify', 'cinema', 'multikino', 'steam', 'playstation', 'hbo', 'disney'], category: 'Rozrywka' },
  { keywords: ['apteka', 'przychodnia', 'lekarz', 'dentysta', 'medicover', 'luxmed'], category: 'Zdrowie' },
  { keywords: ['orange', 'play', 'plus ', 't-mobile', 'tmobile', 'internet', 'netia', 'vectra'], category: 'Rachunki' },
  { keywords: ['zalando', 'amazon', 'allegro', 'media expert', 'rtv euro'], category: 'Zakupy' },
]

const incomeKeywordToCategory: { keywords: string[]; category: string }[] = [
  { keywords: ['wynagrodzenie', 'wypłata', 'wyplata', 'pensja', 'payroll'], category: 'Wynagrodzenie' },
]

export function guessCategoryName(description: string, isIncome: boolean): string {
  const text = description.toLowerCase()
  const table = isIncome ? incomeKeywordToCategory : keywordToCategory
  for (const { keywords, category } of table) {
    if (keywords.some((k) => text.includes(k))) return category
  }
  return isIncome ? 'Inne przychody' : 'Inne'
}
