import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PhotoLibraryProvider } from './src/lib/PhotoLibraryContext';
import type { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import FolderScreen from './src/screens/FolderScreen';
import PhotoDetailScreen from './src/screens/PhotoDetailScreen';
import ConfirmDeleteScreen from './src/screens/ConfirmDeleteScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0F1729', card: '#0F1729', primary: '#F5C518' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PhotoLibraryProvider>
        <NavigationContainer theme={theme}>
          <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F1729' }, headerTintColor: 'white' }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Folder" component={FolderScreen} />
            <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} options={{ title: '' }} />
            <Stack.Screen
              name="ConfirmDelete"
              component={ConfirmDeleteScreen}
              options={{ title: 'Revisar antes de eliminar' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PhotoLibraryProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
