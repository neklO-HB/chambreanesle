const formatDateToDisplay = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export function formatDisplayRange(start, end) {
  const formattedStart = formatDateToDisplay(start);
  const formattedEnd = formatDateToDisplay(end);
  if (!formattedStart && !formattedEnd) return '';
  if (formattedStart && !formattedEnd) return formattedStart;
  if (!formattedStart && formattedEnd) return formattedEnd;
  return `${formattedStart} → ${formattedEnd}`;
}

export function formatDisplayDate(date) {
  return formatDateToDisplay(date);
}
