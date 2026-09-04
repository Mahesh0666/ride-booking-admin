import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import driverService from '../services/driverService';

export default function EditProfileScreen({ navigation }: any) {
  const { driver, updateDriver } = useDriverAuth();
  const [name, setName] = useState(driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [photo, setPhoto] = useState<string | undefined>(driver?.documents?.profileImage);
  const [isSaving, setIsSaving] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to update your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = { name: name.trim(), phone: phone.trim() };
      if (photo && photo !== driver?.documents?.profileImage) {
        payload.profileImage = photo;
      }
      const response = await driverService.updateProfile(payload);
      const updated = response.data.user;
      const docs = photo && photo !== driver?.documents?.profileImage
        ? { ...(driver?.documents || {}), profileImage: photo }
        : driver?.documents;
      updateDriver({
        name: updated.name,
        phone: updated.phone,
        profileImage: updated.profileImage || photo,
        documents: docs,
      });
      Alert.alert('Saved', 'Your profile has been updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name?.charAt(0) || '?'}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickPhoto}>
          <Text style={styles.changePhotoText}>Change photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={COLORS.gray}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Your phone number"
          placeholderTextColor={COLORS.gray}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.input, styles.emailInput]}>
          <Text style={styles.emailText}>{driver?.email}</Text>
        </View>
        <Text style={styles.hint}>Email cannot be changed</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.disabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.saveText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  photoSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: COLORS.white, fontSize: 40, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cameraIcon: { fontSize: 14 },
  changePhotoText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  emailInput: { justifyContent: 'center' },
  emailText: { fontSize: 15, color: COLORS.gray },
  hint: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
});
