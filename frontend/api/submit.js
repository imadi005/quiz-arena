import { saveData, totalMarksOf } from './_lib/github.js'

const MAX_ATTEMPTS = 3

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { quizId, rollNumber: rawRoll, name: rawName, answers } = req.body || {}
  const rollNumber = String(rawRoll || '').trim().toUpperCase()
  const name = String(rawName || '').trim()

  if (!quizId) return res.status(400).json({ message: 'quizId is required.' })
  if (!rollNumber) return res.status(400).json({ message: 'Roll number is required.' })
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'Answers must be an array.' })

  try {
    let result
    await saveData((data) => {
      const quiz = (data.quizzes || []).find((q) => q.quizId === quizId)
      if (!quiz) throw Object.assign(new Error('Quiz not found.'), { status: 404 })
      // Deliberately no LIVE-only check here: a student already mid-test (started while
      // it was live) must still be able to submit even if the admin pauses/ends it
      // in the meantime — the frontend auto-submits on that transition (see QuizPage).
      if (data.questions.length === 0) {
        throw Object.assign(new Error('No questions have been added yet. Ask your admin to add questions.'), {
          status: 409,
        })
      }

      data.attempts[quizId] = data.attempts[quizId] || {}
      const existing = data.attempts[quizId][rollNumber] || []
      if (existing.length >= MAX_ATTEMPTS) {
        throw Object.assign(new Error('No attempts remaining for this roll number.'), { status: 409 })
      }

      let score = 0
      data.questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) score += q.marks
      })

      const attempt = { score, totalMarks: totalMarksOf(data), submittedAt: new Date().toISOString() }
      data.attempts[quizId][rollNumber] = [...existing, attempt]
      if (name) {
        data.names = data.names || {}
        data.names[rollNumber] = name
      }

      const attemptsUsed = data.attempts[quizId][rollNumber].length
      result = {
        score,
        totalMarks: attempt.totalMarks,
        attemptsUsed,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attemptsUsed),
      }
      return data
    })
    res.status(200).json(result)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
