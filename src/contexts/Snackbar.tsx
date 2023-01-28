import React from 'react';
import type { PropsWithChildren } from 'react';
import { Snackbar } from 'react-native-paper';

const AUTO_DISMISS = 4 * 1000;

interface SnackBarContextProps {
  show: (message: string, action?: SnackBarActionProps) => void;
}

interface SnackBarActionProps {
  label: string;
  onPress: () => void;
}

const SnackBarContext = React.createContext<SnackBarContextProps | null>(null);

/**
 * Provider for the Snackbar
 */
export const SnackBarProvider = ({ children }: PropsWithChildren) => {
  const [visible, setVisible] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [action, setAction] = React.useState<SnackBarActionProps | undefined>(
    undefined,
  );

  // Function to show the snackbar
  const show = React.useCallback(
    (message: string, action?: SnackBarActionProps) => {
      setVisible(false);
      setTimeout(() => {
        setMessage(message);
        setAction(action);
        setVisible(true);
      }, 150);
    },
    [],
  );
  const onDismissSnackBar = React.useCallback(() => setVisible(false), []);
  const value = React.useMemo(() => ({ show }), [show]);

  return (
    <SnackBarContext.Provider value={value}>
      {children}

      <Snackbar
        visible={visible}
        onDismiss={onDismissSnackBar}
        action={action}
        duration={AUTO_DISMISS}
        style={{ marginBottom: 15 }}
      >
        {message}
      </Snackbar>
    </SnackBarContext.Provider>
  );
};

/**
 * Hook to use the Snackbar
 */
export const useSnackBar = () =>
  React.useContext(SnackBarContext) as SnackBarContextProps;
