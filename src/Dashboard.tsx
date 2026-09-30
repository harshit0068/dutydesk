import { useEffect, useMemo, useState } from 'react'
import {
Bar,
BarChart,
CartesianGrid,
Cell,
ResponsiveContainer,
Tooltip,
XAxis,
YAxis,
} from 'recharts'
import { loadAll } from './lib/data'
import { loadDuties, type SavedDuty } from './lib/duties'
import type { AllData } from './lib/types'

function errorText(e: unknown): string {
if (e instanceof Error) return e.message
if (e && typeof e === 'object' && 'message' in e) {
return String((e as { message: unknown }).message)
}
return String(e)
}

export default function Dashboard() {
const [data, setData] = useState<AllData | null>(null)
const [duties, setDuties] = useState<SavedDuty[]>([])
const [error, setError] = useState('')

useEffect(() => {
async function init() {
try {
const [all, saved] = await Promise.all([loadAll(), loadDuties()])
setData(all)
setDuties(saved)
} catch (e) {
setError(errorText(e))
}
}
init()
}, [])

const stats = useMemo(() => {
if (!data) return null



const counts: Record<number, number> = {}
for (const f of data.faculty) counts[f.id] = 0
for (const d of duties) counts[d.faculty_id] = (counts[d.faculty_id] ?? 0) + 1

const deptById = new Map(data.departments.map((d) => [d.id, d.name]))

const perFaculty = data.faculty
  .map((f) => ({
    id: f.id,
    name: f.name,
    dept: deptById.get(f.department_id ?? -1) ?? 'None',
    duties: counts[f.id] ?? 0,
  }))
  .sort((a, b) => b.duties - a.duties || a.name.localeCompare(b.name))

const total = duties.length
const average = perFaculty.length ? total / perFaculty.length : 0
const busiest = perFaculty[0]
const lightest = perFaculty[perFaculty.length - 1]
const unassigned = perFaculty.filter((p) => p.duties === 0).length

const perDept = data.departments.map((dep) => {
  const members = perFaculty.filter((p) => p.dept === dep.name)
  const sum = members.reduce((s, m) => s + m.duties, 0)
  return {
    name: dep.name,
    people: members.length,
    duties: sum,
    average: members.length ? sum / members.length : 0,
  }
})

return { perFaculty, total, average, busiest, lightest, unassigned, perDept }
}, [data, duties])

return (
<div className="min-h-screen bg-slate-50 p-6">
<div className="mx-auto max-w-5xl">
<h1 className="text-3xl font-bold text-indigo-600">Dashboard</h1>
<p className="mt-1 text-slate-500">How the invigilation load is spread across faculty</p>



    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

    {stats && duties.length === 0 && (
      <div className="mt-6 rounded-xl bg-white p-10 text-center text-slate-500 shadow">
        No saved duty chart yet. Generate and save one on the Admin tab first.
      </div>
    )}

    {stats && duties.length > 0 && (
      <>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-500">Total duties</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">
              {stats.average.toFixed(1)}
            </div>
            <div className="text-sm text-slate-500">Average per faculty</div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-lg font-bold text-slate-800">
              {stats.busiest.name}
            </div>
            <div className="text-sm text-slate-500">
              Busiest ({stats.busiest.duties} duties)
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow">
            <div className="text-3xl font-bold text-slate-800">{stats.unassigned}</div>
            <div className="text-sm text-slate-500">Faculty with no duty</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-5 shadow">
          <div className="mb-3 font-semibold text-slate-800">Duties per faculty</div>
          <div style={{ width: '100%', height: Math.max(320, stats.perFaculty.length * 30) }}>
            <ResponsiveContainer>
              <BarChart
                data={stats.perFaculty}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="duties" radius={[0, 4, 4, 0]}>
                  {stats.perFaculty.map((p) => (
                    <Cell
                      key={p.id}
                      fill={p.duties > stats.average ? '#f59e0b' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Amber bars are above the average load, indigo bars are at or below it.
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3">Department</th>
                <th className="p-3">Faculty</th>
                <th className="p-3">Total duties</th>
                <th className="p-3">Average per person</th>
              </tr>
            </thead>
            <tbody>
              {stats.perDept.map((d) => (
                <tr key={d.name} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3">{d.people}</td>
                  <td className="p-3">{d.duties}</td>
                  <td className="p-3">{d.average.toFixed(1)}</td>
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