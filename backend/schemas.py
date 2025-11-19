from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = Field(default="backlog")
    sort_order: int = 0
    parent_task_id: Optional[int] = None


class TaskCreate(TaskBase):
    project_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    sort_order: Optional[int] = None
    parent_task_id: Optional[int] = Field(default=None)


class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class TaskTree(Task):
    children: List["TaskTree"] = Field(default_factory=list)


TaskTree.update_forward_refs()


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ImportTask(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = "backlog"
    subtasks: List["ImportTask"] = Field(default_factory=list)


ImportTask.update_forward_refs()


class ImportPayload(BaseModel):
    project: ProjectBase
    tasks: List[ImportTask]


class ImportSummary(BaseModel):
    created_projects: int
    created_tasks: int
