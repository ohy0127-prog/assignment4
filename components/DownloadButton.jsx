'use client';

// JSX를 쓰지 않고 React.createElement로 직접 작성한다 — 그래야 Next.js 빌드뿐 아니라
// scripts/run-csv-tests.mjs가 트랜스파일 없이 순수 Node ESM으로 바로 import해서 검사할 수 있다.
import { createElement } from 'react';
import { toDailyReadingsCsv, CSV_FILENAME, isDownloadDisabled } from '../lib/csv.js';

// 카드5(과제5) 작은 개선: 일별 기록을 CSV로 내려받는 버튼.
// 기록이 0건이면 비활성화한다(CSV-09). 클릭하면 브라우저 다운로드를 트리거한다(CSV-10).
export default function DownloadButton({ rows }) {
  const disabled = isDownloadDisabled(rows);

  function handleClick() {
    if (disabled) return;
    const csv = toDailyReadingsCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = CSV_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return createElement(
    'button',
    {
      className: 'secondary',
      onClick: handleClick,
      disabled,
      title: disabled ? '아직 내려받을 일별 기록이 없습니다' : 'CSV로 내려받기'
    },
    'CSV로 내려받기'
  );
}
