import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

// Detail-modal timestamp: label by status; value formatted as wall-clock (no timezone shift).
const tsLabelFor = (item) => {
  const st = String(item && item.item_status ? item.item_status : '').toLowerCase();
  if (st === 'reserved') return 'Reserved on';
  if (st === 'dispatch' || st === 'dispatched') return 'Dispatched on';
  return '';
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDateTime = (s) => {
  if (!s) return '';
  const m = String(s).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})/);
  if (!m) return String(s);
  let h = parseInt(m[4], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}, ${h}:${m[5]} ${ap}`;
};

// Search filter: match item name + every spec value (case-insensitive substring).
const matchesQuery = (item, q) => {
  if (!q) return true;
  const hay = [item.item_name || '', ...Object.values(item.specs || {})].join(' ').toLowerCase();
  return hay.includes(q);
};

/**
 * Dealer portal (web) — plain REST, no AI. Full parity with the mobile
 * DealerStockScreen: the Available pool for the dealer's company plus the
 * dealer's own Reserved units, with single and multi-select reserve /
 * un-reserve. First tap wins; bulk actions are best-effort — units snatched
 * between load and tap are reported, the rest go through.
 *
 *   GET  /api/dealer/stock
 *   POST /api/dealer/reserve         { chassis_no }
 *   POST /api/dealer/unreserve       { chassis_no }
 *   POST /api/dealer/reserve-bulk    { chassis_nos: [...] }
 *   POST /api/dealer/unreserve-bulk  { chassis_nos: [...] }
 */
export default function DealerStock({ user, onLogout, onAuthError }) {
  const [tab, setTab]           = useState('available'); // 'available' | 'reserved'
  const [available, setAvailable]       = useState([]);
  const [reservations, setReservations] = useState([]);
  const [dispatched, setDispatched]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState([]);    // chassis_no[] in the current tab
  const [toast, setToast]       = useState(null);  // { ok, text }
  const [detailItem, setDetailItem] = useState(null); // item whose details modal is open
  const [query, setQuery]       = useState('');       // search text (filters the current tab)

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
    setTimeout(() => setToast(null), 3200);
  };

  const clearSelection = () => setSelected([]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/api/dealer/stock`, authHeader);
      if (res.data && res.data.success) {
        setAvailable(res.data.available || []);
        setReservations(res.data.my_reservations || []);
        setDispatched(res.data.dispatched || []);
      } else {
        setError((res.data && res.data.message) || 'Could not load stock.');
      }
    } catch (e) {
      if (isAuthErr(e)) return;
      setError('Could not load stock. ' + (e.response?.data?.message || ''));
    } finally {
      setLoading(false);
      setSelected([]); // selection never survives a reload
    }
  }, [user.token]);

  useEffect(() => { load(); }, [load]);

  const switchTab = (t) => { setTab(t); clearSelection(); setQuery(''); };

  const toggle = (chassis) =>
    setSelected(prev => (prev.includes(chassis) ? prev.filter(x => x !== chassis) : [...prev, chassis]));

  // ── bulk actions ──
  const runBulk = async () => {
    const reservedTab = tab === 'reserved';
    const chassis = [...selected];
    const n = chassis.length;
    if (n === 0) return;

    const ok = window.confirm(
      reservedTab
        ? `Un-reserve ${n} unit${n > 1 ? 's' : ''}? They return to the available pool for everyone.`
        : `Reserve ${n} unit${n > 1 ? 's' : ''}? Any just taken by another dealer will be skipped.`
    );
    if (!ok) return;

    setBulkBusy(true);
    try {
      if (reservedTab) {
        const res = await axios.post(`${API_URL}/api/dealer/unreserve-bulk`, { chassis_nos: chassis }, authHeader);
        const d = res.data || {};
        flash((d.unreserved_count || 0) > 0, `Cancelled ${d.unreserved_count || 0}` + (d.failed_count ? ` · ${d.failed_count} not found` : ''));
      } else {
        const res = await axios.post(`${API_URL}/api/dealer/reserve-bulk`, { chassis_nos: chassis }, authHeader);
        const d = res.data || {};
        flash((d.reserved_count || 0) > 0, `Reserved ${d.reserved_count || 0}` + (d.failed_count ? ` · ${d.failed_count} just taken` : ''));
      }
      await load();
    } catch (e) {
      if (!isAuthErr(e)) flash(false, `Could not ${reservedTab ? 'un-reserve' : 'reserve'}. Try again.`);
    } finally { setBulkBusy(false); }
  };

  const list = tab === 'available' ? available : tab === 'reserved' ? reservations : dispatched;
  const reservedTab = tab === 'reserved';
  const q = query.trim().toLowerCase();
  const shown = q ? list.filter((it) => matchesQuery(it, q)) : list;
  const allSelected = shown.length > 0 && shown.every((it) => selected.includes(it.chassis_no));
  const selectable = tab !== 'dispatched';
  const showTs = tab === 'reserved' || tab === 'dispatched';
  const tsHeader = tab === 'dispatched' ? 'Dispatched on' : 'Reserved on';
  // Table columns: every populated spec label across the full tab (stable while searching),
  // excluding chassis (chassis stays hidden on the dashboard; shown in the View details modal).
  const specCols = [];
  list.forEach((it) => {
    Object.keys(it.specs || {}).forEach((label) => {
      if (!/chassis/i.test(label) && !specCols.includes(label)) specCols.push(label);
    });
  });

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

      <div style={{ ...S.body, paddingBottom: selected.length > 0 ? 96 : 24 }}>
        {/* Tabs + refresh */}
        <div style={S.controls}>
          <div style={S.segRow}>
            <button style={{ ...S.seg, ...(tab === 'available' ? S.segOn : {}) }} onClick={() => switchTab('available')}>
              Available <span style={S.segCount}>{available.length}</span>
            </button>
            <button style={{ ...S.seg, ...(tab === 'reserved' ? S.segOn : {}) }} onClick={() => switchTab('reserved')}>
              Reserved <span style={S.segCount}>{reservations.length}</span>
            </button>
            <button style={{ ...S.seg, ...(tab === 'dispatched' ? S.segOn : {}) }} onClick={() => switchTab('dispatched')}>
              Dispatched <span style={S.segCount}>{dispatched.length}</span>
            </button>
          </div>
          <input
            style={S.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === 'reserved' ? 'reservations' : tab}…`}
          />
          <button style={S.refreshBtn} onClick={load} disabled={loading || bulkBusy}>
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
            {tab === 'dispatched'
              ? 'Nothing has been dispatched to you yet.'
              : reservedTab
              ? 'You have no reservations yet. Reserve a unit from the Available tab.'
              : 'No units available for your company right now.'}
          </div>
        ) : shown.length === 0 ? (
          <div style={S.empty}>No items match your search.</div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {selectable && (
                    <th style={{ ...S.th, width: 36, textAlign: 'center' }}>
                      <span
                        style={{ ...S.checkbox, ...(allSelected ? S.checkboxOn : {}), display: 'inline-flex', cursor: 'pointer' }}
                        onClick={() => (allSelected ? clearSelection() : setSelected(shown.map(i => i.chassis_no)))}
                      >{allSelected ? '✓' : ''}</span>
                    </th>
                  )}
                  <th style={S.th}>Item</th>
                  {specCols.map((label) => <th key={label} style={S.th}>{label}</th>)}
                  {showTs && <th style={S.th}>{tsHeader}</th>}
                  <th style={{ ...S.th, textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item, i) => {
                  const checked = selected.includes(item.chassis_no);
                  return (
                    <tr
                      key={item.chassis_no || i}
                      style={{ ...S.tr, ...(checked ? S.trChecked : {}), cursor: selectable ? 'pointer' : 'default' }}
                      onClick={() => { if (selectable && !bulkBusy) toggle(item.chassis_no); }}
                    >
                      {selectable && (
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          <span style={{ ...S.checkbox, ...(checked ? S.checkboxOn : {}), display: 'inline-flex' }}>{checked ? '✓' : ''}</span>
                        </td>
                      )}
                      <td style={{ ...S.td, fontWeight: 700, color: '#0D1B2A' }}>{item.item_name || 'Item'}</td>
                      {specCols.map((label) => (
                        <td key={label} style={S.td}>
                          {item.specs && item.specs[label] != null && String(item.specs[label]).trim() !== '' ? String(item.specs[label]) : '—'}
                        </td>
                      ))}
                      {showTs && <td style={S.td}>{formatDateTime(item.last_updated_date) || '—'}</td>}
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <button
                          style={{ ...S.detailsBtn, marginTop: 0 }}
                          onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                        >
                          View details ›
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky bulk action bar */}
      {selected.length > 0 && !loading && !error && tab !== 'dispatched' && (
        <div style={S.bulkBar}>
          <div style={S.bulkInner}>
            <span style={S.bulkCount}>{selected.length} selected</span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button style={S.bulkClear} onClick={clearSelection} disabled={bulkBusy}>Clear</button>
              <button
                style={{ ...S.bulkBtn, ...(reservedTab ? S.bulkBtnCancel : S.bulkBtnReserve), ...(bulkBusy ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                onClick={runBulk}
                disabled={bulkBusy}
              >
                {bulkBusy ? 'Working…' : reservedTab ? `Un-reserve ${selected.length}` : `Reserve ${selected.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div style={S.detailOverlay} onClick={() => setDetailItem(null)}>
          <div style={S.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={S.detailHead}>
              <span style={S.detailHeadTitle}>Item details</span>
              <button style={S.detailClose} onClick={() => setDetailItem(null)}>✕</button>
            </div>
            <div style={S.detailName}>{detailItem.item_name || 'Item'}</div>
            {(() => {
              const st = String(detailItem.item_status || '').toLowerCase();
              const isD = st === 'dispatch' || st === 'dispatched';
              const isR = st === 'reserved';
              return (
                <span style={{
                  ...S.statusPill,
                  ...(isD ? S.pillDispatched : isR ? S.pillReserved : S.pillAvailable),
                  display: 'inline-block', marginTop: '0.5rem', marginBottom: '1rem',
                }}>
                  {detailItem.item_status || '—'}
                </span>
              );
            })()}
            {tsLabelFor(detailItem) && detailItem.last_updated_date ? (
              <div style={{ ...S.detailRow, marginBottom: '0.4rem' }}>
                <span style={S.detailLabel}>{tsLabelFor(detailItem)}</span>
                <span style={S.detailValue}>{formatDateTime(detailItem.last_updated_date)}</span>
              </div>
            ) : null}
            <div style={S.detailList}>
              {Object.keys(detailItem.specs || {}).length === 0 ? (
                <div style={S.detailEmpty}>No specifications recorded for this item.</div>
              ) : (
                Object.keys(detailItem.specs).map((label) => (
                  <div key={label} style={S.detailRow}>
                    <span style={S.detailLabel}>{label}</span>
                    <span style={S.detailValue}>{String(detailItem.specs[label])}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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

  body: { maxWidth: 'none', margin: 0, padding: '1.25rem 1.5rem' },

  controls: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap',
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
  search: {
    flex: '1 1 220px', minWidth: 180, maxWidth: 420,
    padding: '0.55rem 0.9rem', border: '1px solid #CBD5E1', borderRadius: 9,
    fontSize: '0.86rem', fontFamily: 'inherit', color: '#0D1B2A', background: '#fff', outline: 'none',
  },

  selRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  selAll: {
    background: 'none', border: 'none', color: '#1565C0', fontSize: '0.82rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  },
  selCount: { fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 },

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
    display: 'flex', flexDirection: 'column', cursor: 'pointer',
    border: '2px solid transparent', transition: 'border-color 120ms, background 120ms',
  },
  cardChecked: { border: '2px solid #2196F3', background: '#F5FAFF' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: '0.7rem' },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, border: '2px solid #CBD5E1', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '0.8rem', fontWeight: 900, marginTop: 2,
  },
  checkboxOn: { background: '#1565C0', border: '2px solid #1565C0' },
  itemName: { fontSize: '0.98rem', fontWeight: 800, color: '#0D1B2A', lineHeight: 1.3 },
  chassis: { fontSize: '0.8rem', fontWeight: 700, color: '#1565C0', marginTop: 4, letterSpacing: '0.02em' },
  cardColor: { fontSize: '0.84rem', fontWeight: 700, color: '#475569', marginTop: 4 },
  statusPill: { fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 99, whiteSpace: 'nowrap' },
  pillAvailable: { background: '#DCFCE7', color: '#15803D' },
  pillReserved: { background: '#FFEDD5', color: '#C2410C' },
  pillDispatched: { background: '#DBEAFE', color: '#1D4ED8' },

  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  th: { textAlign: 'center', padding: '0.7rem 0.9rem', background: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #E2E8F0' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  trChecked: { background: '#F5FAFF' },
  td: { padding: '0.6rem 0.9rem', color: '#334155', verticalAlign: 'middle' },

  specWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.9rem 0 0', paddingLeft: '1.9rem' },
  specChip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    background: '#F1F5F9', borderRadius: 7, padding: '0.22rem 0.55rem', border: '1px solid #E2E8F0',
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

  bulkBar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 900,
    background: '#fff', borderTop: '1px solid #E2E8F0', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
  },
  bulkInner: {
    maxWidth: 'none', margin: 0, padding: '0.9rem 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
  },
  bulkCount: { fontSize: '0.9rem', fontWeight: 700, color: '#0D1B2A' },
  bulkClear: {
    background: '#fff', border: '1px solid #CBD5E1', color: '#475569',
    padding: '0.6rem 1.1rem', borderRadius: 10, fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  bulkBtn: {
    border: 'none', borderRadius: 10, padding: '0.6rem 1.5rem',
    fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  },
  bulkBtnReserve: { background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff' },
  bulkBtnCancel: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' },

  detailsBtn: {
    marginTop: '0.9rem', alignSelf: 'flex-start', background: 'none', border: 'none',
    color: '#1565C0', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  },
  detailOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
  },
  detailModal: {
    background: '#fff', borderRadius: 14, padding: '1.6rem', width: '100%', maxWidth: 460,
    maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
  },
  detailHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' },
  detailHeadTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#0D1B2A' },
  detailClose: { background: 'none', border: 'none', fontSize: '1.1rem', color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 },
  detailName: { fontSize: '1.05rem', fontWeight: 800, color: '#0D1B2A', lineHeight: 1.3 },
  detailList: { marginTop: '0.4rem' },
  detailEmpty: { color: '#94A3B8', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center' },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', gap: '1rem',
    padding: '0.7rem 0', borderBottom: '1px solid #F1F5F9',
  },
  detailLabel: { fontSize: '0.82rem', fontWeight: 600, color: '#64748B' },
  detailValue: { fontSize: '0.84rem', fontWeight: 700, color: '#0D1B2A', textAlign: 'right' },
};