// 과제5 T05: CSV 다운로드 개선의 고정 검사 10개(CSV-01~10) 실행 스크립트.
// CSV-01~09는 순수 함수(lib/csv.js)만으로 결정론적으로 자동 검증한다.
// DownloadButton.jsx는 CSV-09가 검증하는 isDownloadDisabled()를 그대로 가져다 쓰므로
// 실제 렌더링과 이 검사 결과가 어긋나지 않는다.
// CSV-10(클릭 시 실제 다운로드 트리거)은 브라우저 상호작용이 필요해 이 스크립트로는 자동화할 수 없다 —
// 아래 결과에 MANUAL로 표시하고, 인수인계 문서에 수동 확인 절차를 남긴다.
//
// 실행: node scripts/run-csv-tests.mjs

import assert from 'node:assert/strict';
import { toDailyReadingsCsv, CSV_HEADER, isDownloadDisabled } from '../lib/csv.js';

const results = [];

function test(id, fn) {
  try {
    fn();
    results.push({ id, status: 'PASS' });
  } catch (err) {
    results.push({ id, status: 'FAIL', message: err.message });
  }
}

function manual(id, note) {
  results.push({ id, status: 'MANUAL', message: note });
}

const HEADER_LINE = CSV_HEADER.join(',');
const BOM = '﻿';

// CSV-01: 빈 배열 -> 헤더 행만
test('CSV-01', () => {
  const out = toDailyReadingsCsv([]);
  assert.equal(out, BOM + HEADER_LINE + '\r\n');
});

// CSV-02: 정수값 1행 -> 천단위 구분자 없이 원자료 그대로
test('CSV-02', () => {
  const rows = [{
    record_date: '2026-09-12',
    normalized_value: 163845000,
    unit: 'KRW',
    first_fetched_at: '2026-09-12T00:00:03.000Z',
    last_fetched_at: '2026-09-12T09:15:41.000Z'
  }];
  const out = toDailyReadingsCsv(rows);
  const lines = out.replace(BOM, '').split('\r\n');
  assert.equal(lines[1], '2026-09-12,163845000,KRW,2026-09-12T00:00:03.000Z,2026-09-12T09:15:41.000Z');
});

// CSV-03: 3행 입력 순서 보존
test('CSV-03', () => {
  const rows = ['2026-09-10', '2026-09-11', '2026-09-12'].map((d, i) => ({
    record_date: d,
    normalized_value: 100 + i,
    unit: 'KRW',
    first_fetched_at: `${d}T00:00:00.000Z`,
    last_fetched_at: `${d}T00:00:00.000Z`
  }));
  const out = toDailyReadingsCsv(rows);
  const lines = out.replace(BOM, '').split('\r\n').filter(Boolean);
  assert.equal(lines.length, 4); // 헤더 1 + 데이터 3
  assert.ok(lines[1].startsWith('2026-09-10,'));
  assert.ok(lines[2].startsWith('2026-09-11,'));
  assert.ok(lines[3].startsWith('2026-09-12,'));
});

// CSV-04: 소수점 값 보존 (반올림/절삭 없음)
test('CSV-04', () => {
  const rows = [{ record_date: '2026-09-12', normalized_value: 1234.56, unit: 'KRW', first_fetched_at: 'a', last_fetched_at: 'b' }];
  const out = toDailyReadingsCsv(rows);
  assert.ok(out.includes(',1234.56,'));
});

// CSV-05: 콤마 포함 필드 이스케이프
test('CSV-05', () => {
  const rows = [{ record_date: '2026-09-12', normalized_value: 1, unit: 'KRW, approx', first_fetched_at: 'a', last_fetched_at: 'b' }];
  const out = toDailyReadingsCsv(rows);
  assert.ok(out.includes('"KRW, approx"'));
});

// CSV-06: 큰따옴표 포함 필드 이스케이프
test('CSV-06', () => {
  const rows = [{ record_date: '2026-09-12', normalized_value: 1, unit: 'KR"W', first_fetched_at: 'a', last_fetched_at: 'b' }];
  const out = toDailyReadingsCsv(rows);
  assert.ok(out.includes('"KR""W"'));
});

// CSV-07: 선두 BOM 확인
test('CSV-07', () => {
  const out = toDailyReadingsCsv([]);
  assert.equal(out.charCodeAt(0), 0xfeff);
});

// CSV-08: CRLF 줄 구분자 확인
test('CSV-08', () => {
  const rows = ['2026-09-10', '2026-09-11'].map((d) => ({
    record_date: d, normalized_value: 1, unit: 'KRW', first_fetched_at: 'a', last_fetched_at: 'b'
  }));
  const out = toDailyReadingsCsv(rows);
  assert.ok(out.includes('\r\n'));
  const withoutCRLF = out.split('\r\n').join('');
  assert.ok(!withoutCRLF.includes('\n'), 'CRLF를 제거하면 남은 \\n이 없어야 한다(필드 내부 줄바꿈 없음 케이스)');
});

// CSV-09: 0건일 때 버튼이 disabled 조건을 만족 (DownloadButton.jsx가 그대로 쓰는 공유 함수)
test('CSV-09', () => {
  assert.equal(isDownloadDisabled([]), true, 'rows=[] 일 때 disabled여야 한다');
  assert.equal(isDownloadDisabled(undefined), true, 'rows=undefined 일 때도 disabled여야 한다');
  const rows = [{ record_date: '2026-09-12', normalized_value: 1, unit: 'KRW', first_fetched_at: 'a', last_fetched_at: 'b' }];
  assert.equal(isDownloadDisabled(rows), false, 'rows가 1건 이상이면 disabled가 아니어야 한다');
});

// CSV-10: 실제 클릭 -> 다운로드 트리거는 브라우저 필요, 자동화 범위 밖
manual('CSV-10', '배포 주소(https://assignment4-pink-six.vercel.app/)에서 일별 기록이 1건 이상인 상태로 "CSV로 내려받기" 버튼을 눌러 daily-readings.csv 파일이 실제로 다운로드되는지 육안으로 확인.');

let pass = 0, fail = 0, manualCount = 0;
for (const r of results) {
  const tag = r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : 'MANUAL';
  console.log(`[${tag}] ${r.id}${r.message ? ' - ' + r.message : ''}`);
  if (r.status === 'PASS') pass++;
  else if (r.status === 'FAIL') fail++;
  else manualCount++;
}
console.log(`\n합계: PASS ${pass} / FAIL ${fail} / MANUAL ${manualCount} (총 ${results.length}개)`);
process.exit(fail > 0 ? 1 : 0);
