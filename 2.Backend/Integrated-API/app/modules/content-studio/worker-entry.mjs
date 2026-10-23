import {createRequire} from 'node:module';
import {createWorkerRunner} from './runner.mjs';
const require=createRequire(import.meta.url);
require('dotenv').config();
if(process.env.CONTENT_STUDIO_ENABLED!=='1')throw new Error('Content worker requires explicit CONTENT_STUDIO_ENABLED=1');
const logger=require('../../../core/logger').create('content');
const {dbHots}=require('../../../config/db');
const {loadContentRuntime}=require('./bootstrap');
const runtime=await loadContentRuntime({pool:dbHots,logger});
const runner=createWorkerRunner({worker:runtime.worker,store:runtime.service.store,logger});
runner.start();
async function stop(){await runner.stop();process.exit(0);}
process.once('SIGTERM',stop);process.once('SIGINT',stop);
