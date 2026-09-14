// 과제5 T05: 과제4 '일별 기록 CSV 다운로드' 작은 개선.
// 실제 조회 경로(app/api/board)·합성 재생 경로(ReplayPanel)와 마찬가지로,
// 화면(components/DownloadButton.jsx)과 검사 스크립트(scripts/run-csv-tests.mjs)가
// 이 순수 함수 하나를 그대로 공유한다 — 로직이 두 곳에서 따로 놀지 않게 하기 위함.

export const CSV_HEADER = ['record_date', 'normalized_value', 'unit', 'first_fetched_at', 'last_fetched_at'];

// UTF-8 BOM: 엑셀에서 한글이 깨지지 않도록 선두에 붙인다.
const BOM = '﻿';

function csvField(value) {
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * daily_readings 배열을 CSV 문자열로 변환한다.
 * - 선두에 UTF-8 BOM
 * - 헤더 행: record_date,normalized_value,unit,first_fetched_at,last_fetched_at
 * - 각 줄은 CRLF(\r\n)로 구분 (엑셀 호환)
 * - normalized_value는 화면 표시용 천단위 구분자를 적용하지 않고 원자료 그대로 출력
 * - 값에 쉼표/큰따옴표/줄바꿈이 있으면 표준 CSV 이스케이프(큰따옴표로 감싸고 내부 "는 ""로)
 */
export function toDailyReadingsCsv(rows) {
  const lines = [CSV_HEADER.join(',')];
  for (const row of rows) {
    lines.push(
      [
        csvField(row.record_date),
        csvField(row.normalized_value),
        csvField(row.unit),
        csvField(row.first_fetched_at),
        csvField(row.last_fetched_at)
      ].join(',')
    );
  }
  return BOM + lines.join('\r\n') + '\r\n';
}

export const CSV_FILENAME = 'daily-readings.csv';

// CSV-09가 검증하는 버튼 비활성화 조건. DownloadButton.jsx가 이 함수를 그대로 써서
// 검사 스크립트(순수 Node, JSX 트랜스파일 불필요)와 실제 렌더링 로직이 어긋나지 않게 한다.
export function isDownloadDisabled(rows) {
  return !rows || rows.length === 0;
}
