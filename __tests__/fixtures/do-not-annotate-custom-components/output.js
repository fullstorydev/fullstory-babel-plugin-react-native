import { applyFSPropertiesWithRef } from '@fullstory/react-native';
import { View } from 'react-native';
const Wrapper = () => {
  return <></>;
};
export const Component = () => {
  return (
    <View ref={applyFSPropertiesWithRef()}>
      <Wrapper />
    </View>
  );
};
