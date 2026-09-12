'use client';

import { useState } from 'react';
import { resetEvaluationState, runFixture } from '../lib/adapter';
import { FIXTURES, SEQUENCES } from '../lib/fixtures';

const ERROR_LABEL = {
  none: '없음',
  timeout: '응답 지연(timeout)',
  auth: '외부 원천 인증 거절(401/403)',
  rate_limit: '외부 원천 호출 제한(429)',
  offline: '오프라인/네트워크 오류',
  schema_error: '응답 형식 변경(schema_error)'
};

const BUTTONS = [
  { id: 'T04-NORMAL-D1-A', label: '정상 1일차-A' },
  { id: 'T04-NORMAL-D1-B', label: '정상 1일차-B(같은 날 갱신)' },
  { id: 'T04-NORMAL-D2', label: '정상 2일차(새 행 + 전일대비)' },
  { id: 'T04-TIMEOUT', label: '느린 응답(timeout)' },
  { id: 'T04-AUTH-401', label: '인증 거절(401)' },
  { id: 'T04-RATE-429', label: '호출 제한(429)' },
  { id: 'T04-OFFLINE', label: '오프라인' },
  { id: 'T04-SCHEMA-BREAK', label: '형식 변경(schema_error)' },
  { id: 'T04-RECOVER-D2', label: '재시도 성공(복구, 2일차)' }
];

export default function ReplayPanel() {
  const [state, setState] = useState(() => resetEvaluationState());
  const [log, setLog] = useState([]);

  function play(fixtureId) {
    const next = runFixture(state, FIXTURES[fixtureId]);
    setState(next);
    setLog((l) => [...l, fixtureId]);
  }

  function reset() {
    setState(resetEvaluationState());
    setLog([]);
  }

  const lastGood = state.daily_readings[state.daily_readings.length - 1];

  return (
    <div className="card replay-card">
      <h2>합성 실패 재생 (카드3) — 테스트 전용</h2>
      <p className="replay-note">
        이 패널은 공개 fixture 9종(T04-NORMAL-D1-A 등)만 사용하는 합성 재생입니다. 실제 값이 아니며,
        위 실제 조회판과 완전히 분리된 상태에서 동작합니다(다른 signal_id: <code>aleph-demo-index</code>).
      </p>

      <div className="btn-row">
        <button className="secondary" onClick={reset}>reset</button>
        {BUTTONS.map((b) => (
          <button key={b.id} className="secondary" onClick={() => play(b.id)}>{b.label}</button>
        ))}
      </div>

      <dl className="meta-grid">
        <dt>상태</dt>
        <dd>
          {state.status
            ? <span className={`badge ${state.status.freshness === 'fresh' ? 'fresh' : 'stale'}`}>
                {state.status.freshness} · {ERROR_LABEL[state.status.error_code]}
              </span>
            : '아직 재생 없음(reset 상태)'}
        </dd>
        <dt>일별 행 개수</dt>
        <dd>{state.daily_readings.length}</dd>
        <dt>마지막 정상값</dt>
        <dd>{lastGood ? `${lastGood.normalized_value} ${lastGood.unit} (record_date=${lastGood.record_date})` : '없음'}</dd>
        <dt>전일 대비</dt>
        <dd>
          {state.last_comparison.state === 'comparable'
            ? `${state.last_comparison.direction} ${state.last_comparison.magnitude} ${state.last_comparison.unit}`
            : state.last_comparison.state}
        </dd>
        <dt>재생 순서</dt>
        <dd>{log.length ? log.join(' → ') : '(없음)'}</dd>
      </dl>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>추천 재생 순서 보기</summary>
        <ul style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          <li>정상·일별 저장 확인(C20,C21): reset → 정상 1일차-A → 정상 1일차-B(행 1개 유지) → 정상 2일차(행 2개, 전일대비 +15)</li>
          <li>각 실패 확인(C12~C18): reset → 정상 1일차-A → 정상 1일차-B → 실패 하나(마지막 정상값 105 유지, stale 표시)</li>
          <li>복구 확인(C19): reset → 정상 1일차-A → 정상 1일차-B → 느린 응답(timeout) → 재시도 성공(복구, 2일차)</li>
        </ul>
      </details>
    </div>
  );
}
