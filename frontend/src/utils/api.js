const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Projects
export const getProjects = () => fetchAPI('/projects');
export const getProject = (id) => fetchAPI(`/projects/${id}`);
export const createProject = (data) => fetchAPI('/projects', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateProject = (id, data) => fetchAPI(`/projects/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteProject = (id) => fetchAPI(`/projects/${id}`, { method: 'DELETE' });

// Tasks
export const getProjectTasks = (projectId) => fetchAPI(`/projects/${projectId}/tasks`);
export const getProjectTaskTree = (projectId) => fetchAPI(`/projects/${projectId}/tasks/tree`);
export const getTasksByStatus = (projectId, status) =>
  fetchAPI(`/projects/${projectId}/tasks/by-status/${status}`);

export const getTask = (id) => fetchAPI(`/tasks/${id}`);
export const createTask = (data) => fetchAPI('/tasks', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const updateTask = (id, data) => fetchAPI(`/tasks/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const deleteTask = (id) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' });

// JSON Import
export const importJSON = (data) => fetchAPI('/import-json', {
  method: 'POST',
  body: JSON.stringify(data),
});
