import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  X,
  Flag,
  Clock
} from 'lucide-react'
import {
  getProjectTaskTree,
  createTask,
  updateTask,
  deleteTask
} from '../utils/api'
import { formatTimeWithTotal } from '../utils/format'
import TaskMenu from './TaskMenu'
import TaskForm from './TaskForm'

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

const FLAG_COLORS = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500'
}

function TaskNode({ task, projectId, onUpdate, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editStatus, setEditStatus] = useState(task.status)
  const [showAddSubtask, setShowAddSubtask] = useState(false)

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

  const handleAddSubtask = async (taskData) => {
    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: task.id,
        title: taskData.title,
        description: taskData.description,
        status: 'backlog',
        tags: taskData.tags,
        estimated_minutes: taskData.estimated_minutes,
        flag_color: taskData.flag_color
      })
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
              <div className="flex items-center gap-2">
                {/* Flag indicator */}
                {task.flag_color && FLAG_COLORS[task.flag_color] && (
                  <Flag size={14} className={`${FLAG_COLORS[task.flag_color].replace('bg-', 'text-')}`} fill="currentColor" />
                )}
                <span className="text-gray-200">{task.title}</span>
                <span className={`ml-2 text-xs ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>

              {/* Metadata row */}
              {(formatTimeWithTotal(task) || (task.tags && task.tags.length > 0)) && (
                <div className="flex items-center gap-3 mt-1">
                  {/* Time estimate */}
                  {formatTimeWithTotal(task) && (
                    <div className={`flex items-center gap-1 text-xs text-gray-500 ${task.status === 'done' ? 'line-through' : ''}`}>
                      <Clock size={12} />
                      <span>{formatTimeWithTotal(task)}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div className="mt-2 text-xs text-gray-400 italic">
                  {task.description}
                </div>
              )}
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
              <TaskMenu
                task={task}
                onUpdate={onUpdate}
                onDelete={handleDelete}
                onEdit={() => setIsEditing(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div style={{ marginLeft: `${level * 1.5}rem` }} className="mt-2">
          <TaskForm
            onSubmit={handleAddSubtask}
            onCancel={() => setShowAddSubtask(false)}
            submitLabel="Add Subtask"
          />
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

  const handleAddRootTask = async (taskData) => {
    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: null,
        title: taskData.title,
        description: taskData.description,
        status: 'backlog',
        tags: taskData.tags,
        estimated_minutes: taskData.estimated_minutes,
        flag_color: taskData.flag_color
      })
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
          <TaskForm
            onSubmit={handleAddRootTask}
            onCancel={() => setShowAddRoot(false)}
            submitLabel="Add Task"
          />
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
