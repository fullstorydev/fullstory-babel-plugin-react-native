import { applyFSPropertiesWithRef } from "@fullstory/react-native";
import { createElement } from "react";
import { Text, View } from "react-native";
import { jsx as _jsx } from "react/jsx-runtime";
function NonJSXView({ children }) {
  return createElement(
    View,
    {
      fsTagName: "NonJSXView",
      ref: applyFSPropertiesWithRef(),
    },
    children
  );
}
export default function ReactCloneElement() {
  return (
    <NonJSXView>
      {createElement(
        Text,
        {
          fsTagName: "NonJSXText",
          ref: applyFSPropertiesWithRef(),
        },
        "hello"
      )}
    </NonJSXView>
  );
}