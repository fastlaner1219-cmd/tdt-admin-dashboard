import './style.css'
import { supabase } from './lib/supabase.js'

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="glass-card">
      <h1>TETE Delivery Tracker</h1>
      <h2>Admin Dashboard <span>Live Test</span></h2>
      
      <div class="status-box" id="status-box">
        <div class="loader" id="loader"></div>
        <p id="status-text">데이터베이스(Supabase) 접속 시도 중...</p>
      </div>
      <p id="details-text" class="details-text"></p>
    </div>
  </div>
`

async function testConnection() {
  const statusBox = document.getElementById('status-box')
  const statusText = document.getElementById('status-text')
  const detailsText = document.getElementById('details-text')
  const loader = document.getElementById('loader')
  
  try {
    const { data, error } = await supabase.from('tdt_staff').select('*').limit(1)
    
    loader.style.display = 'none'
    
    if (error) {
      statusBox.classList.add('error')
      statusText.innerHTML = `⚠️ 환경 변수 연결 오류`
      detailsText.innerHTML = `Supabase에서 거절했습니다.<br>Netlify 환경 변수(URL, ANON_KEY) 설정이 누락되었거나 오타가 있을 수 있습니다.<br><span style="color:#ff5555;font-size:0.8rem;">[에러코드: ${error.message}]</span>`
    } else {
      statusBox.classList.add('success')
      statusText.innerHTML = `✅ 실시간 DB 연결 성공!`
      detailsText.innerHTML = `넷플리파이 파이프라인과 Supabase 데이터베이스가 완벽하게 통신하고 있습니다.<br>이제 본격적인 개발을 진행할 수 있습니다.`
    }
  } catch (err) {
    loader.style.display = 'none'
    statusBox.classList.add('error')
    statusText.innerHTML = `❌ 시스템 에러`
    detailsText.innerHTML = `오류: ${err.message}`
  }
}

// 부드러운 애니메이션을 위해 약간의 딜레이 후 테스트 시작
setTimeout(testConnection, 800)
