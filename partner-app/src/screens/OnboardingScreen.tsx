import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import { API_BASE_URL } from '../constants/config';

const DOC_FIELDS = [
  { key: 'licenseImage', label: 'Driving License', placeholder: 'Photo of your driving license' },
  { key: 'registrationImage', label: 'Vehicle Registration (RC)', placeholder: 'Photo of RC book' },
  { key: 'insuranceImage', label: 'Vehicle Insurance', placeholder: 'Photo of insurance paper' },
  { key: 'profileImage', label: 'Profile Photo', placeholder: 'Your photo' },
];

const VEHICLE_TYPES = ['Auto'];
const MAKES = ['Bajaj', 'Mahindra', 'Piaggio', 'TVS', 'Atul Auto', 'Kinetic Green'];
const MODELS_BY_MAKE: Record<string, string[]> = {
  Bajaj: ['RE', 'Compact', 'Maxima C'],
  Mahindra: ['Alfa', 'Alfa DX', 'Jeeto'],
  Piaggio: ['Ape City', 'Ape Xtra', 'Ape Dx'],
  TVS: ['King', 'King Duplex', 'XL 100'],
  'Atul Auto': ['Gem', 'Ritz', 'Smart'],
  'Kinetic Green': ['Safar', 'Safar Smart'],
};
const YEARS = Array.from({ length: 12 }, (_, i) => `${new Date().getFullYear() - i}`);
const COLORS_LIST = ['Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Yellow', 'Green'];

const formatLicensePlate = (raw: string) => {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  if (clean.length <= 2) return clean;
  if (clean.length <= 4) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  if (clean.length <= 6) return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}-${clean.slice(6)}`;
};

const formatLicenseNumber = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20);

function Dropdown({
  label,
  value,
  options,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>{item}</Text>
                  {item === value && <Text style={styles.optionTick}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function OnboardingScreen({ navigation }: any) {
  const { driver, token, updateDriver, logout } = useDriverAuth();

  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [vehicleType, setVehicleType] = useState('Auto');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState(driver?.vehicle?.licensePlate || '');
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async (key: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setDocs((prev) => ({ ...prev, [key]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSubmit = async () => {
    if (!licenseNumber || !make || !model || !year || !color || !licensePlate) {
      Alert.alert('Missing details', 'Fill in vehicle details, license number and plate.');
      return;
    }
    if (!docs.licenseImage || !docs.registrationImage || !docs.insuranceImage) {
      Alert.alert('Documents required', 'Please upload license, registration and insurance photos.');
      return;
    }

    setIsSubmitting(true);
    try {
      let authToken = token || driver?.token || (await AsyncStorage.getItem('driver_token'));
      if (!authToken) {
        Alert.alert('Session expired', 'Please login again.');
        logout();
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const res = await axios.post(
        `${API_BASE_URL}/auth/driver/onboarding`,
        {
          licenseNumber,
          vehicleType: vehicleType.toLowerCase(),
          make,
          model,
          year,
          color,
          licensePlate,
          documents: docs,
        }
      );
      const updated = res.data.user;
      updateDriver({
        licenseNumber,
        documents: docs,
        onboardingStatus: updated.onboardingStatus || 'submitted',
        vehicle: updated.vehicle,
      });
      Alert.alert('Submitted', 'Your details are submitted for review.', [
        { text: 'OK', onPress: () => navigation.replace('ReviewStatus') },
      ]);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Alert.alert('Session expired', 'Please login again.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        Alert.alert('Error', err.response?.data?.error?.message || 'Could not submit onboarding');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete your profile</Text>
      </View>
      <Text style={styles.subtitle}>
        Enter your details and upload documents. The admin will review and approve them.
      </Text>

      <Text style={styles.sectionTitle}>Personal</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Driving License Number</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={(t) => setLicenseNumber(formatLicenseNumber(t))}
          placeholder="e.g. DL142020123456"
          placeholderTextColor={COLORS.gray}
          autoCapitalize="characters"
        />
        <Text style={styles.hint}>Only letters and numbers are allowed</Text>
      </View>

      <Text style={styles.sectionTitle}>Vehicle</Text>
      <Dropdown
        label="Vehicle Type"
        value={vehicleType}
        options={VEHICLE_TYPES}
        placeholder="Select vehicle type"
        onSelect={setVehicleType}
      />
      <Dropdown
        label="Make"
        value={make}
        options={MAKES}
        placeholder="Select make"
        onSelect={(v) => {
          setMake(v);
          setModel('');
        }}
      />
      <Dropdown
        label="Model"
        value={model}
        options={MODELS_BY_MAKE[make] || []}
        placeholder={make ? 'Select model' : 'Select make first'}
        onSelect={setModel}
      />
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Dropdown
            label="Year"
            value={year}
            options={YEARS}
            placeholder="Select year"
            onSelect={setYear}
          />
        </View>
        <View style={styles.flex1}>
          <Dropdown
            label="Color"
            value={color}
            options={COLORS_LIST}
            placeholder="Select color"
            onSelect={setColor}
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          value={licensePlate}
          onChangeText={(t) => setLicensePlate(formatLicensePlate(t))}
          placeholder="DL-01-AB-1234"
          placeholderTextColor={COLORS.gray}
          autoCapitalize="characters"
        />
        <Text style={styles.hint}>Dashes are added automatically. Only letters and numbers.</Text>
      </View>

      <Text style={styles.sectionTitle}>Documents</Text>
      {DOC_FIELDS.map((doc) => (
        <TouchableOpacity key={doc.key} style={styles.docCard} onPress={() => pickImage(doc.key)}>
          <View style={styles.docLeft}>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={styles.docHint}>{docs[doc.key] ? 'Uploaded ✓' : doc.placeholder}</Text>
          </View>
          {docs[doc.key] ? (
            <Image source={{ uri: docs[doc.key] }} style={styles.docThumb} />
          ) : (
            <Text style={styles.uploadBtn}>Upload</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.disabled]} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitText}>Submit for Review</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.note}>
        After submitting, the admin will review your documents. You'll be able to go online once approved.
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backText: { fontSize: 32, color: COLORS.text, marginTop: -4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 22, marginBottom: 10 },
  field: { marginBottom: 12 },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  hint: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    backgroundColor: COLORS.white,
  },
  dropdownValue: { fontSize: 15, color: COLORS.text },
  dropdownPlaceholder: { fontSize: 15, color: COLORS.gray },
  dropdownChevron: { fontSize: 16, color: COLORS.gray },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: '70%',
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  modalClose: { fontSize: 18, color: COLORS.gray },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  optionText: { fontSize: 15, color: COLORS.text },
  optionTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  optionTick: { fontSize: 16, color: COLORS.primary, fontWeight: 'bold' },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  docLeft: { flex: 1, paddingRight: 12 },
  docLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  docHint: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  docThumb: { width: 52, height: 52, borderRadius: 8 },
  uploadBtn: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
  note: { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  logoutButton: { alignItems: 'center', paddingTop: 30 },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
});