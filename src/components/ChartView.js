import React, { useState, useMemo, forwardRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#1565C0', '#FF6B2B', '#2E9E5B', '#9C27B0', '#F5A623',
                '#00ACC1', '#E53935', '#3949AB', '#7CB342', '#D81B60'];

const MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

export function parseMarkdownTable(text) {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim());
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i];
    const sep = lines[i + 1];
    if (header.startsWith('|') && /^\|[\s:|-]+\|?$/.test(sep) && sep.includes('-')) {
      const columns = header.split('|').slice(1, -1).map(c => c.trim()).filter(Boolean);
      if (columns.length < 2) continue;
      const rows = [];
      for (let j = i + 2; j < lines.length; j++) {
        const line = lines[j];
        if (!line.startsWith('|')) break;
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (cells.length < columns.length) continue;
        const row = {};
        columns.forEach((col, k) => { row[col] = cells[k]; });
        rows.push(row);
      }
      if (rows.length > 0) return { columns, rows };
    }
  }
  return null;
}

/* Extract label→value pairs from bullet / line lists like:
     - **April 2026:** ₹8,71,51,703.00
     - Abhiyudaya SVN Private Limited (03317): ₹3,13,78,122.00
   Returns a {columns:[Label,Value], rows:[...]} shape compatible with the table path,
   or null if fewer than 2 usable pairs are found. */
function parseLabelValueList(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const pairs = [];
  for (let raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    // strip leading bullet markers (-, *, •, digits.)
    line = line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '');
    // strip markdown bold
    line = line.replace(/\*\*/g, '');
    // need a "label : value" with a number on the value side
    const m = line.match(/^(.+?):\s*(.+)$/);
    if (!m) continue;
    const label = m[1].trim();
    const valuePart = m[2].trim();
    const num = parseFloat(valuePart.replace(/[^0-9.-]/g, ''));
    if (label && !isNaN(num) && /[0-9]/.test(valuePart)) {
      pairs.push({ Label: label, Value: valuePart });
    }
  }
  if (pairs.length < 2) return null;
  return { columns: ['Label', 'Value'], rows: pairs };
}

/* Try table first, then bullet/label-value list. */
function parseChartableData(text) {
  return parseMarkdownTable(text) || parseLabelValueList(text);
}

function toNumber(v) {
  if (v == null) return NaN;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
  return parseFloat(cleaned);
}

function formatIndian(n) {
  if (isNaN(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
  if (abs >= 1e5) return (n / 1e5).toFixed(2) + ' L';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function analyzeData(parsed) {
  if (!parsed) return null;
  const { columns, rows } = parsed;

  const numericCols = columns.filter(col => {
    const vals = rows.map(r => toNumber(r[col]));
    const valid = vals.filter(n => !isNaN(n)).length;
    return valid >= Math.ceil(rows.length * 0.6);
  });

  const labelCol = columns.find(c => !numericCols.includes(c)) || columns[0];
  const valueCols = numericCols.filter(c => c !== labelCol);
  if (valueCols.length === 0) return null;

  const looksLikeDate = rows.some(r => {
    const v = String(r[labelCol]).trim();
    return /\d{4}-\d{2}-\d{2}/.test(v) || /\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(v) || MONTH_RE.test(v);
  });

  const data = rows.map(r => {
    const o = { __label: r[labelCol] };
    valueCols.forEach(c => { o[c] = toNumber(r[c]); });
    return o;
  }).filter(o => valueCols.some(c => !isNaN(o[c])));

  return { labelCol, valueCols, data, looksLikeDate };
}

function availableChartTypes(analysis, selectedCol) {
  if (!analysis) return [];
  const types = ['bar'];
  if (analysis.looksLikeDate) types.unshift('line');
  if (selectedCol && analysis.data.length >= 2 && analysis.data.length <= 8) {
    types.push('pie');
  }
  return types;
}

export function isChartable(text) {
  const parsed = parseChartableData(text);
  if (!parsed || parsed.rows.length < 2) return false;
  const analysis = analyzeData(parsed);
  return !!analysis && analysis.data.length >= 2;
}

const TYPE_LABELS = { bar: 'Bar', line: 'Line', pie: 'Pie' };

const ChartView = forwardRef(function ChartView({ text }, ref) {
  const parsed = useMemo(() => parseChartableData(text), [text]);
  const analysis = useMemo(() => analyzeData(parsed), [parsed]);

  const defaultCol = useMemo(() => {
    if (!analysis) return null;
    let best = analysis.valueCols[0], bestMax = -Infinity;
    analysis.valueCols.forEach(c => {
      const max = Math.max(...analysis.data.map(d => Math.abs(d[c] || 0)));
      if (max > bestMax) { bestMax = max; best = c; }
    });
    return best;
  }, [analysis]);

  const [selectedCol, setSelectedCol] = useState(defaultCol);
  const col = selectedCol || defaultCol;

  const types = useMemo(() => availableChartTypes(analysis, col), [analysis, col]);
  const [type, setType] = useState(types[0] || 'bar');

  React.useEffect(() => {
    if (!types.includes(type)) setType(types[0] || 'bar');
  }, [types, type]);

  if (!analysis || !col) {
    return <div style={S.empty}>This response can't be shown as a chart.</div>;
  }

  const { valueCols, data } = analysis;
  const chartData = data.map(d => ({ __label: d.__label, [col]: d[col] }));

  return (
    <div style={S.wrap} ref={ref}>
      <div style={S.controls}>
        {types.length > 1 && (
          <div style={S.switcher}>
            {types.map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ ...S.switchBtn, ...(type === t ? S.switchBtnActive : {}) }}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
        {valueCols.length > 1 && (
          <div style={S.colSelect}>
            <span style={S.colLabel}>Show:</span>
            <select value={col} onChange={e => setSelectedCol(e.target.value)} style={S.select}>
              {valueCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={S.chartArea}>
        <ResponsiveContainer width="100%" height={420}>
          {type === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 12, right: 24, left: 12, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="__label" tick={{ fontSize: 13 }} interval={0}
                angle={chartData.length > 6 ? -30 : 0}
                textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                height={chartData.length > 6 ? 80 : 40} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatIndian} width={70} />
              <Tooltip formatter={(v) => formatIndian(v)} />
              <Bar dataKey={col} fill={COLORS[0]} radius={[5, 5, 0, 0]} maxBarSize={70} />
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={chartData} margin={{ top: 12, right: 24, left: 12, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="__label" tick={{ fontSize: 13 }} interval={0}
                angle={chartData.length > 6 ? -30 : 0}
                textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                height={chartData.length > 6 ? 80 : 40} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatIndian} width={70} />
              <Tooltip formatter={(v) => formatIndian(v)} />
              <Line type="monotone" dataKey={col} stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip formatter={(v) => formatIndian(v)} />
              <Legend />
              <Pie data={chartData} dataKey={col} nameKey="__label"
                cx="50%" cy="50%" outerRadius={140}
                label={(e) => `${e.__label}: ${formatIndian(e[col])}`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
        <div style={S.caption}>Showing: <strong>{col}</strong></div>
      </div>
    </div>
  );
});

export default ChartView;

const S = {
  wrap: { marginTop: '0.5rem' },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.6rem' },
  switcher: { display: 'inline-flex', background: '#F1F5F9', borderRadius: 9, padding: 3, gap: 2 },
  switchBtn: { border: 'none', background: 'transparent', padding: '0.4rem 1rem', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' },
  switchBtnActive: { background: '#fff', color: '#1565C0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  colSelect: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
  colLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#64748B' },
  select: { padding: '0.4rem 0.6rem', fontSize: '0.82rem', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#0D1B2A', fontFamily: 'inherit', cursor: 'pointer' },
  chartArea: { background: '#fff', borderRadius: 10, padding: '0.75rem', border: '1px solid #EEF2F7' },
  caption: { textAlign: 'center', fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' },
  empty: { fontSize: '0.85rem', color: '#94A3B8', padding: '1rem', textAlign: 'center' },
};