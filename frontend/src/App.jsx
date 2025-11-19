import { Routes, Route } from 'react-router-dom'
import ProjectList from './pages/ProjectList'
import ProjectView from './pages/ProjectView'

function App() {
  return (
    <div className="min-h-screen bg-cyber-dark">
      <header className="border-b border-cyber-orange/30 bg-cyber-darkest">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-cyber-orange">
            TESSERACT
            <span className="ml-3 text-sm text-gray-500">Task Decomposition Engine</span>
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
