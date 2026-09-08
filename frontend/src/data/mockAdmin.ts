import type { Student, Question, Quiz, LiveStudent, LeaderboardEntry } from '@/types'

// All data here is illustrative only — replaced by real API calls
// starting Phase 3 (students), Phase 4 (questions), Phase 5 (quizzes),
// Phase 9 (live monitor), Phase 10 (leaderboard).

export const mockStudents: Student[] = [
  { studentId: '1', rollNumber: 'KJ23MCA001', name: 'Rahul Singh', collegeEmail: 'rahul@college.edu', status: 'ACTIVE', firstLogin: false, createdAt: '2026-06-12' },
  { studentId: '2', rollNumber: 'KJ23MCA002', name: 'Priya Sharma', collegeEmail: 'priya@college.edu', status: 'ACTIVE', firstLogin: false, createdAt: '2026-06-12' },
  { studentId: '3', rollNumber: 'KJ23MCA003', name: 'Aman Kumar', collegeEmail: 'aman@college.edu', status: 'ACTIVE', firstLogin: true, createdAt: '2026-06-14' },
  { studentId: '4', rollNumber: 'KJ23MCA004', name: 'Rohan Verma', collegeEmail: 'rohan@college.edu', status: 'ACTIVE', firstLogin: false, createdAt: '2026-06-14' },
  { studentId: '5', rollNumber: 'KJ23MCA005', name: 'Simran Kaur', collegeEmail: 'simran@college.edu', status: 'INACTIVE', firstLogin: true, createdAt: '2026-06-20' },
]

export const mockQuestions: Question[] = [
  { questionId: 'q1', questionText: 'Which AWS service provides object storage?', options: ['Amazon EC2', 'Amazon S3', 'Amazon RDS', 'Amazon VPC'], correctAnswer: 1, marks: 1, difficulty: 'Easy', category: 'AWS' },
  { questionId: 'q2', questionText: 'Which service is a fully managed NoSQL database?', options: ['Amazon RDS', 'Amazon Redshift', 'Amazon DynamoDB', 'Amazon Aurora'], correctAnswer: 2, marks: 1, difficulty: 'Medium', category: 'Database' },
  { questionId: 'q3', questionText: 'What does IAM stand for?', options: ['Internal Access Manager', 'Identity and Access Management', 'Instance Access Module', 'Integrated App Manager'], correctAnswer: 1, marks: 1, difficulty: 'Easy', category: 'AWS' },
  { questionId: 'q4', questionText: 'Which command lists running Docker containers?', options: ['docker ls', 'docker ps', 'docker list', 'docker show'], correctAnswer: 1, marks: 1, difficulty: 'Medium', category: 'Docker' },
]

export const mockQuizzes: Quiz[] = [
  { quizId: 'quiz1', title: 'AWS Cloud Challenge', description: 'Core AWS services quiz', questionCount: 30, duration: 30, difficulty: 'Medium', status: 'LIVE', malpracticeLimit: 3, navigation: 'Free Navigation', studentsOnline: 87, completed: 31, averageScore: 72 },
  { quizId: 'quiz2', title: 'Networking Fundamentals', description: 'OSI, TCP/IP, subnetting', questionCount: 20, duration: 20, difficulty: 'Easy', status: 'SCHEDULED', malpracticeLimit: 3, navigation: 'Sequential Navigation', studentsOnline: 0, completed: 0, averageScore: 0 },
  { quizId: 'quiz3', title: 'Docker & DevOps Basics', description: 'Containers, CI/CD basics', questionCount: 25, duration: 25, difficulty: 'Medium', status: 'DRAFT', malpracticeLimit: 2, navigation: 'Free Navigation', studentsOnline: 0, completed: 0, averageScore: 0 },
  { quizId: 'quiz4', title: 'Linux Essentials', description: 'Shell, permissions, processes', questionCount: 40, duration: 40, difficulty: 'Hard', status: 'COMPLETED', malpracticeLimit: 3, navigation: 'Free Navigation', studentsOnline: 0, completed: 96, averageScore: 68 },
]

export const mockLiveStudents: LiveStudent[] = [
  { rollNumber: 'KJ23MCA001', name: 'Rahul Singh', status: 'NORMAL', violations: 0, malpracticeLimit: 3, currentQuestion: 12, totalQuestions: 30 },
  { rollNumber: 'KJ23MCA002', name: 'Priya Sharma', status: 'WARNING', violations: 1, malpracticeLimit: 3, currentQuestion: 18, totalQuestions: 30 },
  { rollNumber: 'KJ23MCA003', name: 'Aman Kumar', status: 'WARNING', violations: 2, malpracticeLimit: 3, currentQuestion: 21, totalQuestions: 30 },
  { rollNumber: 'KJ23MCA004', name: 'Rohan Verma', status: 'CRITICAL', violations: 3, malpracticeLimit: 3, currentQuestion: 24, totalQuestions: 30 },
  { rollNumber: 'KJ23MCA006', name: 'Arjun Mehta', status: 'TERMINATED', violations: 4, malpracticeLimit: 3, currentQuestion: 19, totalQuestions: 30 },
  { rollNumber: 'KJ23MCA007', name: 'Neha Gupta', status: 'NORMAL', violations: 0, malpracticeLimit: 3, currentQuestion: 9, totalQuestions: 30 },
]

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, rollNumber: 'KJ23MCA001', name: 'Rahul Singh', score: 28, totalMarks: 30, accuracy: 93.3 },
  { rank: 2, rollNumber: 'KJ23MCA002', name: 'Priya Sharma', score: 27, totalMarks: 30, accuracy: 90.0 },
  { rank: 3, rollNumber: 'KJ23MCA003', name: 'Aman Kumar', score: 26, totalMarks: 30, accuracy: 86.7 },
  { rank: 4, rollNumber: 'KJ23MCA004', name: 'Rohan Verma', score: 25, totalMarks: 30, accuracy: 83.3 },
  { rank: 5, rollNumber: 'KJ23MCA008', name: 'Karan Patel', score: 23, totalMarks: 30, accuracy: 76.7 },
]
