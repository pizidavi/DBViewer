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

const TextInputField = ({
  name,
  label,
  mode,
  style = {},
  helperText,
  ...others
}: TextInputFieldProps) => {
  const [field, meta, helpers] = useField(name);

  const handleChangeText = (value: string) => {
    let newValue: string | number | null = value;
    if (value.toLocaleLowerCase() === 'null') newValue = null;
    else if (others.inputMode === 'numeric') newValue = tryParse(value);
    else if (others.inputMode === 'decimal')
      newValue = tryParse(value, parseFloat);
    helpers.setValue(newValue);
  };

  return (
    <View style={style}>
      <TextInput
        mode={mode ?? 'outlined'}
        label={label}
        value={String(meta.value)}
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
