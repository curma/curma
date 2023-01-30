// const pc = require("picocolors")
import pc from "picocolors";

export function error(...msgList: string[]) {
  let output = "\n";
  msgList.forEach((msg) => {
    const line = pc.bgRed(pc.white(" !ERR ")) + " " + pc.red(msg);
    output += "\n" + line;
  })
  console.log(output)
  process.exit(1)
}

export function warn(...args: any[]) {
  console.log(pc.bgYellow(pc.black(" !WARN ")), ...args)
}