import { useState, useEffect } from 'react'
import { X, GripVertical, Plus, Trash2, Check, AlertTriangle } from 'lucide-react'
import { updateProject, getProjectTasks } from '../utils/api'

function ProjectSettings({ project, onClose, onUpdate }) {
  const [statuses, setStatuses] = useState(project.statuses || [])
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [error, setError] = useState('')
  const [taskCounts, setTaskCounts] = useState({})
  const [deleteWarning, setDeleteWarning] = useState(null)

  useEffect(() => {
    loadTaskCounts()
  }, [])

  const loadTaskCounts = async () => {
    try {
      const tasks = await getProjectTasks(project.id)
      const counts = {}
      statuses.forEach(status => {
        counts[status] = tasks.filter(t => t.status === status).length
      })
      setTaskCounts(counts)
    } catch (err) {
      console.error('Failed to load task counts:', err)
    }
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newStatuses = [...statuses]
    const draggedItem = newStatuses[draggedIndex]
    newStatuses.splice(draggedIndex, 1)
    newStatuses.splice(index, 0, draggedItem)

    setStatuses(newStatuses)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleAddStatus = () => {
    const newStatus = `new_status_${Date.now()}`
    setStatuses([...statuses, newStatus])
    setEditingIndex(statuses.length)
    setEditingValue(newStatus)
  }

  const handleStartEdit = (index) => {
    setEditingIndex(index)
    setEditingValue(statuses[index])
  }

  const handleSaveEdit = () => {
    if (!editingValue.trim()) {
      setError('Status name cannot be empty')
      return
    }

    const trimmedValue = editingValue.trim().toLowerCase().replace(/\s+/g, '_')

    if (statuses.some((s, i) => i !== editingIndex && s === trimmedValue)) {
      setError('Status name already exists')
      return
    }

    const newStatuses = [...statuses]
    newStatuses[editingIndex] = trimmedValue
    setStatuses(newStatuses)
    setEditingIndex(null)
    setError('')
  }

  const handleCancelEdit = () => {
    // If it's a new status that was never saved, remove it
    if (statuses[editingIndex].startsWith('new_status_')) {
      const newStatuses = statuses.filter((_, i) => i !== editingIndex)
      setStatuses(newStatuses)
    }
    setEditingIndex(null)
    setError('')
  }

  const handleDeleteStatus = (index) => {
    const statusToDelete = statuses[index]
    const taskCount = taskCounts[statusToDelete] || 0

    if (taskCount > 0) {
      setDeleteWarning({ index, status: statusToDelete, count: taskCount })
      return
    }

    if (statuses.length === 1) {
      setError('Cannot delete the last status')
      return
    }

    const newStatuses = statuses.filter((_, i) => i !== index)
    setStatuses(newStatuses)
  }

  const handleSave = async () => {
    if (statuses.length === 0) {
      setError('Project must have at least one status')
      return
    }

    if (editingIndex !== null) {
      setError('Please save or cancel the status you are editing')
      return
    }

    try {
      await updateProject(project.id, { statuses })
      onUpdate()
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-cyber-darkest border border-cyber-orange/30 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-cyber-orange/20">
          <h2 className="text-2xl font-bold text-gray-100">Project Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Project Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-400">Name:</span>
                <span className="ml-2 text-gray-200">{project.name}</span>
              </div>
              {project.description && (
                <div>
                  <span className="text-sm text-gray-400">Description:</span>
                  <span className="ml-2 text-gray-200">{project.description}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Status Workflow</h3>
            <p className="text-sm text-gray-400 mb-4">
              Drag to reorder, click to rename. Tasks will appear in Kanban columns in this order.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {statuses.map((status, index) => (
                <div
                  key={index}
                  draggable={editingIndex !== index}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-cyber-darker border border-cyber-orange/30 rounded ${
                    draggedIndex === index ? 'opacity-50' : ''
                  } ${editingIndex !== index ? 'cursor-move' : ''}`}
                >
                  {editingIndex !== index && (
                    <GripVertical size={18} className="text-gray-500" />
                  )}

                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        className="flex-1 px-2 py-1 bg-cyber-darkest border border-cyber-orange/50 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(index)}
                        className="flex-1 text-left text-gray-200 hover:text-cyber-orange"
                      >
                        {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                      <span className="text-xs text-gray-500">
                        {taskCounts[status] || 0} task{taskCounts[status] === 1 ? '' : 's'}
                      </span>
                      <button
                        onClick={() => handleDeleteStatus(index)}
                        className="text-gray-400 hover:text-red-400"
                        disabled={statuses.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddStatus}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-cyber-darker border border-cyber-orange/30 text-gray-300 rounded hover:border-cyber-orange/60 hover:bg-cyber-dark transition-colors"
            >
              <Plus size={16} />
              Add Status
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-cyber-orange/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright font-semibold transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* Delete Warning Dialog */}
        {deleteWarning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-cyber-darkest border border-red-500/50 rounded-lg p-6 max-w-md">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">Cannot Delete Status</h3>
                  <p className="text-sm text-gray-300">
                    The status "{deleteWarning.status}" has {deleteWarning.count} task{deleteWarning.count === 1 ? '' : 's'}.
                    Please move or delete those tasks first.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setDeleteWarning(null)}
                  className="px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSettings
