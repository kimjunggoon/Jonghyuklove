// 휘문고등학교 역사 퀴즈 - 구글 시트 연동 서버 (Apps Script)
const SHEET = "결과", NQ = 12;

function doGet(e) {
  const t = HtmlService.createTemplateFromFile("index");
  t.page = e && e.parameter && e.parameter.page === "board" ? "board" : "";
  return t.evaluate().setTitle("휘문고등학교 역사 퀴즈")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(["시각", "닉네임", "점수"]); }
  return s;
}
function norm_(n) { return String(n || "").trim().replace(/\s+/g, " ").replace(/^[=+\-@]+/, "").slice(0, 12); }
function shuffle_(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function taken_(s, n) {
  const last = s.getLastRow(); if (last < 2) return false;
  const k = n.toLowerCase();
  return s.getRange(2, 2, last - 1, 1).getValues().some(r => String(r[0]).toLowerCase() === k);
}
function getQuiz(nick) {
  nick = norm_(nick);
  if (!nick) return { error: "닉네임을 1~12자로 입력해 주세요." };
  if (taken_(sheet_(), nick)) return { error: "이미 사용 중인 닉네임이에요. 다른 닉네임을 써 주세요." };
  const ids = shuffle_(QUESTIONS.map((_, i) => i)).slice(0, NQ);
  return { questions: ids.map(id => ({ id, q: QUESTIONS[id][0], o: shuffle_([QUESTIONS[id][1]].concat(QUESTIONS[id][2])) })) };
}
// 정답은 서버에만 있고, 채점도 서버에서 합니다.
function submitScore(nick, picks) {
  nick = norm_(nick);
  if (!nick) return { error: "닉네임이 올바르지 않아요." };
  if (!Array.isArray(picks) || picks.length !== NQ) return { error: "잘못된 제출이에요." };
  const seen = {}; let score = 0; const review = [];
  for (const p of picks) {
    const id = Number(p && p.id);
    if (!(id >= 0 && id < QUESTIONS.length) || seen[id]) return { error: "잘못된 제출이에요." };
    seen[id] = 1;
    const x = QUESTIONS[id], ok = p.answer === x[1];
    if (ok) score++;
    review.push({ q: x[0], picked: String(p.answer || ""), correct: x[1], ok: ok, e: x[3] });
  }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_();
    if (taken_(s, nick)) return { error: "이미 제출된 닉네임이에요." };
    s.appendRow([new Date(), nick, score]); SpreadsheetApp.flush();
    const v = s.getRange(2, 3, s.getLastRow() - 1, 1).getValues().map(r => Number(r[0]));
    const rank = 1 + v.filter(x => x > score).length;   // 동점자는 같은 석차
    const top = Math.max(1, Math.ceil(rank / v.length * 100)); // 상위 N%
    return { score, total: NQ, rank, count: v.length, top, review, board: board_(s, 10) };
  } finally { lock.releaseLock(); }
}
function board_(s, n) {
  const last = s.getLastRow(); if (last < 2) return { count: 0, rows: [] };
  const all = s.getRange(2, 1, last - 1, 3).getValues()
    .map(r => ({ t: new Date(r[0]).getTime(), nick: String(r[1]), score: Number(r[2]) }))
    .sort((a, b) => b.score - a.score || a.t - b.t);
  return { count: all.length, rows: all.slice(0, n).map(r => ({ rank: 1 + all.filter(x => x.score > r.score).length, nick: r.nick, score: r.score })) };
}
function getBoard(n) { return board_(sheet_(), Math.min(Number(n) || 10, 50)); }
// 행사 전 테스트 기록을 지울 때 편집기에서 직접 실행하세요.
function resetResults() { const s = sheet_(); if (s.getLastRow() > 1) s.deleteRows(2, s.getLastRow() - 1); }

const QUESTIONS=[
["휘문의 전신 '광성의숙'은 몇 년에 설립되었을까요?","1904년",["1894년","1919년","1925년","1945년"],"1904년 9월 민영휘가 자택에 광성의숙을 열었고, 1906년 5월 '휘문의숙'으로 정식 개교했습니다."],
["'휘문(徽文)'이라는 교명을 내렸다고 전해지는 인물은?","고종",["순종","흥선대원군","이완용","명성황후"],"고종이 하사했다고 전해집니다. 설립자 민영휘의 이름 끝 글자 '휘'와 같다는 점도 눈길을 끕니다."],
["설립자 민영휘가 1910년 한일병합 지지 공로로 일제에게 받은 것은?","자작 작위와 은사공채",["훈장과 토지","총독부 관직","일본 유학 장학금","일본 황실 저택"],"자작 작위와 은사공채 5만 원을 받았으며 친일인명사전에도 오른 인물입니다. 교내 동상은 청산 논란이 이어져 왔습니다."],
["민영휘의 본래 이름은?","민영준",["민영환","민영익","민영찬","민영소"],"본명은 민영준입니다. 여흥 민씨 척족으로 재물을 긁어모은 탐관오리로 평가받았고 조선 최대 갑부로 불렸습니다."],
["휘문이 대치동으로 옮기기 전 72년간 있었던 곳은?","종로구 원서동",["용산구 한남동","성북구 안암동","서대문구 신촌동","중구 정동"],"1906~1978년 원서동(현 현대 계동사옥 자리)에 있었고, 강북 명문고 강남 이전 정책에 따라 옮겼습니다."],
["광복 직후 여운형의 건국준비위원회가 첫 정치집회를 연 곳은?","휘문학교 교정",["서울역 광장","경성운동장","탑골공원","덕수궁 앞"],"원서동 휘문학교 교정에서 열렸습니다. 이 터는 갑신정변 때 경우궁·계동궁이 있던 곳이기도 합니다."],
["1910년 휘문의숙 제1회 졸업생은 몇 명이었을까요?","32명",["12명","65명","132명","320명"],"1910년 3월 제1회 졸업식에서 32명이 졸업했습니다."],
["휘문고 교가를 작사했고, 일제 말 학병 참여를 독려해 친일 논란이 있는 인물은?","최남선",["이광수","김소월","윤동주","정지용"],"2021년 서울시교육청이 친일 잔재 전수조사를 시작하며 교가와 동상 등이 사례로 거론되었습니다."],
["2018년 경찰이 밝힌 휘문고 사학비리의 핵심 혐의는?","교비 횡령",["입시 성적 조작","교과서 가격 담합","급식 납품 비리","시험지 유출"],"전 이사장·전 교장 등 8명이 총 55억 원가량의 교비를 횡령한 혐의로 검찰에 송치되었습니다(기소의견)."],
["위 사학비리 의혹의 단서가 된 것은?","서울시교육청 특별감사",["학생들의 시위","국회 청문회","언론 몰래카메라","교사 노조 고발"],"2018년 3월 시교육청 특별감사 자료와 경찰의 자체 첩보를 바탕으로 수사가 진행되었습니다."],
["휘문의 교훈은?","큰 사람이 되자",["참되자","정직·성실·근면","나라를 사랑하자","배우며 가르치며"],"교훈은 '큰 사람이 되자'입니다."],
["2021년 서울시교육청이 일선 학교에 시작하도록 한 조사는?","친일 잔재 전수조사",["학교폭력 전수조사","석면 실태조사","급식 위생 점검","학교 재정 공시 점검"],"교가·교표·시설·동상 등 일제 잔재 조사 및 청산 작업이었고, 휘문고의 민영휘 동상도 사례로 언급되었습니다."],
["2018년 사건에서 학교 운동장·강당·식당을 빌려준 대상은?","한 교회",["대형 학원","사설 체육관","방송국","대기업 연수원"],"2008년 2월부터 약 9년간 시설을 한 교회에 빌려주고 53억 원을 받아, 교비로 처리하지 않고 개인적으로 썼다는 혐의였습니다."],
["2018년 경찰이 밝힌, 전 이사장이 법인카드로 단란주점 등에서 쓴 금액은?","약 4,500만 원",["약 450만 원","약 1,500만 원","약 2억 3천만 원","약 7억 원"],"당시 명예이사장(모친)도 재단 법인카드로 호텔·음식점에서 약 2억 3천만 원을 쓴 것으로 알려졌습니다."],
["1906년 개교 당시 고등소학과와 중학과의 학생 수는 각각 몇 명이었을까요?","65명",["20명","30명","100명","150명"],"고등소학과 65명, 중학과 65명이었습니다."],
["휘문의숙 교사가 새로 지어진 원서동 터는 원래 어떤 관청 터였을까요?","관상감",["사헌부","성균관","규장각","홍문관"],"천문·지리를 맡던 관상감 터에 교사를 신축했습니다."],
["휘문고의 교목(校木)은?","느티나무",["은행나무","소나무","향나무","플라타너스"],"교목은 느티나무, 교화는 목련입니다."],
["휘문고의 교화(校花)는?","목련",["개나리","무궁화","장미","벚꽃"],"교화는 목련(Magnolia denudata)입니다."],
["권력을 잃은 민영휘를 상대로 1905~1910년 언론에 보도된 재산환수 소송은 약 몇 건일까요?","15건",["3건","7건","30건","100건"],"재산을 빼앗긴 사람들의 소송이 이어지자 민영휘는 친일로 급격히 돌아섰다는 평가가 있습니다."],
["2022년 세워진 '즈믄탑'에서 '즈믄'의 뜻은?","천(千)",["백(百)","만(萬)","하늘","새벽"],"교가의 '즈믄' 가사에서 따왔으며 휘문의숙의 통합·전진·번영을 기원하는 의미를 담았습니다."],
["2022년 4월 열린 휘문고 개교기념식은 몇 주년이었을까요?","116주년",["100주년","106주년","110주년","120주년"],"1906년 개교 기준으로 2022년이 116주년입니다."],
["휘문고의 현재 소재지(동)는?","대치동",["압구정동","도곡동","개포동","삼성동"],"1978년 1월 강남구 대치동으로 이전했습니다."]
,
["휘문고의 총 동아리 수는? (야구부 포함)","55개",["35개","42개","48개","63개"],"재학생이 제공한 정보로, 야구부를 포함해 총 55개입니다."],
["휘문고 동아리 '바이브코더스'의 조원 수는?","10명",["5명","8명","12명","15명"],"재학생이 제공한 정보로, 바이브코더스의 조원은 10명입니다."],
["휘문고에서 '확률과 통계'를 이수하는 학년은?","2학년",["1학년","3학년","1학년 2학기","3학년 1학기"],"재학생이 제공한 정보로, 확률과 통계는 2학년 때 이수합니다."],
["2026학년도 휘문고 2학년 수학여행의 1인당 총 경비는?","160만 원",["80만 원","100만 원","120만 원","200만 원"],"재학생이 제공한 정보로, 1인당 총 경비는 160만 원입니다."]
];
