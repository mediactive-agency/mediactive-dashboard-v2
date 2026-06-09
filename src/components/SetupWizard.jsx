import { useState } from 'react'
import { EMPTY_CONFIG, parseSheetId, importConfigFile } from '../config'
import { PROXY_SCRIPT, testProxy, fetchTabs } from '../proxy'
import { LOGO_SVG } from '../utils/data'
import PairQR from './PairQR'

const GRADIENT = 'linear-gradient(90deg, #B16CEA, #FF5E69, #FFA84B)'

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 9,
        color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
      }}
    />
  )
}

function Btn({ children, onClick, primary, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '8px 14px' : '11px 22px',
      background: disabled ? 'var(--border2)' : primary ? 'var(--text)' : 'transparent',
      color: disabled ? 'var(--text3)' : primary ? 'var(--bg)' : 'var(--text2)',
      border: primary ? 'none' : '1px solid var(--border2)',
      borderRadius: 9, cursor: disabled ? 'default' : 'pointer',
      fontWeight: 700, fontSize: small ? 12 : 13, fontFamily: 'inherit',
    }}>{children}</button>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const ok = status.type === 'ok'
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: ok ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}>
      {ok
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      {status.msg}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>
}

const STEPS = ['Welcome', 'Connect Google', 'Outreach Sheet', 'Sales Sheet', 'Calendly', 'Done']

export default function SetupWizard({ onComplete, isMobile }) {
  const [step, setStep] = useState(0)
  const [cfg, setCfg] = useState({ ...EMPTY_CONFIG })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [outreachInput, setOutreachInput] = useState('')
  const [salesInput, setSalesInput] = useState('')
  const [outreachTabsAvail, setOutreachTabsAvail] = useState(null)
  const [salesTabsAvail, setSalesTabsAvail] = useState(null)

  const set = patch => setCfg(c => ({ ...c, ...patch }))
  const next = () => { setStatus(null); setStep(s => s + 1) }
  const back = () => { setStatus(null); setStep(s => s - 1) }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(PROXY_SCRIPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  async function doTestProxy() {
    setBusy(true); setStatus(null)
    try {
      await testProxy(cfg.proxyUrl.trim())
      set({ proxyUrl: cfg.proxyUrl.trim() })
      setStatus({ type: 'ok', msg: 'Connected! Your proxy is working.' })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  async function loadOutreachTabs() {
    const id = parseSheetId(outreachInput)
    if (!id) { setStatus({ type: 'err', msg: 'Paste a valid Google Sheets URL or ID' }); return }
    setBusy(true); setStatus(null)
    try {
      const tabs = await fetchTabs(cfg.proxyUrl, id)
      set({ outreachSheetId: id, outreachTabs: tabs })
      setOutreachTabsAvail(tabs)
      setStatus({ type: 'ok', msg: `Found ${tabs.length} tabs. Untick any that are not outreach data.` })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  async function loadSalesTabs() {
    const id = parseSheetId(salesInput)
    if (!id) { setStatus({ type: 'err', msg: 'Paste a valid Google Sheets URL or ID' }); return }
    setBusy(true); setStatus(null)
    try {
      const tabs = await fetchTabs(cfg.proxyUrl, id)
      set({ salesSheetId: id, salesTab: tabs[0] || '' })
      setSalesTabsAvail(tabs)
      setStatus({ type: 'ok', msg: 'Sheet connected. Pick the tab with your call log.' })
    } catch (e) {
      setStatus({ type: 'err', msg: e.message })
    } finally { setBusy(false) }
  }

  function toggleTab(tab) {
    set({ outreachTabs: cfg.outreachTabs.includes(tab) ? cfg.outreachTabs.filter(t => t !== tab) : [...cfg.outreachTabs, tab] })
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importConfigFile(file)
      onComplete(imported)
    } catch (err) {
      setStatus({ type: 'err', msg: err.message })
    }
  }

  const canNext = {
    0: true,
    1: status?.type === 'ok',
    2: !!cfg.outreachSheetId && cfg.outreachTabs.length > 0,
    3: !!cfg.salesSheetId && !!cfg.salesTab,
    4: true,
    5: true,
  }[step]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: isMobile ? 16 : 32 }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ height: 3, background: GRADIENT, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.3s ease' }} />

        <div style={{ padding: isMobile ? '28px 22px' : '36px 40px' }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, background: i <= step ? 'var(--text)' : 'var(--border2)', transition: 'all 0.25s' }} />
            ))}
          </div>

          {step === 0 && (
            <>
              <div style={{ marginBottom: 18 }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 10px' }}>Welcome to your sales dashboard</h1>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 26px' }}>
                In a few steps you will connect your own Google Sheets and optionally Calendly. Your data never touches our servers, everything runs between your browser and your Google account.
              </p>
              <Label>What is your first name?</Label>
              <Input value={cfg.userName} onChange={v => set({ userName: v })} placeholder="e.g. Alex" />
              <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text3)' }}>
                Already set up on another device?{' '}
                <label style={{ color: 'var(--text)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                  Import config file
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Connect your Google account</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 18px' }}>
                The dashboard reads your sheets through a tiny script running in your own Google account. Your sheets stay private, nothing is shared with anyone.
              </p>
              <ol style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text2)', margin: '0 0 16px', paddingLeft: 18 }}>
                <li>Open <a href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>script.google.com</a> and create a new project</li>
                <li>Delete the sample code and paste the script below</li>
                <li>Click <b style={{ color: 'var(--text)' }}>Deploy → New deployment → Web app</b></li>
                <li>Set <b style={{ color: 'var(--text)' }}>Execute as: Me</b> and <b style={{ color: 'var(--text)' }}>Who has access: Anyone</b></li>
                <li>Authorize, then copy the Web app URL and paste it here</li>
              </ol>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text2)', maxHeight: 130, overflow: 'auto', margin: 0 }}>{PROXY_SCRIPT}</pre>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <Btn small onClick={copyScript}>{copied ? 'Copied!' : 'Copy script'}</Btn>
                </div>
              </div>
              <Label>Web app URL</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={cfg.proxyUrl} onChange={v => set({ proxyUrl: v })} placeholder="https://script.google.com/macros/s/.../exec" />
                <Btn small onClick={doTestProxy} disabled={busy || !cfg.proxyUrl.trim()}>{busy ? 'Testing...' : 'Test'}</Btn>
              </div>
              <div style={{ marginTop: 10 }}><StatusMsg status={status} /></div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Outreach sheet</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 18px' }}>
                Paste the link to the spreadsheet where you track your outreach. Each monthly tab will become part of the dashboard.
              </p>
              <Label>Spreadsheet URL or ID</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Input value={outreachInput} onChange={setOutreachInput} placeholder="https://docs.google.com/spreadsheets/d/..." />
                <Btn small onClick={loadOutreachTabs} disabled={busy || !outreachInput.trim()}>{busy ? 'Loading...' : 'Load tabs'}</Btn>
              </div>
              {outreachTabsAvail && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {outreachTabsAvail.map(tab => {
                    const on = cfg.outreachTabs.includes(tab)
                    return (
                      <button key={tab} onClick={() => toggleTab(tab)} style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
                        background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
                      }}>{tab}</button>
                    )
                  })}
                </div>
              )}
              <StatusMsg status={status} />
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Sales calls sheet</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 18px' }}>
                Paste the link to the spreadsheet where you log sales calls and outcomes. It can be the same spreadsheet or a different one.
              </p>
              <Label>Spreadsheet URL or ID</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Input value={salesInput} onChange={setSalesInput} placeholder="https://docs.google.com/spreadsheets/d/..." />
                <Btn small onClick={loadSalesTabs} disabled={busy || !salesInput.trim()}>{busy ? 'Loading...' : 'Load tabs'}</Btn>
              </div>
              {salesTabsAvail && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {salesTabsAvail.map(tab => {
                    const on = cfg.salesTab === tab
                    return (
                      <button key={tab} onClick={() => set({ salesTab: tab })} style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', border: '1px solid', borderColor: on ? 'var(--text)' : 'var(--border2)',
                        background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text2)',
                      }}>{tab}</button>
                    )
                  })}
                </div>
              )}
              <StatusMsg status={status} />
            </>
          )}

          {step === 4 && (
            <>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Calendly <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', verticalAlign: 'middle' }}>OPTIONAL</span></h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 18px' }}>
                Connect Calendly to see your upcoming booked calls right on the dashboard. Create a personal access token at{' '}
                <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 700 }}>calendly.com/integrations</a>{' '}
                and paste it below. You can also skip this and add it later in Settings.
              </p>
              <Label>Personal access token</Label>
              <Input type="password" value={cfg.calendlyToken} onChange={v => set({ calendlyToken: v })} placeholder="eyJraWQiOi..." />
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 10 }}>
                The token is stored only in this browser and sent only to your own Google script, never to any third party.
              </p>
            </>
          )}

          {step === 5 && (
            <>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>You are all set</h2>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 22px' }}>
                Want the dashboard on your phone or another computer too? Scan this code and the whole setup transfers over. You can always find it later in Settings.
              </p>
              <PairQR config={cfg} />
            </>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 }}>
            <div>{step > 0 && <Btn onClick={back}>Back</Btn>}</div>
            {step === 4
              ? <Btn primary onClick={() => { set({ calendlyToken: cfg.calendlyToken.trim() }); next() }}>Finish setup</Btn>
              : step === 5
              ? <Btn primary onClick={() => onComplete(cfg)}>Open dashboard</Btn>
              : <Btn primary onClick={next} disabled={!canNext}>Continue</Btn>}
          </div>
        </div>
      </div>
    </div>
  )
}
