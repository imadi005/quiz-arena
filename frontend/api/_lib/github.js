// Persistence for the Vercel deployment: since serverless functions have no
// durable disk, quiz data (questions/attempts/leaderboard) is stored as a
// JSON file committed to this repo via the GitHub Contents API, instead of
// local-server's plain file-on-disk approach (which only works when there's
// one long-running process, e.g. the classroom LAN setup).

const OWNER = process.env.GH_OWNER || 'imadi005'
const REPO = process.env.GH_REPO || 'quiz-arena'
const FILE_PATH = process.env.GH_DATA_PATH || 'local-server/data.json'
const BRANCH = process.env.GH_BRANCH || 'main'
const TOKEN = process.env.GITHUB_TOKEN

async function ghFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    const isRateLimited = res.status === 429 || (res.status === 403 && /rate limit/i.test(text))
    const err = new Error(
      isRateLimited
        ? 'The quiz service is temporarily busy. Please wait a minute and try again.'
        : `GitHub API ${res.status}: ${text}`,
    )
    err.status = res.status
    throw err
  }
  return res.json()
}

// Every request used to hit the GitHub API, and with students + admin pages all
// polling, that blows through GitHub's 5000/hour rate limit fast. Reads are served
// from a short-lived in-memory cache instead (warm serverless instances reuse it),
// which collapses the polling traffic into a couple of calls per minute.
const CACHE_TTL_MS = 60_000
let cache = null // { data, sha, fetchedAt }

export async function getData({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    // Deep copy so a caller mutating the result can't corrupt the cached copy.
    return { data: structuredClone(cache.data), sha: cache.sha }
  }

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
  const file = await ghFetch(url)
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  const data = JSON.parse(content)
  cache = { data: structuredClone(data), sha: file.sha, fetchedAt: Date.now() }
  return { data, sha: file.sha }
}

// mutate(data) must return the updated data, or throw to abort with no write.
// Re-fetches fresh data + sha on each attempt and retries once on a 409
// (another request committed in between), so concurrent submissions don't
// silently clobber each other.
export async function saveData(mutate) {
  if (!TOKEN) {
    throw Object.assign(new Error('Server is not configured to save data yet (GITHUB_TOKEN missing).'), {
      status: 503,
    })
  }
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    // A write must always use the latest file SHA. A cached SHA produces a
    // conflict and adds avoidable GitHub traffic when several students submit.
    const { data, sha } = await getData({ fresh: true })
    const next = mutate(data)
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`
    try {
      await ghFetch(url, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Update quiz data [skip ci]',
          content: Buffer.from(JSON.stringify(next, null, 2)).toString('base64'),
          sha,
          branch: BRANCH,
        }),
      })
      cache = { data: structuredClone(next), sha: null, fetchedAt: Date.now() }
      return next
    } catch (err) {
      lastErr = err
      if (err.status === 409 && attempt < 2) continue
      throw err
    }
  }
  throw lastErr
}

// Vercel's CDN shares this cache between all visitors. Without it, each
// student and every admin poll reaches GitHub separately and exhausts the
// GitHub API limit very quickly.
export function setReadCache(res) {
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60')
}

export function totalMarksOf(data) {
  return data.questions.reduce((sum, q) => sum + q.marks, 0)
}
