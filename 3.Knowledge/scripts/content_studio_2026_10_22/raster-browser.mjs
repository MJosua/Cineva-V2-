import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createDocument,renderManifest} from '../../../1.Frontend/packages/content-kit/src/index.mjs';
import {createPuppeteerRasterizer} from '../../../2.Backend/Integrated-API/app/modules/content-studio/media.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/content_studio_2026_10_22'),require=createRequire(path.join(root,'2.Backend/Integrated-API/package.json')),puppeteer=require('puppeteer');
const browser=await puppeteer.launch({headless:true,executablePath:'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try{const rasterize=createPuppeteerRasterizer({browser}),checks=[];
 for(const format of ['4:5','9:16']){const d=createDocument({id:'server-render',format,title:'Bukti render server'}),m=renderManifest(d);const png=Buffer.from(await rasterize(m.slides[0],m));assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),m.height);await fs.writeFile(path.join(out,`server-render-${m.height}.png`),png);checks.push({format,width:1080,height:m.height,status:'passed'});}
 await fs.writeFile(path.join(out,'raster-browser.json'),JSON.stringify({checks,actualChromium:true,generatedFiles:'Test evidence only; runtime renderer streams without file persistence'},null,2));console.log(JSON.stringify(checks));
}finally{await browser.close();}
