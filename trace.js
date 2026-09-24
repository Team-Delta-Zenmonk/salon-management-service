// trace.js
const { nodeFileTrace } = require('@vercel/nft');

nodeFileTrace(['index.js']).then(({ fileList, warnings }) => {
    console.log('--- WARNINGS (often shows unresolved requires) ---');
    for (const w of warnings) console.log(w.message);
});