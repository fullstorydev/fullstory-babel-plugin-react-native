import { applyFSPropertiesWithRef } from "@fullstory/react-native";
import { View } from "react-native";
import { useRef } from "react";
function Component() {
  const ref = useRef(null);
  return <View ref={applyFSPropertiesWithRef(ref)} />;
}
