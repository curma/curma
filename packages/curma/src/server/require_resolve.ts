import {resolve} from 'node:path';
import fs from 'node:fs';

import {warn} from "../console/error.js";
import outputDev from "../console/outputDev.js";

type fileIndex = string;

export default function require_resolve(url: string): fileIndex {
    // url = /curma-require?path={from}&name={import_path}

    const requireName = url.split("&name=")[1];
    const requirePath = url.split("?path=")[1].split("&name=")[0];

    let focus = process.cwd();
    let path = requirePath.split("/");
    for (let item of path) {
        focus = resolve(focus, item);
    }
    focus = focus.replace(/([\\/])[^\\/]+\..+$/g, "");
    focus = resolve(focus, requireName);
    outputDev(`require_resolve: ${url} -> ${focus}`);
    if (!fs.existsSync(focus)) {
        warn(`Cannot find cjs module '${requireName}' from '${requirePath}' [curma-fileNotFound]`);
        return "";
    } else {
        return fs.readFileSync(focus, "utf-8");
    }
}