import type { AllData, Exam, Faculty, TimetableRow, Unavailability } from './types'

export type Assignment = { exam_hall_id: number; faculty_id: number }
export type Unfilled = { exam_hall_id: number; missing: number }

export type AllocationResult = {
assignments: Assignment[]
unfilled: Unfilled[]
counts: Record<number, number>
fairness: number
totalSeats: number
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
return aStart < bEnd && bStart < aEnd
}

function weekday(dateStr: string) {
return new Date(dateStr + 'T00:00:00').getDay()
}

export function allocate(data: AllData): AllocationResult {
const examById = new Map(data.exams.map((e) => [e.id, e]))

const slots = data.examHalls
.map((eh) => ({ eh, exam: examById.get(eh.exam_id) }))
.filter((s): s is { eh: typeof s.eh; exam: Exam } => s.exam !== undefined)
.sort(
(a, b) =>
a.exam.exam_date.localeCompare(b.exam.exam_date) ||
a.exam.start_time.localeCompare(b.exam.start_time) ||
a.eh.id - b.eh.id
)

const timetableByFaculty = new Map<number, TimetableRow[]>()
for (const t of data.timetable) {
const list = timetableByFaculty.get(t.faculty_id) ?? []
list.push(t)
timetableByFaculty.set(t.faculty_id, list)
}

const leaveByFaculty = new Map<number, Unavailability[]>()
for (const u of data.unavailability) {
const list = leaveByFaculty.get(u.faculty_id) ?? []
list.push(u)
leaveByFaculty.set(u.faculty_id, list)
}

const counts: Record<number, number> = {}
for (const f of data.faculty) counts[f.id] = 0

const busy = new Map<number, { date: string; start: string; end: string }[]>()

function isFree(f: Faculty, exam: Exam): boolean {
if (f.department_id === exam.department_id) return false



const onLeave = (leaveByFaculty.get(f.id) ?? []).some(
  (u) => u.from_date <= exam.exam_date && exam.exam_date <= u.to_date
)
if (onLeave) return false

const day = weekday(exam.exam_date)
const classClash = (timetableByFaculty.get(f.id) ?? []).some(
  (t) =>
    t.day_of_week === day &&
    overlaps(t.start_time, t.end_time, exam.start_time, exam.end_time)
)
if (classClash) return false

const dutyClash = (busy.get(f.id) ?? []).some(
  (b) =>
    b.date === exam.exam_date &&
    overlaps(b.start, b.end, exam.start_time, exam.end_time)
)
return !dutyClash
}

const assignments: Assignment[] = []
const unfilled: Unfilled[] = []
let totalSeats = 0

for (const { eh, exam } of slots) {
totalSeats += eh.invigilators_needed
let filled = 0



for (let i = 0; i < eh.invigilators_needed; i++) {
  const candidates = data.faculty
    .filter((f) => isFree(f, exam))
    .sort((a, b) => counts[a.id] - counts[b.id] || a.id - b.id)

  const pick = candidates[0]
  if (!pick) break

  assignments.push({ exam_hall_id: eh.id, faculty_id: pick.id })
  counts[pick.id] += 1
  const list = busy.get(pick.id) ?? []
  list.push({ date: exam.exam_date, start: exam.start_time, end: exam.end_time })
  busy.set(pick.id, list)
  filled++
}

if (filled < eh.invigilators_needed) {
  unfilled.push({ exam_hall_id: eh.id, missing: eh.invigilators_needed - filled })
}
}

const values = Object.values(counts)
const spread = values.length ? Math.max(...values) - Math.min(...values) : 0
const fairness = Math.max(0, 100 - spread * 10)

return { assignments, unfilled, counts, fairness, totalSeats }
}