import { supabase } from './supabase'
import type { AllData } from './types'

async function fetchTable<T>(name: string): Promise<T[]> {
const { data, error } = await supabase.from(name).select('*')
if (error) throw error
return (data ?? []) as T[]
}

export async function loadAll(): Promise<AllData> {
const [departments, faculty, timetable, halls, exams, examHalls, unavailability] =
await Promise.all([
fetchTable('departments'),
fetchTable('faculty'),
fetchTable('timetable'),
fetchTable('halls'),
fetchTable('exams'),
fetchTable('exam_halls'),
fetchTable('unavailability'),
])
return {
departments,
faculty,
timetable,
halls,
exams,
examHalls,
unavailability,
} as AllData
}