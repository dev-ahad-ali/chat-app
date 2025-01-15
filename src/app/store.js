import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../features/api/apiSlice.js';
import authReducer from '../features/auth/authSlice.js';
import conversationsReducer from '../features/conversations/conversationsSlice.js';
import messagesReducer from '../features/messages/messagesSlice.js';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    'auth': authReducer,
    'conversations': conversationsReducer,
    'messages': messagesReducer,
  },
  // devTools: process.NODE_ENV !== 'production'
  middleware: (getDefaultMiddlewares) => [...getDefaultMiddlewares(), apiSlice.middleware],
});
