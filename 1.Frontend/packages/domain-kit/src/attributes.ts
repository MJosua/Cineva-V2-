import { safePath, type Issue } from './validation.ts';
export type AttributeType = 'integer' | 'number' | 'text' | 'tag' | 'date' | 'money';
export interface AttributeConfig { type: AttributeType; path?: string; required?: boolean; min?: number; max?: number; allowed?: readonly string[] }
/** Money is an integer in the caller's declared minor unit; no currency assumptions. */
export function validateAttribute(value: unknown, config: AttributeConfig): Issue[] {
  const invalid = (code: string, message: string): Issue[] => [{ code, path: config?.path ?? '', message }];
  if (!config || !['integer', 'number', 'text', 'tag', 'date', 'money'].includes(config.type) ||
      (config.path !== undefined && !safePath(config.path)) ||
      [config.min, config.max].some(bound => bound !== undefined && !Number.isFinite(bound)) ||
      (config.min !== undefined && config.max !== undefined && config.min > config.max) ||
      (config.allowed !== undefined && (!Array.isArray(config.allowed) || !config.allowed.every(tag => typeof tag === 'string'))))
    return [{ code: 'invalid_attribute_config', path: '', message: 'Invalid attribute configuration.' }];
  if (value === null || value === undefined || value === '') return config.required ? invalid('required', 'Value is required.') : [];
  if (['integer', 'number', 'money'].includes(config.type)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || (config.type !== 'number' && !Number.isSafeInteger(value))) return invalid('invalid_number', 'Expected a finite number in the configured numeric format.');
    if ((config.min !== undefined && value < config.min) || (config.max !== undefined && value > config.max)) return invalid('out_of_range', 'Number is outside the configured bounds.');
  } else {
    if (typeof value !== 'string' || !value.trim()) return invalid('invalid_text', 'Expected non-empty text.');
    if ((config.min !== undefined && value.length < config.min) || (config.max !== undefined && value.length > config.max)) return invalid('out_of_range', 'Text length is outside the configured bounds.');
    if (config.type === 'date') {
      const date = new Date(value + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return invalid('invalid_date', 'Expected a valid YYYY-MM-DD calendar date.');
    }
    if (config.allowed && !config.allowed.includes(value)) return invalid('invalid_choice', 'Value is not in the configured choices.');
  }
  return [];
}
