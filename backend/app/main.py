from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from . import models, schemas, crud
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tesseract - Nested Todo Tree API",
    description="API for managing deeply nested todo trees",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== PROJECT ENDPOINTS ==========

@app.get("/api/projects", response_model=List[schemas.Project])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all projects"""
    return crud.get_projects(db, skip=skip, limit=limit)


@app.post("/api/projects", response_model=schemas.Project, status_code=201)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    return crud.create_project(db, project)


@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project"""
    db_project = crud.get_project(db, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)
):
    """Update a project"""
    db_project = crud.update_project(db, project_id, project)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@app.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project and all its tasks"""
    if not crud.delete_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ========== TASK ENDPOINTS ==========

@app.get("/api/projects/{project_id}/tasks", response_model=List[schemas.Task])
def list_project_tasks(project_id: int, db: Session = Depends(get_db)):
    """List all tasks for a project"""
    if not crud.get_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.get_tasks_by_project(db, project_id)


@app.get("/api/projects/{project_id}/tasks/tree", response_model=List[schemas.TaskWithSubtasks])
def get_project_task_tree(project_id: int, db: Session = Depends(get_db)):
    """Get the task tree (root tasks with nested subtasks) for a project"""
    if not crud.get_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    root_tasks = crud.get_root_tasks(db, project_id)

    def build_tree(task):
        task_dict = schemas.TaskWithSubtasks.model_validate(task)
        task_dict.subtasks = [build_tree(subtask) for subtask in task.subtasks]
        return task_dict

    return [build_tree(task) for task in root_tasks]


@app.get("/api/projects/{project_id}/tasks/by-status/{status}", response_model=List[schemas.Task])
def get_tasks_by_status(
    project_id: int,
    status: models.TaskStatus,
    db: Session = Depends(get_db)
):
    """Get all tasks for a project filtered by status (for Kanban view)"""
    if not crud.get_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.get_tasks_by_status(db, project_id, status)


@app.post("/api/tasks", response_model=schemas.Task, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    if not crud.get_project(db, task.project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    if task.parent_task_id and not crud.get_task(db, task.parent_task_id):
        raise HTTPException(status_code=404, detail="Parent task not found")

    return crud.create_task(db, task)


@app.get("/api/tasks/{task_id}", response_model=schemas.Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task"""
    db_task = crud.get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task


@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    db_task = crud.update_task(db, task_id, task)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task and all its subtasks"""
    if not crud.delete_task(db, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return None


# ========== JSON IMPORT ENDPOINT ==========

def _import_tasks_recursive(
    db: Session,
    project_id: int,
    tasks: List[schemas.ImportSubtask],
    parent_id: Optional[int] = None,
    count: int = 0
) -> int:
    """Recursively import tasks and their subtasks"""
    for idx, task_data in enumerate(tasks):
        task = schemas.TaskCreate(
            project_id=project_id,
            parent_task_id=parent_id,
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            sort_order=idx
        )
        db_task = crud.create_task(db, task)
        count += 1

        if task_data.subtasks:
            count = _import_tasks_recursive(
                db, project_id, task_data.subtasks, db_task.id, count
            )

    return count


@app.post("/api/import-json", response_model=schemas.ImportResult)
def import_from_json(import_data: schemas.ImportData, db: Session = Depends(get_db)):
    """
    Import a project with nested tasks from JSON.

    Expected format:
    {
        "project": {
            "name": "Project Name",
            "description": "Optional description"
        },
        "tasks": [
            {
                "title": "Task 1",
                "description": "Optional",
                "status": "backlog",
                "subtasks": [
                    {
                        "title": "Subtask 1.1",
                        "status": "backlog",
                        "subtasks": []
                    }
                ]
            }
        ]
    }
    """
    # Create the project
    project = crud.create_project(
        db,
        schemas.ProjectCreate(
            name=import_data.project.name,
            description=import_data.project.description
        )
    )

    # Recursively import tasks
    tasks_created = _import_tasks_recursive(
        db, project.id, import_data.tasks
    )

    return schemas.ImportResult(
        project_id=project.id,
        project_name=project.name,
        tasks_created=tasks_created
    )


@app.get("/")
def root():
    """API health check"""
    return {
        "status": "online",
        "message": "Tesseract API - Nested Todo Tree Manager",
        "docs": "/docs"
    }


from typing import Optional
