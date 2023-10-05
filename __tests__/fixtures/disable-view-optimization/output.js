import { applyFSPropertiesWithRef } from "@fullstory/react-native";
import { View } from "react-native";
function Component() {
  return (
    <View
      fsClass="fs-unmask"
      nativeID="__FS_NATIVEID"
      ref={applyFSPropertiesWithRef()}
    >
      <View ref={applyFSPropertiesWithRef()} />
    </View>
  );
}
  