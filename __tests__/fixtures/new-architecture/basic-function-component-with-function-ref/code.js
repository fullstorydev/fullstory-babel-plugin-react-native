import { View } from 'react-native';
function Component() {
  return (
    <View
      ref={ref => {
        console.log(ref);
      }}
    />
  );
}
