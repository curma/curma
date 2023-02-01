type fileIndex = string;

export default function require(fileIndex: string, url: string): fileIndex {
    // Find require
    const requireRegex: RegExp = /require\((['"`])(.*?)\1\)/g;
    const requires = fileIndex.match(requireRegex) || [];
    for (let require of requires) {
        const requirePath: string = require.replace(/require\((['"`])(.*?)\1\)/g, "$2");
        console.log("require", require)
        fileIndex = fileIndex
            .replace(
                require, `window.require("${url}", "${requirePath}")`
            )
    }

    // if using module.exports for export
    if (fileIndex.includes("module.exports")) {
        // use curma_module_exports
        // if there is a 'use strict' at the top of the file
        if (fileIndex.startsWith("'use strict'")) {
            fileIndex = fileIndex.replace("'use strict'", "");
        }
        fileIndex = "let curma_module_exports; " + fileIndex;
        // give val -> curma_module_exports
        fileIndex = fileIndex.replace("module.exports", "curma_module_exports");
        fileIndex += "; export default curma_module_exports;";
        // if it is import by other esm
        // req.url -> /...&import=item1,item2
        if (url.includes("&import=")) {
            const imports: string[] = url.split("&import=")[1].split(",");
            for (let item of imports) {
                fileIndex += `export const ${item} = curma_module_exports.${item};`;
            }
        }
    }

    return fileIndex;
}