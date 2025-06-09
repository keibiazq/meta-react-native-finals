import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';

const UserContext = createContext();

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    notifications: {
      orderStatuses: false,
      passwordChanges: false,
      specialOffers: false,
      newsletter: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem('isOnboarded');
        const storedUserData = await AsyncStorage.getItem('userData');
        if (onboardingStatus === 'true' && storedUserData) {
          setIsOnboarded(true);
          setUserData(JSON.parse(storedUserData));
        }
      } catch (e) {
        console.error('Failed to load onboarding status or user data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const updateUserData = useCallback(async (newUserData) => {
    try {
      setUserData(newUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
    } catch (e) {
      console.error('Failed to save user data:', e);
    }
  }, []);

  const Stack = createStackNavigator();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ userData, updateUserData, setIsOnboarded }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#F4CE14' }, // Little Lemon yellow
            headerTintColor: '#333333',
            headerTitleStyle: { fontWeight: 'bold' },
            headerTitleAlign: 'center',
            headerBackTitleVisible: false, // Hides "Back" text on iOS
          }}
        >
          {isOnboarded ? (
            // If onboarded, start with Home screen
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={({ navigation }) => ({
                  headerTitle: () => (
                    <Image
                      source={require('./assets/little-lemon-logo.png')} // Make sure this path is correct
                      style={styles.headerLogo}
                      resizeMode="contain"
                    />
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Profile')}
                      style={styles.profileIconContainer}
                    >
                      <Icon name="user-circle" size={30} color="#333333" />
                    </TouchableOpacity>
                  ),
                })}
              />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          ) : (
            // If not onboarded, start with Onboarding screen
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }} // Hide header for onboarding
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}

// Onboarding Screen Component
function OnboardingScreen({ navigation }) {
  const { updateUserData, setIsOnboarded } = useContext(UserContext);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form inputs
  useEffect(() => {
    // Basic validation: first name and email should not be empty, email should be somewhat valid
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsFormValid(firstName.trim().length > 0 && isValidEmail);
  }, [firstName, email]);

  // Handle "Next" button press
  const handleOnboardingComplete = async () => {
    try {
      const newUserData = { firstName, email, lastName: '', phoneNumber: '', notifications: {} };
      await updateUserData(newUserData); // Save user data
      await AsyncStorage.setItem('isOnboarded', 'true'); // Mark as onboarded
      setIsOnboarded(true); // Update context state to trigger re-render and navigate to Home
      navigation.replace('Home'); // Replace current screen with Home
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
      Alert.alert('Error', 'Could not save your details. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.onboardingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.onboardingHeader}>
        <Image
          source={require('./assets/little-lemon-logo.png')} // Make sure this path is correct
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <Text style={styles.onboardingTitle}>Welcome to Little Lemon!</Text>
        <Text style={styles.onboardingSubtitle}>
          We need a few details to get you started.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          placeholderTextColor="#A9A9A9"
        />
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#A9A9A9"
        />

        <TouchableOpacity
          style={[styles.button, !isFormValid && styles.buttonDisabled]}
          onPress={handleOnboardingComplete}
          disabled={!isFormValid}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Home Screen Component
function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([
    { id: '1', name: 'Greek Salad', description: 'The famous Greek salad of crispy lettuce, peppers, olives and our Chicago style feta cheese.', price: '$12.99', category: 'Starters', image: 'https://placehold.co/100x100/F4CE14/333333?text=GS' },
    { id: '2', name: 'Bruschetta', description: 'Our Bruschetta is made from grilled bread that has been smeared with garlic and seasoned with salt and olive oil.', price: '$7.99', category: 'Starters', image: 'https://placehold.co/100x100/F4CE14/333333?text=BR' },
    { id: '3', name: 'Grilled Fish', description: 'Barbequed catch of the day, with red onion, crisp capers, chive creme fraiche, and a hint of lemon.', price: '$20.00', category: 'Mains', image: 'https://placehold.co/100x100/F4CE14/333333?text=GF' },
    { id: '4', name: 'Pasta', description: 'Penne with fried aubergines, tomato sauce, fresh chilli, garlic, basil & salted ricotta.', price: '$18.99', category: 'Mains', image: 'https://placehold.co/100x100/F4CE14/333333?text=PA' },
    { id: '5', name: 'Lemon Dessert', description: 'Light and fluffy traditional homemade Italian Lemon and ricotta cake.', price: '$6.99', category: 'Desserts', image: 'https://placehold.co/100x100/F4CE14/333333?text=LD' },
    { id: '6', name: 'Coca-Cola', description: 'Classic Coca-Cola, refreshing and cold.', price: '$2.50', category: 'Drinks', image: 'https://placehold.co/100x100/F4CE14/333333?text=CC' },
  ]);

  const categories = ['Starters', 'Mains', 'Desserts', 'Drinks'];

  // Filter menu items based on search query and selected categories
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return matchesSearch && matchesCategory;
  });

  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  return (
    <ScrollView style={styles.homeContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Little Lemon</Text>
        <View style={styles.heroContent}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroSubtitle}>Chicago</Text>
            <Text style={styles.heroDescription}>
              We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
            </Text>
          </View>
          <Image
            source={require('./assets/hero-image.jpg')} // Make sure this path is correct
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search for a dish..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A9A9A9"
          />
        </View>
      </View>

      {/* Menu Breakdown Section */}
      <View style={styles.menuBreakdownSection}>
        <Text style={styles.sectionTitle}>ORDER FOR DELIVERY!</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryButtonsContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategories.includes(category) && styles.categoryButtonSelected,
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategories.includes(category) && styles.categoryButtonTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.separator} />
      </View>

      {/* Food Menu List Section */}
      <View style={styles.foodMenuListSection}>
        <FlatList
          data={filteredMenuItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.menuItem}>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
                <Text style={styles.menuItemPrice}>{item.price}</Text>
              </View>
              <Image source={{ uri: item.image }} style={styles.menuItemImage} resizeMode="cover" />
            </View>
          )}
          scrollEnabled={false} // Disable FlatList scrolling as it's inside a ScrollView
        />
      </View>
    </ScrollView>
  );
}

// Profile Screen Component
function ProfileScreen({ navigation }) {
  const { userData, updateUserData, setIsOnboarded } = useContext(UserContext);
  const [tempUserData, setTempUserData] = useState({ ...userData }); // Temporary state for edits

  // Update temp state when userData from context changes (e.g., after save)
  useEffect(() => {
    setTempUserData({ ...userData });
  }, [userData]);

  // Handle saving changes
  const handleSaveChanges = async () => {
    try {
      await updateUserData(tempUserData);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      console.error('Failed to save profile changes:', e);
      Alert.alert('Error', 'Could not save changes. Please try again.');
    }
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    setTempUserData({ ...userData }); // Revert to original user data
    Alert.alert('Discarded', 'Changes have been discarded.');
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? All your data will be cleared.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await AsyncStorage.clear(); // Clear all data from AsyncStorage
              setIsOnboarded(false); // Set onboarding status to false
              Alert.alert('Logged Out', 'You have been logged out and all data cleared.');
              navigation.replace('Onboarding'); // Go back to onboarding screen
            } catch (e) {
              console.error('Failed to log out:', e);
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleNotificationToggle = (key) => {
    setTempUserData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.profileContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.profileContent}>
        <Text style={styles.profileTitle}>Personal information</Text>

        <View style={styles.avatarSection}>
          <Text style={styles.label}>Avatar</Text>
          <View style={styles.avatarControls}>
            <Image
              source={require('./assets/profile-placeholder.png')} // Placeholder image
              style={styles.profileAvatar}
            />
            <TouchableOpacity style={styles.profileButton} onPress={() => Alert.alert('Change Avatar', 'Functionality not implemented.')}>
              <Text style={styles.profileButtonText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.profileButton, styles.profileButtonDanger]} onPress={() => Alert.alert('Remove Avatar', 'Functionality not implemented.')}>
              <Text style={styles.profileButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>First name</Text>
        <TextInput
          style={styles.input}
          value={tempUserData.firstName}
          onChangeText={(text) => setTempUserData({ ...tempUserData, firstName: text })}
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Last name</Text>
        <TextInput
          style={styles.input}
          value={tempUserData.lastName}
          onChangeText={(text) => setTempUserData({ ...tempUserData, lastName: text })}
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={tempUserData.email}
          onChangeText={(text) => setTempUserData({ ...tempUserData, email: text })}
          keyboardType="email-address"
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={tempUserData.phoneNumber}
          onChangeText={(text) => setTempUserData({ ...tempUserData, phoneNumber: text })}
          keyboardType="phone-pad"
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Email notifications</Text>
        <View style={styles.notificationSection}>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleNotificationToggle('orderStatuses')}>
            <View style={[styles.checkbox, tempUserData.notifications.orderStatuses && styles.checkboxChecked]}>
              {tempUserData.notifications.orderStatuses && <Icon name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Order statuses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleNotificationToggle('passwordChanges')}>
            <View style={[styles.checkbox, tempUserData.notifications.passwordChanges && styles.checkboxChecked]}>
              {tempUserData.notifications.passwordChanges && <Icon name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Password changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleNotificationToggle('specialOffers')}>
            <View style={[styles.checkbox, tempUserData.notifications.specialOffers && styles.checkboxChecked]}>
              {tempUserData.notifications.specialOffers && <Icon name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Special offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleNotificationToggle('newsletter')}>
            <View style={[styles.checkbox, tempUserData.notifications.newsletter && styles.checkboxChecked]}>
              {tempUserData.notifications.newsletter && <Icon name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Newsletter</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <View style={styles.profileActionButtons}>
          <TouchableOpacity style={[styles.profileButton, styles.profileButtonDiscard]} onPress={handleDiscardChanges}>
            <Text style={styles.profileButtonText}>Discard changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.profileButton, styles.profileButtonSave]} onPress={handleSaveChanges}>
            <Text style={styles.profileButtonText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Stylesheet for all components
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDEFEE',
  },
  loadingText: {
    fontSize: 24,
    color: '#333333',
  },
  headerLogo: {
    width: 150,
    height: 40,
  },
  profileIconContainer: {
    paddingRight: 15,
  },

  // Onboarding Styles
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#EDEFEE',
  },
  onboardingHeader: {
    backgroundColor: '#DEB887', // A softer yellow for header
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  onboardingContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 18,
    color: '#495E57',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '90%',
    height: 50,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  button: {
    backgroundColor: '#495E57',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Home Screen Styles
  homeContainer: {
    flex: 1,
    backgroundColor: '#EDEFEE',
  },
  heroSection: {
    backgroundColor: '#495E57',
    padding: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F4CE14',
    marginBottom: 5,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTextContainer: {
    flex: 2,
    paddingRight: 10,
  },
  heroSubtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  menuBreakdownSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  categoryButtonsContainer: {
    paddingVertical: 5,
  },
  categoryButton: {
    backgroundColor: '#D9D9D9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  categoryButtonSelected: {
    backgroundColor: '#495E57',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginVertical: 20,
  },
  foodMenuListSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuItemTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#495E57',
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495E57',
  },
  menuItemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  // Profile Screen Styles
  profileContainer: {
    flex: 1,
    backgroundColor: '#EDEFEE',
  },
  profileContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#495E57',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  avatarSection: {
    marginBottom: 30,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#F4CE14',
  },
  avatarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#495E57',
    marginRight: 10,
  },
  profileButtonText: {
    color: '#495E57',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileButtonDanger: {
    borderColor: '#EE9972',
    backgroundColor: '#EE9972',
  },
  notificationSection: {
    backgroundColor: '#F4CE14',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#495E57',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    backgroundColor: '#EE9972',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  profileButtonDiscard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#495E57',
    borderWidth: 1,
  },
  profileButtonSave: {
    backgroundColor: '#495E57',
    borderColor: '#495E57',
    borderWidth: 1,
  },
  profileButtonText: {
    color: '#495E57',
    fontWeight: 'bold',
  },
  profileButtonTextSave: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
