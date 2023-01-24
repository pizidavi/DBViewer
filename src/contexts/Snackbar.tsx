import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
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

const SnackBarContext = createContext<SnackBarContextProps>({
  show: (message: string, action?: SnackBarActionProps) => {},
});

export const SnackBarProvider = ({ children }: PropsWithChildren) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<SnackBarActionProps | undefined>(
    undefined,
  );

  const show = useCallback((message: string, action?: SnackBarActionProps) => {
    setVisible(false);
    setTimeout(() => {
      setMessage(message);
      setAction(action);
      setVisible(true);
    }, 150);
  }, []);
  const onDismissSnackBar = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ show }), [show]);

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

export const useSnackBar = () => useContext(SnackBarContext);
