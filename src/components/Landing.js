import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/aiva-mark.png';

/* ── SVG icon helpers ── */
const P = (d, extra = {}) => <path d={d} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" {...extra} />;
const Svg = (children, s = 18) => <svg width={s} height={s} viewBox="0 0 18 18" fill="none">{children}</svg>;

const ICONS = {
  sales:      Svg([<React.Fragment key="1">{P('M2 14l4.5-5 3.5 3.5L16 5')}{P('M12 5h4v4')}</React.Fragment>]),
  purchase:   Svg([<React.Fragment key="1">{P('M2 2h2.2l1.9 8.5h7.4l1.5-6H5')}<circle cx="7.5" cy="14.5" r="1.3" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="14.5" r="1.3" stroke="currentColor" strokeWidth="1.4"/></React.Fragment>]),
  collection: Svg([<React.Fragment key="1"><rect x="1.6" y="4.5" width="14.8" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="9.25" r="2.2" stroke="currentColor" strokeWidth="1.5"/></React.Fragment>]),
  bank:       Svg([<React.Fragment key="1">{P('M9 2l7 4.5H2L9 2z')}{P('M4 8v5M9 8v5M14 8v5M2 15.5h14')}</React.Fragment>]),
  receivable: Svg([<React.Fragment key="1">{P('M9 2l7 4v6l-7 4-7-4V6l7-4z')}{P('M2 6l7 4 7-4M9 10v6')}</React.Fragment>]),
  stock:      Svg([<React.Fragment key="1">{P('M9 2l6.5 3.5v7L9 16 2.5 12.5v-7L9 2z')}{P('M2.5 5.5L9 9l6.5-3.5M9 9v7')}</React.Fragment>]),
  dispatch:   Svg([<React.Fragment key="1">{P('M1.5 4h9v7h-9V4z')}{P('M10.5 6.5h3l2.5 3V11h-5.5V6.5z')}<circle cx="4" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12.5" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5"/></React.Fragment>]),
  voice:      Svg([<React.Fragment key="1"><rect x="6.5" y="2" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>{P('M4 9a5 5 0 0 0 10 0M9 14v2')}</React.Fragment>]),
  globe:      Svg([<React.Fragment key="1"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>{P('M2 9h14M9 2c2 2.2 3 4.5 3 7s-1 4.8-3 7c-2-2.2-3-4.5-3-7s1-4.8 3-7z')}</React.Fragment>]),
  live:       Svg([<React.Fragment key="1">{P('M2 9h3l2-5 4 10 2-5h3')}</React.Fragment>]),
  export:     Svg([<React.Fragment key="1">{P('M9 11V2M5.5 5.5L9 2l3.5 3.5')}{P('M3 11v4h12v-4')}</React.Fragment>]),
  chat:       Svg([<React.Fragment key="1">{P('M2 3.5h14v9H8l-4 3v-3H2v-9z')}</React.Fragment>]),
  spark:      Svg([<React.Fragment key="1">{P('M9 2l1.6 4.4L15 8l-4.4 1.6L9 14l-1.6-4.4L3 8l4.4-1.6L9 2z')}</React.Fragment>]),
  clock:      Svg([<React.Fragment key="1"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>{P('M9 5v4l3 2')}</React.Fragment>]),
  lock:       Svg([<React.Fragment key="1"><rect x="3.5" y="8" width="11" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/>{P('M6 8V6a3 3 0 0 1 6 0v2')}</React.Fragment>]),
};

const dotC = (c) => ({ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: c });
const iconWrap = (c) => ({ width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 16, background: `linear-gradient(135deg,${c},${c}dd)`, boxShadow: `0 8px 20px ${c}44` });
const glow = (c) => ({ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${c}22,transparent 70%)`, pointerEvents: 'none' });
const capWrap = (c) => ({ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, marginBottom: 14, background: c + '14', border: '1px solid ' + c + '26' });

const MODULES = [
  { id: 'sales', label: 'Sales', color: '#1565C0', desc: 'Daily, monthly or total sales with party-wise breakdown and invoice tables.', queries: ["Today's sales", 'This month sales', 'Top parties'] },
  { id: 'purchase', label: 'Purchase', color: '#E65100', desc: 'Track buying across suppliers by day, month or full history.', queries: ["Today's purchase", 'Month purchase'] },
  { id: 'collection', label: 'Collection & Payment', color: '#2E7D32', desc: 'See money in vs money out for any date, instantly reconciled.', queries: ["Today's collection", "Today's payment"] },
  { id: 'bank', label: 'Bank Balance', color: '#6A1B9A', desc: 'Live balances across every bank account in one summary.', queries: ['Bank summary', 'Account-wise balance'] },
  { id: 'receivable', label: 'Receivable & Payable', color: '#00695C', desc: 'Know exactly who owes you and whom you owe, with ageing.', queries: ['Total receivable', 'Total payable'] },
  { id: 'stock', label: 'Stock', color: '#B45309', desc: 'Item-level stock, valuations and full inventory details on demand.', queries: ['Total stock', 'Full stock details'] },
  { id: 'dispatch', label: 'Dispatch', color: '#283593', desc: 'Track goods going out — daily, monthly and cumulative dispatch.', queries: ["Today's dispatch", "Month's dispatch"] },
];

const TRUST_PILLS = [
  { id: 'chat', label: 'Plain-language queries' },
  { id: 'voice', label: 'Voice input' },
  { id: 'globe', label: 'English + Hindi' },
  { id: 'export', label: 'PDF & Excel export' },
  { id: 'live', label: 'Real-time data' },
];

const STEPS = [
  { id: 'chat', n: '1', title: 'Ask in plain language', body: 'Type or speak your question — "what\u2019s today\u2019s sales?" — in English or Hindi. No menus, no filters.' },
  { id: 'spark', n: '2', title: 'Ayaam reads your live data', body: 'The assistant queries your ERP in real time and builds the exact table, summary or chart you need.' },
  { id: 'export', n: '3', title: 'Act on the answer', body: 'Copy it, translate it, turn it into a chart, or download the full dataset as a PDF in one tap.' },
];

const CAPS = [
  { id: 'voice', title: 'Speak, don\u2019t type', body: 'Full voice input so owners on the floor can just ask out loud.', color: '#1565C0' },
  { id: 'globe', title: 'Hindi + English', body: 'Ask and read answers in either language, switch anytime.', color: '#E65100' },
  { id: 'clock', title: 'Answers in seconds', body: 'Live ERP data means numbers are always current, never stale.', color: '#2E7D32' },
  { id: 'lock', title: 'Secure by design', body: 'SOC 2, SSL encryption and GDPR-ready access controls.', color: '#6A1B9A' },
];

const CHIPS = [
  { label: "Today's sales", color: '#1565C0' },
  { label: 'Debtors list', color: '#00695C' },
  { label: 'Bank summary', color: '#6A1B9A' },
  { label: 'Full stock details', color: '#B45309' },
];

const EXAMPLES = [
  "What's today's sales?",
  'Show me the debtors list',
  '\u092E\u0939\u0940\u0928\u0947 \u0915\u0940 \u0915\u0941\u0932 \u092C\u093F\u0915\u094D\u0930\u0940 \u0926\u093F\u0916\u093E\u0913',
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

export default function Landing() {
  const navigate = useNavigate();
  const typed = useTypewriter();
  const meshRef = useRef(null);

  // Scroll parallax on the hero mesh
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || window.pageYOffset || 0;
        if (!meshRef.current) return;
        const p = Math.min(y / 640, 1);
        meshRef.current.style.transform = `translate3d(0,${(y * 0.32).toFixed(1)}px,0) scale(${(1 + p * 0.14).toFixed(3)})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goLogin = () => navigate('/login');
  const goAssistant = () => navigate(hasValidSession() ? '/assistant' : '/login');

  const specks = [];
  const speckColors = ['rgba(21,101,192,0.5)', 'rgba(255,107,43,0.5)', 'rgba(33,150,243,0.5)'];
  for (let i = 0; i < 9; i++) {
    const c = speckColors[i % 3];
    const sz = 5 + (i % 3) * 3;
    specks.push({
      position: 'absolute', bottom: (6 + (i * 7) % 34) + '%', left: (8 + (i * 11) % 84) + '%',
      width: sz, height: sz, borderRadius: '50%', background: c, filter: 'blur(1px)', zIndex: 3,
      pointerEvents: 'none', animation: `ay-rise ${7 + (i % 4) * 2}s ease-in-out ${(i * 0.7).toFixed(1)}s infinite`,
    });
  }

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: '#FBFCFE', fontFamily: "'Inter',system-ui,sans-serif", color: '#07111F' }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav style={S.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.navLogo}>
            <img src={logo} alt="AIVA" style={{ width: '68%', height: '68%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13.5, letterSpacing: '-0.01em', color: '#07111F', lineHeight: 1.15 }}>AIVA Assistant</div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>AYAAM ERP</div>
          </div>
        </div>
        <div style={S.navLinks} className="ay-nav-links">
          <a href="#capabilities" style={S.navLink}>Capabilities</a>
          <a href="#how" style={S.navLink}>How it works</a>
          <a href="#trust" style={S.navLink}>Security</a>
          <a href="#modules" style={S.navLink}>Modules</a>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={goLogin} style={S.navLoginBtn}>Log in</button>
        <button onClick={goAssistant} className="ay-cta-btn" style={S.navCtaBtn}>
          <span style={S.pingDot}><span style={S.pingInner} /></span>
          Open Assistant
        </button>
      </nav>

      {/* HERO */}
      <header style={S.hero}>
        <div aria-hidden="true" ref={meshRef} style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform', animation: 'ay-heroFade 1.4s ease-out both' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#FCFDFF 0%,#F1F5FC 44%,#E7EEFA 100%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: '50%', top: '2%', width: 820, height: 520, transform: 'translate(-50%,0)', background: 'radial-gradient(ellipse at center,rgba(255,255,255,0.95) 0%,rgba(255,255,255,0) 66%)', animation: 'ay-glow 9s ease-in-out infinite', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-6%', bottom: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%,rgba(33,150,243,0.95) 0%,rgba(21,101,192,0.5) 45%,transparent 72%)', filter: 'blur(52px)', animation: 'ay-float1 16s ease-in-out infinite, ay-blobIn 1.2s ease-out 0.15s both', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '30%', bottom: '-16%', width: 680, height: 600, borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%,rgba(255,107,43,0.9) 0%,rgba(230,81,0,0.5) 46%,transparent 72%)', filter: 'blur(54px)', animation: 'ay-float2 19s ease-in-out infinite, ay-blobIn 1.2s ease-out 0.4s both', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '-8%', bottom: '-6%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle at 55% 45%,rgba(96,165,250,0.9) 0%,rgba(33,150,243,0.46) 48%,transparent 72%)', filter: 'blur(54px)', animation: 'ay-float3 22s ease-in-out infinite, ay-blobIn 1.2s ease-out 0.65s both', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '18%', top: '4%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,138,80,0.58) 0%,rgba(255,107,43,0.22) 48%,transparent 72%)', filter: 'blur(60px)', animation: 'ay-float4 24s ease-in-out infinite, ay-blobIn 1.2s ease-out 0.9s both', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '12%', top: '12%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(21,101,192,0.46) 0%,transparent 70%)', filter: 'blur(56px)', animation: 'ay-float4 20s ease-in-out infinite, ay-blobIn 1.2s ease-out 1.1s both', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(15,23,42,0.05) 1px,transparent 1px)', backgroundSize: '30px 30px', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%,black,transparent)', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%,black,transparent)', zIndex: 2, pointerEvents: 'none' }} />
          {specks.map((sp, i) => <div key={i} aria-hidden="true" style={sp} />)}
        </div>

        <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={S.newBadge}>
            <span style={S.newTag}>NEW</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Your ERP now speaks plain language — and Hindi</span>
          </div>
          <h1 style={S.h1}>Just ask your<br /><span style={S.h1Grad}>business anything</span></h1>
          <p style={S.heroSub}>Ayaam AI reads your live ERP data and answers in seconds — sales, stock, collections, dispatch and more. Type or speak, in English or Hindi.</p>

          {/* prompt box */}
          <div style={S.promptBox}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minHeight: 52 }}>
              <div style={S.promptRing}>
                <div style={S.promptRingInner}><span style={{ color: '#fff', fontSize: 9, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>AI</span></div>
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <span style={{ fontSize: 16, color: '#07111F', fontWeight: 500 }}>{typed}</span>
                <span style={S.caret} />
              </div>
              <button onClick={goAssistant} style={S.promptSend}>
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {CHIPS.map((c, i) => (
                <button key={i} onClick={goAssistant} className="ay-chip" style={S.chip}>
                  <span style={dotC(c.color)} />{c.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 24, fontSize: 13, color: '#64748B', fontWeight: 500 }}>
            <span>English · \u0939\u093F\u0928\u094D\u0926\u0940</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>Built for owners who want answers, not reports</span>
          </div>
        </div>
      </header>

      {/* CAPABILITIES */}
      <section id="capabilities" style={S.section}>
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <div style={S.kicker}>CAPABILITIES</div>
          <h2 style={S.h2}>Built for owners who want answers</h2>
        </div>
        <div style={S.capGrid}>
          {CAPS.map((c) => (
            <div key={c.id} className="ay-card" style={S.capCard}>
              <div style={capWrap(c.color)}>{ICONS[c.id]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#07111F' }}>{c.title}</div>
              <div style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={{ ...S.section, background: '#F7F9FD' }}>
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <div style={S.kicker}>MODULES</div>
          <h2 style={S.h2}>Every part of your business, one conversation away</h2>
        </div>
        <div style={S.modGrid}>
          {MODULES.map((m) => (
            <div key={m.id} className="ay-card" style={S.modCard}>
              <div style={glow(m.color)} />
              <div style={iconWrap(m.color)}>{ICONS[m.id]}</div>
              <div style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 7, color: '#07111F' }}>{m.label}</div>
              <div style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55, marginBottom: 14 }}>{m.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {m.queries.map((q, i) => (
                  <span key={i} style={S.modQuery}><span style={dotC(m.color)} />{q}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={S.section}>
        <div style={{ textAlign: 'center', marginBottom: 46 }}>
          <div style={S.kicker}>HOW IT WORKS</div>
          <h2 style={S.h2}>From question to answer in three beats</h2>
        </div>
        <div style={S.stepGrid}>
          {STEPS.map((s) => (
            <div key={s.id} style={S.stepCard}>
              <div style={S.stepNum}>{s.n}</div>
              <div style={{ color: '#1565C0', marginBottom: 12 }}>{ICONS[s.id]}</div>
              <div style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 8, color: '#07111F' }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST / SECURITY */}
      <section id="trust" style={{ ...S.section, background: '#F7F9FD', paddingTop: 60, paddingBottom: 60 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={S.kicker}>SECURITY & CAPABILITIES</div>
          <h2 style={{ ...S.h2, marginBottom: 30 }}>What Ayaam can answer</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 760, margin: '0 auto' }}>
            {TRUST_PILLS.map((t) => (
              <span key={t.id} style={S.trustPill}>
                <span style={{ color: '#1565C0' }}>{ICONS[t.id]}</span>{t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={S.ctaCard}>
          <div style={S.ctaGlow} />
          <h2 style={S.ctaH2}>Ready to talk to your business?</h2>
          <p style={S.ctaSub}>Open the Ayaam AI assistant and get your first answer in under ten seconds.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <button onClick={goAssistant} style={S.ctaPrimary}>
              <span>Open Assistant</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={goLogin} style={S.ctaSecondary}>Log in</button>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22, position: 'relative', zIndex: 1 }}>
            <span style={S.ctaNote}>✓ No setup required</span>
            <span style={S.ctaNote}>✓ Works with your existing ERP</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.navLogo}>
            <img src={logo} alt="AIVA" style={{ width: '68%', height: '68%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13, color: '#07111F' }}>AIVA Assistant</div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500 }}>AYAAM ERP</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <a href="#capabilities" style={S.footerLink}>Capabilities</a>
          <a href="#how" style={S.footerLink}>How it works</a>
          <a href="#trust" style={S.footerLink}>Security</a>
          <a href="#modules" style={S.footerLink}>Modules</a>
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>Datawheel Software Technology LLP</div>
      </footer>
    </div>
  );
}

const CSS = `
@keyframes ay-float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(120px,-130px) scale(1.28)}66%{transform:translate(-90px,-200px) scale(0.86)}}
@keyframes ay-float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-140px,-160px) scale(1.22)}66%{transform:translate(110px,-70px) scale(1.16)}}
@keyframes ay-float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(90px,-180px) scale(1.35)}}
@keyframes ay-float4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-110px,-120px) scale(1.24)}}
@keyframes ay-blobIn{from{opacity:0}to{opacity:1}}
@keyframes ay-glow{0%,100%{opacity:.55;transform:translate(-50%,0) scale(1)}50%{opacity:.85;transform:translate(-50%,-24px) scale(1.08)}}
@keyframes ay-ring{to{transform:rotate(360deg)}}
@keyframes ay-rise{0%{transform:translateY(20px);opacity:0}12%,88%{opacity:1}100%{transform:translateY(-30px);opacity:0}}
@keyframes ay-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes ay-ping{0%{transform:scale(1);opacity:.8}80%,100%{transform:scale(2.4);opacity:0}}
@keyframes ay-heroFade{from{opacity:0}to{opacity:1}}
.ay-cta-btn:hover{background:#1E2A3F !important}
.ay-chip:hover{background:#fff !important;border-color:rgba(21,101,192,0.35) !important;color:#1565C0 !important}
.ay-card{transition:border-color 200ms, box-shadow 200ms, transform 200ms}
.ay-card:hover{border-color:rgba(21,101,192,0.28) !important;box-shadow:0 12px 34px rgba(21,101,192,0.12) !important;transform:translateY(-2px)}
@media (max-width:720px){.ay-nav-links{display:none !important}}
`;

const S = {
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 20, padding: '0 clamp(18px,4vw,54px)', height: 66, backdropFilter: 'blur(18px)', background: 'rgba(251,252,254,0.72)', borderBottom: '1px solid rgba(15,23,42,0.06)' },
  navLogo: { width: 32, height: 32, borderRadius: 9, background: '#F1F5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(21,101,192,0.18)' },
  navLinks: { display: 'flex', gap: 26, marginLeft: 24 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' },
  navLoginBtn: { background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 4px' },
  navCtaBtn: { display: 'flex', alignItems: 'center', gap: 7, background: '#07111F', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 17px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(7,17,31,0.22)', transition: 'background 180ms' },
  pingDot: { width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', position: 'relative' },
  pingInner: { position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80', animation: 'ay-ping 2.4s ease-out infinite' },
  hero: { position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px clamp(20px,5vw,40px) 90px', overflow: 'hidden', textAlign: 'center' },
  newBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(21,101,192,0.18)', borderRadius: 99, padding: '6px 14px 6px 8px', marginBottom: 26, boxShadow: '0 4px 18px rgba(21,101,192,0.1)' },
  newTag: { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1565C0', color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 99 },
  h1: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(40px,7vw,76px)', lineHeight: 1.03, letterSpacing: '-0.035em', color: '#07111F', marginBottom: 20 },
  h1Grad: { background: 'linear-gradient(115deg,#1565C0 0%,#2196F3 38%,#FF6B2B 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  heroSub: { fontSize: 'clamp(16px,2vw,20px)', lineHeight: 1.6, color: '#475569', maxWidth: 560, marginBottom: 38, fontWeight: 450 },
  promptBox: { width: '100%', maxWidth: 680, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 24px 70px rgba(21,101,192,0.16),0 4px 14px rgba(7,17,31,0.06)', padding: '18px 18px 14px', textAlign: 'left' },
  promptRing: { width: 30, height: 30, flexShrink: 0, borderRadius: '50%', padding: 2, background: 'conic-gradient(from 0deg,#1565C0,#2196F3,#FF6B2B,#1565C0)', animation: 'ay-ring 4s linear infinite' },
  promptRingInner: { width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#2196F3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  caret: { display: 'inline-block', width: 2, height: '1.05em', background: '#1565C0', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'ay-blink 1s step-end infinite' },
  promptSend: { width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(21,101,192,0.4)' },
  chip: { fontSize: 13, fontWeight: 500, color: '#475569', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(15,23,42,0.09)', borderRadius: 99, padding: '8px 15px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all 160ms' },
  section: { padding: '80px clamp(20px,5vw,54px)', maxWidth: 1180, margin: '0 auto' },
  kicker: { fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#1565C0', marginBottom: 12 },
  h2: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#07111F', lineHeight: 1.15, maxWidth: 620, margin: '0 auto' },
  capGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20 },
  capCard: { background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, padding: 24 },
  modGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 },
  modCard: { position: 'relative', overflow: 'hidden', background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, padding: 26 },
  modQuery: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: '#475569', background: '#F1F5F9', borderRadius: 99, padding: '5px 11px' },
  stepGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 },
  stepCard: { position: 'relative', background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 18, padding: '28px 24px 24px' },
  stepNum: { position: 'absolute', top: 20, right: 22, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 34, fontWeight: 800, color: '#EEF2F8', lineHeight: 1 },
  trustPill: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#334155', background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 99, padding: '10px 18px' },
  ctaSection: { padding: '40px clamp(20px,5vw,54px) 90px', maxWidth: 1000, margin: '0 auto' },
  ctaCard: { position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#0A1F3D 0%,#0D3470 55%,#1565C0 100%)', borderRadius: 28, padding: '60px 40px', textAlign: 'center', boxShadow: '0 30px 80px rgba(13,52,112,0.35)' },
  ctaGlow: { position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle,rgba(255,107,43,0.3),transparent 65%)', pointerEvents: 'none' },
  ctaH2: { position: 'relative', zIndex: 1, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: 14 },
  ctaSub: { position: 'relative', zIndex: 1, fontSize: 16, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 30px' },
  ctaPrimary: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#07111F', border: 'none', borderRadius: 12, padding: '14px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 26px rgba(0,0,0,0.3)' },
  ctaSecondary: { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '14px 26px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  ctaNote: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', padding: '32px clamp(20px,5vw,54px)', maxWidth: 1180, margin: '0 auto', borderTop: '1px solid rgba(15,23,42,0.07)' },
  footerLink: { fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 },
};