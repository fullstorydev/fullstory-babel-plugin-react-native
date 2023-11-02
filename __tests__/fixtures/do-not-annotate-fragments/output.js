import { applyFSPropertiesWithRef } from '@fullstory/react-native';
import { View } from 'react-native';
export const Component = () => {
  return (
    <>
      <View ref={applyFSPropertiesWithRef()} />
    </>
  );
};
