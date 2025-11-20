// Format minutes into display string (e.g., "1h 30m" or "45m")
export function formatTime(minutes) {
  if (!minutes || minutes === 0) return null;

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

// Format tags as comma-separated string
export function formatTags(tags) {
  if (!tags || tags.length === 0) return null;
  return tags.join(', ');
}

// Calculate sum of all LEAF descendant estimates (hierarchical structure)
// Excludes tasks marked as "done"
export function calculateLeafTime(task) {
  // If no subtasks, this is a leaf - return its own estimate if not done
  if (!task.subtasks || task.subtasks.length === 0) {
    return (task.status !== 'done' && task.estimated_minutes) ? task.estimated_minutes : 0;
  }

  // Has subtasks, so sum up all leaf descendants (excluding done tasks)
  let total = 0;
  for (const subtask of task.subtasks) {
    total += calculateLeafTime(subtask);
  }

  return total;
}

// Calculate sum of all LEAF descendant estimates (flat task list)
// Excludes tasks marked as "done"
export function calculateLeafTimeFlat(task, allTasks) {
  // Find direct children
  const children = allTasks.filter(t => t.parent_task_id === task.id);

  // If no children, this is a leaf - return its own estimate if not done
  if (children.length === 0) {
    return (task.status !== 'done' && task.estimated_minutes) ? task.estimated_minutes : 0;
  }

  // Has children, so sum up all leaf descendants (excluding done tasks)
  let total = 0;
  for (const child of children) {
    total += calculateLeafTimeFlat(child, allTasks);
  }

  return total;
}

// Format time display based on leaf calculation logic
export function formatTimeWithTotal(task, allTasks = null) {
  // Check if task has subtasks
  const hasSubtasks = allTasks
    ? allTasks.some(t => t.parent_task_id === task.id)
    : (task.subtasks && task.subtasks.length > 0);

  // Leaf task: use own estimate
  if (!hasSubtasks) {
    return formatTime(task.estimated_minutes);
  }

  // Parent task: calculate sum of leaf descendants
  const leafTotal = allTasks
    ? calculateLeafTimeFlat(task, allTasks)
    : calculateLeafTime(task);

  // If no leaf estimates exist, fall back to own estimate
  if (leafTotal === 0) {
    return formatTime(task.estimated_minutes);
  }

  // Show leaf total
  return formatTime(leafTotal);
}
