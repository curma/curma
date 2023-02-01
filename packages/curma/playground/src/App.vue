<template>
  <div>
    <h1>Hello Curma!</h1>
    <div class="card">
      <button id="counter" type="button" @click="increment">count is {{count}}</button>
    </div>
    <div class="select">
      <span>Curma&nbsp;|&nbsp;</span>
      <a href="https://github.com/curma/curma/" target="_blank">Github</a>
    </div>
  </div>
</template>

<script>
import { rand } from "fastjs-next"

export default {
  name: "App",
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count = rand(0, 100)
    }
  }
}
</script>

<style>
</style>