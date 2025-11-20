import { useState, useEffect, useRef } from 'react'
import { Search, X, Flag } from 'lucide-react'
import { searchTasks, getProjects } from '../utils/api'
import { formatTime } from '../utils/format'
import { useNavigate } from 'react-router-dom'

const FLAG_COLORS = {
  red: 'text-red-500',
  orange: 'text-orange-500',
  yellow: 'text-yellow-500',
  green: 'text-green-500',
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  pink: 'text-pink-500'
}

function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProjects, setSelectedProjects] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showProjectFilter, setShowProjectFilter] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
        setShowProjectFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const projectIds = selectedProjects.length > 0 ? selectedProjects : null
      const data = await searchTasks(searchQuery, projectIds)
      setResults(data)
      setShowResults(true)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleQueryChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
  }

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, selectedProjects])

  const toggleProjectFilter = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId)
      } else {
        return [...prev, projectId]
      }
    })
  }

  const handleTaskClick = (task) => {
    navigate(`/project/${task.project_id}`)
    setShowResults(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => query && setShowResults(true)}
            placeholder="Search tasks..."
            className="w-64 pl-9 pr-8 py-2 bg-cyber-darker border border-cyber-orange/30 rounded text-gray-100 text-sm focus:outline-none focus:border-cyber-orange placeholder-gray-500"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Project Filter Button */}
        {projects.length > 1 && (
          <button
            onClick={() => setShowProjectFilter(!showProjectFilter)}
            className={`px-3 py-2 text-sm rounded border ${
              selectedProjects.length > 0
                ? 'bg-cyber-orange/20 border-cyber-orange text-cyber-orange'
                : 'bg-cyber-darker border-cyber-orange/30 text-gray-400'
            } hover:border-cyber-orange transition-colors`}
          >
            {selectedProjects.length > 0 ? `${selectedProjects.length} Project(s)` : 'All Projects'}
          </button>
        )}
      </div>

      {/* Project Filter Dropdown */}
      {showProjectFilter && (
        <div className="absolute top-12 right-0 z-50 w-64 bg-cyber-darkest border border-cyber-orange/30 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 mb-1">Filter by projects:</div>
            {projects.map(project => (
              <label
                key={project.id}
                className="flex items-center gap-2 px-2 py-2 hover:bg-cyber-darker rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => toggleProjectFilter(project.id)}
                  className="rounded border-cyber-orange/50 bg-cyber-darker text-cyber-orange focus:ring-cyber-orange focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">{project.name}</span>
              </label>
            ))}
            {selectedProjects.length > 0 && (
              <button
                onClick={() => {
                  setSelectedProjects([])
                  if (query) handleSearch(query)
                }}
                className="w-full mt-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 border border-gray-600 rounded"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-12 left-0 z-50 w-96 bg-cyber-darkest border border-cyber-orange/30 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 mb-1">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map(task => {
                const project = projects.find(p => p.id === task.project_id)
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="w-full text-left px-2 py-2 hover:bg-cyber-darker rounded transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {/* Flag */}
                      {task.flag_color && FLAG_COLORS[task.flag_color] && (
                        <Flag size={12} className={`mt-0.5 ${FLAG_COLORS[task.flag_color]}`} fill="currentColor" />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="text-sm text-gray-200 truncate">{task.title}</div>

                        {/* Project name */}
                        {project && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            in: <span className="text-cyber-orange">{project.name}</span>
                          </div>
                        )}

                        {/* Metadata */}
                        {(task.estimated_minutes || (task.tags && task.tags.length > 0)) && (
                          <div className="flex items-center gap-2 mt-1">
                            {task.estimated_minutes && (
                              <span className="text-xs text-gray-500">{formatTime(task.estimated_minutes)}</span>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {task.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-1 py-0.5 text-xs bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
