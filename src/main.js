import './style.css'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from './lib/supabase.js'

document.querySelector('#app').innerHTML = `
  <div class="app-layout">
    <!-- 상단 네비게이션 바 -->
    <nav class="main-nav">
      <div class="nav-brand">
        <h1>TDT Admin</h1>
        <p>Central Command</p>
      </div>
      <ul class="nav-links">
        <li class="nav-item active" data-target="view-dashboard">📊 종합 분석 대시보드</li>
        <li class="nav-item" data-target="view-map">🗺️ 실시간 관제 지도</li>
        <li class="nav-item" data-target="view-history">📍 일일 운행 일지</li>
        <li class="nav-item" data-target="view-accounts">⚙️ 기사 계정 관리</li>
        <li class="nav-item" data-target="view-rankings">🏆 기사 실적 순위</li>
      </ul>
      <div class="nav-footer">
        <p id="sys-status">🟢 시스템 정상</p>
      </div>
    </nav>

    <main class="content-area">
      <!-- 1. 종합 분석 대시보드 -->
      <div id="view-dashboard" class="view active">
        <div class="view-header">
          <h2>종합 분석 대시보드</h2>
          <p>오늘의 배달 현황 및 기사 활동 요약</p>
        </div>
        <div class="dashboard-grid">
          <div class="dash-card">
            <h3>총 등록 기사</h3>
            <p class="dash-value" id="dash-total-staff">0</p>
          </div>
          <div class="dash-card">
            <h3>현재 근무중</h3>
            <p class="dash-value" id="dash-active-staff" style="color: var(--success)">0</p>
          </div>
          <div class="dash-card">
            <h3>실시간 배달중</h3>
            <p class="dash-value" id="dash-delivering" style="color: var(--accent)">0</p>
          </div>
          <div class="dash-card">
            <h3>시스템 연결 상태</h3>
            <p class="dash-value" id="conn-status" style="font-size:1.2rem;">데이터베이스 연동 중...</p>
          </div>
        </div>
        <div class="chart-placeholder">
          <h3>시간대별 배달량 분석 (준비중)</h3>
          <div class="chart-mock"></div>
        </div>
      </div>

      <!-- 2. 실시간 관제 지도 -->
      <div id="view-map" class="view" style="flex-direction: row;">
        
        <!-- 실시간 관제 전용 왼쪽 메뉴 (Left Nav) -->
        <div class="map-left-nav">
          <div class="map-left-header">Map Tools</div>
          <ul class="map-left-links">
            <li class="map-left-item active" data-map-view="map-realtime-view">📍 실시간 관제 지도</li>
            <li class="map-left-item" data-map-view="map-landmarks-view">⭐ 자주가는 곳 관리</li>
            <li class="map-left-item" data-map-view="map-branches-view">🏢 지점 관리</li>
          </ul>
        </div>

        <div class="map-content-area" style="flex: 1; position: relative; overflow: hidden; display: flex; flex-direction: column;">
          
          <!-- [서브화면 1] 실시간 관제 -->
          <div id="map-realtime-view" class="map-inner-view active" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- 자체 서브 탭 -->
            <div class="map-sub-nav">
              <button class="sub-tab active" data-filter="all">🌍 전체 관제</button>
              <button class="sub-tab" data-filter="delivering">🚀 배달중 (콜 수행중)</button>
              <button class="sub-tab" data-filter="idle">☕ 대기중 (유휴)</button>
            </div>
            
            <div class="map-body">
              <div class="map-container">
                <div class="map-overlay">
                  <h1>TDT Live Map</h1>
                  <p>실시간 GPS 위성 관제망</p>
                </div>
                <div class="map-search-box">
                  <input type="text" id="map-search-input" placeholder="하노이 주소, 장소 검색...">
                  <button id="btn-map-search">🔍 검색</button>
                </div>
                <div id="map"></div>
              </div>
              <div class="map-sidebar">
                <div class="sidebar-header">
                  <h2>운영 현황 (Real-time)</h2>
                  <div class="global-stats">
                    <div class="stat-item">
                      <span class="stat-val" id="total-active">0</span>
                      <span class="stat-label">근무중</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-val" id="total-dist">0.0</span>
                      <span class="stat-label">총 거리(km)</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-val" id="total-idle">0</span>
                      <span class="stat-label">유휴(명)</span>
                    </div>
                  </div>
                </div>
                <div class="staff-list" id="staff-list"></div>
              </div>
            </div>
          </div>

          <!-- [서브화면 2] 자주가는 곳 관리 -->
          <div id="map-landmarks-view" class="map-inner-view" style="display: none; flex: 1; padding: 30px; overflow-y: auto;">
            <div class="view-header">
              <h2>자주가는 곳 (거점) 관리</h2>
              <p>지도에 등록된 단골 배달 거점 및 랜드마크 리스트를 관리합니다.</p>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead><tr><th>거점명 (별명)</th><th>위도(Lat)</th><th>경도(Lng)</th><th>액션</th></tr></thead>
                <tbody id="landmarks-manage-body">
                  <tr><td colspan="4" style="text-align:center;">데이터를 불러오는 중...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- [서브화면 3] 지점 관리 -->
          <div id="map-branches-view" class="map-inner-view" style="display: none; flex: 1; padding: 30px; overflow-y: auto;">
            <div class="view-header">
              <h2>지점 관리</h2>
              <p>지역별 센터 및 배달 지점 관리 (준비중)</p>
            </div>
            <div class="table-container" style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--text-muted);">
              <h3>데이터베이스 연동 대기 중...</h3>
            </div>
          </div>

        </div>
      </div>

      <!-- 5. 일일 운행 일지 -->
      <div id="view-history" class="view">
        <div class="history-sidebar">
          <h2>운행 일지 조회</h2>
          <div class="history-control">
            <label>기사 선택</label>
            <select id="history-staff-select">
              <option value="">기사를 선택하세요</option>
            </select>
          </div>
          <div class="history-control">
            <label>날짜 선택</label>
            <input type="date" id="history-date">
          </div>
          <button id="btn-load-history">경로 그리기 🚀</button>
          
          <div class="history-stats-box">
            <p>총 데이터 포인트: <span id="hist-points">0</span>개</p>
            <p>도로보정 이동거리: <span id="hist-dist">0.0</span> km</p>
          </div>
        </div>
        <div class="history-map-container" style="flex: 1; position: relative;">
          <div id="map-history" style="width: 100%; height: 100%; background: #e5e3df; z-index: 1;"></div>
        </div>
      </div>

      <!-- 3. 기사 계정 관리 -->
      <div id="view-accounts" class="view">
        <div class="view-header">
          <h2>기사 계정 관리</h2>
          <p>등록된 기사 명단 조회 및 계정 정지/활성화 관리</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>이름</th><th>ID (사번)</th><th>상태</th><th>최근 접속</th><th>액션</th></tr>
            </thead>
            <tbody id="accounts-table-body">
              <tr><td colspan="5" style="text-align:center;">데이터를 불러오는 중...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. 기사 실적 순위 -->
      <div id="view-rankings" class="view">
        <div class="view-header">
          <h2>기사 실적 순위 (Leaderboard)</h2>
          <p>이동 거리 및 배달 완료 건수 기반 우수 기사 랭킹</p>
        </div>
        <div class="table-container">
          <table class="data-table ranking-table">
            <thead>
              <tr><th>순위</th><th>이름</th><th>배달 건수</th><th>누적 이동거리</th></tr>
            </thead>
            <tbody id="rankings-table-body">
              <tr><td colspan="4" style="text-align:center;">순위 집계 중...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
`

// --- 탭 네비게이션 로직 ---
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    e.currentTarget.classList.add('active');

    const targetId = e.currentTarget.getAttribute('data-target');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');

    localStorage.setItem('tdt_active_view', targetId);

    if (targetId === 'view-map') {
      setTimeout(() => { map.invalidateSize() }, 100);
    } else if (targetId === 'view-history') {
      setTimeout(() => { historyMap.invalidateSize() }, 100);
      populateHistorySelect();
    }
  });
});

// --- 지도 전용 기능 탭(왼쪽 네비) 로직 ---
document.querySelectorAll('.map-left-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.map-left-item').forEach(nav => nav.classList.remove('active'));
    e.currentTarget.classList.add('active');

    const targetId = e.currentTarget.getAttribute('data-map-view');
    document.querySelectorAll('.map-inner-view').forEach(view => {
      view.style.display = 'none';
      view.classList.remove('active');
    });
    
    const targetView = document.getElementById(targetId);
    targetView.style.display = 'flex';
    targetView.classList.add('active');

    localStorage.setItem('tdt_active_map_view', targetId);

    if (targetId === 'map-realtime-view') {
      setTimeout(() => { map.invalidateSize() }, 100);
    } else if (targetId === 'map-landmarks-view') {
      renderLandmarksManageTable();
    }
  });
});

// --- 지도 서브 탭 (필터) 로직 ---
let currentMapFilter = 'all';
document.querySelectorAll('.sub-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentMapFilter = e.currentTarget.getAttribute('data-filter');
    renderMapSidebarAndMarkers(); // 즉각 리렌더링
  });
});

// --- 1. 지도 초기화 ---
const map = L.map('map', { zoomControl: false }).setView([21.0285, 105.8542], 14)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors & CARTO',
  maxZoom: 19
}).addTo(map)
L.control.zoom({ position: 'bottomright' }).addTo(map)

const historyMap = L.map('map-history', { zoomControl: false }).setView([21.0285, 105.8542], 14)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors & CARTO',
  maxZoom: 19
}).addTo(historyMap)
L.control.zoom({ position: 'bottomright' }).addTo(historyMap)
let historyPolyline = null;

document.getElementById('history-date').valueAsDate = new Date();

const markers = {}
let staffData = []

function parseWKBPoint(hex) {
  if (!hex || hex.length !== 50) return null;
  const lngHex = hex.substring(18, 34);
  const latHex = hex.substring(34, 50);
  const parseDouble = (h) => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(h.substring(i*2, i*2+2), 16));
    return view.getFloat64(0, true); 
  };
  return { lng: parseDouble(lngHex), lat: parseDouble(latHex) };
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

// --- 2. 데이터 실시간 연동 ---
async function loadRealData() {
  const connStatus = document.getElementById('conn-status');
  try {
    const { data: staffList, error: staffError } = await supabase.from('tdt_staff').select('*').order('created_at', { ascending: false });
    if (staffError) throw staffError;

    const { data: recentLogs, error: gpsError } = await supabase
      .from('tdt_gps_logs')
      .select('staff_id, location, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(500);
    if (gpsError) throw gpsError;

    const latestLogsByStaff = {};
    if (recentLogs) {
      for (const log of recentLogs) {
        if (!latestLogsByStaff[log.staff_id]) {
          latestLogsByStaff[log.staff_id] = log;
        }
      }
    }

    const { data: activeDeliveries } = await supabase.from('tdt_deliveries').select('staff_id').eq('status', 'IN_PROGRESS');
    const deliveringStaffIds = new Set((activeDeliveries || []).map(d => d.staff_id));

    const newStaffData = [];
    for (const staff of staffList) {
      const log = latestLogsByStaff[staff.id];
      let lat = 0, lng = 0;
      let status = 'offline';
      let lastUpdate = '기록 없음';

      if (log) {
        if (typeof log.location === 'string' && log.location.startsWith('010100')) {
          const parsed = parseWKBPoint(log.location);
          if (parsed) { lng = parsed.lng; lat = parsed.lat; }
        }
        
        const diffMs = new Date() - new Date(log.recorded_at);
        if (diffMs > 20000) status = 'offline';
        else if (deliveringStaffIds.has(staff.id)) status = 'delivering';
        else status = 'active'; // active는 대기중/이동중 (idle 포함 개념)

        if (status === 'active' && diffMs < 20000 && staff.dist === 0) {
           // 엄밀히 멈춰있으면 idle로 볼수도 있지만, 여기선 active 상태로 통칭 후 텍스트만 분리
        }

        lastUpdate = new Date(log.recorded_at).toLocaleTimeString();
      }

      newStaffData.push({
        ...staff,
        status,
        lat,
        lng,
        dist: 0, 
        lastUpdate
      });
    }

    staffData = newStaffData;
    connStatus.innerHTML = `<span style="color:var(--success)">🟢 연결됨 (실시간 동기화 중)</span>`;
    
    renderDashboardStats();
    renderMapSidebarAndMarkers();
    renderAccountsTable();
    renderRankingsTable();

  } catch (err) {
    console.error("데이터 로드 에러:", err);
    connStatus.innerHTML = `<span style="color:var(--danger)">🔴 서버 통신 장애</span>`;
  }
}

setInterval(loadRealData, 5000);
loadRealData();

// --- 3. UI 렌더링 ---
function renderDashboardStats() {
  document.getElementById('dash-total-staff').innerText = staffData.length;
  document.getElementById('dash-active-staff').innerText = staffData.filter(s => s.status === 'active' || s.status === 'delivering').length;
  document.getElementById('dash-delivering').innerText = staffData.filter(s => s.status === 'delivering').length;
}

function renderMapSidebarAndMarkers() {
  const listEl = document.getElementById('staff-list')
  listEl.innerHTML = ''
  
  let activeCount = 0; let idleCount = 0; let totalDist = 0;

  // 전체 기존 마커 지우기 (필터링을 위해)
  Object.values(markers).forEach(m => map.removeLayer(m));
  
  staffData.forEach(staff => {
    if (staff.status === 'active' || staff.status === 'delivering') activeCount++;
    if (staff.status === 'idle') idleCount++; // 현재 로직상 active와 섞여있음
    totalDist += staff.dist;

    // 서브 탭 필터링 로직
    if (currentMapFilter === 'delivering' && staff.status !== 'delivering') return;
    if (currentMapFilter === 'idle' && staff.status !== 'active') return; // active를 대기로 간주
    
    // 오프라인 기사는 'delivering', 'idle' 필터일 땐 안보이게 처리
    if (currentMapFilter !== 'all' && staff.status === 'offline') return;

    if (staff.lat !== 0) {
      const card = document.createElement('div');
      card.className = `staff-card status-${staff.status}`;
      
      let statusText = '대기/이동';
      if(staff.status === 'delivering') statusText = '배달중 🚀';
      if(staff.status === 'offline') statusText = '퇴근/통신끊김';

      if (staff.status === 'offline') {
        card.style.opacity = '0.4';
      }

      card.innerHTML = `
        <div class="card-top">
          <span class="staff-name">${staff.name}</span>
          <span class="staff-status">${statusText}</span>
        </div>
        <div class="card-metrics">
          <div class="metric">이동 <span>${staff.dist.toFixed(1)}km</span></div>
          <div class="metric">업데이트 <span>${staff.lastUpdate}</span></div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (staff.status !== 'offline') {
          map.flyTo([staff.lat, staff.lng], 16, { duration: 1.5 });
        }
      });
      listEl.appendChild(card);

      if (staff.status !== 'offline') {
        const iconHtml = `<div class="custom-marker ${staff.status}">${staff.name.charAt(0)}</div>`;
        const customIcon = L.divIcon({ className: 'clear-default', html: iconHtml, iconSize: [32, 32], iconAnchor: [16, 16] });

        if (!markers[staff.id]) {
          markers[staff.id] = L.marker([staff.lat, staff.lng], { icon: customIcon }).addTo(map);
        } else {
          markers[staff.id].setLatLng([staff.lat, staff.lng]);
          markers[staff.id].setIcon(customIcon);
          markers[staff.id].addTo(map); // 다시 추가
        }
      }
    }
  });

  document.getElementById('total-active').innerText = activeCount;
  document.getElementById('total-idle').innerText = idleCount;
  document.getElementById('total-dist').innerText = totalDist.toFixed(1);
}

function renderAccountsTable() {
  const tbody = document.getElementById('accounts-table-body');
  tbody.innerHTML = '';
  if (staffData.length === 0) return;

  staffData.forEach(s => {
    const tr = document.createElement('tr');
    const statusHtml = s.is_active 
      ? '<span style="color:var(--success); font-weight:bold;">정상 활동중</span>' 
      : '<span style="color:var(--danger); font-weight:bold;">계정 정지됨</span>';
    const btnText = s.is_active ? '비활성화 (정지)' : '계정 활성화';
    const btnColor = s.is_active ? 'var(--danger)' : 'var(--success)';

    tr.innerHTML = `
      <td style="font-weight:bold;">${s.name}</td>
      <td style="font-size:0.75rem; color:var(--text-muted);">${s.id}</td>
      <td>${statusHtml}</td>
      <td>${s.lastUpdate}</td>
      <td>
        <button onclick="window.toggleStaffStatus('${s.id}', ${s.is_active})" class="btn-toggle-status" style="color: ${btnColor}; border-color: ${btnColor}">
          ${btnText}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRankingsTable() {
  const tbody = document.getElementById('rankings-table-body');
  tbody.innerHTML = '';
  const sorted = [...staffData].sort((a,b) => b.dist - a.dist);
  sorted.forEach((s, index) => {
    const tr = document.createElement('tr');
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
    tr.innerHTML = `
      <td style="font-weight:bold; font-size:1.2rem;">${medal}</td>
      <td style="font-weight:bold; color:var(--primary);">${s.name}</td>
      <td>추후 연동 건</td>
      <td>${s.dist.toFixed(1)} km</td>
    `;
    tbody.appendChild(tr);
  });
}

window.toggleStaffStatus = async (id, currentStatus) => {
  if (!confirm(`이 기사 계정을 ${currentStatus ? '정지(비활성화)' : '활성화'} 하시겠습니까?`)) return;
  const { error } = await supabase.from('tdt_staff').update({ is_active: !currentStatus }).eq('id', id);
  if (error) alert(`상태 변경 실패: RLS 권한 확인 필요\n에러: ${error.message}`);
  else loadRealData(); 
}

// --- 4. 히스토리 로직 ---
function populateHistorySelect() {
  const select = document.getElementById('history-staff-select');
  const currentValue = select.value;
  select.innerHTML = '<option value="">기사를 선택하세요</option>';
  staffData.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.name;
    select.appendChild(option);
  });
  if (currentValue) select.value = currentValue;
}

document.getElementById('btn-load-history').addEventListener('click', async () => {
  const staffId = document.getElementById('history-staff-select').value;
  const targetDateStr = document.getElementById('history-date').value;

  if (!staffId) { alert("기사를 선택해 주세요!"); return; }

  if (historyPolyline) { historyMap.removeLayer(historyPolyline); historyPolyline = null; }

  const startDate = new Date(targetDateStr + "T00:00:00");
  const endDate = new Date(targetDateStr + "T23:59:59");
  const btn = document.getElementById('btn-load-history');
  btn.innerText = "데이터 로딩 중... ⏳";

  try {
    const { data: logs, error } = await supabase
      .from('tdt_gps_logs').select('location, recorded_at')
      .eq('staff_id', staffId).gte('recorded_at', startDate.toISOString()).lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    if (!logs || logs.length === 0) { alert("운행 기록이 없습니다."); btn.innerText = "경로 그리기 🚀"; return; }

    const rawLatLngs = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]; let lat = 0, lng = 0;
      if (typeof log.location === 'string' && log.location.startsWith('010100')) {
        const parsed = parseWKBPoint(log.location);
        if (parsed) { lng = parsed.lng; lat = parsed.lat; }
      } else if (typeof log.location === 'string') {
        const match = log.location.match(/POINT\(([^ ]+) ([^)]+)\)/i);
        if (match) { lng = parseFloat(match[1]); lat = parseFloat(match[2]); }
      }
      if (lat !== 0 && lng !== 0) rawLatLngs.push([lat, lng]);
    }

    if (rawLatLngs.length === 0) { alert("데이터 파싱 실패."); btn.innerText = "경로 그리기 🚀"; return; }

    const sampled = [rawLatLngs[0]];
    for (let i = 1; i < rawLatLngs.length; i++) {
      if (getDistanceFromLatLonInKm(sampled[sampled.length-1][0], sampled[sampled.length-1][1], rawLatLngs[i][0], rawLatLngs[i][1]) > 0.015) {
        sampled.push(rawLatLngs[i]);
      }
    }

    btn.innerText = "도로망 AI 매칭 중... 🤖";
    const chunkSize = 80; let matchedCoordinates = []; let roadDistance = 0;

    for (let i = 0; i < sampled.length; i += chunkSize) {
      const chunk = sampled.slice(i, i + chunkSize + 1);
      if (chunk.length < 2) continue;
      const coordsStr = chunk.map(p => `${p[1]},${p[0]}`).join(';');
      
      try {
        const res = await fetch(`https://router.project-osrm.org/match/v1/driving/${coordsStr}?geometries=geojson&overview=full`);
        const data = await res.json();
        if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
          data.matchings.forEach(match => {
            matchedCoordinates.push(...match.geometry.coordinates.map(c => [c[1], c[0]]));
            roadDistance += (match.distance / 1000); 
          });
        } else {
          matchedCoordinates.push(...chunk);
          for(let j=1; j<chunk.length; j++) roadDistance += getDistanceFromLatLonInKm(chunk[j-1][0], chunk[j-1][1], chunk[j][0], chunk[j][1]);
        }
      } catch (e) {
        matchedCoordinates.push(...chunk);
        for(let j=1; j<chunk.length; j++) roadDistance += getDistanceFromLatLonInKm(chunk[j-1][0], chunk[j-1][1], chunk[j][0], chunk[j][1]);
      }
    }

    historyPolyline = L.polyline(matchedCoordinates, { color: '#bb86fc', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(historyMap);
    historyMap.fitBounds(historyPolyline.getBounds(), { padding: [50, 50] });

    document.getElementById('hist-points').innerText = `${rawLatLngs.length} -> 보정됨`;
    document.getElementById('hist-dist').innerText = roadDistance.toFixed(1);

  } catch (err) { alert("데이터 로드 실패: " + err.message); }

  btn.innerText = "경로 그리기 🚀";
});

// --- 5. 지도 주소 검색 로직 ---
let searchMarker = null;
document.getElementById('btn-map-search').addEventListener('click', async () => {
  const query = document.getElementById('map-search-input').value;
  if (!query) return;
  const btn = document.getElementById('btn-map-search');
  btn.innerText = "⏳";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat); const lon = parseFloat(data[0].lon);
      map.flyTo([lat, lon], 17, { duration: 1.5 });
      if (searchMarker) map.removeLayer(searchMarker);
      const searchIcon = L.divIcon({ className: 'clear-default', html: `<div style="font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">📍</div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30] });
      searchMarker = L.marker([lat, lon], { icon: searchIcon }).addTo(map)
        .bindPopup(`<div style="color:black; font-family:'Inter'; text-align:center;">
          <b style="font-size:1.1em">검색 결과</b><br>
          <span style="font-size:0.8em; color:#555">${data[0].display_name}</span><br><br>
          <div style="display:flex; flex-direction:column; gap:5px;">
            <button onclick="window.saveLandmark(${lat}, ${lon}, 'branch')" style="padding:6px; background:#ff3b30; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">⭐ 지점(본사/지사) 등록</button>
            <button onclick="window.saveLandmark(${lat}, ${lon}, 'important')" style="padding:6px; background:#ff9500; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">🔥 중요 거점 등록</button>
            <button onclick="window.saveLandmark(${lat}, ${lon}, 'frequent')" style="padding:6px; background:#bb86fc; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">🏢 자주가는 곳 등록</button>
          </div>
        </div>`).openPopup();
    } else alert("해당 주소를 찾을 수 없습니다.");
  } catch (err) { alert("검색 중 통신 오류가 발생했습니다."); }
  btn.innerText = "🔍 검색";
});
document.getElementById('map-search-input').addEventListener('keypress', function (e) { if (e.key === 'Enter') document.getElementById('btn-map-search').click(); });

// --- 지도 우클릭(Context Menu) 수동 핀 꽂기 로직 ---
let tempManualPin = null;
map.on('contextmenu', function(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  
  if (tempManualPin) { map.removeLayer(tempManualPin); }
  
  const pinIcon = L.divIcon({ 
    className: 'clear-default', 
    html: `<div style="font-size: 2.2rem; text-shadow: 2px 2px 6px rgba(0,0,0,0.7);">📌</div>`, 
    iconSize: [30, 30], 
    iconAnchor: [15, 30], 
    popupAnchor: [0, -30] 
  });
  
  tempManualPin = L.marker([lat, lng], { icon: pinIcon }).addTo(map)
    .bindPopup(`
      <div style="color:black; font-family:'Inter'; text-align:center; min-width:190px;">
        <b style="font-size:1.1em; color:#000;">📌 수동 위치 지정</b><br>
        <span style="font-size:0.8em; color:#666;">위도: ${lat.toFixed(5)} / 경도: ${lng.toFixed(5)}</span><br><br>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <button onclick="window.saveLandmark(${lat}, ${lng}, 'branch')" style="padding:6px; background:#ff3b30; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">⭐ 지점(본사/지사) 수동 등록</button>
          <button onclick="window.saveLandmark(${lat}, ${lng}, 'important')" style="padding:6px; background:#ff9500; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">🔥 중요 거점 수동 등록</button>
          <button onclick="window.saveLandmark(${lat}, ${lng}, 'frequent')" style="padding:6px; background:#bb86fc; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">🏢 자주가는 곳 수동 등록</button>
        </div>
      </div>
    `).openPopup();
});

// --- 6. 랜드마크 관리 로직 ---
let landmarkMarkers = [];
async function loadLandmarks() {
  try {
    landmarkMarkers.forEach(m => map.removeLayer(m));
    landmarkMarkers = [];
    
    const { data, error } = await supabase.from('tdt_landmarks').select('*');
    if (error) return; 
    data.forEach(lm => {
      const type = lm.type || 'frequent';
      let iconHtml = '🏢';
      let typeClass = 'frequent';
      
      if (type === 'branch') { iconHtml = '⭐'; typeClass = 'branch'; }
      else if (type === 'important') { iconHtml = '🔥'; typeClass = 'important'; }
      
      const icon = L.divIcon({ className: 'clear-default', html: `<div class="landmark-marker ${typeClass}" style="cursor:pointer;">${iconHtml}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
      const marker = L.marker([lm.latitude, lm.longitude], { icon }).addTo(map)
        .bindTooltip(`<b>${lm.name}</b>`, { permanent: true, direction: 'top', className: 'landmark-tooltip' });
        
      marker.bindPopup(`
        <div style="color:black; font-family:'Inter'; text-align:center; min-width:180px;">
          <b style="font-size:1.1em; color:#000;">${lm.name}</b><br>
          <span style="font-size:0.8em; color:#888;">${type === 'branch' ? '지점' : type === 'important' ? '중요거점' : '단골거점'}</span><br><br>
          <div style="display:flex; gap:5px; justify-content:center;">
            <button onclick="window.editLandmark('${lm.id}', '${lm.name.replace(/'/g, "\\'")}', '${type}')" style="flex:1; padding:6px; background:#4facfe; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">수정 ✏️</button>
            <button onclick="window.deleteLandmark('${lm.id}')" style="flex:1; padding:6px; background:#da3633; color:white; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">삭제 🗑️</button>
          </div>
        </div>
      `);
      landmarkMarkers.push(marker);
    });
    
    renderLandmarksManageTable();
  } catch(e) {}
}
setTimeout(loadLandmarks, 1500);

// 거점 삭제 기능 및 테이블 렌더링
async function renderLandmarksManageTable() {
  const tbody = document.getElementById('landmarks-manage-body');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">데이터 로딩 중...</td></tr>';
  
  const { data, error } = await supabase.from('tdt_landmarks').select('*').order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger);">불러오기 실패: ${error.message}</td></tr>`;
    return;
  }
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">등록된 거점이 없습니다. 지도에서 검색 후 추가해주세요.</td></tr>';
    return;
  }

  // 자주가는 곳 관리 화면 테이블 헤더 업데이트 처리 (동적 삽입 또는 이미 존재하는 HTML 구조에 맞춤)
  const thead = tbody.parentElement.querySelector('thead tr');
  if(thead && thead.children.length === 4) {
    thead.innerHTML = '<th>거점명 (별명)</th><th>분류</th><th>위도(Lat)</th><th>경도(Lng)</th><th>액션</th>';
  }

  tbody.innerHTML = '';
  data.forEach(lm => {
    const tr = document.createElement('tr');
    let typeText = '🏢 자주가는 곳';
    if(lm.type === 'branch') typeText = '⭐ 지점 (본사/지사)';
    else if(lm.type === 'important') typeText = '🔥 중요 거점';

    tr.innerHTML = `
      <td style="font-weight:bold; color:var(--primary);">${lm.name}</td>
      <td style="font-size:0.9em;">${typeText}</td>
      <td>${lm.latitude.toFixed(6)}</td>
      <td>${lm.longitude.toFixed(6)}</td>
      <td><button onclick="window.deleteLandmark('${lm.id}')" style="padding: 5px 12px; background: var(--danger); color: white; font-weight: bold; border: none; border-radius: 4px; cursor: pointer;">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteLandmark = async (id) => {
  if (!confirm("해당 단골 거점을 완전히 삭제하시겠습니까? (지도상에서도 영구히 삭제됩니다)")) return;
  const { error } = await supabase.from('tdt_landmarks').delete().eq('id', id);
  if (error) alert("삭제 실패 (RLS 권한 문제일 수 있습니다): " + error.message);
  else {
    alert("거점이 안전하게 삭제되었습니다.");
    map.closePopup();
    loadLandmarks(); 
  }
}

window.editLandmark = async (id, currentName, currentType) => {
  const newName = prompt("새로운 거점 이름을 입력하세요:", currentName);
  if (!newName) return;
  
  let defaultNum = '3';
  if (currentType === 'branch') defaultNum = '1';
  else if (currentType === 'important') defaultNum = '2';

  const typeInput = prompt("거점 분류를 번호로 선택하세요.\n\n[1] 지점 (빨간 별 ⭐)\n[2] 중요 거점 (오렌지 불꽃 🔥)\n[3] 자주가는 곳 (일반 건물 🏢)", defaultNum);
  if (!typeInput) return; // 취소시 중단

  let newType = 'frequent';
  if (typeInput.includes('1')) newType = 'branch';
  else if (typeInput.includes('2')) newType = 'important';

  const { error } = await supabase.from('tdt_landmarks').update({ name: newName, type: newType }).eq('id', id);
  if (error) alert("수정 실패 (RLS 권한 문제일 수 있습니다): " + error.message);
  else {
    alert(`거점 정보가 완벽하게 수정되었습니다! (${newName})`);
    map.closePopup();
    loadLandmarks(); 
  }
}

window.saveLandmark = async (lat, lon, type = 'frequent') => {
  let typeStr = type === 'branch' ? "지점(본사/지사)" : type === 'important' ? "중요 거점" : "자주가는 곳";
  const name = prompt(`이 위치를 [${typeStr}](으)로 등록합니다.\n표시될 이름을 입력하세요:`, "새로운 " + typeStr);
  if (!name) return;
  
  const { error } = await supabase.from('tdt_landmarks').insert([{ name, latitude: lat, longitude: lon, type }]);
  if (error) {
    alert(`저장 실패!\n(Supabase SQL Editor에서 tdt_landmarks 테이블에 'type' 컬럼을 추가했는지 확인해주세요)\n에러: ${error.message}`);
  } else {
    alert(`'${name}'이(가) [${typeStr}](으)로 지도에 영구 등록되었습니다!`);
    map.closePopup();
    loadLandmarks();
  }
}

// 브라우저 새로고침(F5) 시 마지막으로 보던 탭 유지 로직
window.addEventListener('DOMContentLoaded', () => {
  const savedView = localStorage.getItem('tdt_active_view');
  if (savedView) {
    const tabEl = document.querySelector(`.nav-item[data-target="${savedView}"]`);
    if (tabEl) tabEl.click();
  }

  const savedMapView = localStorage.getItem('tdt_active_map_view');
  if (savedMapView) {
    const mapTabEl = document.querySelector(`.map-left-item[data-map-view="${savedMapView}"]`);
    if (mapTabEl) mapTabEl.click();
  }
});
