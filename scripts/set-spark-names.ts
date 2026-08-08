import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'

// Este script sólo corre contra producción (haze), nunca contra la
// DATABASE_URL local por defecto. Ver memoria dos-bases-neon-y-deploy-playbook.
const connectionString = process.env.HAZE_DATABASE_URL
if (!connectionString) {
  console.error('Falta HAZE_DATABASE_URL en el entorno. Abortando.')
  process.exit(1)
}

const csvPathArg = process.argv[2]
const apply = process.argv.includes('--apply')

if (!csvPathArg) {
  console.error('Uso: npx tsx scripts/set-spark-names.ts <ruta-al-csv> [--apply]')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function normalizeName(s: string) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFC')
}

// Para sugerencias: ignora acentos además de mayúsculas/espacios.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')
function foldName(s: string) {
  return normalizeName(s).normalize('NFD').replace(COMBINING_MARKS, '')
}

// Parser CSV mínimo (RFC4180: soporta campos entre comillas con comas/saltos de línea).
function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r') {
      // skip
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

type Entry = { fullName: string; sparkName: string }

const FULLNAME_HEADERS = ['nombre completo', 'fullname', 'nombre y apellido']
const FIRSTNAME_HEADERS = ['nombre', 'firstname']
const LASTNAME_HEADERS = ['apellido', 'lastname']
const SPARK_HEADERS = ['chispa', 'sparkname', 'nombre de chispa']

function loadEntries(csvPath: string): Entry[] {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCsv(content)
  const header = rows[0].map((h) => normalizeName(h))

  const idxFullName = header.findIndex((h) => FULLNAME_HEADERS.includes(h))
  const idxFirst = header.findIndex((h) => FIRSTNAME_HEADERS.includes(h))
  const idxLast = header.findIndex((h) => LASTNAME_HEADERS.includes(h))
  const idxSpark = header.findIndex((h) => SPARK_HEADERS.includes(h))

  if (idxSpark === -1) {
    throw new Error(`No encontré columna de Chispa en el header: ${rows[0].join(' | ')}`)
  }
  if (idxFullName === -1 && (idxFirst === -1 || idxLast === -1)) {
    throw new Error(
      `No encontré columna de nombre completo, ni nombre+apellido por separado, en el header: ${rows[0].join(' | ')}`
    )
  }

  return rows
    .slice(1)
    .map((r) => {
      const fullName = idxFullName !== -1 ? r[idxFullName] : `${r[idxFirst]} ${r[idxLast]}`
      return { fullName: (fullName || '').trim(), sparkName: (r[idxSpark] || '').trim() }
    })
    .filter((e) => e.fullName && e.sparkName)
}

async function main() {
  const host = new URL(connectionString!).hostname
  console.log(`Conectando a: ${host}`)
  console.log(`Modo: ${apply ? 'APPLY (va a escribir en la base)' : 'DRY-RUN (sólo reporte, no escribe nada)'}`)

  const entries = loadEntries(path.resolve(csvPathArg))
  console.log(`Filas leídas del CSV: ${entries.length}`)

  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, sparkName: true },
  })

  // Match "insensible a acentos": evita falsos negativos por NFC/NFD o tildes
  // tipeadas distinto entre la planilla y lo que el usuario cargó en el sitio.
  const byFoldedName = new Map<string, typeof users>()
  const byFoldedLastName = new Map<string, typeof users>()
  for (const u of users) {
    const key = foldName(`${u.firstName} ${u.lastName}`)
    const list = byFoldedName.get(key) || []
    list.push(u)
    byFoldedName.set(key, list)

    const lastKey = foldName(u.lastName)
    const lastList = byFoldedLastName.get(lastKey) || []
    lastList.push(u)
    byFoldedLastName.set(lastKey, lastList)
  }

  const toUpdate: { id: string; email: string; fullName: string; sparkName: string }[] = []
  const alreadySet: string[] = []
  const notFound: { fullName: string; suggestions: typeof users }[] = []
  const ambiguous: string[] = []

  for (const entry of entries) {
    const key = foldName(entry.fullName)
    const matches = byFoldedName.get(key) || []
    if (matches.length === 0) {
      const words = entry.fullName.trim().split(/\s+/)
      const lastWord = foldName(words[words.length - 1])
      const suggestions = (byFoldedLastName.get(lastWord) || []).slice(0, 3)
      notFound.push({ fullName: entry.fullName, suggestions })
    } else if (matches.length > 1) {
      ambiguous.push(`${entry.fullName} (${matches.length} usuarios: ${matches.map((m) => m.email).join(', ')})`)
    } else {
      const u = matches[0]
      if (u.sparkName && u.sparkName.trim() !== '') {
        alreadySet.push(`${entry.fullName} (ya tenía: "${u.sparkName}")`)
      } else {
        toUpdate.push({ id: u.id, email: u.email, fullName: entry.fullName, sparkName: entry.sparkName })
      }
    }
  }

  console.log(`\n=== A ACTUALIZAR (${toUpdate.length}) ===`)
  toUpdate.forEach((u) => console.log(`  ${u.fullName} <${u.email}> -> sparkName="${u.sparkName}"`))

  console.log(`\n=== YA TENÍAN CHISPA, se omiten (${alreadySet.length}) ===`)
  alreadySet.forEach((s) => console.log(`  ${s}`))

  console.log(`\n=== NO ENCONTRADOS EN LA DB (${notFound.length}) ===`)
  notFound.forEach(({ fullName, suggestions }) => {
    if (suggestions.length > 0) {
      const sugg = suggestions.map((s) => `${s.firstName} ${s.lastName} <${s.email}>`).join('  |  ')
      console.log(`  ${fullName}  --  ¿alguno de estos por apellido parecido?: ${sugg}`)
    } else {
      console.log(`  ${fullName}`)
    }
  })

  console.log(`\n=== AMBIGUOS, se omiten (${ambiguous.length}) ===`)
  ambiguous.forEach((s) => console.log(`  ${s}`))

  if (!apply) {
    console.log('\nDry-run: no se escribió nada. Volvé a correr con --apply para aplicar los cambios de arriba.')
    return
  }

  console.log(`\nAplicando ${toUpdate.length} updates...`)
  for (const u of toUpdate) {
    await prisma.user.update({ where: { id: u.id }, data: { sparkName: u.sparkName } })
    console.log(`  OK: ${u.fullName} <${u.email}>`)
  }
  console.log('Listo.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
