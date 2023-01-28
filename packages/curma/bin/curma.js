import curma from "commander";

curma
  .name("curma")
  .description("Curma is a esm dev build tool.")
  .version(`curma ${require("../package.json").version}`)
  .usage("<command> [options]");

curma
  .command("dev")
  .description("start a dev server")
  .option("-p, --port <port>", "set dev server port")
  .action((cmd) => {
    // require start fn and run
    require("../dist/dev.js")(cmd);
  });