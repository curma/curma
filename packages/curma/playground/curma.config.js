import {defineConfig} from "curma";

export default defineConfig({
  cdnDependencies: {
    // Using cdn dependencies in development mode
    dev: !true,
    // Using cdn dependencies in production mode
    prod: false,
    custom: {
      // Using custom cdn dependencies url
      vue: "https://cdn.jsdelivr.net/npm/vue{version}/dist/vue.esm-browser.js",
    },
    // if a dependency is in custom but not in custom_prod, it will use custom url in production mode
    custom_prod: {}
  },
  error: {
    cdnDependenciesNoVersion: true,
    requireFileNotFound: true
  },
  root: "/",
  alias: {
    "vue": "vue/dist/vue.esm-browser.js"
  }
})