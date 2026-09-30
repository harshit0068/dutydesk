import { useEffect, useMemo, useState } from 'react'
import { loadAll } from './lib/data'
import { allocate, type Assignment } from './lib/allocate'
import { eligibleFor } from './lib/eligible'
import { loadDuties, saveDuties, clearDuties } from './lib/duties'
import type { AllData } from './lib/types'

type Member = { faculty_id: number; name: string }

type Row = {
id: number
date: string
start: string
session: string
subject: string
hall: string
needed: number
members: Member[]
}

function errorText(e: unknown): string {
if (e instanceof Error) return e.message
if (e && typeof e === 'object' && 'message' in e) {
return String((e as { message: unknown }).message)
}
return String(e)
}

export default function App() {
const [data, setData] = useState<AllData | null>(null)
const [assignments, setAssignments] = useState<Assignment[]>([])
const [unsaved, setUnsaved] = useState(false)
const [busy, setBusy] = useState(false)
const [message, setMessage] = useState('')
const [error, setError] = useState('')
const [dateFilter, setDateFilter] = useState('all')
const [editMode, setEditMode] = useState(false)

useEffect(() => {
async function init() {
try {
const [all, saved] = await Promise.all([loadAll(), loadDuties()])
setData(all)
setAssignments(
saved.map((d) => ({
exam_hall_id: d.exam_hall_id,
faculty_id: d.faculty_id,
}))
)
} catch (e) {
setError(errorText(e))
}
}
init()
}, [])

const view = useMemo(() => {
if (!data) return null



const facultyById = new Map(data.faculty.map((f) => [f.id, f]))
const examById = new Map(data.exams.map((e) => [e.id, e]))
const hallById = new Map(data.halls.map((h) => [h.id, h]))

const counts: Record<number, number> = {}
for (const f of data.faculty) counts[f.id] = 0
for (const a of assignments) {
  counts[a.faculty_id] = (counts[a.faculty_id] ?? 0) + 1
}

const rows: Row[] = []
let totalSeats = 0
let shortHalls = 0

for (const eh of data.examHalls) {
  const exam = examById.get(eh.exam_id)
  if (!exam) continue
  const members: Member[] = assignments
    .filter((a) => a.exam_hall_id === eh.id)
    .map((a) => ({
      faculty_id: a.faculty_id,
      name: facultyById.get(a.faculty_id)?.name ?? 'Unknown',
    }))
  totalSeats += eh.invigilators_needed
  if (members.length < eh.invigilators_needed) shortHalls += 1
  rows.push({
    id: eh.id,
    date: exam.exam_date,
    start: exam.start_time,
    session: exam.session,
    subject: exam.subject,
    hall: hallById.get(eh.hall_id)?.name ?? '',
    needed: eh.invigilators_needed,
    members,
  })
}

rows.sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.start.localeCompare(b.start) ||
    a.hall.localeCompare(b.hall)
)

const values = Object.values(counts)
const spread = values.length ? Math.max(...values) - Math.min(...values) : 0
const fairness = Math.max(0, 100 - spread * 10)
const dates = Array.from(new Set(rows.map((r) => r.date)))

return { rows, totalSeats, shortHalls, fairness, dates }
}, [data, assignments])

function options(examHallId: number, replacingId?: number) {
if (!data) return []
return eligibleFor(data, assignments, examHallId, replacingId)
}

function handleGenerate() {
if (!data) return
const result = allocate(data)
setAssignments(result.assignments)
setUnsaved(true)
setError('')
setMessage('New chart generated. Save it to keep it.')
}

function replaceMember(examHallId: number, oldId: number, newId: number) {
setAssignments((prev) =>
prev.map((a) =>
a.exam_hall_id === examHallId && a.faculty_id === oldId
? { exam_hall_id: examHallId, faculty_id: newId }
: a
)
)
setUnsaved(true)
setMessage('Invigilator replaced. Save the chart to keep the change.')
}

function addMember(examHallId: number, newId: number) {
setAssignments((prev) => [...prev, { exam_hall_id: examHallId, faculty_id: newId }])
setUnsaved(true)
setMessage('Invigilator added. Save the chart to keep the change.')
}

function removeMember(examHallId: number, oldId: number) {
setAssignments((prev) =>
prev.filter((a) => !(a.exam_hall_id === examHallId && a.faculty_id === oldId))
)
setUnsaved(true)
setMessage('Invigilator removed. Save the chart to keep the change.')
}

async function handleSave() {
setBusy(true)
setError('')
try {
await saveDuties(assignments)
setUnsaved(false)
setMessage('Duty chart saved to the database.')
} catch (e) {
setError(errorText(e))
} finally {
setBusy(false)
}
}

async function handleClear() {
setBusy(true)
setError('')
try {
await clearDuties()
setAssignments([])
setUnsaved(false)
setEditMode(false)
setMessage('Duty chart cleared.')
} catch (e) {
setError(errorText(e))
} finally {
setBusy(false)
}
}

function downloadCsv() {
if (!view) return
const lines = ['Date,Session,Subject,Hall,Invigilators']
for (const r of view.rows) {
lines.push(
[r.date, r.session, r.subject, r.hall, r.members.map((m) => m.name).join(' & ')]
.map((v) => '"' + v + '"')
.join(',')
)
}
const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = 'duty-chart.csv'
link.click()
URL.revokeObjectURL(url)
}

const hasChart = assignments.length > 0
const shownRows = view
? view.rows.filter((r) => dateFilter === 'all' || r.date === dateFilter)
: []

return (
<div className="min-h-screen bg-slate-50 p-6">
<div className="mx-auto max-w-5xl">
<h1 className="text-3xl font-bold text-indigo-600">DutyDesk</h1>
<p className="mt-1 text-slate-500">Invigilator duty allocation</p>



    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={!data || busy}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
      >
        Generate duty chart
      </button>
      <button
        onClick={handleSave}
        disabled={!unsaved || !hasChart || busy}
        className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-40"
      >
        {busy ? 'Working...' : 'Save chart'}
      </button>
      <button
        onClick={() => setEditMode((v) => !v)}
        disabled={!hasChart}
        className={
          'rounded-lg px-5 py-2.5 font-semibold shadow disabled:opacity-40 ' +
          (editMode
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-white text-slate-700 hover:bg-slate-100')
        }
      >
        {editMode ? 'Done editing' : 'Edit mode'}
      </button>
      <button
        onClick={downloadCsv}
        disabled={!hasChart}
        className="rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-700 shadow hover:bg-slate-100 disabled:opacity-40"
      >
        Export CSV
      </button>
      <button
        onClick={handleClear}
        disabled={!hasChart || busy}
        className="rounded-lg bg-white px-5 py-2.5 font-semibold text-red-600 shadow hover:bg-red-50 disabled:opacity-40"
      >
        Clear
      </button>
      {unsaved && (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
          Unsaved changes
        </span>
      )}
    </div>

    {message && !error && (
      <p className="mt-3 text-sm text-slate-600">{message}</p>
    )}
    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

    {view && (
      <>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">
              {assignments.length} / {view.totalSeats}
            </div>
            <div className="text-sm text-slate-500">Seats filled</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">
              {hasChart ? view.fairness : '-'}
            </div>
            <div className="text-sm text-slate-500">Fairness score</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">
              {hasChart ? view.shortHalls : '-'}
            </div>
            <div className="text-sm text-slate-500">Halls short of staff</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['all', ...view.dates].map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={
                'rounded-full px-4 py-1.5 text-sm font-medium ' +
                (dateFilter === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 shadow hover:bg-slate-100')
              }
            >
              {d === 'all' ? 'All days' : d}
            </button>
          ))}
        </div>

        {!hasChart ? (
          <div className="mt-6 rounded-xl bg-white p-10 text-center text-slate-500 shadow">
            No duty chart yet. Click Generate duty chart to create one.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Hall</th>
                  <th className="p-3">Invigilators</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((r) => {
                  const missing = r.needed - r.members.length
                  const addList = editMode && missing > 0 ? options(r.id) : []
                  return (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="p-3">{r.date}</td>
                      <td className="p-3">{r.session}</td>
                      <td className="p-3">{r.subject}</td>
                      <td className="p-3">{r.hall}</td>
                      <td className="p-3">
                        <div className="space-y-2">
                          {r.members.map((m) => {
                            const list = editMode ? options(r.id, m.faculty_id) : []
                            return (
                              <div
                                key={m.faculty_id}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span>{m.name}</span>
                                {editMode && (
                                  <>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          replaceMember(
                                            r.id,
                                            m.faculty_id,
                                            Number(e.target.value)
                                          )
                                        }
                                      }}
                                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                                    >
                                      <option value="">
                                        {list.length ? 'Replace with...' : 'No one free'}
                                      </option>
                                      {list.map((c) => (
                                        <option key={c.faculty.id} value={c.faculty.id}>
                                          {c.faculty.name} ({c.duties} duties)
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => removeMember(r.id, m.faculty_id)}
                                      className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          })}
                          {missing > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-red-600">
                                Short by {missing}
                              </span>
                              {editMode && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addMember(r.id, Number(e.target.value))
                                    }
                                  }}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                                >
                                  <option value="">
                                    {addList.length ? 'Add invigilator...' : 'No one free'}
                                  </option>
                                  {addList.map((c) => (
                                    <option key={c.faculty.id} value={c.faculty.id}>
                                      {c.faculty.name} ({c.duties} duties)
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </div>
</div>
)
}