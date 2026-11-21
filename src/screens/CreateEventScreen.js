
import { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';

const MapView = Platform.OS !== 'web'
  ? require('react-native-maps').default
  : null;

const Marker = Platform.OS !== 'web'
  ? require('react-native-maps').Marker
  : null;
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, radii } from '../theme';
import { CATEGORIES, LEVELS, ACCESSIBILITY } from '../data/options';
import { useApp } from '../context/AppContext';
import { Chip, Button, ConfirmModal } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';

// Zona (cidade / concelho) a partir de um resultado do Photon
const areaFromPhoton = (properties = {}) =>
  properties.city || properties.district || properties.county || properties.state || '';

// Descobre a zona e as coordenadas de um local com o Photon (OpenStreetMap):
// pelas coordenadas, se existirem, ou pelo texto escrito pelo utilizador.
async function lookupLocation({ coordinate, query }) {
  if (!coordinate && (!query || query.length < 3)) return null;

  const url = coordinate
    ? `https://photon.komoot.io/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&lang=en`
    : `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates;

  return {
    area: areaFromPhoton(feature.properties),
    coordinate: { latitude: Number(lat), longitude: Number(lng) },
  };
}

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

  // Event photo
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Map
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const [mapRegion, setMapRegion] = useState({
    latitude: 39.5,
    longitude: -8.0,
    latitudeDelta: 4.8,
    longitudeDelta: 5.5,
  });

  // Map search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const selectedSearchQuery = useRef(null);

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

  // Date picker
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

  // Time picker
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

  // Pick and compress event photo
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      setIsProcessingImage(true);

      const dimensions = [1280, 1100, 950, 800];
      const qualities = [0.8, 0.7, 0.6, 0.5];

      let compressedImage = null;

      for (const maxDimension of dimensions) {
        const actions = [];

        const longestSide = Math.max(asset.width, asset.height);

        if (longestSide > maxDimension) {
          if (asset.width >= asset.height) {
            actions.push({
              resize: { width: maxDimension },
            });
          } else {
            actions.push({
              resize: { height: maxDimension },
            });
          }
        }

        for (const quality of qualities) {
          const manipulated =
            await ImageManipulator.manipulateAsync(
              asset.uri,
              actions,
              {
                compress: quality,
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );

          const info = await FileSystem.getInfoAsync(
            manipulated.uri
          );

          if (info.exists && info.size <= 1024 * 1024) {
            compressedImage = manipulated;
            break;
          }
        }

        if (compressedImage) break;
      }

      if (!compressedImage) {
        Alert.alert(
          'Image too large',
          'Could not compress this image below 1 MB. Please choose another photo.'
        );
        return;
      }

      setSelectedImage(compressedImage);

    } catch (error) {
      console.error('Error selecting image:', error);

      Alert.alert(
        'Error',
        'Could not select or compress the image.'
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Open map
  const openMapPicker = () => {
    if (selectedCoordinate) {
      setMapRegion({
        ...selectedCoordinate,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } else {
      setMapRegion({
        latitude: 39.5,
        longitude: -8.0,
        latitudeDelta: 4.8,
        longitudeDelta: 5.5,
      });
    }

    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setShowMapPicker(true);
  };

  // Automatic location suggestions
  useEffect(() => {
    const query = searchQuery.trim();

    if (!showMapPicker || query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    // Avoid searching again immediately after selecting a result
    if (selectedSearchQuery.current === query) {
      selectedSearchQuery.current = null;
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError('');

        const url =
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Could not search for this location.');
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setSearchResults(data.features || []);

          if (!data.features || data.features.length === 0) {
            setSearchError('No locations found.');
          }
        }
      } catch (error) {
        const wasCancelled =
          controller.signal.aborted ||
          error.name === 'AbortError' ||
          error.message?.includes('canceled');

        if (!wasCancelled) {
          console.error('Location search error:', error);
          setSearchError('Could not search. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, showMapPicker]);

  // Select search result
  const selectSearchResult = (result) => {
    const properties = result.properties;
    const coordinates = result.geometry.coordinates;

    const coordinate = {
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[0]),
    };

    const locationName =
      properties.name ||
      properties.street ||
      properties.city ||
      'Selected location';

    const streetAddress = [
      properties.housenumber,
      properties.street,
    ].filter(Boolean).join(' ');

    const addressParts = [
      properties.name,
      streetAddress,
      properties.postcode,
      properties.city,
      properties.state,
      properties.country,
    ].filter(Boolean);

    const fullAddress = [...new Set(addressParts)].join(', ');

    selectedSearchQuery.current = locationName;

    setSelectedCoordinate(coordinate);
    setSelectedAddress(fullAddress || locationName);
    setSelectedArea(areaFromPhoton(properties));
    setPlace(locationName);

    setMapRegion({
      ...coordinate,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });

    setSearchQuery(locationName);
    setSearchResults([]);
    setSearchError('');
  };

  // Create event
  const submit = async () => {
    try {
      setIsSubmitting(true);

      // Garantir zona (e, se faltar, coordenadas para o mapa): quando o local
      // foi escrito à mão ou marcado no mapa, pergunta-se ao Photon.
      let coordinate = selectedCoordinate;
      let area = selectedArea;

      if (!area || !coordinate) {
        try {
          const found = await lookupLocation({ coordinate, query: place.trim() });

          if (found) {
            area = area || found.area;
            coordinate = coordinate || found.coordinate;
          }
        } catch (lookupError) {
          console.warn('Could not look up the event area:', lookupError.message);
        }
      }

      await createEvent({
        title: title.trim(),
        category,
        sport: category,
        level,
        description: description.trim(),
        when: `${formatDate(date)}, ${time.trim()}`,
        place: place.trim(),
        address: selectedAddress || place.trim(),
        area: area || null,
        lat: coordinate?.latitude ?? null,
        lng: coordinate?.longitude ?? null,
        capacity: parseInt(capacity, 10) || 10,
        accessibility: access,
        imageUri: selectedImage?.uri || null,
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

      {/* DATE AND TIME */}
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

      {/* LOCATION */}
      <Text style={styles.label}>Location</Text>

      <TextInput
        style={styles.input}
        value={place}
        onChangeText={(value) => {
          setPlace(value);
          setSelectedCoordinate(null);
          setSelectedAddress('');
          setSelectedArea('');
        }}
        placeholder="Add a place or address"
        placeholderTextColor={colors.muted}
      />

      {Platform.OS !== 'web' && (
        <Pressable
          style={styles.mapButton}
          onPress={openMapPicker}
        >
          <Text style={styles.mapButtonText}>
            {selectedCoordinate ? 'Change map location' : 'Choose on map'}
          </Text>
        </Pressable>
      )}

      {selectedCoordinate && (
        <Text style={styles.coordinateText}>
          Location selected: {selectedCoordinate.latitude.toFixed(5)}, {selectedCoordinate.longitude.toFixed(5)}
        </Text>
      )}

      {/* EVENT PHOTO */}
      <Text style={styles.label}>Event photo</Text>

      <Pressable
        style={styles.photoButton}
        onPress={pickImage}
        disabled={isProcessingImage || isSubmitting}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoButtonText}>
              {isProcessingImage ? 'Preparing photo...' : '+ Add event photo'}
            </Text>
            <Text style={styles.photoHint}>
              JPEG · Maximum 1 MB
            </Text>
          </View>
        )}
      </Pressable>

      {isProcessingImage && (
        <Text style={styles.photoHint}>
          Compressing photo...
        </Text>
      )}

      {selectedImage && (
        <Pressable
          onPress={() => setSelectedImage(null)}
          disabled={isSubmitting}
        >
          <Text style={styles.removePhotoText}>
            Remove photo
          </Text>
        </Pressable>
      )}

      {field('Participant capacity', capacity, setCapacity, {
        keyboardType: 'number-pad',
        placeholder: '50',
      })}

      <Button
        title="Create Event"
        disabled={!ready || isSubmitting || isProcessingImage}
        onPress={submit}
        style={{ marginTop: 24 }}
      />

      {/* MAP PICKER */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showMapPicker}
          animationType="slide"
          onRequestClose={() => setShowMapPicker(false)}
        >
          <View style={styles.mapModalContainer}>
            <View style={styles.mapHeader}>
              <Pressable onPress={() => setShowMapPicker(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Text style={styles.mapTitle}>Choose location</Text>

              <View style={{ width: 50 }} />
            </View>

            {/* MAP SEARCH */}
            <View style={styles.mapSearchContainer}>
              <TextInput
                style={styles.mapSearchInput}
                value={searchQuery}
                onChangeText={(value) => {
                  setSearchQuery(value);
                  setSearchError('');
                  setSearchResults([]);
                }}
                placeholder="Search for a place..."
                placeholderTextColor={colors.muted}
                returnKeyType="search"
              />

              {isSearching && (
                <Text style={styles.searchStatus}>
                  Searching...
                </Text>
              )}

              {searchError ? (
                <Text style={styles.searchError}>{searchError}</Text>
              ) : null}

              {searchResults.map((result) => {
                const properties = result.properties;

                const resultTitle =
                  properties.name ||
                  properties.street ||
                  properties.city ||
                  'Location';

                const resultAddress = [
                  properties.street,
                  properties.city,
                  properties.state,
                  properties.country,
                ].filter(Boolean).join(', ');

                return (
                  <Pressable
                    key={`${properties.osm_type}-${properties.osm_id}`}
                    style={styles.searchResult}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Text style={styles.searchResultTitle}>
                      {resultTitle}
                    </Text>

                    <Text style={styles.searchResultAddress}>
                      {resultAddress || properties.country || ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.mapInstructions}>
              Search for a place or tap the map to choose a location manually.
            </Text>

            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={(event) => {
                setSelectedCoordinate(event.nativeEvent.coordinate);
                setSelectedAddress('');
                setSelectedArea('');
              }}
            >
              {selectedCoordinate && (
                <Marker coordinate={selectedCoordinate} />
              )}
            </MapView>

            <View style={styles.mapFooter}>
              <Text style={styles.coordinateText}>
                {selectedCoordinate
                  ? `${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`
                  : 'Tap the map to select a location'}
              </Text>

              <Pressable
                style={[
                  styles.confirmMapButton,
                  !selectedCoordinate && { opacity: 0.5 },
                ]}
                disabled={!selectedCoordinate}
                onPress={() => setShowMapPicker(false)}
              >
                <Text style={styles.confirmMapButtonText}>
                  Confirm location
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <ConfirmModal
        visible={done}
        title="Event published!"
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
  mapButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  mapButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  coordinateText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  mapInstructions: {
    color: colors.muted,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmMapButton: {
    backgroundColor: colors.text,
    borderRadius: radii.pill,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmMapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  mapSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mapSearchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  searchStatus: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  searchResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  searchResultAddress: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  searchError: {
    color: '#D9534F',
    fontSize: 13,
    marginTop: 8,
  },
  photoButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  photoPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 190,
  },
  photoButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  photoHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  removePhotoText: {
    color: '#D9534F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 8,
  },
});
