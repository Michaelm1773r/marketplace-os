"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createMilestone, updateMilestone, deleteMilestone,
  createTask, updateTask, deleteTask,
  assignFreelancer,
} from "@/lib/actions";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2,
  UserPlus, CheckCircle2, Clock, AlertCircle, GripVertical,
} from "lucide-react";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  acceptanceCriteria: string[];
  dueDate: string | null;
  sortOrder: number;
  assignee: { id: string; name: string | null; email: string | null } | null;
}

interface MilestoneData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budgetAmount: number;
  dueDate: string | null;
  sortOrder: number;
  tasks: TaskData[];
}

interface FreelancerOption {
  userId: string;
  name: string;
  skills: string[];
  availability: string;
  readinessScore: number;
}

interface Props {
  projectId: string;
  milestones: MilestoneData[];
  workstreams: { id: string; type: string }[];
  freelancers: FreelancerOption[];
}

const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  SUBMITTED: { label: "Submitted", color: "bg-amber-100 text-amber-700" },
  QA_REVIEW: { label: "QA Review", color: "bg-amber-100 text-amber-700" },
  FIX_REQUESTED: { label: "Fixes Needed", color: "bg-red-100 text-red-700" },
  QA_PASSED: { label: "QA Passed", color: "bg-emerald-100 text-emerald-700" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
};

const MS_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  UPCOMING: { label: "Upcoming", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  IN_REVIEW: { label: "In Review", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export function MilestoneManager({ projectId, milestones, workstreams, freelancers }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(milestones.map((m) => [m.id, true]))
  );
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMsTitle, setNewMsTitle] = useState("");
  const [newMsBudget, setNewMsBudget] = useState("");
  const [loading, setLoading] = useState("");

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleAddMilestone = async () => {
    if (!newMsTitle.trim()) return;
    setLoading("add-ms");
    await createMilestone({
      projectId,
      title: newMsTitle.trim(),
      budgetAmount: newMsBudget ? Math.round(Number(newMsBudget) * 100) : 0,
      sortOrder: milestones.length + 1,
    });
    setNewMsTitle("");
    setNewMsBudget("");
    setAddingMilestone(false);
    setLoading("");
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone and all its tasks?")) return;
    setLoading(`del-ms-${id}`);
    await deleteMilestone(id);
    setLoading("");
  };

  const handleMsStatusChange = async (id: string, status: string) => {
    setLoading(`ms-status-${id}`);
    await updateMilestone({ id, status });
    setLoading("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Milestones ({milestones.length})
        </h2>
        <Button size="sm" variant="outline" onClick={() => setAddingMilestone(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Milestone
        </Button>
      </div>

      {milestones.length === 0 && !addingMilestone && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500 mb-2">No milestones yet.</p>
            <p className="text-sm text-slate-400 mb-4">Use &quot;Apply Template&quot; above for a quick start, or add milestones manually.</p>
            <Button size="sm" onClick={() => setAddingMilestone(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add First Milestone
            </Button>
          </CardContent>
        </Card>
      )}

      {milestones.map((ms) => {
        const msStatus = MS_STATUS_MAP[ms.status] || { label: ms.status, variant: "secondary" as const };
        const isExpanded = expanded[ms.id] !== false;

        return (
          <Card key={ms.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(ms.id)} className="text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{ms.title}</CardTitle>
                    <Badge variant={msStatus.variant}>{msStatus.label}</Badge>
                    {ms.budgetAmount > 0 && (
                      <span className="text-sm text-slate-500">${(ms.budgetAmount / 100).toLocaleString()}</span>
                    )}
                    {ms.dueDate && (
                      <span className="text-sm text-slate-400">Due {new Date(ms.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                  {ms.description && <p className="text-sm text-slate-500 mt-1">{ms.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <select
                    className="text-xs border rounded px-2 py-1 bg-white"
                    value={ms.status}
                    onChange={(e) => handleMsStatusChange(ms.id, e.target.value)}
                    disabled={loading.startsWith("ms-status")}
                  >
                    {Object.entries(MS_STATUS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteMilestone(ms.id)} disabled={loading === `del-ms-${ms.id}`}>
                    {loading === `del-ms-${ms.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <TaskList
                  milestoneId={ms.id}
                  tasks={ms.tasks}
                  freelancers={freelancers}
                  loading={loading}
                  setLoading={setLoading}
                />
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add milestone form */}
      {addingMilestone && (
        <Card className="border-dashed border-blue-300 bg-blue-50/30">
          <CardContent className="pt-5">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Milestone Title</p>
                <Input placeholder="e.g., M1: Discovery & Wireframe" value={newMsTitle} onChange={(e) => setNewMsTitle(e.target.value)} autoFocus />
              </div>
              <div className="w-32">
                <p className="text-xs font-medium text-slate-500 mb-1">Budget ($)</p>
                <Input type="number" placeholder="0" value={newMsBudget} onChange={(e) => setNewMsBudget(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleAddMilestone} disabled={!newMsTitle.trim() || loading === "add-ms"}>
                {loading === "add-ms" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingMilestone(false); setNewMsTitle(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Task List ───────────────────────────────────────────────────

function TaskList({
  milestoneId, tasks, freelancers, loading, setLoading,
}: {
  milestoneId: string;
  tasks: TaskData[];
  freelancers: FreelancerOption[];
  loading: string;
  setLoading: (l: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [criteriaList, setCriteriaList] = useState<string[]>([]);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setLoading("add-task");
    await createTask({
      milestoneId,
      title: newTitle.trim(),
      acceptanceCriteria: criteriaList,
      sortOrder: tasks.length + 1,
    });
    setNewTitle("");
    setCriteriaList([]);
    setAdding(false);
    setLoading("");
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    setLoading(`del-task-${id}`);
    await deleteTask(id);
    setLoading("");
  };

  const handleStatusChange = async (id: string, status: string) => {
    setLoading(`task-status-${id}`);
    await updateTask({ id, status });
    setLoading("");
  };

  const handleAssign = async (taskId: string, userId: string) => {
    setLoading(`assign-${taskId}`);
    await assignFreelancer({ taskId, freelancerUserId: userId });
    setAssigningTask(null);
    setLoading("");
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const ts = TASK_STATUS_MAP[task.status] || { label: task.status, color: "bg-slate-100 text-slate-700" };
        return (
          <div key={task.id} className="border rounded-lg p-3">
            <div className="flex items-start gap-3">
              <GripVertical className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-slate-900">{task.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ts.color}`}>{ts.label}</span>
                </div>

                {task.acceptanceCriteria.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {task.acceptanceCriteria.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-slate-300" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  {task.assignee ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <UserPlus className="h-3 w-3" /> {task.assignee.name || task.assignee.email}
                    </span>
                  ) : (
                    <button
                      onClick={() => setAssigningTask(assigningTask === task.id ? null : task.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <UserPlus className="h-3 w-3" /> Assign freelancer
                    </button>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Assign dropdown */}
                {assigningTask === task.id && (
                  <div className="mt-2 border rounded-lg p-2 bg-slate-50 space-y-1">
                    <p className="text-xs font-medium text-slate-500 mb-1">Select freelancer:</p>
                    {freelancers.filter((f) => f.availability === "available").map((f) => (
                      <button
                        key={f.userId}
                        onClick={() => handleAssign(task.id, f.userId)}
                        disabled={loading === `assign-${task.id}`}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-white text-sm text-left transition-colors"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{f.name}</p>
                          <p className="text-xs text-slate-500">{f.skills.slice(0, 3).join(", ")}</p>
                        </div>
                        <span className="text-xs text-slate-400">Score: {f.readinessScore.toFixed(0)}</span>
                      </button>
                    ))}
                    {freelancers.filter((f) => f.availability === "available").length === 0 && (
                      <p className="text-xs text-slate-400 py-2">No available freelancers.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <select
                  className="text-xs border rounded px-1.5 py-1 bg-white w-[110px]"
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  disabled={loading.startsWith("task-status")}
                >
                  {Object.entries(TASK_STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDeleteTask(task.id)}>
                  {loading === `del-task-${task.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add task */}
      {adding ? (
        <div className="border border-dashed border-blue-300 rounded-lg p-3 bg-blue-50/30 space-y-3">
          <Input placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Acceptance Criteria (optional)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Add a criterion..."
                value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCriteria.trim()) {
                    e.preventDefault();
                    setCriteriaList([...criteriaList, newCriteria.trim()]);
                    setNewCriteria("");
                  }
                }}
              />
              <Button size="sm" variant="outline" onClick={() => { if (newCriteria.trim()) { setCriteriaList([...criteriaList, newCriteria.trim()]); setNewCriteria(""); } }} disabled={!newCriteria.trim()}>Add</Button>
            </div>
            {criteriaList.length > 0 && (
              <div className="mt-2 space-y-1">
                {criteriaList.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />
                    <span className="flex-1">{c}</span>
                    <button onClick={() => setCriteriaList(criteriaList.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} disabled={!newTitle.trim() || loading === "add-task"}>
              {loading === "add-task" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add Task
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); setCriteriaList([]); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed rounded-lg p-2 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add task
        </button>
      )}
    </div>
  );
}
