from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from typing import List

from . import models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project Breakdown API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/projects", response_model=List[schemas.Project])
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()


@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Project).filter(models.Project.name == project.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists")
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


def _task_to_tree(task: models.Task) -> schemas.TaskTree:
    return schemas.TaskTree(
        id=task.id,
        project_id=task.project_id,
        parent_task_id=task.parent_task_id,
        title=task.title,
        description=task.description,
        status=task.status,
        sort_order=task.sort_order,
        created_at=task.created_at,
        updated_at=task.updated_at,
        children=sorted(
            [_task_to_tree(child) for child in task.children], key=lambda t: t.sort_order
        ),
    )


@app.get("/api/projects/{project_id}/tasks", response_model=List[schemas.TaskTree])
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    root_tasks = (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id, models.Task.parent_task_id == None)
        .order_by(models.Task.sort_order)
        .all()
    )
    return [_task_to_tree(task) for task in root_tasks]


@app.post("/api/projects/{project_id}/tasks", response_model=schemas.Task)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db_task = models.Task(
        title=task.title,
        description=task.description or "",
        status=task.status,
        sort_order=task.sort_order,
        project_id=project_id,
        parent_task_id=task.parent_task_id,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


def _import_tasks(project_id: int, tasks: List[schemas.ImportTask], db: Session, parent_id=None):
    created = 0
    for index, item in enumerate(tasks):
        db_task = models.Task(
            project_id=project_id,
            parent_task_id=parent_id,
            title=item.title,
            description=item.description or "",
            status=item.status,
            sort_order=index,
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        created += 1
        created += _import_tasks(project_id, item.subtasks, db, parent_id=db_task.id)
    return created


def _import_payload(payload: schemas.ImportPayload, db: Session) -> schemas.ImportSummary:
    created_projects = 0
    project = db.query(models.Project).filter_by(name=payload.project.name).first()
    if not project:
        project = models.Project(name=payload.project.name, description=payload.project.description)
        db.add(project)
        db.commit()
        db.refresh(project)
        created_projects = 1
    created_tasks = _import_tasks(project.id, payload.tasks, db)
    return schemas.ImportSummary(created_projects=created_projects, created_tasks=created_tasks)


@app.post("/api/import-json", response_model=schemas.ImportSummary)
def import_json(payload: schemas.ImportPayload, db: Session = Depends(get_db)):
    return _import_payload(payload, db)


@app.post("/api/import-json-file", response_model=schemas.ImportSummary)
def import_json_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read()
    payload_dict = json.loads(content)
    payload = schemas.ImportPayload(**payload_dict)
    return _import_payload(payload, db)


@app.get("/api", include_in_schema=False)
def api_docs_overview():
    return {
        "endpoints": [
            {"path": "/api/projects", "method": "GET", "description": "List projects"},
            {"path": "/api/projects", "method": "POST", "description": "Create project"},
            {"path": "/api/projects/{project_id}", "method": "GET", "description": "Get project"},
            {"path": "/api/projects/{project_id}", "method": "DELETE", "description": "Delete project"},
            {"path": "/api/projects/{project_id}/tasks", "method": "GET", "description": "Get task tree"},
            {"path": "/api/projects/{project_id}/tasks", "method": "POST", "description": "Create task or subtask"},
            {"path": "/api/tasks/{task_id}", "method": "PUT", "description": "Update task"},
            {"path": "/api/tasks/{task_id}", "method": "DELETE", "description": "Delete task"},
            {"path": "/api/import-json", "method": "POST", "description": "Import project + tasks from JSON"},
            {"path": "/api/import-json-file", "method": "POST", "description": "Import project + tasks from uploaded JSON file"},
        ]
    }
