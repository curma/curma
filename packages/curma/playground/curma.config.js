import {defineConfig} from "curma";

export default defineConfig({
  cdnDependencies: {
    // Using cdn dependencies in development mode
    dev: true,
    // Using cdn dependencies in production mode
    prod: false
  },

})