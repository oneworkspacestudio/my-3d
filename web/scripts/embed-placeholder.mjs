import {writeFile} from 'node:fs/promises';
await writeFile(new URL('../../internal/webui/dist/.gitkeep',import.meta.url),'');
