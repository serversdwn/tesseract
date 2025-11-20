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
