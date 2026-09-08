# Fullstory React Native Babel Plugin

[![CircleCI](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native.svg?style=svg)](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native)

Fullstory's React Native babel plugin performs transformations to enable Fullstory privacy state declarations on all React Native controls, in addition to adding support for capturing click events.

This plugin does not replace `@fullstory/babel-plugin-annotate-react`, which annotates React components with stable attributes to help with element identity.

This plugin should only be used in conjunction with `@fullstory/react-native`.

This plug-in is intended to be used in conjunction with [Fullstory for Mobile Apps](https://www.fullstory.com/mobile-apps/). For more information, please see [this](https://help.fullstory.com/hc/en-us/articles/360052419133) getting started guide. Email mobile-support@fullstory.com for additional help.

## Install the React Native babel plugin

### Note: this babel plugin is automatically installed as a dependency to `@fullstory/react-native`

#### with npm

```
npm i @fullstory/babel-plugin-react-native --save
```

#### with yarn

```
yarn add @fullstory/babel-plugin-react-native
```

## Enabling the React Native plugin

The Fullstory React Native babel plugin is required to be enabled in order for Fullstory to fully work with React Native.

### `babel.config.js` Example

```JavaScript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['@fullstory/react-native'],
};
```

### Options

#### `disableFabricCommitHook`

On iOS New Architecture (Fabric), this plugin instruments React's commit phase to forward FullStory privacy attributes (`fsClass`, `fsAttribute`, etc.) to native. If you need to fully remove this instrumentation -- for example, while investigating a suspected issue -- set `disableFabricCommitHook: true`. This option makes the plugin skip injecting the hook entirely.

> [!Warning]
> Disabling this hook stops FullStory privacy attributes from being applied on iOS New Architecture, which can cause PII to appear unmasked in session recordings. Only use this as a temporary mitigation, and contact Fullstory support if you hit an issue that requires it.

```JavaScript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [['@fullstory/react-native', { disableFabricCommitHook: true }]],
};
```
