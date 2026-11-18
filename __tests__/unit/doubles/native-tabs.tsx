import type { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ChildrenProps {
  readonly children?: ReactNode;
}

function Label({ children }: ChildrenProps): ReactElement {
  return <Text>{children}</Text>;
}

function Icon(): null {
  return null;
}

function Trigger({ children }: ChildrenProps): ReactElement {
  return <View>{children}</View>;
}

export function NativeTabs({ children }: ChildrenProps): ReactElement {
  return <View>{children}</View>;
}

Trigger.Label = Label;
Trigger.Icon = Icon;
NativeTabs.Trigger = Trigger;
