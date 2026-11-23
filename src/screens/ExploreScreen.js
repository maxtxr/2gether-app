import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';

import { colors, radii } from '../theme';
import { EVENT_CATEGORIES, LEVELS, ACCESSIBILITY, SORT_OPTIONS } from '../data/options';
import { useApp, eventHasEnded } from '../context/AppContext';
import { Chip, EventCard } from '../components';
import EventMap from '../components/events/EventMap';

const toggle = (cur, v) => (cur === v ? null : v);

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getEventDate = (event) => {
  const timestamp = new Date(event.when).getTime();
  return Number.isNaN(timestamp) ? Infinity : timestamp;
};

export default function ExploreScreen({ navigation }) {
  const { events, countOf, spotsLeft } = useApp();

  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);
  const [subcategory, setSubcategory] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [level, setLevel] = useState(null);
  const [access, setAccess] = useState(null);
  const [distance, setDistance] = useState(null);
  const [date, setDate] = useState('Any date');

  const [view, setView] = useState('list');

  const [sortBy, setSortBy] = useState('nearest');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [canAskAgain, setCanAskAgain] = useState(true);

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Obter localização do utilizador
  const getUserLocation = async (requestPermission = true) => {
    setLocationLoading(true);
    setLocationStatus('loading');

    try {
      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      const { status, canAskAgain: canRequestAgain } = permission;

      setCanAskAgain(canRequestAgain);

      if (status !== 'granted') {
        setUserLocation(null);
        setLocationStatus('denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      setLocationStatus('granted');
    } catch (error) {
      console.log('Location error:', error);
      setUserLocation(null);
      setLocationStatus('unavailable');
    } finally {
      setLocationLoading(false);
    }
  };

  // Obter localização ao abrir o Explore
  useEffect(() => {
    getUserLocation();
  }, []);

  // Verificar novamente a localização quando a app regressa
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        const returningToApp =
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active';

        if (returningToApp) {
          getUserLocation(false);
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Se não houver localização, usar outra ordenação
  const fallbackSort = SORT_OPTIONS.find(
    (option) =>
      option.value !== 'nearest' &&
      option.value !== 'participants'
  ) || SORT_OPTIONS.find(
    (option) => option.value !== 'nearest'
  );

  useEffect(() => {
    if (
      locationStatus !== 'loading' &&
      locationStatus !== 'granted' &&
      sortBy === 'nearest' &&
      fallbackSort
    ) {
      setSortBy(fallbackSort.value);
    }
  }, [locationStatus]);

  const handleLocationAccess = async () => {
    if (!canAskAgain) {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log('Could not open settings:', error);
      }

      return;
    }

    await getUserLocation();
  };

  const selectCategory = (category) => {
    setCat(category);
    setSubcategory(null);
  };

  // Filtrar eventos
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    const endOfWeekend = new Date(today);
    endOfWeekend.setDate(today.getDate() + (6 - today.getDay()));
    endOfWeekend.setHours(23, 59, 59, 999);

    return events.filter((e) => {
      if (eventHasEnded(e)) return false;

      if (showOnlyAvailable && spotsLeft(e) <= 0) return false;

      if (cat && e.category !== cat) return false;

      if (subcategory && e.subcategory !== subcategory) {
        return false;
      }

      if (level && e.level !== level && e.level !== 'All levels') {
        return false;
      }

      if (access && !(e.accessibility || []).includes(access)) {
        return false;
      }

      if (
        term &&
        !`${e.title || ''} ${e.area || ''} ${e.place || ''} ${e.sport || ''} ${e.subcategory || ''}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      // Filtro de data
      if (date !== 'Any date') {
        const eventDate = new Date(e.when);

        if (Number.isNaN(eventDate.getTime())) return false;

        if (
          date === 'Today' &&
          eventDate.toDateString() !== today.toDateString()
        ) {
          return false;
        }

        if (
          date === 'Tomorrow' &&
          eventDate.toDateString() !== tomorrow.toDateString()
        ) {
          return false;
        }

        if (
          date === 'This week' &&
          (eventDate < today || eventDate > endOfWeek)
        ) {
          return false;
        }

        if (date === 'This weekend') {
          if (
            eventDate < today ||
            eventDate > endOfWeekend ||
            today.getDay() === 0
          ) {
            return false;
          }
        }
      }

      // Filtro de distância
      if (distance !== null && userLocation) {
        if (e.lat == null || e.lng == null) {
          return false;
        }

        const km = getDistance(
          userLocation.lat,
          userLocation.lng,
          Number(e.lat),
          Number(e.lng)
        );

        if (km > distance) return false;
      }

      return true;
    });
  }, [
    events,
    q,
    cat,
    subcategory,
    level,
    access,
    distance,
    date,
    userLocation,
    showOnlyAvailable,
    spotsLeft,
  ]);

  // Ordenar eventos
  const sortedList = useMemo(() => {
    const sorted = [...list];

    if (sortBy === 'nearest' && userLocation) {
      sorted.sort((a, b) => {
        const distanceA =
          a.lat != null && a.lng != null
            ? getDistance(
                userLocation.lat,
                userLocation.lng,
                Number(a.lat),
                Number(a.lng)
              )
            : Infinity;

        const distanceB =
          b.lat != null && b.lng != null
            ? getDistance(
                userLocation.lat,
                userLocation.lng,
                Number(b.lat),
                Number(b.lng)
              )
            : Infinity;

        return distanceA - distanceB;
      });
    } else if (sortBy === 'participants') {
      sorted.sort(
        (a, b) => countOf(b) - countOf(a)
      );
    } else {
      sorted.sort((a, b) => getEventDate(a) - getEventDate(b));
    }

    return sorted;
  }, [list, sortBy, userLocation, countOf]);

  const activeFilters =
    (cat ? 1 : 0) +
    (subcategory ? 1 : 0) +
    (level ? 1 : 0) +
    (access ? 1 : 0) +
    (distance !== null ? 1 : 0) +
    (date !== 'Any date' ? 1 : 0) +
    (showOnlyAvailable ? 1 : 0);

  // Limpar filtros e pesquisa
  const clearFilters = () => {
    setQ('');
    setCat(null);
    setSubcategory(null);
    setLevel(null);
    setAccess(null);
    setDistance(null);
    setDate('Any date');
    setShowOnlyAvailable(false);
  };

  const hasActiveSearchOrFilters =
    activeFilters > 0 || q.trim().length > 0;

  const selectedSort = SORT_OPTIONS.find(
    (option) => option.value === sortBy
  );

  // Mensagem apresentada quando não existem resultados
  const emptyState = (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="search-outline"
        size={32}
        color={colors.muted}
      />

      <Text style={styles.emptyTitle}>No events found</Text>

      <Text style={styles.empty}>
        Try changing your filters or searching for something else.
      </Text>

      {hasActiveSearchOrFilters && (
        <Pressable
          onPress={clearFilters}
          style={styles.clearFiltersButton}
        >
          <Text style={styles.clearFiltersButtonText}>
            Clear filters
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search + Filters */}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons
            name="search"
            size={18}
            color={colors.muted}
          />

          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search events or places"
            placeholderTextColor={colors.muted}
          />
        </View>

        <Pressable
          style={[
            styles.filterButton,
            showFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={21}
            color={showFilters ? '#fff' : colors.text}
          />

          {activeFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFilters}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.panel}>
          <View style={styles.filterHeader}>
            <Text style={styles.panelTitle}>Filters</Text>

            <Pressable onPress={clearFilters}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          </View>

          {/* Category */}
          <Text style={styles.panelLabel}>Category</Text>

          <View style={styles.categoryGrid}>
            <Pressable
              onPress={() => selectCategory(null)}
              style={[
                styles.categoryOption,
                !cat && styles.categorySelected,
              ]}
            >
              <Ionicons
                name="apps-outline"
                size={18}
                color={!cat ? '#fff' : colors.text}
              />

              <Text
                style={[
                  styles.categoryText,
                  !cat && styles.categoryTextSelected,
                ]}
              >
                All
              </Text>
            </Pressable>

            {EVENT_CATEGORIES.map((item) => {
              const selected = cat === item.name;

              return (
                <Pressable
                  key={item.name}
                  onPress={() =>
                    selectCategory(selected ? null : item.name)
                  }
                  style={[
                    styles.categoryOption,
                    selected && styles.categorySelected,
                  ]}
                >
                  <Ionicons
                    name={item.icon || 'apps-outline'}
                    size={18}
                    color={selected ? '#fff' : colors.text}
                  />

                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Subcategory */}
          {cat &&
            EVENT_CATEGORIES.find((c) => c.name === cat)
              ?.subcategories.length > 0 && (
              <>
                <Text style={styles.panelLabel}>Subcategory</Text>

                <View style={styles.chips}>
                  <Chip
                    label="All"
                    selected={!subcategory}
                    onPress={() => setSubcategory(null)}
                    style={styles.subcategoryChip}
                  />

                  {EVENT_CATEGORIES.find(
                    (c) => c.name === cat
                  ).subcategories.map((sub) => (
                    <Chip
                      key={sub}
                      label={sub}
                      selected={subcategory === sub}
                      onPress={() =>
                        setSubcategory(toggle(subcategory, sub))
                      }
                      style={styles.subcategoryChip}
                    />
                  ))}
                </View>
              </>
            )}

          {/* Distance */}
          <View style={styles.distanceHeader}>
            <Text style={styles.panelLabel}>Distance</Text>

            <Text
              style={[
                styles.distanceValue,
                !userLocation && styles.disabledText,
              ]}
            >
              {!userLocation
                ? 'Unavailable'
                : distance === null
                  ? 'Any distance'
                  : `${distance} km`}
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distance ?? 50}
            onValueChange={(value) => setDistance(Math.round(value))}
            minimumTrackTintColor={
              userLocation ? colors.green : colors.border
            }
            maximumTrackTintColor={colors.border}
            thumbTintColor={
              userLocation ? colors.green : colors.muted
            }
            disabled={!userLocation}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 km</Text>

            <Pressable
              onPress={() => setDistance(null)}
              disabled={!userLocation}
            >
              <Text
                style={[
                  styles.anyDistanceText,
                  !userLocation && styles.disabledText,
                ]}
              >
                Any distance
              </Text>
            </Pressable>

            <Text style={styles.sliderLabel}>100 km</Text>
          </View>

          {!userLocation && (
            <View style={styles.locationNotice}>
              <Ionicons
                name="location-outline"
                size={19}
                color={colors.muted}
              />

              <View style={styles.locationNoticeContent}>
                <Text style={styles.locationHint}>
                  {locationLoading
                    ? 'Getting your location...'
                    : 'Location is needed to filter events by distance and sort by nearest.'}
                </Text>

                {!locationLoading && (
                  <Pressable
                    onPress={handleLocationAccess}
                    style={styles.locationAction}
                  >
                    <Text style={styles.locationActionText}>
                      {locationStatus === 'denied' && !canAskAgain
                        ? 'Open settings'
                        : 'Try again'}
                    </Text>

                    <Ionicons
                      name={
                        locationStatus === 'denied' && !canAskAgain
                          ? 'settings-outline'
                          : 'refresh-outline'
                      }
                      size={15}
                      color={colors.green}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Date */}
          <Text style={styles.panelLabel}>Date</Text>

          <View style={styles.chips}>
            {[
              'Any date',
              'Today',
              'Tomorrow',
              'This week',
              'This weekend',
            ].map((d) => (
              <Chip
                key={d}
                label={d}
                selected={date === d}
                onPress={() => setDate(d)}
              />
            ))}
          </View>

          {/* Level */}
          <Text style={styles.panelLabel}>Level</Text>

          <View style={styles.chips}>
            {LEVELS.filter((l) => l !== 'All levels').map((l) => (
              <Chip
                key={l}
                label={l}
                selected={level === l}
                onPress={() => setLevel(toggle(level, l))}
              />
            ))}
          </View>

          {/* Accessibility */}
          <Text style={styles.panelLabel}>Accessibility</Text>

          <View style={styles.chips}>
            {ACCESSIBILITY.map((item) => (
              <Chip
                key={item.name}
                label={item.name}
                icon={item.icon}
                selected={access === item.name}
                onPress={() => setAccess(toggle(access, item.name))}
              />
            ))}
          </View>

          {/* Available spots */}
          <Pressable
            style={styles.availableFilter}
            onPress={() => setShowOnlyAvailable(!showOnlyAvailable)}
          >
            <View style={styles.availableFilterText}>
              <Ionicons
                name="people-outline"
                size={18}
                color={colors.text}
              />

              <Text style={styles.availableFilterLabel}>
                Only events with available spots
              </Text>
            </View>

            <Ionicons
              name={showOnlyAvailable ? 'checkbox' : 'square-outline'}
              size={21}
              color={showOnlyAvailable ? colors.green : colors.muted}
            />
          </Pressable>
        </View>
      )}

      {/* List / Map selector */}
      <View style={styles.segment}>
        {[
          ['list', 'List'],
          ['map', 'Map'],
        ].map(([v, label]) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[
              styles.segBtn,
              view === v && styles.segOn,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.segText,
                view === v && styles.segTextOn,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Events near you</Text>

        <View style={styles.sortContainer}>
          <Pressable
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <MaterialCommunityIcons
              name={selectedSort?.icon || 'filter-outline'}
              size={16}
              color={colors.text}
            />

            <Text style={styles.sortButtonText}>
              {selectedSort?.label}
            </Text>

            <Ionicons
              name={showSortOptions ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.text}
            />
          </Pressable>

          {/* Sort options */}
          {showSortOptions && (
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => {
                const selected = sortBy === option.value;
                const disabled =
                  option.value === 'nearest' && !userLocation;

                return (
                  <Pressable
                    key={option.value}
                    disabled={disabled}
                    style={[
                      styles.sortOption,
                      selected && styles.sortOptionSelected,
                      disabled && styles.sortOptionDisabled,
                    ]}
                    onPress={() => {
                      setSortBy(option.value);
                      setShowSortOptions(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={17}
                      color={
                        disabled
                          ? colors.muted
                          : selected
                            ? colors.green
                            : colors.text
                      }
                    />

                    <Text
                      style={[
                        styles.sortOptionText,
                        selected && styles.sortOptionTextSelected,
                        disabled && styles.disabledText,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={colors.green}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.count}>
          {sortedList.length} {sortedList.length === 1 ? 'event' : 'events'}
        </Text>
      </View>

      {/* Results content */}
      {view === 'map' ? (
        <View style={styles.mapWrap}>
          <EventMap
            events={sortedList}
            onEventPress={(id) =>
              navigation.navigate('EventDetail', { id })
            }
          />
        </View>
      ) : (
        <>
          {sortedList.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onPress={() =>
                navigation.navigate('EventDetail', { id: e.id })
              }
            />
          ))}

          {sortedList.length === 0 && emptyState}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },

  search: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 15,
    color: colors.text,
  },

  filterButton: {
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: 23,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },

  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  panel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  clearText: {
    color: colors.orange,
    fontWeight: '700',
    fontSize: 13,
  },

  panelLabel: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 9,
    fontSize: 14,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },

  categoryOption: {
    width: '23%',
    minHeight: 66,
    backgroundColor: colors.chip,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  categorySelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 5,
    textAlign: 'center',
  },

  categoryTextSelected: {
    color: '#fff',
  },

  subcategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
    marginRight: 5,
    marginBottom: 5,
  },

  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  distanceValue: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 14,
  },

  slider: {
    width: '100%',
    height: 38,
  },

  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sliderLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },

  anyDistanceText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
  },

  disabledText: {
    color: colors.muted,
    opacity: 0.6,
  },

  locationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 12,
    padding: 11,
    backgroundColor: colors.chip,
    borderRadius: 10,
  },

  locationNoticeContent: {
    flex: 1,
  },

  locationHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 7,
  },

  locationActionText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },

  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },

  resultsInfo: {
    marginBottom: 10,
  },

  count: {
    color: colors.muted,
    fontSize: 13,
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },

  sortButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  sortOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 5,
    marginBottom: 12,
    position: 'absolute',
    top: '100%',
    right: 0,
    width: 180,
    zIndex: 20,
    elevation: 5,
  },

  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 10,
  },

  sortOptionDisabled: {
    opacity: 0.5,
  },

  sortOptionSelected: {
    backgroundColor: colors.chip,
  },

  sortOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },

  sortOptionTextSelected: {
    color: colors.green,
    fontWeight: '700',
  },

  availableFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 16,
    backgroundColor: colors.chip,
    borderRadius: 10,
  },

  availableFilterText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  availableFilterLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
  },

  clearFiltersButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
  },

  clearFiltersButtonText: {
    color: colors.orange,
    fontWeight: '700',
    fontSize: 13,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 4,
  },

  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radii.pill,
  },

  segOn: {
    backgroundColor: colors.green,
  },

  segText: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 13,
  },

  segTextOn: {
    color: '#fff',
  },

  mapWrap: {
    height: 460,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chip,
    marginBottom: 12,
  },
  
  sortContainer: {
    position: 'relative',
    zIndex: 10,
  },
});