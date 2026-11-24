import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';

const FALLBACK = { lat: 38.71, lng: -9.13 };

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background-color: #f8faf9; }
    
    /* Custom Callout Popup styling matching 2Gether theme */
    .leaflet-popup-content-wrapper {
      background: #ffffff;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      border: 1px solid ${colors.border || '#e5e7eb'};
    }
    .leaflet-popup-content {
      margin: 8px 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 200px;
    }
    .popup-title {
      font-weight: 700;
      color: ${colors.text || '#111827'};
      font-size: 13px;
      line-height: 16px;
    }
    .popup-sub {
      color: ${colors.muted || '#6b7280'};
      font-size: 11px;
      margin-top: 3px;
    }
    .popup-btn {
      display: inline-block;
      margin-top: 8px;
      color: ${colors.orange || '#ea580c'};
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${FALLBACK.lat}, ${FALLBACK.lng}], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var markersLayer = L.featureGroup().addTo(map);

    function notifyRN(id) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'EVENT_PRESS', eventId: id }));
      }
    }

    function renderPins(pins) {
      markersLayer.clearLayers();
      if (!pins || pins.length === 0) {
        map.setView([${FALLBACK.lat}, ${FALLBACK.lng}], 12);
        return;
      }

      pins.forEach(function(e) {
        var marker = L.marker([e.lat, e.lng]);
        var htmlContent = 
          '<div class="popup-title">' + (e.title || '') + '</div>' +
          '<div class="popup-sub">' + (e.place || '') + ' · ' + (e.area || '') + '</div>' +
          '<div class="popup-btn" onclick="notifyRN(\\'' + e.id + '\\')">View details →</div>';

        marker.bindPopup(htmlContent);
        markersLayer.addLayer(marker);
      });

      if (pins.length > 1) {
        map.fitBounds(markersLayer.getBounds(), { padding: [50, 50], maxZoom: 15 });
      } else if (pins.length === 1) {
        map.setView([pins[0].lat, pins[0].lng], 14);
      }
    }

    // Ready signal
    window.onload = function() {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    };
  </script>
</body>
</html>
`;

export default function EventMap({ events = [], onEventPress }) {
  const webViewRef = useRef(null);
  const isMapReadyRef = useRef(false);

  const pins = events
    .filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number')
    .map((e) => ({
      id: e.id,
      title: e.title,
      place: e.place,
      area: e.area,
      lat: e.lat,
      lng: e.lng,
    }));

  const signature = pins.map((p) => p.id).join(',');

  const updateMarkers = () => {
    if (!webViewRef.current || !isMapReadyRef.current) return;
    const js = `renderPins(${JSON.stringify(pins)}); true;`;
    webViewRef.current.injectJavaScript(js);
  };

  // Re-render markers whenever the events list changes
  useEffect(() => {
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        isMapReadyRef.current = true;
        updateMarkers();
      } else if (data.type === 'EVENT_PRESS') {
        onEventPress?.(data.eventId);
      }
    } catch {
      // Ignore non-JSON messages
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        style={StyleSheet.absoluteFill}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}