import {fail} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
/** Explicit lifecycle, bounded pagination, one tick in flight. Independent PM2 workers share DB leases. */
export function createWorkerRunner({worker,store,logger,intervalMs=5000,pageSize=25}){
  fail(worker?.tick&&store?.scopes&&logger?.warn&&intervalMs>=1000&&pageSize>0&&pageSize<=100,'RUNNER_CONFIGURATION');
  let stopped=true,timer=null,running=null,offset=0;
  async function once(){if(running)return running;running=(async()=>{const scopes=await store.scopes({limit:pageSize,offset});for(const scope of scopes){try{await worker.tick(scope);}catch{logger.warn('[CONTENT][WARN] : worker_scope_failed');}}offset=scopes.length===pageSize?offset+pageSize:0;return scopes.length;})().finally(()=>{running=null;});return running;}
  async function loop(){if(stopped)return;try{await once();}catch{logger.warn('[CONTENT][WARN] : worker_tick_failed');}if(!stopped)timer=setTimeout(loop,intervalMs);}
  return {once,start(){if(!stopped)return;stopped=false;timer=setTimeout(loop,0);},async stop(){stopped=true;clearTimeout(timer);await running;}};
}
