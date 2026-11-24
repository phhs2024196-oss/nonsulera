import data from "./data/past-items.json";

export type Item = { id: string; y: number; tr: string; et: string; u: string; f: string; p: number | null; t: number | null; lv: string };
export type NoteStatus = "solved" | "wrong" | "retry";
export const noteLabel: Record<NoteStatus, string> = { solved: "풀었음", wrong: "틀림", retry: "다시 풀기" };
export const pastNames = data.names as Record<string, string>;
export const pastItems = data.items as unknown as Record<string, Item[]>;
export const pastSchools = Object.keys(pastItems).sort((a, b) => pastNames[a].localeCompare(pastNames[b], "ko"));
export const shortName = (code: string) =>
  (pastNames[code] ?? code).replace("고려대학교 세종캠퍼스", "고려대(세종)").replace("연세대학교 미래캠퍼스", "연세대(미래)")
    .replace("한국외국어대학교", "한국외대").replace("서울과학기술대학교", "서울과기대").replace("여자대학교", "여대").replace("대학교", "대");
/** 기출 DB의 풀이 형태 코드를 학생이 읽는 말로 */
export const formName: Record<string, string> = {
  추론: "추론", 분류: "경우 나누기", 최적2단: "최대·최소", 구성: "구성하기", 전수: "모두 세기", 일반화: "일반화",
  점화: "점화식", 귀납구조: "귀납", 존재: "존재 보이기", 귀류: "귀류법", 이중세기: "두 번 세기", 불변량: "불변량",
};
