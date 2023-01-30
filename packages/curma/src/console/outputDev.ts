import log from "../console/output.js"
import pc from "picocolors"

// if --dev
const _dev = process.argv.includes("--dev")

export default function outputDev(...args: any[]) {
  if (!_dev) return
  if (!args.length) log("")
  log(pc.bgGreen(pc.black(" DEV ")), ...args)
}
