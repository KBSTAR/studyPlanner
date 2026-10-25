/**
 * 호찬 & 호준 스터디 플래너 - 포인트 현황 및 포인트맵 팝업 확장 모듈
 */

// 1. 포인트 보드판 이미지 기반 쿠폰 지급 맵 (점수 : 쿠폰 지급 개수)
const COUPON_POINT_MAP = {
  1000: 1,
  2000: 2,
  3000: 3,
  4000: 2,
  6000: 3
};

const COUPON_STORAGE_KEY = "hobros_coupon_system_v1";

function createInitialCoupons() {
  return {
    hochan: { points: 0, rewards: { 1000: "", 2000: "", 3000: "", 4000: "", 6000: "" } },
    hojun: { points: 0, rewards: { 1000: "", 2000: "", 3000: "", 4000: "", 6000: "" } }
  };
}

function getCouponData() {
  const data = localStorage.getItem(COUPON_STORAGE_KEY);
  if (data) {
    try { return JSON.parse(data); } catch (e) { console.error(e); }
  }
  const initial = createInitialCoupons();
  saveCouponData(initial);
  return initial;
}

function saveCouponData(data) {
  localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(data));
  if (typeof isCloudActive !== 'undefined' && isCloudActive && typeof db !== 'undefined') {
    db.collection("habits_rewards").doc("all_user_rewards").set({
      data: JSON.stringify(data),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.error("보상 클라우드 저장 실패:", err));
  }
}

// 주간 미션 기반 실시간 점수 계산 (모두 완료 100점 / 일부 완료 50점)
function calculateLivePoints(user) {
  if (typeof getStoredData !== 'function') return 0;
  const data = getStoredData(user);
  let totalPoints = 0;

  for (let day = 0; day < 7; day++) {
    const currentList = data[day] || [];
    let totalTasks = 0;
    let checkedCount = 0;

    for (let i = 0; i < 5; i++) {
      if (currentList[i] && currentList[i].text && currentList[i].text.trim() !== "") {
        totalTasks++;
        if (currentList[i].checked) checkedCount++;
      }
    }

    if (totalTasks > 0) {
      if (checkedCount === totalTasks) {
        totalPoints += 100;
      } else if (checkedCount > 0) {
        totalPoints += 50;
      }
    }
  }
  return totalPoints;
}

/**
 * 2. 핵심 수정 부분: 요일 탭 아래, 미션 결과 헤더(0/5 완료) 위에 포인트 바 동적 삽입
 */
function injectPointStatusBar(user) {
  // 기준점이 될 부모 타겟팅 (0/5 완료 글자가 있는 대시보드 헤더 섹션)
  const missionHeader = document.querySelector(`#tabs-${user}`).nextElementSibling; 
  if (!missionHeader) return;

  // 중복 생성 방지
  let pointBar = document.getElementById(`pointStatusBar-${user}`);
  if (!pointBar) {
    pointBar = document.createElement('div');
    pointBar.id = `pointStatusBar-${user}`;
    // 요일 탭 버튼 바로 아래에 삽입
    missionHeader.parentNode.insertBefore(pointBar, missionHeader);
  }

  const livePoints = calculateLivePoints(user);
  const userName = user === 'hochan' ? '윤호찬' : '윤호준';
  const themeColor = user === 'hochan' ? '#ffd166' : '#a7f3d0';

  pointBar.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 2.5px solid #2b2d42; border-radius: 16px; padding: 10px 14px; margin-bottom: 12px; box-shadow: 3px 3px 0px #2b2d42;">
      <div style="font-family: 'Jua'; font-size: 16px; color: #1e293b;">
        🏆 현재 누적 스코어: <span style="color: #e11d48; font-size: 18px;">${livePoints} 점</span>
      </div>
      <button onclick="openPointMapModal('${user}', ${livePoints})" class="tool-btn" style="background: ${themeColor}; font-size: 12px; padding: 5px 10px; margin: 0;">
        🗺️ 포인트맵 보기
      </button>
    </div>
  `;
}

/**
 * 3. 포인트맵 모달 팝업 열기
 */
function openPointMapModal(user, currentPoints) {
  // 모달 엘리먼트가 없으면 본문에 동적 생성
  let modal = document.getElementById('pointMapModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pointMapModal';
    modal.className = 'english-modal'; // 기존 스냅샷 CSS 스타일 재활용
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100vw'; modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.zIndex = '10000';
    modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
    document.body.appendChild(modal);
  }

  const couponData = getCouponData();
  const userName = user === 'hochan' ? '윤호찬' : '윤호준';
  
  let mapRowsHtml = '';
  Object.keys(COUPON_POINT_MAP).forEach(scoreGoal => {
    const count = COUPON_POINT_MAP[scoreGoal];
    const isUnlocked = currentPoints >= parseInt(scoreGoal);
    const savedText = couponData[user].rewards[scoreGoal] || "비어 있음";

    mapRowsHtml += `
      <div style="display:flex; flex-direction:column; gap:4px; padding:10px; margin-bottom:8px; border-radius:14px; border:2.5px solid #2b2d42; background:${isUnlocked ? '#ecfdf5' : '#f8fafc'}; box-shadow:2px 2px 0px #2b2d42;">
        <div style="display:flex; justify-content:space-between; font-family:'Jua'; font-size:14px;">
          <span style="color:${isUnlocked ? '#059669' : '#64748b'}">${isUnlocked ? '✅ 달성 완료!' : '🔒 도전 중'} (${scoreGoal}점 점프)</span>
          <span style="background:#fed7aa; padding:1px 6px; border-radius:6px; font-size:12px; border:1.5px solid #2b2d42;">🎫 쿠폰 ${count}장</span>
        </div>
        <div style="text-align:left; font-size:14px; margin-top:4px;">
          <strong>나의 쿠폰:</strong> 
          <input type="text" class="modal-coupon-input" data-user="${user}" data-score="${scoreGoal}" value="${savedText === '비어 있음' ? '' : savedText}" placeholder="쿠폰 내용을 적어보세요! ✍️" style="width:75%; border:none; border-bottom:1.5px dashed #94a3b8; background:transparent; font-weight:bold; font-size:13px; outline:none; padding-left:4px;"/>
        </div>
      </div>
    `;
  });

  modal.innerHTML = `
    <div class="english-card" style="max-width: 440px; width:90%; background:#fff; padding:22px; border-radius:24px; border:4px solid #2b2d42; box-shadow: 7px 7px 0px #2b2d42; text-align:center;">
      <div class="badge-today-english">🗺️ ${userName}의 보물 포인트맵</div>
      <p style="font-size:13px; color:#475569; margin: -4px 0 14px 0;">점수를 모아 비밀 쿠폰 잠금을 해제하세요!</p>
      
      <div style="max-height:320px; overflow-y:auto; padding-right:4px; margin-bottom:14px;">
        ${mapRowsHtml}
      </div>

      <div style="display:flex; gap:8px;">
        <button onclick="saveModalCoupons('${user}')" class="btn-close-english" style="background:#06d6a0; flex:1; font-size:14px; padding:10px;">💾 보물 기록하기</button>
        <button onclick="closePointMapModal()" class="btn-close-english" style="background:#cbd5e1; flex:1; font-size:14px; padding:10px;">닫기</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

function closePointMapModal() {
  const modal = document.getElementById('pointMapModal');
  if (modal) modal.style.display = 'none';
}

// 팝업 안에서 수정한 쿠폰 문구를 로컬스토리지에 다이렉트 저장
function saveModalCoupons(user) {
  const couponData = getCouponData();
  const modal = document.getElementById('pointMapModal');
  if (!modal) return;

  const inputs = modal.querySelectorAll('.modal-coupon-input');
  inputs.forEach(input => {
    const score = input.getAttribute('data-score');
    couponData[user].rewards[score] = input.value;
  });

  saveCouponData(couponData);
  alert("입력한 보물 쿠폰이 안전하게 잠금 보관되었습니다! 🔑✨");
  closePointMapModal();
}

/**
 * 4. 메인 프로그램과의 생명주기 동기화 바인딩
 */
function updateAllPointSystems() {
  ['hochan', 'hojun'].forEach(user => {
    injectPointStatusBar(user);
  });
}

// 시스템 연동 초기화
function initPointMapSystem() {
  updateAllPointSystems();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPointMapSystem, 250);
  });
} else {
  setTimeout(initPointMapSystem, 250);
}

// 기존 스터디플래너의 체크 이벤트가 가동될 때 게이지 및 스코어 실시간 리프레시 가로채기
const originalHandleCheckChange = window.handleCheckChange;
if (typeof originalHandleCheckChange === 'function') {
  window.handleCheckChange = function(user, itemIndex, isChecked) {
    originalHandleCheckChange(user, itemIndex, isChecked);
    updateAllPointSystems();
  };
}

const originalHandleCarryoverCheckChange = window.handleCarryoverCheckChange;
if (typeof originalHandleCarryoverCheckChange === 'function') {
  window.handleCarryoverCheckChange = function(user, originDay, itemIndex, isChecked) {
    originalHandleCarryoverCheckChange(user, originDay, itemIndex, isChecked);
    updateAllPointSystems();
  };
}
