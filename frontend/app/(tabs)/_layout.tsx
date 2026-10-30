import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

const tabItemStyles = StyleSheet.create({
  tabItemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePill: {
    paddingHorizontal: 16,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Komponen helper untuk item menu dan kapsul pill aktif
function TabItem({
  focused,
  children,
  pillStyle,
  activeBackground,
  inactiveColor,
  activeColor,
}: {
  focused: boolean;
  children: (iconColor: string) => React.ReactNode;
  pillStyle: object;
  activeBackground: string;
  inactiveColor: string;
  activeColor: string;
}) {
  const iconColor = focused ? activeColor : inactiveColor;

  return (
    <View style={[tabItemStyles.tabItemContainer, focused && [tabItemStyles.activePill, { backgroundColor: activeBackground }, pillStyle]]}>
      {children(iconColor)}
    </View>
  );
}

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);

  // Perhitungan responsif dinamis
  const navbarHeight = Math.min(Math.max(height * 0.08, 60), 75);
  const iconSize = Math.min(Math.max(width * 0.07, 24), 32);
  const contentWidth = Math.min(width, 480);
  const pillWidth = (contentWidth * 0.9) / 5 - 8;
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
        sceneStyle: { width: '100%', maxWidth: 480, alignSelf: 'center' },
        tabBarStyle: [styles.floatingNavbar, { height: navbarHeight }],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Todo */}
      <Tabs.Screen
        name="todo"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} pillStyle={dynamicPillStyle} activeBackground={colors.surface} inactiveColor={colors.onPrimary} activeColor={colors.primary}>
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
            <TabItem focused={focused} pillStyle={dynamicPillStyle} activeBackground={colors.surface} inactiveColor={colors.onPrimary} activeColor={colors.primary}>
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
            <TabItem focused={focused} pillStyle={dynamicPillStyle} activeBackground={colors.surface} inactiveColor={colors.onPrimary} activeColor={colors.primary}>
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
            <TabItem focused={focused} pillStyle={dynamicPillStyle} activeBackground={colors.surface} inactiveColor={colors.onPrimary} activeColor={colors.primary}>
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
            <TabItem focused={focused} pillStyle={dynamicPillStyle} activeBackground={colors.surface} inactiveColor={colors.onPrimary} activeColor={colors.primary}>
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

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  floatingNavbar: {
    bottom: "3%",
    width: '90%',
    maxWidth: 440,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    borderTopWidth: 0,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    alignSelf: 'center',

    // Shadow iOS
    shadowColor: colors.shadow,
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
});