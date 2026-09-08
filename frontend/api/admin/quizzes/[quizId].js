import { saveData } from '../../_lib/github.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' })
  const { quizId } = req.query
  const { action } = req.body || {}

  try {
    let updated
    await saveData((data) => {
      const quiz = (data.quizzes || []).find((q) => q.quizId === quizId)
      if (!quiz) throw Object.assign(new Error('Quiz not found.'), { status: 404 })

      if (action === 'start') {
        data.quizzes.forEach((q) => {
          if (q.status === 'LIVE') q.status = 'PAUSED'
        })
        quiz.status = 'LIVE'
      } else if (action === 'pause') {
        if (quiz.status !== 'LIVE') throw Object.assign(new Error('Quiz is not live.'), { status: 409 })
        quiz.status = 'PAUSED'
      } else if (action === 'end') {
        quiz.status = 'COMPLETED'
      } else {
        throw Object.assign(new Error('Unknown action. Use start, pause, or end.'), { status: 400 })
      }

      updated = quiz
      return data
    })
    res.status(200).json(updated)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
