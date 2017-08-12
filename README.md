# electron-vue-demo

> an open source demo to illustrate how to use electron-vue boilerplate to build a robust Mac/windows App

#### Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
npm run dev



# build electron application for production
npm run build

# run unit & end-to-end tests
npm test


# lint all JS/Vue component files in `src/`
npm run lint

```

---

`npm run dev` would start following sub process:

* it would start an express api server on `localhost:8081`, and the vue hot-reload-server for electron on `localhost:9080`.

`npm run dev:web` would start following sub process:

* it would start an express api server on `localhost:8081`, and the vue hot-reload-server for web on `localhost:8080`.

---

The build config in .electron-vue is incompatible with original [webpack boilerplate](http://vuejs-templates.github.io/webpack/). Since it was widely used among original vue project, I modified files in .electron-vue to make webpack config look familiar.

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[ef811ba](https://github.com/SimulatedGREG/electron-vue/tree/ef811ba974d696ee965da747315f20a034ebc590) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).

```
vue init simulatedgreg/electron-vue electron-vue-demo

// do not install vue plugins here
// Standard eslint config
```
