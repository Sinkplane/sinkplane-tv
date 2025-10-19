import React, { useCallback, useRef } from 'react';
import { WebView } from 'react-native-webview';

type TurnstileMessage =
  | { event: 'mount' }
  | { event: 'success'; token: string }
  | { event: 'error' }
  | { event: 'expire' }
  | { event: 'timeout' };

interface TurnstileWebViewProps {
  siteKey: string;
  theme?: 'light' | 'dark' | 'auto';
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onTimeout?: () => void;
}

export default function TurnstileWebView({ siteKey, theme = 'light', onSuccess, onError, onExpire, onTimeout }: TurnstileWebViewProps) {
  const webViewRef = useRef(null);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_turnstileCb" async defer></script>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: transparent;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            #myWidget {
                padding: 0;
                margin: 0;
                background-color: transparent;
                border: none;
            }
        </style>
    </head>
    <body>
        <div id="myWidget"></div>
        <script>
            let widgetId;

            function sendMount() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'mount' }));
            }

            function sendSuccess(token) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', token }));
            }

            function sendError() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'error' }));
            }

            function sendExpired() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'expire' }));
            }

            function sendTimeout() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'timeout' }));
            }

            function _turnstileCb() {
                sendMount();

                widgetId = turnstile.render('#myWidget', {
                    sitekey: '${siteKey}',
                    size: 'flexible',
                    theme: '${theme}',
                    callback: sendSuccess,
                    'error-callback': sendError,
                    'expired-callback': sendExpired,
                    'timeout-callback': sendTimeout,
                });
            }

            function resetTurnstile() {
                if (widgetId) {
                    sendExpired();
                    turnstile.reset(widgetId);
                }
            }
        </script>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const message: TurnstileMessage = JSON.parse(event.nativeEvent.data);

        switch (message.event) {
          case 'mount':
            console.info('Turnstile mounted');
            break;
          case 'success':
            if (message.token) {
              onSuccess?.(message.token);
            }
            break;
          case 'error':
            onError?.();
            break;
          case 'expire':
            onExpire?.();
            break;
          case 'timeout':
            onTimeout?.();
            break;
        }
      } catch (error) {
        console.error('Error handling Turnstile message:', error);
      }
    },
    [onSuccess, onError, onExpire, onTimeout]
  );

  return (
    <WebView
      ref={webViewRef}
      source={{ html: htmlContent }}
      onMessage={handleMessage}
      style={{ backgroundColor: 'transparent' }}
      scrollEnabled={false}
    />
  );
}
