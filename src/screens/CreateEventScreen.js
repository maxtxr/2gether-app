import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  Platform,
  Modal,
} from 'react-native';

import { colors, radii } from '../theme';
import { CATEGORIES, LEVELS, ACCESSIBILITY } from '../data/options';
import { useApp } from '../context/AppContext';
import { Chip, Button, ConfirmModal } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateEventScreen({ navigation }) {
  const { createEvent } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Outdoors');
  const [level, setLevel] = useState('Beginner');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [place, setPlace] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [access, setAccess] = useState([]);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const toggleAccess = (a) => {
    setAccess((p) =>
      p.includes(a) ? p.filter((x) => x !== a) : [...p, a]
    );
  };

  const ready =
    title.trim() &&
    place.trim() &&
    date &&
    time.trim() &&
    Number.isInteger(Number(capacity)) &&
    Number(capacity) > 0;

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);

      if (Platform.OS === 'ios') {
        setTempDate(newDate);
      } else {
        setDate(newDate);
      }
    }

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const newTime = new Date(selectedTime);
      setTempTime(newTime);

      if (Platform.OS === 'android') {
        const hours = String(newTime.getHours()).padStart(2, '0');
        const minutes = String(newTime.getMinutes()).padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      }
    }

    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';

    const parsedDate = new Date(value);

    if (isNaN(parsedDate.getTime())) return '';

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const submit = async () => {
    try {
      setIsSubmitting(true);

      await createEvent({
        title: title.trim(),
        category,
        sport: category,
        level,
        description: description.trim(),
        when: `${formatDate(date)}, ${time.trim()}`,
        place: place.trim(),
        capacity: parseInt(capacity, 10) || 10,
        accessibility: access,
      });

      setDone(true);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        error.message || 'Could not create the event. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (label, value, set, props = {}) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={set}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {field('Event name', title, setTitle, {
        placeholder: 'Walk at the park',
      })}

      <Text style={styles.label}>Category</Text>
      <View style={styles.wrap}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>

      <Text style={styles.label}>Level</Text>
      <View style={styles.wrap}>
        {LEVELS.map((l) => (
          <Chip
            key={l}
            label={l}
            selected={level === l}
            onPress={() => setLevel(l)}
          />
        ))}
      </View>

      <Text style={styles.label}>Accessibility</Text>
      <View style={styles.wrap}>
        {ACCESSIBILITY.map((a) => (
          <Chip
            key={a}
            label={a}
            selected={access.includes(a)}
            onPress={() => toggleAccess(a)}
          />
        ))}
      </View>

      {field('Description', description, setDescription, {
        placeholder: 'Pace, what to bring, who it is for',
        multiline: true,
        style: [
          styles.input,
          { height: 90, textAlignVertical: 'top', borderRadius: 30 },
        ],
      })}

      {/* DATE AND TIME FIELDS */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Date</Text>

          {Platform.OS === 'web' ? (
            <input
              type="date"
              min={minDate}
              value={date ? formatDate(date).split('/').reverse().join('-') : ''}
              onChange={(event) => {
                if (event.target.value) {
                  setDate(new Date(`${event.target.value}T12:00:00`));
                }
              }}
              style={{
                padding: 12,
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                fontSize: 15,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <Pressable
              style={styles.input}
              onPress={() => {
                setTempDate(date || new Date());
                setShowDatePicker(true);
              }}
            >
              <Text style={{ color: date ? colors.text : colors.muted }}>
                {date ? formatDate(date) : 'Select date'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>Time</Text>

          {Platform.OS === 'web' ? (
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              style={{
                padding: 12,
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                fontSize: 15,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <Pressable
              style={styles.input}
              onPress={() => {
                const initialTime = new Date();

                if (time) {
                  const [hours, minutes] = time.split(':').map(Number);
                  initialTime.setHours(hours, minutes, 0, 0);
                }

                setTempTime(initialTime);
                setShowTimePicker(true);
              }}
            >
              <Text style={{ color: time ? colors.text : colors.muted }}>
                {time || 'Select time'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* IPHONE DATE PICKER */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              style={styles.datePickerContainer}
              onPress={() => {}}
            >
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onValueChange={handleDateChange}
                locale="en-GB"
                themeVariant="light"
                textColor="#222222"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* IPHONE TIME PICKER */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTimePicker(false)}
          >
            <Pressable
              style={styles.datePickerContainer}
              onPress={() => {}}
            >
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const hours = String(tempTime.getHours()).padStart(2, '0');
                    const minutes = String(tempTime.getMinutes()).padStart(2, '0');

                    setTime(`${hours}:${minutes}`);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onValueChange={handleTimeChange}
                themeVariant="light"
                textColor="#222222"
                locale="en-GB"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ANDROID DATE PICKER */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="calendar"
          minimumDate={new Date()}
          onValueChange={handleDateChange}
          onDismiss={() => setShowDatePicker(false)}
          locale="en-GB"
        />
      )}

      {/* ANDROID TIME PICKER */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="clock"
          onValueChange={handleTimeChange}
          onDismiss={() => setShowTimePicker(false)}
          is24Hour
        />
      )}

      {field('Location', place, setPlace, {
        placeholder: 'Add a place or address',
      })}

      {field('Participant capacity', capacity, setCapacity, {
        keyboardType: 'number-pad',
        placeholder: '50',
      })}

      <Button
        title="Create Event"
        disabled={!ready || isSubmitting}
        onPress={submit}
        style={{ marginTop: 24 }}
      />

      <ConfirmModal
        visible={done}
        message="Your event is now listed under Hosting in My events."
        onConfirm={() => {
          setDone(false);
          navigation.goBack();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  label: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 16,
  },
  doneText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
