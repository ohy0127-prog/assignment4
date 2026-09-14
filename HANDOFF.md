# T05 인수인계 문서 — 과제4 '오늘의 진짜 정보판' 작은 개선: 일별 기록 CSV 다운로드

## 1. 목표
'오늘의 진짜 정보판'(과제4, https://assignment4-pink-six.vercel.app/) 화면의 "일별 기록" 표 옆에 CSV 다운로드 버튼을 추가한다. 아래 고정 검사 CSV-01~10을 모두 통과시키는 것이 완료 조건이다.

## 2. 현재 상태
- 저장소: github.com/ohy0127-prog/assignment4, 브랜치 `t05-csv-export`
- 버전 ID(코드 파일들의 git 트리 해시 — 커밋 시각·해시가 달라져도 파일 내용이 같으면 항상 이 값이 나온다): `3434a63680112bae781d9b855bfe552bd428e842`
  확인 명령: 저장소 루트에서 `git rev-parse <이 문서가 없는 마지막 커밋>^{tree}`, 즉 아래 실행 명령대로 클론했을 때 `git log --oneline`에서 "T05: 일별 기록 CSV 다운로드 버튼 추가" 커밋을 찾아 `git rev-parse <그 커밋 해시>^{tree}`로 확인. 이 값이 일치하면 lib/csv.js·components/DownloadButton.jsx·components/BoardClient.jsx·scripts/run-csv-tests.mjs 네 파일의 내용이 이 문서가 설명하는 것과 정확히 같다는 뜻이다.
- 추가/변경된 파일
  - `lib/csv.js` (신규) — `toDailyReadingsCsv(rows)`, `isDownloadDisabled(rows)` 순수 함수
  - `components/DownloadButton.jsx` (신규) — CSV 다운로드 버튼 컴포넌트
  - `components/BoardClient.jsx` (수정) — "일별 기록" 표 옆에 버튼 배치
  - `scripts/run-csv-tests.mjs` (신규) — 고정 검사 10개 실행 스크립트
- CSV-01~09는 순수 함수/로직만으로 자동 검증됨. CSV-10(실제 클릭 시 파일 다운로드)은 배포 사이트에서 사람이 직접 확인해야 하는 수동 검사.

## 3. 실행 명령
```bash
git clone https://github.com/ohy0127-prog/assignment4.git
cd assignment4
git checkout t05-csv-export
npm install
node scripts/run-csv-tests.mjs   # CSV-01~09 자동 검사. "PASS 9 / FAIL 0 / MANUAL 1" 이 나와야 정상
npm run build                    # 빌드 오류 없어야 함
npm run dev                      # 로컬 화면 확인용(선택) — 아래 '남은 문제'의 Redis 환경변수 주의사항 참고
```
CSV-10 수동 확인: https://assignment4-pink-six.vercel.app/ 접속 → 일별 기록이 1건 이상인 상태에서 "CSV로 내려받기" 버튼 클릭 → `daily-readings.csv` 파일이 실제로 다운로드되는지 확인. (이 브랜치가 아직 배포에 반영 전이면 먼저 '다음 행동' 1번을 수행)

## 4. 통과 검사 (고정 10개 — 카드1에서 정한 것과 완전히 동일, 삭제·완화·기대값 변경 금지)
| ID | 입력 | 기대값 | 확인 방법 |
|---|---|---|---|
| CSV-01 | `rows = []` | BOM + 헤더 줄만, 데이터 행 0개 | `node scripts/run-csv-tests.mjs` |
| CSV-02 | 정수값 1행(163845000 KRW) | 천단위 구분자 없이 원자료 그대로(`163845000`) | 〃 |
| CSV-03 | 09-10/09-11/09-12 순 3행 | 출력 순서가 입력 배열 순서와 동일, 총 4줄(헤더+3) | 〃 |
| CSV-04 | `normalized_value: 1234.56` | `1234.56` 그대로, 반올림/절삭 없음 | 〃 |
| CSV-05 | `unit: "KRW, approx"` | `"KRW, approx"` 큰따옴표로 이스케이프 | 〃 |
| CSV-06 | `unit: 'KR"W'` | `"KR""W"` (큰따옴표 두 개로 이스케이프) | 〃 |
| CSV-07 | 임의 rows | 출력 첫 글자가 U+FEFF(BOM) | 〃 |
| CSV-08 | 2행 | 줄 구분자가 `\r\n` | 〃 |
| CSV-09 | `rows=[]` vs 1행 이상 | 0건이면 disabled=true, 1건 이상이면 false | 〃 |
| CSV-10 | 배포 사이트에서 버튼 클릭 | `daily-readings.csv` 다운로드 트리거 | 수동(육안) |

현재 결과(2026-09-13, 이 버전 ID 기준): **PASS 9 / FAIL 0 / MANUAL 1**

## 5. 남은 문제
- CSV-10이 아직 실제 배포 사이트에서 수동 확인되지 않았다 — `t05-csv-export` 브랜치가 아직 `main`에 병합·배포되지 않았기 때문.
- 로컬 개발 서버(`npm run dev`)를 Upstash Redis 환경변수 없이 실행하면 `/api/board`가 오류를 던진다. 이는 이번 개선 이전부터 있던 기존 동작이며 이번 작업으로 생긴 문제가 아니다. CSV-01~09는 이 API와 무관한 순수 함수 검사라 영향받지 않는다.
- `main` 브랜치 병합 및 배포가 아직 이루어지지 않은 상태.

## 6. 다음 행동
1. `t05-csv-export` 브랜치를 `main`에 병합하고 Vercel에 배포한다.
2. 배포된 사이트에서 CSV-10을 수동으로 확인한다.
3. (선택) 다운로드한 CSV 파일을 실제 엑셀/스프레드시트 프로그램으로 열어 한글·인코딩이 깨지지 않는지 육안 확인하면 더 확실하다.
4. 카드5 비교표를 위해 실제로 사용한 시간과 AI에게 보낸 메시지 왕복 횟수를 기록해 둔다 (공통 상한: 세션당 60분 / 메시지 35회 이하).

## 7. 건드리지 말 것
- `lib/adapter.js`, `lib/store.js`, `app/api/board/route.js` — 과제4 본체(카드1~5, T04-C01~C35)의 핵심 로직. 이번 개선과 무관하며, 건드리면 기존 통과 기준이 깨질 수 있다.
- `components/ReplayPanel.jsx`, `lib/fixtures.js` — 카드3(합성 재생) 전용, 이번 개선과 분리되어 있다.
- 검사 CSV-01~10의 ID·입력·기대값 자체 — 삭제·완화·변경 금지(T05-C18~C20). 구현을 검사에 맞게 고치는 것은 되지만, 검사를 구현에 맞춰 바꾸면 안 된다.
