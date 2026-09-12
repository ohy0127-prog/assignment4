import BoardClient from '../components/BoardClient';
import ReplayPanel from '../components/ReplayPanel';

export default function Page() {
  return (
    <main className="page">
      <h1>오늘의 진짜 정보판</h1>
      <p className="subtitle">데이터가 안 올 때도 정직하게 설명합니다 · 로그인 불필요 · 비밀키 없음</p>

      <BoardClient />
      <ReplayPanel />

      <footer>
        이 화면과 소스에는 실제 개인정보나 개인 기록이 없습니다. 실제 조회 값은 비개인 공개 시세(Upbit KRW-BTC)이며,
        합성 실패 재생 패널은 공개 fixture 계약(package_id: aleph-t04-real-information-board-public-contract-v2)만 사용합니다.
      </footer>
    </main>
  );
}
