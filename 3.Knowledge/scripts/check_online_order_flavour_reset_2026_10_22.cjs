const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = 'D:/Kantor/1.Frontend/E-Order/src/features/orders/components/AddMoreContainer/FlavourNonBulk_Component.jsx';
const source = fs.readFileSync(path, 'utf8');
const handler = source.slice(source.indexOf('const handleFlavourChange ='), source.indexOf('const handleSetCustom ='));
function run(skus, value, pallet = 0, index = 0) {
  const slots = skus.map(sku => ({sku, qty: '50', qty_max: '100', moq: '10', Flavour_tollingID: 9, qty_perpallet: 5, palete_qty: 10}));
  const orders = [{order: {detail: {cont_size: '4', containerList: [{Flavour: slots}]}}}];
  const flavours = ['100', '200', '300'].map(product_code => ({product_code, cont40hc: '100', moq: '10', qty_per_pallet: 5}));
  const execute = new Function('containerOrders', 'flavours', 'pallet', 'setContainerOrders', 'resolveMixedContainerLimit', 'company_id', 'containerRules', 'console', `${handler}; handleFlavourChange(${index}, 0, 0, ${JSON.stringify(value)}, '9', 3);`);
  execute(orders, flavours, pallet, () => {}, () => null, 1, [], {log() {}});
  return slots;
}
const duplicate = run(['100', 200, '300'], '200');
assert.equal(duplicate[0].sku, '200');
assert.equal(duplicate[0].qty, '100');
for (const slot of duplicate.slice(1)) {
  assert.equal(slot.sku, '-1');
  assert.equal(Number(slot.qty), 0);
  assert.equal(slot.Flavour_tollingID, 0);
  assert.equal(slot.qty_perpallet, 0);
  assert.equal(slot.palete_qty, 0);
  assert.equal(slot.qty_max, '');
  assert.equal(slot.moq, '');
}
const distinct = run(['100', '200'], '300');
assert.equal(distinct[1].sku, '200');
assert.equal(Number(distinct[1].qty), 0);
const empty = run(['100', '200'], '-1', 0, 1);
assert.equal(empty[1].sku, '-1');
const pallet = run(['100', '200'], '200', 1);
assert.equal(pallet[1].sku, '-1');
assert.equal(pallet[1].qty_perpallet, 0);
assert.equal(pallet[1].Flavour_tollingID, 0);
console.log('PASS: collision including numeric/string SKU, dependent third-slot reset, metadata reset, distinct SKU preservation, manual clear, pallet clear.');
