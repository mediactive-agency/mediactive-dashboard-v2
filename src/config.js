const KEY = 'mediactive_dashboard_config_v1'

export const EMPTY_CONFIG = {
  userName: '',
  proxyUrl: '',
  outreachSheetId: '',
  outreachTabs: [],
  salesSheetId: '',
  salesTab: '',
  calendlyToken: '',
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw)
    if (!isComplete(cfg)) return null
    return { ...EMPTY_CONFIG, ...cfg }
  } catch {
    return null
  }
}

export function saveConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function clearConfig() {
  localStorage.removeItem(KEY)
}

export function isComplete(cfg) {
  return !!(cfg && cfg.proxyUrl && cfg.outreachSheetId && cfg.outreachTabs && cfg.outreachTabs.length > 0 && cfg.salesSheetId && cfg.salesTab)
}

// Accepts a full Google Sheets URL or a raw spreadsheet ID
export function parseSheetId(input) {
  if (!input) return ''
  const s = input.trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s
  return ''
}

export function exportConfig(cfg) {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dashboard-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importConfigFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const cfg = JSON.parse(reader.result)
        if (!isComplete(cfg)) return reject(new Error('Config file is missing required fields'))
        resolve({ ...EMPTY_CONFIG, ...cfg })
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}
