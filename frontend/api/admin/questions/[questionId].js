import { saveData } from '../../_lib/github.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' })
  const { questionId } = req.query
  try {
    let found = true
    await saveData((data) => {
      const before = data.questions.length
      data.questions = data.questions.filter((q) => q.questionId !== questionId)
      found = data.questions.length !== before
      return data
    })
    if (!found) return res.status(404).json({ message: 'Question not found.' })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
