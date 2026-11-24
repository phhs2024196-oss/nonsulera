import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보 처리방침" };

export default function Privacy() {
  return (
    <div className="wrap article">
      <h1>개인정보 처리방침</h1>
      <p className="note">초안이에요. 사업자 정보와 담당자 연락처를 채운 뒤 공개해요.</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>1. 모으는 정보</h2>
      <p>회원: 로그인에 쓰는 이메일과 이름(카카오·Google 제공 범위), 직접 입력한 학년·목표 학교·자신 있는 과목·관심 교재, 소식 수신 동의 여부.</p>
      <p>모든 방문자: 본 페이지, 자료 다운로드, 관심 표시 기록과 유입 경로. 이 기록은 무작위로 만든 방문자 번호(쿠키)로 묶이며 이름이나 연락처와 연결되지 않아요. 로그인한 경우에만 회원 정보와 연결돼요.</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>2. 쓰는 곳</h2>
      <p>어떤 자료와 책이 필요한지 파악해 만드는 순서를 정하고, 동의한 회원에게 출간 소식을 보내는 데만 써요. 제3자에게 팔거나 넘기지 않아요.</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>3. 보관과 삭제</h2>
      <p>회원 탈퇴 시 회원 정보는 바로 지우고, 이용 기록은 회원과의 연결을 끊어 통계로만 남겨요. 탈퇴·열람·정정 요청은 아래 연락처로 받아요.</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>4. 만 14세 미만</h2>
      <p>만 14세 미만은 회원으로 가입할 수 없어요. 자료 다운로드는 가입 없이 가능해요.</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>5. 처리 위탁</h2>
      <p>회원 인증과 데이터 저장: Supabase Inc. / 사이트 운영: 호스팅 업체(확정 후 기재).</p>
      <h2 style={{ fontSize: 19, margin: "28px 0 8px" }}>6. 연락처</h2>
      <p>개인정보 보호 담당: (확정 후 기재)</p>
    </div>
  );
}
