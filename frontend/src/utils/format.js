// Format minutes into display string
export function formatTime(minutes) {
  if (!minutes || minutes === 0) return null;

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

// Format tags as comma-separated string
export function formatTags(tags) {
  if (!tags || tags.length === 0) return null;
  return tags.join(', ');
}

// Recursively calculate total time estimate including all subtasks
export function calculateTotalTime(task) {
  let total = task.estimated_minutes || 0;

  if (task.subtasks && task.subtasks.length > 0) {
    for (const subtask of task.subtasks) {
      total += calculateTotalTime(subtask);
    }
  }

  return total;
}

// Calculate total time for a task from a flat list of all tasks
export function calculateTotalTimeFlat(task, allTasks) {
  let total = task.estimated_minutes || 0;

  // Find all direct children
  const children = allTasks.filter(t => t.parent_task_id === task.id);

  // Recursively add their times
  for (const child of children) {
    total += calculateTotalTimeFlat(child, allTasks);
  }

  return total;
}

// Format time display showing own estimate and total if different
export function formatTimeWithTotal(task, allTasks = null) {
  const ownTime = task.estimated_minutes || 0;

  // If we have a flat task list, use that to calculate total
  const totalTime = allTasks
    ? calculateTotalTimeFlat(task, allTasks)
    : calculateTotalTime(task);

  const subtaskTime = totalTime - ownTime;

  // No time estimates at all
  if (totalTime === 0) return null;

  // Only own estimate, no subtasks with time
  if (subtaskTime === 0) {
    return formatTime(ownTime);
  }

  // Only subtask estimates, no own estimate
  if (ownTime === 0) {
    return `(${formatTime(totalTime)} from subtasks)`;
  }

  // Both own and subtask estimates
  return `${formatTime(ownTime)} (${formatTime(totalTime)} total)`;
}
