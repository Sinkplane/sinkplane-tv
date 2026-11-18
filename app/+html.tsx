import type { PropsWithChildren, ReactElement } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

export default function Root({ children }: Readonly<PropsWithChildren>): ReactElement {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style>{responsiveBackground}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
