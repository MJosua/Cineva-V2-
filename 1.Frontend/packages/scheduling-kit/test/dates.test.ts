import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dateOrdinal, dateFromOrdinal, weekDates, monthDates, shiftMonth, clockSlots, dateKeyAt, expandDateRecurrence } from '../src/dates.ts';
test('strict calendar arithmetic handles leap days, month clamps and year boundaries',()=>{
  assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(shiftMonth('2026-01-31',1),'2026-02-28');assert.equal(shiftMonth('2028-01-31',1),'2028-02-29');
  assert.equal(dateFromOrdinal(dateOrdinal('0099-01-01')),'0099-01-01');
  for(const bad of ['2026-02-29','2026-13-01','2026-1-01','hello'])assert.throws(()=>dateOrdinal(bad));
});
test('month and week ranges are stable and independent of machine timezone',()=>{
  assert.deepEqual(weekDates('2026-10-29'),['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']);
  const dates=monthDates('2026-10-29');assert.equal(dates.length,42);assert.equal(dates[0],'2026-09-28');
  assert.throws(()=>weekDates('2026-10-29',8));
});
test('explicit-zone date keys respect opposite sides of midnight and DST boundaries',()=>{
  const at=Date.parse('2026-10-29T00:00:00Z');assert.equal(dateKeyAt(at,'America/Los_Angeles'),'2026-10-28');assert.equal(dateKeyAt(at,'Asia/Jakarta'),'2026-10-29');
  assert.equal(dateKeyAt(Date.parse('2026-03-08T10:00:00Z'),'America/Los_Angeles'),'2026-03-08');assert.throws(()=>dateKeyAt(at,'Not/AZone'));
});
test('clock slots include end boundary and reject malformed or uneven ranges',()=>{
  assert.deepEqual(clockSlots('23:00','24:00',30),['23:00','23:30','24:00']);
  assert.throws(()=>clockSlots('08:00','09:00',0));assert.throws(()=>clockSlots('08:00','09:00',40));assert.throws(()=>clockSlots('25:00'));
});
test('daily recurrence is bounded, counts before exclusions and does not mutate rules',()=>{
  const rule={frequency:'daily' as const,count:4,exclude:['2026-10-30']};
  assert.deepEqual(expandDateRecurrence('2026-10-29',rule,{from:'2026-10-29',to:'2026-11-05'}),['2026-10-29','2026-10-31','2026-11-01']);
  assert.deepEqual(rule.exclude,['2026-10-30']);assert.throws(()=>expandDateRecurrence('2020-01-01',rule,{from:'2020-01-01',to:'2050-01-01'}));
});
test('weekly recurrence uses Monday-anchored weeks, explicit weekdays and until',()=>{
  assert.deepEqual(expandDateRecurrence('2026-10-26',{frequency:'weekly',interval:2,weekdays:[1,3],until:'2026-11-10'},{from:'2026-10-26',to:'2026-11-30'}),['2026-10-26','2026-10-28','2026-11-09']);
  assert.throws(()=>expandDateRecurrence('2026-10-26',{frequency:'weekly',weekdays:[7]},{from:'2026-10-26',to:'2026-11-01'}));
  assert.throws(()=>expandDateRecurrence('2026-01-01',{frequency:'daily'},{from:'2026-01-01',to:'2029-01-01'}),/1000/);
});
