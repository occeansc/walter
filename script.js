/* ===================================================
   WALTER 2.0 — script.js
   =================================================== */

'use strict';

// ── DATA ──────────────────────────────────────────────────────────────
const EQUITY_DATA = {
  labels: ['Jan 22','Jul 22','Jan 23','Jul 23','Jan 24','Jul 24','Jan 25','Jul 25','Mar 26'],
  W1: [0, 52, 104, 197, 395, 490, 585, 618, 603],
  W2: [0, 2059, 4118, 8978, 13818, 19588, 25477, 30720, 37782],
  W3: [0, 937, 1873, 4800, 7725, 9918, 11074, 13100, 15665],
  W4: [0, 890, 1781, 4836, 7871, 11022, 13152, 15703, 17012],
};

const MONTHLY_EV = {
  Jan: 118.9, Feb: 66.0, Mar: 61.4, Apr: 24.7, May: 56.6, Jun: 83.9,
  Jul: 74.2, Aug: 82.3, Sep: 69.9, Oct: 93.1, Nov: 63.8, Dec: 69.2
};

const GRADE_CONFIG = {
  variant:  { W4: 4, W2: 3, W3: 2, W1: 1 },
  pairDir:  {
    'GBPJPY-L': 5, 'EURJPY-L': 4, 'GBPUSD-L': 4,
    'USDJPY-L': 3, 'AUDUSD-L': 3,
    'EURJPY-S': 2, 'USDJPY-S': 2,
    'EURUSD-L': 1, 'GBPUSD-S': 1, 'EURUSD-S': 1,
    'GBPJPY-S': -1
  },
  grid:  { 1: 2, 2: 4, 3: 3 },
  hourQ: {
    q4: [8,9,15,18,20],
    q3: [6,12,16],
    q2: [7,10,13,17]
  },
  monthQ: {
    q4: [1,10],
    q3: [6,7,8],
    q2: [9,12,2,11]
  }
};

const GRADE_META = [
  null,
  { label: 'Minimum Viable',     wr: '45–54%',  ev: '+1–4 pips',     color: 'var(--red)',    cls: 'g1' },
  { label: 'Reduced Conviction', wr: '55–69%',  ev: '+5–44 pips',    color: 'var(--amber)',  cls: 'g2' },
  { label: 'Standard Signal',    wr: '70–87%',  ev: '+45–89 pips',   color: 'var(--blue)',   cls: 'g3' },
  { label: 'High Conviction',    wr: '88–96%',  ev: '+90–140 pips',  color: 'var(--green)',  cls: 'g4' },
  { label: 'Maximum Conviction', wr: '97–100%', ev: '+145–172 pips', color: 'var(--gold-lt)', cls: 'g5' }
];

const STARS = ['','★☆☆☆☆','★★☆☆☆','★★★☆☆','★★★★☆','★★★★★'];

// ── STATE ─────────────────────────────────────────────────────────────
let currentDir = 'L';
let signalLog = [];
let radarChart = null;
let signalIdCounter = 1;

// ── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  animateCounters();
  initEquityChart();
  buildHeatmap();
  initTabs();
  initGradeCalc();
  loadLog();
  renderLog();
});

// ── NAVIGATION ────────────────────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const navAs = document.querySelectorAll('.nav-a');

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
    updateScrollSpy();
  });

  navAs.forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

function updateScrollSpy() {
  const sections = document.querySelectorAll('.section');
  const navAs = document.querySelectorAll('.nav-a');
  let current = '';

  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });

  navAs.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ── COUNTER ANIMATIONS ─────────────────────────────────────────────────
function animateCounters() {
  const els = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const dec = parseInt(el.dataset.dec) || 0;
        animateCount(el, target, suffix, dec);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  els.forEach(el => observer.observe(el));
}

function animateCount(el, target, suffix, dec) {
  const duration = 1600;
  const start = performance.now();
  const formatted = n => {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: dec });
    return dec > 0 ? n.toFixed(dec) : Math.round(n).toString();
  };
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = formatted(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatted(target) + suffix;
  }
  requestAnimationFrame(step);
}

// ── CHARTS ─────────────────────────────────────────────────────────────
function initEquityChart() {
  const ctx = document.getElementById('equityChart')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: EQUITY_DATA.labels,
      datasets: [
        {
          label: 'W4 Trinity',
          data: EQUITY_DATA.W4,
          borderColor: '#C8962A',
          backgroundColor: 'rgba(200,150,42,0.08)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'W2 Shogun',
          data: EQUITY_DATA.W2,
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.05)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'W3 London',
          data: EQUITY_DATA.W3,
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245,158,11,0.05)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'W1 Cascade',
          data: EQUITY_DATA.W1,
          borderColor: '#4B9FFF',
          backgroundColor: 'rgba(75,159,255,0.05)',
          borderWidth: 1.5,
          borderDash: [4,3],
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: false,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#9DB5D4', font: { family: 'JetBrains Mono', size: 11 }, boxWidth: 14 }
        },
        tooltip: {
          backgroundColor: '#0F1E35',
          borderColor: '#1A2E4A',
          borderWidth: 1,
          titleColor: '#E2EAF8',
          bodyColor: '#9DB5D4',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}p`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(26,46,74,0.6)' },
          ticks: { color: '#5A7A9B', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(26,46,74,0.6)' },
          ticks: {
            color: '#5A7A9B', font: { family: 'JetBrains Mono', size: 10 },
            callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v
          }
        }
      }
    }
  });
}

function buildHeatmap() {
  const wrap = document.getElementById('monthlyHeatmap');
  if (!wrap) return;
  const months = Object.keys(MONTHLY_EV);
  const evs = Object.values(MONTHLY_EV);
  const maxEV = Math.max(...evs);
  const minEV = Math.min(...evs);

  months.forEach(m => {
    const ev = MONTHLY_EV[m];
    const norm = (ev - minEV) / (maxEV - minEV);
    const alpha = 0.1 + norm * 0.45;
    const brightness = Math.round(150 + norm * 100);
    const cell = document.createElement('div');
    cell.className = 'heat-cell';
    cell.style.background = `rgba(200, ${brightness}, 42, ${alpha})`;
    cell.style.borderColor = `rgba(200, ${brightness}, 42, ${0.15 + norm * 0.4})`;
    cell.innerHTML = `<span class="heat-month">${m}</span><span class="heat-ev">${ev.toFixed(0)}p</span>`;
    wrap.appendChild(cell);
  });
}

// ── TABS ──────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tab)?.classList.add('active');
    });
  });
}

// ── GRADE CALCULATOR ─────────────────────────────────────────────────
function initGradeCalc() {
  initRadar();
  calcGrade();
}

function initRadar() {
  const ctx = document.getElementById('radarChart')?.getContext('2d');
  if (!ctx) return;

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Variant', 'Pair/Dir', 'Grid', 'Hour', 'Month'],
      datasets: [{
        data: [100, 100, 100, 100, 100],
        backgroundColor: 'rgba(200,150,42,0.15)',
        borderColor: '#C8962A',
        borderWidth: 2,
        pointBackgroundColor: '#C8962A',
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          grid: { color: 'rgba(26,46,74,0.6)' },
          angleLines: { color: 'rgba(26,46,74,0.6)' },
          ticks: { display: false },
          pointLabels: {
            color: '#9DB5D4',
            font: { family: 'JetBrains Mono', size: 11 }
          }
        }
      }
    }
  });
}

function setDir(d) {
  currentDir = d;
  document.getElementById('btn-long').classList.toggle('active', d === 'L');
  document.getElementById('btn-short').classList.toggle('active', d === 'S');
  calcGrade();
}

function calcGrade() {
  const variant = document.getElementById('gc-variant')?.value || 'W4';
  const pair    = document.getElementById('gc-pair')?.value || 'GBPJPY';
  const grid    = parseInt(document.getElementById('gc-grid')?.value || '2');
  const hour    = parseInt(document.getElementById('gc-hour')?.value || '9');
  const month   = parseInt(document.getElementById('gc-month')?.value || '1');

  // Scores
  const vScore = GRADE_CONFIG.variant[variant] || 1;
  const pdKey  = `${pair}-${currentDir}`;
  const pdScore = GRADE_CONFIG.pairDir[pdKey] ?? 1;
  const gScore = GRADE_CONFIG.grid[grid] || 2;

  let hScore = 1;
  if (GRADE_CONFIG.hourQ.q4.includes(hour)) hScore = 4;
  else if (GRADE_CONFIG.hourQ.q3.includes(hour)) hScore = 3;
  else if (GRADE_CONFIG.hourQ.q2.includes(hour)) hScore = 2;

  let mScore = 1;
  if (GRADE_CONFIG.monthQ.q4.includes(month)) mScore = 4;
  else if (GRADE_CONFIG.monthQ.q3.includes(month)) mScore = 3;
  else if (GRADE_CONFIG.monthQ.q2.includes(month)) mScore = 2;

  const total = vScore + pdScore + gScore + hScore + mScore;

  let grade;
  if (total >= 17) grade = 5;
  else if (total >= 13) grade = 4;
  else if (total >= 8)  grade = 3;
  else if (total >= 3)  grade = 2;
  else grade = 1;

  const meta = GRADE_META[grade];

  // Update display
  const disp = document.getElementById('gradeDisplay');
  if (disp) {
    disp.className = 'grade-display ' + meta.cls;
    document.getElementById('gradeStars').textContent = STARS[grade];
    document.getElementById('gradeNum').textContent = grade;
    document.getElementById('gradeLabel').textContent = meta.label + (pdScore < 0 ? ' ⚠ Neg. EV Pair' : '');
    document.getElementById('gradeScore').textContent = total;
    document.getElementById('gradeWR').textContent = 'Win Rate: ' + meta.wr;
    document.getElementById('gradeEV').textContent = 'EV Estimate: ' + meta.ev;
  }

  // Breakdown
  const dims = [
    { name: 'Variant',   score: vScore,  max: 4 },
    { name: 'Pair/Dir',  score: Math.max(0, pdScore), max: 5 },
    { name: 'Grid',      score: gScore,  max: 4 },
    { name: 'Hour',      score: hScore,  max: 4 },
    { name: 'Month',     score: mScore,  max: 4 },
  ];

  const bd = document.getElementById('dimBreakdown');
  if (bd) {
    bd.innerHTML = dims.map(d => `
      <div class="dim-row">
        <span class="dim-name">${d.name}</span>
        <div class="dim-bar-wrap"><div class="dim-bar" style="width:${(d.score/d.max)*100}%"></div></div>
        <span class="dim-score" style="color:${d.score>=3?'var(--gold-lt)':d.score>=2?'var(--text)':'var(--text-dim)'}">${d.score < 0 ? '−1' : d.score}/${d.max}</span>
      </div>
    `).join('') + `
      <div class="dim-total">
        <span style="color:var(--text-dim)">Total</span>
        <span style="color:var(--gold-lt);font-family:var(--mono)">${total} / 21</span>
      </div>
    `;
    if (pdScore < 0) {
      bd.innerHTML += `<div style="font-size:11px;color:var(--red);padding:6px 0">⚠ GBP/JPY Short: Negative EV (−4.2p avg). Pair direction penalty −1 applied.</div>`;
    }
  }

  // Radar update
  if (radarChart) {
    const radarData = [
      (vScore / 4) * 100,
      (Math.max(0, pdScore) / 5) * 100,
      ((gScore - 2) / 2) * 100,
      ((hScore - 1) / 3) * 100,
      ((mScore - 1) / 3) * 100
    ];
    const colors = {
      5: ['rgba(200,150,42,0.2)', '#C8962A'],
      4: ['rgba(34,197,94,0.15)', '#22C55E'],
      3: ['rgba(75,159,255,0.12)', '#4B9FFF'],
      2: ['rgba(245,158,11,0.12)', '#F59E0B'],
      1: ['rgba(239,68,68,0.12)', '#EF4444']
    };
    radarChart.data.datasets[0].data = radarData;
    radarChart.data.datasets[0].backgroundColor = colors[grade][0];
    radarChart.data.datasets[0].borderColor = colors[grade][1];
    radarChart.data.datasets[0].pointBackgroundColor = colors[grade][1];
    radarChart.update('none');
  }
}

// ── SIGNAL LOG ────────────────────────────────────────────────────────
const LOG_KEY = 'walter_signals';

function loadLog() {
  try {
    const saved = localStorage.getItem(LOG_KEY);
    if (saved) {
      signalLog = JSON.parse(saved);
      signalIdCounter = signalLog.reduce((max, s) => {
        const n = parseInt(s.id?.replace('W-','') || 0);
        return n >= max ? n + 1 : max;
      }, 1);
    }
  } catch(e) { signalLog = []; }
}

function saveLog() {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(signalLog)); } catch(e) {}
}

function openSignalModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('signalModal').classList.add('open');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('m-dt').value = now.toISOString().slice(0,16);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('signalModal').classList.remove('open');
}

function saveSignal() {
  const sig = {
    id: 'W-' + String(signalIdCounter++).padStart(3,'0'),
    dt: document.getElementById('m-dt').value.replace('T',' '),
    variant: document.getElementById('m-variant').value,
    pair: document.getElementById('m-pair').value,
    dir: document.getElementById('m-dir').value,
    grade: document.getElementById('m-grade').value,
    entry: document.getElementById('m-entry').value,
    stop: document.getElementById('m-stop').value,
    tp1: document.getElementById('m-tp1').value,
    tp2: document.getElementById('m-tp2').value,
    rr: document.getElementById('m-rr').value,
    grid: document.getElementById('m-grid').value,
    cond: document.getElementById('m-cond').value,
    action: document.getElementById('m-action').value,
    fill: document.getElementById('m-fill').value,
    exitDt: '', exitPrice: '', exitReason: '', pnl: '', liveGrade: '',
  };
  signalLog.unshift(sig);
  saveLog();
  renderLog();
  closeModal();
  // Reset form
  ['m-entry','m-stop','m-tp1','m-tp2','m-rr','m-cond','m-fill'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function deleteSignal(id) {
  signalLog = signalLog.filter(s => s.id !== id);
  saveLog();
  renderLog();
}

function clearLog() {
  if (!confirm('Clear all signals?')) return;
  signalLog = [];
  saveLog();
  renderLog();
}

function renderLog() {
  const tbody = document.getElementById('logBody');
  const count = document.getElementById('logCount');
  if (!tbody) return;

  count.textContent = signalLog.length + ' signal' + (signalLog.length !== 1 ? 's' : '');

  if (signalLog.length === 0) {
    tbody.innerHTML = `<tr><td colspan="21" class="log-empty">No signals yet. Click <strong>+ Add Signal</strong> to start tracking.</td></tr>`;
    return;
  }

  const gradeClass = g => {
    const n = parseInt(g);
    if (n === 5) return 'grade-g5';
    if (n === 4) return 'grade-g4';
    if (n === 3) return 'grade-g3';
    if (n === 2) return 'grade-g2';
    return '';
  };

  tbody.innerHTML = signalLog.map((s,i) => {
    const fields = [
      s.dt, s.variant, s.pair, s.dir,
      s.grade, s.entry, s.stop, s.tp1, s.tp2, s.rr, s.grid,
      s.cond, s.action, s.fill, s.exitDt, s.exitPrice,
      s.exitReason, s.pnl, s.liveGrade
    ];
    const colKeys = ['dt','variant','pair','dir','grade','entry','stop','tp1','tp2','rr','grid','cond','action','fill','exitDt','exitPrice','exitReason','pnl','liveGrade'];
    return `<tr>
      <td class="td-sticky">${s.id}</td>
      ${fields.map((f,ci) => {
        const key = colKeys[ci];
        const gCls = key === 'grade' ? gradeClass(f) : '';
        const pnlCls = key === 'pnl' ? (f.startsWith('+') ? 'green' : f.startsWith('-') ? 'red' : '') : '';
        return `<td contenteditable="true" class="${gCls} ${pnlCls}"
          oninput="updateField('${s.id}','${key}',this.textContent)"
          >${f||''}</td>`;
      }).join('')}
      <td><button class="del-btn" onclick="deleteSignal('${s.id}')">×</button></td>
    </tr>`;
  }).join('');
}

function updateField(id, key, val) {
  const sig = signalLog.find(s => s.id === id);
  if (sig) { sig[key] = val; saveLog(); }
}

function exportCSV() {
  if (signalLog.length === 0) { alert('No signals to export.'); return; }

  const headers = ['ID','Signal Date/Time (UTC)','Variant','Pair','Direction','Grade',
    'Entry Price','Stop Price','TP1','TP2','R:R','Grid Level','Conditions Met',
    'Action Taken','Fill Price','Exit Date/Time','Exit Price','Exit Reason','P&L (pips)','Live Grade'];

  const rows = signalLog.map(s => [
    s.id, s.dt, s.variant, s.pair, s.dir, s.grade,
    s.entry, s.stop, s.tp1, s.tp2, s.rr, s.grid,
    s.cond, s.action, s.fill, s.exitDt, s.exitPrice, s.exitReason, s.pnl, s.liveGrade
  ].map(v => `"${(v||'').replace(/"/g,'""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: 'walter_signals_' + new Date().toISOString().slice(0,10) + '.csv'
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── PROMPTS ───────────────────────────────────────────────────────────
function copyPrompt(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() => {
    const btn = el.closest('.prompt-card').querySelector('.copy-btn');
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  });
}
