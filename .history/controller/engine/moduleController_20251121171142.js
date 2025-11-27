const { dbQueryHots } = require('../../config/db');
const { loadModule } = require('../../core/loader');


module.exports={
  create:async(req,res)=>{
    try{
      const { module_key, module_name, module_type='form', form_json }=req.body;
      if(!module_key||!module_name) return res.status(400).json({ok:false,message:'missing key/name'});
      const [r]=await dbQueryHots(
        'INSERT INTO m_engine_modules (module_key,module_name,module_type,form_json,active) VALUES (?,?,?,?,1)',
        [module_key,module_name,module_type,form_json?JSON.stringify(form_json):null]
      );
      res.json({ok:true,service_id:r.insertId});
    }catch(e){ res.status(500).json({ok:false,message:e.message}); }
  },
  list:async(req,res)=>{
    const rows=await dbQueryHots('SELECT service_id,module_key,module_name,active FROM m_engine_modules');
    res.json({ok:true,modules:rows});
  },
  get:async(req,res)=>{
    const m=await loadModule(req.params.moduleKey);
    if(!m) return res.status(404).json({ok:false,message:'not found'});
    res.json({ok:true,module:m});
  },
  update:async(req,res)=>{
    try{
      const key=req.params.moduleKey;
      const payload=req.body;
      const sets=[]; const params=[];
      for(const k of ['module_name','module_type','form_json','workflow_json','triggers_json','document_html','theme_json','settings_json','active']){
        if(payload[k]!==undefined){
          sets.push(`${k}=?`);
          let v=payload[k];
          if(typeof v==='object') v=JSON.stringify(v);
          params.push(v);
        }
      }
      params.push(key);
      await dbQueryHots(`UPDATE m_engine_modules SET ${sets.join(',')} WHERE module_key=?`,params);
      res.json({ok:true});
    }catch(e){ res.status(500).json({ok:false,message:e.message}); }
  }
};