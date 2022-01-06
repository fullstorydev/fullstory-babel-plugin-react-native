# FullStory React Native Babel Plugin

[![CircleCI](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native.svg?style=svg)](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native)

FullStory's React Native babel plugin performs transformations to enable FullStory privacy state declarations on all React Native controls, in addition to adding support for capturing click events.

This plugin does not replace `@fullstory/babel-plugin-annotate-react`, which annotates React components with stable attributes to help with element identity. 

This plugin should only be used in conjunction with `@fullstory/react-native`.

This plug-in is intended to be used in conjunction with [FullStory for Mobile Apps](https://www.fullstory.com/mobile-apps/). For more information, please see [this](https://help.fullstory.com/hc/en-us/articles/360052419133) getting started guide. Email mobile-support@fullstory.com for additional help.

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

The FullStory React Native babel plugin is required to be enabled in order for FullStory to fully work with React Native.

### `babel.config.js` Example

```JavaScript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['@fullstory/react-native'],
};
```
