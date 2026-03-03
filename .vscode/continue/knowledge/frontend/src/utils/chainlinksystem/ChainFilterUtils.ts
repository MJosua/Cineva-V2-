export function getNestedValue(obj: any, path: string): any {
    if (!obj || typeof path !== "string") return undefined;
    return path.split('.').reduce((acc, key) => {
      if (acc && typeof acc === "object") return acc[key];
      return undefined;
    }, obj);
  }