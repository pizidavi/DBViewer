import React from 'react';
import { TextInput } from 'react-native-paper';

const TextSecureInput = ({
  secureTextEntry = true,
  right,
  ...others
}: React.ComponentProps<typeof TextInput>) => {
  const [secure, setSecure] = React.useState(secureTextEntry);
  return (
    <TextInput
      secureTextEntry={secure}
      right={<TextInput.Icon icon="eye" onPress={() => setSecure(s => !s)} />}
      {...others}
    />
  );
};

export default TextSecureInput;
