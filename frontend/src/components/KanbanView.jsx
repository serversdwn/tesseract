import { useState, useEffect } from 'react'
import { Plus, Check, X, Flag, Clock, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask
} from '../utils/api'
import { formatTimeWithTotal } from '../utils/format'
import TaskMenu from './TaskMenu'
import TaskForm from './TaskForm'

// Helper to format status label
const formatStatusLabel = (status) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

// Helper to get status color based on common patterns
const getStatusColor = (status) => {
  const lowerStatus = status.toLowerCase()
  if (lowerStatus === 'backlog') return 'border-gray-600'
  if (lowerStatus === 'in_progress' || lowerStatus.includes('progress')) return 'border-blue-500'
  if (lowerStatus === 'on_hold' || lowerStatus.includes('hold') || lowerStatus.includes('waiting')) return 'border-yellow-500'
  if (lowerStatus === 'done' || lowerStatus.includes('complete')) return 'border-green-500'
  if (lowerStatus.includes('blocked')) return 'border-red-500'
  return 'border-purple-500' // default for custom statuses
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

// Helper function to get all descendant tasks recursively
function getAllDescendants(taskId, allTasks) {
  const children = allTasks.filter(t => t.parent_task_id === taskId)
  let descendants = [...children]

  for (const child of children) {
    descendants = descendants.concat(getAllDescendants(child.id, allTasks))
  }

  return descendants
}

// Helper function to get all descendant tasks of a parent in a specific status
function getDescendantsInStatus(taskId, allTasks, status) {
  const children = allTasks.filter(t => t.parent_task_id === taskId)
  let descendants = []

  for (const child of children) {
    if (child.status === status) {
      descendants.push(child)
    }
    // Recursively get descendants
    descendants = descendants.concat(getDescendantsInStatus(child.id, allTasks, status))
  }

  return descendants
}

// Helper function to check if a task has any descendants in a status
function hasDescendantsInStatus(taskId, allTasks, status) {
  return getDescendantsInStatus(taskId, allTasks, status).length > 0
}

function TaskCard({ task, allTasks, onUpdate, onDragStart, isParent, columnStatus, expandedCards, setExpandedCards, projectStatuses, projectId }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showAddSubtask, setShowAddSubtask] = useState(false)

  // Use global expanded state
  const isExpanded = expandedCards[task.id] || false
  const toggleExpanded = () => {
    setExpandedCards(prev => ({
      ...prev,
      [task.id]: !prev[task.id]
    }))
  }

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

  const handleAddSubtask = async (taskData) => {
    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: task.id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        tags: taskData.tags,
        estimated_minutes: taskData.estimated_minutes,
        flag_color: taskData.flag_color
      })
      setShowAddSubtask(false)
      setExpandedCards(prev => ({ ...prev, [task.id]: true }))
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  // For parent cards, get children in this column's status
  const childrenInColumn = isParent ? getDescendantsInStatus(task.id, allTasks, columnStatus) : []
  const totalChildren = isParent ? allTasks.filter(t => t.parent_task_id === task.id).length : 0

  return (
    <div className="mb-2">
      <div
        draggable={!isEditing}
        onDragStart={(e) => onDragStart(e, task, isParent)}
        className={`${
          isParent
            ? 'bg-cyber-darker border-2 border-cyber-orange/50'
            : 'bg-cyber-darkest border border-cyber-orange/30'
        } rounded-lg p-3 cursor-move hover:border-cyber-orange/60 transition-all group`}
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
                <div className="flex items-center gap-2">
                  {/* Expand/collapse for parent cards */}
                  {isParent && childrenInColumn.length > 0 && (
                    <button
                      onClick={toggleExpanded}
                      className="text-cyber-orange hover:text-cyber-orange-bright"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      {/* Flag indicator */}
                      {task.flag_color && FLAG_COLORS[task.flag_color] && (
                        <Flag size={12} className={`${FLAG_COLORS[task.flag_color].replace('bg-', 'text-')}`} fill="currentColor" />
                      )}
                      <span className={`${isParent ? 'font-semibold text-cyber-orange' : 'text-gray-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Parent card info: show subtask count in this column */}
                    {isParent && (
                      <div className="text-xs text-gray-500 mt-1">
                        {childrenInColumn.length} of {totalChildren} subtask{totalChildren !== 1 ? 's' : ''} in this column
                      </div>
                    )}

                    {/* Metadata row */}
                    {(formatTimeWithTotal(task, allTasks) || (task.tags && task.tags.length > 0)) && (
                      <div className="flex items-center gap-2 mt-2">
                        {/* Time estimate */}
                        {formatTimeWithTotal(task, allTasks) && (
                          <div className={`flex items-center gap-1 text-xs text-gray-500 ${task.status === 'done' ? 'line-through' : ''}`}>
                            <Clock size={11} />
                            <span>{formatTimeWithTotal(task, allTasks)}</span>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 text-xs bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30 rounded"
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
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowAddSubtask(true)}
                  className="text-cyber-orange hover:text-cyber-orange-bright p-1"
                  title="Add subtask"
                >
                  <Plus size={14} />
                </button>
                <TaskMenu
                  task={task}
                  onUpdate={onUpdate}
                  onDelete={handleDelete}
                  onEdit={() => setIsEditing(true)}
                  projectStatuses={projectStatuses}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div className="ml-6 mt-2">
          <TaskForm
            onSubmit={handleAddSubtask}
            onCancel={() => setShowAddSubtask(false)}
            submitLabel="Add Subtask"
            projectStatuses={projectStatuses}
            defaultStatus={columnStatus}
          />
        </div>
      )}

      {/* Expanded children */}
      {isParent && isExpanded && childrenInColumn.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
          {childrenInColumn.map(child => (
            <TaskCard
              key={child.id}
              task={child}
              allTasks={allTasks}
              onUpdate={onUpdate}
              onDragStart={onDragStart}
              isParent={false}
              columnStatus={columnStatus}
              expandedCards={expandedCards}
              setExpandedCards={setExpandedCards}
              projectStatuses={projectStatuses}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ status, allTasks, projectId, onUpdate, onDrop, onDragOver, expandedCards, setExpandedCards, projectStatuses }) {
  const [showAddTask, setShowAddTask] = useState(false)

  const handleAddTask = async (taskData) => {
    try {
      await createTask({
        project_id: parseInt(projectId),
        parent_task_id: null,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        tags: taskData.tags,
        estimated_minutes: taskData.estimated_minutes,
        flag_color: taskData.flag_color
      })
      setShowAddTask(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  // Get tasks to display in this column:
  // 1. All leaf tasks (no children) with this status
  // 2. All parent tasks that have at least one descendant with this status
  const leafTasks = allTasks.filter(t => {
    const hasChildren = allTasks.some(child => child.parent_task_id === t.id)
    return !hasChildren && t.status === status.key
  })

  const parentTasks = allTasks.filter(t => {
    const hasChildren = allTasks.some(child => child.parent_task_id === t.id)
    return hasChildren && hasDescendantsInStatus(t.id, allTasks, status.key)
  })

  // Only show root-level parents (not nested parents)
  const rootParents = parentTasks.filter(t => !t.parent_task_id)

  // Only show root-level leaf tasks (leaf tasks without parents)
  const rootLeafTasks = leafTasks.filter(t => !t.parent_task_id)

  const displayTasks = [...rootParents, ...rootLeafTasks]

  return (
    <div
      className={`flex-1 min-w-[280px] bg-cyber-darker rounded-lg p-4 border-t-4 ${status.color}`}
      onDrop={(e) => onDrop(e, status.key)}
      onDragOver={onDragOver}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-200">
          {status.label}
          <span className="ml-2 text-xs text-gray-500">({displayTasks.length})</span>
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
          <TaskForm
            onSubmit={handleAddTask}
            onCancel={() => setShowAddTask(false)}
            submitLabel="Add Task"
            projectStatuses={projectStatuses}
            defaultStatus={status.key}
          />
        </div>
      )}

      <div className="space-y-2">
        {displayTasks.map(task => {
          const isParent = allTasks.some(t => t.parent_task_id === task.id)
          return (
            <TaskCard
              key={task.id}
              task={task}
              allTasks={allTasks}
              onUpdate={onUpdate}
              onDragStart={(e, task, isParent) => {
                e.dataTransfer.setData('taskId', task.id.toString())
                e.dataTransfer.setData('isParent', isParent.toString())
              }}
              isParent={isParent}
              columnStatus={status.key}
              expandedCards={expandedCards}
              setExpandedCards={setExpandedCards}
              projectStatuses={projectStatuses}
              projectId={projectId}
            />
          )
        })}
      </div>
    </div>
  )
}

function KanbanView({ projectId, project }) {
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCards, setExpandedCards] = useState({})

  // Get statuses from project, or use defaults
  const statuses = project?.statuses || ['backlog', 'in_progress', 'on_hold', 'done']
  const statusesWithMeta = statuses.map(status => ({
    key: status,
    label: formatStatusLabel(status),
    color: getStatusColor(status)
  }))

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

  const handleExpandAll = () => {
    const parentTasks = allTasks.filter(t => allTasks.some(child => child.parent_task_id === t.id))
    const newExpandedState = {}
    parentTasks.forEach(task => {
      newExpandedState[task.id] = true
    })
    setExpandedCards(newExpandedState)
  }

  const handleCollapseAll = () => {
    setExpandedCards({})
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    const taskId = parseInt(e.dataTransfer.getData('taskId'))
    const isParent = e.dataTransfer.getData('isParent') === 'true'

    if (!taskId) return

    try {
      // Update the dragged task
      await updateTask(taskId, { status: newStatus })

      // If it's a parent task, update all descendants
      if (isParent) {
        const descendants = getAllDescendants(taskId, allTasks)
        for (const descendant of descendants) {
          await updateTask(descendant.id, { status: newStatus })
        }
      }

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-300">Kanban Board (Nested View)</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-cyber-darker border border-cyber-orange/30 text-gray-300 rounded hover:border-cyber-orange/60 hover:bg-cyber-dark transition-colors"
          >
            <ChevronsDown size={16} />
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-cyber-darker border border-cyber-orange/30 text-gray-300 rounded hover:border-cyber-orange/60 hover:bg-cyber-dark transition-colors"
          >
            <ChevronsUp size={16} />
            Collapse All
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusesWithMeta.map(status => (
          <KanbanColumn
            key={status.key}
            status={status}
            allTasks={allTasks}
            projectId={projectId}
            onUpdate={loadTasks}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            expandedCards={expandedCards}
            setExpandedCards={setExpandedCards}
            projectStatuses={statuses}
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
