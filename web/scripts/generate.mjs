import {parse,compileReact} from '@codedia/parser';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
await mkdir('src/generated',{recursive:true});
await writeFile('src/generated/Editor.tsx',compileReact(parse(await readFile('src/Editor.aui','utf8'))));
