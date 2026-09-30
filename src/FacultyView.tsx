import { useEffect, useMemo, useState } from 'react'
import { loadAll } from './lib/data'
import { loadDuties, type SavedDuty } from './lib/duties'
import type { AllData } from './lib/types'

type MyDuty = {
id: number
date: string
session: string
start: string
end: string
subject: string
hall: string
partners: string[]
}

function errorText(e: unknown): string {
if (e instanceof Error) return e.message
if (e && typeof e === 'object' && 'message' in e) {
return String((e as { message: unknown }).message)
}
return String(e)
}

export default function FacultyView({ lockedFacultyId }: { lockedFacultyId?: number }) {
const [data, setData] = useState<AllData | null>(null)
const [duties, setDuties] = useState<SavedDuty[]>([])
const [pickedId, setPickedId] = useState<number | null>(null)
const [error, setError] = useState('')

useEffect(() => {
async function init() {
try {
const [all, saved] = await Promise.all([loadAll(), loadDuties()])
setData(all)
setDuties(saved)
if (all.faculty.length > 0) setPickedId(all.faculty[0].id)
} catch (e) {
setError(errorText(e))
}
}
init()
}, [])

const facultyId = lockedFacultyId ?? pickedId

const mine = useMemo(() => {
const result: MyDuty[] = []
if (!data || facultyId === null) return result



const facultyById = new Map(data.faculty.map((f) => [f.id, f]))
const examById = new Map(data.exams.map((e) => [e.id, e]))
const hallById = new Map(data.halls.map((h) => [h.id, h]))
const examHallById = new Map(data.examHalls.map((eh) => [eh.id, eh]))

for (const d of duties) {
  if (d.faculty_id !== facultyId) continue
  const eh = examHallById.get(d.exam_hall_id)
  if (!eh) continue
  const exam = examById.get(eh.exam_id)
  if (!exam) continue
  const partners = duties
    .filter((o) => o.exam_hall_id === d.exam_hall_id && o.faculty_id !== facultyId)
    .map((o) => facultyById.get(o.faculty_id)?.name ?? 'Unknown')
  result.push({
    id: d.id,
    date: exam.exam_date,
    session: exam.session,
    start: exam.start_time.slice(0, 5),
    end: exam.end_time.slice(0, 5),
    subject: exam.subject,
    hall: hallById.get(eh.hall_id)?.name ?? '',
    partners,
  })
}

result.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
return result
}, [data, duties, facultyId])

const person = data?.faculty.find((f) => f.id === facultyId)
const department = data?.departments.find((d) => d.id === person?.department_id)

return (
<div className="min-h-screen bg-slate-50 p-6">
<div className="mx-auto max-w-3xl">
<h1 className="text-3xl font-bold text-indigo-600">My duties</h1>
<p className="mt-1 text-slate-500">
{lockedFacultyId !== undefined
? 'Your invigilation schedule'
: 'Select a name to see that person invigilation schedule'}
</p>



    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

    {data && (
      <>
        {lockedFacultyId === undefined && (
          <select
            value={pickedId ?? ''}
            onChange={(e) => setPickedId(Number(e.target.value))}
            className="mt-6 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 shadow-sm"
          >
            {data.faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}

        {person && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow">
              <div className="text-lg font-bold text-slate-800">{person.name}</div>
              <div className="text-sm text-slate-500">
                {department?.name ?? 'No department'}
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow">
              <div className="text-3xl font-bold text-slate-800">{mine.length}</div>
              <div className="text-sm text-slate-500">Total duties</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow">
              <div className="text-lg font-bold text-slate-800">
                {mine.length > 0 ? mine[0].date : '-'}
              </div>
              <div className="text-sm text-slate-500">First duty</div>
            </div>
          </div>
        )}

        {mine.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white p-10 text-center text-slate-500 shadow">
            No duties assigned. If the admin has not saved a duty chart yet, none will show here.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {mine.map((d) => (
              <div key={d.id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-lg font-semibold text-slate-800">{d.subject}</div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                    {d.hall}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {d.date} | {d.session} | {d.start} to {d.end}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  With: {d.partners.length ? d.partners.join(', ') : 'No one else assigned'}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
</div>
)
}