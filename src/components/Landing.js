import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/* ── tiny inline-icon helpers ─────────────────────────────────────────────── */
const Path = (d, extra = {}) => (
  <path d={d} stroke={extra.stroke || 'currentColor'} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);
const Circle = (cx, cy, r, sw = 1.5) => (
  <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth={sw} fill="none" />
);
const Rect = (x, y, w, h, rx, sw = 1.6) => (
  <rect x={x} y={y} width={w} height={h} rx={rx} stroke="currentColor" strokeWidth={sw} fill="none" />
);
const Svg = (children, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">{children}</svg>
);

const ICONS = {
  sales: Svg([<React.Fragment key="1">{Path('M2 14l4.5-5 3.5 3.5L16 5')}</React.Fragment>, <React.Fragment key="2">{Path('M12 5h4v4')}</React.Fragment>]),
  purchase: Svg([
    <React.Fragment key="1">{Path('M2 2h2.2l1.9 8.5h7.4l1.5-6H5')}</React.Fragment>,
    <React.Fragment key="2">{Circle(7.5, 14.5, 1.3, 1.4)}</React.Fragment>,
    <React.Fragment key="3">{Circle(13, 14.5, 1.3, 1.4)}</React.Fragment>,
  ]),
  collection: Svg([
    <React.Fragment key="1">{Rect(1.6, 4.5, 14.8, 9.5, 2, 1.6)}</React.Fragment>,
    <React.Fragment key="2">{Circle(9, 9.25, 2.2, 1.5)}</React.Fragment>,
  ]),
  bank: Svg([<React.Fragment key="1">{Path('M9 2l7 4.5H2L9 2z')}</React.Fragment>, <React.Fragment key="2">{Path('M4 8v5M9 8v5M14 8v5M2 15.5h14')}</React.Fragment>]),
  receivable: Svg([<React.Fragment key="1">{Path('M9 2l7 4v6l-7 4-7-4V6l7-4z')}</React.Fragment>, <React.Fragment key="2">{Path('M2 6l7 4 7-4M9 10v6')}</React.Fragment>]),
  stock: Svg([<React.Fragment key="1">{Path('M9 2l6.5 3.5v7L9 16 2.5 12.5v-7L9 2z')}</React.Fragment>, <React.Fragment key="2">{Path('M2.5 5.5L9 9l6.5-3.5M9 9v7')}</React.Fragment>]),
  dispatch: Svg([
    <React.Fragment key="1">{Path('M1.5 4h9v7h-9V4z')}</React.Fragment>,
    <React.Fragment key="2">{Path('M10.5 6.5h3l2.5 3V11h-5.5V6.5z')}</React.Fragment>,
    <React.Fragment key="3">{Circle(4, 13, 1.5, 1.5)}</React.Fragment>,
    <React.Fragment key="4">{Circle(12.5, 13, 1.5, 1.5)}</React.Fragment>,
  ]),
  voice: Svg([<React.Fragment key="1">{Rect(6.5, 2, 5, 9, 2.5, 1.6)}</React.Fragment>, <React.Fragment key="2">{Path('M4 9a5 5 0 0 0 10 0M9 14v2')}</React.Fragment>]),
  globe: Svg([<React.Fragment key="1">{Circle(9, 9, 7, 1.6)}</React.Fragment>, <React.Fragment key="2">{Path('M2 9h14M9 2c2 2.2 3 4.5 3 7s-1 4.8-3 7c-2-2.2-3-4.5-3-7s1-4.8 3-7z')}</React.Fragment>]),
  live: Svg([<React.Fragment key="1">{Path('M2 9h3l2-5 4 10 2-5h3')}</React.Fragment>]),
  pdf: Svg([<React.Fragment key="1">{Path('M9 2v8M5.5 6.5L9 10l3.5-3.5')}</React.Fragment>, <React.Fragment key="2">{Path('M2.5 13.5h13')}</React.Fragment>]),
  shield: Svg([<React.Fragment key="1">{Path('M9 2l6 2.5v4.5c0 3.6-2.4 6-6 7-3.6-1-6-3.4-6-7V4.5L9 2z')}</React.Fragment>, <React.Fragment key="2">{Path('M6.5 9l1.8 1.8L11.5 7.5')}</React.Fragment>]),
  chat: Svg([<React.Fragment key="1">{Path('M2 3.5h14v9H8l-4 3v-3H2v-9z')}</React.Fragment>]),
  spark: Svg([<React.Fragment key="1">{Path('M9 2l1.6 4.4L15 8l-4.4 1.6L9 14l-1.6-4.4L3 8l4.4-1.6L9 2z')}</React.Fragment>]),
  export: Svg([<React.Fragment key="1">{Path('M9 11V2M5.5 5.5L9 2l3.5 3.5')}</React.Fragment>, <React.Fragment key="2">{Path('M3 11v4h12v-4')}</React.Fragment>]),
  clock: Svg([<React.Fragment key="1">{Circle(9, 9, 7, 1.6)}</React.Fragment>, <React.Fragment key="2">{Path('M9 5v4l3 2')}</React.Fragment>]),
  lock: Svg([<React.Fragment key="1">{Rect(3.5, 8, 11, 7, 2, 1.6)}</React.Fragment>, <React.Fragment key="2">{Path('M6 8V6a3 3 0 0 1 6 0v2')}</React.Fragment>]),
};

/* ── data helpers (colors / gradients mirror the ERP brand tokens) ──────────── */
const dotC = (c) => ({ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: c });
const iconWrap = (c) => ({
  width: '46px', height: '46px', borderRadius: '13px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#fff', marginBottom: '16px',
  background: `linear-gradient(135deg,${c},${c}dd)`, boxShadow: `0 8px 20px ${c}44`,
});
const glowStyle = (c) => ({
  position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px',
  borderRadius: '50%', background: `radial-gradient(circle,${c}22,transparent 70%)`, pointerEvents: 'none',
});
const capWrap = (c) => ({
  width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: c, marginBottom: '14px', background: c + '14', border: '1px solid ' + c + '26',
});
const mk = (id, label, color, desc, queries) => ({
  id, label, color, desc, icon: ICONS[id],
  iconWrap: iconWrap(color), glow: glowStyle(color),
  queries: queries.map((q) => ({ label: q, dot: dotC(color) })),
});

const MODULES = [
  mk('sales', 'Sales', '#1565C0', 'Daily, monthly or total sales with party-wise breakdown and invoice tables.', ["Today's sales", 'This month sales', 'Top parties']),
  mk('purchase', 'Purchase', '#E65100', 'Track buying across suppliers by day, month or full history.', ["Today's purchase", 'Month purchase']),
  mk('collection', 'Collection & Payment', '#2E7D32', 'See money in vs money out for any date, instantly reconciled.', ["Today's collection", "Today's payment"]),
  mk('bank', 'Bank Balance', '#6A1B9A', 'Live balances across every bank account in one summary.', ['Bank summary', 'Account-wise balance']),
  mk('receivable', 'Receivable & Payable', '#00695C', 'Know exactly who owes you and whom you owe, with ageing.', ['Total receivable', 'Total payable']),
  mk('stock', 'Stock', '#B45309', 'Item-level stock, valuations and full inventory details on demand.', ['Total stock', 'Full stock details']),
  mk('dispatch', 'Dispatch', '#283593', 'Track goods going out — daily, monthly and cumulative dispatch.', ["Today's dispatch", "Month's dispatch"]),
];

const TRUST_PILLS = [
  { id: 'chat', label: 'Plain-language queries', icon: ICONS.chat },
  { id: 'voice', label: 'Voice input', icon: ICONS.voice },
  { id: 'globe', label: 'English + Hindi', icon: ICONS.globe },
  { id: 'export', label: 'PDF & Excel export', icon: ICONS.export },
  { id: 'live', label: 'Real-time data', icon: ICONS.live },
];

const STEPS = [
  { id: 'chat', n: '1', title: 'Ask in plain language', body: 'Type or speak your question — "what\'s today\'s sales?" — in English or Hindi. No menus, no filters.', icon: ICONS.chat },
  { id: 'spark', n: '2', title: 'Ayaam reads your live data', body: 'The assistant queries your ERP in real time and builds the exact table, summary or chart you need.', icon: ICONS.spark },
  { id: 'export', n: '3', title: 'Act on the answer', body: 'Copy it, translate it, turn it into a chart, or download the full dataset as a PDF in one tap.', icon: ICONS.export },
];

const CAPS = [
  { id: 'voice', title: "Speak, don't type", body: 'Full voice input so owners on the floor can just ask out loud.', icon: ICONS.voice, iconWrap: capWrap('#1565C0') },
  { id: 'globe', title: 'Hindi + English', body: 'Ask and read answers in either language, switch anytime.', icon: ICONS.globe, iconWrap: capWrap('#E65100') },
  { id: 'clock', title: 'Answers in seconds', body: 'Live ERP data means numbers are always current, never stale.', icon: ICONS.clock, iconWrap: capWrap('#2E7D32') },
  { id: 'lock', title: 'Secure by design', body: 'SOC 2, SSL encryption and GDPR-ready access controls.', icon: ICONS.lock, iconWrap: capWrap('#6A1B9A') },
];

const SPECK_COLORS = ['rgba(21,101,192,0.5)', 'rgba(255,107,43,0.5)', 'rgba(33,150,243,0.5)'];
const SPECKS = Array.from({ length: 9 }, (_, i) => {
  const c = SPECK_COLORS[i % 3];
  const sz = 5 + (i % 3) * 3;
  return {
    style: {
      position: 'absolute', bottom: (6 + (i * 7) % 34) + '%', left: (8 + (i * 11) % 84) + '%',
      width: sz + 'px', height: sz + 'px', borderRadius: '50%', background: c,
      filter: 'blur(1px)', zIndex: 3, pointerEvents: 'none',
      animation: `ay-rise ${7 + (i % 4) * 2}s ease-in-out ${(i * 0.7).toFixed(1)}s infinite`,
    },
  };
});

const CHIPS = [
  { label: "Today's sales", dot: dotC('#1565C0') },
  { label: 'Debtors list', dot: dotC('#00695C') },
  { label: 'Bank summary', dot: dotC('#6A1B9A') },
  { label: 'Full stock details', dot: dotC('#B45309') },
];

const EXAMPLES = [
  "What's today's sales?",
  'Show me the debtors list',
  'महीने की कुल बिक्री दिखाओ',
  "Today's collection vs payment",
  'Full stock details as PDF',
  "This month's dispatch summary",
];

function useTypewriter() {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let ei = 0, ci = 0, dir = 1, hold = 0;
    let timer;
    const tick = () => {
      const full = EXAMPLES[ei];
      if (hold > 0) { hold--; timer = setTimeout(tick, 60); return; }
      ci += dir;
      if (ci >= full.length) { ci = full.length; dir = -1; hold = 26; }
      else if (ci <= 0) { ci = 0; dir = 1; ei = (ei + 1) % EXAMPLES.length; hold = 4; }
      setTyped(full.slice(0, ci));
      timer = setTimeout(tick, dir > 0 ? 55 : 28);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);
  return typed;
}

// Mirrors App.js: a session exists only while `ayaam_user` holds the
// JSON user object written on login and cleared on logout / auth-error.
function hasValidSession() {
  try {
    const raw = localStorage.getItem('ayaam_user');
    if (!raw) return false;
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

const HERO_FADE_DURATION = 1.4; // seconds

export default function Landing() {
  const navigate = useNavigate();
  const typed = useTypewriter();

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);

  const goLogin = () => navigate('/login');
  const goAssistant = () => navigate(hasValidSession() ? '/assistant' : '/login');

  return (
    <div className="ay-landing">

      {/* ══════════════ NAV ══════════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 20, padding: '0 clamp(18px,4vw,54px)', height: 66, backdropFilter: 'blur(18px)', background: 'rgba(251,252,254,0.72)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1565C0,#FF6B2B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(21,101,192,0.32)' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>A</span>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: '0.04em', color: '#07111F' }}>AYAAM<span style={{ color: '#1565C0', fontWeight: 600, fontSize: 13, marginLeft: 3 }}>ERP</span></div>
        </div>
        <div className="ay-nav-links">
          <a href="#capabilities" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Capabilities</a>
          <a href="#how" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' }}>How it works</a>
          <a href="#trust" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Security</a>
          <a href="#modules" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Modules</a>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={goLogin} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' }}>Log in</button>
        <button onClick={goAssistant} className="ay-cta-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#07111F', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 17px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(7,17,31,0.22)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', position: 'relative' }}><span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80', animation: 'ay-ping 2.4s ease-out infinite' }} /></span>
          Open Assistant
        </button>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <header style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px clamp(20px,5vw,40px) 90px', overflow: 'hidden', textAlign: 'center' }}>

        {/* floating color mesh (fades in once on load) */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, animation: `ay-heroFade ${HERO_FADE_DURATION}s ease-out both` }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FCFDFF 0%,#F1F5FC 44%,#E7EEFA 100%)', zIndex: 0 }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '2%', width: 820, height: 520, transform: 'translate(-50%,0)', background: 'radial-gradient(ellipse at center,rgba(255,255,255,0.95) 0%,rgba(255,255,255,0) 66%)', animation: 'ay-glow 9s ease-in-out infinite', zIndex: 2, pointerEvents: 'none' }} />

          <div aria-hidden="true" style={{ position: 'absolute', left: '-6%', bottom: '-14%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%,rgba(33,150,243,0.85) 0%,rgba(21,101,192,0.4) 45%,transparent 72%)', filter: 'blur(56px)', animation: 'ay-float1 16s ease-in-out infinite', zIndex: 1, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '32%', bottom: '-24%', width: 640, height: 560, borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%,rgba(255,107,43,0.8) 0%,rgba(230,81,0,0.42) 46%,transparent 72%)', filter: 'blur(60px)', animation: 'ay-float2 19s ease-in-out infinite', zIndex: 1, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', right: '-8%', bottom: '-10%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle at 55% 45%,rgba(96,165,250,0.78) 0%,rgba(33,150,243,0.36) 48%,transparent 72%)', filter: 'blur(58px)', animation: 'ay-float3 22s ease-in-out infinite', zIndex: 1, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', right: '20%', top: '8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,138,80,0.42) 0%,rgba(255,107,43,0.16) 48%,transparent 72%)', filter: 'blur(64px)', animation: 'ay-float4 24s ease-in-out infinite', zIndex: 1, pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '14%', top: '16%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(21,101,192,0.34) 0%,transparent 70%)', filter: 'blur(60px)', animation: 'ay-float4 20s ease-in-out infinite', zIndex: 1, pointerEvents: 'none' }} />

          {/* faint dot grid + rising specks */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(15,23,42,0.05) 1px,transparent 1px)', backgroundSize: '30px 30px', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%,black,transparent)', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%,black,transparent)', zIndex: 2, pointerEvents: 'none' }} />
          {SPECKS.map((sp, i) => <div key={i} aria-hidden="true" style={sp.style} />)}
        </div>

        {/* hero content */}
        <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(21,101,192,0.18)', borderRadius: 99, padding: '6px 14px 6px 8px', marginBottom: 26, boxShadow: '0 4px 18px rgba(21,101,192,0.1)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1565C0', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 99 }}>NEW</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Your ERP now speaks plain language — and Hindi</span>
          </div>

          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(40px,7vw,76px)', lineHeight: 1.03, letterSpacing: '-0.035em', color: '#07111F', marginBottom: 20, textWrap: 'balance' }}>
            Just ask your<br />
            <span style={{ background: 'linear-gradient(115deg,#1565C0 0%,#2196F3 38%,#FF6B2B 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>business anything</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px,2vw,20px)', lineHeight: 1.6, color: '#475569', maxWidth: 560, marginBottom: 38, fontWeight: 450 }}>Ayaam AI reads your live ERP data and answers in seconds — sales, stock, collections, dispatch and more. Type or speak, in English or Hindi.</p>

          {/* prompt box */}
          <div style={{ width: '100%', maxWidth: 680, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 24px 70px rgba(21,101,192,0.16),0 4px 14px rgba(7,17,31,0.06)', padding: '18px 18px 14px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minHeight: 52 }}>
              <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', padding: 2, background: 'conic-gradient(from 0deg,#1565C0,#2196F3,#FF6B2B,#1565C0)', animation: 'ay-ring 4s linear infinite' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#2196F3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 9, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>AI</span></div>
              </div>
              <div style={{ flex: 1, paddingTop: 5, fontSize: 16, color: '#07111F', lineHeight: 1.5, minWidth: 0 }}>
                <span>{typed}</span><span style={{ display: 'inline-block', width: 2, height: 18, background: '#1565C0', marginLeft: 1, verticalAlign: -3, animation: 'ay-blink 1s step-end infinite' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <button style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></button>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#1565C0', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 99, padding: '5px 11px' }}>English · हिंदी</span>
              <div style={{ flex: 1 }} />
              <button style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 8a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
              <button onClick={goAssistant} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(21,101,192,0.4)' }}><svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            </div>
          </div>

          {/* example chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 20 }}>
            {CHIPS.map((c, i) => (
              <button key={i} onClick={goAssistant} className="ay-chip" style={{ fontSize: 13, fontWeight: 500, color: '#475569', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(15,23,42,0.09)', borderRadius: 99, padding: '8px 15px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={c.dot} />{c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════════ TRUST STRIP ══════════════ */}
      <section id="trust" style={{ background: '#FBFCFE', padding: '38px clamp(20px,5vw,40px) 12px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 18 }}>Built for owners who want answers, not reports</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 14px' }}>
            {TRUST_PILLS.map((t) => (
              <div key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#334155', background: '#fff', border: '1px solid #EAEFF6', borderRadius: 99, padding: '8px 15px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <span style={{ color: '#1565C0', display: 'flex' }}>{t.icon}</span>{t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CAPABILITIES / MODULES ══════════════ */}
      <section id="capabilities" style={{ padding: '70px clamp(20px,5vw,40px) 20px', background: '#FBFCFE' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div id="modules" style={{ maxWidth: 640, marginBottom: 44 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1565C0', marginBottom: 12 }}>What Ayaam can answer</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(30px,4.2vw,46px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#07111F', marginBottom: 14 }}>Every part of your business, one conversation away</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#64748B' }}>Ask in plain language and Ayaam pulls the live numbers, builds the table, and hands you a chart or PDF. No dashboards to hunt through.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {MODULES.map((m) => (
              <div key={m.id} className="ay-card" style={{ position: 'relative', background: '#fff', borderRadius: 18, border: '1px solid #EAEFF6', padding: '22px 22px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
                <div style={m.glow} />
                <div style={m.iconWrap}>{m.icon}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, color: '#07111F', letterSpacing: '-0.01em', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#64748B', marginBottom: 14 }}>{m.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {m.queries.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', fontWeight: 500, background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 8, padding: '7px 10px' }}>
                      <span style={q.dot} />
                      <span style={{ flex: 1 }}>&ldquo;{q.label}&rdquo;</span>
                      <span style={{ color: '#CBD5E1', flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how" style={{ padding: '80px clamp(20px,5vw,40px)', background: '#07111F', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10%', top: '-30%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(21,101,192,0.5),transparent 68%)', filter: 'blur(70px)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', right: '-6%', bottom: '-30%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,43,0.4),transparent 68%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 50px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#60A5FA', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(30px,4.2vw,46px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff' }}>From question to answer in three beats</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {STEPS.map((st) => (
              <div key={st.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: '26px 24px', backdropFilter: 'blur(8px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#1565C0,#2196F3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 17, boxShadow: '0 6px 18px rgba(21,101,192,0.4)' }}>{st.n}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)' }}>{st.icon}</div>
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 19, color: '#fff', marginBottom: 8 }}>{st.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>{st.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CAPABILITY STRIP ══════════════ */}
      <section style={{ padding: '70px clamp(20px,5vw,40px)', background: '#FBFCFE' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {CAPS.map((c) => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #EAEFF6', borderRadius: 16, padding: '24px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={c.iconWrap}>{c.icon}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16.5, color: '#07111F', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#64748B' }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section style={{ padding: '20px clamp(20px,5vw,40px) 90px', background: '#FBFCFE' }}>
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(180deg,#0A1424 0%,#0B1220 100%)', padding: 'clamp(48px,7vw,84px) clamp(24px,5vw,60px)', textAlign: 'center' }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: '12%', bottom: '-40%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle,rgba(33,150,243,0.6),transparent 66%)', filter: 'blur(60px)', animation: 'ay-float1 18s ease-in-out infinite' }} />
          <div aria-hidden="true" style={{ position: 'absolute', right: '6%', bottom: '-46%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,43,0.5),transparent 66%)', filter: 'blur(60px)', animation: 'ay-float2 21s ease-in-out infinite' }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', padding: 2.5, background: 'conic-gradient(from 0deg,#1565C0,#2196F3,#FF6B2B,#1565C0)', animation: 'ay-ring 4s linear infinite', marginBottom: 22 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#2196F3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>A</span></div>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(30px,4.5vw,48px)', lineHeight: 1.06, letterSpacing: '-0.03em', color: '#fff', marginBottom: 14, textWrap: 'balance' }}>Ready to talk to your business?</h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', maxWidth: 480, marginBottom: 30 }}>Open the Ayaam AI assistant and get your first answer in under ten seconds.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <button onClick={goAssistant} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#07111F', border: 'none', borderRadius: 12, padding: '14px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 26px rgba(0,0,0,0.3)' }}>
                Open Assistant
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '14px 26px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Book a demo</button>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>No setup required</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Works with your existing ERP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#FBFCFE', borderTop: '1px solid #EAEFF6', padding: '40px clamp(20px,5vw,40px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1565C0,#FF6B2B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>A</span></div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', color: '#07111F' }}>AYAAM<span style={{ color: '#1565C0', fontWeight: 600, fontSize: 12, marginLeft: 3 }}>ERP</span></div>
          </div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <a href="#capabilities" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Capabilities</a>
            <a href="#how" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>How it works</a>
            <a href="#trust" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Security</a>
            <a href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>© 2026 Datawheel Software Technology LLP</div>
        </div>
      </footer>

    </div>
  );
}
