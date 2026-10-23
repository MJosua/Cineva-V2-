const items = [
  ['editorial','Editorial','Berita','#152332','#e8bc75','stack'],
  ['golden','Golden Hour','Bersih','#f5f0e7','#936334','clean'],
  ['impact','Impact','Tegas','#201c1a','#ffc868','headline'],
  ['midnight','Midnight','Gelap','#122034','#77c9bd','quote'],
  ['terracotta','Terracotta','Sosial','#6e392c','#ffe3bd','stack'],
  ['minimal','Minimal','Bersih','#ffffff','#765333','clean'],
  ['studio','Studio Note','Sosial','#323d36','#e4d2a6','quote'],
  ['signal','Signal','Berita','#212329','#e1c160','headline'],
];
export const templates = Object.freeze(items.map(([id,name,category,background,accent,layout]) => Object.freeze({id,name,category,background,accent,layout,version:1})));
export function findTemplate(id) { const t=templates.find(x=>x.id===id); if(!t) throw new Error('UNKNOWN_TEMPLATE'); return t; }
export function filterTemplates({query='',category='Semua'}={}, catalog=templates) { return catalog.filter(t=>(category==='Semua'||t.category===category)&&`${t.name} ${t.category}`.toLowerCase().includes(query.toLowerCase())); }
