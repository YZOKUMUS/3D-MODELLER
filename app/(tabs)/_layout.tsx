import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAMBU } from '@/constants/bambuTheme';
import { useCart } from '@/context/CartContext';
import { useColorScheme } from '@/components/useColorScheme';
import { tabBarBottomPadding } from '@/lib/layout';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: 2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { totalQuantity, ready } = useCart();
  const insets = useSafeAreaInsets();

  const dark = colorScheme === 'dark';
  const padBottom = tabBarBottomPadding(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BAMBU.tabActive,
        tabBarInactiveTintColor: dark ? '#64748b' : '#9ca3af',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          backgroundColor: dark ? '#12121a' : '#ffffff',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: dark ? '#2a2a32' : '#e5e7eb',
          elevation: Platform.OS === 'android' ? 10 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
          shadowRadius: 10,
          paddingTop: 6,
          paddingBottom: padBottom,
          height: undefined,
          minHeight: 50 + padBottom,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Modeller',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Sepet',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          tabBarBadge:
            ready && totalQuantity > 0
              ? totalQuantity > 99
                ? '99+'
                : totalQuantity
              : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ben',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
