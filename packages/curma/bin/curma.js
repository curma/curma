#! /usr/bin/env node

import cli from "cac"
import dev from "../dist/dev/index.js";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const curma = cli("curma");

curma
  .version(pkg.version)
  .option("-h, --help", "output help information")
  .command("[root]", "Output help information")
  .action(() => {
    curma.outputHelp();
  })

curma
  .command("dev", "start a dev server")
  // .description("start a dev server")
  .option("-p, --port <port>", "set dev server port")
  .action((cmd) => {
    // require start fn and run
    dev(cmd);
  });

curma.parse();