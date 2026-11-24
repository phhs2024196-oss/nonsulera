export const site = {
  name: "논술의 시대",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "수학적 사고력으로 풀고, 그 풀이를 논리적인 말로 바꾼다.",
  description:
    "수리논술만 다루는 논술의 시대. 대학이 공개한 자료와 숫자로 논술을 설명하고, 무료 총론 「지피지기」를 배포합니다.",
  instagram: "https://www.instagram.com/nonsulera",
  youtube: "https://www.youtube.com/channel/UC29K8QGvD7m5WKuFDuH51Cw",
};

export type Material = {
  slug: string;
  title: string;
  kind: string; // 이름 옆 괄호에 붙는 종류
  summary: string;
  file?: string; // public/ 기준 경로. 없으면 준비 중
  pages?: number;
  updated?: string;
  points?: string[];
};

export const materials: Material[] = [
  {
    slug: "jipijigi",
    title: "지피지기",
    kind: "수리논술 총론",
    summary:
      "논술이 나에게 맞는 문인지, 대학은 무엇을 보는지, 어떻게 시작하는지. 대학이 공개한 숫자와 문장으로 답합니다.",
    file: "/files/jipijigi.pdf",
    updated: "2026-11-24",
    points: [
      "같은 대학, 전형별 합격자 내신 비교 (2026학년도 23개교)",
      "43개 대학 선행학습 영향평가 보고서에서 뽑은 '대학이 보려는 능력'",
      "수능과 논술의 차이 세 가지",
      "논술이 맞는 사람, 신중해야 할 사람, 1분 자가진단",
      "2028 개편, 주요 10개 대학, 유형별 학교 고르기",
    ],
  },
  {
    slug: "jipijigi-schools",
    title: "지피지기 학교편",
    kind: "학교별 논술 가이드북 46권",
    summary: "학교마다 출제 성향, 시험 형식, 2028 변화를 한 권씩 정리합니다.",
  },
  {
    slug: "munil-jisip",
    title: "문일지십",
    kind: "무료 진단고사",
    summary: "실제 문제를 풀어 보고 지금 내 위치를 확인합니다.",
  },
];

export const books = [
  { key: "ongo", title: "온고지신", kind: "개념서" },
  { key: "hwangol", title: "환골탈태", kind: "논술 사고법·체질 개선" },
  { key: "ilpil", title: "일필휘지", kind: "답안 작성법" },
  { key: "yuyu", title: "유유상종", kind: "유형별 N제" },
  { key: "jeolcha", title: "절차탁마", kind: "양치기 N제" },
  { key: "gisaeng", title: "기생기사", kind: "기출 해설" },
  { key: "baekjeon", title: "백전불태", kind: "실전 모의논술" },
  { key: "sokjeon", title: "속전속결", kind: "2주 완성" },
  { key: "sangjeon", title: "상전벽해", kind: "2028 개편 대비" },
];

export const grades = ["고1", "고2", "고3", "N수", "학부모", "교사·강사"];
export const strengths = ["미적분", "확률과 통계", "기하", "대수", "아직 모르겠음"];
