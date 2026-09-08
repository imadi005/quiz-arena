import { getData } from './_lib/github.js'
import { getLiveQuiz } from './_lib/quiz.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  try {
    const { data } = await getData()
    const quizId = req.query.quizId || (getLiveQuiz(data) || {}).quizId
    if (!quizId) return res.status(200).json([])

    const names = data.names || {}
    const attemptsForQuiz = (data.attempts || {})[quizId] || {}

    const rows = Object.entries(attemptsForQuiz)
      .filter(([, attempts]) => attempts.length > 0)
      .map(([rollNumber, attempts]) => {
        const best = attempts.reduce((max, a) => (a.score > max.score ? a : max), attempts[0])
        return {
          rollNumber,
          name: names[rollNumber] || rollNumber,
          score: best.score,
          totalMarks: best.totalMarks,
          accuracy: best.totalMarks ? Math.round((best.score / best.totalMarks) * 1000) / 10 : 0,
          submittedAt: best.submittedAt,
        }
      })

    rows.sort((a, b) => b.score - a.score || new Date(a.submittedAt) - new Date(b.submittedAt))
    rows.forEach((r, i) => {
      r.rank = i + 1
    })

    res.status(200).json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
