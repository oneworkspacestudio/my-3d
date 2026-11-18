import {parse,compileReact} from '@codedia/parser';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
await mkdir('src/generated',{recursive:true});
for (const name of ['Editor', 'Alignment', 'AlignmentHandles']) {
 await writeFile('src/generated/'+name+'.tsx',compileReact(parse(await readFile('src/'+name+'.aui','utf8'))));
}
