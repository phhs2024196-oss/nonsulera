/* eslint-disable @next/next/no-img-element */
export default function Cover() {
  return (
    <div className="cover" aria-label="지피지기 표지">
      <div className="hanja" aria-hidden>知彼<br />知己</div>
      <div className="head">논술의 시대 · 수리논술 총론</div>
      <img className="title" src="/brand/jipijigi.png" alt="지피지기" />
      <div className="dare">그대는 논술에 발을 들일 준비가 되었는가?</div>
      <img className="lg" src="/brand/logo_main.png" alt="" />
    </div>
  );
}
