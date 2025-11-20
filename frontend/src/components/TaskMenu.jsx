import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Clock, Tag, Flag, Edit2, Trash2, X, Check, ListTodo } from 'lucide-react'
import { updateTask } from '../utils/api'

const FLAG_COLORS = [
  { name: 'red', color: 'bg-red-500' },
  { name: 'orange', color: 'bg-orange-500' },
  { name: 'yellow', color: 'bg-yellow-500' },
  { name: 'green', color: 'bg-green-500' },
  { name: 'blue', color: 'bg-blue-500' },
  { name: 'purple', color: 'bg-purple-500' },
  { name: 'pink', color: 'bg-pink-500' }
]

const STATUSES = [
  { key: 'backlog', label: 'Backlog', color: 'text-gray-400' },
  { key: 'in_progress', label: 'In Progress', color: 'text-blue-400' },
  { key: 'blocked', label: 'Blocked', color: 'text-red-400' },
  { key: 'done', label: 'Done', color: 'text-green-400' }
]

function TaskMenu({ task, onUpdate, onDelete, onEdit }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTimeEdit, setShowTimeEdit] = useState(false)
  const [showTagsEdit, setShowTagsEdit] = useState(false)
  const [showFlagEdit, setShowFlagEdit] = useState(false)
  const [showStatusEdit, setShowStatusEdit] = useState(false)

  // Calculate hours and minutes from task.estimated_minutes
  const initialHours = task.estimated_minutes ? Math.floor(task.estimated_minutes / 60) : ''
  const initialMinutes = task.estimated_minutes ? task.estimated_minutes % 60 : ''

  const [editHours, setEditHours] = useState(initialHours)
  const [editMinutes, setEditMinutes] = useState(initialMinutes)
  const [editTags, setEditTags] = useState(task.tags ? task.tags.join(', ') : '')
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowTimeEdit(false)
        setShowTagsEdit(false)
        setShowFlagEdit(false)
        setShowStatusEdit(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleUpdateTime = async () => {
    try {
      const totalMinutes = (parseInt(editHours) || 0) * 60 + (parseInt(editMinutes) || 0)
      const minutes = totalMinutes > 0 ? totalMinutes : null
      await updateTask(task.id, { estimated_minutes: minutes })
      setShowTimeEdit(false)
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleUpdateTags = async () => {
    try {
      const tags = editTags
        ? editTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : null
      await updateTask(task.id, { tags })
      setShowTagsEdit(false)
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleUpdateFlag = async (color) => {
    try {
      await updateTask(task.id, { flag_color: color })
      setShowFlagEdit(false)
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleClearFlag = async () => {
    try {
      await updateTask(task.id, { flag_color: null })
      setShowFlagEdit(false)
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTask(task.id, { status: newStatus })
      setShowStatusEdit(false)
      setIsOpen(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="text-gray-400 hover:text-gray-200 p-1"
        title="More options"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-cyber-darkest border border-cyber-orange/30 rounded-lg shadow-lg overflow-hidden">
          {/* Time Edit */}
          {showTimeEdit ? (
            <div className="p-3 border-b border-cyber-orange/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-cyber-orange" />
                <span className="text-sm text-gray-300">Time Estimate</span>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  placeholder="Hours"
                  className="flex-1 px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="flex-1 px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateTime}
                  className="flex-1 px-2 py-1 text-sm bg-cyber-orange/20 text-cyber-orange rounded hover:bg-cyber-orange/30"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowTimeEdit(false)}
                  className="px-2 py-1 text-sm text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTimeEdit(true)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-gray-300 text-sm"
            >
              <Clock size={14} />
              <span>Set Time Estimate</span>
            </button>
          )}

          {/* Tags Edit */}
          {showTagsEdit ? (
            <div className="p-3 border-b border-cyber-orange/20">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-cyber-orange" />
                <span className="text-sm text-gray-300">Tags (comma-separated)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="coding, bug-fix"
                  className="flex-1 px-2 py-1 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={handleUpdateTags}
                  className="text-green-400 hover:text-green-300"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setShowTagsEdit(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTagsEdit(true)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-gray-300 text-sm"
            >
              <Tag size={14} />
              <span>Edit Tags</span>
            </button>
          )}

          {/* Flag Color Edit */}
          {showFlagEdit ? (
            <div className="p-3 border-b border-cyber-orange/20">
              <div className="flex items-center gap-2 mb-2">
                <Flag size={14} className="text-cyber-orange" />
                <span className="text-sm text-gray-300">Flag Color</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {FLAG_COLORS.map(({ name, color }) => (
                  <button
                    key={name}
                    onClick={() => handleUpdateFlag(name)}
                    className={`w-6 h-6 ${color} rounded hover:ring-2 hover:ring-cyber-orange transition-all`}
                    title={name}
                  />
                ))}
              </div>
              <button
                onClick={handleClearFlag}
                className="w-full mt-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 border border-gray-600 rounded"
              >
                Clear Flag
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowFlagEdit(true)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-gray-300 text-sm"
            >
              <Flag size={14} />
              <span>Set Flag Color</span>
            </button>
          )}

          {/* Status Change */}
          {showStatusEdit ? (
            <div className="p-3 border-b border-cyber-orange/20">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo size={14} className="text-cyber-orange" />
                <span className="text-sm text-gray-300">Change Status</span>
              </div>
              <div className="space-y-1">
                {STATUSES.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => handleUpdateStatus(key)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                      task.status === key
                        ? 'bg-cyber-orange/20 border border-cyber-orange/40'
                        : 'hover:bg-cyber-darker border border-transparent'
                    } ${color} transition-all`}
                  >
                    {label} {task.status === key && '✓'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStatusEdit(true)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-gray-300 text-sm"
            >
              <ListTodo size={14} />
              <span>Change Status</span>
            </button>
          )}

          {/* Edit Title */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-gray-300 text-sm"
          >
            <Edit2 size={14} />
            <span>Edit Title</span>
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cyber-darker text-red-400 hover:text-red-300 text-sm border-t border-cyber-orange/20"
          >
            <Trash2 size={14} />
            <span>Delete Task</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskMenu
