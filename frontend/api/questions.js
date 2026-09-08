import { getData } from './_lib/github.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  try {
    const { data } = await getData()
    const publicQuestions = data.questions.map(({ correctAnswer, ...rest }) => rest)
    res.status(200).json(publicQuestions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
