const firebaseConfig = {
  apiKey: "AIzaSyBzB_TlwmNhgaNZiMZjaTpLLHHsA0x7nUg",
  authDomain: "hobrosstudyplanner.firebaseapp.com",
  projectId: "hobrosstudyplanner",
  storageBucket: "hobrosstudyplanner.firebasestorage.app",
  messagingSenderId: "747595635594",
  appId: "1:747595635594:web:9f05a2fac5985c6bd94673",
  measurementId: "G-7J2WEG807K"
};

let db = null;
let isCloudActive = false;

// Firebase 초기화
try {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("여기에")) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isCloudActive = true;
    const statusEl = document.getElementById('cloudStatus');
    if (statusEl) statusEl.textContent = "☁️ 클라우드 실시간 연동 중";
  } else {
    const statusEl = document.getElementById('cloudStatus');
    if (statusEl) statusEl.textContent = "💾 로컬 모드 (키 미입력)";
  }
} catch (e) {
  console.warn("Firebase 연동 오류. 로컬 저장소로 자동 전환합니다.", e);
  const statusEl = document.getElementById('cloudStatus');
  if (statusEl) statusEl.textContent = "⚠️ 로컬 모드";
}

const DAY_NAMES = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const DAY_SHORT = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_EMOJIS_HOCHAN = ["🚀", "💡", "🌈", "⚡", "🍭", "🏖️", "🎈"];
const DAY_EMOJIS_HOJUN  = ["🍀", "🎯", "🎨", "⚽", "🍦", "⛺", "🔮"];
const MISSION_COUNT = 5;
const ADMIN_PASSWORD = "0209";

function createInitialMissions() {
  return {
    0: [
      { text: "수학: 원리셈", checked: false },
      { text: "독서논술", checked: false },
      { text: "책읽기", checked: false },
      { text: "영어숙제", checked: false },
      { text: "영어숙제", checked: false }
    ],
    1: [
      { text: "소마셈", checked: false },
      { text: "독서논술", checked: false },
      { text: "책읽기", checked: false },
      { text: "단어시험", checked: false },
      { text: "단어시험", checked: false }
    ],
    2: [
      { text: "원리셈", checked: false },
      { text: "독서논술", checked: false },
      { text: "책읽기", checked: false },
      { text: "영어숙제", checked: false },
      { text: "영어숙제", checked: false }
    ],
    3: [
      { text: "소마셈", checked: false },
      { text: "독서논술", checked: false },
      { text: "책읽기", checked: false },
      { text: "단어시험", checked: false },
      { text: "단어시험", checked: false }
    ],
    4: [
      { text: "원리셈", checked: false },
      { text: "독서논술", checked: false },
      { text: "책읽기", checked: false },
      { text: "영어숙제", checked: false },
      { text: "영어숙제", checked: false }
    ],
    5: [
      { text: "팩토: 원, 자", checked: false },
      { text: "", checked: false },
      { text: "", checked: false },
      { text: "", checked: false },
      { text: "", checked: false }
    ],
    6: [
      { text: "영어단어시험", checked: false },
      { text: "", checked: false },
      { text: "", checked: false },
      { text: "", checked: false },
      { text: "", checked: false }
    ]
  };
}

const ENGLISH_HOCHAN = [
  { day: "월요일", en: "Piece of cake!", pron: "[ 피스 오브 케이크! ]", ko: "식은 죽 먹기야! (완전 쉬워!) 🍰", exEn: "Today's missions? It's a piece of cake!", exKo: "오늘 미션? 완전 식은 죽 먹기지!" },
  { day: "화요일", en: "Break a leg!", pron: "[ 브레이크 어 레그! ]", ko: "행운을 빌어! (파이팅!) 🍀", exEn: "You have a test today? Break a leg!", exKo: "오늘 시험 봐? 파이팅, 행운을 빌어!" },
  { day: "수요일", en: "Raining cats and dogs!", pron: "[ 레이닝 캣츠 앤 독스! ]", ko: "비가 억수같이 쏟아져! 🐶🐱", exEn: "Look outside! It's raining cats and dogs!", exKo: "밖을 봐! 비가 엄청나게 쏟아져!" },
  { day: "목요일", en: "I'm all ears!", pron: "[ 아임 올 이어즈! ]", ko: "귀 기울여 들을 준비 완료! (집중!) 👂", exEn: "Tell me your fun story! I'm all ears!", exKo: "재미있는 이야기 들려줘! 귀 쫑긋 듣고 있어!" },
  { day: "금요일", en: "Under the weather", pron: "[ 언더 더 웨더 ]", ko: "몸이 찌뿌둥해 / 컨디션이 별로야 🤒", exEn: "I feel a bit under the weather today.", exKo: "나 오늘 몸이 조금 찌뿌둥하고 안 좋아." },
  { day: "토요일", en: "Catch some Z's!", pron: "[ 캐치 썸 지즈! ]", ko: "쿨쿨 꿀잠 자러 가자! 😴💤", exEn: "It's weekend! Time to catch some Z's!", exKo: "주말이다! 이제 푹 꿀잠 잘 시간!" },
  { day: "일요일", en: "You nailed it!", pron: "[ 유 네일드 잇! ]", ko: "완벽하게 해냈어! (짱이야!) 🔨⭐", exEn: "All weekly habits done! You nailed it!", exKo: "일주일 습관 모두 완수! 완벽하게 해냈어!" }
];

const ENGLISH_HOJUN = [
  { day: "월요일", en: "Hit the books!", pron: "[ 힛 더 북스! ]", ko: "열심히 공부하러 가자! (책 펴자!) 📚", exEn: "Time to hit the books and finish homework!", exKo: "이제 책 펴고 숙제 열심히 끝낼 시간이야!" },
  { day: "화요일", en: "Over the moon!", pron: "[ 오버 더 문! ]", ko: "세상을 다 가진 듯 너무 행복해! 🌙✨", exEn: "I finished all tasks, I'm over the moon!", exKo: "미션을 다 끝냈더니 기분이 날아갈 것 같아!" },
  { day: "수요일", en: "Spill the beans!", pron: "[ 스필 더 빈즈! ]", ko: "비밀을 털어놔 봐! (말해줘!) 🫘", exEn: "Come on, spill the beans! What's the plan?", exKo: "어서 털어놔 봐! 무슨 계획이 있어?" },
  { day: "목요일", en: "Cost an arm and a leg", pron: "[ 코스트 언 암 앤 어 레그 ]", ko: "너무너무 비싸다! 💰😲", exEn: "That super cool robot costs an arm and a leg!", exKo: "저 멋진 로봇 장난감은 너무너무 비싸!" },
  { day: "금요일", en: "Once in a blue moon", pron: "[ 원스 인 어 블루 문 ]", ko: "아주아주 드물게 (어쩌다 한번) 🌕", exEn: "I eat sweet cotton candy once in a blue moon.", exKo: "달콤한 솜사탕은 어쩌다 한번 먹어." },
  { day: "토요일", en: "Keep your chin up!", pron: "[ 킵 유어 친 업! ]", ko: "고개 들고 힘내! (풀죽지 마!) 🦁💪", exEn: "Don't be sad! Keep your chin up!", exKo: "슬퍼하지 마! 당당하게 고개 들고 힘내!" },
  { day: "일요일", en: "Top of the world!", pron: "[ 탑 오브 더 월드! ]", ko: "세상에서 최고로 기분 좋아! 🌍👑", exEn: "I feel on top of the world today!", exKo: "오늘 세상에서 최고로 기분이 좋아!" }
];

const PROFILES = {
  hochan: {
    name: "윤호찬",
    storageKey: "yoon_hochan_mission_v4_custom_default",
    lockKey: "yoon_hochan_is_locked",
    isLocked: true,
    activeDayIndex: 0,
    emojis: DAY_EMOJIS_HOCHAN,
    themeClass: "active-hochan",
    numClass: "num-hochan",
    englishList: ENGLISH_HOCHAN,
    cachedData: null
  },
  hojun: {
    name: "윤호준",
    storageKey: "yoon_hojun_mission_v4_custom_default",
    lockKey: "yoon_hojun_is_locked",
    isLocked: true,
    activeDayIndex: 0,
    emojis: DAY_EMOJIS_HOJUN,
    themeClass: "active-hojun",
    numClass: "num-hojun",
    englishList: ENGLISH_HOJUN,
    cachedData: null
  }
};

let currentSpeakingText = "Piece of cake!";

function updateClock() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayIndex = now.getDay();
  const dayKor = ['일', '월', '화', '수', '목', '금', '토'][dayIndex];
  
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = `${year}년 ${month}월 ${date}일 (${dayKor})`;
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeEl = document.getElementById('currentTime');
  if (timeEl) {
    timeEl.textContent = `⏰ ${hours}:${minutes}:${seconds}`;
  }

  const isSunday = (dayIndex === 0);
  ['hochan', 'hojun'].forEach(user => {
    const resetArea = document.getElementById(`sundayResetArea-${user}`);
    if (resetArea) {
      resetArea.style.display = isSunday ? 'flex' : 'none';
    }
  });
}

function initLockState(user) {
  const savedState = localStorage.getItem(PROFILES[user].lockKey);
  PROFILES[user].isLocked = savedState !== null ? JSON.parse(savedState) : true;
  updateLockButtonUI(user);
}

function updateLockButtonUI(user) {
  const lockBtn = document.getElementById(`lockBtn-${user}`);
  if (!lockBtn) return;
  const isLocked = PROFILES[user].isLocked;
  if (isLocked) {
    lockBtn.innerHTML = "🔒";
    lockBtn.classList.add("is-locked");
    lockBtn.title = "현재 미션 잠김 (클릭 시 비밀번호 입력 후 해제)";
  } else {
    lockBtn.innerHTML = "🔓";
    lockBtn.classList.remove("is-locked");
    lockBtn.title = "현재 편집 가능 (클릭 시 다시 잠금)";
  }
}

function toggleMissionLock(user) {
  const profile = PROFILES[user];
  if (profile.isLocked) {
    const pwd = prompt(`[${profile.name}] 미션 수정을 위해 비밀번호 4자리를 입력해주세요:`);
    if (pwd === null) return;

    if (pwd === ADMIN_PASSWORD) {
      profile.isLocked = false;
      localStorage.setItem(profile.lockKey, JSON.stringify(false));
      updateLockButtonUI(user);
      renderMissions(user);
      alert(`[${profile.name}] 잠금이 해제되었습니다. 미션을 자유롭게 수정할 수 있습니다! ✍️`);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  } else {
    profile.isLocked = true;
    localStorage.setItem(profile.lockKey, JSON.stringify(true));
    updateLockButtonUI(user);
    renderMissions(user);
    alert(`[${profile.name}] 미션이 안전하게 잠겼습니다! 🔒`);
  }
}

// 체크박스 클릭 처리 (포인트 즉시 갱신 연동)
function toggleMissionCheck(child, dayIdx, missionIdx) {
  if (!window.missionData[child] || !window.missionData[child][dayIdx]) return;
  
  const mission = window.missionData[child][dayIdx][missionIdx];
  mission.done = !mission.done;

  // 1. 화면 체크리스트 다시 그리기
  renderMissions(child);
  
  // 2. 로컬 저장 및 Firebase 전송
  saveMissionsToLocal();
  syncMissionsToFirebase(child);

  // 3. 👉 [가장 중요] 포인트 계산 함수 즉시 강제 호출
  if (typeof window.calculateAutoScore === 'function') {
    window.calculateAutoScore(child);
  }
}

function getStoredData(user) {
  if (PROFILES[user].cachedData) {
    return PROFILES[user].cachedData;
  }
  const key = PROFILES[user].storageKey;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      PROFILES[user].cachedData = JSON.parse(data);
      return PROFILES[user].cachedData;
    } catch (e) {
      console.warn("로컬 데이터 파싱 오류", e);
    }
  }
  const initial = createInitialMissions();
  saveStoredData(user, initial, false);
  return initial;
}

function saveStoredData(user, data, syncCloud = true) {
  PROFILES[user].cachedData = data;
  localStorage.setItem(PROFILES[user].storageKey, JSON.stringify(data));

  if (syncCloud && isCloudActive && db) {
    db.collection("habits").doc(user).set({
      missions: JSON.stringify(data),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => {
      console.error("클라우드 저장 실패:", err);
    });
  }
}

function listenToCloudUpdates(user) {
  if (!isCloudActive || !db) return;

  db.collection("habits").doc(user).onSnapshot(doc => {
    if (doc.exists && doc.data().missions) {
      try {
        const cloudMissions = JSON.parse(doc.data().missions);
        PROFILES[user].cachedData = cloudMissions;
        localStorage.setItem(PROFILES[user].storageKey, JSON.stringify(cloudMissions));
        
        const activeElement = document.activeElement;
        const listEl = document.getElementById(`missionList-${user}`);
        const isTypingInside = activeElement && 
                               activeElement.classList.contains('mission-input') && 
                               listEl && listEl.contains(activeElement);
        
        if (!isTypingInside) {
          renderMissions(user);
        }
      } catch (e) {
        console.error("클라우드 파싱 에러:", e);
      }
    } else {
      const initial = getStoredData(user);
      saveStoredData(user, initial, true);
    }
  }, err => {
    console.error("클라우드 동기화 실패:", err);
  });
}

function switchDay(user, index) {
  PROFILES[user].activeDayIndex = index;
  
  const tabButtons = document.querySelectorAll(`#tabs-${user} .day-tab-btn`);
  tabButtons.forEach((tab, i) => {
    tab.classList.toggle(PROFILES[user].themeClass, i === index);
  });

  const titleEl = document.getElementById(`dayTitle-${user}`);
  if (titleEl) titleEl.textContent = `${DAY_NAMES[index]}의 미션`;

  const emojiEl = document.getElementById(`dayEmoji-${user}`);
  if (emojiEl) emojiEl.textContent = PROFILES[user].emojis[index];

  renderMissions(user);

  // 👉 일요일(인덱스 6) 탭일 때만 미션 하단 체크 초기화 버튼 표시
  const sundayResetArea = document.getElementById(`sundayCheckResetArea-${user}`);
  if (sundayResetArea) {
    sundayResetArea.style.display = (index === 6) ? 'block' : 'none';
  }
}

function getIncompleteWeekdayMissions(user) {
  const data = getStoredData(user);
  const incomplete = [];

  for (let day = 0; day < 5; day++) {
    const dayList = data[day] || [];
    dayList.forEach((item, itemIdx) => {
      if (item && item.text && item.text.trim() !== "" && !item.checked) {
        incomplete.push({
          originDay: day,
          itemIndex: itemIdx,
          text: item.text,
          checked: item.checked
        });
      }
    });
  }
  return incomplete;
}

function renderMissions(user) {
  const data = getStoredData(user);
  const profile = PROFILES[user];
  const activeIdx = profile.activeDayIndex;
  const currentList = data[activeIdx] || [];
  const listContainer = document.getElementById(`missionList-${user}`);
  if (!listContainer) return;
  listContainer.innerHTML = '';

  let checkedCount = 0;
  let totalTasks = 0;

  for (let i = 0; i < MISSION_COUNT; i++) {
    const itemData = currentList[i] || { text: '', checked: false };
    if (itemData.text && itemData.text.trim() !== "") {
      totalTasks++;
    }
    if (itemData.checked) checkedCount++;

    const itemDiv = document.createElement('div');
    itemDiv.className = `mission-item ${itemData.checked ? 'completed' : ''}`;

    const numDiv = document.createElement('div');
    numDiv.className = `mission-number ${profile.numClass}`;
    numDiv.textContent = i + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mission-input';
    input.value = itemData.text;
    input.placeholder = `미션 ${i + 1} (비워둘 수 있어요)`;
    
    if (profile.isLocked) {
      input.disabled = true;
    }

    input.oninput = (e) => handleTextChange(user, i, e.target.value, false);
    input.onblur = (e) => handleTextChange(user, i, e.target.value, true);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mission-checkbox';
    checkbox.checked = itemData.checked;
    checkbox.onchange = (e) => handleCheckChange(user, i, e.target.checked);

    itemDiv.appendChild(numDiv);
    itemDiv.appendChild(input);
    itemDiv.appendChild(checkbox);

    listContainer.appendChild(itemDiv);
  }
  
  // 👉 [추가] 일요일(인덱스 6)일 경우, 기본 5가지 미션 바로 밑 & 보충 미션 바로 위에 초기화 버튼 삽입
  if (activeIdx === 6) {
    const sundayResetWrap = document.createElement('div');
    sundayResetWrap.className = 'sunday-reset-wrapper';
    sundayResetWrap.innerHTML = `
      <button class="btn-sunday-check-reset" onclick="handleSecureReset('${user}')">
        🔄 일주일 체크 초기화 (포인트 유지)
      </button>
    `;
    listContainer.appendChild(sundayResetWrap);
  }
  
  // 주말(토, 일) 보충 미션 렌더링 영역
  if (activeIdx === 5 || activeIdx === 6) {
    const incompleteMissions = getIncompleteWeekdayMissions(user);

    if (incompleteMissions.length > 0) {
      totalTasks += incompleteMissions.length;

      const divider = document.createElement('div');
      divider.className = 'section-divider';
      divider.innerHTML = `<span>🔥 평일에 놓친 보충 미션 (${incompleteMissions.length}개)</span>`;
      listContainer.appendChild(divider);

      incompleteMissions.forEach((incItem) => {
        if (incItem.checked) checkedCount++;

        const itemDiv = document.createElement('div');
        itemDiv.className = `mission-item carryover ${incItem.checked ? 'completed' : ''}`;

        const badge = document.createElement('div');
        badge.className = 'mission-number';
        badge.textContent = '!';

        const contentWrap = document.createElement('div');
        contentWrap.style.flex = "1";
        contentWrap.style.display = "flex";
        contentWrap.style.alignItems = "center";

        const tag = document.createElement('span');
        tag.className = 'carryover-tag';
        tag.textContent = `${DAY_SHORT[incItem.originDay]}요일`;

        const textSpan = document.createElement('span');
        textSpan.className = 'mission-input';
        textSpan.textContent = incItem.text;

        contentWrap.appendChild(tag);
        contentWrap.appendChild(textSpan);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mission-checkbox';
        checkbox.checked = incItem.checked;
        checkbox.onchange = (e) => {
          handleCarryoverCheckChange(user, incItem.originDay, incItem.itemIndex, e.target.checked);
        };

        itemDiv.appendChild(badge);
        itemDiv.appendChild(contentWrap);
        itemDiv.appendChild(checkbox);

        listContainer.appendChild(itemDiv);
      });
    }
  }

  updateProgress(user, checkedCount, totalTasks);
}

function handleTextChange(user, itemIndex, newText, syncCloud = false) {
  if (PROFILES[user].isLocked) return;

  const data = getStoredData(user);
  const activeIdx = PROFILES[user].activeDayIndex;
  if (!data[activeIdx]) data[activeIdx] = [];
  if (!data[activeIdx][itemIndex]) data[activeIdx][itemIndex] = { text: '', checked: false };
  
  data[activeIdx][itemIndex].text = newText;
  saveStoredData(user, data, syncCloud);
}

function handleCheckChange(user, itemIndex, isChecked) {
  const data = getStoredData(user);
  const activeIdx = PROFILES[user].activeDayIndex;
  if (!data[activeIdx]) data[activeIdx] = [];
  if (!data[activeIdx][itemIndex]) data[activeIdx][itemIndex] = { text: '', checked: false };

  data[activeIdx][itemIndex].checked = isChecked;
  saveStoredData(user, data, true);
  
  renderMissions(user);

  // 👉 포인트 자동 계산 호출 추가
  if (typeof window.calculateAutoScore === 'function') {
    window.calculateAutoScore(user);
  }

  const checkStatus = getCompletedCount(user);
  if (isChecked && checkStatus.total > 0 && checkStatus.count === checkStatus.total) {
    openRewardModal(user);
  }
}


function getCompletedCount(user) {
  const data = getStoredData(user);
  const activeIdx = PROFILES[user].activeDayIndex;
  const currentList = data[activeIdx] || [];
  let count = 0;
  let total = 0;

  for (let i = 0; i < MISSION_COUNT; i++) {
    if (currentList[i] && currentList[i].text && currentList[i].text.trim() !== "") {
      total++;
      if (currentList[i].checked) count++;
    }
  }

  if (activeIdx === 5 || activeIdx === 6) {
    const inc = getIncompleteWeekdayMissions(user);
    total += inc.length;
    inc.forEach(item => { if (item.checked) count++; });
  }

  return { count, total };
}

function handleCarryoverCheckChange(user, originDay, itemIndex, isChecked) {
  const data = getStoredData(user);
  if (data[originDay] && data[originDay][itemIndex]) {
    data[originDay][itemIndex].checked = isChecked;
    saveStoredData(user, data, true);
    renderMissions(user);

    // 👉 포인트 자동 계산 호출 추가
    if (typeof window.calculateAutoScore === 'function') {
      window.calculateAutoScore(user);
    }

    const checkStatus = getCompletedCount(user);
    if (isChecked && checkStatus.total > 0 && checkStatus.count === checkStatus.total) {
      openRewardModal(user);
    }
  }
}

function updateProgress(user, count, total) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  const fillEl = document.getElementById(`progressFill-${user}`);
  const textEl = document.getElementById(`progressText-${user}`);
  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `${count} / ${total} 완료!`;

  const stamp = document.getElementById(`stampMessage-${user}`);
  if (stamp) {
    if (count === total && total > 0) {
      stamp.classList.add('show');
    } else {
      stamp.classList.remove('show');
    }
  }
}

function manualSaveMissions(user) {
  const name = PROFILES[user].name;
  const data = getStoredData(user);
  saveStoredData(user, data, true);
  renderMissions(user);
  alert(`[${name}] 설정한 모든 미션이 클라우드와 기기에 안전하게 저장되었습니다! 💾☁️`);
}

function openRewardModal(user) {
  const activeIdx = PROFILES[user].activeDayIndex;
  const reward = PROFILES[user].englishList[activeIdx] || PROFILES[user].englishList[0];
  const name = PROFILES[user].name;

  document.getElementById('badgeModalDay').textContent = `🎯 ${name}의 ${DAY_NAMES[activeIdx]} 완료 특별 보상`;
  document.getElementById('engWord').textContent = reward.en;
  document.getElementById('engPron').textContent = reward.pron;
  document.getElementById('engMeaning').textContent = `"${reward.ko}"`;
  document.getElementById('engExamEn').textContent = `"${reward.exEn}"`;
  document.getElementById('engExamKo').textContent = `"${reward.exKo}"`;

  currentSpeakingText = reward.en;

  const modal = document.getElementById('rewardModal');
  if (modal) modal.style.display = 'flex';
}

function closeRewardModal() {
  const modal = document.getElementById('rewardModal');
  if (modal) modal.style.display = 'none';
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function speakEnglish() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSpeakingText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } else {
    alert("이 브라우저에서는 음성 발음 기능을 지원하지 않습니다.");
  }
}

const rewardModalEl = document.getElementById('rewardModal');
if (rewardModalEl) {
  rewardModalEl.addEventListener('click', (e) => {
    if (e.target.id === 'rewardModal') {
      closeRewardModal();
    }
  });
}

function handleSecureReset(user) {
  const name = PROFILES[user].name;
  const password = prompt(`[${name}] 체크리스트 초기화 비밀번호 4자리를 입력해주세요:`);
  if (password === null) return;

  if (password === ADMIN_PASSWORD) {
    executeCheckReset(user);
    alert(`[${name}]의 모든 체크 표시가 초기화되었습니다! 파이팅! 🚀`);
  } else {
    alert("비밀번호가 일치하지 않습니다.");
  }
}

function executeCheckReset(user) {
  const data = getStoredData(user);
  for (let day = 0; day < 7; day++) {
    if (data[day]) {
      data[day].forEach(mission => {
        mission.checked = false;
      });
    }
  }
  saveStoredData(user, data, true);
  renderMissions(user);

  // 👉 체크 초기화 시에는 포인트를 깎지 않고, 주간 요일 달성 기록만 리셋하여 다음 주에 새 점수를 얻을 수 있게 합니다.
  if (typeof window.resetWeeklyEarnedFlags === 'function') {
    window.resetWeeklyEarnedFlags(user);
  }
}

function resetAllWeeklyChecks(user) {
  const name = PROFILES[user].name;
  const confirmed = confirm(`[${name}] 작성해 둔 미션 내용은 그대로 유지돼요!\n월요일부터 일요일까지의 체크 표시만 0으로 비울까요?`);
  if (!confirmed) return;

  executeCheckReset(user);
  alert(`[${name}] 새로운 한 주를 멋지게 시작해봐요! 화이팅! 🚀`);
}

function initApp() {
  updateClock();
  setInterval(updateClock, 1000);

  const dayOfWeek = new Date().getDay();
  const mappedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  initLockState('hochan');
  initLockState('hojun');

  switchDay('hochan', mappedIndex);
  switchDay('hojun', mappedIndex);

  listenToCloudUpdates('hochan');
  listenToCloudUpdates('hojun');
}

// 문서 로드 완료 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
