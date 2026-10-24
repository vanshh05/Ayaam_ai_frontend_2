import React, { useState, useEffect, useRef, useCallback } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import DealerStock from './components/DealerStock';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export default function App() {
  const [user, setUser] = useState(null);
  const [logoutReason, setLogoutReason] = useState(null); // message shown on the login screen
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('ayaam_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.removeItem('ayaam_user'); }
    }
  }, []);

  const doLogout = useCallback((reason) => {
    localStorage.removeItem('ayaam_user');
    localStorage.removeItem('ayaam_last_activity');
    setUser(null);
    if (reason) setLogoutReason(reason);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('ayaam_user', JSON.stringify(userData));
    localStorage.setItem('ayaam_last_activity', Date.now().toString());
    setLogoutReason(null);
    setUser(userData);
  };

  const handleLogout = useCallback(() => { doLogout(null); }, [doLogout]);

  // Called by Chat when the server rejects the token (401) — could be expiry or
  // another device taking over the session.
  const handleAuthError = useCallback(() => {
    doLogout('You have been signed out because your account was used to sign in on another device, or your session expired.');
  }, [doLogout]);

  // ── Feature 1: auto-logout after 30 min of inactivity ──
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      localStorage.setItem('ayaam_last_activity', Date.now().toString());
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        doLogout('You were signed out after 30 minutes of inactivity. Please sign in again.');
      }, INACTIVITY_LIMIT_MS);
    };

    // Any of these interactions counts as activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    // On mount / when returning to the tab, check if we already exceeded the limit while away
    const checkStale = () => {
      const last = parseInt(localStorage.getItem('ayaam_last_activity') || '0', 10);
      if (last && Date.now() - last >= INACTIVITY_LIMIT_MS) {
        doLogout('You were signed out after 30 minutes of inactivity. Please sign in again.');
      } else {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkStale();
    });

    checkStale(); // run once now

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, doLogout]);

  if (!user) {
    return <Login onLogin={handleLogin} logoutReason={logoutReason} />;
  }

  // Dealers get the stock/reservation portal; everyone else gets the AIVA chat.
  const isDealer = String(user.role || '').toUpperCase() === 'DEALER';
  return isDealer
    ? <DealerStock user={user} onLogout={handleLogout} onAuthError={handleAuthError} />
    : <Chat user={user} onLogout={handleLogout} onAuthError={handleAuthError} />;
}