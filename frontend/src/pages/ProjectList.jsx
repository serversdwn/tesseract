import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Trash2 } from 'lucide-react'
import { getProjects, createProject, deleteProject, importJSON } from '../utils/api'

function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [importJSON_Text, setImportJSONText] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      const project = await createProject({
        name: newProjectName,
        description: newProjectDesc || null,
      })
      setProjects([...projects, project])
      setShowCreateModal(false)
      setNewProjectName('')
      setNewProjectDesc('')
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleImportJSON = async (e) => {
    e.preventDefault()
    try {
      const data = JSON.parse(importJSON_Text)
      const result = await importJSON(data)
      setShowImportModal(false)
      setImportJSONText('')
      await loadProjects()
      navigate(`/project/${result.project_id}`)
    } catch (err) {
      setError(err.message || 'Invalid JSON format')
    }
  }

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return

    try {
      await deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100">Projects</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-darkest text-cyber-orange border border-cyber-orange/50 rounded hover:bg-cyber-orange/10 transition-colors"
          >
            <Upload size={18} />
            Import JSON
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright transition-colors font-semibold"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded text-red-300">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl mb-2">No projects yet</p>
          <p className="text-sm">Create a new project or import from JSON</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="p-6 bg-cyber-darkest border border-cyber-orange/30 rounded-lg hover:border-cyber-orange hover:shadow-cyber transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-100 group-hover:text-cyber-orange transition-colors">
                  {project.name}
                </h3>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {project.description && (
                <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
              )}
              <p className="text-xs text-gray-600 mt-3">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-cyber-darkest border border-cyber-orange/50 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-cyber-orange mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/30 rounded text-gray-100 focus:border-cyber-orange focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 text-sm">Description (optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/30 rounded text-gray-100 focus:border-cyber-orange focus:outline-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright transition-colors font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-cyber-darkest border border-cyber-orange/50 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-cyber-orange mb-4">Import Project from JSON</h3>
            <form onSubmit={handleImportJSON}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Paste JSON</label>
                <textarea
                  value={importJSON_Text}
                  onChange={(e) => setImportJSONText(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-darker border border-cyber-orange/30 rounded text-gray-100 focus:border-cyber-orange focus:outline-none font-mono text-sm"
                  rows="15"
                  placeholder='{"project": {"name": "My Project", "description": "..."}, "tasks": [...]}'
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyber-orange text-cyber-darkest rounded hover:bg-cyber-orange-bright transition-colors font-semibold"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectList
