import React from 'react';
import { View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import type { FieldHookConfig } from 'formik';
import { useField, ErrorMessage } from 'formik';

import { tryParse } from 'utils/utils';

type TextInputFieldProps = {
  helperText?: string | null | undefined;
} & React.ComponentProps<typeof TextInput> &
  FieldHookConfig<string>;

/**
 * Component to show a Text Input with Formik support
 */
const TextInputField = ({
  name,
  label,
  mode,
  style = {},
  helperText,
  ...others
}: TextInputFieldProps) => {
  const [field, meta, helpers] = useField(name);

  // Get value as string, converting boolean to 0 or 1
  const value = String(
    typeof meta.value === 'boolean' ? +meta.value : meta.value,
  );

  // Handle change text
  const handleChangeText = (value: string) => {
    let newValue: string | number | null = value;
    // For 'null' string, set value to null
    if (value.toLocaleLowerCase() === 'null') newValue = null;
    // For numeric inputs, try to parse the value
    else if (others.inputMode === 'numeric' || others.inputMode === 'decimal')
      newValue = tryParse(value);
    helpers.setValue(newValue);
  };

  return (
    <View style={style}>
      <TextInput
        mode={mode ?? 'outlined'}
        label={label}
        value={value}
        onChangeText={handleChangeText}
        onBlur={() => helpers.setTouched(true)}
        error={!!meta.error && meta.touched}
        {...others}
      />
      {helperText ? <HelperText type="info">{helperText}</HelperText> : null}
      <ErrorMessage
        name={field.name}
        render={msg => <HelperText type="error">{msg}</HelperText>}
      />
    </View>
  );
};

export default TextInputField;
