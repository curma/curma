// const pc = require("picocolors")
// const {pathExistsSync} = require("fs-extra");
// const {join} = require("path");
// const _dev = pathExistsSync(join(process.cwd(), "ondev.key"));

import pc from "picocolors";
const _dev = process.argv.includes("--dev")

class loader {
  _msg: string;
  _info;
  _progress;
  _fullProgress;

  constructor(msg: string, info: string, fullProgress = 0) {
    this._msg = msg;
    this._info = info;
    this._progress = 0;
    this._fullProgress = fullProgress;
    this._effect();
  }

  _effect() {
    // check dev
    if (_dev) return;

    process.stdout.write("\r")
    process.stdout.write(" ".repeat(100))
    process.stdout.write("\r" +
      pc.bgBlue(pc.white(" LOAD ")) +
      ` ${this._msg}${this._info && `: ${this._info}`} ${this._progress}/${this._fullProgress}`
    );
  }

  end() {
    // check dev
    if (_dev) return;

    this._progress = this._fullProgress;
    process.stdout.write("\r" +
      pc.bgGreen(pc.black(" DONE ")) +
      ` ${this._msg}${this._info && `: ${this._info}`} ${this._progress}/${this._fullProgress} ✔️` +
      "\n"
    );
  }

  update(info: string, progress: number | string, fullProgress?: number | string) {
    if (info) this._info = info;
    if (progress) {
      // check if is Number
      if (typeof progress !== "number")
        this._progress += parseInt(progress.replace("+", ""));
      else
        this._progress = progress
    }
    if (fullProgress) {
      if (typeof fullProgress !== "number")
        this._fullProgress += parseInt(fullProgress.replace("+", ""));
      else
        this._fullProgress = fullProgress
    }
    this._effect();
  }
}

export default loader;