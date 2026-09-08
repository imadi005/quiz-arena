import { useEffect, useState, useRef } from 'react'
import Papa from 'papaparse'
import { Search, UploadCloud, UserPlus } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { studentsApi } from '@/services/studentsApi'
import type { Student } from '@/types'

export function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [lastTempPassword, setLastTempPassword] = useState<{ rollNumber: string; password: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)

  const loadStudents = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await studentsApi.list()
      setStudents(res.students)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load students.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleResetPassword = async (rollNumber: string) => {
    try {
      const res = await studentsApi.resetPassword(rollNumber)
      setLastTempPassword({ rollNumber, password: res.temporaryPassword })
      loadStudents()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not reset password.')
    }
  }

  const handleCsvFile = async (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as Record<string, string>[]).map((r) => ({
          rollNumber: r['Roll Number'] ?? r['rollNumber'] ?? '',
          name: r['Name'] ?? r['name'] ?? '',
          collegeEmail: r['College Email'] ?? r['collegeEmail'] ?? r['Email'] ?? '',
        }))
        try {
          const res = await studentsApi.importCsv(rows)
          setImportSummary(`Imported ${res.created} students, skipped ${res.skipped}.`)
          loadStudents()
        } catch (err) {
          setImportSummary(err instanceof Error ? err.message : 'Import failed.')
        }
      },
    })
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <AdminLayout>
      <PageHeader
        title="Students"
        subtitle={loading ? 'Loading…' : `${students.length} students registered`}
        action={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleCsvFile(file)
                e.target.value = ''
              }}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={16} /> Import CSV
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} /> Add Student
            </Button>
          </div>
        }
      />

      {loadError && (
        <Card className="mb-4 border-state-danger/40 bg-state-danger/10 p-4 text-sm text-state-danger">
          {loadError}
          {loadError.includes('not configured') && (
            <p className="mt-1 text-xs text-ink-faint">
              Set VITE_API_URL in frontend/.env once the API stack is deployed (Phase 3 —
              QuizArena-Api-dev).
            </p>
          )}
        </Card>
      )}

      {importSummary && (
        <Card className="mb-4 border-signal-blue/40 bg-signal-blue/10 p-4 text-sm text-signal-blue">
          {importSummary}
        </Card>
      )}

      {lastTempPassword && (
        <Card className="mb-4 border-state-answered/40 bg-state-answered/10 p-4 text-sm">
          <p className="text-state-answered">
            New temporary password for <span className="font-mono-num">{lastTempPassword.rollNumber}</span>:{' '}
            <span className="font-mono-num font-bold">{lastTempPassword.password}</span>
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            This is shown once — copy it now and hand it to the student directly.
          </p>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or roll number…"
            className="w-full rounded-lg border border-border-subtle bg-surface-raised py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-signal-blue focus:outline-none focus:ring-2 focus:ring-signal-blue/40"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-ink-faint">
                <th className="py-2.5 pr-4 font-semibold">Roll Number</th>
                <th className="py-2.5 pr-4 font-semibold">Name</th>
                <th className="py-2.5 pr-4 font-semibold">College Email</th>
                <th className="py-2.5 pr-4 font-semibold">First Login</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.rollNumber} className="border-b border-border-subtle/60 last:border-0">
                  <td className="py-3 pr-4 font-mono-num text-ink">{s.rollNumber}</td>
                  <td className="py-3 pr-4 text-ink">{s.name}</td>
                  <td className="py-3 pr-4 text-ink-muted">{s.collegeEmail}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={s.firstLogin ? 'warning' : 'answered'}>
                      {s.firstLogin ? 'Pending' : 'Done'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={s.status === 'ACTIVE' ? 'answered' : 'neutral'}>{s.status}</Badge>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleResetPassword(s.rollNumber)}
                      className="text-xs font-semibold text-signal-blue hover:underline"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-ink-faint">
                    {students.length === 0 ? 'No students yet.' : `No students match "${query}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onCreated={(rollNumber, password) => {
            setLastTempPassword({ rollNumber, password })
            setShowAddModal(false)
            loadStudents()
          }}
        />
      )}
    </AdminLayout>
  )
}

function AddStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (rollNumber: string, password: string) => void
}) {
  const [rollNumber, setRollNumber] = useState('')
  const [name, setName] = useState('')
  const [collegeEmail, setCollegeEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!rollNumber.trim() || !name.trim() || !collegeEmail.trim()) {
      setError('All fields are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await studentsApi.create({
        rollNumber: rollNumber.trim().toUpperCase(),
        name: name.trim(),
        collegeEmail: collegeEmail.trim(),
      })
      onCreated(res.student.rollNumber, res.temporaryPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create student.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add Student" onClose={onClose}>
      <div className="space-y-4">
        <Input label="Roll Number" placeholder="KJ23MCA001" value={rollNumber} onChange={(e) => setRollNumber(e.target.value.toUpperCase())} />
        <Input label="Name" placeholder="Rahul Singh" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="College Email" type="email" placeholder="rahul@college.edu" value={collegeEmail} onChange={(e) => setCollegeEmail(e.target.value)} />
        {error && <p className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">{error}</p>}
        <Button fullWidth onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Student'}
        </Button>
      </div>
    </Modal>
  )
}
