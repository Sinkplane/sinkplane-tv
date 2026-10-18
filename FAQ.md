# Sinkplane FAQ

## 1. Why do I sign in with a QR code?

Floatplane uses cloudflare turnstile to prevent DDOS attacks on their website, which is required as a parameter to login with their API.

This works fine for the regular react native mobile app, as regular iOS and Android apps can render the turnstile in a WebView (embedded webpage) through react-native-webview. But this approach will not work with a react native TV app (or any apple tv / google tv applications) because neither support webview as part of their operating system SDKs.

So instead of a login form, the TV uses Floatplane's official **OIDC device authorization flow** against their `auth.floatplane.com` instance (yes, the same one [Hydravion](https://github.com/Inertia-Network/Hydravion) uses). Scan the QR code on the sign-in screen with your phone, or visit floatplane.com/link on any device and punch in the code shown on the TV, sign in like a normal person, and the TV wakes up logged in. Session tokens are stored securely on the TV and refreshed automatically.

Back in the day this app required a separate mobile app and a "write down the plaintext auth cookie value from your browser" fallback, but Floatplane's own device flow made both of those obsolete. No extra apps, no copying cookies, and no post-it notes for Dan Besser to break into your house, bang your wife, and watch free 4k videos on his linux ISO nas server.

## 2. Why are you using react native and why ... ewww .... typescript?

We are using react native because thats what the existing floatplane app uses.

<img src="https://media.makeameme.org/created/synergy-12c28bbd5e.jpg">

As far as typescript, as the brits would say, get bent bruv.

## 3. Are you on LTTs payrol?

Lol I wish

## 4. Can I use cursor/warp/claude code to contribute.

Sure, Im all for using AI to generate ~~carbon emissions~~ code but your code will be reviewed along the same criteria as if you were a "real boy" software developer knowing what you are doing. Questions like "how do I get my code pushed into the main repo" or "how do I create a pull request" will be closed without comment.

## 5. Will you eject to react native?

<img src="https://media.tenor.com/BnEzKzDQMnEAAAAi/x-do-not-want.gif" >
