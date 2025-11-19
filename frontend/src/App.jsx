import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' }
]

const Card = ({ children, className = '' }) => (
  <div className={`card rounded-lg p-4 shadow-lg ${className}`}>{children}</div>
)

const SectionTitle = ({ children }) => (
  <div className="text-xl font-semibold text-accent mb-3">{children}</div>
)

const Button = ({ children, ...props }) => (
  <button
    {...props}
    className={`px-3 py-2 rounded-md text-sm font-semibold bg-accent text-black hover:brightness-110 transition ${props.className || ''}`}
  >
    {children}
  </button>
)

function TaskNode({ task, onAddSubtask, onUpdateTask, depth = 0 }) {
  const [expanded, setExpanded] = useState(true)
  const padding = depth * 16

  return (
    <div className="border border-gray-800 rounded-md mb-2" style={{ marginLeft: padding }}>
      <div className="flex items-center justify-between px-3 py-2 bg-[#0f0f1a]">
        <div className="flex items-center gap-2">
          <button
            className="text-accent hover:scale-105"
            onClick={() => setExpanded(!expanded)}
            title="Toggle"
          >
            {expanded ? '▾' : '▸'}
          </button>
          <input
            className="bg-transparent border-b border-gray-700 focus:border-accent focus:outline-none"
            value={task.title}
            onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select
            className="bg-[#0b0b13] border border-gray-700 rounded px-2 py-1"
            value={task.status}
            onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button onClick={() => onAddSubtask(task.id)}>Add subtask</Button>
        </div>
      </div>
      {expanded && (
        <div className="pl-4 py-2">
          <p className="text-gray-400 text-sm whitespace-pre-wrap">{task.description}</p>
          {task.children?.length > 0 && (
            <div className="mt-2">
              {task.children.map((child) => (
                <TaskNode
                  key={child.id}
                  task={child}
                  depth={depth + 1}
                  onAddSubtask={onAddSubtask}
                  onUpdateTask={onUpdateTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ title, status, tasks, onStatusChange, onSelect }) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="text-accent font-semibold mb-2">{title}</div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="cursor-pointer" onClick={() => onSelect(task)}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{task.title}</div>
              <select
                className="bg-[#0b0b13] border border-gray-700 rounded px-2 py-1 text-xs"
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {task.parent_task_id && (
              <div className="text-xs text-gray-400">Subtask of #{task.parent_task_id}</div>
            )}
            {task.children?.length > 0 && (
              <div className="text-xs text-gray-400">{task.children.length} subtasks</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

const flattenTasks = (tasks, parent = null) => {
  return tasks.flatMap((task) => [
    { ...task, parent_task_id: parent?.id ?? task.parent_task_id },
    ...flattenTasks(task.children || [], task)
  ])
}

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('tree')
  const [detailTask, setDetailTask] = useState(null)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [importFile, setImportFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    const { data } = await axios.get(`${API_BASE}/api/projects`)
    setProjects(data)
    if (data.length && !selectedProjectId) {
      setSelectedProjectId(data[0].id)
    }
  }

  const loadTasks = async (projectId) => {
    const { data } = await axios.get(`${API_BASE}/api/projects/${projectId}/tasks`)
    setTasks(data)
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return
    await axios.post(`${API_BASE}/api/projects`, newProject)
    setNewProject({ name: '', description: '' })
    loadProjects()
  }

  const handleAddTask = async (parentId = null) => {
    if (!selectedProjectId) return
    const payload = {
      title: parentId ? 'New subtask' : 'New task',
      status: 'backlog',
      description: '',
      parent_task_id: parentId,
      sort_order: Date.now()
    }
    await axios.post(`${API_BASE}/api/projects/${selectedProjectId}/tasks`, payload)
    loadTasks(selectedProjectId)
  }

  const handleUpdateTask = async (taskId, updates) => {
    await axios.put(`${API_BASE}/api/tasks/${taskId}`, updates)
    loadTasks(selectedProjectId)
  }

  const handleImport = async () => {
    if (!importFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', importFile)
    await axios.post(`${API_BASE}/api/import-json-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setImportFile(null)
    setLoading(false)
    loadProjects()
  }

  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks])

  const columnTasks = (status) => flatTasks.filter((t) => t.status === status)

  return (
    <div className="min-h-screen bg-base text-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-accent">Project Breakdown</h1>
            <p className="text-gray-400">Self-hosted nested task decomposition.</p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              accept="application/json"
              onChange={(e) => setImportFile(e.target.files?.[0])}
              className="text-sm"
            />
            <Button onClick={handleImport} disabled={!importFile || loading}>
              {loading ? 'Importing...' : 'Import JSON'}
            </Button>
          </div>
        </header>

        <Card>
          <SectionTitle>Projects</SectionTitle>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Name</label>
              <input
                className="bg-[#0b0b13] border border-gray-800 rounded px-3 py-2"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Description</label>
              <input
                className="bg-[#0b0b13] border border-gray-800 rounded px-3 py-2 w-72"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </div>
          <div className="mt-4 flex gap-3 flex-wrap">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`px-3 py-2 rounded-md border ${
                  selectedProjectId === project.id
                    ? 'border-accent text-accent'
                    : 'border-gray-800 text-gray-300'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </Card>

        {selectedProjectId && (
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <SectionTitle>Project View</SectionTitle>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1 rounded ${
                    activeTab === 'tree' ? 'bg-accent text-black' : 'bg-[#0b0b13] text-gray-300'
                  }`}
                >
                  Tree
                </button>
                <button
                  onClick={() => setActiveTab('kanban')}
                  className={`px-3 py-1 rounded ${
                    activeTab === 'kanban' ? 'bg-accent text-black' : 'bg-[#0b0b13] text-gray-300'
                  }`}
                >
                  Kanban
                </button>
              </div>
              <Button onClick={() => handleAddTask(null)}>Add root task</Button>
            </div>

            {activeTab === 'tree' && (
              <div>
                {tasks.length === 0 && <div className="text-gray-400">No tasks yet.</div>}
                {tasks.map((task) => (
                  <TaskNode
                    key={task.id}
                    task={task}
                    onAddSubtask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                  />
                ))}
              </div>
            )}

            {activeTab === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <KanbanColumn
                  title="Backlog"
                  status="backlog"
                  tasks={columnTasks('backlog')}
                  onStatusChange={(task, status) => handleUpdateTask(task.id, { status })}
                  onSelect={setDetailTask}
                />
                <KanbanColumn
                  title="In Progress"
                  status="in_progress"
                  tasks={columnTasks('in_progress')}
                  onStatusChange={(task, status) => handleUpdateTask(task.id, { status })}
                  onSelect={setDetailTask}
                />
                <KanbanColumn
                  title="Blocked"
                  status="blocked"
                  tasks={columnTasks('blocked')}
                  onStatusChange={(task, status) => handleUpdateTask(task.id, { status })}
                  onSelect={setDetailTask}
                />
                <KanbanColumn
                  title="Done"
                  status="done"
                  tasks={columnTasks('done')}
                  onStatusChange={(task, status) => handleUpdateTask(task.id, { status })}
                  onSelect={setDetailTask}
                />
              </div>
            )}
          </Card>
        )}

        {detailTask && (
          <Card className="border border-accent/40">
            <div className="flex justify-between items-center">
              <SectionTitle>Task Details</SectionTitle>
              <button className="text-gray-400 hover:text-accent" onClick={() => setDetailTask(null)}>
                Close
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold">{detailTask.title}</div>
              <div className="text-gray-400 text-sm">Status: {detailTask.status}</div>
              {detailTask.description && (
                <p className="text-gray-300 whitespace-pre-wrap">{detailTask.description}</p>
              )}
              {detailTask.parent_task_id && (
                <div className="text-gray-400 text-sm">Parent: #{detailTask.parent_task_id}</div>
              )}
              <div className="text-gray-400 text-sm">
                Subtasks: {detailTask.children?.length || 0}
              </div>
              <Button onClick={() => handleAddTask(detailTask.id)}>Add subtask</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
