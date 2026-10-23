import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {connectHots} from './hotsConnection.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),require=createRequire(import.meta.url);
const {resolveCompanyScopes}=require('../../../2.Backend/packages/tenant-server/src/companyScope');
const report={user:'kevin.sietho',user_id:1150,root_company_id:1,known_descendants:[2,3,4],permissions:['brand.read','resources.read'],changedExistingRows:0,inserted:[]};
let conn,open=false,locked=false;
try {
 conn=await connectHots();const [[lock]]=await conn.query("SELECT GET_LOCK('cineva.saas.pilot.seed',0) AS acquired");assert.equal(Number(lock.acquired),1);locked=true;
 await conn.beginTransaction();open=true;
 const [[user]]=await conn.execute('SELECT user_id,uid,active,role_id FROM user WHERE user_id=1150 FOR UPDATE');assert.equal(user.uid,'kevin.sietho');assert.equal(user.active,1);assert.equal(user.role_id,2);
 const [companies]=await conn.query('SELECT company_id,company_name,is_active FROM m_company ORDER BY company_id FOR UPDATE');
 for(const id of [1,2,3,4])assert.equal(companies.find(c=>c.company_id===id)?.is_active,1);
 const [programs]=await conn.query('SELECT program_id,system_shortname,client_id FROM m_company_program_list ORDER BY program_id FOR UPDATE');assert.equal(programs.find(p=>p.program_id===103)?.client_id,'hots-web');
 let overseas=programs.find(p=>p.system_shortname==='hots-overseas');
 if(!overseas){const id=Math.max(...programs.map(p=>p.program_id))+1;await conn.execute('INSERT INTO m_company_program_list (program_id,system_name,system_shortname,system_description,creation_date,sso_enabled) VALUES (?,?,?,?,CURRENT_DATE,0)',[id,'HOTS Overseas','hots-overseas','Separate SaaS program; SSO client not activated']);overseas={program_id:id};report.inserted.push('overseas-program-disabled-sso');}
 report.overseas_program_id=overseas.program_id;
 const [relations]=await conn.query('SELECT parent_company_id,child_company_id,is_active FROM t_tenant_company_relation ORDER BY child_company_id FOR UPDATE');
 for(const child of [2,3,4]){const existing=relations.find(r=>r.child_company_id===child);if(existing){assert.equal(existing.parent_company_id,1);assert.equal(existing.is_active,1);}else{await conn.execute('INSERT INTO t_tenant_company_relation (child_company_id,parent_company_id) VALUES (?,1)',[child]);relations.push({child_company_id:child,parent_company_id:1,is_active:1});report.inserted.push(`company-relation-1-${child}`);}}
 resolveCompanyScopes({userId:'1150',tenantKey:'hots',companies,relations:relations.filter(r=>r.is_active===1),grants:[]}); // Cycle validation before commit.
 for(const program of [103,overseas.program_id]){
  const [existing]=await conn.execute('SELECT * FROM t_tenant_company_grant WHERE user_id=1150 AND program_id=? AND root_company_id=1 FOR UPDATE',[program]);
  if(existing.length){const row=existing[0],permissions=typeof row.permissions==='string'?JSON.parse(row.permissions):row.permissions;assert.equal(row.include_descendants,1);assert.equal(row.role_key,'excom');assert.equal(row.is_active,1);assert.deepEqual(permissions,report.permissions);}
  else{await conn.execute('INSERT INTO t_tenant_company_grant (user_id,program_id,root_company_id,include_descendants,role_key,permissions) VALUES (1150,?,1,1,?,?)',[program,'excom',JSON.stringify(report.permissions)]);report.inserted.push(`excom-read-grant-${program}`);}
 }
 await conn.commit();open=false;report.success=true;
}catch(error){if(open)await conn.rollback();report.success=false;report.error=error.code||'PILOT_SEED_VALIDATION_FAILED';process.exitCode=1;}
finally{if(conn){if(locked)await conn.query("SELECT RELEASE_LOCK('cineva.saas.pilot.seed')");await conn.end();}await fs.writeFile(path.join(root,'3.Knowledge/reports/tenant_foundation_2026_10_21/pilot-grants.json'),JSON.stringify(report,null,2));process.stdout.write(`[TENANT-PILOT][${report.success?'INFO':'ERROR'}] : additive grant setup success=${report.success}; existing rows changed=0\n`);}
