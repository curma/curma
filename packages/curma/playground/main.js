import {selecter} from "fastjs-next";
import "./style.css";

const json = require("./test.json")
console.log(json)

selecter("#app").html(`
  <h1>Hello Curma!</h1>
  <div class="card">
      <button id="counter" type="button">count is 0</button>
  </div>
  <div class="select">
    <span>Curma&nbsp;|</span>
    <a href="https://github.com/curma/curma/" target="_blank">Github</a>
  </div>
`)

// mount click event
let time = 0;
let el = selecter("#counter");
el.on("click", () => {
  el.html(`count is ${++time}`);
})