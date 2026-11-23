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
  useWindowDimensions,
} from 'react-native';

const MapView = Platform.OS !== 'web'
  ? require('react-native-maps').default
  : null;

const Marker = Platform.OS !== 'web'
  ? require('react-native-maps').Marker
  : null;

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radii } from '../theme';
import { LEVELS, ACCESSIBILITY, EVENT_CATEGORIES } from '../data/options';
import { useApp } from '../context/AppContext';
import { Chip, Button, ConfirmModal } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';
import EventCard from '../components/events/EventCard';

// Zona (cidade / concelho) a partir de um resultado do Photon
const areaFromPhoton = (properties = {}) =>
  properties.city || properties.district || properties.county || properties.state || '';

// Descobre a zona e as coordenadas de um local com o Photon (OpenStreetMap)
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
    coordinate: {
      latitude: Number(lat),
      longitude: Number(lng),
    },
  };
}

export default function CreateEventScreen({ navigation, route }) {
  const { createEvent, updateEvent } = useApp();

  const eventToEdit = route?.params?.event;
  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Outdoors');
  const [subcategory, setSubcategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

  // Fallback para a última categoria ("Other") se a categoria já não existir
  const selectedCategory =
    EVENT_CATEGORIES.find((item) => item.name === category) ||
    EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];

  // Dropdown flutuante das subcategorias
  const { height: windowHeight } = useWindowDimensions();
  const subcategoryFieldRef = useRef(null);
  const [dropdownAnchor, setDropdownAnchor] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const openSubcategoryDropdown = () => {
    subcategoryFieldRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownAnchor({ x, y, width, height });
      setShowSubcategoryDropdown(true);
    });
  };

  const dropdownLayout = (() => {
    const { x, y, width, height } = dropdownAnchor;
    const spaceBelow = windowHeight - (y + height) - 16;
    const spaceAbove = y - 16;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(280, openUp ? spaceAbove : spaceBelow)
    );

    return openUp
      ? { left: x, width, bottom: windowHeight - y + 4, maxHeight }
      : { left: x, width, top: y + height + 4, maxHeight };
  })();

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
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => {
    if (!eventToEdit) return;

    setTitle(eventToEdit.title || '');
    setCategory(eventToEdit.category || 'Other');
    setSubcategory(eventToEdit.subcategory || '');
    setLevel(eventToEdit.level || 'Beginner');
    setDescription(eventToEdit.description || '');

    setPlace(eventToEdit.place || '');
    setCapacity(String(eventToEdit.capacity || 10));
    setAccess(eventToEdit.accessibility || []);

    setSelectedAddress(eventToEdit.address || '');
    setSelectedArea(eventToEdit.area || '');

    if (eventToEdit.lat != null && eventToEdit.lng != null) {
      const coordinate = {
        latitude: eventToEdit.lat,
        longitude: eventToEdit.lng,
      };

      setSelectedCoordinate(coordinate);
      setMapRegion({
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    const dateParts = (eventToEdit.when || '').split(', ');
    if (dateParts.length === 2) {
      const [day, month, year] = dateParts[0].split('/').map(Number);

      setDate(new Date(year, month - 1, day));
      setTime(dateParts[1]);
    }
  }, [eventToEdit]);

  const selectedSearchQuery = useRef(null);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const toggleAccess = (a) => {
    setAccess((p) =>
      p.includes(a) ? p.filter((x) => x !== a) : [...p, a]
    );
  };

  const selectedDateTime = (() => {
    if (!date || !time.trim()) return null;

    const [hours, minutes] = time.split(':').map(Number);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    return eventDate;
  })();

  const isDateTimeValid =
    selectedDateTime && selectedDateTime > new Date();

  const ready =
    title.trim() &&
    place.trim() &&
    date &&
    time.trim() &&
    isDateTimeValid &&
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

  // Publish event
  const submit = async () => {
    if (!ready || isSubmitting) return;

    try {
      setIsSubmitting(true);

      let coordinate = selectedCoordinate;
      let area = selectedArea;

      if (!area || !coordinate) {
        try {
          const found = await lookupLocation({
            coordinate,
            query: place.trim(),
          });

          if (found) {
            area = area || found.area;
            coordinate = coordinate || found.coordinate;
          }
        } catch (lookupError) {
          console.warn(
            'Could not look up the event area:',
            lookupError.message
          );
        }
      }

      const eventData = {
        title: title.trim(),
        category,
        subcategory: subcategory || null,
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
        icon: selectedCategory.icon,
      };

      if (isEditing) {
        await updateEvent(eventToEdit.id, eventData);
      } else {
        await createEvent(eventData);
      }

      setShowPreview(false);
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

      {/* CATEGORY */}
      <Text style={styles.label}>Category</Text>

      <Pressable
        style={styles.selectionInput}
        onPress={() => setShowCategoryModal(true)}
        disabled={isSubmitting}
      >
        <View style={styles.selectionValue}>
          <MaterialCommunityIcons
            name={selectedCategory.icon}
            size={22}
            color={colors.green}
          />
          <Text style={styles.selectionText}>{selectedCategory.name}</Text>
        </View>

        <Ionicons
          name="chevron-down"
          size={22}
          color={colors.muted}
        />
      </Pressable>

      {/* SUBCATEGORY */}
      {selectedCategory.subcategories.length > 0 && (
        <>
          <Text style={styles.label}>Subcategory (optional)</Text>

          <Pressable
            ref={subcategoryFieldRef}
            style={styles.selectionInput}
            onPress={openSubcategoryDropdown}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.selectionText,
                !subcategory && styles.placeholderText,
              ]}
            >
              {subcategory || 'Select a subcategory'}
            </Text>

            <Ionicons
              name={showSubcategoryDropdown ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.muted}
            />
          </Pressable>
        </>
      )}

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
        {ACCESSIBILITY.map((item) => (
          <Chip
            key={item.name}
            label={item.name}
            icon={item.icon}
            selected={access.includes(item.name)}
            onPress={() => toggleAccess(item.name)}
          />
        ))}
      </View>

      {field('Description', description, setDescription, {
        placeholder: 'Pace, what to bring, who it is for',
        multiline: true,
        style: [
          styles.input,
          {
            height: 90,
            textAlignVertical: 'top',
            borderRadius: 30,
          },
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

      {date && time.trim() && !isDateTimeValid && (
        <Text style={styles.validationError}>
          Please select a future date and time.
        </Text>
      )}

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
                onChange={handleDateChange}
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
                onChange={handleTimeChange}
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
          onChange={handleDateChange}
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
          onChange={handleTimeChange}
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

      {field('Participant capacity', capacity, setCapacity, {
        keyboardType: 'number-pad',
        placeholder: '50',
      })}

      <Button
        title={isEditing ? "Save Changes" : "Preview Event"}
        disabled={!ready || isSubmitting}
        onPress={() => setShowPreview(true)}
        style={{ marginTop: 24 }}
      />

      {/* EVENT PREVIEW */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <Pressable onPress={() => setShowPreview(false)}>
              <Ionicons
                name="arrow-back"
                size={26}
                color={colors.text}
              />
            </Pressable>

            <Text style={styles.previewTitle}>Event Preview</Text>

            <View style={{ width: 26 }} />
          </View>

          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.previewSubtitle}>
              This is how your event will appear in the feed.
            </Text>

            <EventCard
              event={{
                id: 'preview',
                title: title.trim(),
                category,
                icon: selectedCategory.icon,
                short: `${formatDate(date)}, ${time.trim()}`,
                date: `${formatDate(date)}, ${time.trim()}`,
                place: place.trim(),
                area: selectedArea || '',
                level,
                accessibilityTag: access.length
                  ? access.join(' · ')
                  : null,
              }}
              right={
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>Preview</Text>
                </View>
              }
            />

            <View style={styles.previewDetails}>
              <Text style={styles.previewSectionTitle}>Event details</Text>

              <Text style={styles.previewLabel}>Category</Text>
              <Text style={styles.previewValue}>
                {category}{subcategory ? ` · ${subcategory}` : ''}
              </Text>

              {description.trim() !== '' && (
                <>
                  <Text style={styles.previewLabel}>Description</Text>
                  <Text style={styles.previewValue}>
                    {description.trim()}
                  </Text>
                </>
              )}

              <Text style={styles.previewLabel}>Maximum participants</Text>
              <Text style={styles.previewValue}>{capacity}</Text>

              {access.length > 0 && (
                <>
                  <Text style={styles.previewLabel}>Accessibility</Text>
                  <Text style={styles.previewValue}>
                    {access.join(', ')}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.previewButtons}>
            <Button
              title="Edit"
              variant="outline"
              onPress={() => setShowPreview(false)}
              style={{ flex: 1 }}
            />

            <Button
              title={
                isSubmitting
                  ? (isEditing ? 'Saving...' : 'Publishing...')
                  : (isEditing ? 'Save Changes' : 'Publish Event')
              }
              disabled={isSubmitting}
              onPress={submit}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>

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

      {/* CATEGORY PICKER */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={styles.categoryModalOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <Pressable
            style={styles.categoryModalContent}
            onPress={() => {}}
          >
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>
                Choose a category
              </Text>

              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.categoryGrid}>
                {EVENT_CATEGORIES.map((item) => {
                  const selected = category === item.name;

                  return (
                    <Pressable
                      key={item.name}
                      style={[
                        styles.categoryOption,
                        selected && styles.categoryOptionSelected,
                      ]}
                      onPress={() => {
                        setCategory(item.name);
                        setSubcategory('');
                        setShowSubcategoryDropdown(false);
                        setShowCategoryModal(false);
                      }}
                      disabled={isSubmitting}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={30}
                        color={selected ? colors.green : colors.text}
                      />

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.categoryOptionText,
                          selected && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SUBCATEGORY DROPDOWN */}
      <Modal
        visible={showSubcategoryDropdown}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSubcategoryDropdown(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowSubcategoryDropdown(false)}
        >
          <View style={[styles.dropdownMenu, dropdownLayout]}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {selectedCategory.subcategories.map((item) => (
                <Pressable
                  key={item}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSubcategory(item);
                    setShowSubcategoryDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      subcategory === item &&
                        styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                  {subcategory === item && (
                    <Ionicons
                      name="checkmark"
                      size={19}
                      color={colors.green}
                    />
                  )}
                </Pressable>
              ))}

              {subcategory !== '' && (
                <Pressable
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSubcategory('');
                    setShowSubcategoryDropdown(false);
                  }}
                >
                  <Text style={styles.clearOptionText}>
                    Clear selection
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={done}
        title={isEditing ? 'Event updated!' : 'Event published!'}
        message={
          isEditing
            ? 'Your event changes have been saved.'
            : 'Your event is now listed under Hosting in My events.'
        }
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
  selectionInput: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  selectionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: '400',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionText: {
    color: colors.text,
    fontSize: 14,
  },
  dropdownOptionTextSelected: {
    color: colors.green,
    fontWeight: '700',
  },
  clearOptionText: {
    color: colors.muted,
    fontSize: 13,
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  categoryModalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryOption: {
    width: '31.5%',
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8F7',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  categoryOptionSelected: {
    backgroundColor: '#EAF5EF',
    borderColor: colors.green,
  },
  categoryOptionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },
  categoryOptionTextSelected: {
    color: colors.green,
  },
  validationError: {
    color: colors.orange,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 4,
  },

  // EVENT PREVIEW
  previewModalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  previewSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 16,
  },
  previewBadge: {
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  previewBadgeText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  previewDetails: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewSectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  previewValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});