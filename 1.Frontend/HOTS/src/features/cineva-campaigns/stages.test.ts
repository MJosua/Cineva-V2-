import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultServiceRules } from '../cineva-services/rules.ts';
import { addDays, assertStagePlan, assertStageTemplate, buildStageCalendar, stagePlanCalendar, defaultStageTemplates, validateExtension, type ExtensionRecord, type StageTemplate } from './stages.ts';
const rules = { ...defaultServiceRules, holidays: [] as string[] };
const [reguler, nonBarang] = defaultStageTemplates;
const ext = (overrides: Partial<ExtensionRecord> = {}): ExtensionRecord =>
  ({ stageKey: 'konten', days: 1, reason: 'Talent sakit', proof: { kind: 'text', text: 'Surat dokter' }, ...overrides });

test('Regular monthly calendar runs sequentially and payment uses working days', () => {
  const calendar = buildStageCalendar(reguler, '2026-11-02', rules);
  assert.deepEqual(calendar.map(stage => [stage.key, stage.start, stage.end]), [
    ['talent', '2026-11-02', '2026-11-08'], ['barang', '2026-11-09', '2026-11-15'],
    ['konten', '2026-11-16', '2026-11-19'], ['payment', '2026-11-20', '2026-12-10']]);
});
test('Non-barang template is 30 calendar days then payment', () => {
  const calendar = buildStageCalendar(nonBarang, '2026-11-02', rules);
  assert.deepEqual(calendar.map(stage => [stage.start, stage.end]), [['2026-11-02', '2026-12-01'], ['2026-12-02', '2026-12-22']]);
});
test('Holidays push the payment end and a missing holiday list is refused', () => {
  const held = buildStageCalendar(reguler, '2026-11-02', { ...rules, holidays: ['2026-11-25'] });
  assert.equal(held.at(-1)!.end, '2026-12-11');
  assert.throws(() => buildStageCalendar(reguler, '2026-11-02'), /libur belum diisi/);
});
test('An extension shifts the stage and every later stage', () => {
  const base = buildStageCalendar(reguler, '2026-11-04', rules), shifted = buildStageCalendar(reguler, '2026-11-04', rules, [ext({ days: 2 })]);
  assert.equal(base[2].end, '2026-11-21');
  assert.equal(shifted[2].end, '2026-11-23');
  assert.equal(shifted[3].start, '2026-11-24');
  assert.equal(base.at(-1)!.end, '2026-12-10');
  assert.equal(shifted.at(-1)!.end, '2026-12-14');
  assert.throws(() => buildStageCalendar(reguler, '2026-11-04', rules, [ext({ stageKey: 'nope' })]), /tidak ada/);
});
test('Extension requires reason, proof, and stays within 2 days in total', () => {
  assert.equal(validateExtension(ext({ reason: '  Banjir ' }), [], reguler).reason, 'Banjir');
  assert.throws(() => validateExtension(ext({ reason: ' ' }), [], reguler), /Alasan/);
  assert.throws(() => validateExtension(ext({ days: 0 }), [], reguler), /minimal 1/);
  assert.throws(() => validateExtension(ext({ days: 3 }), [], reguler), /batas 2/);
  assert.throws(() => validateExtension(ext({ days: 2 }), [ext({ days: 1 })], reguler), /terpakai 1/);
  assert.throws(() => validateExtension(ext({ stageKey: 'nope' }), [], reguler), /tahap yang ada/);
  assert.throws(() => validateExtension(ext({ proof: { kind: 'text', text: ' ' } }), [], reguler), /Bukti teks/);
});
test('Extension may be requested only once per campaign (client answer N28)', () => {
  assert.throws(() => validateExtension(ext({ days: 1 }), [ext({ days: 1 })], reguler), /1 kali/);
  assert.equal(validateExtension(ext({ days: 2 }), [], reguler).days, 2);
  assert.equal(validateExtension(ext({ days: 1 }), [ext({ days: 1 })], reguler, { maxTotalDays: 2 }).days, 1);
});
test('Stage plan is validated and rebuilt into a calendar with its extensions', () => {
  const plan = { templateId: 'reguler-bulanan', startDate: '2026-11-04', holidays: [] as string[], extensions: [] as ExtensionRecord[] };
  assert.equal(stagePlanCalendar(plan).at(-1)!.end, '2026-12-10');
  const extended = { ...plan, extensions: [ext({ days: 2 })] };
  assert.equal(stagePlanCalendar(extended).at(-1)!.end, '2026-12-14');
  assert.throws(() => assertStagePlan({ ...plan, templateId: 'nope' }), /tidak dikenal/);
  assert.throws(() => assertStagePlan({ ...plan, startDate: '2026-02-30' }), /tidak valid/);
  assert.throws(() => assertStagePlan({ ...plan, holidays: ['2026-13-01'] }), /libur/);
  assert.throws(() => assertStagePlan({ ...plan, extensions: [ext({ days: 1 }), ext({ days: 1 })] }), /1 kali/);
  assert.throws(() => assertStagePlan({ ...plan, extensions: [ext({ days: 3 })] }), /batas 2/);
});
test('Extension proof accepts PNG or JPEG only and rejects empty files', () => {
  const png = ext({ proof: { kind: 'png', fileName: 'bukti.PNG', sizeBytes: 1200 } }), jpg = ext({ proof: { kind: 'jpeg', fileName: 'bukti.jpeg', sizeBytes: 1 } });
  assert.equal(validateExtension(png, [], reguler).proof.kind, 'png');
  assert.equal(validateExtension(jpg, [], reguler).proof.kind, 'jpeg');
  assert.throws(() => validateExtension(ext({ proof: { kind: 'png', fileName: 'bukti.pdf', sizeBytes: 10 } }), [], reguler), /PNG atau JPEG/);
  assert.throws(() => validateExtension(ext({ proof: { kind: 'jpeg', fileName: 'bukti.jpg', sizeBytes: 0 } }), [], reguler), /PNG atau JPEG/);
  assert.throws(() => validateExtension(ext({ proof: { kind: 'pdf' } as never }), [], reguler), /PNG, JPEG, atau teks/);
});
test('Templates are validated and dates are checked', () => {
  const bad = (stages: StageTemplate['stages']): StageTemplate => ({ id: 't', name: 'T', stages });
  assert.throws(() => assertStageTemplate(bad([])), /minimal satu/);
  assert.throws(() => assertStageTemplate(bad([{ key: 'a', label: 'A', days: 1, dayKind: 'calendar' }, { key: 'a', label: 'B', days: 1, dayKind: 'calendar' }])), /unik/);
  assert.throws(() => assertStageTemplate(bad([{ key: 'a', label: 'A', days: 0, dayKind: 'calendar' }])), /durasi/);
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.throws(() => addDays('2026-02-30', 1), /valid/);
  assert.throws(() => buildStageCalendar(reguler, '2026-13-01', rules), /tidak valid/);
});
