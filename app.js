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
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("여기에")) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isCloudActive = true;
    document.getElementById('cloudStatus').textContent = "☁️ 클라우드 실시간 연동 중";
  } else {
    document.getElementById('cloudStatus').textContent = "💾 로컬 모드 (키 미입력)";
  }
} catch (e) {
  console.warn("Firebase 연동 오류. 로컬 저장소로 자동 전환합니다.", e);
  document.getElementById('cloudStatus').textContent = "⚠️ 로컬 모드";
}

const DAY_NAMES = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const DAY_SHORT = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_EMOJIS_HOCHAN = ["🚀", "💡", "🌈", "⚡", "🍭", "🏖️", "🎈"];
const DAY_EMOJIS_HOJUN  = ["🍀", "🎯", "🎨", "⚽", "🍦", "⛺", "🔮"];
const MISSION_COUNT = 5;

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
  
  document.getElementById('currentDate').textContent = `${year}년 ${month}월 ${date}일 (${dayKor})`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('currentTime').textContent = `⏰ ${hours}:${minutes}:${seconds}`;

  const isSunday = (dayIndex === 0);
  ['hochan', 'hojun'].forEach(user => {
    const resetArea = document.getElementById(`sundayResetArea-${user}`);
    resetArea.style.display = isSunday ? 'flex' : 'none';
  });
}

function getStoredData(user) {
  if (PROFILES[user].cachedData) {
    return PROFILES[user].cachedData;
  }
  const key = PROFILES[user].storageKey;
  const data = localStorage.getItem(key);
  if (data) {
    PROFILES[user].cachedData = JSON.parse(data);
    return PROFILES[user].cachedData;
  }
  const initial = createInitialMissions();
  saveStoredData(user, initial);
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
        const isTypingInside = activeElement && activeElement.classList.contains('mission-input') && 
                               document.getElementById(`missionList-${user}`).contains(activeElement);
        
        if (!isTypingInside) {
          renderMissions(user);
        }
      } catch (e) {
        console.error("클라우드 파싱 에러:", e);
      }
    } else {
      const initial = getStoredData(user);
      saveStoredData(user, initial);
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

  document.getElementById(`dayTitle-${user}`).textContent = `${DAY_NAMES[index]}의 미션`;
  document.getElementById(`dayEmoji-${user}`).textContent = PROFILES[user].emojis[index];

  renderMissions(user);
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
  const activeIdx = PROFILES[user].activeDayIndex;
  const currentList = data[activeIdx] || [];
  const listContainer = document.getElementById(`missionList-${user}`);
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
    numDiv.className = `mission-number ${PROFILES[user].numClass}`;
    numDiv.textContent = i + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mission-input';
    input.value = itemData.text;
    input.placeholder = `미션 ${i + 1} (비워둘 수 있어요)`;
    
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

    const checkStatus = getCompletedCount(user);
    if (isChecked && checkStatus.total > 0 && checkStatus.count === checkStatus.total) {
      openRewardModal(user);
    }
  }
}

function updateProgress(user, count, total) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  document.getElementById(`progressFill-${user}`).style.width = `${percent}%`;
  document.getElementById(`progressText-${user}`).textContent = `${count} / ${total} 완료!`;

  const stamp = document.getElementById(`stampMessage-${user}`);
  if (count === total && total > 0) {
    stamp.classList.add('show');
  } else {
    stamp.classList.remove('show');
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

  document.getElementById('rewardModal').style.display = 'flex';
}

function closeRewardModal() {
  document.getElementById('rewardModal').style.display = 'none';
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

document.getElementById('rewardModal').addEventListener('click', (e) => {
  if (e.target.id === 'rewardModal') {
    closeRewardModal();
  }
});

function handleSecureReset(user) {
  const name = PROFILES[user].name;
  const password = prompt(`[${name}] 체크리스트 초기화 비밀번호 4자리를 입력해주세요:`);
  if (password === null) return;

  if (password === "0209") {
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
}

function resetAllWeeklyChecks(user) {
  const name = PROFILES[user].name;
  const confirmed = confirm
