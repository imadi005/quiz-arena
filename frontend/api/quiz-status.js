import { getData, setReadCache } from './_lib/github.js'
import { getLiveQuiz } from './_lib/quiz.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  try {
    const { data } = await getData()
    const live = getLiveQuiz(data)
    // Students poll this endpoint while taking a quiz. Keep it short enough
    // that an admin pause/end reaches them promptly, while still sharing one
    // GitHub read between every student on the same Vercel edge.
    setReadCache(res, { sMaxAge: 5, staleWhileRevalidate: 5 })
    if (!live) return res.status(200).json({ live: false })
    res.status(200).json({
      live: true,
      quizId: live.quizId,
      title: live.title,
      duration: live.duration,
      questionCount: data.questions.length,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
