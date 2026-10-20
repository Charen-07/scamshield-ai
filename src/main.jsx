import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const samples = [
  {
    id: 'credential',
    label: 'Account verification',
    eyebrow: 'Polished credential request',
    sender: 'security@northstar-workspace.com',
    subject: 'Action required: verify your workspace access',
    body: `Hello Maya,\n\nWe noticed a sign-in attempt from a new location. To keep your workspace active, please confirm your account within the next 24 hours.\n\nUse the secure verification portal below to review the activity and confirm your password:\nhttps://northstar-workspace-security.com/verify\n\nIf you do not complete this step, access may be temporarily suspended.\n\nNorthstar Workspace Security`,
  },
  {
    id: 'invoice',
    label: 'Invoice change',
    eyebrow: 'Payment redirection',
    sender: 'billing@aurelia-supplies.co',
    subject: 'Updated remittance details for invoice 4817',
    body: `Hi Finance team,\n\nOur banking partner has updated the account used for invoice 4817. Please use the attached remittance instructions for the payment scheduled this week.\n\nTo avoid a late processing fee, please confirm once the transfer has been initiated. This request is confidential while our accounts team completes the transition.\n\nThank you,\nJordan\nAccounts Payable`,
  },
  {
    id: 'executive',
    label: 'Executive request',
    eyebrow: 'Friendly conversational scam',
    sender: 'maria.chen@northstar-workspace.co',
    subject: 'Quick favor before your next meeting',
    body: `Hey Sam — hope your morning is going well.\n\nI am about to join a client meeting and need a quick favor. Could you purchase four $100 gift cards for a partner thank-you and send me the codes here? I will reimburse you this afternoon.\n\nPlease keep this between us until the meeting is over. I am counting on you.\n\nMaria`,
  },
];

const defaultEmail = {
  sender: '',
  subject: '',
  body: '',
};

const demoAnalysis = {
  verdict: 'High-risk',
  riskLevel: 'high',
  summary: 'This message uses several pressure tactics to move you toward a sensitive action before you can verify the request.',
  requestedAction: 'Confirm account credentials',
  target: 'Login password and account access',
  recommendation: {
    title: 'Do not enter your credentials',
    body: 'Open the official website manually or contact support through a known channel instead of using the message link.',
  },
  tactics: [
    { key: 'urgency', label: 'Urgency pressure', value: 'High', score: 92, color: 'coral', evidence: '“within the next 24 hours”' },
    { key: 'authority', label: 'Authority claim', value: 'Medium', score: 64, color: 'amber', evidence: '“Workspace Security”' },
    { key: 'credential', label: 'Credential request', value: 'High', score: 98, color: 'coral', evidence: '“confirm your password”' },
    { key: 'payment', label: 'Payment request', value: 'None', score: 0, color: 'slate', evidence: 'No payment request detected' },
    { key: 'bypass', label: 'Process bypass', value: 'Medium', score: 57, color: 'amber', evidence: 'Directs you to an external verification portal' },
  ],
  evidence: [
    { label: 'Urgency', text: '“within the next 24 hours”', detail: 'A deadline compresses the time available to verify the sender or request.' },
    { label: 'Credential request', text: '“confirm your password”', detail: 'Legitimate support teams should not ask for your password by email.' },
    { label: 'External action', text: '“secure verification portal”', detail: 'The email pushes you to a link instead of a known support channel.' },
  ],
  baseline: {
    verdict: 'Likely safe',
    score: 31,
    note: 'The classic text baseline did not surface enough familiar spam signals in this polished message.',
  },
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    shield: <><path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    scan: <><path d="M4 7V5a1 1 0 0 1 1-1h2" /><path d="M17 4h2a1 1 0 0 1 1 1v2" /><path d="M20 17v2a1 1 0 0 1-1 1h-2" /><path d="M7 20H5a1 1 0 0 1-1-1v-2" /><path d="M7 12h10" /><path d="M9 8h6" /><path d="M9 16h6" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /><path d="M17 7h-3" /><path d="M17 7v3" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16" /><path d="M8 7h8" /><path d="M8 11h7" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    spark: <><path d="m12 3-1.2 5.2L6 10l4.8 1.8L12 17l1.2-5.2L18 10l-4.8-1.8L12 3Z" /><path d="m19 15-.6 2.4L16 18l2.4.6L19 21l.6-2.4L22 18l-2.4-.6L19 15Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
    external: <><path d="M14 5h5v5" /><path d="m19 5-8 8" /><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function App() {
  const [activeView, setActiveView] = useState('analyze');
  const [email, setEmail] = useState(defaultEmail);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');
  const backendConfigured = Boolean(import.meta.env.VITE_API_BASE_URL);

  const canAnalyze = email.body.trim().length > 20;
  const wordCount = useMemo(() => email.body.trim() ? email.body.trim().split(/\s+/).length : 0, [email.body]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }

  function loadSample(sample) {
    setEmail({ sender: sample.sender, subject: sample.subject, body: sample.body });
    setResult(null);
    notify(`${sample.label} loaded`);
    setMobileMenu(false);
  }

  function clearEmail() {
    setEmail(defaultEmail);
    setResult(null);
  }

  async function analyzeEmail() {
    if (!canAnalyze || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (baseUrl) {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_text: email.body, sender: email.sender, subject: email.subject }),
        });
        if (!response.ok) throw new Error('Analysis request failed');
        setResult(await response.json());
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
        setResult({ ...demoAnalysis, demo: true });
      }
    } catch (error) {
      notify('Could not reach the analysis service. Showing a demo result instead.');
      setResult({ ...demoAnalysis, demo: true });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleNav(view) {
    setActiveView(view);
    setMobileMenu(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="shield" size={20} /></div>
          <div><strong>ScamShield AI</strong><span>tactic-aware safety</span></div>
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${activeView === 'analyze' ? 'active' : ''}`} onClick={() => handleNav('analyze')}><Icon name="scan" /><span>Analyze email</span><span className="nav-kbd">01</span></button>
          <button className={`nav-item ${activeView === 'research' ? 'active' : ''}`} onClick={() => handleNav('research')}><Icon name="chart" /><span>Research view</span><span className="nav-kbd">02</span></button>
          <button className={`nav-item ${activeView === 'how' ? 'active' : ''}`} onClick={() => handleNav('how')}><Icon name="book" /><span>How it works</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <div className="privacy-icon"><Icon name="lock" size={16} /></div>
            <div><strong>Privacy-first demo</strong><p>Messages are not stored by this interface.</p></div>
          </div>
          <div className="sidebar-meta"><span className="status-dot" /> {backendConfigured ? 'Backend mode' : 'Local demo mode'} <span>v0.1</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{activeView === 'analyze' ? 'Analyze email' : activeView === 'research' ? 'Research view' : 'How it works'}</strong></div>
          <div className="topbar-actions"><span className="model-pill"><span className="pulse-dot" /> Tactic engine ready</span><button className="avatar" aria-label="Profile">SA</button></div>
        </header>

        {activeView === 'analyze' && (
          <AnalyzeView email={email} setEmail={setEmail} result={result} canAnalyze={canAnalyze} isAnalyzing={isAnalyzing} wordCount={wordCount} onAnalyze={analyzeEmail} onClear={clearEmail} onSample={loadSample} notify={notify} />
        )}
        {activeView === 'research' && <ResearchView />}
        {activeView === 'how' && <HowView onStart={() => handleNav('analyze')} />}
      </main>

      {toast && <div className="toast" role="status"><span className="toast-icon"><Icon name="check" size={15} /></span>{toast}</div>}
    </div>
  );
}

function AnalyzeView({ email, setEmail, result, canAnalyze, isAnalyzing, wordCount, onAnalyze, onClear, onSample, notify }) {
  return (
    <div className="page-wrap">
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> EMAIL SAFETY ANALYSIS</div>
          <h1>See the pressure<br /><em>behind the message.</em></h1>
          <p className="intro-copy">ScamShield AI looks past polished writing to surface observable social-engineering tactics and risky requested actions.</p>
        </div>
        <div className="intro-stats">
          <div className="mini-stat"><span>01</span><strong>Paste</strong><small>the message</small></div>
          <div className="mini-stat"><span>02</span><strong>Scan</strong><small>the tactics</small></div>
          <div className="mini-stat"><span>03</span><strong>Decide</strong><small>with evidence</small></div>
        </div>
      </section>

      <div className="workspace-grid">
        <EmailComposer email={email} setEmail={setEmail} wordCount={wordCount} canAnalyze={canAnalyze} isAnalyzing={isAnalyzing} onAnalyze={onAnalyze} onClear={onClear} onSample={onSample} />
        <ResultsPanel result={result} notify={notify} />
      </div>

      {!result && <SampleStrip onSample={onSample} />}
      <div className="bottom-note"><Icon name="info" size={15} /><span>Use synthetic or public emails for this demo. Never paste sensitive personal information.</span><span className="note-link">Learn about the method <Icon name="arrow" size={14} /></span></div>
    </div>
  );
}

function EmailComposer({ email, setEmail, wordCount, canAnalyze, isAnalyzing, onAnalyze, onClear, onSample }) {
  const update = (field) => (event) => setEmail((current) => ({ ...current, [field]: event.target.value }));
  return (
    <section className="card composer-card">
      <div className="card-header composer-header"><div><span className="section-number">01</span><div><h2>Inspect a message</h2><p>Paste the email you want to understand.</p></div></div><button className="text-button" onClick={onClear}>Clear</button></div>
      <div className="composer-fields">
        <label className="field-label" htmlFor="sender">From <span>optional</span></label>
        <input id="sender" className="text-input" value={email.sender} onChange={update('sender')} placeholder="sender@company.com" />
        <label className="field-label" htmlFor="subject">Subject <span>optional</span></label>
        <input id="subject" className="text-input" value={email.subject} onChange={update('subject')} placeholder="What the message says" />
        <div className="body-label-row"><label className="field-label" htmlFor="email-body">Message body <span className="required-label">required</span></label><button className="upload-button" type="button" onClick={() => document.getElementById('email-file-input')?.click()}><Icon name="upload" size={14} /> Upload .txt</button><input id="email-file-input" className="visually-hidden" type="file" accept=".txt,.eml,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) file.text().then((body) => setEmail((current) => ({ ...current, body }))); }} /></div>
        <textarea id="email-body" className="email-textarea" value={email.body} onChange={update('body')} placeholder="Paste the full email here…" spellCheck="false" />
        <div className="composer-footer"><span className="word-count">{wordCount} words <span className="footer-dot">•</span> <span className="muted">Nothing is stored</span></span><button className="primary-button" disabled={!canAnalyze || isAnalyzing} onClick={onAnalyze}>{isAnalyzing ? <><span className="button-spinner" />Analyzing tactics</> : <>Analyze message <Icon name="arrow" size={16} /></>}</button></div>
      </div>
      <div className="composer-divider"><span>or try a prepared example</span></div>
      <div className="sample-buttons">{samples.map((sample) => <button key={sample.id} className="sample-button" onClick={() => onSample(sample)}><span className="sample-dot" />{sample.label}<Icon name="arrow" size={14} /></button>)}</div>
    </section>
  );
}

function ResultsPanel({ result, notify }) {
  if (!result) return <section className="card result-empty"><div className="empty-orbit"><Icon name="spark" size={26} /></div><span className="section-number">02</span><h2>Your evidence brief<br /><em>will appear here.</em></h2><p>Run an analysis to see the risk level, tactics, exact evidence, and a safer next step.</p><div className="empty-list"><span><Icon name="check" size={14} /> Tactic-by-tactic breakdown</span><span><Icon name="check" size={14} /> Requested action and target</span><span><Icon name="check" size={14} /> Baseline comparison</span></div></section>;

  const level = (result.riskLevel || result.verdict || 'needs').toLowerCase().replace(/\s/g, '-');
  const tactics = Array.isArray(result.tactics) ? result.tactics : normalizeTactics(result.tactics);
  const evidence = result.evidence || [];
  const baseline = result.baseline || {};
  return <section className="card result-card">
    <div className="card-header result-header"><div><span className="section-number">02</span><div><h2>Evidence brief</h2><p>Structured signals behind the verdict.</p></div></div><button className="icon-button" aria-label="Copy result" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(result, null, 2)); notify('Analysis copied to clipboard'); }}><Icon name="copy" size={16} /></button></div>
    {result.demo && <div className="demo-banner"><Icon name="info" size={14} /> Preview result — connect your backend to run live analysis.</div>}
    {!result.demo && result.analysisSource === 'rules' && <div className="demo-banner"><Icon name="info" size={14} /> Local fallback result — Gemini was unavailable, so the offline rules were used.</div>}
    <div className={`verdict-card ${level}`}><div className="verdict-icon"><Icon name={level === 'high' || level === 'high-risk' ? 'shield' : 'scan'} size={20} /></div><div><span className="result-label">OVERALL VERDICT</span><div className="verdict-title">{result.verdict || 'Needs verification'}</div><p>{result.summary || 'This message contains signals that deserve a closer look before you act.'}</p></div><span className="risk-chip">{result.riskLevel || 'review'}</span></div>
    <div className="subsection-title"><span>Risk decomposition</span><span className="subsection-caption">observable signals</span></div>
    <div className="tactic-list">{tactics.map((tactic) => <div className="tactic-row" key={tactic.key || tactic.label}><div className="tactic-name"><span className={`tactic-indicator ${tactic.color || tacticSeverityColor(tactic.value)}`} />{tactic.label}</div><div className="tactic-bar"><span className={tactic.color || tacticSeverityColor(tactic.value)} style={{ width: `${Math.min(100, tactic.score || 0)}%` }} /></div><span className={`tactic-value ${tactic.color || tacticSeverityColor(tactic.value)}`}>{tactic.value}</span></div>)}</div>
    <div className="action-grid"><div className="action-box"><span className="box-label">REQUESTED ACTION</span><strong>{result.requestedAction || 'Not detected'}</strong><small>Target: {result.target || 'Not identified'}</small></div><div className="action-box recommendation-box"><span className="box-label"><Icon name="shield" size={13} /> SAFER NEXT STEP</span><strong>{result.recommendation?.title || 'Verify through a known channel'}</strong><small>{result.recommendation?.body || 'Do not act until the request is independently verified.'}</small></div></div>
    {evidence.length > 0 && <><div className="subsection-title evidence-title"><span>Why it was flagged</span><span className="subsection-caption">evidence spans</span></div><div className="evidence-list">{evidence.map((item, index) => <div className="evidence-item" key={`${item.label}-${index}`}><span className="evidence-index">0{index + 1}</span><div><strong>{item.label}</strong><p><mark>{item.text}</mark> <span>{item.detail}</span></p></div></div>)}</div></>}
    <div className="baseline-compare"><div><span className="box-label">CLASSIC BASELINE</span><strong>{baseline.verdict || 'Not connected'}</strong><small>{baseline.note || 'Connect your evaluation endpoint to compare outputs.'}</small></div><div className="baseline-meter"><span style={{ width: `${baseline.score || 0}%` }} /><small>{baseline.score != null ? `${baseline.score}% signal score` : 'awaiting data'}</small></div></div>
  </section>;
}

function SampleStrip({ onSample }) {
  return <section className="sample-strip"><div><span className="eyebrow-line" /><span className="sample-strip-title">START WITH A SCENARIO</span><p>See how the detector responds to common polished scam patterns.</p></div><div className="scenario-pills">{samples.map((sample) => <button key={sample.id} onClick={() => onSample(sample)}>{sample.eyebrow}<Icon name="arrow" size={14} /></button>)}</div></section>;
}

function ResearchView() {
  return <div className="page-wrap secondary-page"><section className="page-intro compact-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> EVALUATION WORKSPACE</div><h1>Measure what<br /><em>the model catches.</em></h1><p className="intro-copy">This view is ready for your campaign-separated evaluation results. It intentionally shows no invented numbers.</p></div><div className="research-badge"><Icon name="chart" size={18} /><span>Awaiting<br /><strong>/api/evaluation</strong></span></div></section><section className="evaluation-placeholder card"><div className="placeholder-icon"><Icon name="chart" size={22} /></div><h2>Connect your evaluation endpoint</h2><p>Once the backend returns real metrics, this space can show baseline versus tactic-aware recall, per-variant results, the 1% false-positive-rate view, and the phrase-removal faithfulness test.</p><div className="metric-placeholder-grid"><div><span>SCAM RECALL</span><strong>—</strong><small>baseline vs. tactic-aware</small></div><div><span>VARIANT RECALL</span><strong>—</strong><small>five selected variants</small></div><div><span>FAITHFULNESS</span><strong>—</strong><small>flagged vs. random masking</small></div></div></section></div>;
}

function HowView({ onStart }) {
  return <div className="page-wrap secondary-page"><section className="page-intro compact-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> THE METHOD</div><h1>Look beneath<br /><em>the polish.</em></h1><p className="intro-copy">ScamShield AI explains a verdict using observable tactics and risky requested actions—not guesses about who wrote the message.</p></div><button className="primary-button intro-button" onClick={onStart}>Try an analysis <Icon name="arrow" size={16} /></button></section><section className="method-grid"><MethodCard number="01" icon="scan" title="Extract signals" text="The message is checked for pressure, authority claims, credential requests, payment requests, and process bypasses." /><MethodCard number="02" icon="spark" title="Build the brief" text="A deterministic risk engine turns those structured signals into a verdict, decomposition, and fixed safety recommendation." /><MethodCard number="03" icon="chart" title="Test the claim" text="The research view compares a classic baseline against polished scam variants and measures whether flagged evidence matters." /></section><section className="method-note"><Icon name="lock" size={16} /><div><strong>Designed for evidence, not authorship guesses.</strong><p>The system never treats “human” or “AI” writing style as the verdict.</p></div></section></div>;
}

function MethodCard({ number, icon, title, text }) {
  return <article className="method-card card"><div className="method-card-top"><span>{number}</span><div className="method-icon"><Icon name={icon} size={18} /></div></div><h2>{title}</h2><p>{text}</p><Icon name="arrow" size={16} /></article>;
}

function normalizeTactics(tactics) {
  if (!tactics || typeof tactics !== 'object') return [];
  const labels = { urgency: 'Urgency pressure', authority_impersonation: 'Authority claim', credential_request: 'Credential request', payment_request: 'Payment request', process_bypass: 'Process bypass' };
  return Object.entries(tactics).map(([key, value]) => ({ key, label: labels[key] || key.replace(/_/g, ' '), value: value?.present ? value.severity || 'Detected' : 'None', score: value?.present ? (value.severity === 'high' ? 90 : 58) : 0, evidence: value?.evidence?.[0] || '' }));
}

function tacticSeverityColor(value = '') {
  const normalized = value.toLowerCase();
  if (normalized === 'high') return 'coral';
  if (normalized === 'medium') return 'amber';
  return 'slate';
}

createRoot(document.getElementById('root')).render(<App />);
