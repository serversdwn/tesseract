from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .models import TaskStatus


# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.BACKLOG
    parent_task_id: Optional[int] = None
    sort_order: int = 0


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    parent_task_id: Optional[int] = None
    sort_order: Optional[int] = None


class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskWithSubtasks(Task):
    subtasks: List['TaskWithSubtasks'] = []

    model_config = ConfigDict(from_attributes=True)


# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectWithTasks(Project):
    tasks: List[Task] = []

    model_config = ConfigDict(from_attributes=True)


# JSON Import Schemas
class ImportSubtask(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.BACKLOG
    subtasks: List['ImportSubtask'] = []


class ImportProject(BaseModel):
    name: str
    description: Optional[str] = None


class ImportData(BaseModel):
    project: ImportProject
    tasks: List[ImportSubtask] = []


class ImportResult(BaseModel):
    project_id: int
    project_name: str
    tasks_created: int
