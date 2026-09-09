import { getData, saveData, setReadCache } from '../_lib/github.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data } = await getData()
      setReadCache(res)
      res.status(200).json(data.questions)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
    return
  }

  if (req.method === 'POST') {
    const { questionText, options, correctAnswer, marks, difficulty, category } = req.body || {}
    if (!questionText || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: 'questionText and exactly 4 options are required.' })
    }
    if (![0, 1, 2, 3].includes(correctAnswer)) {
      return res.status(400).json({ message: 'correctAnswer must be 0, 1, 2 or 3.' })
    }
    try {
      let created
      await saveData((data) => {
        created = {
          questionId: `q${Date.now()}`,
          questionText: String(questionText),
          options,
          correctAnswer,
          marks: Number(marks) || 1,
          difficulty: difficulty || 'Medium',
          category: category || 'General',
        }
        data.questions.push(created)
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
