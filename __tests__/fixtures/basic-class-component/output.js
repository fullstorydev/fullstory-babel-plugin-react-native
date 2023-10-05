import { applyFSPropertiesWithRef } from "@fullstory/react-native";
import { View } from "react-native";
export default class Component {
  render() {
    return <View ref={applyFSPropertiesWithRef()} />;
  }
}