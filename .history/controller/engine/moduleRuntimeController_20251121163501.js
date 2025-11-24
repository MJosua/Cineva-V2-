const { dbQueryHots } = require('../../config/db');
const { loadModule } = require('../../modules/loader');
const engineForm = require('../../modules/ticket/engine-form');
const engineTrigger = require('../../modules/engine-service/core/engine-trigger');
const engineDocument = require('../../modules/engine-service/core/engine-document');

async function saveEav(ticketId, values) {
  const ins = [];
  const params = [];
  let counter = 1;

  Object.keys(values).forEach((key) => {
    const val = values[key];

    ins.push("(?,?,?,?)");
    params.push(ticketId, counter, key, val);

    counter++;
  });

  if (!ins.length) return;

  await dbQueryHots(
    `INSERT INTO t_ticket_detail_eav (ticket_id, cstm_col, lbl_col, value)
     VALUES ${ins.join(",")}`,
    params
  );
}

module.exports={
  getModulePublic:async(req,res)=>{
    console.log("test")
    const m=await loadModule(req.params.moduleKey);
    if(!m) return res.status(404).json({ok:false,message:'not found'});
    res.json({ok:true,module:m});
  },
  submitModule:async(req,res)=>{
    try{
      const key=req.params.moduleKey;
      const m=await loadModule(key);
      if(!m) return res.status(404).json({ok:false,message:'not found'});
      const { company_id, creator_id, creator_email, values }=req.body;
      const errors=engineForm.validateSubmission(m.form_json, values||{});
      if(errors.length) return res.status(400).json({ok:false,errors});
      const ticketId=`ENG-${Date.now()}`;
      await dbQueryHots(
        "INSERT INTO t_ticket_engine (ticket_id,company_id,service_name,creator_id,creator_email,status,workflow_level) VALUES (?,?,?,?,?,'open',0)",
        [ticketId,company_id||0,key,creator_id||null,creator_email||null]
      );
      await saveEav(ticketId, values);
      try{
        engineTrigger.runTriggers(m.triggers_json||[], {ticketId,values},{engineDocument});
      }catch(e){}
      res.json({ok:true,ticketId});
    }catch(e){
      res.status(500).json({ok:false,message:e.message});
    }
  },
  status:async(req,res)=>{
    const rows=await dbQueryHots("SELECT * FROM t_ticket_engine WHERE ticket_id=?",[req.params.ticketId]);
    if(!rows.length) return res.status(404).json({ok:false,message:'not found'});
    const det=await dbQueryHots("SELECT * FROM t_ticket_detail_eav WHERE ticket_id=?",[req.params.ticketId]);
    res.json({ok:true,ticket:rows[0],details:det});
  }
};