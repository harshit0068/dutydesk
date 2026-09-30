import type { AllData, Faculty } from './types'
import type { Assignment } from './allocate'

export type Candidate = { faculty: Faculty; duties: number }

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
return aStart < bEnd && bStart < aEnd
}

function weekday(dateStr: string) {
return new Date(dateStr + 'T00:00:00').getDay()
}

export function eligibleFor(
data: AllData,
assignments: Assignment[],
examHallId: number,
replacingId?: number
): Candidate[] {
const eh = data.examHalls.find((x) => x.id === examHallId)
if (!eh) return []
const exam = data.exams.find((e) => e.id === eh.exam_id)
if (!exam) return []

const examHallById = new Map(data.examHalls.map((x) => [x.id, x]))
const examById = new Map(data.exams.map((e) => [e.id, e]))

const counts: Record<number, number> = {}
for (const f of data.faculty) counts[f.id] = 0
for (const a of assignments) counts[a.faculty_id] = (counts[a.faculty_id] ?? 0) + 1

const day = weekday(exam.exam_date)

const free = data.faculty.filter((f) => {
if (f.id === replacingId) return false
if (f.department_id === exam.department_id) return false



const onLeave = data.unavailability.some(
  (u) =>
    u.faculty_id === f.id &&
    u.from_date <= exam.exam_date &&
    exam.exam_date <= u.to_date
)
if (onLeave) return false

const classClash = data.timetable.some(
  (t) =>
    t.faculty_id === f.id &&
    t.day_of_week === day &&
    overlaps(t.start_time, t.end_time, exam.start_time, exam.end_time)
)
if (classClash) return false

const dutyClash = assignments.some((a) => {
  if (a.faculty_id !== f.id) return false
  const otherHall = examHallById.get(a.exam_hall_id)
  if (!otherHall) return false
  const otherExam = examById.get(otherHall.exam_id)
  if (!otherExam) return false
  return (
    otherExam.exam_date === exam.exam_date &&
    overlaps(otherExam.start_time, otherExam.end_time, exam.start_time, exam.end_time)
  )
})
return !dutyClash
})

return free
.map((f) => ({ faculty: f, duties: counts[f.id] ?? 0 }))
.sort((a, b) => a.duties - b.duties || a.faculty.id - b.faculty.id)
}