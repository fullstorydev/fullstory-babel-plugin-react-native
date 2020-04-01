# FullStory React Native Babel Plugin

[![CircleCI](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native.svg?style=svg)](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native)

Note: This is a Work in Progress and has yet to be published to NPM.
FullStory's React Native babel plugin performs compile-time transformations to add FullStory-specific attributes to all React Native controls. This plugin should only be used in conjunction with `@fullstory/react-native`.


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