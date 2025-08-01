// steem_payout.js
// Automatisierte tägliche Auszahlung basierend auf SteemWorld-Delegationen

require('dotenv').config()
const steem = require('steem')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

// === EINSTELLUNGEN ===
const ACCOUNT_NAME = 'suntr'
const BLACKLIST_FILE = './ausgeschlossen.txt'
const LOG_DIR = './logs'
const PAYOUT_PER_1000 = 0.38
const MIN_SP_FOR_PAYOUT = 100
const DRY_RUN = false // auf false setzen für echte Auszahlungen
const DELEGATION_API = `https://sds1.steemworld.org/delegations_api/getIncomingDelegations/${ACCOUNT_NAME}/100000/0`
const STEEM_KEY = process.env.STEEM_KEY

const NODES = [
  "https://api.campingclub.cc/",
  "https://api.pennsif.net/",
  "https://api.justyy.com/"
]

// === FUNKTIONEN ===
const log = (text) => {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16)
  const line = `[${timestamp}] ${text}`
  console.log(line)

  const date = timestamp.substring(0, 10)
  const logfile = path.join(LOG_DIR, `log_${date}.txt`)
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR)
  fs.appendFileSync(logfile, line + '\n')
}

const ladeBlacklist = () => {
  try {
    return fs.readFileSync(BLACKLIST_FILE, 'utf8')
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0)
  } catch (e) {
    return []
  }
}

const vestsToSp = async (vests) => {
  const props = await steem.api.getDynamicGlobalPropertiesAsync()
  const totalVestingFund = parseFloat(props.total_vesting_fund_steem.split(' ')[0])
  const totalVestingShares = parseFloat(props.total_vesting_shares.split(' ')[0])
  return (vests / totalVestingShares) * totalVestingFund
}

const setWorkingNode = async () => {
  for (const node of NODES) {
    try {
      steem.api.setOptions({ url: node })
      await steem.api.getDynamicGlobalPropertiesAsync()
      log(`✅ Node aktiv: ${node}`)
      return
    } catch (e) {
      log(`❌ Node nicht erreichbar: ${node}`)
    }
  }
  throw new Error("❌ Kein verfügbarer Steem-Node gefunden.")
}

// === START ===
const run = async () => {
  log('🚀 Starte tägliche Auszahlung')
  await setWorkingNode()

  if (!STEEM_KEY) return log('⛔ Kein STEEM_KEY gefunden – Abbruch.')

  const blacklist = ladeBlacklist()
  const res = await fetch(DELEGATION_API)
  const data = await res.json()
  const rows = data.result.rows

  let total = 0

  for (const row of rows) {
    const delegator = row[1].toLowerCase()
    const vesting = parseFloat(row[3])
    const sp = await vestsToSp(vesting)
    const payout = Math.round((sp / 1000) * PAYOUT_PER_1000 * 1000) / 1000

    if (blacklist.includes(delegator)) {
      log(`⛔ @${delegator} ist auf der Blacklist – übersprungen.`)
      continue
    }

    if (sp >= MIN_SP_FOR_PAYOUT) {
      const memo = `Daily payout for ${sp.toFixed(1)} SP`
      if (DRY_RUN) {
        log(`[TEST] → Würde ${payout} STEEM an @${delegator} senden. Memo: '${memo}'`)
        total += payout
      } else {
        try {
          await steem.broadcast.transferAsync(STEEM_KEY, ACCOUNT_NAME, delegator, `${payout.toFixed(3)} STEEM`, memo)
          log(`✅ Auszahlung an @${delegator}: ${payout} STEEM`)
          total += payout
        } catch (err) {
          log(`❌ Fehler bei @${delegator}: ${err.message}`)
        }
      }
    } else {
      log(`⏭️ @${delegator} übersprungen – nur ${sp.toFixed(2)} SP delegiert (< ${MIN_SP_FOR_PAYOUT} SP)`)
    }
  }

  log(`📦 Gesamtauszahlung heute: ${total.toFixed(3)} STEEM (DryRun: ${DRY_RUN})`)
}

run()
