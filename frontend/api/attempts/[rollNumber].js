import { getData, totalMarksOf } from '../_lib/github.js'

const MAX_ATTEMPTS = 3

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const rollNumber = String(req.query.rollNumber || '').trim().toUpperCase()
  const quizId = req.query.quizId
  if (!quizId) return res.status(400).json({ message: 'quizId is required.' })

  try {
    const { data } = await getData()
    const attemptsForQuiz = (data.attempts || {})[quizId] || {}
    const attempts = attemptsForQuiz[rollNumber] || []
    const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null
    res.status(200).json({
      rollNumber,
      quizId,
      attemptsUsed: attempts.length,
      maxAttempts: MAX_ATTEMPTS,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts.length),
      bestScore,
      totalMarks: totalMarksOf(data),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
