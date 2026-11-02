import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultServiceRules } from '../cineva-services/rules.ts';
import { assertComposition, assertCrewBands, crewBudgetCoverage, minimumCrewCost, recommendCrew, type CrewBand } from './crewEstimator.ts';
const bands: CrewBand[] = [
  { minBudget: 1000000, composition: { photographer: 1 } },
  { minBudget: 5000000, composition: { videographer: 2, editor_basic: 1 } },
  { minBudget: 100000001, composition: { videographer: 3, photographer: 1, editor_pro: 1 } },
];

test('Minimum crew cost multiplies count, role minimum, and sessions', () => {
  assert.equal(minimumCrewCost({ videographer: 2, editor_basic: 1 }), 1900000);
  assert.equal(minimumCrewCost({ photographer: 1, editor_pro: 1 }, defaultServiceRules, 3), 5100000);
  assert.throws(() => minimumCrewCost({ videographer: 1 }, defaultServiceRules, 0), /sesi/);
});
test('Compositions reject empty sets, unknown roles, and bad counts', () => {
  assert.throws(() => assertComposition({}), /kosong/);
  assert.throws(() => assertComposition({ drone: 1 } as never), /tidak valid/);
  assert.throws(() => assertComposition({ videographer: 0 }), /tidak valid/);
  assert.throws(() => assertComposition({ videographer: 1.5 }), /tidak valid/);
});
test('Budget coverage reports shortfall as a negative remainder', () => {
  assert.deepEqual(crewBudgetCoverage({ videographer: 2, editor_basic: 1 }, 1500000), { minimumCost: 1900000, remaining: -400000, covered: false });
  assert.deepEqual(crewBudgetCoverage({ videographer: 2, editor_basic: 1 }, 1900000), { minimumCost: 1900000, remaining: 0, covered: true });
  assert.throws(() => crewBudgetCoverage({ videographer: 1 }, -5), /rupiah/);
});
test('Crew recommendation refuses to guess while the band table is empty (L6)', () => {
  assert.throws(() => recommendCrew(10000000), /L6/);
  assert.throws(() => recommendCrew(10000000, []), /L6/);
});
test('Crew recommendation picks the highest reached band and reports class and coverage', () => {
  const small = recommendCrew(2000000, bands), medium = recommendCrew(8000000, bands), professional = recommendCrew(150000000, bands);
  assert.deepEqual([small.projectClass, small.composition, small.covered], ['kecil', { photographer: 1 }, true]);
  assert.deepEqual([medium.projectClass, medium.composition, medium.minimumCost], ['sedang', { videographer: 2, editor_basic: 1 }, 1900000]);
  assert.equal(professional.projectClass, 'profesional');
  assert.equal(professional.composition.editor_pro, 1);
  assert.throws(() => recommendCrew(500000, bands), /terendah/);
});
test('Band tables must have unique rupiah thresholds and valid compositions', () => {
  assert.throws(() => assertCrewBands([{ minBudget: 1, composition: { videographer: 1 } }, { minBudget: 1, composition: { photographer: 1 } }]), /unik/);
  assert.throws(() => assertCrewBands([{ minBudget: -1, composition: { videographer: 1 } }]), /rupiah/);
  assert.throws(() => assertCrewBands([{ minBudget: 1, composition: {} }]), /kosong/);
});
