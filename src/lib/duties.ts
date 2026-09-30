import { supabase } from './supabase'
import type { Assignment } from './allocate'

export type SavedDuty = {
id: number
exam_hall_id: number
faculty_id: number
status: string | null
}

export async function loadDuties(): Promise<SavedDuty[]> {
const { data, error } = await supabase.from('duties').select('*')
if (error) throw error
return (data ?? []) as SavedDuty[]
}

export async function clearDuties() {
const { error } = await supabase.from('duties').delete().gt('id', 0)
if (error) throw error
}

export async function saveDuties(assignments: Assignment[]) {
await clearDuties()
if (assignments.length === 0) return
const rows = assignments.map((a) => ({
exam_hall_id: a.exam_hall_id,
faculty_id: a.faculty_id,
status: 'assigned',
}))
const { error } = await supabase.from('duties').insert(rows)
if (error) throw error
}

