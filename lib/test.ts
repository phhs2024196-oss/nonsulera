// 논술 유형 검사: 4개 축 × 2 = 16유형. 문항은 5점 척도(1 전혀 아니다 ~ 5 매우 그렇다).

export type Pole = "V" | "S" | "B" | "E" | "Q" | "D" | "A" | "H";
export type AxisKey = "think" | "write" | "tempo" | "plan";

export const axes: { key: AxisKey; name: string; poles: [Pole, Pole]; tie: Pole }[] = [
  { key: "think", name: "생각하는 방식", poles: ["V", "S"], tie: "S" },
  { key: "write", name: "답안 쓰는 방식", poles: ["B", "E"], tie: "E" },
  { key: "tempo", name: "푸는 속도", poles: ["Q", "D"], tie: "D" },
  { key: "plan", name: "입시 전략", poles: ["A", "H"], tie: "H" },
];

export const questions: { id: number; text: string; pole: Pole }[] = [
  { id: 1, pole: "V", text: "문제를 읽으면 그래프나 그림부터 그려 본다." },
  { id: 2, pole: "B", text: "풀이를 쓸 때 핵심 식만 적고 넘어가는 편이다." },
  { id: 3, pole: "Q", text: "수능 수학을 풀면 시간이 조금이라도 남는 편이다." },
  { id: 4, pole: "A", text: "내 내신은 가고 싶은 대학에 비해 부족한 편이다." },
  { id: 5, pole: "S", text: "식을 세우고 정리하다 보면 길이 보인다." },
  { id: 6, pole: "E", text: "친구에게 풀이를 설명해 주는 게 즐겁다." },
  { id: 7, pole: "D", text: "한 문제를 30분 넘게 붙잡고 있어도 지겹지 않다." },
  { id: 8, pole: "H", text: "논술 때문에 수능 공부 시간을 줄이고 싶지는 않다." },
  { id: 9, pole: "V", text: "답이 왜 그렇게 나오는지 감으로 먼저 알 때가 많다." },
  { id: 10, pole: "B", text: "서술형 시험에서 '과정 부족'으로 감점된 적이 있다." },
  { id: 11, pole: "Q", text: "막히면 오래 고민하기보다 빨리 다음 문제로 넘어간다." },
  { id: 12, pole: "A", text: "수시 원서 6장 중 절반 이상을 논술로 쓸 생각이다." },
  { id: 13, pole: "S", text: "경우를 빠짐없이 나누어 따지는 문제가 편하다." },
  { id: 14, pole: "E", text: "답안에 '왜냐하면', '따라서' 같은 말을 자주 쓴다." },
  { id: 15, pole: "D", text: "'시간만 더 있으면 풀 텐데'라는 말을 자주 한다." },
  { id: 16, pole: "H", text: "정시도 충분히 노려볼 만하다고 생각한다." },
  { id: 17, pole: "V", text: "도형·좌표 문제가 긴 계산 문제보다 재밌다." },
  { id: 18, pole: "B", text: "글로 쓰는 것보다 머릿속으로 푸는 게 훨씬 빠르다." },
  { id: 19, pole: "Q", text: "짧은 문제 여러 개가 긴 문제 하나보다 낫다." },
  { id: 20, pole: "A", text: "논술 공부에 매일 1시간 이상을 쓸 수 있다." },
  { id: 21, pole: "S", text: "풀이를 한 줄씩 논리로 쌓아야 마음이 놓인다." },
  { id: 22, pole: "E", text: "내 풀이 노트는 다른 사람이 읽어도 이해할 수 있을 것 같다." },
  { id: 23, pole: "D", text: "어려운 문제를 끝내 풀어냈을 때 가장 기쁘다." },
  { id: 24, pole: "H", text: "학교 내신 시험이 아직 많이 남아 있다." },
];

export const scale = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"];

/** answers: 문항 id → 1~5. 반환: 유형 코드와 축별 첫 번째 극 비율(0~100) */
export function score(answers: Record<number, number>) {
  let code = "";
  const pct: Record<AxisKey, number> = { think: 50, write: 50, tempo: 50, plan: 50 };
  for (const ax of axes) {
    const [p1, p2] = ax.poles;
    let s1 = 0, s2 = 0;
    for (const q of questions) {
      const v = (answers[q.id] ?? 3) - 1; // 0~4
      if (q.pole === p1) s1 += v;
      if (q.pole === p2) s2 += v;
    }
    pct[ax.key] = s1 + s2 === 0 ? 50 : Math.round((s1 / (s1 + s2)) * 100);
    code += s1 > s2 ? p1 : s2 > s1 ? p2 : ax.tie;
  }
  return { code, pct };
}

export const poleInfo: Record<Pole, { label: string; strength: string; risk: string; tip: string; fit: string; book: { title: string; kind: string } }> = {
  V: {
    label: "직관형",
    strength: "그림과 그래프로 문제의 구조를 빨리 봐요. 기하나 그래프 해석 문항에서 길을 남보다 먼저 찾아요.",
    risk: "보이는 걸 당연하게 여겨 '왜 그런지'를 빼먹기 쉬워요. 그림으로 본 사실은 식이나 문장으로 정당화해야 점수가 돼요.",
    tip: "그림으로 찾은 답을 '식 한 줄 + 이유 한 줄'로 옮기는 연습을 매일 하세요.",
    fit: "도형·그래프를 해석하는 문항이 많은 학교에서 강점이 살아나요.",
    book: { title: "환골탈태", kind: "논술 사고법·체질 개선" },
  },
  S: {
    label: "분석형",
    strength: "식을 세우고 경우를 나누며 논리를 차근차근 쌓아요. 증명과 경우 나누기 문항에서 실수가 적어요.",
    risk: "식으로만 밀고 가다 길을 잃기 쉬워요. 처음 보는 유형에서 시작점을 찾는 데 시간이 걸려요.",
    tip: "풀기 전에 30초 동안 그림이나 작은 예시로 방향을 먼저 잡는 습관을 들이세요.",
    fit: "경우 나누기·증명처럼 논리를 쌓는 문항이 많은 학교에서 강점이 살아나요.",
    book: { title: "유유상종", kind: "유형별 N제" },
  },
  B: {
    label: "간결형",
    strength: "핵심만 빠르게 짚어요. 답안이 깔끔하고 시간이 덜 들어요.",
    risk: "대학 채점은 단계마다 점수를 줘요. 머릿속에서 건너뛴 단계는 채점자에게 없는 단계라 감점돼요.",
    tip: "'조건 확인 → 핵심 식 → 이유 → 결론' 네 칸을 빠짐없이 채우는 답안 틀을 몸에 익히세요.",
    fit: "답만 쓰면 0점 처리하는 학교가 있어요. 어느 학교든 서술 보강이 가장 큰 점수 상승 요인이에요.",
    book: { title: "일필휘지", kind: "답안 작성법" },
  },
  E: {
    label: "서술형",
    strength: "풀이 과정을 말로 풀어내는 데 익숙해요. 채점자가 따라가기 쉬운 답안을 써요.",
    risk: "설명이 길어져 시간이 모자라거나, 정작 필요한 식과 결론이 묻힐 수 있어요.",
    tip: "답안 분량을 정해 두고(소문항당 몇 줄) 시간을 재며 쓰는 연습으로 군더더기를 덜어내세요.",
    fit: "과정 서술 비중이 큰 학교에서 강점이 그대로 점수가 돼요.",
    book: { title: "백전불태", kind: "실전 모의논술" },
  },
  Q: {
    label: "순발형",
    strength: "빠르게 판단하고 넘어가요. 문항 수가 많은 시험에서 시간 관리가 강해요.",
    risk: "깊게 파야 하는 마지막 소문항을 일찍 포기하기 쉬워요. 논술은 못 풀어도 맞게 쓴 단계까지 점수가 있어요.",
    tip: "막혀도 바로 넘기지 말고, 알아낸 사실을 한두 줄이라도 적고 넘어가세요. 그게 부분 점수예요.",
    fit: "문항 수가 많고 답이 짧은 약술형 학교와 잘 맞아요.",
    book: { title: "기생기사", kind: "기출 해설" },
  },
  D: {
    label: "지구형",
    strength: "어려운 문제를 오래 붙잡고 끝까지 따라가요. 논술이 가장 원하는 끈기예요.",
    risk: "한 문제에 빠져 뒤 문항을 못 보는 시간 배분 실수가 생기기 쉬워요.",
    tip: "소문항마다 시간 상한을 정하고, 넘기면 표시만 해 두고 다음으로 가는 연습을 하세요.",
    fit: "문항이 2개 안팎이고 한 문제에 45~60분을 주는 학교와 잘 맞아요.",
    book: { title: "절차탁마", kind: "양치기 N제" },
  },
  A: {
    label: "주력형",
    strength: "논술을 주력 카드로 쓸 수 있는 상황이에요. 꾸준히 시간을 쌓으면 복리처럼 늘어요.",
    risk: "논술에 기울다 수능 최저를 놓치면 답안은 채점조차 안 돼요.",
    tip: "기초 개념 → 수능 최저 → 논술 순서를 지키면서, 하루 한 문제라도 일찍 시작하세요.",
    fit: "목표 학교 기출로 학교 색깔을 일찍 익혀 두면 상향 지원 카드가 돼요.",
    book: { title: "속전속결", kind: "2주 완성" },
  },
  H: {
    label: "병행형",
    strength: "수능·내신과 함께 가는 상황이에요. 논술 공부가 수능 고난도 문항에도 그대로 쓰여요.",
    risk: "시간이 쪼개져 논술 연습이 띄엄띄엄 되기 쉬워요.",
    tip: "주 3회 한 문제씩, 수능 공부와 같은 개념을 쓰는 논술 문제로 묶어서 하세요.",
    fit: "수능 최저가 있는 학교는 최저를 맞추면 실제 경쟁자가 크게 줄어요. 최저를 맞출 수 있다면 기회예요.",
    book: { title: "일타쌍피", kind: "수능형 N제" },
  },
};

export const types: Record<string, { name: string; hanja: string; line: string }> = {
  VBQA: { name: "전광석화", hanja: "電光石火", line: "번개처럼 보고 바로 베는 직관파. 쓰는 힘만 붙이면 가장 빨리 큰다." },
  VBQH: { name: "촌철살인", hanja: "寸鐵殺人", line: "짧고 날카롭게 핵심을 찌른다. 짧은 시간에 효율을 뽑는 병행 전략가." },
  VBDA: { name: "화룡점정", hanja: "畫龍點睛", line: "큰 그림을 오래 그리는 사람. 마지막 한 점, 서술만 찍으면 완성된다." },
  VBDH: { name: "대기만성", hanja: "大器晩成", line: "깊이 보고 천천히 큰다. 꾸준히 쌓으면 시험 직전에 가장 무서워진다." },
  VEQA: { name: "청산유수", hanja: "靑山流水", line: "보이는 대로 막힘없이 말로 풀어낸다. 속도와 설명을 다 가진 공격수." },
  VEQH: { name: "일사천리", hanja: "一瀉千里", line: "한번 길이 보이면 끝까지 쏟아낸다. 수능과 논술을 같이 끌고 가는 타입." },
  VEDA: { name: "천의무봉", hanja: "天衣無縫", line: "보고, 오래 생각하고, 자연스럽게 설명한다. 다듬으면 흠 없는 답안이 나온다." },
  VEDH: { name: "일이관지", hanja: "一以貫之", line: "하나의 그림으로 여러 문제를 꿰뚫는다. 개념이 수능과 논술을 이어 준다." },
  SBQA: { name: "쾌도난마", hanja: "快刀亂麻", line: "복잡한 조건을 식으로 빠르게 정리한다. 서술만 보태면 실전형 해결사." },
  SBQH: { name: "단도직입", hanja: "單刀直入", line: "돌아가지 않고 식으로 바로 들어간다. 수능 감각이 논술의 무기가 된다." },
  SBDA: { name: "마부작침", hanja: "磨斧作針", line: "도끼를 갈아 바늘을 만드는 끈기. 쌓는 만큼 정직하게 오른다." },
  SBDH: { name: "수적천석", hanja: "水滴穿石", line: "물방울이 바위를 뚫듯 조금씩, 꾸준히. 병행형에게 가장 강한 무기." },
  SEQA: { name: "파죽지세", hanja: "破竹之勢", line: "논리로 쪼개고 말로 밀어붙인다. 논술에 가장 가까운 체질의 공격수." },
  SEQH: { name: "조리정연", hanja: "條理井然", line: "빠르고 질서 있게 정리한다. 채점자가 좋아하는 답안을 쓰는 타입." },
  SEDA: { name: "우공이산", hanja: "愚公移山", line: "산을 옮길 듯 깊게 판다. 어려운 문항일수록 빛나는 장기전 타입." },
  SEDH: { name: "심사숙고", hanja: "深思熟考", line: "깊이 생각하고 차분히 쓴다. 시간 배분만 잡으면 안정적인 고득점형." },
};

export const typeCodes = Object.keys(types);
