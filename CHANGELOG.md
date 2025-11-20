# Changelog

All notable changes to TESSERACT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-01-XX

### Added
- Strikethrough styling for time estimates when tasks are marked as "done"
- Auto-complete parent tasks when all child tasks are marked as "done"
  - Works recursively up the task hierarchy
  - Parents automatically transition to "done" status when all children complete

### Changed
- Time estimates on completed tasks now display with strikethrough decoration
- Parent task status automatically updates based on children completion state

## [0.1.3] - 2025-01-XX

### Added
- Enhanced task creation forms with metadata fields
  - Title field (required)
  - Tags field (comma-separated input)
  - Time estimate fields (hours and minutes)
  - Flag color selector with 8 color options
- TaskForm component for consistent task creation across views
- Status change dropdown in TaskMenu (no longer requires Kanban view)
- Leaf-based time calculation system
  - Parent tasks show sum of descendant leaf task estimates
  - Prevents double-counting when both parents and children have estimates
  - Excludes "done" tasks from time calculations
- Time format changed from decimal hours to hours + minutes (e.g., "1h 30m" instead of "1.5h")
- CHANGELOG.md and README.md documentation

### Changed
- Task creation now includes all metadata fields upfront
- Time estimates display remaining work (excludes completed tasks)
- Time input uses separate hours/minutes fields instead of single minutes field
- Parent task estimates calculated from leaf descendants only

### Fixed
- Time calculation now accurately represents remaining work
- Time format more human-readable with hours and minutes

## [0.1.2] - 2025-01-XX

### Added
- Metadata fields for tasks:
  - `estimated_minutes` (Integer) - Time estimate stored in minutes
  - `tags` (JSON Array) - Categorization tags
  - `flag_color` (String) - Priority flag with 7 color options
- TaskMenu component with three-dot dropdown
  - Edit time estimates
  - Edit tags (comma-separated)
  - Set flag colors
  - Edit task title
  - Delete tasks
- SearchBar component in header
  - Real-time search with 300ms debounce
  - Optional project filtering
  - Click results to navigate to project
  - Displays metadata in results
- Time and tag display in TreeView and KanbanView
- Flag color indicators on tasks
- Backend search endpoint `/api/search` with project filtering

### Changed
- TreeView and KanbanView now display task metadata
- Enhanced visual design with metadata badges

## [0.1.1] - 2025-01-XX

### Fixed
- Tree view indentation now scales properly with nesting depth
  - Changed from fixed `ml-6` to calculated `marginLeft: ${level * 1.5}rem`
  - Each nesting level adds 1.5rem (24px) of indentation
- Kanban view subtask handling
  - All tasks (including subtasks) now appear as individual draggable cards
  - Subtasks show parent context: "↳ subtask of: [parent name]"
  - Removed nested subtask list display

### Changed
- Improved visual hierarchy in tree view
- Better subtask representation in Kanban board

## [0.1.0] - 2025-01-XX

### Added
- Initial MVP release
- Core Features:
  - Arbitrary-depth nested task hierarchies
  - Two view modes: Tree View and Kanban Board
  - Self-hosted architecture with Docker deployment
  - JSON import for LLM-generated task trees
- Technology Stack:
  - Backend: Python FastAPI with SQLAlchemy ORM
  - Database: SQLite with self-referencing Task model
  - Frontend: React + Tailwind CSS
  - Deployment: Docker with nginx reverse proxy
- Project Management:
  - Create/read/update/delete projects
  - Project-specific task trees
- Task Management:
  - Create tasks with title, description, status
  - Four status types: Backlog, In Progress, Blocked, Done
  - Hierarchical task nesting (task → subtask → sub-subtask → ...)
  - Add subtasks to any task
  - Delete tasks (cascading to all subtasks)
- Tree View:
  - Collapsible hierarchical display
  - Expand/collapse subtasks
  - Visual nesting indentation
  - Inline editing
  - Status display
- Kanban Board:
  - Four columns: Backlog, In Progress, Blocked, Done
  - Drag-and-drop to change status
  - All tasks shown as cards (including subtasks)
- JSON Import:
  - Bulk import task trees from JSON files
  - Supports arbitrary nesting depth
  - Example import file included
- UI/UX:
  - Dark cyberpunk theme
  - Orange (#ff6b35) accent color
  - Responsive design
  - Real-time updates

### Technical Details
- Backend API endpoints:
  - `/api/projects` - Project CRUD
  - `/api/tasks` - Task CRUD
  - `/api/projects/{id}/tree` - Hierarchical task tree
  - `/api/projects/{id}/tasks` - Flat task list
  - `/api/projects/{id}/import` - JSON import
- Database Schema:
  - `projects` table with id, name, description
  - `tasks` table with self-referencing `parent_task_id`
- Frontend Routing:
  - `/` - Project list
  - `/project/:id` - Project view with Tree/Kanban toggle
- Docker Setup:
  - Multi-stage builds for optimization
  - Nginx reverse proxy configuration
  - Named volumes for database persistence
  - Development and production configurations

## Project Information

**TESSERACT** - Task Decomposition Engine
A self-hosted web application for managing deeply nested todo trees with advanced time tracking and project planning capabilities.

**Repository**: https://github.com/serversdwn/tesseract
**License**: MIT
**Author**: serversdwn
