import { createCommandRegistry } from '@hots/domain-kit';
import type { DemoData } from './model';
import { syncTicketFields, validateData } from './validation';

export interface OfflineCommandContext { mode: 'offline-demo'; canEdit: boolean }
/** Local document editing only. This permissive demo context is not server authorization. */
export function createOfflineCommandRegistry() {
  const commands = createCommandRegistry<DemoData, OfflineCommandContext>();
  commands.register<{ next: DemoData }>('document.update', {
    authorize: context => context.mode === 'offline-demo' && context.canEdit === true,
    validate: input => validateData(input.next),
    execute: (_current, input) => syncTicketFields(input.next),
  });
  return commands;
}
