import { getData, saveData } from '../_lib/github.js'
import { quizStats } from '../_lib/quiz.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data } = await getData()
      const list = (data.quizzes || []).map((q) => ({
        ...q,
        questionCount: data.questions.length,
        ...quizStats(data, q.quizId),
      }))
      res.status(200).json(list)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
    return
  }

  if (req.method === 'POST') {
    const { title, description, duration } = req.body || {}
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'title is required.' })
    }
    try {
      let created
      await saveData((data) => {
        created = {
          quizId: `quiz${Date.now()}`,
          title: String(title).trim(),
          description: description ? String(description).trim() : '',
          duration: Number(duration) || 10,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
        }
        data.quizzes = data.quizzes || []
        data.quizzes.push(created)
        return data
      })
      res.status(201).json(created)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
}
