import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radii } from '../theme';
import { LEVELS, ACCESSIBILITY, EVENT_CATEGORIES } from '../data/options';
import { useApp } from '../context/AppContext';
import { Chip, Button, ConfirmModal } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';
import EventCard from '../components/events/EventCard';

// Clean OpenStreetMap Nominatim Geocoder
async function lookupLocation({ coordinate, query }) {
  try {
    let url = '';
    if (coordinate) {
      url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinate.latitude}&lon=${coordinate.longitude}&addressdetails=1&zoom=18`;
    } else if (query && query.trim().length >= 3) {
      url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query.trim()
      )}&limit=5&addressdetails=1`;
    } else {
      return null;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': '2Gether-App/1.0 (NOVA-FCT-IPM)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();

    // 1. Reverse lookup from Map Tap
    if (coordinate) {
      if (!data || data.error) return null;
      const addr = data.address || {};
      const place =
        data.name ||
        addr.leisure ||
        addr.amenity ||
        addr.road ||
        addr.suburb ||
        addr.city ||
        'Selected Point';
      const area = addr.city || addr.town || addr.municipality || addr.county || '';
      const street = [addr.road, addr.house_number].filter(Boolean).join(' ');
      const address = [street, area].filter(Boolean).join(', ') || data.display_name;

      return { place, area, address, coordinate };
    }

    // 2. Search Autocomplete List
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => {
        const addr = item.address || {};
        const place =
          item.name ||
          addr.leisure ||
          addr.amenity ||
          addr.road ||
          addr.city ||
          'Location';
        const area = addr.city || addr.town || addr.municipality || addr.county || '';
        const street = [addr.road, addr.house_number].filter(Boolean).join(' ');
        const address = [street, area].filter(Boolean).join(', ') || item.display_name;

        return {
          title: place,
          area,
          address,
          coordinate: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
        };
      });
    }

    return null;
  } catch (err) {
    console.warn('Geocoding error:', err);
    return null;
  }
}

const LEAFLET_PICKER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background-color: #f8faf9; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([38.72, -9.14], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker = null;

    function setPin(lat, lng, zoom) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
      map.setView([lat, lng], zoom || 15);
    }

    map.on('click', function(e) {
      setPin(e.latlng.lat, e.latlng.lng, map.getZoom());
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICK',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      }
    });

    window.onload = function() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    };
  </script>
</body>
</html>
`;

export default function CreateEventScreen({ navigation, route }) {
  const { createEvent, updateEvent, showFeedback } = useApp();

  const eventToEdit = route?.params?.event;
  const isEditing = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Outdoors');
  const [subcategory, setSubcategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

  const selectedCategory =
    EVENT_CATEGORIES.find((item) => item.name === category) ||
    EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];

  const { height: windowHeight } = useWindowDimensions();
  const subcategoryFieldRef = useRef(null);
  const [dropdownAnchor, setDropdownAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
    const maxHeight = Math.max(120, Math.min(280, openUp ? spaceAbove : spaceBelow));

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

  // Location states
  const [place, setPlace] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);

  const [capacity, setCapacity] = useState('10');
  const [access, setAccess] = useState([]);

  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Map Picker Modal States
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempCoordinate, setTempCoordinate] = useState(null);
  const [tempPlace, setTempPlace] = useState('');
  const [tempArea, setTempArea] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Search autocomplete in modal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const webViewRef = useRef(null);
  const isMapReadyRef = useRef(false);

  useEffect(() => {
    if (!eventToEdit) return;

    setTitle(eventToEdit.title || '');
    setCategory(eventToEdit.category || 'Other');
    setSubcategory(eventToEdit.subcategory || '');
    setLevel(eventToEdit.level || 'Beginner');
    setDescription(eventToEdit.description || '');

    setPlace(eventToEdit.place || '');
    setSelectedAddress(eventToEdit.address || '');
    setSelectedArea(eventToEdit.area || '');

    if (eventToEdit.lat != null && eventToEdit.lng != null) {
      setSelectedCoordinate({
        latitude: eventToEdit.lat,
        longitude: eventToEdit.lng,
      });
    }

    setCapacity(String(eventToEdit.capacity || 10));
    setAccess(eventToEdit.accessibility || []);

    const dateParts = (eventToEdit.when || '').split(', ');
    if (dateParts.length === 2) {
      const [day, month, year] = dateParts[0].split('/').map(Number);
      setDate(new Date(year, month - 1, day));
      setTime(dateParts[1]);
    }
  }, [eventToEdit]);

  const toggleAccess = (a) => {
    setAccess((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
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

  const isDateTimeValid = selectedDateTime && selectedDateTime > new Date();

  const ready =
    title.trim() &&
    place.trim() &&
    date &&
    time.trim() &&
    isDateTimeValid &&
    Number.isInteger(Number(capacity)) &&
    Number(capacity) > 0;

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (Platform.OS === 'ios') setTempDate(newDate);
      else setDate(newDate);
    }
    if (Platform.OS === 'android') setShowDatePicker(false);
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
    if (Platform.OS === 'android') setShowTimePicker(false);
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

  // Open modal
  const openMapPicker = () => {
    setTempCoordinate(selectedCoordinate);
    setTempPlace(place);
    setTempArea(selectedArea);
    setTempAddress(selectedAddress);
    setSearchQuery('');
    setSearchResults([]);
    setShowMapPicker(true);
  };

  const syncLeafletPin = (lat, lng, zoom = 15) => {
    if (webViewRef.current && isMapReadyRef.current) {
      webViewRef.current.injectJavaScript(`setPin(${lat}, ${lng}, ${zoom}); true;`);
    }
  };

  // Search debounce effect
  useEffect(() => {
    const q = searchQuery.trim();
    if (!showMapPicker || q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await lookupLocation({ query: q });
      if (!controller.signal.aborted) {
        setSearchResults(results || []);
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, showMapPicker]);

  const selectSearchResult = (item) => {
    setTempCoordinate(item.coordinate);
    setTempPlace(item.title);
    setTempArea(item.area);
    setTempAddress(item.address);
    syncLeafletPin(item.coordinate.latitude, item.coordinate.longitude, 16);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLeafletMessage = async (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        isMapReadyRef.current = true;
        if (tempCoordinate) {
          syncLeafletPin(tempCoordinate.latitude, tempCoordinate.longitude);
        }
      } else if (data.type === 'MAP_CLICK') {
        const coord = { latitude: data.latitude, longitude: data.longitude };
        setTempCoordinate(coord);
        setIsResolvingLocation(true);

        const found = await lookupLocation({ coordinate: coord });
        if (found) {
          setTempPlace(found.place);
          setTempAddress(found.address);
          setTempArea(found.area);
        } else {
          setTempPlace('Selected Point');
          setTempAddress('');
          setTempArea('');
        }
        setIsResolvingLocation(false);
      }
    } catch {
      setIsResolvingLocation(false);
    }
  };

  const confirmMapSelection = () => {
    if (!tempCoordinate) return;
    setSelectedCoordinate(tempCoordinate);
    setPlace(tempPlace || 'Selected Location');
    setSelectedArea(tempArea);
    setSelectedAddress(tempAddress);
    setShowMapPicker(false);
  };

  const submit = async () => {
    if (!ready || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const eventData = {
        title: title.trim(),
        category,
        subcategory: subcategory || null,
        sport: subcategory || category,
        level,
        description: description.trim(),
        when: `${formatDate(date)}, ${time.trim()}`,
        place: place.trim(),
        address: selectedAddress || place.trim(),
        area: selectedArea || null,
        lat: selectedCoordinate?.latitude ?? null,
        lng: selectedCoordinate?.longitude ?? null,
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
      showFeedback({
        title: isEditing ? 'Could not save event' : 'Could not publish event',
        message: error.message || 'Please try again.',
        variant: 'danger',
      });
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
      {field('Event name', title, setTitle, { placeholder: 'e.g. Morning Stretch & Walk' })}

      {/* CATEGORY */}
      <Text style={styles.label}>Category</Text>
      <Pressable
        style={styles.selectionInput}
        onPress={() => setShowCategoryModal(true)}
        disabled={isSubmitting}
      >
        <View style={styles.selectionValue}>
          <MaterialCommunityIcons name={selectedCategory.icon} size={22} color={colors.green} />
          <Text style={styles.selectionText}>{selectedCategory.name}</Text>
        </View>
        <Ionicons name="chevron-down" size={22} color={colors.muted} />
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
            <Text style={[styles.selectionText, !subcategory && styles.placeholderText]}>
              {subcategory || 'Select a subcategory'}
            </Text>
            <Ionicons name={showSubcategoryDropdown ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} />
          </Pressable>
        </>
      )}

      <Text style={styles.label}>Level</Text>
      <View style={styles.wrap}>
        {LEVELS.map((l) => (
          <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
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
        placeholder: 'Pace, meeting spot specifics, what to bring...',
        multiline: true,
        style: [styles.input, { height: 90, textAlignVertical: 'top', borderRadius: 20 }],
      })}

      {/* DATE AND TIME */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Date</Text>
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
        </View>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>Time</Text>
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
        </View>
      </View>

      {!!(date && time.trim() && !isDateTimeValid) && (
        <Text style={styles.validationError}>Please select a future date and time.</Text>
      )}

      {/* LOCATION: DIRECT TAP TO OPEN MAP */}
      <Text style={styles.label}>Meeting Location</Text>
      <Pressable
        style={[styles.locationCard, place && styles.locationCardFilled]}
        onPress={openMapPicker}
        accessibilityRole="button"
      >
        <View style={[styles.locationIconBg, place && { backgroundColor: '#E8F2EC' }]}>
          <Ionicons
            name="location"
            size={22}
            color={place ? colors.green : colors.muted}
          />
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.locationMainText, !place && styles.placeholderText]} numberOfLines={1}>
            {place || 'Choose meeting spot on OpenStreetMap'}
          </Text>
          {!!(selectedArea || selectedAddress) && (
            <Text style={styles.locationSubText} numberOfLines={1}>
              {selectedArea ? `${selectedArea} · ` : ''}{selectedAddress}
            </Text>
          )}
        </View>
        <View style={styles.pickButton}>
          <Text style={styles.pickButtonText}>{place ? 'Change' : 'Pick on Map'}</Text>
        </View>
      </Pressable>

      {field('Participant capacity', capacity, setCapacity, {
        keyboardType: 'number-pad',
        placeholder: '50',
      })}

      <Button
        title={isEditing ? 'Save Changes' : 'Preview Event'}
        disabled={!ready || isSubmitting}
        onPress={() => setShowPreview(true)}
        style={{ marginTop: 24 }}
      />

      {/* EVENT PREVIEW MODAL */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <Pressable onPress={() => setShowPreview(false)}>
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </Pressable>
            <Text style={styles.previewTitle}>Event Preview</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.previewSubtitle}>This is how your event will appear in the feed.</Text>

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
                accessibilityTag: access.length ? access.join(' · ') : null,
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
              <Text style={styles.previewValue}>{category}{subcategory ? ` · ${subcategory}` : ''}</Text>

              {description.trim() !== '' && (
                <>
                  <Text style={styles.previewLabel}>Description</Text>
                  <Text style={styles.previewValue}>{description.trim()}</Text>
                </>
              )}

              <Text style={styles.previewLabel}>Maximum participants</Text>
              <Text style={styles.previewValue}>{capacity}</Text>

              {access.length > 0 && (
                <>
                  <Text style={styles.previewLabel}>Accessibility</Text>
                  <Text style={styles.previewValue}>{access.join(', ')}</Text>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.previewButtons}>
            <Button title="Edit" variant="outline" onPress={() => setShowPreview(false)} style={{ flex: 1 }} />
            <Button
              title={isSubmitting ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish Event')}
              disabled={isSubmitting}
              onPress={submit}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>

      {/* MAP MODAL (OPENSTREETMAP + LEAFLET) */}
      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Pressable onPress={() => setShowMapPicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.mapTitle}>Choose location</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Autocomplete Search input */}
          <View style={styles.mapSearchContainer}>
            <View style={styles.searchBarRow}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                style={styles.mapSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search place or address (e.g. Parque da Paz)"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.green} />
              ) : !!searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.resultsDropdown}>
                {searchResults.map((item, idx) => (
                  <Pressable
                    key={`${item.coordinate.latitude}-${idx}`}
                    style={styles.searchResultItem}
                    onPress={() => selectSearchResult(item)}
                  >
                    <Ionicons name="location-outline" size={16} color={colors.green} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSub} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.mapHint}>Tap on the map or select a search result to drop a pin.</Text>

          {/* Map view */}
          <View style={styles.mapWrapper}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: LEAFLET_PICKER_HTML }}
              style={StyleSheet.absoluteFill}
              onMessage={handleLeafletMessage}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>

          {/* Footer Bar */}
          <View style={styles.mapFooter}>
            <View style={styles.selectedLocCard}>
              <Ionicons name="pin" size={20} color={colors.green} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.selectedLocTitle} numberOfLines={1}>
                  {isResolvingLocation
                    ? 'Identifying location…'
                    : tempPlace || 'No location selected'}
                </Text>
                {!!(tempArea || tempAddress) && (
                  <Text style={styles.selectedLocSub} numberOfLines={1}>
                    {tempArea ? `${tempArea} · ` : ''}{tempAddress}
                  </Text>
                )}
              </View>
              {isResolvingLocation && <ActivityIndicator size="small" color={colors.green} />}
            </View>

            <Pressable
              style={[
                styles.confirmMapButton,
                (!tempCoordinate || isResolvingLocation) && { opacity: 0.5 },
              ]}
              disabled={!tempCoordinate || isResolvingLocation}
              onPress={confirmMapSelection}
            >
              <Text style={styles.confirmMapButtonText}>Use this location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CATEGORY PICKER MODAL */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <Pressable style={styles.categoryModalOverlay} onPress={() => setShowCategoryModal(false)}>
          <Pressable style={styles.categoryModalContent} onPress={() => {}}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Choose a category</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.categoryGrid}>
                {EVENT_CATEGORIES.map((item) => {
                  const selected = category === item.name;
                  return (
                    <Pressable
                      key={item.name}
                      style={[styles.categoryOption, selected && styles.categoryOptionSelected]}
                      onPress={() => {
                        setCategory(item.name);
                        setSubcategory('');
                        setShowSubcategoryDropdown(false);
                        setShowCategoryModal(false);
                      }}
                      disabled={isSubmitting}
                    >
                      <MaterialCommunityIcons name={item.icon} size={30} color={selected ? colors.green : colors.text} />
                      <Text numberOfLines={2} style={[styles.categoryOptionText, selected && styles.categoryOptionTextSelected]}>
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
      <Modal visible={showSubcategoryDropdown} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowSubcategoryDropdown(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSubcategoryDropdown(false)}>
          <View style={[styles.dropdownMenu, dropdownLayout]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              {selectedCategory.subcategories.map((item) => (
                <Pressable
                  key={item}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSubcategory(item);
                    setShowSubcategoryDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, subcategory === item && styles.dropdownOptionTextSelected]}>
                    {item}
                  </Text>
                  {subcategory === item && <Ionicons name="checkmark" size={19} color={colors.green} />}
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
                  <Text style={styles.clearOptionText}>Clear selection</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* IOS / ANDROID PICKERS */}
      {Platform.OS === 'ios' && (
        <>
          <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Pressable onPress={() => setShowDatePicker(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  <Pressable onPress={() => { setDate(tempDate); setShowDatePicker(false); }}><Text style={styles.doneText}>Done</Text></Pressable>
                </View>
                <DateTimePicker value={tempDate} mode="date" display="spinner" minimumDate={new Date()} onChange={handleDateChange} locale="en-GB" />
              </View>
            </Pressable>
          </Modal>

          <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Pressable onPress={() => setShowTimePicker(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  <Pressable onPress={() => {
                    const hours = String(tempTime.getHours()).padStart(2, '0');
                    const minutes = String(tempTime.getMinutes()).padStart(2, '0');
                    setTime(`${hours}:${minutes}`);
                    setShowTimePicker(false);
                  }}><Text style={styles.doneText}>Done</Text></Pressable>
                </View>
                <DateTimePicker value={tempTime} mode="time" display="spinner" onChange={handleTimeChange} locale="en-GB" />
              </View>
            </Pressable>
          </Modal>
        </>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker value={date || new Date()} mode="date" display="calendar" minimumDate={new Date()} onChange={handleDateChange} onDismiss={() => setShowDatePicker(false)} locale="en-GB" />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker value={tempTime} mode="time" display="clock" onChange={handleTimeChange} onDismiss={() => setShowTimePicker(false)} is24Hour />
      )}

      <ConfirmModal
        visible={done}
        title={isEditing ? 'Event updated!' : 'Event published!'}
        message={isEditing ? 'Your event changes have been saved.' : 'Your event is now listed under Hosting in My events.'}
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
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCardFilled: {
    borderColor: colors.green,
    backgroundColor: '#FBFDFB',
  },
  locationIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  locationSubText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: '400',
  },
  pickButton: {
    backgroundColor: colors.chip || '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  pickButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
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
  mapSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    height: 42,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
    paddingVertical: 0,
  },
  resultsDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    maxHeight: 180,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  resultSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  mapHint: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  mapFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  selectedLocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  selectedLocTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  selectedLocSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  confirmMapButton: {
    backgroundColor: colors.green,
    borderRadius: radii.pill,
    padding: 14,
    alignItems: 'center',
  },
  confirmMapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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