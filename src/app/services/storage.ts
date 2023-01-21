import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StorageState {
  servers: Server[];
}

const initialState: StorageState = {
  servers: [],
};

export const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    addServer: (state, action: PayloadAction<Server>) => {
      const server = action.payload;
      state.servers.push(server);
    },
    editServer: (state, action: PayloadAction<Server>) => {
      const index = state.servers.findIndex(
        server => server.id === action.payload.id,
      );
      state.servers[index] = action.payload;
    },
    deleteServer: (state, action: PayloadAction<string>) => {
      const servers = state.servers.filter(
        server => server.id !== action.payload,
      );
      state.servers = servers;
    },
  },
});

export const { addServer, editServer, deleteServer } = storageSlice.actions;
export default storageSlice.reducer;
