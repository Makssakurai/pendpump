// Static HTML shell for expo-router web export.
// Prevents white flash and guarantees correct meta.
import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2A5BD7" />
        <title>Vendpump</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: rawStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// No module-scope access to window/AsyncStorage — only pure CSS here.
const rawStyle = `
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background-color: #F0F6FF;
    font-family: 'Poppins_400Regular', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-y: scroll;
  }
  /* Thin light scrollbar so the projector looks clean */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #BFD7FF; border-radius: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;
