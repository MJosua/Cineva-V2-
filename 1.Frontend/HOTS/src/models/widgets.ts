
import { WidgetPreset } from '@/types/widgetTypes';
import { widgetRegistry, getAllWidgets, getWidgetCategories as getRegistryCategories } from '@/registry/widgetRegistry';

// Use the registry as the source of truth
export const widgetPresets: WidgetPreset[] = getAllWidgets();

export const getWidgetPresetById = (id: string): WidgetPreset | undefined => {
  return widgetRegistry[id];
};

export const getWidgetPresetsByCategory = (category: string): WidgetPreset[] => {
  return widgetPresets.filter(widget => widget.category === category);
};

export const getWidgetCategories = (): string[] => {
  return getRegistryCategories();
};
