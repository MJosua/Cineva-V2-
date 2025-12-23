// utils/dateUtils.js
const formatDate = (dateString) => {
  if (!dateString) return "-"; // Handle empty or undefined dates
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

module.exports = { formatDate }; // Export for Node.js