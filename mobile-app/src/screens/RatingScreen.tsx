import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/config';
import rideService from '../services/rideService';

const QUICK_TAGS = ['Polite', 'On time', 'Careful', 'Clean', 'Good route', 'Fast'];

export default function RatingScreen({ navigation, route }: any) {
  const { rideId } = route.params;
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleRate = async () => {
    if (rating < 1) {
      Alert.alert('Select rating', 'Please give at least 1 star');
      return;
    }
    setIsLoading(true);
    try {
      await rideService.rateRide(rideId, rating, comment || tags.join(', '));
      Alert.alert('Thank you!', 'Your rating has been submitted', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as never),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStar = (star: number) => (
    <TouchableOpacity key={star} onPress={() => setRating(star)}>
      <Text style={star <= rating ? styles.starSelected : styles.star}>
        {star <= rating ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  );

  const getRatingLabel = () => {
    if (!rating) return 'Tap to rate your ride';
    const labels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
    return labels[rating - 1];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Ride</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>🛺</Text>
          </View>
          <Text style={styles.driverName}>How was your trip?</Text>
          <Text style={styles.driverSubtitle}>Tell us about your captain</Text>
        </View>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(renderStar)}
        </View>
        <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>

        <Text style={styles.tagsLabel}>What went well?</Text>
        <View style={styles.tagsWrap}>
          {QUICK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, tags.includes(tag) && styles.tagActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.commentLabel}>Additional feedback (optional)</Text>
        <TextInput
          style={styles.commentBox}
          value={comment}
          onChangeText={setComment}
          placeholder="How was your ride?"
          placeholderTextColor={COLORS.gray}
          multiline
          maxLength={200}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleRate} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 55,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backButton: { fontSize: 24, color: COLORS.text, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  content: { flex: 1, padding: 24 },
  driverInfo: { alignItems: 'center', marginBottom: 20 },
  driverAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  driverInitial: { fontSize: 38 },
  driverName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  driverSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 6 },
  star: { fontSize: 40, color: COLORS.grayLight },
  starSelected: { fontSize: 40, color: COLORS.warning },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 20 },
  tagsLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  tagActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagText: { fontSize: 13, color: COLORS.text },
  tagTextActive: { color: COLORS.white },
  commentLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  commentBox: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});