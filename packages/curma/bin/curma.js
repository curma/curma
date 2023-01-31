#! /usr/bin/env node

import dev from "../dist/dev/index.js";

import {createRequire} from "node:module";
import {program as curma} from "commander";
import outputDev from "../dist/console/outputDev.js";
import pc from "picocolors";

await outputDev(`Dev mode ${pc.green(pc.bold("on"))}`);

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

curma
  .name("curma")
  .version(`curma ${pkg.version}`)
  .description(pkg.description)

curma
  .command("dev")
  .description("start a dev server")
  // .description("start a dev server")
  .option("-p, --port <port>", "set dev server port")
  .option("--dev", "enable dev mode")
  .action(async (name, cmd) => {
    // require start fn and run
    await dev();
  });

curma.parse(process.argv);