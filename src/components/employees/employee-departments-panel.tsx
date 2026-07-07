"use client"

import { useState, type FormEvent } from "react"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDepartments } from "@/context/employee-departments-context"
import { useEmployees } from "@/context/employees-context"
import { confirmDeleteAction } from "@/lib/confirm-action"
import {
  EMPTY_DEPARTMENT,
  departmentFromFormData,
  type DepartmentRow,
} from "@/lib/employee-departments"

export function EmployeeDepartmentsPanel() {
  const { departments, addDepartment, updateDepartment, removeDepartment } =
    useDepartments()
  const { employees } = useEmployees()
  const [editing, setEditing] = useState<DepartmentRow | null>(null)
  const [form, setForm] = useState(EMPTY_DEPARTMENT)

  const headcount = (name: string) =>
    employees.filter((e) => e.department === name && e.status === "active").length

  const resetForm = () => {
    setEditing(null)
    setForm(EMPTY_DEPARTMENT)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    if (!name) {
      toast.error("Department name is required.")
      return
    }
    if (editing) {
      updateDepartment(editing.id, departmentFromFormData(fd, editing.id))
      toast.success("Department updated.")
    } else {
      addDepartment(departmentFromFormData(fd, 0))
      toast.success("Department added.")
    }
    resetForm()
  }

  const startEdit = (dept: DepartmentRow) => {
    setEditing(dept)
    setForm(dept)
  }

  const handleDelete = async (dept: DepartmentRow) => {
    if (
      !(await confirmDeleteAction({
        itemName: dept.name,
        entityLabel: "department",
      }))
    ) {
      return
    }
    removeDepartment(dept.id)
    if (editing?.id === dept.id) resetForm()
    toast.message(`Removed ${dept.name}.`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="font-semibold">
          {editing ? `Edit ${editing.name}` : "Add department"}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Organize employees into teams. Departments appear in the employee form.
        </p>
        <form key={editing?.id ?? "new"} className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input
              id="dept-name"
              name="name"
              required
              defaultValue={form.name}
              placeholder="e.g. Sales"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-desc">Description</Label>
            <Input
              id="dept-desc"
              name="description"
              defaultValue={form.description === "—" ? "" : form.description}
              placeholder="What this team does"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editing ? "Save" : "Add department"}</Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">All departments</h3>
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div>
              <p className="font-medium">{dept.name}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">{dept.description}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                {headcount(dept.name)} active employee(s)
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => startEdit(dept)}>
                <IconPencil className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(dept)}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
