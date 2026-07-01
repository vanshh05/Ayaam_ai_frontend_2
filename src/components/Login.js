import React, { useState } from 'react';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';

const API_URL = process.env.REACT_APP_API_URL || '';

/* ── Inline SVG icons ────────────────────────────────────────────────────────── */
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1.5L13.5 12H1.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7.5 6v3M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.65s linear infinite', flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.28)" strokeWidth="1.75"/>
    <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);
const IconCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Component ───────────────────────────────────────────────────────────────── */
export default function Login({ onLogin, logoutReason }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/login`,
        { username: username.trim(), password },
        { timeout: 30000 });
      if (res.data.success) {
        onLogin({
          name:         res.data.full_name,
          role:         res.data.role,
          username:     res.data.username,
          company_id:   res.data.company_id,
          company_name: res.data.company_name,
          token:        res.data.token,
        });
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '⚡', label: 'Live Data' },
    { icon: '🎙', label: 'Voice Input' },
    { icon: 'अ', label: 'Hindi Support' },
  ];

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  return (
    <div style={S.page}>
      {/* Animated gradient background */}
      <div style={S.gradBg} aria-hidden="true" />

      {/* Floating ambient orbs */}
      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />
      <div className="login-orb login-orb-3" aria-hidden="true" />
      <div className="login-orb login-orb-4" aria-hidden="true" />

      {/* Dot-grid mesh */}
      <div style={S.mesh} aria-hidden="true" />

      {/* ── Card ── */}
      <div style={S.card} className="login-card">

        {/* ── Logo row ── */}
        <div style={S.logoRow}>
          {/* Spinning conic-gradient ring */}
          <div style={S.ringWrap} className="logo-ring-wrap" aria-hidden="true">
            <div style={S.ringInner} className="logo-ring-inner">
              <span style={S.ringLetter}>A</span>
            </div>
          </div>

          <div>
            <div style={S.brandName}>
              AYAAM<span style={S.brandErp}>ERP</span>
            </div>
            <div style={S.brandSub}>AI Business Assistant</div>
          </div>
        </div>

        {/* ── Gradient divider ── */}
        <div style={S.divider} />

        {/* ── Headline ── */}
        <div className="anim-fadeUp" style={{ animationDelay: '80ms' }}>
          <h1 style={S.headline}>Welcome back</h1>
          <p style={S.subline}>
            Your real-time business intelligence,<br />one click away.
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleLogin} style={S.form}>
          {logoutReason && !error && (
            <div style={S.noticeBox} className="anim-slideUp" role="status">
              <span>{logoutReason}</span>
            </div>
          )}
          {error && (
            <div style={S.errorBox} className="anim-slideUp" role="alert">
              <span style={S.errorIcon}><IconAlert /></span>
              <span>{error}</span>
            </div>
          )}

          <div style={S.field}>
            <label style={S.label} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={S.input}
              className="login-input"
              disabled={loading}
            />
          </div>

          <div style={S.field}>
            <label style={S.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={S.input}
              className="login-input"
              disabled={loading}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowForgot(true)}
            style={S.forgotLink}
            className="forgot-link"
          >
            Forgot password?
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`login-btn${loading ? ' shimmer-parent' : ''}`}
            style={{ ...S.btn, ...(loading ? S.btnBusy : {}) }}
          >
            {loading ? (
              <>
                <IconSpinner />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <IconArrow />
              </>
            )}
          </button>
        </form>

        {/* ── Feature pills ── */}
        <div style={{ ...S.pills, animationDelay: '160ms' }} className="anim-fadeUp">
          {features.map(f => (
            <span key={f.label} style={S.pill}>
              <span style={S.pillIcon}>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* ── Trust badges row ── */}
        <div style={S.trustRow}>
          {['SOC 2', 'SSL Encrypted', 'GDPR Ready'].map(t => (
            <span key={t} style={S.trustBadge}>
              <IconCheck size={10} />
              {t}
            </span>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={S.footer}>
          <span style={S.footerLine} />
          <span style={S.footerText}>Datawheel Software Technology LLP</span>
          <span style={S.footerLine} />
        </div>
      </div>
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
    overflow:       'hidden',
    padding:        '1.25rem',
    background:     '#050D1A',
  },

  /* Animated gradient layer */
  gradBg: {
    position:           'absolute',
    inset:              0,
    backgroundImage:    'linear-gradient(135deg, #070F1E 0%, #0A1F3D 35%, #0D3470 65%, #1565C0 100%)',
    backgroundSize:     '300% 300%',
    animation:          'gradShift 12s ease infinite',
    opacity:            0.95,
  },

  /* Dot-grid */
  mesh: {
    position:        'absolute',
    inset:           0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize:  '26px 26px',
    pointerEvents:   'none',
    maskImage:       'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
  },

  /* ── Card ── */
  card: {
    position:      'relative',
    zIndex:        1,
    width:         '100%',
    maxWidth:      420,
    background:    'rgba(255,255,255,0.98)',
    backdropFilter:'blur(24px)',
    borderRadius:  22,
    padding:       '2.5rem 2.25rem 2rem',
    boxShadow:     '0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
  },

  /* Logo row */
  logoRow: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.9rem',
    marginBottom: '1.4rem',
  },
  ringWrap:   { width: 52, height: 52, flexShrink: 0 },
  ringInner:  { width: '100%', height: '100%', background: 'linear-gradient(135deg,#1565C0,#2196F3)' },
  ringLetter: {
    color:      '#fff',
    fontWeight: 800,
    fontSize:   '1.3rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    lineHeight: 1,
    userSelect: 'none',
  },
  brandName: {
    fontFamily:    "'Plus Jakarta Sans', sans-serif",
    fontWeight:    800,
    fontSize:      '1.25rem',
    color:         '#07111F',
    letterSpacing: '0.06em',
    lineHeight:    1.1,
  },
  brandErp: {
    color:      '#1565C0',
    marginLeft: 4,
    fontSize:   '0.95rem',
    fontWeight: 600,
  },
  brandSub: {
    fontSize:      '0.72rem',
    color:         '#9CA3AF',
    fontWeight:    500,
    marginTop:     3,
    letterSpacing: '0.01em',
    fontFamily:    "'Inter', sans-serif",
  },

  /* Divider */
  divider: {
    height:       1,
    background:   'linear-gradient(90deg, transparent, #E5E7EB 25%, #E5E7EB 75%, transparent)',
    marginBottom: '1.5rem',
  },

  /* Headlines */
  headline: {
    fontFamily:    "'Plus Jakarta Sans', sans-serif",
    fontSize:      '1.65rem',
    fontWeight:    800,
    color:         '#07111F',
    letterSpacing: '-0.03em',
    lineHeight:    1.15,
    marginBottom:  '0.4rem',
  },
  subline: {
    fontFamily:   "'Inter', sans-serif",
    fontSize:     '0.875rem',
    color:        '#6B7280',
    lineHeight:   1.6,
    marginBottom: '1.6rem',
    fontWeight:   400,
  },

  /* Form */
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.75rem',
    marginBottom:  '1.25rem',
  },

  /* Input fields */
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.3rem',
  },
  label: {
    fontSize:      '0.74rem',
    fontWeight:    600,
    color:         '#374151',
    letterSpacing: '0.01em',
    fontFamily:    "'Inter', sans-serif",
  },
  input: {
    padding:      '0.72rem 0.9rem',
    fontSize:     '0.9rem',
    border:       '1px solid #E5E7EB',
    borderRadius: 10,
    outline:      'none',
    fontFamily:   "'Inter', sans-serif",
    color:        '#07111F',
    background:   '#F9FAFB',
    transition:   'border-color 160ms, background 160ms, box-shadow 160ms',
    width:        '100%',
    boxSizing:    'border-box',
  },

  /* Error */
  noticeBox: { background:'#FFF7ED', color:'#9A3412', border:'1px solid #FED7AA', borderRadius:10, padding:'0.7rem 0.9rem', fontSize:'0.82rem', fontWeight:500, marginBottom:'1rem', lineHeight:1.4 },
  errorBox: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.5rem',
    background:   '#FEF2F2',
    color:        '#B91C1C',
    padding:      '0.6rem 0.9rem',
    borderRadius: 8,
    fontSize:     '0.82rem',
    fontWeight:   500,
    border:       '1px solid #FECACA',
    lineHeight:   1.4,
  },
  errorIcon: { flexShrink: 0, lineHeight: 1, color: '#B91C1C' },

  /* CTA */
  btn: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '0.5rem',
    width:          '100%',
    padding:        '0.85rem 1.5rem',
    background:     'linear-gradient(135deg, #1565C0 0%, #2196F3 100%)',
    color:          '#fff',
    border:         'none',
    borderRadius:   11,
    fontSize:       '0.94rem',
    fontWeight:     650,
    fontFamily:     "'Inter', sans-serif",
    letterSpacing:  '0.01em',
    cursor:         'pointer',
    boxShadow:      '0 4px 20px rgba(21,101,192,0.40)',
  },
  btnBusy: { opacity: 0.80, cursor: 'not-allowed' },
  forgotLink: {
    display: 'block', marginLeft: 'auto', marginBottom: '0.4rem', background: 'none', border: 'none',
    color: '#1565C0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", padding: 0,
  },

  /* Feature pills */
  pills: {
    display:        'flex',
    justifyContent: 'center',
    gap:            '0.45rem',
    flexWrap:       'wrap',
    marginBottom:   '1rem',
  },
  pill: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '0.3rem',
    fontSize:      '0.70rem',
    fontWeight:    600,
    color:         '#1565C0',
    background:    '#EFF6FF',
    border:        '1px solid #BFDBFE',
    borderRadius:  99,
    padding:       '0.22rem 0.65rem',
    letterSpacing: '0.02em',
    fontFamily:    "'Inter', sans-serif",
  },
  pillIcon: { fontSize: '0.75rem' },

  /* Trust row */
  trustRow: {
    display:        'flex',
    justifyContent: 'center',
    gap:            '0.75rem',
    marginBottom:   '1.4rem',
  },
  trustBadge: {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '0.3rem',
    fontSize:     '0.67rem',
    fontWeight:   500,
    color:        '#6B7280',
    fontFamily:   "'Inter', sans-serif",
    letterSpacing:'0.01em',
  },

  /* Footer */
  footer: {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.65rem',
    justifyContent: 'center',
  },
  footerLine: {
    flex: 1, height: 1, background: '#F3F4F6', display: 'block',
  },
  footerText: {
    fontSize:      '0.65rem',
    color:         '#D1D5DB',
    fontWeight:    500,
    whiteSpace:    'nowrap',
    letterSpacing: '0.01em',
    fontFamily:    "'Inter', sans-serif",
  },
};