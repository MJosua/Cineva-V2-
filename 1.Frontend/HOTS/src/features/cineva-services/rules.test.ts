import test from 'node:test';
import assert from 'node:assert/strict';
import { addWorkingDays, assertServiceRules, defaultServiceRules, isWithinServiceHours, isWorkingDay, overtimeRange, overtimeRate, paymentDueDate, projectClass, type ServiceRules } from './rules.ts';
const rules = (overrides: Partial<ServiceRules> = {}): ServiceRules => ({ ...defaultServiceRules, holidays: [], ...overrides });

test('Default rules mirror client answers and pass validation', () => {
  assert.equal(assertServiceRules(defaultServiceRules), defaultServiceRules);
  assert.deepEqual(defaultServiceRules.crewMinimum, { videographer: 700000, photographer: 700000, editor_basic: 500000, editor_pro: 1000000 });
  assert.equal(defaultServiceRules.standardHours, 6);
});
test('Invalid rules are rejected instead of silently used', () => {
  assert.throws(() => assertServiceRules({ ...defaultServiceRules, version: ' ' }), /versi/);
  assert.throws(() => assertServiceRules({ ...defaultServiceRules, serviceHours: { open: 18, close: 9 } }), /Jam layanan/);
  assert.throws(() => assertServiceRules({ ...defaultServiceRules, classThresholds: { sedangFrom: 9, profesionalAbove: 5 } }), /Ambang/);
  assert.throws(() => assertServiceRules({ ...defaultServiceRules, holidays: ['2026-02-30'] }), /libur/);
});
test('Project class follows total budget thresholds', () => {
  assert.equal(projectClass(0), 'kecil');
  assert.equal(projectClass(4999999), 'kecil');
  assert.equal(projectClass(5000000), 'sedang');
  assert.equal(projectClass(100000000), 'sedang');
  assert.equal(projectClass(100000001), 'profesional');
  assert.throws(() => projectClass(-1), /rupiah/);
  assert.throws(() => projectClass(1.5), /rupiah/);
});
test('Overtime range: small is a range, medium starts at 300 rb, professional is manual', () => {
  assert.deepEqual(overtimeRange(2000000), { projectClass: 'kecil', min: 100000, max: 300000 });
  assert.deepEqual(overtimeRange(20000000), { projectClass: 'sedang', min: 300000 });
  assert.throws(() => overtimeRange(150000000), /dibahas/);
});
test('Overtime rate refuses to guess while the band table is empty, then picks the highest matching band', () => {
  assert.throws(() => overtimeRate(20000000), /N53/);
  const banded = rules({ overtime: { ...defaultServiceRules.overtime, bands: [{ minBudget: 5000000, ratePerHour: 300000 }, { minBudget: 50000000, ratePerHour: 500000 }] } });
  assert.equal(overtimeRate(5000000, banded), 300000);
  assert.equal(overtimeRate(60000000, banded), 500000);
  assert.throws(() => overtimeRate(1000000, banded), /terendah/);
  assert.throws(() => overtimeRate(1, rules({ overtime: { ...defaultServiceRules.overtime, bands: [{ minBudget: 1, ratePerHour: 1 }, { minBudget: 1, ratePerHour: 2 }] } })), /unik/);
});
test('Service hours: weekdays 09.00-18.00 WIB, end exclusive, weekends closed', () => {
  assert.equal(isWithinServiceHours('2026-11-02T09:00'), true);
  assert.equal(isWithinServiceHours('2026-11-02T17:59'), true);
  assert.equal(isWithinServiceHours('2026-11-02T18:00'), false);
  assert.equal(isWithinServiceHours('2026-11-02T08:59'), false);
  assert.equal(isWithinServiceHours('2026-11-07T10:00'), false); // Sabtu
  assert.equal(isWithinServiceHours('2026-11-01T10:00'), false); // Minggu
  assert.throws(() => isWithinServiceHours('2026-11-02 10:00'), /tidak valid/);
  assert.throws(() => isWithinServiceHours('2026-11-02T24:00'), /tidak valid/);
});
test('Working days skip weekends and holidays and require an explicit holiday list', () => {
  assert.equal(isWorkingDay('2026-11-02', rules()), true);
  assert.equal(isWorkingDay('2026-11-07', rules()), false);
  assert.equal(isWorkingDay('2026-11-04', rules({ holidays: ['2026-11-04'] })), false);
  assert.throws(() => isWorkingDay('2026-11-02'), /libur belum diisi/);
  assert.throws(() => addWorkingDays('2026-11-01', 3), /libur belum diisi/);
});
test('Payment is 14 working days after approval, shifting for holidays', () => {
  assert.equal(addWorkingDays('2026-11-01', 0, rules()), '2026-11-01');
  assert.equal(addWorkingDays('2026-11-06', 1, rules()), '2026-11-09'); // Jumat -> Senin
  assert.equal(paymentDueDate('2026-11-01', rules()), '2026-11-19');
  assert.equal(paymentDueDate('2026-11-01', rules({ holidays: ['2026-11-04'] })), '2026-11-20');
  assert.throws(() => addWorkingDays('2026-11-01', -1, rules()), /valid/);
});
test.todo('Overtime rounding (A2): menunggu aturan dari pemilik bisnis di overtimeBillableHours');
