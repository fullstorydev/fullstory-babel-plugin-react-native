# FullStory React Native Babel Plugin

[![CircleCI](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native.svg?style=svg)](https://circleci.com/gh/fullstorydev/fullstory-babel-plugin-react-native)

## Note: This plugin is currently in private beta. 

If you’re interested in gaining access to the private beta, please email mobile-support@fullstory.com and we’ll follow up with next steps. While we wish we could grant everyone access to the beta program, please bear in mind that we’re evaluating each request on a case-by-case basis and admission into the beta is not guaranteed.

FullStory's React Native babel plugin performs transformations to enable FullStory privacy state declarations on all React Native controls, in addition to adding support for capturing click events.

This plugin does not replace `@fullstory/babel-plugin-annotate-react`, which annotates React components with stable attributes to help with element identity. 

This plugin should only be used in conjunction with `@fullstory/react-native`.


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
