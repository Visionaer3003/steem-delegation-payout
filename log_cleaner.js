// log_cleaner.js
// Entfernt Logdateien im Ordner ./logs, die älter als 30 Tage sind

const fs = require('fs')
const path = require('path')

const LOG_DIR = './logs'
const TAGE_ALT = 30

const jetzt = new Date()

if (!fs.existsSync(LOG_DIR)) {
  console.log(`📁 Kein Logverzeichnis gefunden: ${LOG_DIR}`)
  process.exit(0)
}

const dateien = fs.readdirSync(LOG_DIR)
let gelöscht = 0

for (const datei of dateien) {
  const dateipfad = path.join(LOG_DIR, datei)
  const stat = fs.statSync(dateipfad)

  const diffTage = (jetzt - stat.mtime) / (1000 * 60 * 60 * 24)
  if (diffTage > TAGE_ALT) {
    fs.unlinkSync(dateipfad)
    gelöscht++
    console.log(`🗑️ Gelöscht: ${datei} (${Math.floor(diffTage)} Tage alt)`)
  }
}

console.log(`✅ Bereinigt: ${gelöscht} Datei(en) gelöscht.`)
