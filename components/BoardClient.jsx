'use client';

import { useEffect, useState, useCallback } from 'react';
import DownloadButton from './DownloadButton';

function fmtKST(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date(iso)) + ' (Asia/Seoul)';
}

const ERROR_LABEL = {
  none: '없음',
  timeout: '응답 지연(timeout)',
  auth: '외부 원천 인증 거절(401/403)',
  rate_limit: '외부 원천 호출 제한(429)',
  offline: '오프라인/네트워크 오류',
  schema_error: '응답 형식 변경(schema_error)'
};

export default function BoardClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/board', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('요청 자체가 실패했습니다: ' + String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <div className="card">불러오는 중…</div>;
  }
  if (error) {
    return (
      <div className="card">
        <div className="warn-banner">{error}</div>
        <button onClick={load}>다시 시도</button>
      </div>
    );
  }
  if (!data) return null;

  const { status, current_reading, last_good, daily_readings, comparison, server_now } = data;
  const isFresh = status.freshness === 'fresh';
  const display = isFresh ? current_reading : last_good;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>오늘 이 값이 궁금해요: 원화-비트코인 체결가</h2>
        <span className={`badge ${isFresh ? 'fresh' : 'stale'}`}>
          {isFresh ? 'fresh · 정상' : `stale · ${ERROR_LABEL[status.error_code] || status.error_code}`}
        </span>
      </div>

      {!isFresh && (
        <div className="warn-banner">
          지금 조회가 실패했습니다({ERROR_LABEL[status.error_code] || status.error_code}). 아래 값은 마지막으로 성공한 값이며 <b>오래된 값</b>입니다. 값 자체는 지우지 않고 그대로 보존합니다.
        </div>
      )}

      {display ? (
        <>
          <div className="value-row">
            <span className="value-main">
              {Number(display.normalized_value).toLocaleString('ko-KR')}
            </span>
            <span className="value-unit">{display.unit}</span>
            {!isFresh && <span className="badge stale">오래된 값</span>}
          </div>
          <dl className="meta-grid">
            <dt>원자료 그대로</dt>
            <dd>{display.normalized_value}</dd>
            <dt>출처</dt>
            <dd><a href={display.reading ? display.reading.source_url : display.source_url} target="_blank" rel="noreferrer">{(display.reading ? display.reading.source_name : display.source_name)}</a></dd>
            <dt>출처 시각</dt>
            <dd>{fmtKST(display.reading ? display.reading.source_time : display.source_time)}</dd>
            <dt>조회 시각</dt>
            <dd>{fmtKST(isFresh ? current_reading.fetched_at : (display.last_fetched_at || display.fetched_at))}</dd>
            <dt>기준 시간대</dt>
            <dd>Asia/Seoul (KST)</dd>
            <dt>일별 기록 키</dt>
            <dd>record_date = {display.record_date}</dd>
          </dl>
        </>
      ) : (
        <p>아직 저장된 정상 조회 값이 없습니다.</p>
      )}

      <div className="btn-row">
        <button onClick={load} disabled={loading}>{loading ? '조회 중…' : '다시 시도'}</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0 }}>일별 기록 ({daily_readings.length}건) · 전일 대비</h3>
        <DownloadButton rows={daily_readings} />
      </div>
      {daily_readings.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>아직 실제 날짜 기록이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr><th>기준 날짜(KST)</th><th>저장값</th><th>단위</th><th>최초 조회</th><th>마지막 조회</th></tr>
          </thead>
          <tbody>
            {daily_readings.map((r) => (
              <tr key={r.record_date}>
                <td>{r.record_date}</td>
                <td>{Number(r.normalized_value).toLocaleString('ko-KR')}</td>
                <td>{r.unit}</td>
                <td>{fmtKST(r.first_fetched_at)}</td>
                <td>{fmtKST(r.last_fetched_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 12 }}>
        {comparison.state === 'insufficient' && '아직 비교할 이전 날짜 기록이 없습니다 (서로 다른 날짜 2건이 모이면 전일 대비가 계산됩니다).'}
        {comparison.state === 'unit_mismatch' && '단위가 달라 전일 대비를 계산할 수 없습니다.'}
        {comparison.state === 'comparable' && (
          <>전일 대비: <b>{comparison.direction === 'increase' ? '▲ 상승' : comparison.direction === 'decrease' ? '▼ 하락' : '동일'}</b> {comparison.magnitude.toLocaleString('ko-KR')} {comparison.unit} (저장된 두 값에서 다시 계산)</>
        )}
      </p>

      <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>서버 조회 시각(이번 요청): {fmtKST(server_now)}</p>
    </div>
  );
}
