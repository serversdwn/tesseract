# Project Breakdown (MVP)

A self-hosted FastAPI + React/Tailwind application for creating and navigating arbitrarily deep project task trees with JSON imports and Kanban view.

## Stack
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React (Vite) + Tailwind CSS
- Deployment: Dockerfile + docker-compose

## Running locally (development)

### Backend
```bash
cd /workspace/tesseract
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
The frontend expects `VITE_API_BASE` to point to the backend (default `http://localhost:8000`).

## Running with Docker

```bash
docker-compose up --build
```
- Backend: http://localhost:8000 (Swagger docs at `/docs`)
- Frontend: http://localhost:5173

## API Reference
- `GET /api/projects` — list projects.
- `POST /api/projects` — create project. Body: `{ "name": str, "description": str }`.
- `GET /api/projects/{project_id}` — retrieve project.
- `DELETE /api/projects/{project_id}` — delete project.
- `GET /api/projects/{project_id}/tasks` — nested task tree for a project.
- `POST /api/projects/{project_id}/tasks` — create task or subtask. Body fields: `title`, `description?`, `status`, `sort_order`, `parent_task_id?`.
- `PUT /api/tasks/{task_id}` — update a task (any fields above).
- `DELETE /api/tasks/{task_id}` — delete a task.
- `POST /api/import-json` — import project and nested tasks from JSON body matching `example-import.json`.
- `POST /api/import-json-file` — same, via file upload.

## JSON import format
See [`example-import.json`](./example-import.json) for the canonical structure. `subtasks` can nest arbitrarily.

## Features
- Project list and creation UI.
- JSON import via upload.
- Collapsible tree view with inline status/title editing and “Add subtask.”
- Kanban view grouped by status with quick status changes and detail panel.
- Dark theme with orange accent.

