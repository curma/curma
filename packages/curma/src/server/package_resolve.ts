import {resolve} from "node:path";
import fs from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);

import {warn} from "../console/error.js";
import outputDev from "../console/outputDev.js";

type fileIndex = string;

const resolve_map: { [key: string]: string } = {
    "vue": "vue/dist/vue.esm-bundler.js",
};

export default function package_resolve(url: string): fileIndex {
    // url = /curma-package?name={package_name}

    let packageName = url.split("?name=")[1];

    if (resolve_map[packageName]) {
        packageName = resolve_map[packageName];
    }

    // is a package/path (can't just includes("/") because "@xxx/xxx" is a package)
    const isFile = packageName.includes("@") ? packageName.split("/").length > 2 : packageName.split("/").length > 1;

    // find from node_modules
    let focus = resolve(process.cwd(), "node_modules", packageName);
    outputDev(`package_resolve: ${url} -> ${focus}`);
    if (!fs.existsSync(focus)) {
        warn(`Cannot find package '${packageName}' [curma-packageNotFound]`);
    } else {
        if (!isFile) {
            if (!fs.existsSync(resolve(focus, "package.json"))) {
                warn(`Cannot find package.json in '${packageName}' [curma-packageNotFound]`);
            } else {
                // find package.json
                const packageJson = require(
                    resolve(focus, "package.json")
                )
                // find module | main
                focus = resolve(focus,
                    packageJson.module || packageJson.main
                );
                if (!focus) {
                    warn(`Cannot resolve main file of '${packageName}' [curma-packageNotFound]`);
                } else {
                    // read main file
                    return fs.readFileSync(focus, "utf-8");
                }
            }
        } else {
            console.log("start:", focus);
            // read file , or is a directory
            if (!fs.existsSync(focus) || fs.statSync(focus).isDirectory()) {
                // try to add .js
                if (!fs.existsSync(focus + ".js")) {
                    // try to add /index.js
                    focus = resolve(focus, "index.js");
                    if (!fs.existsSync(focus)) {
                        return warn(`Cannot find file '${packageName}' [curma-packageNotFound]`), "'curma-err'";
                    }
                } else {
                    focus += ".js";
                    console.log(focus);
                }
            }
            console.log("final:", focus);
            return fs.readFileSync(focus, "utf-8");
        }
    }
    return "'curma-err'"
}