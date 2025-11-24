const { dbQueryHots } = require('../../../config/db');
const LRU = require('lru-cache');
const cache = new LRU({ max: 200, ttl: 60000 });

async function loadModule(key){
  const c=cache.get(key); if(c) return c;
  const rows=await dbQueryHots('SELECT * FROM m_engine_modules WHERE module_key=? AND active=1',[key]);
  if(!rows.length) return null;
  const m=rows[0];
  const obj={...m};
  ['form_json','workflow_json','triggers_json','theme_json','settings_json'].forEach(k=>{
    if(obj[k] && typeof obj[k]==='string'){ try{ obj[k]=JSON.parse(obj[k]); }catch(e){} }
  });
  cache.set(key,obj);
  return obj;
}
module.exports={ loadModule, cache };