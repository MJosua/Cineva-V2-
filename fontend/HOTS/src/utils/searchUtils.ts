
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="search-highlight ">$1</span>');
};

export const matchesSearchTerm = (text: string, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

export const searchInObject = (obj: any, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  
  const searchableValues = Object.values(obj).filter(value => 
    typeof value === 'string' || typeof value === 'number'
  );
  
  return searchableValues.some(value => 
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  );
};
