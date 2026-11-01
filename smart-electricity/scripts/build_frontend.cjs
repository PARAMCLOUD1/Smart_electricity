const fs=require('node:fs'),path=require('node:path');
function build(destination=path.resolve(__dirname,'..','dist')){const root=path.resolve(__dirname,'..');fs.mkdirSync(destination,{recursive:true});fs.copyFileSync(path.join(root,'index.html'),path.join(destination,'index.html'));fs.cpSync(path.join(root,'static'),path.join(destination,'static'),{recursive:true});console.log('Built static site:',destination);return destination;}
module.exports={build};if(require.main===module)build();
