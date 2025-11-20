import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask
} from '../utils/api'

const STATUSES = [
  { key: 'backlog', label: 'Backlog', color: 'border-gray-600' },
  { key: 'in_progress', label: 'In Progress', color: 'border-blue-500' },
  { key: 'blocked', label: 'Blocked', color: 'border-red-500' },
  { key: 'done', label: 'Done', color: 'border-green-500' }
]

function TaskCard({ task, allTasks, onUpdate, onDragStart }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  // Find parent task if this is a subtask
  const parentTask = task.parent_task_id
    ? allTasks.find(t => t.id === task.parent_task_id)
    : null

  const handleSave = async () => {
    try {
      await updateTask(task.id, { title: editTitle })
      setIsEditing(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task and all its subtasks?')) return
    try {
      await deleteTask(task.id)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, task)}
      className="bg-cyber-darkest border border-cyber-orange/30 rounded-lg p-3 mb-2 cursor-move hover:border-cyber-orange/60 transition-all group"
    >
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="text-green-400 hover:text-green-300"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setEditTitle(task.title)
            }}
            className="text-gray-400 hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-gray-200 text-sm">{task.title}</div>
              {parentTask && (
                <div className="text-xs text-gray-500 mt-1">
                  ↳ subtask of: <span className="text-cyber-orange">{parentTask.title}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-200"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KanbanColumn({ status, tasks, allTasks, projectId, onUpdate, onDrop, onDragOver }) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: null,
        title: newTaskTitle,
        status: status.key
      })
      setNewTaskTitle('')
      setShowAddTask(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div
      className="flex-1 min-w-[280px] bg-cyber-darker rounded-lg p-4 border-t-4 ${status.color}"
      onDrop={(e) => onDrop(e, status.key)}
      onDragOver={onDragOver}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-200">
          {status.label}
          <span className="ml-2 text-xs text-gray-500">({tasks.length})</span>
        </h3>
        <button
          onClick={() => setShowAddTask(true)}
          className="text-cyber-orange hover:text-cyber-orange-bright"
        >
          <Plus size={18} />
        </button>
      </div>

      {showAddTask && (
        <div className="mb-3">
          <form onSubmit={handleAddTask}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-2 py-2 bg-cyber-darkest border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright text-sm font-semibold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-3 py-1 text-gray-400 hover:text-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            allTasks={allTasks}
            onUpdate={onUpdate}
            onDragStart={(e, task) => {
              e.dataTransfer.setData('taskId', task.id.toString())
            }}
          />
        ))}
      </div>
    </div>
  )
}

function KanbanView({ projectId }) {
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getProjectTasks(projectId)
      setAllTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    const taskId = parseInt(e.dataTransfer.getData('taskId'))

    if (!taskId) return

    try {
      await updateTask(taskId, { status: newStatus })
      loadTasks()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading tasks...</div>
  }

  if (error) {
    return <div className="text-center text-red-400 py-12">{error}</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-300 mb-4">Kanban Board</h3>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <KanbanColumn
            key={status.key}
            status={status}
            tasks={allTasks.filter(t => t.status === status.key)}
            allTasks={allTasks}
            projectId={projectId}
            onUpdate={loadTasks}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>

      {allTasks.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No tasks yet</p>
          <p className="text-sm">Add tasks using the + button in any column</p>
        </div>
      )}
    </div>
  )
}

export default KanbanView
