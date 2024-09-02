export function formatIsoDateString(isoString: string): string {
  const dateObject = new Date(isoString);
  return dateObject.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatIsoTimeString(isoString: string): string {
  const dateObject = new Date(isoString);
  return dateObject.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h12",
  });
}
