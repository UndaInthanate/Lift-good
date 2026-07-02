import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChartPieSlice, House, ListBullets, Plus, SquaresFour } from 'phosphor-react-native';
import { useTheme } from '@/theme';
import { RootStackParamList, TabParamList } from './types';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { TransactionListScreen } from '@/screens/TransactionListScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { MoreMenuScreen } from '@/screens/MoreMenuScreen';
import { AddTransactionScreen } from '@/screens/AddTransactionScreen';
import { TransactionDetailScreen } from '@/screens/TransactionDetailScreen';
import { AccountsScreen } from '@/screens/AccountsScreen';
import { AccountDetailScreen } from '@/screens/AccountDetailScreen';
import { AccountFormScreen } from '@/screens/AccountFormScreen';
import { CategoriesScreen } from '@/screens/CategoriesScreen';
import { CategoryFormScreen } from '@/screens/CategoryFormScreen';
import { BudgetScreen } from '@/screens/BudgetScreen';
import { DebtListScreen } from '@/screens/DebtListScreen';
import { DebtDetailScreen } from '@/screens/DebtDetailScreen';
import { DebtFormScreen } from '@/screens/DebtFormScreen';
import { RecurringScreen } from '@/screens/RecurringScreen';
import { RecurringFormScreen } from '@/screens/RecurringFormScreen';
import { NotificationSettingsScreen } from '@/screens/NotificationSettingsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function DummyScreen() {
  return null;
}

function AddTabButton(props: BottomTabBarButtonProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.addButtonWrap}>
      <Pressable
        onPress={props.onPress as never}
        style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.fabShadow }]}
      >
        <Plus size={26} color="#FFFFFF" weight="bold" />
      </Pressable>
    </View>
  );
}

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          title: 'ภาพรวม',
          tabBarIcon: ({ color, focused }) => (
            <House size={24} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionListScreen}
        options={{
          title: 'รายการ',
          tabBarIcon: ({ color, focused }) => (
            <ListBullets size={24} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tab.Screen
        name="AddTab"
        component={DummyScreen}
        options={{
          title: '',
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('AddTransaction');
          },
        })}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'รายงาน',
          tabBarIcon: ({ color, focused }) => (
            <ChartPieSlice size={24} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreMenuScreen}
        options={{
          title: 'เพิ่มเติม',
          tabBarIcon: ({ color, focused }) => (
            <SquaresFour size={24} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator({ showWelcome }: { showWelcome: boolean }) {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      initialRouteName={showWelcome ? 'Welcome' : 'Tabs'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerBackTitle: 'กลับ',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: route.params?.editId ? 'แก้ไขรายการ' : 'เพิ่มรายการ',
        })}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ title: 'รายละเอียดรายการ' }}
      />
      <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: 'บัญชี' }} />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={{ title: 'รายละเอียดบัญชี' }}
      />
      <Stack.Screen
        name="AccountForm"
        component={AccountFormScreen}
        options={({ route }) => ({ title: route.params?.id ? 'แก้ไขบัญชี' : 'เพิ่มบัญชี' })}
      />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'หมวดหมู่' }} />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={({ route }) => ({ title: route.params.id ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่' })}
      />
      <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: 'งบประมาณ' }} />
      <Stack.Screen name="DebtList" component={DebtListScreen} options={{ title: 'จัดการหนี้' }} />
      <Stack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{ title: 'รายละเอียดหนี้' }}
      />
      <Stack.Screen
        name="DebtForm"
        component={DebtFormScreen}
        options={({ route }) => ({ title: route.params?.id ? 'แก้ไขหนี้' : 'เพิ่มหนี้' })}
      />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{ title: 'รายการประจำ' }} />
      <Stack.Screen
        name="RecurringForm"
        component={RecurringFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำ',
        })}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'การแจ้งเตือน' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'ตั้งค่า' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  addButtonWrap: { flex: 1, alignItems: 'center' },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.5,
    elevation: 6,
  },
});
