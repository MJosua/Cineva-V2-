
import React, { lazy, ComponentType } from 'react';
import { WidgetProps } from '@/types/widgetTypes';

// Pre-import all widget modules under src/widgets using import.meta.glob
const widgetModules = import.meta.glob('@/widgets/*.tsx');

// Dynamic widget loader with error handling using import.meta.glob
export const loadWidgetComponent = async (componentPath: string): Promise<ComponentType<WidgetProps>> => {
  try {
    // Remove leading slash if present and any quotes
    let cleanPath = componentPath.startsWith('/') ? componentPath.slice(1) : componentPath;
    cleanPath = cleanPath.replace(/^['\"]+|['\"]+$/g, '');

    // Construct the full path with alias and extension
    // Assuming componentPath is just the filename like "JobApplicantsTable"
    const fullPath = `@/widgets/${cleanPath}.tsx`;

    const importer = widgetModules[fullPath];
    if (!importer) {
      // Try looking in components/widgets as fallback
      const fallbackPath = `@/components/widgets/${cleanPath}.tsx`;
      if (widgetModules[fallbackPath]) {
        const module = await widgetModules[fallbackPath]();
        const mod = module as any;
        return mod.default || mod;
      }

      console.error(`Module not found for path: ${fullPath}`);
      throw new Error(`Module not found for path: ${fullPath}`);
    }

    const module = await importer();
    // Type assertion to any to access default property
    const mod = module as any;
    return mod.default || mod;
  } catch (error) {
    console.error(`Failed to load widget component: ${componentPath}`, error);

    // Return a fallback error component
    const FallbackComponent: React.FC<WidgetProps> = (props) => {
      const name = props.widgetName || componentPath;
      return React.createElement('div', {
        className: 'p-4 border border-red-200 rounded-lg bg-red-50'
      }, React.createElement('p', {
        className: 'text-red-600 text-sm'
      }, `Failed to load widget: ${name}`));
    };
    return FallbackComponent;
  }
};

// Create lazy-loaded widget component
export const createLazyWidget = (componentPath: string) => {
  // Look in src/widgets
  const modules = import.meta.glob('../widgets/*.tsx');

  const widgetFile = `../widgets/${componentPath}.tsx`;

  const loader = modules[widgetFile];

  if (!loader) {
    console.error(`Widget not found: ${widgetFile}`);

    // Fallback to components/widgets just in case
    const oldModules = import.meta.glob('../components/widgets/**/*.tsx');
    const oldWidgetFile = `../components/widgets/${componentPath}.tsx`;
    if (oldModules[oldWidgetFile]) {
      return React.lazy(oldModules[oldWidgetFile] as any);
    }

    throw new Error(`Widget not found: ${widgetFile}`);
  }
  return React.lazy(loader as any);
};