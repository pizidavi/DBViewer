import React from 'react';
import { View } from 'react-native';
import { HelperText } from 'react-native-paper';
import type { FieldHookConfig } from 'formik';
import { useField, ErrorMessage } from 'formik';

import TextSecureInput from './TextSecureInput';

/**
 * Component to show a Secure Text Input with Formik support
 */
const TextSecureInputField = ({
  name,
  label,
  mode,
  style = {},
  ...others
}: React.ComponentProps<typeof TextSecureInput> & FieldHookConfig<string>) => {
  const [field, meta, helpers] = useField(name);
  return (
    <View style={style}>
      <TextSecureInput
        mode={mode ?? 'outlined'}
        label={label}
        value={meta.value}
        onChangeText={v => helpers.setValue(v)}
        onBlur={() => helpers.setTouched(true)}
        error={meta.error && meta.touched ? true : false}
        {...others}
      />
      <ErrorMessage
        name={field.name}
        render={msg => <HelperText type="error">{msg}</HelperText>}
      />
    </View>
  );
};

export default TextSecureInputField;
