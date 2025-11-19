import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, LayoutList, LayoutGrid } from 'lucide-react'
import { getProject } from '../utils/api'
import TreeView from '../components/TreeView'
import KanbanView from '../components/KanbanView'

function ProjectView() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('tree') // 'tree' or 'kanban'

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const data = await getProject(projectId)
      setProject(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading...</div>
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-cyber-orange hover:text-cyber-orange-bright"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-cyber-orange transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">{project.name}</h2>
            {project.description && (
              <p className="text-gray-400">{project.description}</p>
            )}
          </div>

          <div className="flex gap-2 bg-cyber-darkest rounded-lg p-1 border border-cyber-orange/30">
            <button
              onClick={() => setView('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                view === 'tree'
                  ? 'bg-cyber-orange text-cyber-darkest font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutList size={18} />
              Tree View
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                view === 'kanban'
                  ? 'bg-cyber-orange text-cyber-darkest font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={18} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {view === 'tree' ? (
        <TreeView projectId={projectId} />
      ) : (
        <KanbanView projectId={projectId} />
      )}
    </div>
  )
}

export default ProjectView
