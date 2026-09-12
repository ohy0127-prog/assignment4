import { Redis } from '@upstash/redis';

// 환경변수 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 에서 자동으로 읽는다.
// 이 값들은 서버(Vercel 프로젝트의 환경변수)에만 존재하고 브라우저 번들에는 절대 포함되지 않는다.
let redis;
function client() {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

const KEY_PREFIX = 't04:readings:';

export async function getDailyReadings(signalId) {
  const raw = await client().get(KEY_PREFIX + signalId);
  if (!raw) return [];
  const rows = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Array.isArray(rows) ? rows : [];
}

export async function upsertDailyReading(signalId, row) {
  const rows = await getDailyReadings(signalId);
  const idx = rows.findIndex((r) => r.record_date === row.record_date);
  if (idx >= 0) {
    rows[idx] = { ...row, first_fetched_at: rows[idx].first_fetched_at };
  } else {
    rows.push(row);
  }
  rows.sort((a, b) => a.record_date.localeCompare(b.record_date));
  await client().set(KEY_PREFIX + signalId, JSON.stringify(rows));
  return rows;
}
