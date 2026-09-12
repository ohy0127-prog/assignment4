import { NextResponse } from 'next/server';
import { getDailyReadings, upsertDailyReading } from '../../../lib/store';
import { kstDateFromISO, validateNormalizedReading, comparisonFor } from '../../../lib/adapter';

// 이 라우트는 캐시하지 않는다 — 매 호출이 실제 새 조회 시각을 만든다.
export const dynamic = 'force-dynamic';

const SIGNAL_ID = 'krw-btc-price';
const SOURCE_URL = 'https://api.upbit.com/v1/ticker?markets=KRW-BTC';
const SOURCE_NAME = 'Upbit 공개 시세 API (KRW-BTC, 비개인 공개 데이터)';
const LIVE_TIMEOUT_MS = 6000;

export async function GET() {
  const fetchedAt = new Date().toISOString();
  let status;
  let currentReading = null;
  let rawPayloadPreview = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(SOURCE_URL, { signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 403) {
      status = { freshness: 'stale', error_code: 'auth' };
    } else if (res.status === 429) {
      status = { freshness: 'stale', error_code: 'rate_limit' };
    } else if (!res.ok) {
      status = { freshness: 'stale', error_code: 'schema_error' };
    } else {
      const json = await res.json();
      const ticker = Array.isArray(json) ? json[0] : null;
      if (!ticker || typeof ticker.trade_price !== 'number' || typeof ticker.trade_timestamp !== 'number') {
        status = { freshness: 'stale', error_code: 'schema_error' };
      } else {
        rawPayloadPreview = { trade_price: ticker.trade_price, trade_timestamp: ticker.trade_timestamp };
        const reading = {
          signal_id: SIGNAL_ID,
          normalized_value: ticker.trade_price,
          unit: 'KRW',
          source_name: SOURCE_NAME,
          source_url: SOURCE_URL,
          source_time: new Date(ticker.trade_timestamp).toISOString(),
          fetched_at: fetchedAt,
          record_timezone: 'Asia/Seoul',
          record_date: kstDateFromISO(fetchedAt)
        };
        try {
          validateNormalizedReading(reading);
          currentReading = reading;
          status = { freshness: 'fresh', error_code: 'none' };
        } catch {
          status = { freshness: 'stale', error_code: 'schema_error' };
        }
      }
    }
  } catch (err) {
    status = err && err.name === 'AbortError'
      ? { freshness: 'stale', error_code: 'timeout' }
      : { freshness: 'stale', error_code: 'offline' };
  }

  let rows;
  if (status.freshness === 'fresh' && currentReading) {
    const existing = await getDailyReadings(SIGNAL_ID);
    const prior = existing.find((r) => r.record_date === currentReading.record_date);
    rows = await upsertDailyReading(SIGNAL_ID, {
      record_id: `live-${SIGNAL_ID}-${currentReading.record_date}`,
      signal_id: SIGNAL_ID,
      record_date: currentReading.record_date,
      normalized_value: currentReading.normalized_value,
      unit: currentReading.unit,
      first_fetched_at: prior ? prior.first_fetched_at : currentReading.fetched_at,
      last_fetched_at: currentReading.fetched_at,
      reading: currentReading
    });
  } else {
    rows = await getDailyReadings(SIGNAL_ID);
  }

  const lastGood = rows[rows.length - 1] || null;
  const comparison = lastGood
    ? comparisonFor(rows, lastGood)
    : { state: 'insufficient', direction: null, magnitude: null, unit: null };

  return NextResponse.json({
    server_now: fetchedAt,
    record_timezone: 'Asia/Seoul',
    status,
    current_reading: currentReading,
    raw_payload_preview: rawPayloadPreview,
    last_good: lastGood,
    daily_readings: rows,
    comparison
  });
}
