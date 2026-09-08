// Quiz Arena — local server.
// Runs entirely on one machine (or a college LAN) with no internet or AWS dependency.
// Serves quiz questions, tracks attempts per roll number, and the leaderboard.

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 4000
const DATA_FILE = path.join(__dirname, 'data.json')
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist')
const MAX_ATTEMPTS = 3

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function totalMarksOf(data) {
  return data.questions.reduce((sum, q) => sum + q.marks, 0)
}

const app = express()
app.use(cors())
app.use(express.json())

// --- Student-facing quiz flow -------------------------------------------

app.get('/api/questions', (req, res) => {
  const data = loadData()
  const publicQuestions = data.questions.map(({ correctAnswer, ...rest }) => rest)
  res.json(publicQuestions)
})

app.get('/api/attempts/:rollNumber', (req, res) => {
  const data = loadData()
  const rollNumber = req.params.rollNumber.trim().toUpperCase()
  const attempts = data.attempts[rollNumber] || []
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null

  res.json({
    rollNumber,
    attemptsUsed: attempts.length,
    maxAttempts: MAX_ATTEMPTS,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts.length),
    bestScore,
    totalMarks: totalMarksOf(data),
  })
})

app.post('/api/submit', (req, res) => {
  const data = loadData()
  const rollNumber = String(req.body.rollNumber || '').trim().toUpperCase()
  const name = String(req.body.name || '').trim()
  const answers = req.body.answers

  if (!rollNumber) return res.status(400).json({ message: 'Roll number is required.' })
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'Answers must be an array.' })
  if (data.questions.length === 0) {
    return res.status(409).json({ message: 'No questions have been added yet. Ask your admin to add questions.' })
  }

  const existing = data.attempts[rollNumber] || []
  if (existing.length >= MAX_ATTEMPTS) {
    return res.status(409).json({ message: 'No attempts remaining for this roll number.' })
  }

  let score = 0
  data.questions.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) score += q.marks
  })

  const attempt = { score, totalMarks: totalMarksOf(data), submittedAt: new Date().toISOString() }
  data.attempts[rollNumber] = [...existing, attempt]
  if (name) {
    data.names = data.names || {}
    data.names[rollNumber] = name
  }
  saveData(data)

  const attemptsUsed = data.attempts[rollNumber].length
  res.json({
    score,
    totalMarks: attempt.totalMarks,
    attemptsUsed,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attemptsUsed),
  })
})

// --- Leaderboard ----------------------------------------------------------

app.get('/api/leaderboard', (req, res) => {
  const data = loadData()
  const names = data.names || {}

  const rows = Object.entries(data.attempts)
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

  res.json(rows)
})

// --- Admin: question bank management --------------------------------------

app.get('/api/admin/questions', (req, res) => {
  const data = loadData()
  res.json(data.questions)
})

app.post('/api/admin/questions', (req, res) => {
  const { questionText, options, correctAnswer, marks, difficulty, category } = req.body

  if (!questionText || !Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ message: 'questionText and exactly 4 options are required.' })
  }
  if (![0, 1, 2, 3].includes(correctAnswer)) {
    return res.status(400).json({ message: 'correctAnswer must be 0, 1, 2 or 3.' })
  }

  const data = loadData()
  const question = {
    questionId: `q${Date.now()}`,
    questionText: String(questionText),
    options,
    correctAnswer,
    marks: Number(marks) || 1,
    difficulty: difficulty || 'Medium',
    category: category || 'General',
  }
  data.questions.push(question)
  saveData(data)
  res.status(201).json(question)
})

app.delete('/api/admin/questions/:questionId', (req, res) => {
  const data = loadData()
  const before = data.questions.length
  data.questions = data.questions.filter((q) => q.questionId !== req.params.questionId)
  if (data.questions.length === before) {
    return res.status(404).json({ message: 'Question not found.' })
  }
  saveData(data)
  res.status(204).end()
})

// --- Serve the built frontend (classroom/production mode) -----------------

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quiz Arena local server running on http://0.0.0.0:${PORT}`)
  console.log('On the classroom LAN, students open http://<this-machine-ip>:' + PORT)
})
