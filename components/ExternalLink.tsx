import * as Linking from 'expo-linking';
import { Link, type Href } from 'expo-router';
import { type ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';

// Conditionally import WebBrowser only for non-TV platforms
let WebBrowser: typeof import('expo-web-browser') | null = null;
if (!Platform.isTV) {
  WebBrowser = require('expo-web-browser');
}

const openBrowserAsync = async (url: string) => {
  if (Platform.isTV || !WebBrowser) {
    // On TV platforms, fall back to Linking.openURL
    await Linking.openURL(url);
  } else {
    await WebBrowser.openBrowserAsync(url);
  }
};

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

const ExternalLinkMobile = ({ href, ...rest }: Props) => (
    <Link
      target="_blank"
      {...rest}
      href={href as Href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        }
      }}
    />
  )

const ExternalLinkTV = ({ href, ...rest }: Props) => (
    <Pressable
      onPress={() =>
        Linking.openURL(href).catch((reason) => alert(`${reason}`))
      }
      style={({ pressed, focused }) => ({
        opacity: pressed || focused ? 0.6 : 1.0
      })}
    >
      {rest.children}
    </Pressable>
  )

export function ExternalLink(props: Props) {
  return Platform.isTV ? ExternalLinkTV(props) : ExternalLinkMobile(props);
}
