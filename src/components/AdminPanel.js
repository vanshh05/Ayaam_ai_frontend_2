import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const EMPTY_FORM = {
  username: '', password: '', full_name: '', email: '',
  company_id: '', company_name: '', role: 'Owner', party_id: '',
};

export default function AdminPanel({ user, onBack }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [notice,   setNotice]   = useState('');
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [saving,   setSaving]   = useState(false);
  const [resetUser, setResetUser] = useState(null);   // user whose password is being reset
  const [resetPw,   setResetPw]   = useState('');
  const [resetting, setResetting] = useState(false);
  const [companies, setCompanies] = useState([]);     // distinct company_ids from the data

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const flashNotice = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, authHeader);
      if (res.data.success) setUsers(res.data.users || []);
      else setError(res.data.message || 'Failed to load users.');
    } catch (e) {
      setError('Could not load users. ' + (e.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadCompanies = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/companies`, authHeader);
      if (res.data.success) setCompanies(res.data.companies || []);
    } catch (e) { /* leave empty on failure */ }
  }, [user.token]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username,           // shown read-only while editing
      password: '',                   // blank = keep existing
      full_name: u.full_name || '',
      email: u.email || '',
      company_id: u.company_id || '',
      company_name: u.company_name || '',
      role: u.role || 'Owner',
      party_id: u.party_id != null ? String(u.party_id) : '',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); setError(''); };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');

    if (editingId === null) {
      // Create
      if (!form.username.trim() || !form.password || !form.company_id.trim()) {
        setError('Username, password and company ID are required.');
        return;
      }
    } else {
      if (!form.company_id.trim()) { setError('Company ID is required.'); return; }
    }

    if (form.role === 'Dealer') {
      const pid = form.party_id.trim();
      if (!pid) { setError('Party ID is required for dealer accounts.'); return; }
      if (!/^\d+$/.test(pid)) { setError('Party ID must be a number.'); return; }
    }

    setSaving(true);
    try {
      if (editingId === null) {
        const res = await axios.post(`${API_URL}/api/admin/users`, {
          username:     form.username.trim(),
          password:     form.password,
          full_name:    form.full_name.trim(),
          email:        form.email.trim(),
          company_id:   form.company_id.trim(),
          company_name: form.company_name.trim(),
          role:         form.role,
          party_id:     form.role === 'Dealer' ? form.party_id.trim() : '',
        }, authHeader);
        if (res.data.success) { flashNotice('User created.'); setForm(EMPTY_FORM); loadUsers(); }
        else setError(res.data.message || 'Could not create user.');
      } else {
        const body = {
          full_name:    form.full_name.trim(),
          email:        form.email.trim(),
          company_id:   form.company_id.trim(),
          company_name: form.company_name.trim(),
          role:         form.role,
          party_id:     form.role === 'Dealer' ? form.party_id.trim() : '',
        };
        if (form.password) body.password = form.password; // only reset if typed
        const res = await axios.put(`${API_URL}/api/admin/users/${editingId}`, body, authHeader);
        if (res.data.success) { flashNotice('User updated.'); cancelEdit(); loadUsers(); }
        else setError(res.data.message || 'Could not update user.');
      }
    } catch (e2) {
      setError(e2.response?.data?.message || 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    try {
      const res = await axios.patch(`${API_URL}/api/admin/users/${u.id}/status`,
        { is_active: !u.is_active }, authHeader);
      if (res.data.success) { flashNotice(u.is_active ? 'User disabled.' : 'User enabled.'); loadUsers(); }
      else setError(res.data.message || 'Could not change status.');
    } catch (e) {
      setError(e.response?.data?.message || 'Request failed.');
    }
  };

  const deleteUser = async (u) => {
    if (u.username === user.username) { setError("You can't delete the account you're signed in with."); return; }
    const ok = window.confirm(`Permanently delete user "${u.username}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const res = await axios.delete(`${API_URL}/api/admin/users/${u.id}`, authHeader);
      if (res.data.success) { flashNotice('User deleted.'); if (editingId === u.id) cancelEdit(); loadUsers(); }
      else setError(res.data.message || 'Could not delete user.');
    } catch (e) {
      setError(e.response?.data?.message || 'Request failed.');
    }
  };

  const openReset  = (u) => { setResetUser(u); setResetPw(''); setError(''); };
  const closeReset = () => { setResetUser(null); setResetPw(''); };

  const generatePw = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setResetPw(pw);
  };

  const submitReset = async () => {
    if (!resetPw || resetPw.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setResetting(true);
    try {
      // Reuse the edit endpoint — sending only password updates just the password
      const res = await axios.put(`${API_URL}/api/admin/users/${resetUser.id}`,
        { password: resetPw }, authHeader);
      if (res.data.success) {
        flashNotice(`Password reset for "${resetUser.username}". Share the new password with them.`);
        closeReset();
      } else {
        setError(res.data.message || 'Could not reset password.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Request failed.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} className="admin-back" onClick={onBack}>← Back to Chat</button>
        <div style={S.headerTitle}>User Management</div>
        <div style={S.headerRight}>Signed in as {user.name}</div>
      </div>

      <div style={S.body}>
        {notice && <div style={S.notice}>{notice}</div>}

        {/* Create / Edit form */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            {editingId === null ? 'Create New User' : `Edit User: ${form.username}`}
          </div>

          {error && <div style={S.errorBox}>{error}</div>}

          <form onSubmit={submitForm}>
            <div style={S.grid}>
              <Field label="Username">
                <input
                  style={{ ...S.input, ...(editingId !== null ? S.inputDisabled : {}) }}
                  value={form.username}
                  disabled={editingId !== null}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. company1"
                />
              </Field>

              <Field label={editingId === null ? 'Password' : 'New Password (blank = keep)'}>
                <input
                  style={S.input}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId === null ? 'Set a password' : 'Leave blank to keep current'}
                />
              </Field>

              <Field label="Full Name">
                <input
                  style={S.input}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Company One Owner"
                />
              </Field>

              <Field label="Email (for password reset)">
                <input
                  style={S.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. owner@company.com"
                />
              </Field>

              <Field label="Role">
                <select
                  style={S.input}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Owner">Owner</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="Dealer">Dealer</option>
                </select>
              </Field>

              {form.role === 'Dealer' && (
                <Field label="Party ID (assigned by the ERP)">
                  <input
                    style={S.input}
                    value={form.party_id}
                    onChange={(e) => setForm({ ...form, party_id: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 1024"
                    inputMode="numeric"
                  />
                </Field>
              )}

              <Field label="Company ID (select from existing data)">
                <select
                  style={S.input}
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                >
                  <option value="">— Select a company —</option>
                  {companies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {/* If editing a user whose company is no longer in the data, still show it */}
                  {form.company_id && !companies.includes(form.company_id) && (
                    <option value={form.company_id}>{form.company_id} (not in current data)</option>
                  )}
                </select>
              </Field>

              <Field label="Company Name (display)">
                <input
                  style={S.input}
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g. Hotage India"
                />
              </Field>
            </div>

            <div style={S.formActions}>
              {editingId !== null && (
                <button type="button" style={S.cancelBtn} onClick={cancelEdit}>Cancel</button>
              )}
              <button type="submit" style={S.submitBtn} className="admin-submit" disabled={saving}>
                {saving ? 'Saving…' : (editingId === null ? 'Create User' : 'Save Changes')}
              </button>
            </div>
          </form>
        </div>

        {/* Users table */}
        <div style={S.card}>
          <div style={S.cardTitle}>All Users</div>
          {loading ? (
            <div style={S.muted}>Loading users…</div>
          ) : users.length === 0 ? (
            <div style={S.muted}>No users found.</div>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Username', 'Name', 'Email', 'Role', 'Company ID', 'Status', 'Actions'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={S.tr}>
                      <td style={S.td}><strong>{u.username}</strong></td>
                      <td style={S.td}>{u.full_name || '—'}</td>
                      <td style={S.td}>{u.email || '—'}</td>
                      <td style={S.td}>
                        <span style={{ ...S.roleTag, ...(u.role === 'ADMIN' ? S.roleAdmin : (u.role === 'Dealer' ? S.roleDealer : {})) }}>
                          {u.role}
                        </span>
                        {u.role === 'Dealer' && u.party_id != null && u.party_id !== '' && (
                          <span style={S.partyTag}>#{u.party_id}</span>
                        )}
                      </td>
                      <td style={S.td}>{u.company_id}</td>
                      <td style={S.td}>
                        <span style={{ ...S.statusTag, ...(u.is_active ? S.statusOn : S.statusOff) }}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button style={S.editBtn} className="admin-row-btn" onClick={() => startEdit(u)}>Edit</button>
                        <button style={S.resetBtn} className="admin-row-btn" onClick={() => openReset(u)}>Reset PW</button>
                        <button
                          style={{ ...S.toggleBtn, ...(u.is_active ? S.disableBtn : S.enableBtn) }}
                          className="admin-row-btn"
                          onClick={() => toggleStatus(u)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button style={S.deleteBtn} className="admin-row-btn" onClick={() => deleteUser(u)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <div style={S.modalOverlay} onClick={closeReset}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Reset Password — {resetUser.username}</div>
            <p style={S.modalHint}>
              Enter a new password for this user, then share it with them. The old password
              cannot be recovered — this replaces it.
            </p>
            {error && <div style={S.errorBox}>{error}</div>}
            <div style={S.modalRow}>
              <input
                style={S.input}
                type="text"
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                placeholder="New password"
                autoFocus
              />
              <button type="button" style={S.genBtn} onClick={generatePw}>Generate</button>
            </div>
            <div style={S.modalActions}>
              <button type="button" style={S.cancelBtn} onClick={closeReset}>Cancel</button>
              <button type="button" style={S.submitBtn} onClick={submitReset} disabled={resetting}>
                {resetting ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {children}
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
  backBtn: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', padding: '0.45rem 0.9rem', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
  },
  headerTitle: { fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.01em' },
  headerRight: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' },

  body: { maxWidth: 1000, margin: '0 auto', padding: '1.5rem' },

  notice: {
    background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
    padding: '0.7rem 1rem', borderRadius: 9, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600,
  },

  card: {
    background: '#fff', borderRadius: 14, padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)', marginBottom: '1.5rem',
  },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#0D1B2A', marginBottom: '1.1rem' },

  errorBox: {
    background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
    padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, marginBottom: '1rem',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.74rem', fontWeight: 600, color: '#475569' },
  input: {
    padding: '0.6rem 0.8rem', fontSize: '0.88rem', border: '1px solid #E2E8F0', borderRadius: 9,
    outline: 'none', fontFamily: 'inherit', color: '#0D1B2A', background: '#F8FAFC', width: '100%', boxSizing: 'border-box',
  },
  inputDisabled: { background: '#EEF2F6', color: '#94A3B8', cursor: 'not-allowed' },

  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem' },
  submitBtn: {
    background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', border: 'none',
    padding: '0.65rem 1.4rem', borderRadius: 9, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  cancelBtn: {
    background: '#fff', color: '#475569', border: '1px solid #CBD5E1',
    padding: '0.65rem 1.2rem', borderRadius: 9, fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: {
    textAlign: 'left', padding: '0.6rem 0.8rem', background: '#F1F5F9', color: '#475569',
    fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em',
    borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '0.7rem 0.8rem', color: '#1E293B', verticalAlign: 'middle' },

  roleTag: {
    fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 99,
    background: '#EFF6FF', color: '#1565C0',
  },
  roleAdmin: { background: '#FEF3C7', color: '#B45309' },
  roleDealer: { background: '#DCFCE7', color: '#15803D' },
  partyTag: {
    marginLeft: '0.4rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
    borderRadius: 99, background: '#EFF6FF', color: '#1565C0',
  },

  statusTag: { fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 99 },
  statusOn:  { background: '#DCFCE7', color: '#15803D' },
  statusOff: { background: '#FEE2E2', color: '#B91C1C' },

  editBtn: {
    background: '#fff', border: '1px solid #CBD5E1', color: '#1565C0', padding: '0.3rem 0.7rem',
    borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.4rem', fontFamily: 'inherit',
  },
  toggleBtn: {
    border: 'none', padding: '0.3rem 0.7rem', borderRadius: 7, fontSize: '0.78rem',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  disableBtn: { background: '#FEE2E2', color: '#B91C1C' },
  enableBtn:  { background: '#DCFCE7', color: '#15803D' },
  deleteBtn: {
    background: '#fff', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.3rem 0.7rem',
    borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginLeft: '0.4rem', fontFamily: 'inherit',
  },
  resetBtn: {
    background: '#fff', border: '1px solid #CBD5E1', color: '#475569', padding: '0.3rem 0.7rem',
    borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.4rem', fontFamily: 'inherit',
  },

  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: '1.6rem', width: '100%', maxWidth: 440,
    boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
  },
  modalTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#0D1B2A', marginBottom: '0.5rem' },
  modalHint:  { fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1rem' },
  modalRow:   { display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' },
  genBtn: {
    background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1565C0', padding: '0 0.9rem',
    borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' },

  muted: { color: '#94A3B8', fontSize: '0.85rem', padding: '0.5rem 0' },
};