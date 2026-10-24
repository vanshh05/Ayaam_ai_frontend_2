import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Dealer portal (web) — plain REST, no AI. Full parity with the mobile
 * DealerStockScreen: the Available pool for the dealer's company plus the
 * dealer's own Reserved units, with reserve / un-reserve. First tap wins —
 * every action re-reads the server, which is the single source of truth.
 *
 *   GET  /api/dealer/stock
 *   POST /api/dealer/reserve    { chassis_no }
 *   POST /api/dealer/unreserve  { chassis_no }
 */
export default function DealerStock({ user, onLogout, onAuthError }) {
  const [tab, setTab]           = useState('available'); // 'available' | 'reserved'
  const [available, setAvailable]       = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [acting, setActing]     = useState(null); // chassis_no in-flight
  const [toast, setToast]       = useState(null); // { ok, text }

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };
  const isAuthErr = (e) => e && e.response && (e.response.status === 401 || e.response.status === 403);

  // 401/403 → global logout, same behaviour as Chat.
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          if (onAuthError) onAuthError(); else onLogout();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [onLogout, onAuthError]);

  const flash = (ok, text) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/api/dealer/stock`, authHeader);
      if (res.data && res.data.success) {
        setAvailable(res.data.available || []);
        setReservations(res.data.my_reservations || []);
      } else {
        setError((res.data && res.data.message) || 'Could not load stock.');
      }
    } catch (e) {
      if (isAuthErr(e)) return;
      setError('Could not load stock. ' + (e.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { load(); }, [load]);

  const reserve = async (item) => {
    setActing(item.chassis_no);
    try {
      const res = await axios.post(`${API_URL}/api/dealer/reserve`, { chassis_no: item.chassis_no }, authHeader);
      if (res.data && res.data.success) flash(true, 'Reserved.');
      else flash(false, (res.data && res.data.message) || 'Could not reserve.');
      await load(); // refresh either way — someone may have taken it first
    } catch (e) {
      if (!isAuthErr(e)) flash(false, 'Could not reserve. Try again.');
    } finally { setActing(null); }
  };

  const unreserve = async (item) => {
    const ok = window.confirm(
      `Cancel the reservation on ${item.item_name} (chassis ${item.chassis_no})?\n\nIt returns to the available pool for everyone.`
    );
    if (!ok) return;
    setActing(item.chassis_no);
    try {
      const res = await axios.post(`${API_URL}/api/dealer/unreserve`, { chassis_no: item.chassis_no }, authHeader);
      if (res.data && res.data.success) flash(true, 'Reservation cancelled.');
      else flash(false, (res.data && res.data.message) || 'Could not un-reserve.');
      await load();
    } catch (e) {
      if (!isAuthErr(e)) flash(false, 'Could not un-reserve. Try again.');
    } finally { setActing(null); }
  };

  const list = tab === 'available' ? available : reservations;
  const reservedTab = tab === 'reserved';

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.brandWrap}>
          <div style={S.brandMark}>A</div>
          <div>
            <div style={S.brandTitle}>Dealer Portal</div>
            <div style={S.brandSub}>{user.company_name || user.company_id || 'AYAAM ERP'}</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <span style={S.signedIn}>{user.name || user.username}</span>
          <button style={S.logoutBtn} onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div style={S.body}>
        {/* Tabs + refresh */}
        <div style={S.controls}>
          <div style={S.segRow}>
            <button
              style={{ ...S.seg, ...(tab === 'available' ? S.segOn : {}) }}
              onClick={() => setTab('available')}
            >
              Available <span style={S.segCount}>{available.length}</span>
            </button>
            <button
              style={{ ...S.seg, ...(tab === 'reserved' ? S.segOn : {}) }}
              onClick={() => setTab('reserved')}
            >
              My Reservations <span style={S.segCount}>{reservations.length}</span>
            </button>
          </div>
          <button style={S.refreshBtn} onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ ...S.toast, ...(toast.ok ? S.toastOk : S.toastErr) }}>{toast.text}</div>
        )}

        {/* Content */}
        {loading ? (
          <div style={S.muted}>Loading stock…</div>
        ) : error ? (
          <div style={S.errorBox}>
            {error}
            <button style={S.retryInline} onClick={load}>Retry</button>
          </div>
        ) : list.length === 0 ? (
          <div style={S.empty}>
            {reservedTab
              ? 'You have no reservations yet. Reserve a unit from the Available tab.'
              : 'No units available for your company right now.'}
          </div>
        ) : (
          <div style={S.grid}>
            {list.map((item, i) => {
              const busy = acting === item.chassis_no;
              const specs = item.specs || {};
              return (
                <div key={item.chassis_no || i} style={S.card}>
                  <div style={S.cardTop}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={S.itemName}>{item.item_name || 'Item'}</div>
                      <div style={S.chassis}>⬡ {item.chassis_no}</div>
                    </div>
                    <span style={{ ...S.statusPill, ...(reservedTab ? S.pillReserved : S.pillAvailable) }}>
                      {reservedTab ? 'Reserved' : 'Available'}
                    </span>
                  </div>

                  <div style={S.specWrap}>
                    {Object.keys(specs).map((label) => {
                      const isChassis = label.toLowerCase().includes('chassis');
                      return (
                        <span key={label} style={{ ...S.specChip, ...(isChassis ? S.specChipKey : {}) }}>
                          <span style={S.specLabel}>{label}</span>
                          <span style={{ ...S.specValue, ...(isChassis ? { color: '#0D1B2A' } : {}) }}>
                            {String(specs[label])}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  <button
                    style={{
                      ...S.actBtn,
                      ...(reservedTab ? S.actBtnCancel : S.actBtnReserve),
                      ...(busy ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                    }}
                    onClick={() => (reservedTab ? unreserve(item) : reserve(item))}
                    disabled={busy}
                  >
                    {busy ? 'Working…' : reservedTab ? 'Un-reserve' : 'Reserve'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter','Segoe UI',sans-serif" },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.9rem 1.5rem', background: '#0D1B2A', color: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  brandWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  brandMark: {
    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
    background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  brandTitle: { fontSize: '1.02rem', fontWeight: 700, letterSpacing: '0.01em' },
  brandSub: { fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.9rem' },
  signedIn: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' },
  logoutBtn: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', padding: '0.45rem 0.9rem', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
  },

  body: { maxWidth: 1100, margin: '0 auto', padding: '1.5rem' },

  controls: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap',
  },
  segRow: { display: 'flex', gap: '0.5rem', background: '#E8EEF6', padding: 4, borderRadius: 12 },
  seg: {
    border: 'none', background: 'transparent', color: '#475569',
    padding: '0.55rem 1.1rem', borderRadius: 9, fontSize: '0.86rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.45rem',
  },
  segOn: { background: '#fff', color: '#1565C0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  segCount: {
    background: '#EFF6FF', color: '#1565C0', borderRadius: 99, padding: '0.05rem 0.5rem',
    fontSize: '0.74rem', fontWeight: 800,
  },
  refreshBtn: {
    background: '#fff', border: '1px solid #CBD5E1', color: '#1565C0',
    padding: '0.55rem 1.1rem', borderRadius: 9, fontSize: '0.84rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },

  toast: {
    padding: '0.65rem 1rem', borderRadius: 9, marginBottom: '1rem',
    fontSize: '0.85rem', fontWeight: 700,
  },
  toastOk: { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' },
  toastErr: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },

  muted: { color: '#94A3B8', fontSize: '0.9rem', padding: '2rem 0', textAlign: 'center' },
  empty: {
    color: '#94A3B8', fontSize: '0.9rem', padding: '3rem 1.5rem', textAlign: 'center',
    background: '#fff', borderRadius: 14, border: '1px dashed #CBD5E1', lineHeight: 1.6,
  },
  errorBox: {
    background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
    padding: '0.8rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  retryInline: {
    marginLeft: 'auto', background: '#fff', border: '1px solid #FCA5A5', color: '#DC2626',
    padding: '0.35rem 0.9rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
  card: {
    background: '#fff', borderRadius: 14, padding: '1.2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column',
  },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },
  itemName: { fontSize: '0.98rem', fontWeight: 800, color: '#0D1B2A', lineHeight: 1.3 },
  chassis: { fontSize: '0.8rem', fontWeight: 700, color: '#1565C0', marginTop: 4, letterSpacing: '0.02em' },
  statusPill: { fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 99, whiteSpace: 'nowrap' },
  pillAvailable: { background: '#DCFCE7', color: '#15803D' },
  pillReserved: { background: '#FFEDD5', color: '#C2410C' },

  specWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.9rem 0 0' },
  specChip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    background: '#F1F5F9', borderRadius: 7, padding: '0.22rem 0.55rem',
    border: '1px solid #E2E8F0',
  },
  specChipKey: { background: '#EFF6FF', border: '1px solid #BFDBFE' },
  specLabel: { fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8' },
  specValue: { fontSize: '0.74rem', fontWeight: 700, color: '#475569' },

  actBtn: {
    marginTop: '1.1rem', width: '100%', border: 'none', borderRadius: 10,
    padding: '0.7rem', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },
  actBtnReserve: { background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff' },
  actBtnCancel: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' },
};