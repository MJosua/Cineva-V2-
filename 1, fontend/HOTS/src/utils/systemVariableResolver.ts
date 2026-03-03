import { SYSTEM_VARIABLE_ENTRIES, SystemVariableContext } from './systemVariableDefinitions/systemVariableDefinitions';

/**
 * Resolves a system variable like `${user.email}` or
 * `${departments(filter: "region = 'east'")}`.
 */
export const resolveSystemVariable = (
  value: string,
  context: SystemVariableContext
): string | string[] => {
  if (typeof value !== 'string' || !value.includes('${')) return value;

  // Direct match
  const directMatch = SYSTEM_VARIABLE_ENTRIES.find(entry => entry.key === value);
  if (directMatch) {
    return directMatch.resolve(context);
  }

  // Filtered pattern match
  const filterMatch = value.match(/\$\{(\w+)\(filter:\s*"([^"]+)"\)\}/);
  if (filterMatch) {
    const [, variableName, filterExpression] = filterMatch;

    const filterParts = filterExpression.split('=').map(part => part.trim());
    if (filterParts.length === 2) {
      const [rawKey, rawVal] = filterParts;
      const key = rawKey;
      const valueToMatch = rawVal.replace(/^['"]|['"]$/g, '').toLowerCase();

      const dataArray = (context as any)[variableName];
      if (Array.isArray(dataArray)) {
        return dataArray
          .filter(item => item?.[key]?.toLowerCase().includes(valueToMatch))
          .map(item =>
            item.name || item.department_name || item.division_name || item.username
          )
          .filter(Boolean);
      }
    }
  }

  // Fallback
  return value;
};
