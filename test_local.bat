@echo off
chcp 65001 > nul
echo ==============================================
echo TDT Admin Dashboard (TETE Delivery Tracker)
echo 로컬 테스트 서버 구동 스크립트
echo 담당: 한지웅 책임
echo ==============================================
echo.
echo [1/2] 필수 모듈(npm packages)을 확인 및 설치합니다...
call npm install
echo.
echo [2/2] 서버를 실행합니다... (로컬 호스트 링크가 뜨면 클릭하세요)
echo.
call npm run dev
pause
