<template>
  <div>
    {{ msg }}
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    console.log("App data");
    return {
      msg: "Hello, world!"
    }
  },
  mounted() {
    console.log("App mounted", this)
  }
}
</script>

<style>
</style>