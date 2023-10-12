import { pluginTester } from 'babel-plugin-tester';
const reactNativePlugin = require("../src/index");

pluginTester({
    plugin: reactNativePlugin.default,
    pluginOptions: {
      isNewArchitectureEnabled: true
    },
    fixtures: 'fixtures',
    babelOptions: {
      plugins: ["@babel/plugin-syntax-jsx"],
    }
  });