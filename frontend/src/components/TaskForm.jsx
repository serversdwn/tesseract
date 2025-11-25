import { useState } from 'react'
import { Flag } from 'lucide-react'

const FLAG_COLORS = [
  { name: null, label: 'None', color: 'bg-gray-700' },
  { name: 'red', label: 'Red', color: 'bg-red-500' },
  { name: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { name: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { name: 'green', label: 'Green', color: 'bg-green-500' },
  { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { name: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { name: 'pink', label: 'Pink', color: 'bg-pink-500' }
]

// Helper to format status label
const formatStatusLabel = (status) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function TaskForm({ onSubmit, onCancel, submitLabel = "Add", projectStatuses = null, defaultStatus = "backlog" }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [flagColor, setFlagColor] = useState(null)
  const [status, setStatus] = useState(defaultStatus)

  // Use provided statuses or fall back to defaults
  const statuses = projectStatuses || ['backlog', 'in_progress', 'on_hold', 'done']

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    // Convert hours and minutes to total minutes
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

    // Parse tags
    const tagList = tags
      ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : null

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      tags: tagList && tagList.length > 0 ? tagList : null,
      estimated_minutes: totalMinutes > 0 ? totalMinutes : null,
      flag_color: flagColor,
      status: status
    }

    onSubmit(taskData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cyber-darkest border border-cyber-orange/30 rounded-lg p-4 space-y-3">
      {/* Title */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Task Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional task description..."
          rows="3"
          className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange resize-y"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="coding, bug-fix, frontend"
          className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
        />
      </div>

      {/* Time Estimate */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Time Estimate</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Minutes"
              className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Flag Color */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Flag Color</label>
        <div className="flex gap-2 flex-wrap">
          {FLAG_COLORS.map(({ name, label, color }) => (
            <button
              key={name || 'none'}
              type="button"
              onClick={() => setFlagColor(name)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                flagColor === name
                  ? 'bg-cyber-orange/20 border-2 border-cyber-orange'
                  : 'border-2 border-transparent hover:border-cyber-orange/40'
              }`}
              title={label}
            >
              <div className={`w-4 h-4 ${color} rounded`} />
              {flagColor === name && '✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright font-semibold text-sm transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TaskForm
