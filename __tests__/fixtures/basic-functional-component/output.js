import { applyFSPropertiesWithRef } from '@fullstory/react-native';
import { View } from 'react-native';
function Component() {
  return <View ref={applyFSPropertiesWithRef()} />;
}
