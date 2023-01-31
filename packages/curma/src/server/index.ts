import {createServer} from 'node:http';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {createRequire} from "node:module";
import {WebSocketServer} from 'ws';
import type {WebSocket} from 'ws';
import chokidar from 'chokidar';
import type {curmaConfig} from '../curma';

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

import curma_require from "./require";

export default async function () {
    // start time
    const startTime = Date.now();
    output("")
    const _loader = new loader("Starting server", "Loading config", 6);
    let _config: curmaConfig = {}
    if (fs.existsSync(path.join(process.cwd(), 'curma.config.js')))
        _config = eval(`Object(${fs.readFileSync(path.join(process.cwd(), 'curma.config.js'), 'utf-8').match(/export default (.*)/s)[0].match(/\{(.*)}/s)[0]})`);
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
                    if (index[0] === ".") {
                        if (fs.existsSync(file + index)) {
                            return file + index;
                        }
                    } else {
                        if (fs.existsSync(path.join(file, index))) {
                            return path.join(file, index);
                        }
                    }
                }
                return false
            }
            return file
        }
        const fileUrl = _isExists(path.join(process.cwd(), req.url || "")) || _isExists(path.join(process.cwd(), "public", req.url || ""));
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
        if (req.url?.includes(`/curma-package`)) {
            let packageName = req.url?.split("curma-package?name=")[1];
            packageName = packageName?.split("&")[0];
            if (packageName.includes("/")) {
                const _path = path.join(process.cwd(), "node_modules", packageName);
                if (fs.existsSync(_path)) {
                    fileIndex = fs.readFileSync(_path).toString();
                } else warn(`File not found: ${_path}`);
            } else if (packageName) {
                outputDev("Request package - " + packageName);
                const packageInfo = require(path.join(process.cwd(), 'node_modules', packageName, 'package.json'));
                if (packageName === "vue") {
                    packageInfo.module = "dist/vue.esm-bundler.js";
                }
                output(path.join(process.cwd(), 'node_modules', packageName, packageInfo.module || packageInfo.main));
                // return package.main
                const mainFile = _isExists(path.join(process.cwd(), 'node_modules', packageName, packageInfo.module || packageInfo.main));
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
        if (_fileExt === "html") {
            const _curmaScriptIndex = String(fs.readFileSync(path.join(__dirname, "node_modules/curma/dist/server/scripts/dev.js")))
                .replace("?port?", port)
            fileIndex = fileIndex.replace("</head>", `<script>${_curmaScriptIndex}</script></head>`)
        }
        if (_fileExt === "css") {
            // if Sec-Fetch-Dest is script
            if (req.headers["sec-fetch-dest"] === "script") {
                res.setHeader("Content-Type", "application/javascript");
                fileIndex = "document.head.innerHTML += `<style from-file=\"".concat(req.url || "", "\">").concat(fileIndex, "</style>`");
            }
        }
        if (_fileExt === "js" || _fileExt === "vue" || _fileExt === "ts") {
        }
        // @/ -> /src
        const _alias = fileIndex.match(/import\s+.*\s+from\s+['"]@\/(.*)['"]/g);
        if (_alias) {
            for (let i of _alias) {
                // @ts-ignore
                const _aliasPath = i.match(/import\s+.*\s+from\s+['"]@\/(.*)['"]/)[1];
                fileIndex = fileIndex.replace(i, i.replace("@\/", `${_config.root}src/`));
            }
        }
        const _cdnDependencies = fileIndex.match(/(from|import) ['"][a-z@].+?['"]/g) || [];
        for (const _cdnDependency of _cdnDependencies) {
            // @ts-ignore
            const dependName = _cdnDependency.match(/["'][a-z@].+?["']/g)[0].replace(/["']/g, "");
            // if config.cdnDependencies.dev
            if (_config.cdnDependencies?.dev) {
                // check is dependency in package.json
                let version = "";
                if (dependName in (usr_pkg.dependencies || {})) {
                    // version
                    version = `@${usr_pkg.dependencies[dependName]}`
                } else _config.error?.cdnDependenciesNoVersion && warn(`Dependency ${dependName} not found in package.json, using latest version. [curma:cdnDependenciesNoVersion]`);
                if (_config.cdnDependencies?.custom && dependName in _config.cdnDependencies.custom)
                    fileIndex = fileIndex.replace(_cdnDependency
                        , _cdnDependency.replace(dependName, _config.cdnDependencies.custom[dependName]
                            .replace(/{version}/g, version)));
                else
                    fileIndex = fileIndex.replace(_cdnDependency
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
            // abc;export default {...} -> abc;
            let scriptTop = script.replace(/export default\s+{[\s\S]*}/g, "");
            // export default {...} -> {...}
            // script = script.replace(/export default +/g, "").match(/{([\s\S]*)}/g)?.[0] || "";
            script = script.match(/export default +{([\s\S]*)}/g)?.[0].replace(/export default +/g, "") || "";
            // template去除右侧空格
            template = template.replace(/>\s+</g, "><");
            fileIndex = `${scriptTop}
            
            export default {template: \`${template}\`, style: \`${style?.[0] || ""}\`, ${script.substring(1)}`;
        }
        if (req.url?.includes(`/curma-require`)) {
            let requireName = req.url?.split("name=").slice(1).join("name=")

            const pathList = requireName.split("&&").map((item: string, key: number) => {
                outputDev(`requireName: ${item}`);
                // if curma-package
                if (item.includes("curma-package")) {
                    output(`curma-package: ${item} =============`);
                    const packageName = item.split("curma-package?name=")[1].split("&")[0];
                    return path.join(
                        "node_modules",
                        packageName,
                        require(path.join(process.cwd(), 'node_modules', packageName, 'package.json')).main.replace(/[a-zA-Z0-9_\-]+\.[a-z]+$/, "")
                    );
                }
                if (item[0] === "/") item = item.substring(1);
                // item = a/b/c  ->  if c have no . -> a/b
                // item = "a/b/c"  ->  if c have no . -> item = "a/b"
                if (!item.includes(".")) {
                    console.log(item);
                    // get c
                    const c = item.split("/").pop();
                    // if c is not a dict
                    if (!fs.existsSync(path.join(process.cwd(), item, c))) {
                        return item.split("/").slice(0, -1).join("/");
                    }
                } else {
                    // is last item?
                    if (!(key === requireName.split("&&").length - 1)) {
                        return item.split("/").slice(0, -1).join("/");
                    }
                }
                return item;
            });
            const _path = path.resolve(process.cwd(), ...pathList)
            let _require = "export default {}";
            output(`require: ${_path}`);
            if (fs.existsSync(_path)) {
                _require = fs.readFileSync(_path).toString();
            } else {
                warn("Require file not found: " + _path, "[curma:requireFileNotFound]");
            }
            fileIndex = _require;
        }
        // get file
        if (!fileUrl && !fileIndex) {
            res.writeHead(404);
            res.end("404 Not Found");
            return;
        }
        fileIndex = curma_require(fileIndex, req.url || "");
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