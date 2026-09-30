import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { loadAll } from './lib/data'
import type { AllData } from './lib/types'

type Section = 'faculty' | 'leave' | 'exams'

const inputClass =
'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800'
const primaryBtn =
'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50'
const deleteBtn =
'rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50'

function errorText(e: unknown): string {
if (e instanceof Error) return e.message
if (e && typeof e === 'object' && 'message' in e) {
return String((e as { message: unknown }).message)
}
return String(e)
}

export default function Manage() {
const [data, setData] = useState<AllData | null>(null)
const [section, setSection] = useState<Section>('faculty')
const [busy, setBusy] = useState(false)
const [message, setMessage] = useState('')
const [error, setError] = useState('')

const [fName, setFName] = useState('')
const [fEmail, setFEmail] = useState('')
const [fDept, setFDept] = useState('')

const [lFaculty, setLFaculty] = useState('')
const [lFrom, setLFrom] = useState('')
const [lTo, setLTo] = useState('')
const [lReason, setLReason] = useState('')

const [eDate, setEDate] = useState('')
const [eSession, setESession] = useState('FN')
const [eStart, setEStart] = useState('09:30')
const [eEnd, setEEnd] = useState('12:30')
const [eDept, setEDept] = useState('')
const [eSubject, setESubject] = useState('')
const [eHalls, setEHalls] = useState<number[]>([])
const [eNeeded, setENeeded] = useState(2)

async function refresh() {
const all = await loadAll()
setData(all)
}

useEffect(() => {
refresh().catch((e) => setError(errorText(e)))
}, [])

async function run(action: () => Promise<void>, okMessage: string) {
setBusy(true)
setError('')
setMessage('')
try {
await action()
await refresh()
setMessage(okMessage)
} catch (e) {
setError(errorText(e))
} finally {
setBusy(false)
}
}

function addFaculty() {
if (!fName.trim()) {
setError('Enter a name for the faculty member.')
return
}
run(async () => {
const { error: err } = await supabase.from('faculty').insert({
name: fName.trim(),
email: fEmail.trim() || null,
department_id: fDept ? Number(fDept) : null,
})
if (err) throw err
setFName('')
setFEmail('')
}, 'Faculty member added. Regenerate the duty chart on the Admin tab to include them.')
}

function deleteFaculty(id: number, name: string) {
if (!window.confirm('Delete ' + name + ' and all their duties?')) return
run(async () => {
const r1 = await supabase.from('duties').delete().eq('faculty_id', id)
if (r1.error) throw r1.error
const r2 = await supabase.from('faculty').delete().eq('id', id)
if (r2.error) throw r2.error
}, 'Faculty member deleted.')
}

function addLeave() {
if (!lFaculty || !lFrom || !lTo) {
setError('Choose a faculty member and both dates.')
return
}
if (lTo < lFrom) {
setError('The end date cannot be before the start date.')
return
}
run(async () => {
const { error: err } = await supabase.from('unavailability').insert({
faculty_id: Number(lFaculty),
from_date: lFrom,
to_date: lTo,
reason: lReason.trim() || null,
})
if (err) throw err
setLReason('')
}, 'Leave added. Regenerate the duty chart so the rule is applied.')
}

function deleteLeave(id: number) {
run(async () => {
const { error: err } = await supabase.from('unavailability').delete().eq('id', id)
if (err) throw err
}, 'Leave entry deleted.')
}

function changeSession(value: string) {
setESession(value)
if (value === 'FN') {
setEStart('09:30')
setEEnd('12:30')
} else {
setEStart('13:30')
setEEnd('16:30')
}
}

function toggleHall(id: number) {
setEHalls((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]))
}

function addExam() {
if (!eDate || !eSubject.trim()) {
setError('Enter the exam date and subject.')
return
}
if (eHalls.length === 0) {
setError('Select at least one hall.')
return
}
if (eEnd <= eStart) {
setError('The end time must be after the start time.')
return
}
run(async () => {
const created = await supabase
.from('exams')
.insert({
exam_date: eDate,
session: eSession,
start_time: eStart,
end_time: eEnd,
department_id: eDept ? Number(eDept) : null,
subject: eSubject.trim(),
})
.select()
.single()
if (created.error) throw created.error
const rows = eHalls.map((h) => ({
exam_id: created.data.id,
hall_id: h,
invigilators_needed: eNeeded,
}))
const halls = await supabase.from('exam_halls').insert(rows)
if (halls.error) throw halls.error
setESubject('')
setEHalls([])
}, 'Exam added. Regenerate the duty chart on the Admin tab.')
}

function deleteExam(id: number, subject: string) {
if (!window.confirm('Delete the exam "' + subject + '" and its duties?')) return
run(async () => {
const { error: err } = await supabase.from('exams').delete().eq('id', id)
if (err) throw err
}, 'Exam deleted.')
}

function sectionClass(name: Section) {
return (
'rounded-full px-4 py-1.5 text-sm font-medium ' +
(section === name
? 'bg-indigo-600 text-white'
: 'bg-white text-slate-600 shadow hover:bg-slate-100')
)
}

const deptName = (id: number | null) =>
data?.departments.find((d) => d.id === id)?.name ?? 'None'
const facultyName = (id: number) => data?.faculty.find((f) => f.id === id)?.name ?? 'Unknown'
const hallsForExam = (examId: number) =>
(data?.examHalls ?? [])
.filter((eh) => eh.exam_id === examId)
.map((eh) => data?.halls.find((h) => h.id === eh.hall_id)?.name ?? '')
.join(', ')

const sortedExams = data
? [...data.exams].sort(
(a, b) => a.exam_date.localeCompare(b.exam_date) || a.start_time.localeCompare(b.start_time)
)
: []

return (
<div className="min-h-screen bg-slate-50 p-6">
<div className="mx-auto max-w-5xl">
<h1 className="text-3xl font-bold text-indigo-600">Manage data</h1>
<p className="mt-1 text-slate-500">Add or remove faculty, leave and exams</p>



    <div className="mt-6 flex flex-wrap gap-2">
      <button onClick={() => setSection('faculty')} className={sectionClass('faculty')}>
        Faculty
      </button>
      <button onClick={() => setSection('leave')} className={sectionClass('leave')}>
        Leave
      </button>
      <button onClick={() => setSection('exams')} className={sectionClass('exams')}>
        Exams
      </button>
    </div>

    {message && !error && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

    {data && section === 'faculty' && (
      <>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 shadow">
          <input
            className={inputClass}
            placeholder="Full name"
            value={fName}
            onChange={(e) => setFName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Email (optional)"
            value={fEmail}
            onChange={(e) => setFEmail(e.target.value)}
          />
          <select
            className={inputClass}
            value={fDept}
            onChange={(e) => setFDept(e.target.value)}
          >
            <option value="">No department</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button className={primaryBtn} onClick={addFaculty} disabled={busy}>
            Add faculty
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Email</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.faculty.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="p-3">{f.name}</td>
                  <td className="p-3">{deptName(f.department_id)}</td>
                  <td className="p-3">{f.email ?? ''}</td>
                  <td className="p-3 text-right">
                    <button
                      className={deleteBtn}
                      onClick={() => deleteFaculty(f.id, f.name)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    {data && section === 'leave' && (
      <>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 shadow">
          <select
            className={inputClass}
            value={lFaculty}
            onChange={(e) => setLFaculty(e.target.value)}
          >
            <option value="">Select faculty</option>
            {data.faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <label className="text-xs text-slate-500">
            From
            <input
              type="date"
              className={inputClass + ' ml-2'}
              value={lFrom}
              onChange={(e) => setLFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              type="date"
              className={inputClass + ' ml-2'}
              value={lTo}
              onChange={(e) => setLTo(e.target.value)}
            />
          </label>
          <input
            className={inputClass}
            placeholder="Reason (optional)"
            value={lReason}
            onChange={(e) => setLReason(e.target.value)}
          />
          <button className={primaryBtn} onClick={addLeave} disabled={busy}>
            Add leave
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Faculty</th>
                <th className="p-3">From</th>
                <th className="p-3">To</th>
                <th className="p-3">Reason</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.unavailability.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={5}>
                    No leave entries yet.
                  </td>
                </tr>
              )}
              {data.unavailability.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3">{facultyName(u.faculty_id)}</td>
                  <td className="p-3">{u.from_date}</td>
                  <td className="p-3">{u.to_date}</td>
                  <td className="p-3">{u.reason ?? ''}</td>
                  <td className="p-3 text-right">
                    <button
                      className={deleteBtn}
                      onClick={() => deleteLeave(u.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    {data && section === 'exams' && (
      <>
        <div className="mt-4 space-y-4 rounded-xl bg-white p-5 shadow">
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="date"
              className={inputClass}
              value={eDate}
              onChange={(e) => setEDate(e.target.value)}
            />
            <select
              className={inputClass}
              value={eSession}
              onChange={(e) => changeSession(e.target.value)}
            >
              <option value="FN">FN (forenoon)</option>
              <option value="AN">AN (afternoon)</option>
            </select>
            <label className="text-xs text-slate-500">
              Start
              <input
                type="time"
                className={inputClass + ' ml-2'}
                value={eStart}
                onChange={(e) => setEStart(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              End
              <input
                type="time"
                className={inputClass + ' ml-2'}
                value={eEnd}
                onChange={(e) => setEEnd(e.target.value)}
              />
            </label>
            <select
              className={inputClass}
              value={eDept}
              onChange={(e) => setEDept(e.target.value)}
            >
              <option value="">Exam department</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Subject"
              value={eSubject}
              onChange={(e) => setESubject(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">Halls used</div>
            <div className="flex flex-wrap gap-3">
              {data.halls.map((h) => (
                <label key={h.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={eHalls.includes(h.id)}
                    onChange={() => toggleHall(h.id)}
                  />
                  {h.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700">
              Invigilators per hall
              <input
                type="number"
                min={1}
                max={5}
                className={inputClass + ' ml-2 w-20'}
                value={eNeeded}
                onChange={(e) => setENeeded(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <button className={primaryBtn} onClick={addExam} disabled={busy}>
              Add exam
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Session</th>
                <th className="p-3">Time</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Department</th>
                <th className="p-3">Halls</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedExams.map((x) => (
                <tr key={x.id} className="border-t border-slate-100">
                  <td className="p-3">{x.exam_date}</td>
                  <td className="p-3">{x.session}</td>
                  <td className="p-3">
                    {x.start_time.slice(0, 5)} to {x.end_time.slice(0, 5)}
                  </td>
                  <td className="p-3">{x.subject}</td>
                  <td className="p-3">{deptName(x.department_id)}</td>
                  <td className="p-3">{hallsForExam(x.id)}</td>
                  <td className="p-3 text-right">
                    <button
                      className={deleteBtn}
                      onClick={() => deleteExam(x.id, x.subject)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
</div>
)
}