import test from 'node:test';
import assert from 'node:assert/strict';
import { briefSchema } from '../../../1.Frontend/HOTS/src/features/cineva-services/catalog';
import { advanceServiceWorkflow, getServiceWorkflow, serviceStages, transitionServiceWorkflow, validateServiceDetails } from '../../../1.Frontend/HOTS/src/features/cineva-services/workflow';
import type { ProjectType } from '../../../1.Frontend/HOTS/src/features/cineva-shared/model';

test('Legacy briefs remain valid with optional service details, scoped by service type', () => {
  for (const type of ['Campaign', 'Production', 'Content Shoot'] as ProjectType[]) {
    validateServiceDetails(type, {});
    const fields = briefSchema(type).fields;
    assert.equal(new Set(fields.map(field => field.name)).size, fields.length);
    const added = ['scopeOfWork', 'deliverablePlan', 'reportingCadence', 'preProduction', 'productionPlan', 'postProduction', 'sessionCount', 'sessionPlan', 'sessionNotes'];
    assert.ok(fields.filter(field => added.includes(field.name)).every(field => !field.required));
  }
  assert.ok(briefSchema('Campaign').fields.some(field => field.name === 'scopeOfWork'));
  assert.ok(!briefSchema('Production').fields.some(field => field.name === 'sessionCount'));
  assert.ok(!briefSchema('Content Shoot').fields.some(field => field.name === 'postProduction'));
});

test('Session count rejects invalid quantities and keeps absent legacy values valid', () => {
  for (const count of [undefined, null, '', 1, '2', 365]) validateServiceDetails('Content Shoot', { sessionCount: count });
  for (const count of [0, -1, 1.5, 366, 'many', Infinity, true])
    assert.throws(() => validateServiceDetails('Content Shoot', { sessionCount: count }));
});

test('Each service follows its own sequence and rejects skipping, repeating, reverse and terminal updates', () => {
  for (const type of ['Campaign', 'Production', 'Content Shoot'] as ProjectType[]) {
    let state = getServiceWorkflow(type);
    assert.throws(() => transitionServiceWorkflow(type, state, serviceStages[type][2].id));
    assert.throws(() => transitionServiceWorkflow(type, state, state.stage));
    while (state.stage !== 'completed') {
      const before = structuredClone(state), next = advanceServiceWorkflow(type, state);
      assert.deepEqual(state, before);
      assert.equal(next.history.length, state.history.length + 1);
      state = next;
    }
    assert.throws(() => advanceServiceWorkflow(type, state));
    assert.throws(() => transitionServiceWorkflow(type, state, serviceStages[type][0].id));
  }
});

test('Workflow rejects foreign service stages and corrupted history; reads return independent copies', () => {
  const campaign = advanceServiceWorkflow('Campaign');
  assert.throws(() => getServiceWorkflow('Production', campaign));
  assert.throws(() => getServiceWorkflow('Campaign', { stage: 'completed', history: ['completed'] }));
  const copy = getServiceWorkflow('Campaign', campaign);
  copy.history.push('bad');
  assert.equal(campaign.history.length, 2);
  assert.equal(getServiceWorkflow('Production').stage, 'preproduction');
  assert.equal(getServiceWorkflow('Content Shoot').stage, 'preparation');
});
