// Google Sheet template IDs for one click "Make a copy" links.
// The /copy URL only works for native Google Sheets shared as
// "Anyone with the link can view". Leave empty to hide the copy button
// and offer only the xlsx download.
export const OUTREACH_TEMPLATE_SHEET_ID = ''
export const SALES_TEMPLATE_SHEET_ID = ''

export const TEMPLATES_BASE = import.meta.env.BASE_URL + 'templates/'

export const OUTREACH_TEMPLATE_XLSX = TEMPLATES_BASE + 'outreach-template.xlsx'
export const SALES_TEMPLATE_XLSX = TEMPLATES_BASE + 'sales-calls-template.xlsx'
export const SKILL_FILE = TEMPLATES_BASE + 'log-sales-call-SKILL.md'

export function copyLink(sheetId) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/copy`
}
