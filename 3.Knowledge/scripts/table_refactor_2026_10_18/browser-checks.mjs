import assert from 'node:assert/strict';

export async function checkTableRefactor(page, check) {
  const fixture=page.getByTestId('table-refactor');
  const state=async()=>JSON.parse(await fixture.getByTestId('table-refactor-state').textContent());
  const click=label=>fixture.getByRole('button',{name:label,exact:true}).click();
  await check('Table selection preserves off-page keys and partial selection',async()=>{
    await click('Select page');
    assert.deepEqual((await state()).selected,[99,1,2,3]);
    assert.equal((await state()).all,true);
    await click('Toggle first');
    assert.deepEqual((await state()).selected,[99,2,3]);
    assert.equal((await state()).some,true);
    await click('Select page');await click('Select page');
    assert.deepEqual((await state()).selected,[99]);
    assert.equal((await state()).some,false);
  });
  await check('Table grouping collapses locally and delegates controlled groups',async()=>{
    await click('Group team');
    assert.deepEqual((await state()).groups.map(g=>[g.groupValue,g.count]),[['A',2],['B',1]]);
    await click('Collapse A');assert.deepEqual((await state()).collapsed,['A']);
    await click('Group team');assert.deepEqual((await state()).collapsed,[]);
    await click('Controlled group');await click('Group team');
    assert.equal((await state()).group,'team');assert.equal((await state()).groups,null);
  });
  await check('Table drag order persists by report and survives remount',async()=>{
    await fixture.getByTestId('drag-id').dragTo(fixture.getByTestId('drag-team'));
    assert.deepEqual((await state()).order,['team','id']);assert.equal((await state()).dragging,null);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('report-table:dummy-refactor:column-order'))),['team','id']);
    await page.reload();
    await fixture.waitFor();assert.deepEqual((await state()).order,['team','id']);
  });
}
