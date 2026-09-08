export function totalMarksOf(data) {
  return data.questions.reduce((sum, q) => sum + q.marks, 0)
}

export function getLiveQuiz(data) {
  return (data.quizzes || []).find((q) => q.status === 'LIVE') || null
}

export function quizStats(data, quizId) {
  const attemptsForQuiz = (data.attempts || {})[quizId] || {}
  const rollNumbers = Object.keys(attemptsForQuiz)
  const totalMarks = totalMarksOf(data)
  const bestScores = rollNumbers.map((rn) => Math.max(...attemptsForQuiz[rn].map((a) => a.score)))
  const averageScore =
    bestScores.length && totalMarks
      ? Math.round((bestScores.reduce((a, b) => a + b, 0) / bestScores.length / totalMarks) * 100)
      : 0
  return { completed: rollNumbers.length, averageScore, studentsOnline: rollNumbers.length }
}
