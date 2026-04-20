import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAMBU } from '@/constants/bambuTheme';
import { useColorScheme } from '@/components/useColorScheme';
import { tabBarBottomPadding } from '@/lib/layout';

type TabGlyph = 'models' | 'add';

/** Web/PWA: FontAwesome sık bozuluyor; +html.tsx'teki Material Icons ligature kullan. */
function TabBarIcon({ kind, color }: { kind: TabGlyph; color: string }) {
  if (Platform.OS === 'web') {
    const ligature = kind === 'models' ? 'apps' : 'add_a_photo';
    return (
      <Text
        allowFontScaling={false}
        selectable={false}
        style={{
          fontFamily: 'Material Icons',
          fontSize: 26,
          color,
          marginBottom: 2,
          fontWeight: 'normal',
          fontStyle: 'normal',
        }}>
        {ligature}
      </Text>
    );
  }
  const name: React.ComponentProps<typeof FontAwesome>['name'] =
    kind === 'models' ? 'th-large' : 'camera';
  return <FontAwesome name={name} size={22} color={color} style={{ marginBottom: 2 }} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
          tabBarIcon: ({ color }) => <TabBarIcon kind="models" color={color} />,
        }}
      />
      <Tabs.Screen
        name="resim-ekle"
        options={{
          title: 'Resim ekle',
          tabBarIcon: ({ color }) => <TabBarIcon kind="add" color={color} />,
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
