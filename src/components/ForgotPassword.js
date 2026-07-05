import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/aiva-mark.png';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function ForgotPassword({ onBack }) {
  const [step,     setStep]     = useState(1); // 1 = username, 2 = code + new pw, 3 = done
  const [username, setUsername] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code,     setCode]     = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [notice,   setNotice]   = useState('');
  const [focusField, setFocusField] = useState(null);

  const requestCode = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const res = await axios.post(`${API_URL}/api/forgot-password`,
        { username: username.trim() }, { timeout: 30000 });
      if (res.data.success) {
        setMaskedEmail(res.data.masked_email || '');
        setNotice(`A 6-digit code has been sent to ${res.data.masked_email || 'your registered email'}.`);
        setStep(2);
      } else {
        setError(res.data.message || 'Could not send the code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPw) { setError('Enter the code and your new password.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const res = await axios.post(`${API_URL}/api/reset-password`,
        { username: username.trim(), code: code.trim(), new_password: newPw }, { timeout: 30000 });
      if (res.data.success) {
        setNotice('Password reset! You can now go back and sign in with your new password.');
        setStep(3);
      } else {
        setError(res.data.message || 'Could not reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field, extra) => ({
    width: '100%', boxSizing: 'border-box', padding: '0.72rem 0.9rem', fontSize: '0.9rem',
    border: '1px solid ' + (focusField === field ? '#1565C0' : '#E5E7EB'),
    borderRadius: 10, outline: 'none', fontFamily: 'inherit', color: '#07111F',
    background: focusField === field ? '#fff' : '#F9FAFB',
    boxShadow: focusField === field ? 'inset 0 0 0 1px #1565C0, 0 0 0 3px rgba(21,101,192,0.12)' : 'none',
    transition: 'border-color 160ms, background 160ms, box-shadow 160ms',
    ...extra,
  });

  const steps = [1, 2, 3];

  return (
    <div style={S.page}>
      <style>{KEYFRAMES}</style>
      <div aria-hidden="true" style={S.gradBg} />
      <div aria-hidden="true" style={{ ...S.orb, width: 560, height: 560, top: -180, right: -160, background: 'radial-gradient(circle at 35% 40%,rgba(255,107,43,0.22) 0%,rgba(230,81,0,0.08) 50%,transparent 70%)', animation: 'ay-orbFloat 14s ease-in-out infinite' }} />
      <div aria-hidden="true" style={{ ...S.orb, width: 440, height: 440, bottom: -130, left: -110, background: 'radial-gradient(circle at 40% 40%,rgba(33,150,243,0.22) 0%,rgba(21,101,192,0.08) 50%,transparent 70%)', animation: 'ay-orbFloatB 17s ease-in-out -8s infinite' }} />
      <div aria-hidden="true" style={{ ...S.orb, width: 280, height: 280, top: '40%', left: '5%', background: 'radial-gradient(circle at 40% 40%,rgba(76,175,80,0.16) 0%,transparent 65%)', animation: 'ay-orbFloat 10s ease-in-out -4s infinite' }} />
      <div aria-hidden="true" style={S.mesh} />

      <div style={S.card}>
        {/* logo + title row */}
        <div style={S.logoRow}>
          <div aria-hidden="true" style={S.logoRing}>
            <div style={S.logoInner}>
              <img src={logo} alt="AIVA" style={{ width: '62%', height: '62%', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={S.h1}>Reset Password</h1>
        </div>

        {/* step indicator */}
        <div style={S.stepRow}>
          {steps.map(s => (
            <span key={s} style={{ ...S.stepDot, ...(step >= s ? S.stepDotActive : {}), ...(step === s ? S.stepDotCurrent : {}) }} />
          ))}
        </div>

        <div style={S.divider} />

        {error && (
          <div role="alert" style={S.errorBox}>
            <span style={{ flexShrink: 0, lineHeight: 1 }}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13.5 12H1.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 6v3M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" style={S.noticeBox}>
            <span style={{ flexShrink: 0, lineHeight: 1 }}><svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span>{notice}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={requestCode}>
            <p style={S.hint}>Enter your username and we'll send a 6-digit reset code to the email registered on your account.</p>
            <label style={S.label}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusField('u')} onBlur={() => setFocusField(null)}
              placeholder="Your username" style={inputStyle('u', { marginBottom: '1.1rem' })} disabled={loading} autoFocus />
            <button type="submit" disabled={loading} className="ay-fp-btn" style={{ ...S.btn, ...(loading ? S.btnBusy : {}) }}>
              {loading ? (<><Spinner /><span>Sending…</span></>) : <span>Send Reset Code</span>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitReset}>
            <p style={S.hint}>Enter the 6-digit code sent to <strong style={{ color: '#374151' }}>{maskedEmail}</strong> and choose a new password.</p>
            <label style={S.label}>6-Digit Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onFocus={() => setFocusField('c')} onBlur={() => setFocusField(null)}
              placeholder="123456" inputMode="numeric"
              style={inputStyle('c', { marginBottom: '1rem', fontSize: '1.1rem', letterSpacing: '0.5em', fontWeight: 600 })} disabled={loading} autoFocus />
            <label style={S.label}>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              onFocus={() => setFocusField('p')} onBlur={() => setFocusField(null)}
              placeholder="Choose a new password" style={inputStyle('p', { marginBottom: '1.1rem' })} disabled={loading} />
            <button type="submit" disabled={loading} className="ay-fp-btn" style={{ ...S.btn, ...(loading ? S.btnBusy : {}) }}>
              {loading ? (<><Spinner /><span>Resetting…</span></>) : <span>Reset Password</span>}
            </button>
            <button type="button" onClick={() => { setStep(1); setError(''); setNotice(''); }} style={S.linkBtn}>
              Didn't get a code? Try again
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={S.successCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5 11-11" stroke="#047857" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p style={S.successText}>Password reset! You can now sign in with your new password.</p>
            <button type="button" onClick={onBack} className="ay-fp-btn" style={S.btn}><span>Back to Sign In</span></button>
          </div>
        )}

        {step !== 3 && (
          <button type="button" onClick={onBack} style={S.linkBtn}>← Back to Sign In</button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'ay-spin 0.65s linear infinite', flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,0.28)" strokeWidth="1.75"/>
      <path d="M8 1.5A6.5 6.5 0 0 1 14.5 8" stroke="white" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  );
}

const KEYFRAMES = `
@keyframes ay-gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes ay-orbFloat{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(18px,-22px) scale(1.06) rotate(2deg)}50%{transform:translate(-12px,-36px) scale(0.96) rotate(-1deg)}75%{transform:translate(-20px,-10px) scale(1.03) rotate(1deg)}}
@keyframes ay-orbFloatB{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-16px,-28px) scale(1.04)}66%{transform:translate(24px,-14px) scale(0.97)}}
@keyframes ay-ringRotate{to{transform:rotate(360deg)}}
@keyframes ay-spin{to{transform:rotate(360deg)}}
@keyframes ay-scaleIn{from{opacity:0;transform:scale(0.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes ay-pop{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}
.ay-fp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 40px rgba(21,101,192,0.48);filter:brightness(1.10)}
`;

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: '#050D1A' },
  gradBg: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(135deg,#070F1E 0%,#0A1F3D 35%,#0D3470 65%,#1565C0 100%)', backgroundSize: '300% 300%', animation: 'ay-gradShift 12s ease infinite', opacity: 0.95 },
  orb: { position: 'absolute', borderRadius: '50%', pointerEvents: 'none', willChange: 'transform' },
  mesh: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)' },
  card: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', borderRadius: 22, padding: '2.5rem 2.25rem 2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06)', animation: 'ay-scaleIn 0.48s cubic-bezier(0.23,1,0.32,1) both' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.1rem' },
  logoRing: { position: 'relative', width: 52, height: 52, flexShrink: 0, borderRadius: '50%', padding: 2.5, background: 'conic-gradient(from 0deg,#1565C0 0deg,#2196F3 90deg,#FF6B2B 180deg,#E65100 270deg,#1565C0 360deg)', animation: 'ay-ringRotate 3.2s linear infinite' },
  logoInner: { width: '100%', height: '100%', borderRadius: '50%', background: '#F1F5FB', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#07111F', letterSpacing: '-0.03em', lineHeight: 1.15 },
  stepRow: { display: 'flex', gap: '0.4rem', marginBottom: '1.2rem' },
  stepDot: { height: 4, flex: 1, borderRadius: 99, background: '#E5E7EB', transition: 'background 200ms' },
  stepDotActive: { background: '#93C5FD' },
  stepDotCurrent: { background: '#1565C0' },
  divider: { height: 1, background: 'linear-gradient(90deg,transparent,#E5E7EB 25%,#E5E7EB 75%,transparent)', marginBottom: '1.4rem' },
  hint: { fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.55, marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.85rem 1.5rem', background: 'linear-gradient(135deg,#1565C0 0%,#2196F3 100%)', color: '#fff', border: 'none', borderRadius: 11, fontSize: '0.92rem', fontWeight: 650, fontFamily: 'inherit', letterSpacing: '0.01em', cursor: 'pointer', boxShadow: '0 4px 20px rgba(21,101,192,0.40)', transition: 'transform 80ms cubic-bezier(0.34,1.28,0.64,1), box-shadow 220ms, filter 220ms' },
  btnBusy: { opacity: 0.8, cursor: 'not-allowed' },
  linkBtn: { width: '100%', marginTop: '0.8rem', background: 'none', border: 'none', color: '#1565C0', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', color: '#B91C1C', padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, border: '1px solid #FECACA', lineHeight: 1.4, marginBottom: '1rem' },
  noticeBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ECFDF5', color: '#047857', padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, border: '1px solid #A7F3D0', lineHeight: 1.45, marginBottom: '1rem' },
  successCircle: { width: 60, height: 60, borderRadius: '50%', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', animation: 'ay-pop 0.4s cubic-bezier(0.34,1.28,0.64,1) both' },
  successText: { fontSize: '0.9rem', color: '#374151', lineHeight: 1.55, marginBottom: '1.3rem' },
};