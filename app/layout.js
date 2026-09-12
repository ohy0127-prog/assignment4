import './globals.css';

export const metadata = {
  title: '오늘의 진짜 정보판 — 데이터가 안 올 때',
  description: 'T04: 실제 공개 원천의 값을 매일 기록하고, 데이터가 오지 않을 때도 정직하게 설명하는 정보판'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
