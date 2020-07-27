/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import ReactNativeViewViewConfigAndroid from './ReactNativeViewViewConfigAndroid';

const ReactNativeViewConfig = {
  uiViewClassName: 'RCTView',
  baseModuleName: null,
  Manager: 'ViewManager',
  bubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture'
      }
    },
    topChange: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture'
      }
    },
    topEndEditing: {
      phasedRegistrationNames: {
        bubbled: 'onEndEditing',
        captured: 'onEndEditingCapture'
      }
    },
    topFocus: {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture'
      }
    },
    topKeyPress: {
      phasedRegistrationNames: {
        bubbled: 'onKeyPress',
        captured: 'onKeyPressCapture'
      }
    },
    topPress: {
      phasedRegistrationNames: {
        bubbled: 'onPress',
        captured: 'onPressCapture'
      }
    },
    topSubmitEditing: {
      phasedRegistrationNames: {
        bubbled: 'onSubmitEditing',
        captured: 'onSubmitEditingCapture'
      }
    },
    topTouchCancel: {
      phasedRegistrationNames: {
        bubbled: 'onTouchCancel',
        captured: 'onTouchCancelCapture'
      }
    },
    topTouchEnd: {
      phasedRegistrationNames: {
        bubbled: 'onTouchEnd',
        captured: 'onTouchEndCapture'
      }
    },
    topTouchMove: {
      phasedRegistrationNames: {
        bubbled: 'onTouchMove',
        captured: 'onTouchMoveCapture'
      }
    },
    topTouchStart: {
      phasedRegistrationNames: {
        bubbled: 'onTouchStart',
        captured: 'onTouchStartCapture'
      }
    }
  },
  directEventTypes: {
    topAccessibilityAction: {
      registrationName: 'onAccessibilityAction'
    },
    topAccessibilityEscape: {
      registrationName: 'onAccessibilityEscape'
    },
    topAccessibilityTap: {
      registrationName: 'onAccessibilityTap'
    },
    topLayout: {
      registrationName: 'onLayout'
    },
    topMagicTap: {
      registrationName: 'onMagicTap'
    },
    // Events for react-native-gesture-handler (T45765076)
    // Remove once this library can handle JS View Configs
    onGestureHandlerEvent: {
      registrationName: 'onGestureHandlerEvent'
    },
    onGestureHandlerStateChange: {
      registrationName: 'onGestureHandlerStateChange'
    }
  },
  validAttributes: {
    accessibilityActions: true,
    accessibilityElementsHidden: true,
    accessibilityHint: true,
    accessibilityIgnoresInvertColors: true,
    accessibilityLabel: true,
    accessibilityLiveRegion: true,
    accessibilityRole: true,
    accessibilityStates: true,
    accessibilityState: true,
    accessibilityViewIsModal: true,
    accessible: true,
    alignContent: true,
    alignItems: true,
    alignSelf: true,
    aspectRatio: true,
    backfaceVisibility: true,
    backgroundColor: { process: require('../../StyleSheet/processColor') },
    borderBottomColor: { process: require('../../StyleSheet/processColor') },
    borderBottomEndRadius: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    borderBottomStartRadius: true,
    borderBottomWidth: true,
    borderColor: { process: require('../../StyleSheet/processColor') },
    borderEndColor: { process: require('../../StyleSheet/processColor') },
    borderEndWidth: true,
    borderLeftColor: { process: require('../../StyleSheet/processColor') },
    borderLeftWidth: true,
    borderRadius: true,
    borderRightColor: { process: require('../../StyleSheet/processColor') },
    borderRightWidth: true,
    borderStartColor: { process: require('../../StyleSheet/processColor') },
    borderStartWidth: true,
    borderStyle: true,
    borderTopColor: { process: require('../../StyleSheet/processColor') },
    borderTopEndRadius: true,
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderTopStartRadius: true,
    borderTopWidth: true,
    borderWidth: true,
    bottom: true,
    clickable: true,
    collapsable: true,
    direction: true,
    display: true,
    elevation: true,
    end: true,
    flex: true,
    flexBasis: true,
    flexDirection: true,
    flexGrow: true,
    flexShrink: true,
    flexWrap: true,
    height: true,
    importantForAccessibility: true,
    justifyContent: true,
    left: true,
    margin: true,
    marginBottom: true,
    marginEnd: true,
    marginHorizontal: true,
    marginLeft: true,
    marginRight: true,
    marginStart: true,
    marginTop: true,
    marginVertical: true,
    maxHeight: true,
    maxWidth: true,
    minHeight: true,
    minWidth: true,
    nativeID: true,
    needsOffscreenAlphaCompositing: true,
    onAccessibilityAction: true,
    onAccessibilityEscape: true,
    onAccessibilityTap: true,
    onLayout: true,
    onMagicTap: true,
    opacity: true,
    overflow: true,
    padding: true,
    paddingBottom: true,
    paddingEnd: true,
    paddingHorizontal: true,
    paddingLeft: true,
    paddingRight: true,
    paddingStart: true,
    paddingTop: true,
    paddingVertical: true,
    pointerEvents: true,
    position: true,
    removeClippedSubviews: true,
    renderToHardwareTextureAndroid: true,
    right: true,
    rotation: true,
    scaleX: true,
    scaleY: true,
    shadowOpacity: true,
    shadowRadius: true,
    shouldRasterizeIOS: true,
    start: true,
    style: {
      alignContent: true,
      alignItems: true,
      alignSelf: true,
      aspectRatio: true,
      backfaceVisibility: true,
      borderBottomEndRadius: true,
      borderBottomLeftRadius: true,
      borderBottomRightRadius: true,
      borderBottomStartRadius: true,
      borderBottomWidth: true,
      borderEndWidth: true,
      borderLeftWidth: true,
      borderRadius: true,
      borderRightWidth: true,
      borderStartWidth: true,
      borderStyle: true,
      borderTopEndRadius: true,
      borderTopLeftRadius: true,
      borderTopRightRadius: true,
      borderTopStartRadius: true,
      borderTopWidth: true,
      borderWidth: true,
      bottom: true,
      decomposedMatrix: true,
      direction: true,
      display: true,
      elevation: true,
      end: true,
      flex: true,
      flexBasis: true,
      flexDirection: true,
      flexGrow: true,
      flexShrink: true,
      flexWrap: true,
      fontFamily: true,
      fontSize: true,
      fontStyle: true,
      fontVariant: true,
      fontWeight: true,
      height: true,
      includeFontPadding: true,
      justifyContent: true,
      left: true,
      letterSpacing: true,
      lineHeight: true,
      margin: true,
      marginBottom: true,
      marginEnd: true,
      marginHorizontal: true,
      marginLeft: true,
      marginRight: true,
      marginStart: true,
      marginTop: true,
      marginVertical: true,
      maxHeight: true,
      maxWidth: true,
      minHeight: true,
      minWidth: true,
      opacity: true,
      overflow: true,
      padding: true,
      paddingBottom: true,
      paddingEnd: true,
      paddingHorizontal: true,
      paddingLeft: true,
      paddingRight: true,
      paddingStart: true,
      paddingTop: true,
      paddingVertical: true,
      position: true,
      resizeMode: true,
      right: true,
      rotation: true,
      scaleX: true,
      scaleY: true,
      shadowOpacity: true,
      shadowRadius: true,
      start: true,
      textAlign: true,
      textAlignVertical: true,
      textDecorationLine: true,
      textDecorationStyle: true,
      textShadowOffset: true,
      textShadowRadius: true,
      textTransform: true,
      top: true,
      transformMatrix: true,
      translateX: true,
      translateY: true,
      width: true,
      writingDirection: true,
      zIndex: true
    },
    testID: true,
    top: true,
    translateX: true,
    translateY: true,
    width: true,
    zIndex: true,
    fsAttribute: true,
    fsClass: true,
    fsTagName: true,
    dataComponent: true,
    dataElement: true,
    dataSourceFile: true
  }
};

module.exports = ReactNativeViewConfig;
