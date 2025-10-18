import * as Linking from 'expo-linking';
import { Link, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';


const openBrowserAsync =
  Platform.isTV && Platform.OS === 'ios'
    ? async () => {}
    : WebBrowser.openBrowserAsync;

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
