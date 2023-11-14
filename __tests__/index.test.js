import { pluginTester } from 'babel-plugin-tester';
const reactNativePlugin = require('../src/index');

pluginTester({
  plugin: reactNativePlugin.default,
  fixtures: 'fixtures',
  babelOptions: {
    plugins: ['@babel/plugin-syntax-jsx', '@babel/plugin-syntax-flow'],
  },
});
