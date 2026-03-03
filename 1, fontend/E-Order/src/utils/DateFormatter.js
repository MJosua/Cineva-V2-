export const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty or undefined dates
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };



