// =====================================================
//  Device 수량 변동 분석 대시보드 - 메인 로직
// =====================================================

// ---- 전역 상태 ----
let rawRows = [];          // 파싱된 전체 행
let analysisResult = [];   // 분석된 Device 목록
let filteredResult = [];   // 필터 적용 후
let currentPage = 1;
const PAGE_SIZE = 20;
let chartBar = null, chartPie = null, chartTrend = null;
let currentBarType = 'bar';

const MONTH_KEYS = ['26Y 3월','26Y 4월','26Y 5월','26Y 6월','26Y 7월','26Y 8월','26Y 9월','26Y 10월','26Y 11월','26Y 12월'];
const MONTH_LABELS = ['3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ---- DOM 참조 ----
const uploadZone   = document.getElementById('uploadZone');
const dashboard    = document.getElementById('dashboard');
const csvUpload    = document.getElementById('csvUpload');
const toastEl      = document.getElementById('toast');

// =====================================================
// 초기화
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  // CSV 업로드
  csvUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) parseFile(file);
    e.target.value = '';
  });

  // 드래그 앤 드롭
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.querySelector('.upload-content').classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.querySelector('.upload-content').classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.querySelector('.upload-content').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  });

  // 샘플 데이터
  document.getElementById('btnLoadSample').addEventListener('click', loadSampleData);
  document.getElementById('btnLoadSample2').addEventListener('click', loadSampleData);

  // 필터 / 정렬
  document.getElementById('btnApplyFilter').addEventListener('click', applyFilter);
  document.getElementById('btnReset').addEventListener('click', resetFilter);
  document.getElementById('tableSearch').addEventListener('input', debounce(applyFilter, 300));

  // 차트 토글
  document.getElementById('chartToggle').addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentBarType = btn.dataset.chart;
    renderBarChart();
  });

  // CSV 다운로드
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
});

// =====================================================
// 파일 파싱
// =====================================================
function parseFile(file) {
  showToast('파일을 파싱하는 중...', 'info');
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    processTSV(text);
  };
  // UTF-8 시도, 실패시 EUC-KR
  try {
    reader.readAsText(file, 'UTF-8');
  } catch {
    reader.readAsText(file, 'EUC-KR');
  }
}

function loadSampleData() {
  processTSV(SAMPLE_TSV);
  showToast('샘플 데이터가 로드되었습니다.', 'success');
}

function processTSV(text) {
  // PapaParse로 탭/쉼표 자동 감지
  const result = Papa.parse(text.trim(), {
    header: true,
    delimiter: '',        // auto-detect
    skipEmptyLines: true,
    transformHeader: h => h.trim()
  });

  if (result.errors.length && result.data.length === 0) {
    showToast('파일 파싱 실패: 형식을 확인해주세요.', 'error');
    return;
  }

  rawRows = result.data.map(r => {
    const row = {};
    Object.keys(r).forEach(k => { row[k.trim()] = (r[k] || '').trim(); });
    return row;
  });

  if (rawRows.length === 0) { showToast('데이터가 없습니다.', 'error'); return; }

  // 컬럼 검증
  const headers = Object.keys(rawRows[0]);
  if (!headers.includes('구분1') || !headers.includes('Device Name')) {
    showToast('필수 컬럼(구분1, Device Name)이 없습니다. 헤더를 확인해주세요.', 'error');
    return;
  }

  analyzeData();
  showDashboard();
  showToast(`${rawRows.length}개 행 로드 완료`, 'success');
}

// =====================================================
// 데이터 분석
// =====================================================
function analyzeData() {
  // 1) 구분1에서 날짜 추출 및 정렬
  const dateSet = new Set(rawRows.map(r => r['구분1'] || ''));
  dateSet.delete('');
  const sortedDates = sortDates([...dateSet]);

  if (sortedDates.length < 2) {
    // 날짜가 1개뿐이면 단일 날짜 분석
    analysisResult = buildGrouped(rawRows, null, rawRows);
  } else {
    const latestDate = sortedDates[sortedDates.length - 1];
    const prevDate   = sortedDates[sortedDates.length - 2];

    const latestRows = rawRows.filter(r => r['구분1'] === latestDate);
    const prevRows   = rawRows.filter(r => r['구분1'] === prevDate);

    analysisResult = buildGrouped(latestRows, prevRows, rawRows);

    // 날짜 뱃지 렌더
    document.getElementById('dateBadges').innerHTML = `
      <span class="date-badge prev"><i class="fas fa-calendar-minus"></i> ${prevDate}</span>
      <span class="date-badge-arrow">→</span>
      <span class="date-badge latest"><i class="fas fa-calendar-check"></i> ${latestDate}</span>
    `;
    // 테이블 헤더에 날짜 컨텍스트 표시
    const thPrev   = document.querySelector('.analysis-table thead th:nth-child(15)');
    const thLatest = document.querySelector('.analysis-table thead th:nth-child(16)');
    if (thPrev)   thPrev.innerHTML   = `이전합계<br><span style="font-size:9px;opacity:.7;font-weight:400">${prevDate}</span>`;
    if (thLatest) thLatest.innerHTML = `최신합계<br><span style="font-size:9px;opacity:.7;font-weight:400">${latestDate}</span>`;
  }

  // 필터 옵션 채우기
  fillFilterOptions();
  filteredResult = [...analysisResult];
  renderAll();
}

// 날짜 문자열 정렬 (숫자 추출 기반)
function sortDates(dates) {
  return dates.sort((a, b) => {
    const numA = parseInt((a.match(/\d+/g) || []).join(''), 10);
    const numB = parseInt((b.match(/\d+/g) || []).join(''), 10);
    return numA - numB;
  });
}

// Device Name + 대리점 기준으로 그룹핑 후 비교
function buildGrouped(latestRows, prevRows, _allRows) {
  // Key: "DeviceName||대리점"
  const makeKey = r => `${r['Device Name'] || ''}||${r['대리점'] || ''}`;

  const groupLatest = groupBy(latestRows, makeKey);
  const groupPrev   = prevRows ? groupBy(prevRows, makeKey) : {};

  const allKeys = new Set([...Object.keys(groupLatest), ...Object.keys(groupPrev)]);

  const result = [];
  allKeys.forEach(key => {
    const lRows = groupLatest[key] || [];
    const pRows = groupPrev ? (groupPrev[key] || []) : [];

    const latestMonths = sumMonths(lRows);
    const prevMonths   = sumMonths(pRows);

    const latestTotal = latestMonths.reduce((s, v) => s + v, 0);
    const prevTotal   = prevMonths.reduce((s, v) => s + v, 0);
    const delta = latestTotal - prevTotal;
    const rate  = prevTotal > 0 ? ((delta / prevTotal) * 100) : (latestTotal > 0 ? 100 : 0);

    // 메타 (최신 rows 우선, 없으면 prev)
    const metaRow = (lRows[0] || pRows[0]) || {};

    result.push({
      key,
      deviceName : metaRow['Device Name'] || key.split('||')[0],
      agency     : metaRow['대리점'] || key.split('||')[1],
      manager    : metaRow['담당자'] || '',
      region     : metaRow['지역'] || '',
      latestMonths,
      prevMonths,
      latestTotal,
      prevTotal,
      delta,
      absDelta   : Math.abs(delta),
      rate,
      status     : delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'
    });
  });

  return result;
}

function groupBy(arr, keyFn) {
  const map = {};
  arr.forEach(r => {
    const k = keyFn(r);
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

function sumMonths(rows) {
  return MONTH_KEYS.map(mk => {
    return rows.reduce((s, r) => {
      const v = parseNum(r[mk]);
      return s + v;
    }, 0);
  });
}

function parseNum(v) {
  if (!v || v === '' || v === '-') return 0;
  const n = parseInt(String(v).replace(/[^0-9\-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

// =====================================================
// 필터 옵션 채우기
// =====================================================
function fillFilterOptions() {
  const managers = [...new Set(analysisResult.map(d => d.manager).filter(Boolean))].sort();
  const regions  = [...new Set(analysisResult.map(d => d.region).filter(Boolean))].sort();

  const mSel = document.getElementById('filterManager');
  mSel.innerHTML = '<option value="">전체</option>' + managers.map(m => `<option value="${m}">${m}</option>`).join('');

  const rSel = document.getElementById('filterRegion');
  rSel.innerHTML = '<option value="">전체</option>' + regions.map(r => `<option value="${r}">${r}</option>`).join('');
}

// =====================================================
// 필터 / 정렬
// =====================================================
function applyFilter() {
  const manager  = document.getElementById('filterManager').value;
  const region   = document.getElementById('filterRegion').value;
  const sortMode = document.getElementById('sortMode').value;
  const minDelta = parseNum(document.getElementById('minDelta').value) || 0;
  const search   = document.getElementById('tableSearch').value.toLowerCase().trim();

  filteredResult = analysisResult.filter(d => {
    if (manager && d.manager !== manager) return false;
    if (region  && d.region  !== region)  return false;
    if (d.absDelta < minDelta)             return false;
    if (search && !d.deviceName.toLowerCase().includes(search) && !d.agency.toLowerCase().includes(search)) return false;
    return true;
  });

  // 정렬
  filteredResult.sort((a, b) => {
    if (sortMode === 'abs_desc') return b.absDelta - a.absDelta;
    if (sortMode === 'inc_desc') return b.delta - a.delta;
    if (sortMode === 'dec_desc') return a.delta - b.delta;
    if (sortMode === 'name_asc') return a.deviceName.localeCompare(b.deviceName);
    return 0;
  });

  currentPage = 1;
  renderAll();
}

function resetFilter() {
  document.getElementById('filterManager').value = '';
  document.getElementById('filterRegion').value  = '';
  document.getElementById('sortMode').value      = 'abs_desc';
  document.getElementById('minDelta').value      = '0';
  document.getElementById('tableSearch').value   = '';
  filteredResult = [...analysisResult];
  filteredResult.sort((a, b) => b.absDelta - a.absDelta);
  currentPage = 1;
  renderAll();
}

// =====================================================
// 전체 렌더
// =====================================================
function renderAll() {
  renderKPI();
  renderTable();
  renderBarChart();
  renderPieChart();
  renderTrendChart();
}

// =====================================================
// KPI 카드
// =====================================================
function renderKPI() {
  const data = filteredResult;
  const inc  = data.filter(d => d.status === 'up').length;
  const dec  = data.filter(d => d.status === 'down').length;
  const same = data.filter(d => d.status === 'same').length;

  document.getElementById('kpiTotal').textContent = data.length.toLocaleString();
  document.getElementById('kpiInc').textContent   = inc.toLocaleString();
  document.getElementById('kpiDec').textContent   = dec.toLocaleString();
  document.getElementById('kpiSame').textContent  = same.toLocaleString();

  const maxInc = data.filter(d => d.status === 'up').sort((a,b) => b.delta - a.delta)[0];
  const maxDec = data.filter(d => d.status === 'down').sort((a,b) => a.delta - b.delta)[0];
  document.getElementById('kpiMaxInc').textContent = maxInc ? `${maxInc.deviceName} (+${maxInc.delta.toLocaleString()})` : '-';
  document.getElementById('kpiMaxDec').textContent = maxDec ? `${maxDec.deviceName} (${maxDec.delta.toLocaleString()})` : '-';
}

// =====================================================
// 테이블
// =====================================================
function renderTable() {
  const tbody = document.getElementById('tableBody');
  const total = filteredResult.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredResult.slice(start, start + PAGE_SIZE);

  document.getElementById('tableCount').textContent = `총 ${total.toLocaleString()}개 항목`;

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="19"><div class="empty-state"><i class="fas fa-inbox"></i><p>표시할 데이터가 없습니다</p></div></td></tr>`;
    renderPagination(0, 1);
    return;
  }

  const maxAbs = Math.max(...filteredResult.map(d => d.absDelta), 1);

  tbody.innerHTML = pageData.map(d => {
    const rowClass = d.status === 'up' ? 'row-highlight-up' : d.status === 'down' ? 'row-highlight-down' : '';
    const deltaClass = d.status === 'up' ? 'delta-up' : d.status === 'down' ? 'delta-down' : 'delta-same';
    const deltaSign  = d.delta > 0 ? '+' : '';
    const rateAbs    = Math.min(Math.abs(d.rate), 100);
    const rateBarColor = d.status === 'up' ? 'rate-bar-up' : 'rate-bar-down';

    const monthCells = d.latestMonths.map((v, i) => {
      const prev = d.prevMonths[i];
      const diff = v - prev;
      const cls  = v > 0 ? 'num has-data' : 'num';
      let diffHtml = '';
      // 이전값이 존재하거나 현재값이 있을 때만 diff 표시
      if ((prev > 0 || v > 0) && diff !== 0) {
        if (diff > 0) diffHtml = `<span style="font-size:10px;color:var(--green-600);display:block;line-height:1">▲${diff.toLocaleString()}</span>`;
        else diffHtml = `<span style="font-size:10px;color:var(--red-600);display:block;line-height:1">▼${Math.abs(diff).toLocaleString()}</span>`;
      }
      return `<td class="${cls}">${v > 0 ? v.toLocaleString() : '-'}${diffHtml}</td>`;
    }).join('');

    const statusBadge = d.status === 'up'
      ? `<span class="status-badge status-up"><i class="fas fa-arrow-up"></i> 증가</span>`
      : d.status === 'down'
      ? `<span class="status-badge status-down"><i class="fas fa-arrow-down"></i> 감소</span>`
      : `<span class="status-badge status-same"><i class="fas fa-minus"></i> 유지</span>`;

    return `<tr class="${rowClass}">
      <td class="device-name-cell">${escHtml(d.deviceName)}</td>
      <td class="agency-cell">${escHtml(d.agency)}</td>
      <td>${escHtml(d.manager)}</td>
      <td>${escHtml(d.region)}</td>
      ${monthCells}
      <td class="num">${d.prevTotal > 0 ? d.prevTotal.toLocaleString() : '-'}</td>
      <td class="num has-data">${d.latestTotal > 0 ? d.latestTotal.toLocaleString() : '-'}</td>
      <td class="delta-cell ${deltaClass}">${d.delta !== 0 ? deltaSign + d.delta.toLocaleString() : '-'}</td>
      <td class="rate-cell">
        <div style="font-size:12px;font-weight:600;color:${d.status==='up'?'var(--green-600)':d.status==='down'?'var(--red-600)':'var(--slate-400)'}">
          ${d.delta !== 0 ? deltaSign + d.rate.toFixed(1) + '%' : '-'}
        </div>
        ${d.delta !== 0 ? `<div class="rate-bar ${rateBarColor}" style="width:${rateAbs}%"></div>` : ''}
      </td>
      <td>${statusBadge}</td>
    </tr>`;
  }).join('');

  renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, cur) {
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  const prev = cur - 1, next = cur + 1;
  html += `<button class="page-btn" onclick="goPage(${prev})" ${cur===1?'disabled':''}>‹</button>`;
  for (let i = Math.max(1, cur-2); i <= Math.min(totalPages, cur+2); i++) {
    html += `<button class="page-btn ${i===cur?'active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${next})" ${cur===totalPages?'disabled':''}>›</button>`;
  pag.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderTable();
  document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =====================================================
// 막대/꺾은선 차트 (상위 15개)
// =====================================================
function renderBarChart() {
  const top15 = [...filteredResult].sort((a,b) => b.absDelta - a.absDelta).slice(0, 15);
  const labels     = top15.map(d => truncate(d.deviceName, 14));
  const latestData = top15.map(d => d.latestTotal);
  const prevData   = top15.map(d => d.prevTotal);
  const deltaColors = top15.map(d => d.status === 'up' ? 'rgba(34,197,94,.8)' : d.status === 'down' ? 'rgba(239,68,68,.8)' : 'rgba(148,163,184,.6)');

  const ctx = document.getElementById('chartBar').getContext('2d');
  if (chartBar) chartBar.destroy();

  chartBar = new Chart(ctx, {
    type: currentBarType === 'line' ? 'line' : 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '최신 합계',
          data: latestData,
          backgroundColor: 'rgba(59,130,246,.75)',
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: currentBarType === 'line' ? 2.5 : 0,
          borderRadius: currentBarType === 'bar' ? 6 : 0,
          tension: 0.4,
          fill: currentBarType === 'line',
          pointRadius: currentBarType === 'line' ? 4 : 0,
          pointBackgroundColor: 'rgba(59,130,246,1)',
        },
        {
          label: '이전 합계',
          data: prevData,
          backgroundColor: 'rgba(148,163,184,.55)',
          borderColor: 'rgba(100,116,139,1)',
          borderWidth: currentBarType === 'line' ? 2.5 : 0,
          borderRadius: currentBarType === 'bar' ? 6 : 0,
          tension: 0.4,
          fill: false,
          pointRadius: currentBarType === 'line' ? 4 : 0,
          pointBackgroundColor: 'rgba(100,116,139,1)',
          borderDash: currentBarType === 'line' ? [5,4] : [],
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Noto Sans KR', size: 12 }, color: '#475569' } },
        tooltip: {
          callbacks: {
            afterBody: ctx => {
              const i = ctx[0].dataIndex;
              const d = top15[i];
              return [`변동폭: ${d.delta > 0 ? '+' : ''}${d.delta.toLocaleString()}`, `변동율: ${d.rate.toFixed(1)}%`];
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 11 }, color: '#64748b', maxRotation: 35 }, grid: { display: false } },
        y: { ticks: { font: { size: 11 }, color: '#64748b' }, grid: { color: 'rgba(226,232,240,.7)' } }
      }
    }
  });
}

// =====================================================
// 파이 차트
// =====================================================
function renderPieChart() {
  const inc  = filteredResult.filter(d => d.status === 'up').length;
  const dec  = filteredResult.filter(d => d.status === 'down').length;
  const same = filteredResult.filter(d => d.status === 'same').length;

  const ctx = document.getElementById('chartPie').getContext('2d');
  if (chartPie) chartPie.destroy();
  chartPie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['증가','감소','유지'],
      datasets: [{
        data: [inc, dec, same],
        backgroundColor: ['rgba(34,197,94,.8)','rgba(239,68,68,.8)','rgba(148,163,184,.6)'],
        borderColor: ['#fff','#fff','#fff'],
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Noto Sans KR', size: 12 }, color: '#475569', padding: 16 } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${ctx.parsed}개 (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// =====================================================
// 트렌드 차트 (월별 전체 합계)
// =====================================================
function renderTrendChart() {
  const latestByMonth = MONTH_LABELS.map((_, i) =>
    filteredResult.reduce((s, d) => s + d.latestMonths[i], 0)
  );
  const prevByMonth = MONTH_LABELS.map((_, i) =>
    filteredResult.reduce((s, d) => s + d.prevMonths[i], 0)
  );

  const ctx = document.getElementById('chartTrend').getContext('2d');
  if (chartTrend) chartTrend.destroy();
  chartTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        {
          label: '최신 데이터 월별 합계',
          data: latestByMonth,
          borderColor: 'rgba(59,130,246,1)',
          backgroundColor: 'rgba(59,130,246,.12)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: 'rgba(59,130,246,1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: '이전 데이터 월별 합계',
          data: prevByMonth,
          borderColor: 'rgba(100,116,139,1)',
          backgroundColor: 'rgba(100,116,139,.06)',
          borderWidth: 2.5,
          borderDash: [6, 4],
          tension: 0.35,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(100,116,139,1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Noto Sans KR', size: 12 }, color: '#475569' } }
      },
      scales: {
        x: { ticks: { font: { size: 12 }, color: '#64748b' }, grid: { display: false } },
        y: { ticks: { font: { size: 11 }, color: '#64748b' }, grid: { color: 'rgba(226,232,240,.7)' } }
      }
    }
  });
}

// =====================================================
// 대시보드 표시
// =====================================================
function showDashboard() {
  uploadZone.style.display = 'none';
  dashboard.style.display  = 'block';
}

// =====================================================
// CSV 다운로드
// =====================================================
function exportCSV() {
  const headers = ['Device Name','대리점','담당자','지역','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월','이전합계','최신합계','변동폭','변동율(%)','상태'];
  const rows = filteredResult.map(d => [
    d.deviceName, d.agency, d.manager, d.region,
    ...d.latestMonths.map(v => v || ''),
    d.prevTotal, d.latestTotal,
    d.delta, d.rate.toFixed(1),
    d.status === 'up' ? '증가' : d.status === 'down' ? '감소' : '유지'
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'device_analysis.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV 다운로드가 시작되었습니다.', 'success');
}

// =====================================================
// 유틸
// =====================================================
function showToast(msg, type = 'info') {
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
