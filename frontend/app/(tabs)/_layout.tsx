import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Komponen helper untuk item menu dan kapsul pill aktif
function TabItem({
  focused,
  children,
  pillStyle,
}: {
  focused: boolean;
  children: (iconColor: string) => React.ReactNode;
  pillStyle: object;
}) {
  // Warna ikon saat aktif adalah warna background navbar (#1D2B53), saat tidak aktif putih bersih
  const iconColor = focused ? '#1D2B53' : '#FFFFFF';

  return (
    <View style={[styles.tabItemContainer, focused && [styles.activePill, pillStyle]]}>
      {children(iconColor)}
    </View>
  );
}

export default function TabLayout() {
  const { width, height } = useWindowDimensions();

  // Perhitungan responsif dinamis
  const navbarHeight = Math.min(Math.max(height * 0.08, 60), 75);
  const iconSize = Math.min(Math.max(width * 0.07, 24), 32);
  const pillWidth = (width * 0.9) / 5 - 8; // Membagi 5 ruang tab secara rata & presisi
  const pillHeight = navbarHeight * 0.72;

  const dynamicPillStyle = {
    width: pillWidth,
    height: pillHeight,
  };

  return (
    <Tabs
      initialRouteName="calendar"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.floatingNavbar, { height: navbarHeight }],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Todo */}
      <Tabs.Screen
        name="todo"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle}>
              {(color) => (
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={iconSize}
                  color={color}
                />
              )}
            </TabItem>
          ),
        }}
      />

      {/* 2. Time */}
      <Tabs.Screen
        name="time"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle}>
              {(color) => (
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={iconSize}
                  color={color}
                />
              )}
            </TabItem>
          ),
        }}
      />

      {/* 3. Calendar (Default) */}
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle}>
              {(color) => (
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={iconSize}
                  color={color}
                />
              )}
            </TabItem>
          ),
        }}
      />

      {/* 4. Matrix */}
      <Tabs.Screen
        name="matrix"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle}>
              {(color) => (
                <MaterialCommunityIcons
                  name="view-grid"
                  size={iconSize}
                  color={color}
                />
              )}
            </TabItem>
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle}>
              {(color) => (
                <FontAwesome5
                  name="user-alt"
                  size={iconSize - 2}
                  color={color}
                />
              )}
            </TabItem>
          ),
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingNavbar: {
    bottom: "3%",
    width: '90%',
    backgroundColor: '#1D2B53',
    borderRadius: 9999,
    borderTopWidth: 0,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    alignSelf: 'center',

    // Shadow iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,

    // Shadow Android
    elevation: 12,
  },
  tabBarItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  },
  tabItemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Kapsul pill aktif
  activePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});