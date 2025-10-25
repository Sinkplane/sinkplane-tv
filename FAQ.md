# Sinkplane FAQ

## 1. Why is there a companion app?

Floatplane uses cloudflare turnstile to prevent DDOS attacks on their website, which is required as a parameter to login with their API.

This works fine for the regular react native mobile app, as regular iOS and Android apps can render the turnstile in a WebView (embedded webpage) through react-native-webview. But this approach will not work with a react native TV app (or any apple tv / google tv applications) because neither support webview as part of their operating system SDKs.

So we have two options to authenticate with floatplane.com:

1. We can setup a website and send the authentication token to the mobile app through a websocket i.e. using firebase
2. We can share the authentication token over the same network as the TV using a TCP server and companion app

There are pros/cons to either approach, but I cant really achieve the first one as I do not control the floatplane.com domain and the auth cookie is a secure httpOnly cookie that would prevent me from intercepting if I launched a website. Also hosting costs. Also you probably don't want me to control a website sending your tokens back and forth.

So the solution for now, is to use a companion app. Hopefuly the (coming soon) extra features of video queue management will make it worth your while.

If you absolutely dont want to add yet another app to your phone, I invite you to write down the plaintext auth cookie value from your browser (it's the one with the name `sails.sid` and you can find under Application and Cookies) and enter it into the text bubble on the login page. Just make sure to leave the post it note out so Dan Besser can break into your house, bang your wife, and watch free 4k videos on his linux ISO nas server.

## 2. Why are you using react native and why ... ewww .... typescript?

We are using react native because thats what the existing floatplane app uses.

<img src="https://media.makeameme.org/created/synergy-12c28bbd5e.jpg">

As far as typescript, as the brits would say, get bent bruv.

## 3. Are you on LTTs payrol?

Lol I wish

## 4. Can I use cursor/warp/claude code to contribute.

Sure, Im all for using AI to generate ~~tokens~~ ~~carbon emissions~~ code but your code will be reviewed along the same criteria as if you were a "real boy" software developer knowing what you are doing. Questions like "how do I get my code pushed into the main repo" or "how do I create a pull request" will be closed without comment.

## 5. Will you eject to react native?

<img src="https://media.tenor.com/BnEzKzDQMnEAAAAi/x-do-not-want.gif" >
