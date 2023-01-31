import {createServer} from 'node:http';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {createRequire} from "node:module";
import {WebSocketServer} from 'ws';
import type {WebSocket} from 'ws';
import chokidar from 'chokidar';

import output from '../console/output.js';
import outputDev from '../console/outputDev.js'
import clear from '../console/clean.js';
import loader from '../console/loader.js';
import {error, warn} from '../console/error.js';
import pc from "picocolors";

const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const __dirname = path.resolve();
const portfinder = require('portfinder')
const pkg: { [key: string]: any } = require('../../package.json');
const usr_pkg: { [key: string]: any } = require(path.join(process.cwd(), 'package.json'));

export default async function () {
    // start time
    const startTime = Date.now();
    output("")
    const _loader = new loader("Starting server", "Loading config", 6);
    const _config = eval(`Object(${fs.readFileSync(path.join(process.cwd(), 'curma.config.js'), 'utf-8').match(/export default (.*)/s)[0].match(/\{(.*)}/s)[0]})`);
    outputDev("config:", _config);
    // check root
    if (!_config.root) _config.root = "/";
    if (!/^\/[a-zA-Z0-9_\-]*$/.test(_config.root)) {
        error("root is invalid [root must start with / and only contain letters, numbers, _ and -]");
    }
    // find port 3000~4000
    _loader.update("Finding available port", 1);
    const port = await portfinder.getPortPromise({
        port: 3000, // minimum port
        stopPort: 4000 // maximum port
    })
    // create server
    _loader.update("Create Server", 2);
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        outputDev("Request received - " + req.url);
        // read file
        const _autoIndex = [
            "index.html", "index.vue", "index.js", "index.ts", "style.css", "style.scss", "style.sass", "style.less", "style.styl", "style.stylus", ".js", ".html", ".ts", ".css", ".scss", ".sass", ".less", ".styl", ".stylus"
        ]
        // is exists
        const _isExists = (file: string): string | false => {
            if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
                // try auto index
                for (let index of _autoIndex) {
                    if (fs.existsSync(file + index)) {
                        return file + index;
                    }
                }
                return false
            }
            return file
        }
        const fileUrl = _isExists(path.join(process.cwd(), req.url || ""))
        let fileIndex = "";
        if (fileUrl) fileIndex = fs.readFileSync(fileUrl).toString();
        const _contentTypeMap = {
            "js": "application/javascript",
            "html": "text/html",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "svg": "image/svg+xml",
            "css": "text/css",
            "mp4": "video/mp4",
            "mp3": "audio/mpeg",
            "json": "application/json",
            "txt": "text/plain",
            "xml": "text/xml"
        }
        const setContentType = (file: string): string => {
            const fileExt = file.split(".").pop() || "txt";
            if (fileExt in _contentTypeMap) {
                // @ts-ignore
                res.setHeader("Content-Type", _contentTypeMap[fileExt]);
            }
            return fileExt;
        }
        const _fileExt = setContentType(fileUrl || "")
        if (_fileExt === "html") {
            const _curmaScriptIndex = String(fs.readFileSync(path.join(__dirname, "../src/server/scripts/dev.js")))
                .replace("?port?", port)
            fileIndex = `<script>${_curmaScriptIndex}</script>${fileIndex}`
        }
        if (_fileExt === "css") {
            // if Sec-Fetch-Dest is script
            if (req.headers["sec-fetch-dest"] === "script") {
                res.setHeader("Content-Type", "application/javascript");
                fileIndex = "document.head.innerHTML += `<style from-file=\"".concat(req.url || "", "\">").concat(fileIndex, "</style>`");
            }
        }
        if (_fileExt === "js" || _fileExt === "vue" || _fileExt === "ts") {
            const _cdnDependencies = fileIndex.match(/import .*? from (['"])(?:@([^/]+?)\/)?([^/]+?)(['"])/g) || [];
            for (const _cdnDependency of _cdnDependencies) {
                // @ts-ignore
                const dependName = _cdnDependency.match(/(["'])(?:@([^/]+?)\/)?([^/]+?["'])/g)[0].replace(/["']/g, "");
                // if config.cdnDependencies.dev
                if (_config.cdnDependencies.dev) {
                    // check is dependency in package.json
                    let version = "";
                    if (dependName in usr_pkg.dependencies) {
                        // version
                        version = `@${usr_pkg.dependencies[dependName]}`
                    } else _config.error.cdnDependenciesNoVersion && warn(`Dependency ${dependName} not found in package.json, using latest version. [curma:cdnDependenciesNoVersion]`);
                    fileIndex = fileIndex.toString().replace(_cdnDependency
                        , _cdnDependency.replace(dependName, `https://cdn.jsdelivr.net/npm/${dependName}${version}/+esm`));
                } else {
                    let replace = `${_config.root}curma-package?name=${dependName}`;
                    // if import {xxx}
                    if (_cdnDependency.includes("{")) {
                        replace = `${_config.root}curma-package?name=${dependName}&import=${(_cdnDependency.match(/{(.*)}/) || [])[1].toString().replace(/ /g, "")}`
                    }
                    fileIndex = fileIndex.toString().replace(_cdnDependency
                        , _cdnDependency.replace(dependName, replace));
                }
            }
            // check require
            if (/require\((['"])(.*)\1\)/.test(fileIndex)) {
                // fileIndex = "import {createRequire} from \"node:module\";const require = createRequire(import.meta.url);\n".concat(fileIndex);
            }
        }
        if (_fileExt === "vue") {
            const templateMatch = fileIndex.match(/<template>([\s\S]*)<\/template>/g);
            const scriptMatch = fileIndex.match(/<script>([\s\S]*)<\/script>/g);
            const style = fileIndex.match(/<style>([\s\S]*)<\/style>/g);
            if ((templateMatch?.length || 0) > 1) warn("Multiple <template> tags found in vue file, only the first one will be used.");
            if (!templateMatch) warn("No <template> tag found in vue file.");
            if ((scriptMatch?.length || 0) > 1) warn("Multiple <script> tags found in vue file, only the first one will be used.");
            if (!scriptMatch) warn("No <script> tag found in vue file.");
            let template = templateMatch?.[0].replace(/<template>([\s\S]*)<\/template>/g, "$1") || "";
            let script = scriptMatch?.[0].replace(/<script>([\s\S]*)<\/script>/g, "$1") || "";
            res.setHeader("Content-Type", "application/javascript");
            // export default {...} -> {...}
            script = script.replace(/export default /g, "").match(/{([\s\S]*)}/g)?.[0] || "";
            // template去除右侧空格
            template = template.replace(/>\s+</g, "><");
            fileIndex = `export default {template: \`${template}\`, style: \`${style?.[0] || ""}\`, ${script.substring(1)}`;
        }
        if (req.url?.includes(`${_config.root}curma-package`)) {
            let packageName = req.url?.split("curma-package?name=")[1];
            packageName = packageName?.split("&")[0];
            if (packageName) {
                outputDev("Request package - " + packageName);
                const packageInfo = require(path.join(process.cwd(), 'node_modules', packageName, 'package.json'));
                // return package.main
                const mainFile = _isExists(path.join(process.cwd(), 'node_modules', packageName, packageInfo.main));
                if (!mainFile) {
                    warn(`package ${packageName} has no main file`);
                } else {
                    if (!fs.existsSync(mainFile)) warn(`package ${packageName} main file not found: ${packageInfo.main}`);
                    else {
                        fileIndex = fs.readFileSync(mainFile).toString();
                        res.setHeader("Content-Type", "application/javascript");
                    }
                }
            }
        }
        // get file
        if (!fileUrl && !fileIndex) {
            res.writeHead(404);
            res.end("404 Not Found");
            return;
        }
        // all file check
        fileIndex = fileIndex
            .replace(/process\.env\.NODE_ENV/g, `"development"`)
            .replace(/require\(/g, `await window.require('${req.url}&&'+`)
        if (fileIndex.includes("module.exports")) {
            fileIndex = fileIndex.replace(/module\.exports/g, `curma_module_exports`)
            fileIndex += `;export default curma_module_exports;`
            // check &import=xxx
            if (req.url?.includes("&import=")) {
                const importList = req.url?.split("&import=")[1].split(",");
                for (let importItem of importList) {
                    fileIndex += `export let ${importItem} = curma_module_exports.${importItem};`
                }
            }
        }
        res.writeHead(200);
        res.end(fileIndex);
    })
    _loader.update("Create WebSocket service", 3);
    const ws = new WebSocketServer({
        server,
        path: "/curma-ws-client"
    });
    const _wsClients: Array<WebSocket> = [];
    ws.on('connection', function connection(ws) {
        _wsClients.push(ws);
        ws.on('message', function incoming(message) {
            let msg: {[key: string]: any} = JSON.parse(message.toString());
            if (msg.type === "require") {
                const pathList = msg.name.split("&&").map((item: string) => {
                    // if curma-package
                    if (item.includes("curma-package")) {
                        const packageName = item.split("curma-package?name=")[1].split("&")[0];
                        return path.join(
                            "node_modules",
                            packageName,
                            require(path.join(process.cwd(), 'node_modules', packageName, 'package.json')).main.replace(/[a-zA-Z0-9_\-]+\.[a-z]+$/, "")
                        );
                    }
                    return item;
                });
                output("Require: " + pathList.join(", "));
                const _require = fs.readFileSync(path.join(process.cwd(), ...pathList)).toString();
                ws.send(JSON.stringify({
                    type: "require",
                    data: _require,
                    id: msg.id
                }));
            }
        })
    })
    const reload = () => {
        for (let client of _wsClients) {
            client.send("reload");
        }
    }
    // start server
    _loader.update("Start server", 4);
    server.listen(port);
    // listen file
    _loader.update("Start file watcher", 5);
    chokidar.watch(process.cwd(), {
        ignored: /(\.git|node_modules)/,
        ignoreInitial: true,
    }).on('all', (event, path) => {
        outputDev(`${event} - ${path}`);
        reload();
    });

    _loader.end()
    const endTime = Date.now(), _time = endTime - startTime;

    clear()
    output(`${pc.green(pc.bold("[Curma]"))}

${pc.green(pc.bold("Curma"))} ${pc.green(`v${pkg.version}`)} is ready in ${pc.green(`${_time}ms`)}.

> ${pc.bold("Local:")} ${pc.cyan(`http://localhost:${port}`)}
> ${pc.bold("Close:")} ${pc.cyan("Ctrl + C")}
`);
}