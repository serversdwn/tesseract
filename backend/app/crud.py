from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from . import models, schemas


# Project CRUD
def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_project(db: Session, project_id: int) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100) -> List[models.Project]:
    return db.query(models.Project).offset(skip).limit(limit).all()


def update_project(
    db: Session, project_id: int, project: schemas.ProjectUpdate
) -> Optional[models.Project]:
    db_project = get_project(db, project_id)
    if not db_project:
        return None

    update_data = project.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)

    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    db.delete(db_project)
    db.commit()
    return True


# Task CRUD
def create_task(db: Session, task: schemas.TaskCreate) -> models.Task:
    # Get max sort_order for siblings
    if task.parent_task_id:
        max_order = db.query(models.Task).filter(
            models.Task.parent_task_id == task.parent_task_id
        ).count()
    else:
        max_order = db.query(models.Task).filter(
            models.Task.project_id == task.project_id,
            models.Task.parent_task_id.is_(None)
        ).count()

    task_data = task.model_dump()
    if "sort_order" not in task_data or task_data["sort_order"] == 0:
        task_data["sort_order"] = max_order

    db_task = models.Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def get_task(db: Session, task_id: int) -> Optional[models.Task]:
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def get_tasks_by_project(db: Session, project_id: int) -> List[models.Task]:
    return db.query(models.Task).filter(models.Task.project_id == project_id).all()


def get_root_tasks(db: Session, project_id: int) -> List[models.Task]:
    """Get all root-level tasks (no parent) for a project"""
    return db.query(models.Task).filter(
        models.Task.project_id == project_id,
        models.Task.parent_task_id.is_(None)
    ).order_by(models.Task.sort_order).all()


def get_task_with_subtasks(db: Session, task_id: int) -> Optional[models.Task]:
    """Recursively load a task with all its subtasks"""
    return db.query(models.Task).options(
        joinedload(models.Task.subtasks)
    ).filter(models.Task.id == task_id).first()


def check_and_update_parent_status(db: Session, parent_id: int):
    """Check if all children of a parent are done, and mark parent as done if so"""
    # Get all children of this parent
    children = db.query(models.Task).filter(
        models.Task.parent_task_id == parent_id
    ).all()

    # If no children, nothing to do
    if not children:
        return

    # Check if all children are done
    all_done = all(child.status == models.TaskStatus.DONE for child in children)

    if all_done:
        # Mark parent as done
        parent = get_task(db, parent_id)
        if parent and parent.status != models.TaskStatus.DONE:
            parent.status = models.TaskStatus.DONE
            db.commit()

            # Recursively check grandparent
            if parent.parent_task_id:
                check_and_update_parent_status(db, parent.parent_task_id)


def update_task(
    db: Session, task_id: int, task: schemas.TaskUpdate
) -> Optional[models.Task]:
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    update_data = task.model_dump(exclude_unset=True)
    status_changed = False

    # Check if status is being updated
    if "status" in update_data:
        status_changed = True
        old_status = db_task.status

    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)

    # If status changed to 'done' and this task has a parent, check if parent should auto-complete
    if status_changed and db_task.status == models.TaskStatus.DONE and db_task.parent_task_id:
        check_and_update_parent_status(db, db_task.parent_task_id)

    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True


def get_tasks_by_status(db: Session, project_id: int, status: models.TaskStatus) -> List[models.Task]:
    """Get all tasks for a project with a specific status"""
    return db.query(models.Task).filter(
        models.Task.project_id == project_id,
        models.Task.status == status
    ).all()
