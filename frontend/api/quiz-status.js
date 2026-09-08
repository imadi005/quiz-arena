import { getData } from './_lib/github.js'
import { getLiveQuiz } from './_lib/quiz.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  try {
    const { data } = await getData()
    const live = getLiveQuiz(data)
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
