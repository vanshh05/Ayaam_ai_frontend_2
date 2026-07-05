import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import AdminPanel from './AdminPanel';
import ChartView, { isChartable } from './ChartView';
import html2canvas from 'html2canvas';
import aivaMark from '../assets/aiva-mark.png';

const API_URL = process.env.REACT_APP_API_URL || '';

/* ══════════════════════════════════════════════════════════════════════════════
   SVG ICON LIBRARY — replaces every emoji icon
══════════════════════════════════════════════════════════════════════════════ */
const Ic = {
  /* Sidebar / navigation */
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  Chat: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 1h11v8H7.5L4.5 12V9H1V1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M5.5 7.5H13M10 4.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 2H2v11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trash: () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M1.5 3h8M4 3V2h3v1M3 3l.5 6.5h4L8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  /* Dashboard card icons */
  Sales: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l4-4 3 3 5-6" stroke={color||'#fff'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14" cy="5" r="1.5" fill={color||'#fff'}/>
    </svg>
  ),
  Purchase: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2h2l2 7h6l2-5H5" stroke={color||'#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="12.5" r="1.2" fill={color||'#fff'}/>
      <circle cx="11" cy="12.5" r="1.2" fill={color||'#fff'}/>
    </svg>
  ),
  Money: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke={color||'#fff'} strokeWidth="1.5"/>
      <circle cx="8" cy="8.5" r="2" stroke={color||'#fff'} strokeWidth="1.4"/>
      <path d="M5 4V3M11 4V3" stroke={color||'#fff'} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Bank: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5h12M8 2l6 4.5H2L8 2z" stroke={color||'#fff'} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M4 6.5V12M8 6.5V12M12 6.5V12M2 12h12" stroke={color||'#fff'} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Balance: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M3 7l5-3 5 3M3 9l5 3 5-3" stroke={color||'#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Box: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 5v6L8 14 2 11V5L8 2z" stroke={color||'#fff'} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M8 2v12M2 5l6 3 6-3" stroke={color||'#fff'} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Truck: ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 3h9v7H1V3z" stroke={color||'#fff'} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 6h3l2 3v1h-5V6z" stroke={color||'#fff'} strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="3.5" cy="11.5" r="1.3" stroke={color||'#fff'} strokeWidth="1.3"/>
      <circle cx="12" cy="11.5" r="1.3" stroke={color||'#fff'} strokeWidth="1.3"/>
    </svg>
  ),

  /* Message actions */
  Volume: ({ active }) => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 4.5H4.5L7.5 2v9L4.5 8.5H2V4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      {active ? (
        <path d="M9 3a4 4 0 0 1 0 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      ) : (
        <path d="M9 4.5l3 4M12 4.5l-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      )}
    </svg>
  ),
  Globe: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 6.5h10M6.5 1.3c-1.5 1.8-2.2 3.4-2.2 5.2s.7 3.4 2.2 5.2M6.5 1.3c1.5 1.8 2.2 3.4 2.2 5.2s-.7 3.4-2.2 5.2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  Copy: ({ done }) => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      {done ? (
        <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <>
          <rect x="4.5" y="1.5" width="7" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8.5 10v1.5H1.5V3H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </>
      )}
    </svg>
  ),
  Download: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1.5v7M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Chart: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 11.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="2.5" y="6" width="2" height="4" rx="0.5" fill="currentColor"/>
      <rect x="5.5" y="3.5" width="2" height="6.5" rx="0.5" fill="currentColor"/>
      <rect x="8.5" y="5" width="2" height="5" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  Stop: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.2" fill="currentColor"/>
    </svg>
  ),

  /* Input */
  Mic: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 8a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  MicOff: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 8a5 5 0 0 0 9.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 8L2 3l3.5 5L2 13l12-5z" fill="currentColor"/>
    </svg>
  ),
  Package: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L15.5 5.5v7L9 16 2.5 12.5v-7L9 2z" stroke="#1565C0" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 2v14M2.5 5.5l6.5 3.5 6.5-3.5" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  HelpCircle: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke="#1565C0" strokeWidth="1.5"/>
      <path d="M6.5 7a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="13.5" r="0.75" fill="#1565C0"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6h7M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/* ── Dashboard card metadata ─────────────────────────────────────────────────── */
const DASHBOARD_CARDS = [
  {
    id: 'sales', Icon: Ic.Sales, label: 'Sales', color: '#1565C0',
    queries: [
      { label: "Today's Sales",  text: "Give me today's sales report in two parts. PART 1 — summary: total sales amount today, total number of bills issued today, and total number of unique parties to whom bills were issued today (count each party once using COUNT(DISTINCT party_name)). PART 2 — detailed entries: list every sale bill from today with columns party_name, bill_no, invoice_amount. Filter ai_sales by today's bill_date. If the detailed entries are more than 20 rows, provide them as a downloadable PDF export instead of listing inline." },
      { label: "Month Sales",    text: "What are the total sales this month till date? Compute everything from the ai_sales table (not ai_daily_summary): total sales = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this month. Show total sales amount, total bills issued, and total unique parties." },
      { label: "Total Sales",    text: "What are the total sales this financial year? Compute everything from the ai_sales table (not ai_daily_summary): total sales = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this financial year. Show total sales amount, total bills issued, and total unique parties." },
    ],
  },
  {
    id: 'purchase', Icon: Ic.Purchase, label: 'Purchase', color: '#E65100',
    queries: [
      { label: "Today's Purchase", text: "Give me today's purchase report in two parts. PART 1 — summary: total purchase amount today, total number of bills today, and total number of unique parties from whom purchases were made today (count each party once using COUNT(DISTINCT party_name)). PART 2 — detailed entries: list every purchase bill from today with columns party_name, bill_no, invoice_amount. Filter ai_purchase by today's bill_date. If the detailed entries are more than 20 rows, provide them as a downloadable PDF export instead of listing inline." },
      { label: "Month Purchase",   text: "What is this month's total purchase? Compute everything from the ai_purchase table (not ai_daily_summary): total purchase = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this month. Show total purchase amount, total bills, and total unique parties." },
      { label: "Total Purchase",   text: "What is the total purchase this financial year? Compute everything from the ai_purchase table (not ai_daily_summary): total purchase = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this financial year. Show total purchase amount, total bills, and total unique parties." },
    ],
  },
  {
    id: 'collection', Icon: Ic.Money, label: 'Collection & Payment', color: '#2E7D32',
    queries: [
      { label: "Today's Collection", text: "Give me today's collection report in two parts. PART 1 — summary: total collection amount received today, total number of collection entries today, and total number of unique parties from whom collection was received today (count each party once using COUNT(DISTINCT party_name)). PART 2 — detailed entries: list every collection entry from today with columns receipt_date, party_name, amount, receipt_mode, cheque_txn_no. Filter ai_collection_summary by today's receipt_date. If the detailed entries are more than 20 rows, provide them as a downloadable PDF export instead of listing inline." },
      { label: "Today's Payment",    text: "Give me today's payment report in two parts. PART 1 — summary: total payment amount made today, total number of payment entries today, and total number of unique parties to whom payment was made today (count each party once using COUNT(DISTINCT party_name)). PART 2 — detailed entries: list every payment entry from today with columns payment_date, party_name, amount, payment_mode, cheque_txn_no. Filter ai_payment_summary by today's payment_date. If the detailed entries are more than 20 rows, provide them as a downloadable PDF export instead of listing inline." },
    ],
  },
  {
    id: 'bank', Icon: Ic.Bank, label: 'Bank Balance', color: '#6A1B9A',
    queries: [
      { label: "Bank Summary", text: "Give me the complete bank balance summary of all bank and finance accounts, showing bank name, balance type and current balance. Fetch all records from ai_bank_balance_summary table ordered by balance descending." },
    ],
  },
  {
    id: 'debtors_creditors', Icon: Ic.Balance, label: 'Receivable & Payable', color: '#00695C',
    queries: [
      { label: "Total Receivable", text: 'Give me all debtors list' },
      { label: "Total Payable",    text: 'Give me all creditors list' },
    ],
  },
  {
    id: 'stock', Icon: Ic.Box, label: 'Stock', color: '#B45309',
    queries: [
      { label: "Total Stock",        text: "Give me the stock summary in a nutshell — just the total quantity of each item currently in the warehouse. Show only item name and total quantity, no specifications. Group by item_name, sum the quantity, order by total quantity descending." },
      { label: "Full Stock Details", text: "Give me the complete detailed list of every stock item currently in the warehouse — do not group or aggregate. Show every individual stock record with item name, quantity, and all specification values, with each specification column labeled using its proper name from the spec map for this company (e.g. Color, Chassis Number) as the column header." },
    ],
  },
  {
    id: 'dispatch', Icon: Ic.Truck, label: 'Dispatch', color: '#283593',
    queries: [
      { label: "Today's Dispatch", text: "Give me today's dispatch summary — total number of vehicles dispatched today and total number of unique parties served today. Count each party only once even if multiple invoices were raised to them today." },
      { label: "Month's Dispatch", text: "Give me this month's dispatch summary — total number of vehicles dispatched this month and total number of unique parties served this month. Count each party only once even if multiple invoices were raised to them this month." },
      { label: "Total Dispatch",   text: "Give me the all-time total dispatch summary — total number of vehicles dispatched till date and total number of unique parties served till date. Count each party only once." },
    ],
  },
];

/* Flat label → full prompt text, for follow-up chips */
const QUERY_BY_LABEL = {};
DASHBOARD_CARDS.forEach(card => card.queries.forEach(q => { QUERY_BY_LABEL[q.label] = q.text; }));
const QUICK_COUNT = DASHBOARD_CARDS.reduce((n, c) => n + c.queries.length, 0);

/* Contextual follow-up suggestions keyed by the query label just asked */
const RELATED_QUERIES = {
  "Today's Sales": ['Month Sales', 'Total Sales', "Today's Collection", 'Total Receivable'],
  'Month Sales': ["Today's Sales", 'Total Sales', "Today's Dispatch"],
  'Total Sales': ["Today's Sales", 'Month Sales', 'Bank Summary'],
  "Today's Purchase": ['Month Purchase', 'Total Purchase', 'Total Payable'],
  'Month Purchase': ["Today's Purchase", 'Total Purchase'],
  'Total Purchase': ["Today's Purchase", 'Total Payable', 'Bank Summary'],
  "Today's Collection": ["Today's Payment", 'Total Receivable', 'Bank Summary'],
  "Today's Payment": ["Today's Collection", 'Total Payable', 'Bank Summary'],
  'Bank Summary': ['Total Receivable', 'Total Payable', "Today's Collection"],
  'Total Receivable': ['Total Payable', 'Bank Summary', "Today's Collection"],
  'Total Payable': ['Total Receivable', 'Bank Summary', "Today's Payment"],
  'Total Stock': ['Full Stock Details', "Today's Dispatch", "Today's Sales"],
  'Full Stock Details': ['Total Stock', "Today's Dispatch"],
  "Today's Dispatch": ["Month's Dispatch", 'Total Dispatch', "Today's Sales"],
  "Month's Dispatch": ["Today's Dispatch", 'Total Dispatch'],
  'Total Dispatch': ["Today's Dispatch", "Month's Dispatch", 'Total Sales'],
};
const DEFAULT_FOLLOW_UPS = ["Today's Sales", 'Total Receivable', 'Bank Summary', 'Total Stock'];

/* ── Helpers — UNTOUCHED ─────────────────────────────────────────────────────── */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

function stripMarkdown(text) {
  return text
    .replace(/\|.*?\|/g,'').replace(/[-*_]{2,}/g,'').replace(/#+\s/g,'')
    .replace(/`[^`]*`/g,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1')
    .replace(/\n{2,}/g,'. ').replace(/\n/g,' ').trim();
}
function countTableRows(text) {
  const lines = text.split('\n');
  return lines.filter(l => l.trim().startsWith('|') && !l.match(/^\|[\s\-|]+\|$/)).length - 1;
}

/* ── PDF helpers — UNTOUCHED ─────────────────────────────────────────────────── */
async function downloadAsPDF(text, title, companyName) {
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1A2B3C;padding:20px 28px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1565C0;padding-bottom:10px;margin-bottom:16px}.brand{font-size:18px;font-weight:800;color:#1565C0;letter-spacing:0.05em}.brand span{color:#FF6B2B}.meta{text-align:right;font-size:10px;color:#8896A5}.meta strong{color:#1A2B3C;display:block;font-size:11px}h1,h2,h3{color:#1565C0;margin:12px 0 6px}h1{font-size:15px}h2{font-size:13px}h3{font-size:12px}p{margin:4px 0;line-height:1.6}strong{font-weight:700}ul,ol{padding-left:18px;margin:6px 0}li{margin:3px 0;line-height:1.5}table{border-collapse:collapse;width:100%;margin:10px 0;font-size:11px}th{background:#1565C0;color:#fff;padding:7px 10px;text-align:left;font-weight:700}td{padding:6px 10px;border-bottom:1px solid #EEF2F7}tr:nth-child(even) td{background:#F8FAFC}.footer{margin-top:20px;padding-top:8px;border-top:1px solid #DDE3EA;font-size:9px;color:#B0BAC6;display:flex;justify-content:space-between}</style>
  </head><body>
  <div class="header"><div><div class="brand">AYAAM<span>ERP</span></div><div style="font-size:10px;color:#8896A5;margin-top:2px">AI Assistant Report</div></div><div class="meta"><strong>${companyName||'Ayaam ERP'}</strong>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div></div>
  <div class="content">${markdownToHtml(text)}</div>
  <div class="footer"><span>Powered by Ayaam ERP AI Assistant · Datawheel Software Technology LLP</span><span>Page 1</span></div>
  </body></html>`;
  const blob = new Blob([htmlContent],{type:'text/html'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url,'_blank');
  if(win) win.onload=()=>setTimeout(()=>{win.print();URL.revokeObjectURL(url);},500);
}

function markdownToHtml(md) {
  const lines=md.split('\n'); let html=''; let inTable=false; let tableHeaderDone=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const isTableRow=line.trim().startsWith('|')&&line.trim().endsWith('|');
    const isSeparator=isTableRow&&line.replace(/[|\s\-:]/g,'').length===0;
    if(isTableRow&&!isSeparator){
      if(!inTable){html+='<table><thead>';inTable=true;tableHeaderDone=false;}
      const cells=line.trim().slice(1,-1).split('|').map(c=>c.trim());
      if(!tableHeaderDone) html+='<tr>'+cells.map(c=>`<th>${c}</th>`).join('')+'</tr>';
      else html+='<tr>'+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>';
    } else if(isSeparator){
      html+='</thead><tbody>';tableHeaderDone=true;
    } else {
      if(inTable){html+='</tbody></table>';inTable=false;tableHeaderDone=false;}
      if(/^### /.test(line)) html+=`<h3>${line.slice(4)}</h3>`;
      else if(/^## /.test(line)) html+=`<h2>${line.slice(3)}</h2>`;
      else if(/^# /.test(line)) html+=`<h1>${line.slice(2)}</h1>`;
      else if(/^- /.test(line)) html+=`<li>${line.slice(2).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`;
      else if(line.trim()==='') html+='<br>';
      else html+=`<p>${line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')}</p>`;
    }
  }
  if(inTable) html+='</tbody></table>';
  return html;
}

function buildExportTableHtml(exportData, label) {
  const{columns,data}=exportData;
  const COLUMN_ORDER={
    ai_sales:['party_name','bill_no','bill_date','voucher_date','gross_amount','discount_amount','taxable_amount','sgst_amount','cgst_amount','igst_amount','invoice_amount','payment_mode'],
    ai_purchase:['party_name','bill_no','bill_date','voucher_date','gross_amount','discount_amount','taxable_amount','sgst_amount','cgst_amount','igst_amount','invoice_amount','payment_mode'],
    ai_party_status:['party_name','party_type','sub_party_type','outstanding_balance','balance_type','overdue_days','credit_limit','last_bill_date','last_bill_amount','total_business_ytd','contact_number','email','address','gstin'],
    ai_collection_summary:['receipt_date','party_name','amount','receipt_mode','cheque_txn_no'],
    ai_payment_summary:['payment_date','party_name','amount','payment_mode','cheque_txn_no'],
    ai_bank_balance_summary:['bank_name','balance_type','balance'],
    ai_party_status_debtors:['party_name','sub_party_type','outstanding_balance','balance_type'],
  };
  const rawCols=(columns||[]).filter(c=>c!=='company_id');
  const table=exportData.table;
  const lbl=(label||'').toLowerCase();
  const isDebtorCreditor=lbl.includes('debtor')||lbl.includes('creditor')||lbl.includes('customer')||lbl.includes('supplier');
  let displayCols;
  if(isDebtorCreditor&&table==='ai_party_status'){
    const focused=['party_name','sub_party_type','outstanding_balance','balance_type'];
    displayCols=focused.filter(c=>rawCols.includes(c));
  } else if(COLUMN_ORDER[table]){
    const existing=new Set(rawCols);
    const ordered=COLUMN_ORDER[table].filter(c=>existing.has(c));
    const extras=rawCols.filter(c=>!COLUMN_ORDER[table].includes(c));
    displayCols=[...ordered,...extras];
  } else { displayCols=rawCols; }
  const rowsHtml=(data||[]).map(row=>'<tr>'+displayCols.map(c=>`<td>${row[c]!=null?row[c]:''}</td>`).join('')+'</tr>').join('');
  const theadHtml = '<tr>'+displayCols.map(c=>`<th>${c.replace(/_/g,' ').toUpperCase()}</th>`).join('')+'</tr>';
  return { displayCols, tableHtml: `<table><thead>${theadHtml}</thead><tbody>${rowsHtml}</tbody></table>` };
}

async function downloadExportPDF(exportData, label, companyName) {
  const{total_rows}=exportData;
  const { tableHtml } = buildExportTableHtml(exportData, label);
  const htmlContent=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${label}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#1A2B3C;padding:16px 20px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1565C0;padding-bottom:8px;margin-bottom:12px}.brand{font-size:16px;font-weight:800;color:#1565C0}.brand span{color:#FF6B2B}.meta{text-align:right;font-size:9px;color:#8896A5}.meta strong{color:#1A2B3C;display:block;font-size:10px}.info{background:#F0F4F8;border-left:3px solid #1565C0;padding:6px 10px;border-radius:4px;margin-bottom:10px;font-size:10px}table{border-collapse:collapse;width:100%;margin-top:8px;font-size:9px}th{background:#1565C0;color:#fff;padding:5px 7px;text-align:left;font-weight:700;white-space:nowrap}td{padding:4px 7px;border-bottom:1px solid #EEF2F7;word-break:break-word;max-width:150px}tr:nth-child(even) td{background:#F8FAFC}.footer{margin-top:14px;padding-top:6px;border-top:1px solid #DDE3EA;font-size:8px;color:#B0BAC6;display:flex;justify-content:space-between}</style></head><body><div class="header"><div><div class="brand">AYAAM<span>ERP</span></div><div style="font-size:9px;color:#8896A5;margin-top:2px">AI Assistant Report</div></div><div class="meta"><strong>${companyName||'Ayaam ERP'}</strong>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div></div><div class="info"><strong>${label}</strong> &nbsp;·&nbsp; Total Records: <strong>${total_rows}</strong></div>${tableHtml}<div class="footer"><span>Powered by Ayaam ERP AI Assistant · Datawheel Software Technology LLP</span><span>${label} · ${total_rows} records</span></div></body></html>`;
  const blob=new Blob([htmlContent],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,'_blank');
  if(win) win.onload=()=>setTimeout(()=>{win.print();URL.revokeObjectURL(url);},600);
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { const el=document.createElement('textarea'); el.value=text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); return true; }
}

/* ── Storage — UNTOUCHED ─────────────────────────────────────────────────────── */
const STORAGE_KEY = 'ayaam_chat_history';
function loadSavedChats(){ try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[]; }catch{ return []; } }
function saveChats(chats){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(chats)); }catch{} }
function generateChatTitle(msg){ const c=msg.replace(/\[LANG:[A-Z]+\]\s*/g,'').trim(); return c.length>40?c.slice(0,40)+'…':c; }

/* Rotating typewriter for the empty-state chat box placeholder */
const HERO_EXAMPLES = [
  "Show me the debtors list",
  "What's today's sales?",
  "Full stock details as PDF",
  "Bank balance summary",
  "Total receivable as on today",
  "This month's dispatch summary",
];
function useHeroTypewriter(active) {
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    if (!active) { setText(''); return; }
    let ei = 0, ci = 0, dir = 1, hold = 0, timer;
    const tick = () => {
      const full = HERO_EXAMPLES[ei];
      if (hold > 0) { hold--; timer = setTimeout(tick, 60); return; }
      ci += dir;
      if (ci >= full.length) { ci = full.length; dir = -1; hold = 28; }
      else if (ci <= 0) { ci = 0; dir = 1; ei = (ei + 1) % HERO_EXAMPLES.length; hold = 3; }
      setText(full.slice(0, ci));
      timer = setTimeout(tick, dir > 0 ? 62 : 30);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [active]);
  return text;
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function Chat({ user, onLogout }) {
  /* ── State — UNTOUCHED ──────────────────────────────────────────────────── */
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(() => window.innerWidth > 768);
  const [history,       setHistory]       = useState([]);
  const [listening,     setListening]     = useState(false);
  const [speakingId,    setSpeakingId]    = useState(null);
  const [speechLang,    setSpeechLang]    = useState('en-IN');
  const [translations,  setTranslations]  = useState({});
  const [translating,   setTranslating]   = useState({});
  const [savedChats,    setSavedChats]    = useState(loadSavedChats);
  const [activeChatId,  setActiveChatId]  = useState(null);
  const [copiedId,      setCopiedId]      = useState(null);
  const [chartOn,       setChartOn]       = useState({}); // {msgId: true} → show chart instead of table
  const [chartNotice,   setChartNotice]   = useState(null); // msgId showing the 'nothing to plot' notice
  const chartRefs = useRef({}); // {msgId: DOM node} for chart-to-PDF capture
  const [exportLoading, setExportLoading] = React.useState({});
  const [pdfPreview, setPdfPreview] = useState(null); // { title, html?, imgSrc?, onDownload }
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ayaam_theme') || 'dark'; } catch { return 'dark'; }
  });
  const [quickOpen, setQuickOpen] = useState(false); // composer quick-queries panel
  const quickAutoShown = useRef(false); // true once the panel has auto-opened for this new conversation
  const isEmpty = messages.length === 0;
  const heroPlaceholder = useHeroTypewriter(isEmpty && !input);
  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('ayaam_theme', next); } catch {}
      return next;
    });
  };

  // ── Admin: company selector ──
  const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';
  const [companyList,     setCompanyList]     = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(''); // '' = none selected
  const [showAdmin,       setShowAdmin]       = useState(false); // admin panel view toggle

  const isMobile      = window.innerWidth <= 768;
  const bottomRef     = useRef(null);
  const inputRef      = useRef(null);
  const recognizerRef = useRef(null);

  /* ── Effects — UNTOUCHED ────────────────────────────────────────────────── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Auto-logout when the server rejects the token (expired/invalid → 401)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response && err.response.status === 401) onLogout();
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [onLogout]);

  // Admin only: load the list of companies present in the data
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/companies`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.data.success) setCompanyList(res.data.companies || []);
      } catch (e) { /* leave list empty on failure */ }
    })();
  }, [isAdmin, user.token]);

  useEffect(() => {
    if (messages.length === 0) return;
    const title = generateChatTitle(messages[0]?.text || 'Chat');
    const ts    = messages[0]?.ts || new Date();
    setSavedChats(prev => {
      let updated;
      if (activeChatId) {
        updated = prev.map(c => c.id === activeChatId ? { ...c, messages, history, updatedAt: new Date() } : c);
      } else {
        const newId = Date.now().toString();
        setActiveChatId(newId);
        updated = [{ id: newId, title, createdAt: ts, updatedAt: new Date(), messages, history }, ...prev];
      }
      saveChats(updated); return updated;
    });
  }, [messages]);

  /* ── Handlers — UNTOUCHED ───────────────────────────────────────────────── */
  const sendMessage = async (text, displayLabel) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    // Collapse the sidebar the first time a conversation actually starts (smoother focus on the chat).
    if (messages.length === 0) setSidebarOpen(false);

    // For quick-query buttons, show the short label in the bubble but send the full prompt.
    const bubbleText = displayLabel || msg;

    // Admin must pick a company before querying
    if (isAdmin && !selectedCompany) {
      setMessages(prev => [...prev, { role: 'user', text: bubbleText, ts: new Date() }, {
        role: 'bot',
        text: '⚠️ Please select a company from the dropdown above to view its data.',
        ts: new Date(), id: Date.now(), tableRows: 0,
      }]);
      setInput('');
      return;
    }

    setInput(''); stopSpeaking();
    const userMsg = { role: 'user', text: bubbleText, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Try the request; retry once on empty reply or transient failure (Gemini hiccup / cold start).
    const postChat = () => axios.post(`${API_URL}/api/chat`, {
      message: msg, history,
      language: speechLang === 'hi-IN' ? 'hi' : 'en',
      company_id: isAdmin ? selectedCompany : undefined,
    }, {
      timeout: 120000,
      headers: { Authorization: `Bearer ${user.token}` },
    });

    try {
      let res;
      let reply = '';
      try {
        res = await postChat();
        reply = (res.data && res.data.reply) ? res.data.reply : '';
        if ((res.data && res.data.success === false) || !reply.trim()) {
          await new Promise(r => setTimeout(r, 1500));
          res = await postChat();
          reply = (res.data && res.data.reply) ? res.data.reply : '';
        }
      } catch (firstErr) {
        await new Promise(r => setTimeout(r, 2000));
        res = await postChat();
        reply = (res.data && res.data.reply) ? res.data.reply : '';
      }

      if (!reply.trim()) {
        const backendErr = res && res.data && res.data.error ? res.data.error : null;
        const shown = backendErr
          ? ('The server had trouble with that request: ' + backendErr + ' Please try again.')
          : 'The assistant did not return a result. Please try again.';
        setMessages(prev => [...prev, { role: 'bot', text: shown, ts: new Date(), error: true, id: Date.now(), tableRows: 0 }]);
        return;
      }

      const id     = Date.now();
      const exportMatch = reply.match(/{"__export__":true[^}]+}/);
      if (exportMatch) {
        try {
          const exportSpec = JSON.parse(exportMatch[0]);
          const botMsg = { role: 'bot', text: '', ts: new Date(), id, tableRows: 0, exportSpec };
          setMessages(prev => [...prev, botMsg]);
          setHistory(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: reply }]);
          return;
        } catch(e) {}
      }
      const suggestMatch = reply.match(/\{"__suggestions__"\s*:\s*\[[\s\S]*?\]\s*\}/);
      if (suggestMatch) {
        try {
          const parsed = JSON.parse(suggestMatch[0]);
          const suggestions = parsed.__suggestions__ || [];
          if (suggestions.length > 0) {
            const botMsg = { role: 'bot', text: '', ts: new Date(), id, tableRows: 0, suggestions };
            setMessages(prev => [...prev, botMsg]);
            setHistory(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: reply }]);
            return;
          }
        } catch(e) {}
      }
      const rowCnt = countTableRows(reply);
      if (rowCnt > 20) {
        const autoExportSpec = { table: '__inline__', label: 'Report', inlineData: reply, rowCount: rowCnt };
        const botMsg = { role: 'bot', text: '', ts: new Date(), id, tableRows: rowCnt, exportSpec: autoExportSpec };
        setMessages(prev => [...prev, botMsg]);
        setHistory(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: reply }]);
      } else {
        const botMsg = { role: 'bot', text: reply, ts: new Date(), id, tableRows: rowCnt };
        setMessages(prev => [...prev, botMsg]);
        setHistory(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: reply }]);
      }
    } catch (err) {
      const errMsg = err.code === 'ECONNABORTED'
        ? 'The server took too long to respond, even after retrying. It may be waking up — please try once more in a moment.'
        : 'Could not reach the server after retrying. Please check your connection and try again.';
      setMessages(prev => [...prev, { role: 'bot', text: errMsg, ts: new Date(), error: true, id: Date.now(), tableRows: 0 }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const newChat = () => {
    setMessages([]); setHistory([]); setInput(''); setActiveChatId(null);
    setTranslations({}); stopSpeaking();
    quickAutoShown.current = false; // let quick-queries auto-open once on the new conversation
    setQuickOpen(false);
    if (isMobile) setSidebarOpen(false);
  };
  const loadChat = (chat) => {
    setMessages(chat.messages); setHistory(chat.history || []);
    setActiveChatId(chat.id); setTranslations({}); stopSpeaking();
    quickAutoShown.current = true; // don't auto-open quick-queries when opening an existing chat
    setQuickOpen(false);
    if (isMobile) setSidebarOpen(false);
  };
  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    setSavedChats(prev => { const u = prev.filter(c => c.id !== chatId); saveChats(u); return u; });
    if (activeChatId === chatId) { setMessages([]); setHistory([]); setActiveChatId(null); }
  };
  const groupedChats = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const week = new Date(today); week.setDate(today.getDate()-7);
    const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
    savedChats.forEach(c => {
      const d = new Date(c.updatedAt); d.setHours(0,0,0,0);
      if (d >= today) groups['Today'].push(c);
      else if (d >= yesterday) groups['Yesterday'].push(c);
      else if (d >= week) groups['This Week'].push(c);
      else groups['Older'].push(c);
    });
    return groups;
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    if (listening) { recognizerRef.current?.stop(); setListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognizerRef.current = recognition;
    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);
    recognition.onerror  = () => setListening(false);
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript; setInput(t); setTimeout(() => sendMessage(t), 300);
    };
    recognition.start();
  }, [listening, speechLang]);

  const speakMessage = useCallback((text, id) => {
    if (!synth) return;
    if (speakingId === id) { stopSpeaking(); return; }
    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(stripMarkdown(text));
    utter.lang = speechLang; utter.rate = 0.95; utter.pitch = 1;
    const voices = synth.getVoices();
    const pref = voices.find(v => v.lang === speechLang || v.lang.startsWith(speechLang.split('-')[0]));
    if (pref) utter.voice = pref;
    utter.onstart = () => setSpeakingId(id);
    utter.onend   = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    synth.speak(utter);
  }, [speakingId, speechLang]);

  const stopSpeaking = () => { synth?.cancel(); setSpeakingId(null); };

  const translateMessage = async (text, id, currentLang) => {
    if (translations[id]) { setTranslations(prev => { const n={...prev}; delete n[id]; return n; }); return; }
    setTranslating(prev => ({ ...prev, [id]: true }));
    const tgt = currentLang === 'hi-IN' ? 'en' : 'hi';
    try {
      const res = await axios.post(`${API_URL}/api/chat`, {
        message: `Translate the following text to ${tgt === 'hi' ? 'Hindi' : 'English'}, preserve markdown formatting:\n\n${text}`,
        history: [], language: tgt,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setTranslations(prev => ({ ...prev, [id]: res.data.reply }));
    } catch {}
    finally { setTranslating(prev => { const n={...prev}; delete n[id]; return n; }); }
  };

  const handleCopy = async (text, id) => {
    await copyToClipboard(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPDF = async (text, query, msgId) => {
    const title = query ? query.slice(0, 60) : 'ERP Report';
    // If chart view is active for this message, preview the captured chart image first.
    if (msgId && chartOn[msgId] && chartRefs.current[msgId]) {
      try {
        const canvas = await html2canvas(chartRefs.current[msgId], { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        setPdfPreview({ title, imgSrc: imgData, onDownload: () => downloadChartPDF(imgData, title, user.company_name || 'Ayaam ERP') });
        return;
      } catch (e) {
        // Fall through to table PDF if capture fails
      }
    }
    setPdfPreview({
      title,
      html: markdownToHtml(text),
      onDownload: () => downloadAsPDF(text, title, user.company_name || 'Ayaam ERP'),
    });
  };

  const downloadChartPDF = (imgData, title, companyName) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<style>body{margin:0;font-family:Arial,sans-serif}' +
      '.hdr{padding:14px 20px;border-bottom:2px solid #1565C0;display:flex;justify-content:space-between;align-items:center}' +
      '.brand{font-size:18px;font-weight:800;color:#1565C0}.brand span{color:#FF6B2B}' +
      '.meta{font-size:11px;color:#888;text-align:right}' +
      'img{display:block;max-width:100%;margin:18px auto;padding:0 20px;box-sizing:border-box}' +
      '@media print{.noprint{display:none}}</style></head><body>' +
      '<div class="hdr"><div class="brand">AYAAM<span>ERP</span></div>' +
      '<div class="meta"><strong>' + (companyName || 'Ayaam ERP') + '</strong><br>' +
      new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) + '</div></div>' +
      '<img src="' + imgData + '"/>' +
      '<div class="noprint" style="text-align:center;margin:16px"><button onclick="window.print()" ' +
      'style="padding:8px 20px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">Save as PDF</button></div>' +
      '</body></html>'
    );
    w.document.close();
  };

  const handleExportDownload = async (exportSpec, msgId) => {
    if (exportSpec.table === '__inline__') {
      setPdfPreview({
        title: exportSpec.label || 'ERP Report',
        html: markdownToHtml(exportSpec.inlineData),
        onDownload: () => downloadAsPDF(exportSpec.inlineData, exportSpec.label || 'ERP Report', user.company_name || 'Ayaam ERP'),
      });
      return;
    }
    setExportLoading(prev => ({ ...prev, [msgId]: true }));
    try {
      const companyId = user.company_id || 'HOTAGE INDIA';
      const params = new URLSearchParams();
      params.append('table', exportSpec.table); params.append('limit', '10000');
      if (isAdmin && selectedCompany) params.append('company_id', selectedCompany);
      if (exportSpec.filter_col?.trim()) params.append('filter_col', exportSpec.filter_col.trim());
      if (exportSpec.filter_val?.trim()) params.append('filter_val', exportSpec.filter_val.trim());
      if (exportSpec.order_by?.trim())   params.append('order_by',   exportSpec.order_by.trim());
      const lbl2 = (exportSpec.label||'').toLowerCase();
      if ((lbl2.includes('debtor')||lbl2.includes('creditor')||lbl2.includes('customer')||lbl2.includes('supplier')) && exportSpec.table==='ai_party_status')
        params.append('select_cols','party_name,sub_party_type,outstanding_balance,balance_type');
      const res = await axios.get(`${API_URL}/api/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data.success) {
        if (res.data.total_rows===0) { alert('No records found.\nExpected: '+companyId); return; }
        const label = exportSpec.label || 'ERP Report';
        const { tableHtml } = buildExportTableHtml(res.data, label);
        setPdfPreview({
          title: label,
          html: `<div style="font-size:12px;color:#6B7280;margin-bottom:10px">Total Records: <strong>${res.data.total_rows}</strong></div>${tableHtml}`,
          onDownload: () => downloadExportPDF(res.data, label, user.company_name||'Ayaam ERP'),
        });
      } else { alert('Export failed: '+res.data.error); }
    } catch(e) { alert('Export error: '+(e.response?.data?.error||e.message)); }
    finally { setExportLoading(prev => ({ ...prev, [msgId]: false })); }
  };

  const fmt     = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const groups  = groupedChats();

  const hr = new Date().getHours();
  const firstName = (user.name || '').split(' ')[0] || 'there';
  // Time-based greeting bucket → a rotating set of headlines, one picked per mount
  const heroHeadline = React.useMemo(() => {
    let pool;
    if (hr < 12) {
      pool = [
        `Good morning, ${firstName}`,
        `Morning, ${firstName} — ready to dive in?`,
        `Rise and shine, ${firstName}`,
        `A fresh start, ${firstName}`,
      ];
    } else if (hr < 17) {
      pool = [
        `Good afternoon, ${firstName}`,
        `Afternoon, ${firstName} — what's on your mind?`,
        `Ready to explore, ${firstName}?`,
        `How's business, ${firstName}?`,
      ];
    } else if (hr < 21) {
      pool = [
        `Good evening, ${firstName}`,
        `Evening, ${firstName} — let's wrap up the day`,
        `Winding down, ${firstName}?`,
        `How did today go, ${firstName}?`,
      ];
    } else {
      pool = [
        `Working late, ${firstName}?`,
        `Burning the midnight oil, ${firstName}?`,
        `Good evening, ${firstName}`,
        `Still going, ${firstName}?`,
      ];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }, [hr, firstName]);
  const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';

  /* ── Render ─────────────────────────────────────────────────────────────── */
  if (isAdmin && showAdmin) {
    return <AdminPanel user={user} onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div style={S.root} data-ayaam-theme={theme}>
      <style>{THEME_CSS}</style>

      {/* Animated mesh hero background (behind everything, in the main area) */}
      <div aria-hidden="true" className="ay-mesh" style={S.mesh}>
        <div className="ay-blob ay-blob1" />
        <div className="ay-blob ay-blob2" />
        <div className="ay-blob ay-blob3" />
        <div className="ay-blob ay-blob4" />
        <div className="ay-blob ay-blob5" />
        <div className="ay-mesh-dots" />
      </div>

      {sidebarOpen && isMobile && <div style={S.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* PDF Preview slide-over */}
      {pdfPreview && (
        <div style={S.pdfOverlay}>
          <div style={S.pdfBackdrop} className="pdf-backdrop" onClick={() => setPdfPreview(null)} />
          <div style={S.pdfPanel} className="pdf-panel">
            <div style={S.pdfHeader}>
              <span style={S.pdfHeaderIcon}><Ic.Download /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.pdfHeaderTitle}>PDF Preview</div>
                <div style={S.pdfHeaderSub}>{pdfPreview.title}</div>
              </div>
              <button style={S.pdfCloseBtn} onClick={() => setPdfPreview(null)}><Ic.Close /></button>
            </div>
            <div style={S.pdfBody}>
              <div style={S.pdfSheet}>
                <div style={S.pdfSheetBrand}>AYAAM<span style={{ color: '#07111F', fontWeight: 600, fontSize: '0.8rem', marginLeft: 3 }}>ERP</span></div>
                {pdfPreview.imgSrc
                  ? <img src={pdfPreview.imgSrc} alt="Chart preview" style={{ maxWidth: '100%', display: 'block' }} />
                  : <div className="md-body" dangerouslySetInnerHTML={{ __html: pdfPreview.html }} />
                }
              </div>
            </div>
            <div style={S.pdfFooter}>
              <button style={S.pdfCloseFullBtn} onClick={() => setPdfPreview(null)}>Close</button>
              <button style={S.pdfDownloadBtn} onClick={() => { pdfPreview.onDownload(); setPdfPreview(null); }}>
                <Ic.Download />Download PDF
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside style={{ ...S.sidebar, width: sidebarOpen ? 260 : 0, position: isMobile ? 'fixed' : 'relative', zIndex: isMobile ? 1000 : 'auto', height: '100vh', top: 0, left: 0 }}>
        <div style={S.sidebarInner}>

          {/* Brand mark */}
          <div style={S.brand}>
            <div style={S.brandMark}>
              <img src={aivaMark} alt="AIVA" style={S.brandMarkImg} />
            </div>
            <div>
              <div style={S.brandTitle}>AIVA Assistant</div>
              <div style={S.brandSub}>AYAAM ERP</div>
            </div>
          </div>

          {/* New conversation */}
          <button style={S.newChatBtn} className="new-chat-btn" onClick={newChat}>
            <Ic.Plus />
            <span>New Conversation</span>
          </button>

          {/* Language toggle */}
          <div style={S.langRow}>
            <span style={S.langLabel}>Language</span>
            <div style={S.langToggle}>
              <button className={`lang-btn${speechLang==='en-IN'?' lang-active':''}`}
                style={{ ...S.langBtn, ...(speechLang==='en-IN' ? S.langBtnOn : {}) }}
                onClick={() => setSpeechLang('en-IN')}>EN</button>
              <button className={`lang-btn${speechLang==='hi-IN'?' lang-active':''}`}
                style={{ ...S.langBtn, ...(speechLang==='hi-IN' ? S.langBtnOn : {}) }}
                onClick={() => setSpeechLang('hi-IN')}>हि</button>
            </div>
          </div>

          {/* Admin: company selector */}
          {isAdmin && (
            <div style={S.companyRow}>
              <span style={S.langLabel}>Viewing Company</span>
              <select
                style={S.companySelect}
                className="company-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">— Select a company —</option>
                {companyList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {!selectedCompany && (
                <div style={S.companyHint}>Pick a company to view its data</div>
              )}
              <button
                style={S.manageUsersBtn}
                className="manage-users-btn"
                onClick={() => setShowAdmin(true)}
              >
                ⚙ Manage Users
              </button>
            </div>
          )}

          {/* Recents label */}
          <div style={S.sectionLabel}>RECENT</div>

          {/* History list */}
          <div style={S.histList}>
            {savedChats.length === 0 ? (
              <div style={S.histEmpty}>
                <Ic.Chat />
                <span>No conversations yet</span>
              </div>
            ) : (
              Object.entries(groups).map(([g, chats]) =>
                chats.length === 0 ? null : (
                  <div key={g}>
                    <div style={S.histGroupLabel}>{g}</div>
                    {chats.map(chat => (
                      <div key={chat.id}
                        className={`hist-item${activeChatId===chat.id?' active':''}`}
                        style={{ ...S.histItem, borderLeftColor: activeChatId===chat.id ? '#2196F3' : 'transparent', background: activeChatId===chat.id ? 'rgba(33,150,243,0.13)' : 'transparent' }}
                        onClick={() => loadChat(chat)}>
                        <span style={S.histIcon}><Ic.Chat /></span>
                        <div style={S.histContent}>
                          <div style={S.histTitle}>{chat.title}</div>
                          <div style={S.histDate}>{fmtDate(chat.updatedAt)}</div>
                        </div>
                        <button className="hist-del" style={S.histDel}
                          onClick={(e) => deleteChat(e, chat.id)} title="Delete">
                          <Ic.Trash />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* User card */}
          <div style={S.userCard}>
            <div style={S.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
            <div style={S.userInfo}>
              <div style={S.userName}>{user.name}</div>
              <div style={S.userRole}>{user.role}</div>
            </div>
            <button style={S.logoutBtn} className="logout-btn" onClick={onLogout} title="Sign out">
              <Ic.Logout />
            </button>
          </div>

          <div style={S.dwFooter}>Datawheel Software Technology LLP</div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════════════════════ */}
      <main style={S.main}>

        {/* Header */}
        <header style={S.header}>
          <button style={S.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
            <span style={{ display:'block', transition:'transform 200ms cubic-bezier(0.23,1,0.32,1)', transform: sidebarOpen ? 'rotate(90deg)' : 'none' }}>
              {sidebarOpen ? <Ic.Close /> : <Ic.Menu />}
            </span>
          </button>

          <div style={S.headerCenter}>
            <span className="status-dot" aria-label="Connected" />
            <span style={S.headerTitle}>
              {isAdmin
                ? (selectedCompany ? `${selectedCompany} (Admin)` : 'Select a company — Admin')
                : (user.company_name || 'Ayaam ERP Assistant')}
            </span>
          </div>

          <div style={S.headerRight}>
            <button style={S.themeToggle} className="theme-toggle" onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.5"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M15 10.5A6.5 6.5 0 1 1 7.5 3a5 5 0 0 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              )}
            </button>
            <span style={S.langBadge}>
              {speechLang === 'hi-IN' ? 'Hindi' : 'English'}
            </span>
            <span style={S.roleBadge}>{user.role}</span>
          </div>
        </header>

        {/* Message area */}
        <div style={S.msgArea}>
          {messages.length === 0 ? (

            /* ── Centered hero empty-state ── */
            <div style={S.hero}>
              <div style={S.heroInner} className="anim-fadeUp">
                <div style={S.connPill}>
                  <span className="status-dot" />
                  <span>Live ERP data · {isAdmin ? (selectedCompany || 'Select a company') : (user.company_name || 'connected')}{isAdmin && selectedCompany ? ' connected' : (!isAdmin ? ' connected' : '')}</span>
                </div>

                <h1 style={S.heroH1}>{heroHeadline}</h1>
                <p style={S.heroSub}>Ask anything about your business — or pick a quick query below.</p>

                {/* Centered chat box */}
                <div style={S.heroBox} className="hero-box">
                  <textarea ref={inputRef} style={S.heroTextarea}
                    placeholder={input ? '' : (speechLang === 'hi-IN' ? 'बिक्री, स्टॉक के बारे में पूछें…' : (heroPlaceholder || 'Ask about sales, stock, party status…'))}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey} onFocus={() => { if (isEmpty && !quickAutoShown.current) { quickAutoShown.current = true; setQuickOpen(true); } }}
                    rows={1} disabled={loading} />
                  <div style={S.heroBoxFooter}>
                    <button className="icon-btn" style={S.heroPlusBtn}
                      onClick={() => setQuickOpen(o => !o)} title="Quick queries">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                    </button>
                    <div style={{ flex: 1 }} />
                    <span style={S.heroLangPill}>English · हिंदी</span>
                    <button className={`icon-btn${listening ? ' mic-pulse' : ''}`}
                      style={{ ...S.heroMicBtn, background: listening ? 'linear-gradient(135deg,#B91C1C,#DC2626)' : 'var(--in-icon-bg)', color: listening ? '#fff' : 'var(--in-icon-txt)' }}
                      onClick={startListening} title="Voice input">
                      {listening ? <Ic.MicOff /> : <Ic.Mic />}
                    </button>
                    <button className="icon-btn" style={{ ...S.heroSendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
                      onClick={() => sendMessage()} disabled={!input.trim() || loading} title="Send">
                      <Ic.Send />
                    </button>
                  </div>
                </div>

                {/* Quick queries pill */}
                <button style={S.quickPill} className="quick-pill" onClick={() => setQuickOpen(o => !o)}>
                  <span style={S.quickPillIcon}>⚡</span>
                  <span style={S.quickPillLabel}>Quick queries</span>
                  <span style={S.quickPillCount}>{QUICK_COUNT}</span>
                  <span style={{ transform: quickOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', display: 'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M4 8.5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </button>
              </div>
            </div>

          ) : (

            /* ── Messages ── */
            <div style={S.msgList}>
              {messages.map((msg, i) => {
                const displayText = translations[msg.id] || msg.text;
                const prevUser = i > 0 && messages[i-1].role === 'user' ? messages[i-1].text : '';

                /* Suggestion card */
                if (msg.suggestions?.length > 0) {
                  return (
                    <div key={i} style={S.msgRowLeft} className="anim-bubble">
                      <div style={S.avatarBot}>AI</div>
                      <div style={{ ...S.bubble, ...S.bubbleBot }}>
                        <div style={S.suggestTitle}>
                          <Ic.HelpCircle />
                          <span>Not sure what you meant. Did you mean one of these?</span>
                        </div>
                        <div style={S.suggestList}>
                          {msg.suggestions.map((q, qi) => (
                            <button key={qi} className="suggest-chip" style={S.suggestChip} onClick={() => sendMessage(q)}>
                              {q}
                            </button>
                          ))}
                        </div>
                        <span style={S.ts}>{fmt(msg.ts)}</span>
                      </div>
                    </div>
                  );
                }

                /* Export card */
                if (msg.exportSpec) {
                  return (
                    <div key={i} style={S.msgRowLeft} className="anim-bubble">
                      <div style={S.avatarBot}>AI</div>
                      <div style={{ ...S.bubble, ...S.bubbleBot, ...S.exportCard }}>
                        <div style={S.exportHead}>
                          <Ic.Package />
                          <span style={S.exportHeadTitle}>Large Dataset Ready</span>
                        </div>
                        <p style={S.exportBody}>
                          {msg.exportSpec.table === '__inline__'
                            ? <><strong>{msg.exportSpec.rowCount} rows</strong> — too large for chat. Download as PDF to view the full report.</>
                            : <>The <strong>{msg.exportSpec.label || 'requested data'}</strong> is ready. Click below to fetch all records and download as PDF.</>
                          }
                        </p>
                        <div style={S.exportMeta}>
                          {user.company_id} · {msg.exportSpec.table}
                          {msg.exportSpec.filter_col && <> · {msg.exportSpec.filter_col} = {msg.exportSpec.filter_val}</>}
                        </div>
                        <button
                          className={exportLoading[msg.id] ? 'shimmer-parent' : ''}
                          style={{ ...S.exportBtn, opacity: exportLoading[msg.id] ? 0.75 : 1, cursor: exportLoading[msg.id] ? 'not-allowed' : 'pointer' }}
                          onClick={() => handleExportDownload(msg.exportSpec, msg.id)}
                          disabled={exportLoading[msg.id]}>
                          {exportLoading[msg.id]
                            ? <><span style={S.miniSpinner} />Fetching data…</>
                            : <><Ic.Download />Preview & Download PDF</>
                          }
                        </button>
                        <span style={{ ...S.ts, display: 'block', textAlign: 'right', marginTop: 8 }}>{fmt(msg.ts)}</span>
                      </div>
                    </div>
                  );
                }

                /* Regular bubble */
                const isUser = msg.role === 'user';
                return (
                  <div key={i} style={isUser ? S.msgRowRight : S.msgRowLeft} className="anim-bubble">
                    {!isUser && <div style={S.avatarBot}>AI</div>}

                    <div style={{
                      ...S.bubble,
                      ...(isUser ? S.bubbleUser : S.bubbleBot),
                      ...(msg.error ? S.bubbleErr : {}),
                    }}>
                      {isUser ? (
                        <>
                          <span style={S.userText}>{msg.text}</span>
                          <div style={S.userFooter}>
                            <button className="act-btn" style={S.actBtnLight}
                              onClick={() => handleCopy(msg.text, `u-${i}`)}>
                              <Ic.Copy done={copiedId===`u-${i}`} />
                              {copiedId===`u-${i}` ? 'Copied' : 'Copy'}
                            </button>
                            <span style={{ ...S.ts, color: 'rgba(255,255,255,0.45)' }}>{fmt(msg.ts)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {chartOn[msg.id] ? (
                            <ChartView text={displayText} ref={el => { chartRefs.current[msg.id] = el; }} />
                          ) : (
                            <div className="md-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
                            </div>
                          )}
                          <div style={S.actBar}>
                            <div style={S.actGroup}>
                              <button className="act-btn" style={{ ...S.actBtnDark, ...(speakingId===msg.id ? S.actBtnActive : {}) }}
                                onClick={() => speakMessage(displayText, msg.id)}>
                                <Ic.Volume active={speakingId===msg.id} />
                                {speakingId===msg.id ? 'Stop' : 'Read'}
                              </button>
                              <button className="act-btn" style={{ ...S.actBtnDark, ...(translations[msg.id] ? S.actBtnOrange : {}) }}
                                onClick={() => translateMessage(msg.text, msg.id, speechLang)}>
                                <Ic.Globe />
                                {translating[msg.id] ? '…' : translations[msg.id] ? 'Original' : 'Translate'}
                              </button>
                              <button className="act-btn" style={{ ...S.actBtnDark, ...(copiedId===msg.id ? S.actBtnGreen : {}) }}
                                onClick={() => handleCopy(displayText, msg.id)}>
                                <Ic.Copy done={copiedId===msg.id} />
                                {copiedId===msg.id ? 'Copied' : 'Copy'}
                              </button>
                              {(() => {
                                const canChart = isChartable(displayText);
                                return (
                                  <button className="act-btn"
                                    style={{ ...S.actBtnDark, ...(chartOn[msg.id] ? S.actBtnBlue : {}), ...(canChart ? {} : S.actBtnDisabled) }}
                                    onClick={() => {
                                      if (!canChart) {
                                        setChartNotice(msg.id);
                                        setTimeout(() => setChartNotice(null), 2600);
                                        return;
                                      }
                                      setChartOn(p => ({ ...p, [msg.id]: !p[msg.id] }));
                                    }}>
                                    <Ic.Chart />
                                    {chartOn[msg.id] ? 'Table' : 'Chart'}
                                  </button>
                                );
                              })()}
                              <button className="act-btn" style={S.actBtnPurple}
                                onClick={() => handleDownloadPDF(displayText, prevUser, msg.id)}>
                                <Ic.Download />
                                PDF
                              </button>
                            </div>
                            <span style={S.ts}>{fmt(msg.ts)}</span>
                          </div>
                          {chartNotice === msg.id && (
                            <div style={S.chartNotice}>
                              No chartable data in this response — there's nothing to plot here.
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {isUser && <div style={S.avatarUser}>{user.name.charAt(0)}</div>}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <div style={S.msgRowLeft} className="anim-bubble">
                  <div style={S.avatarBot}>AI</div>
                  <div style={{ ...S.bubble, ...S.bubbleBot, ...S.typingBubble }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span style={S.typingLabel}>
                      {speechLang === 'hi-IN' ? 'डेटा लोड हो रहा है…' : 'Fetching data…'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input (only during a conversation; empty state uses the hero box) ── */}
        {messages.length > 0 && (
        <div style={S.inputArea}>
          <div style={S.followUpRow}>
              {(RELATED_QUERIES[messages.filter(m => m.role === 'user').slice(-1)[0]?.text] || DEFAULT_FOLLOW_UPS)
                .map(label => (
                  <button key={label} className="follow-up-chip" style={S.followUpChip}
                    onClick={() => sendMessage(QUERY_BY_LABEL[label] || label, label)}>
                    {label}
                  </button>
                ))}
            </div>
          <div style={S.inputWrap} className="input-wrap">
            <button className="icon-btn" style={S.quickBtn}
              onClick={() => setQuickOpen(o => !o)} title="Quick queries">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 4.5h12M3 9h12M3 13.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="14" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
            </button>
            <button className={`icon-btn${listening ? ' mic-pulse' : ''}`}
              style={{ ...S.micBtn, background: listening ? 'linear-gradient(135deg,#B91C1C,#DC2626)' : 'linear-gradient(135deg,#1565C0,#2196F3)' }}
              onClick={startListening} title={listening ? 'Stop listening' : 'Voice input'}>
              {listening ? <Ic.MicOff /> : <Ic.Mic />}
            </button>

            <textarea ref={inputRef} style={S.textarea}
              placeholder={speechLang === 'hi-IN' ? 'बिक्री, स्टॉक, पार्टी स्टेटस के बारे में पूछें…' : 'Ask about sales, stock, party status, collections…'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} rows={1} disabled={loading} />

            <button className="icon-btn"
              style={{ ...S.sendBtn, opacity: (!input.trim() || loading) ? 0.38 : 1 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading} title="Send">
              <Ic.Send />
            </button>
          </div>
          <div style={S.inputHint}>
            {listening ? '🎤 Listening… speak now' : 'Enter to send · Shift+Enter for new line'}
          </div>
        </div>
        )}

        {/* ── Quick-queries centered modal ── */}
        {quickOpen && (
          <div style={S.quickOverlay}>
            <div style={S.quickBackdrop} onClick={() => setQuickOpen(false)} />
            <div style={S.quickModal} className="anim-fadeUp">
              <div style={S.quickModalHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={S.quickModalIcon}>⚡</span>
                  <div>
                    <div style={S.quickModalTitle}>Quick queries</div>
                    <div style={S.quickModalSub}>Pick a ready-made question — it runs instantly</div>
                  </div>
                </div>
                <button style={S.pdfCloseBtn} onClick={() => setQuickOpen(false)}><Ic.Close /></button>
              </div>
              <div style={S.quickModalGrid}>
                {DASHBOARD_CARDS.map(card => (
                  <div key={card.id} style={S.quickCard}>
                    <div style={{ ...S.cardBand, background: card.color, borderRadius: '11px 11px 0 0' }}>
                      <span style={S.cardBandIcon}><card.Icon color="#fff" /></span>
                      <span style={S.cardBandLabel}>{card.label}</span>
                    </div>
                    <div style={{ padding: '6px 8px 10px' }}>
                      {card.queries.map((q, qi) => (
                        <button key={qi} className="dash-query-btn"
                          style={{ ...S.cardQuery, borderLeftColor: card.color }}
                          onClick={() => { sendMessage(q.text, q.label); setQuickOpen(false); }}>
                          <span style={{ ...S.cardQueryDot, background: card.color }} />
                          <span style={S.cardQueryLabel}>{q.label}</span>
                          <span style={S.cardQueryArrow}><Ic.ArrowRight /></span>
                        </button>
                      ))}
                      <div style={{ ...S.cardHint, color: card.color }}>Ask anything about {card.label.toLowerCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════════════════ */
const S = {
  /* Shell */
  root:    { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter','Plus Jakarta Sans',system-ui,sans-serif", background:'var(--app-bg)', position:'relative' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:999, backdropFilter:'blur(4px)' },

  /* ── Sidebar ── */
  sidebar:      { background:'var(--side-bg)', transition:'width 320ms cubic-bezier(0.32,0.72,0,1), background-color 0.42s ease', flexShrink:0, overflow:'hidden', position:'relative', zIndex:2 },
  sidebarInner: { width:260, height:'100%', display:'flex', flexDirection:'column', padding:'1.1rem 0.85rem', gap:'0.55rem' },

  brand:         { display:'flex', alignItems:'center', gap:'0.75rem', paddingBottom:'0.85rem', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  brandMark:     { width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.92)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(15,23,42,0.10)' },
  brandMarkImg:  { width:'68%', height:'68%', objectFit:'contain' },
  brandTitle:    { color:'var(--side-name)', fontWeight:800, fontSize:'0.86rem', letterSpacing:'-0.01em', lineHeight:1.15, fontFamily:"'Plus Jakarta Sans',sans-serif" },
  brandSub:      { color:'var(--side-sub)', fontSize:'0.66rem', fontWeight:500, marginTop:2, letterSpacing:'0.02em' },

  newChatBtn:    { display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(33,150,243,0.10)', color:'#60A5FA', border:'1px solid rgba(33,150,243,0.20)', borderRadius:9, padding:'0.58rem 0.9rem', fontSize:'0.80rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.01em' },

  langRow:       { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 0.2rem' },
  langLabel:     { fontSize:'0.60rem', color:'var(--side-sub)', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase' },
  langToggle:    { display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:7, padding:2, gap:2 },
  companyRow:    { display:'flex', flexDirection:'column', gap:'0.4rem', padding:'0.6rem 0.2rem 0', marginTop:'0.5rem', borderTop:'1px solid rgba(255,255,255,0.06)' },
  companySelect: { width:'100%', padding:'0.5rem 0.6rem', borderRadius:8, background:'var(--side-brand-bg)', color:'var(--side-name)', border:'1px solid var(--side-brand-border)', fontSize:'0.8rem', fontFamily:'inherit', cursor:'pointer', outline:'none' },
  companyHint:   { fontSize:'0.66rem', color:'#FFB74D', fontWeight:500, letterSpacing:'0.01em', paddingLeft:'0.1rem' },
  manageUsersBtn:{ width:'100%', marginTop:'0.5rem', padding:'0.55rem 0.6rem', borderRadius:8, background:'rgba(33,150,243,0.14)', color:'#90CAF9', border:'1px solid rgba(33,150,243,0.3)', fontSize:'0.8rem', fontWeight:600, fontFamily:'inherit', cursor:'pointer', transition:'background 150ms' },
  langBtn:       { padding:'0.24rem 0.55rem', borderRadius:5, border:'none', background:'transparent', color:'var(--side-sub)', fontSize:'0.70rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  langBtnOn:     { background:'#1565C0', color:'#fff', boxShadow:'0 2px 10px rgba(21,101,192,0.50)' },

  sectionLabel:  { fontSize:'0.58rem', fontWeight:700, color:'var(--side-sub)', letterSpacing:'0.14em', padding:'0.3rem 0.2rem 0', textTransform:'uppercase' },

  histList:        { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:1, minHeight:0 },
  histEmpty:       { display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', padding:'2rem 0', color:'rgba(255,255,255,0.18)', fontSize:'0.74rem', fontStyle:'italic' },
  histGroupLabel:  { fontSize:'0.58rem', color:'var(--side-sub)', fontWeight:700, letterSpacing:'0.08em', padding:'0.5rem 0.4rem 0.2rem', textTransform:'uppercase' },
  histItem:        { display:'flex', alignItems:'center', gap:'0.45rem', padding:'0.42rem 0.45rem', borderRadius:8, cursor:'pointer', borderLeft:'2px solid transparent' },
  histIcon:        { flexShrink:0, color:'var(--side-sub)' },
  histContent:     { flex:1, minWidth:0 },
  histTitle:       { fontSize:'0.76rem', color:'var(--side-name)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  histDate:        { fontSize:'0.60rem', color:'var(--side-sub)', marginTop:1 },
  histDel:         { background:'none', border:'none', cursor:'pointer', padding:'0.2rem', borderRadius:5, color:'rgba(255,255,255,0.22)', lineHeight:1, flexShrink:0 },

  userCard:   { display:'flex', alignItems:'center', gap:'0.55rem', background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'0.55rem 0.7rem', border:'1px solid rgba(255,255,255,0.07)' },
  userAvatar: { width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1565C0,#FF6B2B)', color:'#fff', fontWeight:700, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" },
  userInfo:   { flex:1, minWidth:0 },
  userName:   { color:'var(--side-name)', fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userRole:   { color:'var(--side-sub)', fontSize:'0.62rem', marginTop:1 },
  logoutBtn:  { background:'none', border:'none', color:'var(--side-sub)', cursor:'pointer', padding:'0.2rem', lineHeight:1, flexShrink:0 },

  dwFooter: { fontSize:'0.58rem', color:'var(--side-sub)', textAlign:'center', padding:'0.2rem', fontWeight:500 },

  /* ── Main ── */
  main: { flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', minWidth:0, position:'relative', zIndex:1, background:'transparent' },

  /* Header */
  header: { display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.8rem 1.25rem', background:'var(--head-bg)', backdropFilter:'blur(18px)', borderBottom:'1px solid var(--head-border)', flexShrink:0, position:'relative', zIndex:3 },
  menuBtn: { background:'none', border:'none', cursor:'pointer', color:'#374151', padding:'0.28rem', borderRadius:7, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' },
  headerCenter: { flex:1, display:'flex', alignItems:'center', gap:'0.55rem' },
  headerTitle:  { fontWeight:650, fontSize:'0.92rem', color:'var(--head-title)', letterSpacing:'-0.01em', fontFamily:"'Plus Jakarta Sans',sans-serif" },
  headerRight:  { display:'flex', alignItems:'center', gap:'0.45rem' },
  langBadge:    { background:'#F3F4F6', color:'#374151', padding:'0.2rem 0.6rem', borderRadius:99, fontSize:'0.68rem', fontWeight:600 },
  roleBadge:    { background:'#EFF6FF', color:'#1565C0', padding:'0.2rem 0.7rem', borderRadius:99, fontSize:'0.68rem', fontWeight:700, border:'1px solid #BFDBFE' },

  /* Messages */
  msgArea: { flex:1, overflow:'auto', padding:'1.1rem 1.25rem', display:'flex', flexDirection:'column', position:'relative', zIndex:2 },

  /* Dashboard */
  dashboard:    { flex:1, paddingBottom:'1rem' },
  dashWelcome:  { marginBottom:'1.6rem' },
  dashGreeting: { fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'1.55rem', fontWeight:800, color:'var(--head-title)', letterSpacing:'-0.03em', marginBottom:'0.3rem' },
  dashSub:      { fontSize:'0.875rem', color:'var(--glass-dim)', fontWeight:400 },
  dashGrid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:'0.8rem' },

  /* Card */
  dashCard:      { background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)', border:'none' },
  cardBand:      { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 0.875rem' },
  cardBandIcon:  { flexShrink:0, display:'flex', alignItems:'center' },
  cardBandLabel: { color:'#fff', fontWeight:700, fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'Inter',sans-serif" },
  cardBody:      { padding:'0.45rem 0.6rem 0.6rem', display:'flex', flexDirection:'column', gap:'0.2rem' },
  cardQuery:     { display:'flex', alignItems:'center', gap:'0.45rem', padding:'0.42rem 0.6rem', background:'transparent', border:'none', borderLeft:'3px solid transparent', borderRadius:7, cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'inherit' },
  cardQueryDot:  { width:5, height:5, borderRadius:'50%', flexShrink:0 },
  cardQueryLabel:{ flex:1, fontSize:'0.78rem', color:'#07111F', fontWeight:500, letterSpacing:'-0.01em' },
  cardQueryArrow:{ color:'#D1D5DB', flexShrink:0 },
  cardHint:      { fontSize:'0.65rem', fontStyle:'italic', fontWeight:500, padding:'0.25rem 0.6rem 0', opacity:0.7, letterSpacing:'0.01em' },

  /* Msgs list */
  msgList:    { display:'flex', flexDirection:'column', gap:'1rem' },
  msgRowLeft: { display:'flex', alignItems:'flex-end', gap:'0.5rem', justifyContent:'flex-start' },
  msgRowRight:{ display:'flex', alignItems:'flex-end', gap:'0.5rem', justifyContent:'flex-end' },

  avatarBot:  { width:28, height:28, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#1565C0,#2196F3)', color:'#fff', fontSize:'0.60rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(21,101,192,0.32)', letterSpacing:'-0.02em', fontFamily:"'Plus Jakarta Sans',sans-serif" },
  avatarUser: { width:28, height:28, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#FF6B2B,#E65100)', color:'#fff', fontSize:'0.75rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Plus Jakarta Sans',sans-serif" },

  bubble:     { maxWidth:'min(74%, 600px)', borderRadius:16, padding:'0.75rem 0.95rem', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  bubbleUser: { background:'linear-gradient(135deg,#1565C0,#2196F3)', color:'#fff', borderBottomRightRadius:4, boxShadow:'0 4px 16px rgba(21,101,192,0.28)' },
  bubbleBot:  { background:'#fff', color:'#07111F', border:'1px solid #E5E7EB', borderBottomLeftRadius:4 },
  bubbleErr:  { background:'#FEF2F2', border:'1px solid #FECACA' },

  userText:   { fontSize:'0.88rem', lineHeight:1.6, display:'block', letterSpacing:'-0.005em' },
  userFooter: { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8, gap:8 },
  ts:         { fontSize:'0.63rem', color:'#9CA3AF', flexShrink:0, fontVariantNumeric:'tabular-nums' },

  actBar:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'0.5rem', paddingTop:'0.4rem', borderTop:'1px solid #F3F4F6', gap:'0.4rem' },
  actGroup:  { display:'flex', gap:3, flexWrap:'wrap' },

  /* Action button variants */
  actBtnDark:   { background:'#F9FAFB', color:'#4B5563', border:'1px solid #E5E7EB' },
  actBtnLight:  { background:'rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.80)', border:'1px solid rgba(255,255,255,0.14)' },
  actBtnActive: { background:'#EFF6FF', color:'#1565C0', border:'1px solid #BFDBFE' },
  actBtnOrange: { background:'#FFF7ED', color:'#C2410C', border:'1px solid #FED7AA' },
  actBtnGreen:  { background:'#F0FDF4', color:'#166534', border:'1px solid #BBF7D0' },
  actBtnBlue:   { background:'#EFF6FF', color:'#1565C0', border:'1px solid #BFDBFE' },
  actBtnDisabled: { opacity:0.4, cursor:'not-allowed' },
  chartNotice:  { marginTop:'0.4rem', fontSize:'0.78rem', color:'#92400E', background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, padding:'0.5rem 0.75rem', display:'inline-block' },
  actBtnPurple: { background:'#FAF5FF', color:'#7E22CE', border:'1px solid #E9D5FF' },

  /* Suggest */
  suggestTitle: { display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.82rem', fontWeight:600, color:'#374151', marginBottom:'0.65rem', lineHeight:1.45 },
  suggestList:  { display:'flex', flexDirection:'column', gap:'0.4rem' },
  suggestChip:  { background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'0.48rem 0.75rem', fontSize:'0.79rem', fontWeight:500, color:'#1565C0', cursor:'pointer', textAlign:'left', fontFamily:'inherit', lineHeight:1.4 },

  /* Typing */
  typingBubble: { display:'flex', alignItems:'center', gap:'0.55rem', padding:'0.6rem 0.95rem' },
  typingLabel:  { fontSize:'0.76rem', color:'#9CA3AF', fontStyle:'italic', letterSpacing:'0.01em' },

  /* Export */
  exportCard:     { maxWidth:430, padding:'1rem 1.1rem' },
  exportHead:     { display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.55rem' },
  exportHeadTitle:{ fontWeight:700, fontSize:'0.88rem', color:'#1565C0', fontFamily:"'Plus Jakarta Sans',sans-serif" },
  exportBody:     { fontSize:'0.82rem', color:'#374151', marginBottom:'0.65rem', lineHeight:1.6 },
  exportMeta:     { fontSize:'0.70rem', color:'#6B7280', marginBottom:'0.6rem', background:'#F9FAFB', borderRadius:6, padding:'0.28rem 0.6rem', fontFamily:"'JetBrains Mono',monospace" },
  exportBtn:      { display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', width:'100%', padding:'0.58rem 1rem', background:'linear-gradient(135deg,#1565C0,#2196F3)', color:'#fff', border:'none', borderRadius:9, fontWeight:650, fontSize:'0.82rem', fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 16px rgba(21,101,192,0.32)' },
  miniSpinner:    { width:13, height:13, border:'2px solid rgba(255,255,255,0.30)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.65s linear infinite', flexShrink:0 },

  /* Input */
  inputArea:  { padding:'0.8rem 1.25rem 1rem', background:'transparent', flexShrink:0, position:'relative', zIndex:3 },
  followUpRow: { display:'flex', gap:'0.4rem', overflowX:'auto', paddingBottom:'0.55rem', marginBottom:'0.15rem' },
  followUpChip: { flexShrink:0, whiteSpace:'nowrap', fontSize:'0.7rem', fontWeight:500, color:'#6B7280', background:'#F9FAFB', border:'1px solid #EEF2F7', borderRadius:99, padding:'0.32rem 0.7rem', cursor:'pointer', fontFamily:'inherit' },
  inputWrap:  { display:'flex', alignItems:'flex-end', gap:'0.55rem', background:'var(--in-bg)', borderRadius:13, border:'1px solid var(--in-border)', padding:'0.45rem 0.45rem 0.45rem 0.55rem', boxShadow:'var(--in-box-shadow)', maxWidth:860, margin:'0 auto' },
  micBtn:     { width:36, height:36, borderRadius:9, flexShrink:0, color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  textarea:   { flex:1, resize:'none', border:'none', background:'transparent', fontSize:'0.875rem', fontFamily:'inherit', color:'var(--in-txt)', outline:'none', lineHeight:1.6, maxHeight:120, overflow:'auto', padding:'0.1rem 0', letterSpacing:'-0.005em' },
  sendBtn:    { width:36, height:36, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,#1565C0,#2196F3)', color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(21,101,192,0.30)' },
  inputHint:  { fontSize:'0.63rem', color:'var(--in-ph)', textAlign:'center', marginTop:'0.4rem', letterSpacing:'0.01em' },

  /* PDF preview slide-over */
  pdfOverlay:      { position:'fixed', inset:0, zIndex:1200 },
  pdfBackdrop:      { position:'absolute', inset:0, background:'rgba(5,10,22,0.4)', backdropFilter:'blur(3px)' },
  pdfPanel:         { position:'absolute', top:0, right:0, bottom:0, width:'min(440px, 92vw)', background:'#F3F4F6', boxShadow:'-16px 0 60px rgba(5,10,25,0.35)', display:'flex', flexDirection:'column' },
  pdfHeader:        { display:'flex', alignItems:'center', gap:'0.65rem', padding:'1rem 1.1rem', background:'#fff', borderBottom:'1px solid #EAEFF6', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  pdfHeaderIcon:    { display:'flex', color:'#7E22CE' },
  pdfHeaderTitle:   { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:'0.92rem', color:'#07111F', letterSpacing:'-0.01em' },
  pdfHeaderSub:     { fontSize:'0.68rem', color:'#6B7280', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  pdfCloseBtn:      { width:30, height:30, borderRadius:8, border:'1px solid #E5E7EB', background:'#F9FAFB', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  pdfBody:          { flex:1, overflowY:'auto', padding:'1.1rem' },
  pdfSheet:         { background:'#fff', borderRadius:6, padding:'1.5rem 1.3rem', boxShadow:'0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)', minHeight:'100%' },
  pdfSheetBrand:    { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1rem', color:'#1565C0', letterSpacing:'0.02em', paddingBottom:'0.7rem', marginBottom:'0.9rem', borderBottom:'2px solid #1565C0' },
  pdfFooter:        { display:'flex', gap:'0.6rem', padding:'0.9rem 1.1rem', background:'#fff', borderTop:'1px solid #EAEFF6', flexShrink:0 },
  pdfCloseFullBtn:  { flex:1, padding:'0.6rem 1rem', borderRadius:9, background:'#F3F4F6', color:'#374151', border:'1px solid #E5E7EB', fontSize:'0.82rem', fontWeight:600, fontFamily:'inherit', cursor:'pointer' },
  pdfDownloadBtn:   { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0.6rem 1rem', borderRadius:9, background:'linear-gradient(135deg,#1565C0,#2196F3)', color:'#fff', border:'none', fontSize:'0.82rem', fontWeight:650, fontFamily:'inherit', cursor:'pointer', boxShadow:'0 4px 14px rgba(21,101,192,0.32)' },

  /* ── Stage 2+: centered hero empty-state ── */
  mesh: { position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' },
  themeToggle: { width: 32, height: 32, borderRadius: 9, border: '1px solid var(--head-border)', background: 'var(--head-lang-bg)', color: 'var(--head-lang-txt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickBtn: { width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: '1px solid var(--in-icon-border)', background: 'var(--in-icon-bg)', color: 'var(--in-icon-txt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  hero: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 2 },
  heroInner: { width: '100%', maxWidth: 780, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  connPill: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'var(--glass-txt)', marginBottom: 24, boxShadow: 'var(--glass-shadow)' },
  heroH1: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(34px,5vw,58px)', fontWeight: 800, color: 'var(--hero-h1)', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 14, textShadow: 'var(--hero-h1-shadow)' },
  heroSub: { fontSize: 'clamp(15px,1.6vw,18px)', color: 'var(--hero-sub)', marginBottom: 34, fontWeight: 450, textShadow: 'var(--hero-sub-shadow)' },
  heroBox: { width: '100%', maxWidth: 720, background: 'var(--in-bg)', border: '1px solid var(--in-border)', borderRadius: 20, padding: '16px 16px 12px', boxShadow: 'var(--in-box-shadow)', textAlign: 'left' },
  heroTextarea: { width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontSize: 16, fontFamily: 'inherit', color: 'var(--in-txt)', lineHeight: 1.5, minHeight: 48, maxHeight: 160, padding: '4px 2px' },
  heroBoxFooter: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  heroPlusBtn: { width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: '1px solid var(--in-icon-border)', background: 'var(--in-icon-bg)', color: 'var(--in-icon-txt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroLangPill: { fontSize: 13, fontWeight: 600, color: 'var(--in-chip-txt)', background: 'var(--glass-chip-bg)', borderRadius: 99, padding: '6px 12px' },
  heroMicBtn: { width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: '1px solid var(--in-icon-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroSendBtn: { width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 160ms' },
  quickPill: { display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: 99, padding: '9px 16px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--glass-txt)', boxShadow: 'var(--glass-shadow)', transition: 'transform 150ms' },
  quickPillIcon: { fontSize: 14 },
  quickPillLabel: { fontSize: 14, fontWeight: 650 },
  quickPillCount: { fontSize: 11.5, fontWeight: 700, color: 'var(--glass-dim)', background: 'var(--glass-chip-bg)', borderRadius: 99, padding: '1px 8px' },

  /* Quick-queries centered modal */
  quickOverlay: { position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  quickBackdrop: { position: 'absolute', inset: 0, background: 'rgba(7,17,31,0.5)', backdropFilter: 'blur(3px)' },
  quickModal: { position: 'relative', width: '100%', maxWidth: 1000, maxHeight: '86vh', overflowY: 'auto', background: 'var(--app-bg)', borderRadius: 20, padding: 22, boxShadow: '0 40px 100px rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)' },
  quickModalHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  quickModalIcon: { fontSize: 20 },
  quickModalTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--head-title)', letterSpacing: '-0.02em' },
  quickModalSub: { fontSize: 12.5, color: 'var(--glass-dim)', marginTop: 2 },
  quickModalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 },
  quickCard: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
};
/* ══════════════════════════════════════════════════════════════════════════════
   THEME PALETTES + ANIMATED MESH  (Stage 2)
══════════════════════════════════════════════════════════════════════════════ */
const THEME_CSS = `
[data-ayaam-theme="light"]{
  --app-bg:#EAF0F7; --side-bg:#F4F7FB;
  --side-name:#0E2138; --side-sub:rgba(14,33,56,0.5);
  --side-brand-bg:rgba(21,101,192,0.06); --side-brand-border:rgba(21,101,192,0.14);
  --head-bg:rgba(255,255,255,0.86); --head-border:#E5E7EB; --head-title:#07111F;
  --head-lang-bg:#F3F4F6; --head-lang-txt:#374151;
  --glass-bg:rgba(255,255,255,0.82); --glass-border:rgba(21,101,192,0.16); --glass-txt:#12325a; --glass-dim:rgba(18,50,90,0.5);
  --glass-shadow:0 10px 30px rgba(21,101,192,0.14); --glass-chip-bg:rgba(21,101,192,0.08);
  --hero-h1:#0B1A2E; --hero-sub:rgba(11,26,46,0.62); --hero-h1-shadow:0 2px 24px rgba(21,101,192,0.10); --hero-sub-shadow:none;
  --in-bg:linear-gradient(180deg,#FFFFFF,#F2F7FD); --in-border:rgba(21,101,192,0.18); --in-txt:#0B1A2E; --in-ph:rgba(11,26,46,0.4); --in-chip-txt:#1565C0;
  --in-icon-bg:#EDF3FB; --in-icon-border:rgba(21,101,192,0.16); --in-icon-txt:#1565C0;
  --in-box-shadow:0 24px 60px rgba(21,101,192,0.15),0 4px 14px rgba(7,17,31,0.06);
  --mesh-base:linear-gradient(178deg,#FCFDFF 0%,#EEF4FC 38%,#DCEAFB 66%,#C3DCF7 100%);
  --blob1:radial-gradient(circle at 40% 40%,rgba(96,165,250,0.55) 0%,rgba(33,150,243,0.3) 46%,transparent 72%);
  --blob2:radial-gradient(circle at 50% 45%,rgba(255,176,130,0.3) 0%,rgba(147,197,253,0.3) 46%,transparent 72%);
  --blob3:radial-gradient(circle at 55% 45%,rgba(147,197,253,0.62) 0%,rgba(96,165,250,0.34) 48%,transparent 72%);
  --blob4:radial-gradient(circle at 50% 50%,rgba(255,200,165,0.3) 0%,rgba(255,176,130,0.12) 48%,transparent 72%);
  --blob5:radial-gradient(circle at 50% 50%,rgba(96,165,250,0.42) 0%,transparent 70%);
  --dot:rgba(21,101,192,0.08);
}
[data-ayaam-theme="dark"]{
  --app-bg:#0A1120; --side-bg:#080E19;
  --side-name:#F5F8FC; --side-sub:rgba(255,255,255,0.4);
  --side-brand-bg:rgba(255,255,255,0.06); --side-brand-border:rgba(255,255,255,0.1);
  --head-bg:rgba(11,18,32,0.82); --head-border:rgba(255,255,255,0.08); --head-title:#EAF1FA;
  --head-lang-bg:rgba(255,255,255,0.08); --head-lang-txt:rgba(255,255,255,0.7);
  --glass-bg:rgba(10,17,32,0.55); --glass-border:rgba(255,255,255,0.14); --glass-txt:rgba(255,255,255,0.92); --glass-dim:rgba(255,255,255,0.5);
  --glass-shadow:0 10px 30px rgba(5,10,25,0.4); --glass-chip-bg:rgba(255,255,255,0.08);
  --hero-h1:#ffffff; --hero-sub:rgba(255,255,255,0.72); --hero-h1-shadow:0 2px 30px rgba(5,10,25,0.35); --hero-sub-shadow:0 1px 14px rgba(5,10,25,0.3);
  --in-bg:linear-gradient(180deg,#101C31,#0B1524); --in-border:rgba(255,255,255,0.11); --in-txt:#EAF1FA; --in-ph:rgba(226,235,246,0.42); --in-chip-txt:#90CAF9;
  --in-icon-bg:rgba(255,255,255,0.07); --in-icon-border:rgba(255,255,255,0.12); --in-icon-txt:rgba(255,255,255,0.85);
  --in-box-shadow:0 30px 80px rgba(5,10,25,0.55),0 6px 20px rgba(0,0,0,0.35);
  --mesh-base:linear-gradient(178deg,#0A1120 0%,#0D1B34 34%,#173766 62%,#2B5EA8 100%);
  --blob1:radial-gradient(circle at 40% 40%,rgba(33,150,243,0.98) 0%,rgba(21,101,192,0.55) 46%,transparent 72%);
  --blob2:radial-gradient(circle at 50% 45%,rgba(255,107,43,0.92) 0%,rgba(230,81,0,0.5) 46%,transparent 72%);
  --blob3:radial-gradient(circle at 55% 45%,rgba(96,165,250,0.92) 0%,rgba(33,150,243,0.5) 48%,transparent 72%);
  --blob4:radial-gradient(circle at 50% 50%,rgba(255,138,80,0.6) 0%,rgba(255,107,43,0.24) 48%,transparent 72%);
  --blob5:radial-gradient(circle at 50% 50%,rgba(21,101,192,0.6) 0%,transparent 70%);
  --dot:rgba(255,255,255,0.06);
}
.ay-mesh{background:var(--mesh-base);transition:background 0.42s ease}
.ay-mesh-dots{position:absolute;inset:0;background-image:radial-gradient(circle,var(--dot) 1px,transparent 1px);background-size:30px 30px;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black,transparent);mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black,transparent)}
.ay-blob{position:absolute;border-radius:50%;filter:blur(54px);will-change:transform;opacity:0;animation-fill-mode:forwards}
.ay-blob1{width:600px;height:600px;left:-6%;bottom:-10%;background:var(--blob1);animation:ay-cfloat1 16s ease-in-out infinite,ay-cReveal 1.4s ease-out 0.1s forwards}
.ay-blob2{width:680px;height:600px;left:28%;bottom:-18%;background:var(--blob2);animation:ay-cfloat2 19s ease-in-out infinite,ay-cReveal 1.4s ease-out 0.35s forwards}
.ay-blob3{width:560px;height:560px;right:-8%;bottom:-6%;background:var(--blob3);animation:ay-cfloat3 22s ease-in-out infinite,ay-cReveal 1.4s ease-out 0.6s forwards}
.ay-blob4{width:460px;height:460px;right:16%;top:-12%;background:var(--blob4);animation:ay-cfloat4 24s ease-in-out infinite,ay-cReveal 1.4s ease-out 0.85s forwards}
.ay-blob5{width:400px;height:400px;left:12%;top:6%;background:var(--blob5);animation:ay-cfloat4 20s ease-in-out infinite,ay-cReveal 1.4s ease-out 1.05s forwards}
@keyframes ay-cReveal{to{opacity:1}}
@keyframes ay-cfloat1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(120px,-130px) scale(1.28)}66%{transform:translate(-90px,-200px) scale(0.86)}}
@keyframes ay-cfloat2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-140px,-160px) scale(1.22)}66%{transform:translate(110px,-70px) scale(1.16)}}
@keyframes ay-cfloat3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(90px,-180px) scale(1.35)}}
@keyframes ay-cfloat4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-110px,-120px) scale(1.24)}}
.theme-toggle:hover{filter:brightness(1.08)}
`;