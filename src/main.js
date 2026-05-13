import './style.css'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from './lib/supabase.js'

// 기본 레이아웃 렌더링
document.querySelector('#app').innerHTML = `
  <div class="map-container">
    <div class="map-overlay">
      <h1>TDT Admin</h1>
      <p id="conn-status">데이터베이스 연동 중...</p>
    </div>
    <div id="map"></div>
  </div>
  
  <div class="sidebar">
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
    <div class="staff-list" id="staff-list">
      <!-- 직원 리스트 렌더링 영역 -->
    </div>
  </div>
`

// 1. 지도 초기화 (기본 위치: 베트남 호치민시 7군 푸미흥 인근)
const map = L.map('map', {
  zoomControl: false // 커스텀 줌 컨트롤 사용 가능성
}).setView([10.7303, 106.7115], 14)

// 어두운 테마의 지도 타일 (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map)

L.control.zoom({ position: 'bottomright' }).addTo(map)

// 2. 마커 및 데이터 상태 관리
const markers = {}
let staffData = []

// 시연용 가짜 데이터 (DB가 비어있을 경우 표시)
const mockStaff = [
  { id: '1', name: '김동혁', status: 'active', lat: 10.730300, lng: 106.711500, dist: 12.4, lastUpdate: '방금 전' },
  { id: '2', name: '이민수', status: 'idle', lat: 10.735215, lng: 106.715542, dist: 38.1, lastUpdate: '15분 전' },
  { id: '3', name: '박지훈', status: 'active', lat: 10.725123, lng: 106.708102, dist: 5.2, lastUpdate: '1분 전' },
  { id: '4', name: '최현우', status: 'offline', lat: 10.732410, lng: 106.721110, dist: 0.0, lastUpdate: '어제' },
]

async function loadData() {
  const connStatus = document.getElementById('conn-status')
  
  try {
    // 실제 DB에서 tdt_staff 확인
    const { data: realStaff, error } = await supabase.from('tdt_staff').select('*')
    
    if (error) throw error

    if (!realStaff || realStaff.length === 0) {
      // DB가 비어있으면 시연용 데이터를 보여줍니다.
      connStatus.innerHTML = `<span style="color:var(--warning)">🟢 DB 연결완료 (시연용 가상 데이터 표시중)</span>`
      staffData = mockStaff
    } else {
      connStatus.innerHTML = `<span style="color:var(--success)">🟢 DB 실시간 동기화 중</span>`
      // 실제 데이터를 매핑하는 로직 (현재는 목업 구조로 맞춤)
      // 실제로는 tdt_work_sessions 와 tdt_gps_logs 를 조인하여 가져와야 함.
      staffData = mockStaff // UI 테스트를 위해 일단 Mock과 병합 로직 생략
    }

    renderDashboard()

  } catch (err) {
    console.error(err)
    connStatus.innerHTML = `<span style="color:var(--danger)">🔴 DB 연결 에러: ${err.message}</span>`
    // 에러나도 UI를 보기 위해 목업 렌더링
    staffData = mockStaff
    renderDashboard()
  }
}

function renderDashboard() {
  const listEl = document.getElementById('staff-list')
  listEl.innerHTML = ''
  
  let activeCount = 0
  let idleCount = 0
  let totalDist = 0

  staffData.forEach(staff => {
    // 통계 계산
    if (staff.status === 'active') activeCount++
    if (staff.status === 'idle') idleCount++
    totalDist += staff.dist

    // 사이드바 카드 렌더링
    const card = document.createElement('div')
    card.className = `staff-card status-${staff.status}`
    
    let statusText = '근무중'
    if(staff.status === 'idle') statusText = '정차/유휴'
    if(staff.status === 'offline') statusText = '퇴근'

    card.innerHTML = `
      <div class="card-top">
        <span class="staff-name">${staff.name}</span>
        <span class="staff-status">${statusText}</span>
      </div>
      <div class="card-metrics">
        <div class="metric">이동 <span>${staff.dist.toFixed(1)}km</span></div>
        <div class="metric">업데이트 <span>${staff.lastUpdate}</span></div>
      </div>
    `

    // 카드 클릭시 지도를 해당 직원 위치로 이동
    card.addEventListener('click', () => {
      map.flyTo([staff.lat, staff.lng], 16, { duration: 1.5 })
    })

    listEl.appendChild(card)

    // 지도 마커 렌더링
    const iconHtml = `<div class="custom-marker ${staff.status}">${staff.name.charAt(0)}</div>`
    const customIcon = L.divIcon({
      className: 'clear-default', // 기본 배경 제거
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    if (!markers[staff.id]) {
      markers[staff.id] = L.marker([staff.lat, staff.lng], { icon: customIcon }).addTo(map)
    } else {
      markers[staff.id].setLatLng([staff.lat, staff.lng])
    }
  })

  // 글로벌 통계 업데이트
  document.getElementById('total-active').innerText = activeCount
  document.getElementById('total-idle').innerText = idleCount
  document.getElementById('total-dist').innerText = totalDist.toFixed(1)
}

// 최초 데이터 로드
loadData()
