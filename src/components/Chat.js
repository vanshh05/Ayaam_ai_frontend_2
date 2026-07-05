import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import AdminPanel from './AdminPanel';
import ChartView, { isChartable } from './ChartView';
import logo from '../assets/aiva-mark.png';
import html2canvas from 'html2canvas';

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
      { label: "Today's Sales",  text: "Give me today's sales report. Make ONE query to ai_sales filtered by today's bill_date, selecting party_name, bill_no, invoice_amount. From those rows, compute the summary: total sales = sum of invoice_amount, total bills = number of rows, unique parties = distinct party_name count. Then present PART 1 — the summary (total sales, total bills, unique parties), and PART 2 — the detailed rows (party_name, bill_no, invoice_amount). If there are more than 20 rows, provide the details as a PDF export instead of listing inline. Do not run the same query multiple times." },
      { label: "Month Sales",    text: "What are the total sales this month till date? Compute everything from the ai_sales table (not ai_daily_summary): total sales = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this month. Show total sales amount, total bills issued, and total unique parties." },
      { label: "Total Sales",    text: "What are the total sales this financial year? Compute everything from the ai_sales table (not ai_daily_summary): total sales = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this financial year. Show total sales amount, total bills issued, and total unique parties." },
    ],
  },
  {
    id: 'purchase', Icon: Ic.Purchase, label: 'Purchase', color: '#E65100',
    queries: [
      { label: "Today's Purchase", text: "Give me today's purchase report. Make ONE query to ai_purchase filtered by today's bill_date, selecting party_name, bill_no, invoice_amount. From those rows compute the summary: total purchase = sum of invoice_amount, total bills = number of rows, unique parties = distinct party_name count. Present PART 1 — the summary, and PART 2 — the detailed rows. If more than 20 rows, provide details as a PDF export instead of inline. Do not run the same query multiple times." },
      { label: "Month Purchase",   text: "What is this month's total purchase? Compute everything from the ai_purchase table (not ai_daily_summary): total purchase = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this month. Show total purchase amount, total bills, and total unique parties." },
      { label: "Total Purchase",   text: "What is the total purchase this financial year? Compute everything from the ai_purchase table (not ai_daily_summary): total purchase = SUM(invoice_amount), total bills = COUNT(*), unique parties = COUNT(DISTINCT party_name), all with a bill_date filter for this financial year. Show total purchase amount, total bills, and total unique parties." },
    ],
  },
  {
    id: 'collection', Icon: Ic.Money, label: 'Collection & Payment', color: '#2E7D32',
    queries: [
      { label: "Today's Collection", text: "Give me today's collection report. Make ONE query to ai_collection_summary filtered by today's receipt_date, selecting receipt_date, party_name, amount, receipt_mode, cheque_txn_no. From those rows compute the summary: total collection = sum of amount, total entries = number of rows, unique parties = distinct party_name count. Present PART 1 — the summary, and PART 2 — the detailed rows. If more than 20 rows, provide details as a PDF export instead of inline. Do not run the same query multiple times." },
      { label: "Today's Payment",    text: "Give me today's payment report. Make ONE query to ai_payment_summary filtered by today's payment_date, selecting payment_date, party_name, amount, payment_mode, cheque_txn_no. From those rows compute the summary: total payment = sum of amount, total entries = number of rows, unique parties = distinct party_name count. Present PART 1 — the summary, and PART 2 — the detailed rows. If more than 20 rows, provide details as a PDF export instead of inline. Do not run the same query multiple times." },
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

async function downloadExportPDF(exportData, label, companyName) {
  const{columns,data,total_rows}=exportData;
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
  const htmlContent=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${label}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#1A2B3C;padding:16px 20px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1565C0;padding-bottom:8px;margin-bottom:12px}.brand{font-size:16px;font-weight:800;color:#1565C0}.brand span{color:#FF6B2B}.meta{text-align:right;font-size:9px;color:#8896A5}.meta strong{color:#1A2B3C;display:block;font-size:10px}.info{background:#F0F4F8;border-left:3px solid #1565C0;padding:6px 10px;border-radius:4px;margin-bottom:10px;font-size:10px}table{border-collapse:collapse;width:100%;margin-top:8px;font-size:9px}th{background:#1565C0;color:#fff;padding:5px 7px;text-align:left;font-weight:700;white-space:nowrap}td{padding:4px 7px;border-bottom:1px solid #EEF2F7;word-break:break-word;max-width:150px}tr:nth-child(even) td{background:#F8FAFC}.footer{margin-top:14px;padding-top:6px;border-top:1px solid #DDE3EA;font-size:8px;color:#B0BAC6;display:flex;justify-content:space-between}</style></head><body><div class="header"><div><div class="brand">AYAAM<span>ERP</span></div><div style="font-size:9px;color:#8896A5;margin-top:2px">AI Assistant Report</div></div><div class="meta"><strong>${companyName||'Ayaam ERP'}</strong>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div></div><div class="info"><strong>${label}</strong> &nbsp;·&nbsp; Total Records: <strong>${total_rows}</strong></div><table><thead><tr>${displayCols.map(c=>`<th>${c.replace(/_/g,' ').toUpperCase()}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table><div class="footer"><span>Powered by Ayaam ERP AI Assistant · Datawheel Software Technology LLP</span><span>${label} · ${total_rows} records</span></div></body></html>`;
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

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function Chat({ user, onLogout, onAuthError }) {
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
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          if (onAuthError) onAuthError(); else onLogout();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [onLogout, onAuthError]);

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

    // Helper: is this error an auth failure (kicked out / expired / session taken over)?
    const isAuthErr = (e) => e && e.response && (e.response.status === 401 || e.response.status === 403);

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
        // Auth failure → don't retry; the interceptor will log the user out and redirect.
        if (isAuthErr(firstErr)) { if (onAuthError) onAuthError(); return; }
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
      // Auth failure (session taken over on another device / expired) → redirect to login cleanly.
      if (isAuthErr(err)) { if (onAuthError) onAuthError(); else onLogout(); return; }
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
    if (isMobile) setSidebarOpen(false);
  };
  const loadChat = (chat) => {
    setMessages(chat.messages); setHistory(chat.history || []);
    setActiveChatId(chat.id); setTranslations({}); stopSpeaking();
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
    // If chart view is active for this message, export the chart as an image PDF.
    if (msgId && chartOn[msgId] && chartRefs.current[msgId]) {
      try {
        const canvas = await html2canvas(chartRefs.current[msgId], { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const w = window.open('', '_blank');
        const title = query ? query.slice(0, 60) : 'Chart';
        w.document.write(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
          '<style>body{margin:0;font-family:Arial,sans-serif}' +
          '.hdr{padding:14px 20px;border-bottom:2px solid #1565C0;display:flex;justify-content:space-between;align-items:center}' +
          '.brand{font-size:18px;font-weight:800;color:#1565C0}.brand span{color:#FF6B2B}' +
          '.meta{font-size:11px;color:#888;text-align:right}' +
          'img{display:block;max-width:100%;margin:18px auto;padding:0 20px;box-sizing:border-box}' +
          '@media print{.noprint{display:none}}</style></head><body>' +
          '<div class="hdr"><div class="brand">AYAAM<span>ERP</span></div>' +
          '<div class="meta"><strong>' + (user.company_name || 'Ayaam ERP') + '</strong><br>' +
          new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) + '</div></div>' +
          '<img src="' + imgData + '"/>' +
          '<div class="noprint" style="text-align:center;margin:16px"><button onclick="window.print()" ' +
          'style="padding:8px 20px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">Save as PDF</button></div>' +
          '</body></html>'
        );
        w.document.close();
        return;
      } catch (e) {
        // Fall through to table PDF if capture fails
      }
    }
    downloadAsPDF(text, query ? query.slice(0, 60) : 'ERP Report', user.company_name || 'Ayaam ERP');
  };

  const handleExportDownload = async (exportSpec, msgId) => {
    setExportLoading(prev => ({ ...prev, [msgId]: true }));
    try {
      if (exportSpec.table === '__inline__') {
        await downloadAsPDF(exportSpec.inlineData, exportSpec.label || 'ERP Report', user.company_name || 'Ayaam ERP'); return;
      }
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
        await downloadExportPDF(res.data, exportSpec.label||'ERP Report', user.company_name||'Ayaam ERP');
      } else { alert('Export failed: '+res.data.error); }
    } catch(e) { alert('Export error: '+(e.response?.data?.error||e.message)); }
    finally { setExportLoading(prev => ({ ...prev, [msgId]: false })); }
  };

  const fmt     = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const groups  = groupedChats();

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';

  /* ── Render ─────────────────────────────────────────────────────────────── */
  if (isAdmin && showAdmin) {
    return <AdminPanel user={user} onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div style={S.root}>
      {sidebarOpen && isMobile && <div style={S.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside style={{ ...S.sidebar, width: sidebarOpen ? 260 : 0, position: isMobile ? 'fixed' : 'relative', zIndex: isMobile ? 1000 : 'auto', height: '100vh', top: 0, left: 0 }}>
        <div style={S.sidebarInner}>

          {/* Brand mark */}
          <div style={S.brand}>
            <div style={S.brandMark}>
              <img src={logo} alt="AIVA" style={{ width: '66%', height: '66%', objectFit: 'contain' }} />
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
            <span style={S.langBadge}>
              {speechLang === 'hi-IN' ? 'Hindi' : 'English'}
            </span>
            <span style={S.roleBadge}>{user.role}</span>
          </div>
        </header>

        {/* Message area */}
        <div style={S.msgArea}>
          {messages.length === 0 ? (

            /* ── Dashboard ── */
            <div style={S.dashboard}>
              <div style={S.dashWelcome} className="anim-fadeUp">
                <div style={S.dashGreeting}>{greeting}, {user.name.split(' ')[0]}</div>
                <div style={S.dashSub}>What would you like to explore today?</div>
              </div>

              <div style={S.dashGrid} className="stagger">
                {DASHBOARD_CARDS.map((card, idx) => (
                  <div key={card.id} className="dash-card anim-fadeUp"
                    style={{ ...S.dashCard, animationDelay: `${idx * 55}ms` }}>

                    {/* Colored top band */}
                    <div style={{ ...S.cardBand, background: card.color }}>
                      <span style={S.cardBandIcon}><card.Icon color="#fff" /></span>
                      <span style={S.cardBandLabel}>{card.label}</span>
                    </div>

                    {/* Queries */}
                    <div style={S.cardBody}>
                      {card.queries.map((q, qi) => (
                        <button key={qi} className="dash-query-btn"
                          style={{ ...S.cardQuery, borderLeftColor: card.color }}
                          onClick={() => sendMessage(q.text, q.label)}>
                          <span style={{ ...S.cardQueryDot, background: card.color }} />
                          <span style={S.cardQueryLabel}>{q.label}</span>
                          <span style={S.cardQueryArrow}><Ic.ArrowRight /></span>
                        </button>
                      ))}
                      <div style={{ ...S.cardHint, color: card.color }}>
                        Ask anything about {card.label.toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}
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
                            : <><Ic.Download />Download Complete PDF</>
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

        {/* ── Input ── */}
        <div style={S.inputArea}>
          <div style={S.inputWrap} className="input-wrap">
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
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════════════════ */
const S = {
  root: { display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#EAF0F7', fontFamily: "'Inter',system-ui,-apple-system,sans-serif", color: '#07111F' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(7,17,31,0.4)', backdropFilter: 'blur(2px)', zIndex: 999 },

  /* ── Sidebar ── */
  sidebar: { flexShrink: 0, overflow: 'hidden', background: '#F4F7FB', borderRight: '1px solid rgba(21,101,192,0.1)', transition: 'width 320ms cubic-bezier(0.32,0.72,0,1)' },
  sidebarInner: { width: 260, height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 14px', boxSizing: 'border-box' },

  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 10px' },
  brandMark: { width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(21,101,192,0.16)' },
  brandMarkText: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 18, color: '#1565C0' },
  brandTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, color: '#0E2138', letterSpacing: '-0.01em', lineHeight: 1.15 },
  brandSuffix: { color: '#FF6B2B' },
  brandSub: { fontSize: 10.5, color: 'rgba(14,33,56,0.5)', fontWeight: 500, marginTop: 1 },

  newChatBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 6, marginBottom: 14, padding: '11px 14px', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 650, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 16px rgba(21,101,192,0.32)', transition: 'transform 120ms, box-shadow 200ms' },

  langRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 0', marginBottom: 12 },
  langLabel: { fontSize: 10, color: 'rgba(14,33,56,0.45)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  langToggle: { display: 'flex', background: 'rgba(21,101,192,0.07)', borderRadius: 7, padding: 2, gap: 2 },
  langBtn: { border: 'none', background: 'transparent', padding: '4px 11px', borderRadius: 5, fontSize: 12, fontWeight: 600, color: 'rgba(14,33,56,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' },
  langBtnOn: { background: '#fff', color: '#1565C0', boxShadow: '0 1px 4px rgba(21,101,192,0.18)' },

  companyRow: { display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 6px 0', marginBottom: 10, borderTop: '1px solid rgba(21,101,192,0.1)', marginTop: 4 },
  companySelect: { width: '100%', padding: '9px 10px', fontSize: 13, border: '1px solid rgba(21,101,192,0.2)', borderRadius: 9, background: '#fff', color: '#0E2138', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' },
  companyHint: { fontSize: 11, color: '#E65100', fontWeight: 500 },
  manageUsersBtn: { width: '100%', padding: '8px 10px', fontSize: 12.5, fontWeight: 600, color: '#1565C0', background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.16)', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' },

  sectionLabel: { fontSize: 10, color: 'rgba(14,33,56,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 8px 8px', fontFamily: "'Plus Jakarta Sans',sans-serif" },

  histList: { flex: '0 1 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 40 },
  histEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 12px', color: 'rgba(14,33,56,0.35)', fontSize: 12.5, textAlign: 'center' },
  histGroupLabel: { fontSize: 10, color: 'rgba(14,33,56,0.4)', fontWeight: 600, padding: '8px 8px 4px', letterSpacing: '0.04em' },
  histItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', borderLeft: '2px solid transparent', transition: 'background 150ms' },
  histIcon: { color: 'rgba(14,33,56,0.35)', flexShrink: 0, display: 'flex' },
  histContent: { flex: 1, minWidth: 0 },
  histTitle: { fontSize: 13, fontWeight: 500, color: '#24405f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  histDate: { fontSize: 10.5, color: 'rgba(14,33,56,0.42)', marginTop: 1 },
  histDel: { flexShrink: 0, background: 'none', border: 'none', color: 'rgba(14,33,56,0.3)', cursor: 'pointer', padding: 3, borderRadius: 6, display: 'flex', opacity: 0, transition: 'opacity 150ms' },

  userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginTop: 8, background: '#fff', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12 },
  userAvatar: { width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B2B,#E65100)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 700, color: '#1a2f49', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 10.5, color: 'rgba(14,33,56,0.5)', fontWeight: 500 },
  logoutBtn: { flexShrink: 0, background: 'none', border: 'none', color: 'rgba(14,33,56,0.4)', cursor: 'pointer', padding: 5, borderRadius: 7, display: 'flex' },
  dwFooter: { fontSize: 9.5, color: 'rgba(14,33,56,0.3)', textAlign: 'center', paddingTop: 10, fontWeight: 500 },

  /* ── Main ── */
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#EAF0F7', position: 'relative' },

  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 60, flexShrink: 0, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(18px)', borderBottom: '1px solid #E5E7EB', zIndex: 5 },
  menuBtn: { background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', flexShrink: 0 },
  headerCenter: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 14.5, fontWeight: 700, color: '#07111F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  langBadge: { fontSize: 11.5, fontWeight: 600, color: '#374151', background: '#F3F4F6', padding: '4px 10px', borderRadius: 99 },
  roleBadge: { fontSize: 11.5, fontWeight: 600, color: '#1565C0', background: 'rgba(21,101,192,0.1)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(21,101,192,0.2)' },

  msgArea: { flex: 1, overflowY: 'auto', position: 'relative' },

  /* ── Dashboard (empty state) ── */
  dashboard: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px 40px' },
  dashWelcome: { marginBottom: 28 },
  dashGreeting: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 800, color: '#07111F', letterSpacing: '-0.02em' },
  dashSub: { fontSize: 14.5, color: '#6B7280', marginTop: 5 },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 },
  dashCard: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.04)', transition: 'transform 180ms, box-shadow 180ms' },
  cardBand: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' },
  cardBandIcon: { flexShrink: 0, display: 'flex', alignItems: 'center' },
  cardBandLabel: { color: '#fff', fontWeight: 700, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase' },
  cardBody: { padding: '8px 10px 12px' },
  cardQuery: { display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', borderLeft: '3px solid', borderRadius: 7, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 140ms' },
  cardQueryDot: { width: 5, height: 5, borderRadius: '50%', flexShrink: 0 },
  cardQueryLabel: { flex: 1, fontSize: 13, fontWeight: 500, color: '#374151' },
  cardQueryArrow: { color: '#CBD5E1', display: 'flex', flexShrink: 0 },
  cardHint: { fontSize: 10.5, fontStyle: 'italic', fontWeight: 500, padding: '4px 10px 0', opacity: 0.7, letterSpacing: '0.01em' },

  /* ── Messages ── */
  msgList: { maxWidth: 860, margin: '0 auto', padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 18 },
  msgRowLeft: { display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '100%' },
  msgRowRight: { display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: 'row-reverse', maxWidth: '100%' },
  avatarBot: { width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10.5, fontFamily: "'Plus Jakarta Sans',sans-serif" },
  avatarUser: { width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B2B,#E65100)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  bubble: { maxWidth: 'min(680px,calc(100% - 44px))', borderRadius: 16, padding: '13px 16px', fontSize: 14.5, lineHeight: 1.6, position: 'relative', wordBreak: 'break-word' },
  bubbleBot: { background: '#fff', color: '#1F2937', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 2px 10px rgba(7,17,31,0.05)', borderTopLeftRadius: 5 },
  bubbleUser: { background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', borderTopRightRadius: 5 },
  bubbleErr: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
  userText: { whiteSpace: 'pre-wrap' },
  userFooter: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 },

  suggestTitle: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#92400E', marginBottom: 10 },
  suggestList: { display: 'flex', flexDirection: 'column', gap: 7 },
  suggestChip: { textAlign: 'left', padding: '9px 13px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, color: '#1565C0', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  exportCard: { border: '1px solid #BFDBFE' },
  exportHead: { display: 'flex', alignItems: 'center', gap: 8, color: '#1565C0', fontWeight: 700, marginBottom: 8 },
  exportHeadTitle: { fontSize: 14 },
  exportBody: { fontSize: 13.5, color: '#475569', lineHeight: 1.55, marginBottom: 10 },
  exportMeta: { fontSize: 11.5, color: '#94A3B8', marginBottom: 12, fontFamily: 'monospace' },
  exportBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '11px 16px', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 650, fontFamily: 'inherit', cursor: 'pointer' },
  miniSpinner: { width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', animation: 'ay-spin 0.65s linear infinite' },

  actBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  actBtnDark: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 140ms' },
  actBtnLight: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  actBtnActive: { background: '#DBEAFE', color: '#1565C0', border: '1px solid #BFDBFE' },
  actBtnOrange: { background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' },
  actBtnGreen: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' },
  actBtnBlue: { background: '#EFF6FF', color: '#1565C0', border: '1px solid #BFDBFE' },
  actBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  actBtnPurple: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  chartNotice: { marginTop: 10, fontSize: 12.5, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px' },

  ts: { fontSize: 10.5, color: '#94A3B8', flexShrink: 0 },

  typingBubble: { display: 'flex', alignItems: 'center', gap: 5 },
  typingLabel: { fontSize: 12.5, color: '#94A3B8', marginLeft: 6, fontStyle: 'italic' },

  /* ── Input ── */
  inputArea: { flexShrink: 0, padding: '14px 20px 18px', background: 'transparent' },
  inputWrap: { display: 'flex', alignItems: 'flex-end', gap: 9, maxWidth: 860, margin: '0 auto', background: 'linear-gradient(180deg,#FFFFFF,#F2F7FD)', border: '1px solid rgba(21,101,192,0.18)', borderRadius: 16, padding: 8, boxShadow: '0 24px 60px rgba(21,101,192,0.15),0 4px 14px rgba(7,17,31,0.06)' },
  micBtn: { width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  textarea: { flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontSize: 14.5, fontFamily: 'inherit', color: '#0B1A2E', padding: '9px 4px', maxHeight: 140, lineHeight: 1.5 },
  sendBtn: { width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#1565C0,#2196F3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 160ms' },
  inputHint: { textAlign: 'center', fontSize: 11, color: 'rgba(11,26,46,0.4)', marginTop: 8 },
};