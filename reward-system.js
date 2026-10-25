// ==========================================
// reward-system.js (초기화 시 포인트 영구 보존 버전)
// ==========================================

const AVAILABLE_COUPONS = [
  { id: 'c1', type: 'action', titlePrefix: '', titleSuffix: '시까지 놀다 잘게요 🌙', placeholder: '시간 (예: 11)', hasInput: true },
  { id: 'c2', type: 'action', titlePrefix: '🍿 영화관에서 팝콘 사 주세요', hasInput: false },
  { id: 'c3', type: 'action', titlePrefix: '🍜 가족끼리 외식하고 싶어요', hasInput: false },
  { id: 'c4', type: 'action', titlePrefix: '👨 아빠랑 ', titleSuffix: ' 하고 싶어요!', placeholder: '활동 내용 (예: 놀이공원)', hasInput: true },
  { id: 'c5', type: 'action', titlePrefix: '🤫 오늘은 잔소리하지 마세요', hasInput: false },
  { id: 'c6', type: 'action', titlePrefix: '🍽️ 오늘 저녁 배달 메뉴는 내가 선택!', hasInput: false },
  { id: 'c7', type: 'action', titlePrefix: '🎉 친구들과 파자마 파티 하고 싶어요', hasInput: false },
  { id: 'c8', type: 'shopping', titlePrefix: '🛒 마트 자유 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c9', type: 'shopping', titlePrefix: '🏪 편의점 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c10', type: 'shopping', titlePrefix: '✏️ 문구점 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c11', type: 'shopping', titlePrefix: '📚 내 맘대로 책 한 권 (만화책 가능)', hasInput: false },
  { id: 'c12', type: 'shopping', titlePrefix: '🍦 내 맘대로 아이스크림 1개', hasInput: false },
  { id: 'c13', type: 'shopping', titlePrefix: '🍗 내 맘대로 치킨 1마리', hasInput: false },
  { id: 'c14', type: 'shopping', titlePrefix: '🍹 내 맘대로 음료 1잔', hasInput: false },
  { id: 'c15', type: 'shopping', titlePrefix: '🍔 햄버거 세트', hasInput: false },
  { id: 'c16', type: 'shopping', titlePrefix: '🍢 분식 세트', hasInput: false }
];

// 영구 보존용 보상 데이터
let rewardData = {
  hochan: { point: 0, cumulativePoint: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] },
  hojun: { point: 0, cumulativePoint: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] }
};

let currentModalChild = 'hochan';

// 1. [핵심] 체크 상태에 따라 차액만큼 지갑에 가감 (절대 기본 잔액을 0으로 덮어쓰지 않음)
function calculateAutoScore(childKey) {
  if (!rewardData[childKey]) {
    rewardData[childKey] = { point: 0, cumulativePoint: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] };
  }
  if (!rewardData[childKey].dayGrantedScores) {
    rewardData[childKey].dayGrantedScores = [0, 0, 0, 0, 0];
  }

  // app.js 데이터 로드
  let allMissions = null;
  if (typeof window.getStoredData === 'function') {
    allMissions = window.getStoredData(childKey);
  } else {
    const key = childKey === 'hochan' 
      ? 'yoon_hochan_mission_v4_custom_default' 
      : 'yoon_hojun_mission_v4_custom_default';
    try {
      allMissions = JSON.parse(localStorage.getItem(key) || '{}');
    } catch (e) {}
  }

  if (!allMissions) return;

  // 월(0) ~ 금(4) 점검
  for (let day = 0; day < 5; day++) {
    const dayList = allMissions[day] || [];
    const validMissions = dayList.filter(item => item && item.text && item.text.trim() !== "");
    const totalCount = validMissions.length;

    if (totalCount === 0) continue;

    const doneCount = validMissions.filter(item => item.checked === true).length;

    // 현재 체크 상태 기준 마땅히 받아야 할 점수
    let expectedScore = 0;
    if (doneCount === totalCount && totalCount > 0) {
      expectedScore = 100; // 전체 완료 시 100점
    } else if (doneCount > 0) {
      expectedScore = 50;  // 일부 완료 시 50점
    }

    // 이번 주에 해당 요일에 이미 지급받았던 점수
    const alreadyGranted = rewardData[childKey].dayGrantedScores[day] || 0;
    const diff = expectedScore - alreadyGranted;

    // 변경된 점수 차이만큼만 보유 포인트에 가산
    if (diff !== 0) {
      rewardData[childKey].point = Math.max(0, (rewardData[childKey].point || 0) + diff);
      
      // 누적 포인트는 점수가 오를 때만 증가
      if (diff > 0) {
        rewardData[childKey].cumulativePoint = (rewardData[childKey].cumulativePoint || 0) + diff;
      }
      
      rewardData[childKey].dayGrantedScores[day] = expectedScore;
    }
  }

  updateRewardDashboard(childKey);
  saveRewardToFirebase();
}

// 2. [가장 중요] 새로운 한 주 시작(체크 초기화) 시 호출되는 함수:
// 보유 포인트는 그대로 두고, 다음 주에 다시 100점씩 받을 수 있도록 요일 지급 기록만 0으로 비움!
function resetWeeklyEarnedFlags(childKey) {
  if (rewardData[childKey]) {
    rewardData[childKey].dayGrantedScores = [0, 0, 0, 0, 0];
    saveRewardToFirebase();
    updateRewardDashboard(childKey);
  }
}

// 3. UI 갱신 함수
function updateRewardDashboard(childKey) {
  const points = rewardData[childKey]?.point || 0;
  const couponCount = (rewardData[childKey]?.coupons || []).length;

  const pEl = document.getElementById(`point-${childKey}`);
  if (pEl) pEl.textContent = Number(points).toLocaleString();

  const cEl = document.getElementById(`couponCount-${childKey}`);
  if (cEl) cEl.textContent = couponCount;
}

// ==========================================
// 비밀번호(0209) 관리자 모드: 포인트 및 맵 위치 완벽 동기화
// ==========================================
function openSecurePointManager(childKey) {
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';
  const inputPw = prompt(`🔒 [${childName}의 포인트 관리자]\n비밀번호 4자리를 입력하세요:`);
  
  if (inputPw === null) return;
  if (inputPw.trim() !== '0209') {
    alert('❌ 비밀번호가 올바르지 않습니다.');
    return;
  }

  if (!rewardData[childKey]) {
    rewardData[childKey] = { point: 0, cumulativePoint: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] };
  }

  const currentPt = rewardData[childKey].point || 0;
  const currentCum = rewardData[childKey].cumulativePoint || 0;

  const newPtStr = prompt(
    `✅ 관리자 인증 완료!\n\n` +
    `현재 [${childName}]의 포인트 현황:\n` +
    `- 현재 보유 포인트: ${currentPt.toLocaleString()} P\n` +
    `- 포인트 맵 현재 위치 점수: ${currentCum.toLocaleString()} P\n\n` +
    `👉 새롭게 설정할 포인트를 숫자로 입력하세요:\n(입력한 점수 위치로 포인트 맵 말도 즉시 이동합니다)`,
    currentPt
  );

  if (newPtStr === null) return;

  const newPt = parseInt(newPtStr.trim(), 10);
  if (isNaN(newPt) || newPt < 0) {
    alert('올바른 숫자(0 이상)를 입력해 주세요.');
    return;
  }

  // 👉 보유 포인트와 포인트 맵 누적 위치 점수를 동일하게 강제 설정
  rewardData[childKey].point = newPt;
  rewardData[childKey].cumulativePoint = newPt;

  // 1. 메인 화면 배지 업데이트
  updateRewardDashboard(childKey);

  // 2. 만약 포인트 맵 팝업이 열려있다면 즉시 말 위치 다시 그리기
  const modalEl = document.getElementById('pointMapModal');
  if (modalEl && modalEl.style.display !== 'none' && typeof renderDirectMapBoard === 'function') {
    renderDirectMapBoard();
  }

  // 3. Firebase 및 로컬스토리지 저장
  saveRewardToFirebase();

  alert(`✅ [${childName}]의 보유 포인트와 포인트 맵 위치가 [ ${newPt.toLocaleString()} P ] 로 수정되었습니다! 🚀`);
}

// 5. Firebase 실시간 동기화
function initFirebaseRewardSync() {
  const firestore = (typeof db !== 'undefined') ? db : (window.firebase?.apps?.length ? firebase.firestore() : null);

  if (!firestore) {
    const saved = localStorage.getItem('family_reward_data');
    if (saved) {
      try { rewardData = JSON.parse(saved); } catch (e) {}
    }
    updateRewardDashboard('hochan');
    updateRewardDashboard('hojun');
    return;
  }

  firestore.collection('rewards').doc('brothers').onSnapshot((doc) => {
    if (doc.exists) {
      const remote = doc.data();
      if (remote.hochan) rewardData.hochan = remote.hochan;
      if (remote.hojun) rewardData.hojun = remote.hojun;
      updateRewardDashboard('hochan');
      updateRewardDashboard('hojun');
    }
  });
}

async function saveRewardToFirebase() {
  localStorage.setItem('family_reward_data', JSON.stringify(rewardData));
  const firestore = (typeof db !== 'undefined') ? db : (window.firebase?.apps?.length ? firebase.firestore() : null);
  if (firestore) {
    try {
      await firestore.collection('rewards').doc('brothers').set(rewardData, { merge: true });
    } catch (e) {}
  }
}


// ==========================================
// 포인트 맵 레이어 팝업 열기 / 닫기
// ==========================================
// ==========================================
// 포켓몬 맵 마스터 데이터 및 모달 직접 렌더링
// ==========================================
const POKEMON_MAP = {
  250:  { name: '파이리',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  500:  { name: '꼬부기',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  750:  { name: '이상해씨', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  1000: { name: '피카츄',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', coupon: '쿠폰 1장' },
  1500: { name: '푸린',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
  2000: { name: '뮤',       img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', coupon: '쿠폰 2장' },
  2500: { name: '잠만보',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  3000: { name: '루기아',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png', coupon: '쿠폰 3장' },
  3500: { name: '팬텀',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  4000: { name: '칠색조',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png', coupon: '쿠폰 1장' },
  4500: { name: '괴력몬',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png' },
  5000: { name: '레쿠쟈',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png', coupon: '쿠폰 1장' },
  5500: { name: '망나뇽',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png' },
  6000: { name: '뮤츠',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', coupon: '쿠폰 3장' },
  6800: { name: '아르세우스', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png', coupon: '최종 골인! 👑' }
};

let currentMapChild = 'hochan';

function openPointMap(childKey) {
  currentMapChild = childKey;
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';

  const titleEl = document.getElementById('mapModalTitle');
  if (titleEl) {
    titleEl.textContent = `⚡ [${childName}] 포켓몬 포인트 어드벤처 맵`;
  }

  // 보드판 타일 생성
  renderDirectMapBoard();

  // 👉 display를 flex로 설정하여 화면 정중앙 배치
  const modalEl = document.getElementById('pointMapModal');
  if (modalEl) {
    modalEl.style.display = 'flex';
  }
}

function closePointMapModal() {
  const modalEl = document.getElementById('pointMapModal');
  if (modalEl) {
    modalEl.style.display = 'none';
  }
}

function renderDirectMapBoard() {
  const container = document.getElementById('modalBoardTrack');
  const scoreEl = document.getElementById('mapCumulativeScore');
  if (!container) return;
  container.innerHTML = '';

  const pts = rewardData[currentMapChild]?.cumulativePoint || 0;
  if (scoreEl) scoreEl.textContent = pts.toLocaleString();

  const currentStep = Math.floor(pts / 50) * 50;

  const avatarImg = currentMapChild === 'hochan' 
    ? 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' 
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png';
  const avatarTag = currentMapChild === 'hochan' ? '호찬 피카츄' : '호준 이브이';

  for (let p = 50; p <= 6800; p += 50) {
    const tile = document.createElement('div');
    tile.className = 'tile';

    const poke = POKEMON_MAP[p];

    if (poke) {
      if (poke.coupon) {
        tile.classList.add('bonus');
        tile.innerHTML += `<span class="coupon-tag">🎟️${poke.coupon}</span>`;
      } else {
        tile.classList.add('milestone');
      }
      tile.innerHTML += `<img src="${poke.img}" class="tile-poke-img" alt="${poke.name}">`;
    }

    if (pts >= p) {
      tile.classList.add('passed');
    }

    if (currentStep === p || (pts < 50 && p === 50)) {
      tile.classList.add('current');
      tile.innerHTML = `
        <div class="player-marker">
          <img src="${avatarImg}" class="player-avatar" alt="플레이어">
          <span class="player-tag">${avatarTag}</span>
        </div>
      ` + tile.innerHTML;
    }

    tile.innerHTML += `<div class="tile-point">${p}P</div>`;
    container.appendChild(tile);
  }
}

// 전역 등록
window.openPointMap = openPointMap;
window.closePointMapModal = closePointMapModal;




function openCouponModal(childKey) {
  currentModalChild = childKey;
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';
  document.getElementById('modalTargetChildTitle').textContent = `🎁 ${childName}의 쿠폰 상점`;
  renderCouponStore();
  renderMyCoupons();
  switchCouponTab('store');
  document.getElementById('couponModal').style.display = 'flex';
}

function closeCouponModal() {
  document.getElementById('couponModal').style.display = 'none';
}

function switchCouponTab(tab) {
  document.getElementById('panel-store').style.display = tab === 'store' ? 'block' : 'none';
  document.getElementById('panel-mycoupons').style.display = tab === 'mycoupons' ? 'block' : 'none';
  document.getElementById('tabBtn-store').classList.toggle('active', tab === 'store');
  document.getElementById('tabBtn-mycoupons').classList.toggle('active', tab === 'mycoupons');
  if (tab === 'mycoupons') renderMyCoupons();
}

function renderCouponStore() {
  const createHtml = (c) => `
    <div class="coupon-card-item ${c.type === 'shopping' ? 'shopping' : ''}">
      <span class="coupon-tag">${c.type === 'shopping' ? '🛍️ 쇼핑' : '✨ 소원'}</span>
      <div class="coupon-title-area">
        ${c.titlePrefix}
        ${c.hasInput ? `<input type="text" id="input-${c.id}" class="coupon-custom-input" placeholder="${c.placeholder}">` : ''}
        ${c.titleSuffix || ''}
      </div>
      <button class="btn-exchange" onclick="exchangeCustomCoupon('${c.id}')">1,000P로 교환</button>
    </div>
  `;
  document.getElementById('actionCouponsList').innerHTML = AVAILABLE_COUPONS.filter(c => c.type === 'action').map(createHtml).join('');
  document.getElementById('shoppingCouponsList').innerHTML = AVAILABLE_COUPONS.filter(c => c.type === 'shopping').map(createHtml).join('');
}

function exchangeCustomCoupon(couponId) {
  const coupon = AVAILABLE_COUPONS.find(c => c.id === couponId);
  if (!coupon) return;

  let title = coupon.titlePrefix;
  if (coupon.hasInput) {
    const val = document.getElementById(`input-${coupon.id}`)?.value.trim();
    if (!val) return alert('빈칸 내용을 입력해 주세요!');
    title = `${coupon.titlePrefix}${val}${coupon.titleSuffix || ''}`;
  }

  const currentPoints = rewardData[currentModalChild]?.point || 0;
  if (currentPoints < 1000) {
    return alert(`포인트가 부족해요! (현재: ${currentPoints}P / 필요: 1,000P)`);
  }

  if (confirm(`1,000P로 [${title}] 쿠폰을 교환할까요?`)) {
    rewardData[currentModalChild].point -= 1000;
    
    if (!rewardData[currentModalChild].coupons) rewardData[currentModalChild].coupons = [];
    rewardData[currentModalChild].coupons.push({
      id: Date.now(),
      title: title,
      type: coupon.type,
      issuedDate: new Date().toLocaleDateString('ko-KR')
    });

    saveRewardToFirebase();
    updateRewardDashboard(currentModalChild);
    alert('쿠폰이 발급되었습니다!');
    switchCouponTab('mycoupons');
  }
}

function renderMyCoupons() {
  const container = document.getElementById('myCouponListContainer');
  if (!container) return;
  const list = rewardData[currentModalChild]?.coupons || [];
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:30px; color:#888;">보유한 쿠폰이 없습니다.</p>';
    return;
  }
  container.innerHTML = list.map((c, idx) => `
    <div class="my-coupon-card">
      <div>
        <span class="coupon-tag">${c.type === 'shopping' ? '🛍️ 쇼핑' : '✨ 소원'}</span>
        <strong>${c.title}</strong>
        <div style="font-size:12px; color:#888; margin-top:4px;">발급일: ${c.issuedDate}</div>
      </div>
      <button class="btn-use-coupon" onclick="useMyCoupon(${idx})">사용완료</button>
    </div>
  `).join('');
}

function useMyCoupon(index) {
  if (confirm('부모님 확인 후 사용 완료 처리하시겠습니까?')) {
    rewardData[currentModalChild].coupons.splice(index, 1);
    saveRewardToFirebase();
    updateRewardDashboard(currentModalChild);
    renderMyCoupons();
  }
}

// 전역 등록
window.calculateAutoScore = calculateAutoScore;
window.resetWeeklyEarnedFlags = resetWeeklyEarnedFlags;
window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.switchCouponTab = switchCouponTab;
window.exchangeCustomCoupon = exchangeCustomCoupon;
window.useMyCoupon = useMyCoupon;
window.openPointMap = openPointMap;
window.openSecurePointManager = openSecurePointManager;

window.addEventListener('load', () => {
  setTimeout(() => {
    initFirebaseRewardSync();
    calculateAutoScore('hochan');
    calculateAutoScore('hojun');
  }, 300);
});
