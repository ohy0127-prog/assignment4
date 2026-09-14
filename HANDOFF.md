# T05 인수인계 문서 — 과제4 '오늘의 진짜 정보판' 작은 개선: 일별 기록 CSV 다운로드

## 1. 목표
'오늘의 진짜 정보판'(과제4, https://assignment4-pink-six.vercel.app/) 화면의 "일별 기록" 표 옆에 CSV 다운로드 버튼을 추가한다. 아래 고정 검사 CSV-01~10을 모두 통과시키는 것이 완료 조건이다.

## 2. 현재 상태
- 저장소: github.com/ohy0127-prog/assignment4, **`main` 브랜치에 병합·배포 완료** (기존 `t05-csv-export` 브랜치는 병합 후 삭제됨. PR #1, merge commit 0712e24)
- 배포 주소: https://assignment4-pink-six.vercel.app/ — 새 CSV 버튼이 실제로 떠 있는 상태
- 버전 ID(코드 파일들의 git 트리 해시 — 커밋 시각·해시가 달라져도 파일 내용이 같으면 항상 이 값이 나온다): `3434a63680112bae781d9b855bfe552bd428e842`
  확인 방법: `main`을 클론한 뒤 `lib/csv.js`, `components/DownloadButton.jsx`, `components/BoardClient.jsx`, `scripts/run-csv-tests.mjs` 네 파일만 따로 커밋해서 `git write-tree` 하거나, 단순히 파일 내용을 이 문서·patch와 diff 없음으로 확인해도 된다.
- 추가/변경된 파일
  - `lib/csv.js` (신규) — `toDailyReadingsCsv(rows)`, `isDownloadDisabled(rows)` 순수 함수
  - `components/DownloadButton.jsx` (신규) — CSV 다운로드 버튼 컴포넌트
  - `components/BoardClient.jsx` (수정) — "일별 기록" 표 옆에 버튼 배치
  - `scripts/run-csv-tests.mjs` (신규) — 고정 검사 10개 실행 스크립트
- **2026-09-14: 배포 사이트에서 실제로 버튼을 눌러 `daily-readings.csv`를 내려받아 확인함.** 헤더·값(예: `2026-09-14,105195000,KRW,...`)·BOM(`EF BB BF`)·CRLF(`\r\n`) 전부 스펙과 일치. CSV-10 포함 **고정 검사 10개 전부 통과** 상태.

## 3. 실행 명령
```bash
git clone https://github.com/ohy0127-prog/assignment4.git
cd assignment4
git checkout main
npm install
node scripts/run-csv-tests.mjs   # CSV-01~09 자동 검사. "PASS 9 / FAIL 0 / MANUAL 1" 이 나와야 정상
npm run build                    # 빌드 오류 없어야 함
npm run dev                      # 로컬 화면 확인용(선택) — 아래 '남은 문제'의 Redis 환경변수 주의사항 참고
```
CSV-10 재확인(선택, 이미 한 번 확인됨): https://assignment4-pink-six.vercel.app/ 접속 → "CSV로 내려받기" 버튼 클릭 → `daily-readings.csv` 파일이 실제로 다운로드되는지 확인.

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

현재 결과(2026-09-14, `main` 배포 버전 기준): **PASS 10 / FAIL 0** (자동 9개 + 수동 1개, 전부 확인 완료)

## 5. 남은 문제
- 기능적으로 남은 문제는 없다 — CSV-01~10 전부 통과, 배포도 완료된 상태.
- 로컬 개발 서버(`npm run dev`)를 Upstash Redis 환경변수 없이 실행하면 `/api/board`가 오류를 던진다. 이는 이번 개선 이전부터 있던 기존 동작이며 이번 작업으로 생긴 문제가 아니다. CSV-01~09는 이 API와 무관한 순수 함수 검사라 영향받지 않는다.

## 6. 다음 행동 (AI B가 할 일)
기능은 이미 완성·배포되어 있다. 여기서부터는 "저장소와 이 문서만 보고, 앞선 대화를 전혀 모르는 상태에서도 같은 검사를 독립적으로 재현할 수 있는가"를 확인하는 것 자체가 남은 작업이다.
1. 위 '실행 명령'대로 저장소를 클론하고 `node scripts/run-csv-tests.mjs`를 직접 돌려서 CSV-01~09가 자동으로 PASS 9개가 나오는지 스스로 확인한다.
2. 배포 사이트에서 CSV-10(버튼 클릭 → 다운로드)을 독립적으로 재현해본다.
3. 위 '통과 검사' 표의 10개 검사·기대값과 실제 결과가 정확히 일치하는지 하나씩 대조하고, 문제가 있으면(있어서는 안 되지만) 구체적으로 어떤 검사가 왜 실패했는지 기록한다.
4. 검사 10개가 모두 통과함을 최종 확인하고, 이 문서만으로 재현이 가능했는지(막힌 지점이 있었는지) 짧게 남긴다.
5. 카드5 비교표를 위해 실제로 사용한 시간과 AI에게 보낸 메시지 왕복 횟수를 기록해 둔다 (공통 상한: 세션당 60분 / 메시지 35회 이하).

## 7. 건드리지 말 것
- `lib/adapter.js`, `lib/store.js`, `app/api/board/route.js` — 과제4 본체(카드1~5, T04-C01~C35)의 핵심 로직. 이번 개선과 무관하며, 건드리면 기존 통과 기준이 깨질 수 있다.
- `components/ReplayPanel.jsx`, `lib/fixtures.js` — 카드3(합성 재생) 전용, 이번 개선과 분리되어 있다.
- 검사 CSV-01~10의 ID·입력·기대값 자체 — 삭제·완화·변경 금지(T05-C18~C20). 구현을 검사에 맞게 고치는 것은 되지만, 검사를 구현에 맞춰 바꾸면 안 된다.
