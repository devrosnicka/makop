import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@mantine/core/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext.tsx';
import { theme } from './theme.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AuthProvider>
        <App />
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>,
);
