export type Department = { id: number; name: string }

export type Faculty = {
id: number
name: string
email: string | null
department_id: number | null
designation: string | null
}

export type TimetableRow = {
id: number
faculty_id: number
day_of_week: number
start_time: string
end_time: string
}

export type Hall = { id: number; name: string; capacity: number }

export type Exam = {
id: number
exam_date: string
session: string
start_time: string
end_time: string
department_id: number | null
subject: string
}

export type ExamHall = {
id: number
exam_id: number
hall_id: number
invigilators_needed: number
}

export type Unavailability = {
id: number
faculty_id: number
from_date: string
to_date: string
reason: string | null
}

export type AllData = {
departments: Department[]
faculty: Faculty[]
timetable: TimetableRow[]
halls: Hall[]
exams: Exam[]
examHalls: ExamHall[]
unavailability: Unavailability[]
}