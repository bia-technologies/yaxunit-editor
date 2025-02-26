import fs from 'fs'

function copyFile(source, destination){
    console.log(`copy ${source} to ${destination}`);
    fs.copyFile(source, destination, (err) => {
        if (err) throw err;
      });
}

function replaceInFile(source, pattern, replace){
    console.log(`replace in ${source}, ${pattern} to ${replace}`);
    return fs.readFile(source, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(pattern, replace);

        fs.writeFile(source, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    })
}

function generateTokenTypes(source, destination){
    var nodeTypes = JSON.parse(fs.readFileSync(source, 'utf8'));
    
    const enumValues = nodeTypes
        .filter(t=>t.named)
        .map(t=> `${t.type.toLowerCase()} = '${t.type}'`)
        .join(',\n    ')
    const data = `export enum BslTokenTypes {\n    ${enumValues},\n\n    ERROR = 'ERROR'\n}`
    fs.writeFile(destination, data, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

copyFile('node_modules/web-tree-sitter/tree-sitter.wasm', './assets/tree-sitter.wasm')
copyFile('node_modules/tree-sitter-bsl/tree-sitter-bsl.wasm', './assets/tree-sitter-bsl.wasm')
replaceInFile('node_modules/web-tree-sitter/tree-sitter.js', /0n/, '0')
generateTokenTypes('node_modules/tree-sitter-bsl/src/node-types.json', 'src/bsl-tree-sitter/bslTokenTypes.ts')
