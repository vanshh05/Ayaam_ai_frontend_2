import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function ForgotPassword({ onBack }) {
  const [step,     setStep]     = useState(1); // 1 = enter username, 2 = code + new pw, 3 = done
  const [username, setUsername] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code,     setCode]     = useState('');
  const [newPw,    setNewPw]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [notice,   setNotice]   = useState('');

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

  return (
    <div style={S.page}>
      <div style={S.gradBg} aria-hidden="true" />
      <div style={S.card} className="login-card">
        <div style={S.title}>Reset Password</div>

        {error  && <div style={S.errorBox}>{error}</div>}
        {notice && <div style={S.noticeBox}>{notice}</div>}

        {step === 1 && (
          <form onSubmit={requestCode}>
            <p style={S.hint}>Enter your username and we'll send a 6-digit reset code to the email registered on your account.</p>
            <label style={S.label}>Username</label>
            <input
              style={S.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              disabled={loading}
              autoFocus
            />
            <button type="submit" style={S.btn} className="login-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitReset}>
            <p style={S.hint}>Enter the 6-digit code sent to <strong>{maskedEmail}</strong> and choose a new password.</p>
            <label style={S.label}>6-Digit Code</label>
            <input
              style={S.input}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              disabled={loading}
              autoFocus
            />
            <label style={S.label}>New Password</label>
            <input
              style={S.input}
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Choose a new password"
              disabled={loading}
            />
            <button type="submit" style={S.btn} className="login-btn" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
            <button type="button" style={S.linkBtn} onClick={() => { setStep(1); setError(''); setNotice(''); }}>
              Didn't get a code? Try again
            </button>
          </form>
        )}

        {step === 3 && (
          <button type="button" style={S.btn} className="login-btn" onClick={onBack}>
            Back to Sign In
          </button>
        )}

        {step !== 3 && (
          <button type="button" style={S.linkBtn} onClick={onBack}>
            ← Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden', padding: '1.25rem', background: '#050D1A',
  },
  gradBg: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(135deg, #070F1E 0%, #0A1F3D 35%, #0D3470 65%, #1565C0 100%)',
    backgroundSize: '300% 300%', animation: 'gradShift 12s ease infinite', opacity: 0.95,
  },
  card: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: 400,
    background: 'rgba(255,255,255,0.98)', borderRadius: 22, padding: '2.25rem',
    boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
  },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#07111F', marginBottom: '1.2rem', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  hint: { fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5, marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '0.72rem 0.9rem', fontSize: '0.9rem',
    border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', background: '#F9FAFB',
    color: '#07111F', marginBottom: '1rem', fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '0.85rem 1.5rem', background: 'linear-gradient(135deg,#1565C0,#2196F3)',
    color: '#fff', border: 'none', borderRadius: 11, fontSize: '0.94rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 20px rgba(21,101,192,0.4)',
  },
  linkBtn: {
    width: '100%', marginTop: '0.8rem', background: 'none', border: 'none', color: '#1565C0',
    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  errorBox: {
    background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
    padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, marginBottom: '1rem',
  },
  noticeBox: {
    background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
    padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, marginBottom: '1rem',
  },
};