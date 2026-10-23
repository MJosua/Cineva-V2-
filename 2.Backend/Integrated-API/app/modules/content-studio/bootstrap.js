'use strict';
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
/** Deployment composition is opt-in. No default credentials, migrations, or demo identity. */
async function loadContentRuntime({pool,logger,env=process.env}){
  if(env.CONTENT_STUDIO_ENABLED!=='1')return null;
  const directory=await fs.realpath(path.resolve(__dirname,'../../../config'));
  if(!/^[a-zA-Z0-9_-]+\.(cjs|mjs)$/.test(env.CONTENT_RUNTIME_FACTORY||''))throw new Error('Explicit content runtime factory filename required');
  const file=await fs.realpath(path.join(directory,env.CONTENT_RUNTIME_FACTORY));
  if(path.dirname(file)!==directory)throw new Error('Content runtime factory must belong to backend config');
  const module=await import(pathToFileURL(file).href),factory=module.createRuntime||module.default?.createRuntime;
  if(typeof factory!=='function')throw new Error('Content factory must export createRuntime');
  const runtime=await factory({pool,logger});
  if(!runtime?.service||!runtime?.worker||!runtime?.authorize||!runtime?.assertMutation)throw new Error('Incomplete content runtime');
  return runtime;
}
module.exports={loadContentRuntime};
