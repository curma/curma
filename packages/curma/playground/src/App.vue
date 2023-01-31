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
export default {
  name: "App",
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<style>
</style>