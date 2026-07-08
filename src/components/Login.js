import React, { useState } from 'react';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';
import logo from '../assets/aiva-mark.png';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function Login({ onLogin, logoutReason }) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [focusField, setFocusField] = useState(null);

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

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  const features = [
    { icon: '⚡', label: 'Live Data' },
    { icon: '🎙', label: 'Voice Input' },
    { icon: 'अ', label: 'Hindi Support' },
  ];
  const trust = ['SOC 2', 'SSL Encrypted', 'GDPR Ready'];

  const inputStyle = (field) => ({
    padding: '0.72rem 0.9rem', fontSize: '0.9rem',
    border: '1px solid ' + (focusField === field ? '#1565C0' : '#E5E7EB'),
    borderRadius: 10, outline: 'none', fontFamily: 'inherit', color: '#07111F',
    background: focusField === field ? '#fff' : '#F9FAFB',
    boxShadow: focusField === field ? 'inset 0 0 0 1px #1565C0, 0 0 0 3px rgba(21,101,192,0.12)' : 'none',
    transition: 'border-color 160ms, background 160ms, box-shadow 160ms', width: '100%', boxSizing: 'border-box',
  });

  return (
    <div style={S.page}>
      <style>{KEYFRAMES}</style>

      {/* animated gradient background */}
      <div aria-hidden="true" style={S.gradBg} />
      {/* floating ambient orbs */}
      <div aria-hidden="true" style={{ ...S.orb, width: 560, height: 560, top: -180, right: -160, background: 'radial-gradient(circle at 35% 40%,rgba(255,107,43,0.22) 0%,rgba(230,81,0,0.08) 50%,transparent 70%)', animation: 'ay-orbFloat 14s ease-in-out infinite' }} />
      <div aria-hidden="true" style={{ ...S.orb, width: 440, height: 440, bottom: -130, left: -110, background: 'radial-gradient(circle at 40% 40%,rgba(33,150,243,0.22) 0%,rgba(21,101,192,0.08) 50%,transparent 70%)', animation: 'ay-orbFloatB 17s ease-in-out -8s infinite' }} />
      <div aria-hidden="true" style={{ ...S.orb, width: 280, height: 280, top: '40%', left: '5%', background: 'radial-gradient(circle at 40% 40%,rgba(76,175,80,0.16) 0%,transparent 65%)', animation: 'ay-orbFloat 10s ease-in-out -4s infinite' }} />
      <div aria-hidden="true" style={{ ...S.orb, width: 200, height: 200, top: '10%', left: '28%', background: 'radial-gradient(circle at 40% 40%,rgba(106,27,154,0.14) 0%,transparent 65%)', animation: 'ay-orbFloatB 16s ease-in-out -10s infinite' }} />
      {/* dot-grid mesh */}
      <div aria-hidden="true" style={S.mesh} />

      {/* card */}
      <div style={S.card}>
        {/* logo row */}
        <div style={S.logoRow}>
          <div aria-hidden="true" style={S.logoRing}>
            <div style={S.logoInner}>
              <img src={logo} alt="AIVA" style={{ width: '62%', height: '62%', objectFit: 'contain' }} />
            </div>
          </div>
          <div>
            <div style={S.brandName}>AIVA</div>
            <div style={S.brandSub}>AYAAM ERP</div>
          </div>
        </div>

        {/* gradient divider */}
        <div style={S.divider} />

        {/* headline */}
        <div style={{ animation: 'ay-fadeUp 0.48s cubic-bezier(0.23,1,0.32,1) 80ms both' }}>
          <h1 style={S.h1}>Welcome back</h1>
          <p style={S.sub}>Your real-time business intelligence,<br />one click away.</p>
        </div>

        {/* form */}
        <form onSubmit={handleLogin} style={S.form}>
          {logoutReason && !error && (
            <div role="status" style={S.noticeBox}>
              <span>{logoutReason}</span>
            </div>
          )}
          {error && (
            <div role="alert" style={S.errorBox}>
              <span style={{ flexShrink: 0, lineHeight: 1, color: '#B91C1C' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13.5 12H1.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 6v3M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </span>
              <span>{error}</span>
            </div>
          )}

          <div style={S.field}>
            <label htmlFor="username" style={S.label}>Username</label>
            <input id="username" type="text" autoComplete="username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusField('username')} onBlur={() => setFocusField(null)}
              placeholder="Enter your username" style={inputStyle('username')} disabled={loading} />
          </div>

          <div style={S.field}>
            <label htmlFor="password" style={S.label}>Password</label>
            <input id="password" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusField('password')} onBlur={() => setFocusField(null)}
              placeholder="Enter your password" style={inputStyle('password')} disabled={loading} />
          </div>

          <button type="button" onClick={() => setShowForgot(true)} style={S.forgotBtn}>
            Forgot password?
          </button>

          <button type="submit" disabled={loading} className="ay-login-btn"
            style={{ ...S.submitBtn, ...(loading ? S.submitBtnBusy : {}) }}>
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'ay-spin 0.65s linear infinite', flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.28)" strokeWidth="1.75"/>
                  <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </>
            )}
          </button>
        </form>

        {/* feature pills */}
        <div style={S.pillRow}>
          {features.map((f, i) => (
            <span key={i} style={S.pill}>
              <span style={{ fontSize: '0.75rem' }}>{f.icon}</span>{f.label}
            </span>
          ))}
        </div>

        {/* trust badges */}
        <div style={S.trustRow}>
          {trust.map((t, i) => (
            <span key={i} style={S.trustBadge}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t}
            </span>
          ))}
        </div>

        {/* footer */}
        <div style={S.footer}>
          <span style={S.footerLine} />
          <span style={S.footerText}>Datawheel Software Technology LLP</span>
          <span style={S.footerLine} />
        </div>
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes ay-gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes ay-orbFloat{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(18px,-22px) scale(1.06) rotate(2deg)}50%{transform:translate(-12px,-36px) scale(0.96) rotate(-1deg)}75%{transform:translate(-20px,-10px) scale(1.03) rotate(1deg)}}
@keyframes ay-orbFloatB{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-16px,-28px) scale(1.04)}66%{transform:translate(24px,-14px) scale(0.97)}}
@keyframes ay-ringRotate{to{transform:rotate(360deg)}}
@keyframes ay-spin{to{transform:rotate(360deg)}}
@keyframes ay-scaleIn{from{opacity:0;transform:scale(0.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes ay-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.ay-login-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 40px rgba(21,101,192,0.48);filter:brightness(1.10)}
`;

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: '#050D1A' },
  gradBg: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(135deg,#070F1E 0%,#0A1F3D 35%,#0D3470 65%,#1565C0 100%)', backgroundSize: '300% 300%', animation: 'ay-gradShift 12s ease infinite', opacity: 0.95 },
  orb: { position: 'absolute', borderRadius: '50%', pointerEvents: 'none', willChange: 'transform' },
  mesh: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)' },
  card: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', borderRadius: 22, padding: '2.5rem 2.25rem 2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06)', animation: 'ay-scaleIn 0.48s cubic-bezier(0.23,1,0.32,1) both' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.4rem' },
  logoRing: { position: 'relative', width: 52, height: 52, flexShrink: 0, borderRadius: '50%', padding: 2.5, background: 'conic-gradient(from 0deg,#1565C0 0deg,#2196F3 90deg,#FF6B2B 180deg,#E65100 270deg,#1565C0 360deg)', animation: 'ay-ringRotate 3.2s linear infinite' },
  logoInner: { width: '100%', height: '100%', borderRadius: '50%', background: '#F1F5FB', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#07111F', letterSpacing: '0.06em', lineHeight: 1.1 },
  brandSub: { fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, marginTop: 3, letterSpacing: '0.01em' },
  divider: { height: 1, background: 'linear-gradient(90deg,transparent,#E5E7EB 25%,#E5E7EB 75%,transparent)', marginBottom: '1.5rem' },
  h1: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '1.65rem', fontWeight: 800, color: '#07111F', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '0.4rem' },
  sub: { fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '1.6rem', fontWeight: 400 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' },
  noticeBox: { background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.25rem', lineHeight: 1.4 },
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', color: '#B91C1C', padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, border: '1px solid #FECACA', lineHeight: 1.4 },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontSize: '0.74rem', fontWeight: 600, color: '#374151', letterSpacing: '0.01em' },
  forgotBtn: { display: 'block', marginLeft: 'auto', marginBottom: '0.4rem', background: 'none', border: 'none', color: '#1565C0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.85rem 1.5rem', background: 'linear-gradient(135deg,#1565C0 0%,#2196F3 100%)', color: '#fff', border: 'none', borderRadius: 11, fontSize: '0.94rem', fontWeight: 650, fontFamily: 'inherit', letterSpacing: '0.01em', cursor: 'pointer', boxShadow: '0 4px 20px rgba(21,101,192,0.40)', transition: 'transform 80ms cubic-bezier(0.34,1.28,0.64,1), box-shadow 220ms, filter 220ms' },
  submitBtnBusy: { opacity: 0.8, cursor: 'not-allowed' },
  pillRow: { display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem', animation: 'ay-fadeUp 0.48s cubic-bezier(0.23,1,0.32,1) 160ms both' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.70rem', fontWeight: 600, color: '#1565C0', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 99, padding: '0.22rem 0.65rem', letterSpacing: '0.02em' },
  trustRow: { display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.4rem' },
  trustBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.01em' },
  footer: { display: 'flex', alignItems: 'center', gap: '0.65rem', justifyContent: 'center' },
  footerLine: { flex: 1, height: 1, background: '#F3F4F6', display: 'block' },
  footerText: { fontSize: '0.65rem', color: '#D1D5DB', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.01em' },
};