// ==========================================
// reward-system.js (게임/TV 쿠폰 최대 3개 발급 제한 적용 버전)
// ==========================================

const AVAILABLE_COUPONS = [
  { id: 'c1', type: 'action', titlePrefix: '', titleSuffix: '시까지 놀다 잘게요 🌙', placeholder: '시간 (예: 11)', hasInput: true },
  { id: 'c2', type: 'action', titlePrefix: '🍿 영화관에서 팝콘 사 주세요', hasInput: false },
  { id: 'c3', type: 'action', titlePrefix: '🍜 가족끼리 외식하고 싶어요', hasInput: false },
  { id: 'c4', type: 'action', titlePrefix: '👨 아빠랑 ', titleSuffix: ' 하고 싶어요!', placeholder: '활동 내용 (예: 놀이공원)', hasInput: true },
  { id: 'c5', type: 'action', titlePrefix: '🤫 오늘은 잔소리하지 마세요', hasInput: false },
  { id: 'c6', type: 'action', titlePrefix: '🍽️ 오늘 저녁 배달 메뉴는 내가 선택!', hasInput: false },  
  { id: 'c7', type: 'action', titlePrefix: '🎮 게임시간 40분 추가할게요', hasInput: false, maxCount: 3 },  // 👉 최대 3개 제한
  { id: 'c8', type: 'action', titlePrefix: '📺 평일에 TV 시청하게 해주세요', hasInput: false, maxCount: 3 },  // 👉 최대 3개 제한
  { id: 'c9', type: 'shopping', titlePrefix: '🛒 마트 자유 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c10', type: 'shopping', titlePrefix: '🏪 편의점 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c11', type: 'shopping', titlePrefix: '✏️ 문구점 쇼핑권 (', titleSuffix: '원)', placeholder: '금액', hasInput: true },
  { id: 'c12', type: 'shopping', titlePrefix: '📚 내 맘대로 책 한 권 (만화책 가능)', hasInput: false },
  { id: 'c13', type: 'shopping', titlePrefix: '🍗 내 맘대로 배달메뉴', hasInput: false }  
];

// 포인트맵 포켓몬 및 쿠폰 지급 수량 정의 (6800P 쿠폰 제외, 13500P까지)
const POKEMON_MAP = {
  250:   { name: '파이리',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  500:   { name: '꼬부기',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  750:   { name: '이상해씨',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  1000:  { name: '피카츄',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', coupon: '쿠폰 1장', count: 1 },
  1500:  { name: '푸린',       img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
  2000:  { name: '뮤',         img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', coupon: '쿠폰 2장', count: 2 },
  2500:  { name: '잠만보',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  3000:  { name: '루기아',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png', coupon: '쿠폰 3장', count: 3 },
  3500:  { name: '팬텀',       img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  4000:  { name: '칠색조',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png', coupon: '쿠폰 1장', count: 1 },
  4500:  { name: '괴력몬',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png' },
  5000:  { name: '레쿠쟈',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png', coupon: '쿠폰 1장', count: 1 },
  5500:  { name: '망나뇽',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png' },
  6000:  { name: '뮤츠',       img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', coupon: '쿠폰 3장', count: 3 },
  6800:  { name: '아르세우스', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png' },

  // 교재 사진 코스 (6,850P ~ 13,500P)
  7000:  { name: '디아루가',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/483.png', coupon: '쿠폰 1장', count: 1 },
  7500:  { name: '루카리오',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png' },
  8000:  { name: '펄기아',     img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/484.png', coupon: '쿠폰 1장', count: 1 },
  8500:  { name: '다크라이',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/491.png' },
  9000:  { name: '기라티나',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/487.png', coupon: '쿠폰 3장', count: 3 },
  9500:  { name: '조로아크',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/571.png' },
  10000: { name: '제크로무',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/644.png', coupon: '쿠폰 1장', count: 1 },
  10500: { name: '비크티니',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/494.png' },
  11000: { name: '레시라무',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/643.png', coupon: '쿠폰 2장', count: 2 },
  11500: { name: '개굴닌자',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png' },
  12000: { name: '원시그란돈', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/383.png', coupon: '쿠폰 5장', count: 5 },
  12500: { name: '지가르데',   img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/718.png' },
  13000: { name: '원시가이오가', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/382.png', coupon: '쿠폰 1장', count: 1 },
  13500: { name: '메가레쿠쟈', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10079.png', coupon: '최종 마스터 완주! 🏆', count: 5 }
};

let rewardData = {
  hochan: { cumulativePoint: 0, issuedCount: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] },
  hojun: { cumulativePoint: 0, issuedCount: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] }
};

let currentModalChild = 'hochan';
let currentMapChild = 'hochan';

// 맵 누적 점수 기반 획득 가능 총 쿠폰 매수 계산
function getEarnedCouponTotal(childKey) {
  const pts = rewardData[childKey]?.cumulativePoint || 0;
  let earned = 0;
  for (const [pStr, info] of Object.entries(POKEMON_MAP)) {
    const pointThreshold = parseInt(pStr, 10);
    if (pts >= pointThreshold && info.count) {
      earned += info.count;
    }
  }
  return earned;
}

// 잔여 발급 가능 쿠폰 매수
function getAvailableCouponSlots(childKey) {
  const earned = getEarnedCouponTotal(childKey);
  const issued = rewardData[childKey]?.issuedCount || 0;
  return Math.max(0, earned - issued);
}

// 특정 쿠폰(ID)의 총 발급 횟수 조회 함수
function getIssuedCountByCouponId(childKey, couponId) {
  const list = rewardData[childKey]?.coupons || [];
  return list.filter(c => c.couponId === couponId).length;
}

// 점수 자동 계산 함수 (체크 시 누적 포인트 반영)
function calculateAutoScore(childKey) {
  if (!rewardData[childKey]) {
    rewardData[childKey] = { cumulativePoint: 0, issuedCount: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] };
  }
  if (!rewardData[childKey].dayGrantedScores) {
    rewardData[childKey].dayGrantedScores = [0, 0, 0, 0, 0];
  }

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

  for (let day = 0; day < 5; day++) {
    const dayList = allMissions[day] || [];
    const validMissions = dayList.filter(item => item && item.text && item.text.trim() !== "");
    const totalCount = validMissions.length;

    if (totalCount === 0) continue;

    const doneCount = validMissions.filter(item => item.checked === true).length;

    let expectedScore = 0;
    if (doneCount === totalCount && totalCount > 0) {
      expectedScore = 100;
    } else if (doneCount > 0) {
      expectedScore = 50;
    }

    const alreadyGranted = rewardData[childKey].dayGrantedScores[day] || 0;
    const diff = expectedScore - alreadyGranted;

    if (diff !== 0) {
      rewardData[childKey].cumulativePoint = Math.max(0, (rewardData[childKey].cumulativePoint || 0) + diff);
      rewardData[childKey].dayGrantedScores[day] = expectedScore;
    }
  }

  updateRewardDashboard(childKey);

  const modalEl = document.getElementById('pointMapModal');
  if (modalEl && modalEl.style.display !== 'none' && typeof renderDirectMapBoard === 'function') {
    renderDirectMapBoard();
  }

  saveRewardToFirebase();
}

function resetWeeklyEarnedFlags(childKey) {
  if (rewardData[childKey]) {
    rewardData[childKey].dayGrantedScores = [0, 0, 0, 0, 0];
    saveRewardToFirebase();
    updateRewardDashboard(childKey);
  }
}

function updateRewardDashboard(childKey) {
  const pts = rewardData[childKey]?.cumulativePoint || 0;
  const coupons = rewardData[childKey]?.coupons || [];
  const unusedCoupons = coupons.filter(c => !c.used).length;
  const availableToIssue = getAvailableCouponSlots(childKey);

  const pEl = document.getElementById(`point-${childKey}`);
  if (pEl) pEl.textContent = Number(pts).toLocaleString();

  const cEl = document.getElementById(`couponCount-${childKey}`);
  if (cEl) {
    cEl.innerHTML = `${unusedCoupons}장 <span style="font-size:12px; color:#2563eb; font-weight:700;">(발급대기 ${availableToIssue}장)</span>`;
  }
}

function openSecurePointManager(childKey) {
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';
  const inputPw = prompt(`🔒 [${childName}의 포인트/쿠폰 관리자]\n비밀번호 4자리를 입력하세요:`);
  
  if (inputPw === null) return;
  if (inputPw.trim() !== '1024') {
    alert('❌ 비밀번호가 올바르지 않습니다.');
    return;
  }

  if (!rewardData[childKey]) {
    rewardData[childKey] = { cumulativePoint: 0, issuedCount: 0, coupons: [], dayGrantedScores: [0, 0, 0, 0, 0] };
  }

  const currentCum = rewardData[childKey].cumulativePoint || 0;
  const earned = getEarnedCouponTotal(childKey);
  const issued = rewardData[childKey].issuedCount || 0;

  const newPtStr = prompt(
    `✅ 관리자 인증 완료!\n\n` +
    `현재 [${childName}] 현황:\n` +
    `- 누적 포인트(맵 위치): ${currentCum.toLocaleString()} P\n` +
    `- 맵 달성 총 쿠폰: ${earned}장\n` +
    `- 이미 발급받은 쿠폰: ${issued}장\n` +
    `- 발급 대기 쿠폰: ${Math.max(0, earned - issued)}장\n\n` +
    `👉 새로 설정할 누적 포인트를 입력하세요:`,
    currentCum
  );

  if (newPtStr === null) return;

  const newPt = parseInt(newPtStr.trim(), 10);
  if (isNaN(newPt) || newPt < 0) {
    alert('올바른 숫자(0 이상)를 입력해 주세요.');
    return;
  }

  rewardData[childKey].cumulativePoint = newPt;
  updateRewardDashboard(childKey);

  const modalEl = document.getElementById('pointMapModal');
  if (modalEl && modalEl.style.display !== 'none' && typeof renderDirectMapBoard === 'function') {
    renderDirectMapBoard();
  }

  saveRewardToFirebase();
  alert(`✅ [${childName}]의 누적 포인트가 [ ${newPt.toLocaleString()} P ] 로 설정되었습니다! 🚀`);
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

  for (let p = 50; p <= 13500; p += 50) {
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

function openPointMap(childKey) {
  currentMapChild = childKey;
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';

  const titleEl = document.getElementById('mapModalTitle');
  if (titleEl) {
    titleEl.textContent = `⚡ [${childName}] 포켓몬 포인트 어드벤처 맵 (13,500P)`;
  }

  renderDirectMapBoard();
  const modalEl = document.getElementById('pointMapModal');
  if (modalEl) modalEl.style.display = 'flex';
}

function closePointMapModal() {
  const modalEl = document.getElementById('pointMapModal');
  if (modalEl) modalEl.style.display = 'none';
}
window.closePointMapModal = closePointMapModal;

function openCouponModal(childKey) {
  currentModalChild = childKey;
  const childName = childKey === 'hochan' ? '윤호찬' : '윤호준';
  document.getElementById('modalTargetChildTitle').textContent = `🎁 ${childName}의 쿠폰 발급/보관소`;
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
  if (tab === 'store') renderCouponStore();
  if (tab === 'mycoupons') renderMyCoupons();
}

// 쿠폰 발급소 렌더링 (발급 가능 횟수 및 최대 제한 검사)
function renderCouponStore() {
  const availableSlots = getAvailableCouponSlots(currentModalChild);
  const earnedTotal = getEarnedCouponTotal(currentModalChild);
  const issuedTotal = rewardData[currentModalChild]?.issuedCount || 0;

  const descEl = document.querySelector('#panel-store .panel-desc');
  if (descEl) {
    descEl.innerHTML = `
      <div style="font-size:14px; color:#333; line-height: 1.6;">
        포인트맵 달성 쿠폰: <strong>${earnedTotal}장</strong> | 기발급: <strong>${issuedTotal}장</strong><br>
        👉 지금 발급 가능한 쿠폰: <strong style="color:#d9381e; font-size:18px;">${availableSlots}장</strong>
      </div>
    `;
  }

  const createHtml = (c) => {
    // 발급 제한 여부 확인
    const issuedOfThis = getIssuedCountByCouponId(currentModalChild, c.id);
    const isExceededLimit = c.maxCount && issuedOfThis >= c.maxCount;
    const canIssue = availableSlots > 0 && !isExceededLimit;

    let buttonText = '쿠폰 1장으로 발급하기';
    if (isExceededLimit) {
      buttonText = `발급 완료 (${c.maxCount}/${c.maxCount}장)`;
    } else if (availableSlots <= 0) {
      buttonText = '발급 가능 수량 없음';
    } else if (c.maxCount) {
      buttonText = `쿠폰 1장으로 발급하기 (${issuedOfThis}/${c.maxCount})`;
    }

    return `
      <div class="coupon-card-item ${c.type === 'shopping' ? 'shopping' : ''}">
        <span class="coupon-tag">${c.type === 'shopping' ? '🛍️ 쇼핑' : '✨ 소원'}</span>
        ${c.maxCount ? `<span class="coupon-tag" style="background:#fee2e2; color:#b91c1c; border-color:#f87171; margin-left:4px;">최대 ${c.maxCount}개</span>` : ''}
        <div class="coupon-title-area">
          ${c.titlePrefix}
          ${c.hasInput ? `<input type="text" id="input-${c.id}" class="coupon-custom-input" placeholder="${c.placeholder}">` : ''}
          ${c.titleSuffix || ''}
        </div>
        <button class="btn-exchange" ${!canIssue ? 'disabled style="background:#bbb; cursor:not-allowed;"' : ''} onclick="exchangeCustomCoupon('${c.id}')">
          ${buttonText}
        </button>
      </div>
    `;
  };

  document.getElementById('actionCouponsList').innerHTML = AVAILABLE_COUPONS.filter(c => c.type === 'action').map(createHtml).join('');
  document.getElementById('shoppingCouponsList').innerHTML = AVAILABLE_COUPONS.filter(c => c.type === 'shopping').map(createHtml).join('');
}

// 쿠폰 발급 로직
function exchangeCustomCoupon(couponId) {
  const availableSlots = getAvailableCouponSlots(currentModalChild);
  if (availableSlots <= 0) {
    return alert('포인트맵에서 획득한 발급 가능 쿠폰이 없습니다!\n미션을 완료해 포인트맵의 포켓몬을 만나보세요! 🚀');
  }

  const coupon = AVAILABLE_COUPONS.find(c => c.id === couponId);
  if (!coupon) return;

  // 👉 발급 최대 수량 제한 확인
  if (coupon.maxCount) {
    const issuedOfThis = getIssuedCountByCouponId(currentModalChild, coupon.id);
    if (issuedOfThis >= coupon.maxCount) {
      return alert(`[${coupon.titlePrefix}] 쿠폰은 최대 ${coupon.maxCount}장까지만 발급할 수 있습니다! 🚫`);
    }
  }

  let title = coupon.titlePrefix;
  if (coupon.hasInput) {
    const val = document.getElementById(`input-${coupon.id}`)?.value.trim();
    if (!val) return alert('빈칸 내용을 입력해 주세요!');
    title = `${coupon.titlePrefix}${val}${coupon.titleSuffix || ''}`;
  }

  if (confirm(`[${title}] 쿠폰을 발급받을까요?\n(남은 발급 가능: ${availableSlots - 1}장)`)) {
    rewardData[currentModalChild].issuedCount = (rewardData[currentModalChild].issuedCount || 0) + 1;
    
    if (!rewardData[currentModalChild].coupons) rewardData[currentModalChild].coupons = [];
    rewardData[currentModalChild].coupons.push({
      id: Date.now(),
      couponId: coupon.id, // 식별용 원본 쿠폰 ID 저장
      title: title,
      type: coupon.type,
      used: false,
      issuedDate: new Date().toLocaleDateString('ko-KR')
    });

    saveRewardToFirebase();
    updateRewardDashboard(currentModalChild);
    alert('쿠폰이 성공적으로 발급되었습니다! 🎟️');
    switchCouponTab('mycoupons');
  }
}

// 보유 쿠폰함 렌더링
function renderMyCoupons() {
  const container = document.getElementById('myCouponListContainer');
  if (!container) return;
  const list = rewardData[currentModalChild]?.coupons || [];
  const activeList = list.filter(c => !c.used);

  if (activeList.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:30px; color:#888;">보유 중인 사용 가능한 쿠폰이 없습니다.</p>';
    return;
  }

  container.innerHTML = activeList.map((c) => `
    <div class="my-coupon-card">
      <div>
        <span class="coupon-tag">${c.type === 'shopping' ? '🛍️ 쇼핑' : '✨ 소원'}</span>
        <strong>${c.title}</strong>
        <div style="font-size:12px; color:#888; margin-top:4px;">발급일: ${c.issuedDate}</div>
      </div>
      <button class="btn-use-coupon" onclick="useMyCoupon(${c.id})">사용하기</button>
    </div>
  `).join('');
}

function useMyCoupon(couponId) {
  if (confirm('부모님 확인 후 사용 완료 처리하시겠습니까?')) {
    const target = (rewardData[currentModalChild]?.coupons || []).find(c => c.id === couponId);
    if (target) {
      target.used = true;
      target.usedDate = new Date().toLocaleDateString('ko-KR');
    }
    saveRewardToFirebase();
    updateRewardDashboard(currentModalChild);
    renderMyCoupons();
  }
}

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
