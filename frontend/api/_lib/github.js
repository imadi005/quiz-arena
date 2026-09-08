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
    const err = new Error(`GitHub API ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function getData() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`
  const file = await ghFetch(url)
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  return { data: JSON.parse(content), sha: file.sha }
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
    const { data, sha } = await getData()
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
      return next
    } catch (err) {
      lastErr = err
      if (err.status === 409 && attempt < 2) continue
      throw err
    }
  }
  throw lastErr
}

export function totalMarksOf(data) {
  return data.questions.reduce((sum, q) => sum + q.marks, 0)
}
