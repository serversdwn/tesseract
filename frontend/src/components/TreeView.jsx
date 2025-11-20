import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react'
import {
  getProjectTaskTree,
  createTask,
  updateTask,
  deleteTask
} from '../utils/api'

const STATUS_COLORS = {
  backlog: 'text-gray-400',
  in_progress: 'text-blue-400',
  blocked: 'text-red-400',
  done: 'text-green-400'
}

const STATUS_LABELS = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
}

function TaskNode({ task, projectId, onUpdate, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editStatus, setEditStatus] = useState(task.status)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const hasSubtasks = task.subtasks && task.subtasks.length > 0

  const handleSave = async () => {
    try {
      await updateTask(task.id, {
        title: editTitle,
        status: editStatus
      })
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

  const handleAddSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return

    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: task.id,
        title: newSubtaskTitle,
        status: 'backlog'
      })
      setNewSubtaskTitle('')
      setShowAddSubtask(false)
      setIsExpanded(true)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div className="mb-2">
      <div
        style={{ marginLeft: `${level * 1.5}rem` }}
        className="flex items-center gap-2 p-3 bg-cyber-darkest border border-cyber-orange/20 rounded hover:border-cyber-orange/40 transition-all group"
      >
        {/* Expand/Collapse */}
        {hasSubtasks && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyber-orange hover:text-cyber-orange-bright"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
        {!hasSubtasks && <div className="w-[18px]" />}

        {/* Task Content */}
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
              autoFocus
            />
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={handleSave}
              className="text-green-400 hover:text-green-300"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditTitle(task.title)
                setEditStatus(task.status)
              }}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <span className="text-gray-200">{task.title}</span>
              <span className={`ml-3 text-xs ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowAddSubtask(true)}
                className="text-cyber-orange hover:text-cyber-orange-bright"
                title="Add subtask"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-200"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div style={{ marginLeft: `${level * 1.5}rem` }} className="mt-2">
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="New subtask title..."
              className="flex-1 px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright text-sm font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddSubtask(false)}
              className="px-3 py-2 text-gray-400 hover:text-gray-200 text-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Subtasks */}
      {isExpanded && hasSubtasks && (
        <div className="mt-2">
          {task.subtasks.map(subtask => (
            <TaskNode
              key={subtask.id}
              task={subtask}
              projectId={projectId}
              onUpdate={onUpdate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeView({ projectId }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddRoot, setShowAddRoot] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  useEffect(() => {
    loadTasks()
  }, [projectId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getProjectTaskTree(projectId)
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRootTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: null,
        title: newTaskTitle,
        status: 'backlog'
      })
      setNewTaskTitle('')
      setShowAddRoot(false)
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
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-300">Task Tree</h3>
        <button
          onClick={() => setShowAddRoot(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright transition-colors font-semibold text-sm"
        >
          <Plus size={16} />
          Add Root Task
        </button>
      </div>

      {showAddRoot && (
        <div className="mb-4">
          <form onSubmit={handleAddRootTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New task title..."
              className="flex-1 px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 focus:outline-none focus:border-cyber-orange"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddRoot(false)}
              className="px-4 py-2 text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No tasks yet</p>
          <p className="text-sm">Add a root task to get started</p>
        </div>
      ) : (
        <div>
          {tasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              projectId={projectId}
              onUpdate={loadTasks}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TreeView
