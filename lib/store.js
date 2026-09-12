import { Redis } from '@upstash/redis';

// Vercel Marketplace의 Upstash 연동은 접두사에 따라 변수 이름이 다르게 생성될 수 있다
// (예: UPSTASH_REDIS_REST_KV_REST_API_URL / ..._KV_REST_API_TOKEN).
// 접두사를 다시 붙이거나 이름을 수동으로 바꾸지 않아도 되도록, 가능한 이름 후보를 순서대로 찾는다.
// 이 값들은 서버(Vercel 프로젝트의 환경변수)에만 존재하고 브라우저 번들에는 절대 포함되지 않는다.
function firstEnv(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return undefined;
}

const REDIS_URL = firstEnv([
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_KV_REST_API_URL',
  'KV_REST_API_URL'
]);
const REDIS_TOKEN = firstEnv([
  'UPSTASH_REDIS_REST_TOKEN',
  'UPSTASH_REDIS_REST_KV_REST_API_TOKEN',
  'KV_REST_API_TOKEN'
]);

let redis;
function client() {
  if (!redis) {
    if (!REDIS_URL || !REDIS_TOKEN) {
      throw new Error('Upstash Redis 환경변수(REST URL/TOKEN)를 찾지 못했습니다. Vercel 프로젝트의 Environment Variables를 확인하세요.');
    }
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
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
