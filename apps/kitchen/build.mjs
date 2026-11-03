import {readFile,writeFile} from 'node:fs/promises';
const ui={};
for(const f of ['index.html','app.js','style.css','guide.md'])ui['/'+f]=await readFile(new URL('./public/'+f,import.meta.url),'utf8');
let code=await readFile(new URL('./worker.mjs',import.meta.url),'utf8');
await writeFile(new URL('./worker-bundle.mjs',import.meta.url),code.replace('const ASSETS = {};','const ASSETS = '+JSON.stringify(ui)+';'));
console.log('Worker bundle built');
