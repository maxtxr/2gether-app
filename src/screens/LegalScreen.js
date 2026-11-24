import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

export default function LegalScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'gdpr'

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'terms' }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'terms' && styles.activeTabText,
            ]}
          >
            Terms of Service
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'gdpr' && styles.activeTab]}
          onPress={() => setActiveTab('gdpr')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'gdpr' }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'gdpr' && styles.activeTabText,
            ]}
          >
            Privacy & GDPR
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'terms' ? (
          <View>
            <Text style={styles.docTitle}>2Gether Terms of Service</Text>
            <Text style={styles.effectiveDate}>Last updated: November 2026</Text>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>1. About the Platform</Text>
              <Text style={styles.body}>
                2Gether is a casual, community-driven sports matching and event hosting platform developed for the Interação Pessoa-Máquina (IPM) course at NOVA School of Science and Technology (NOVA FCT). 2Gether allows users to explore, create, participate in, and review non-commercial local sports activities.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>2. Physical Activity & Assumption of Risk</Text>
              <Text style={styles.body}>
                Participation in outdoor activities, group sports, and walking/running events carries inherent physical risks. 2Gether does not provide certified medical evaluation or professional coaching. Users participate voluntarily and assume full responsibility for their personal health, equipment, and physical fitness prior to attending any event.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>3. Host Responsibilities & Accessibility Tags</Text>
              <Text style={styles.body}>
                Community hosts who publish activities with accessibility attributes (such as "wheelchair friendly", "flat terrain", "low intensity", or "no equipment needed") commit to representing venue logistics truthfully. Knowingly misleading participants regarding terrain, incline, or required athletic level violates community rules.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>4. Community Conduct & Content</Text>
              <Text style={styles.body}>
                Users agree not to harass other participants via direct messages, post offensive reviews, or upload inappropriate media. We reserve the right to delete content or remove accounts that compromise user safety or disrupt community trust.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>5. Service Availability</Text>
              <Text style={styles.body}>
                2Gether is provided on an "as-is" and "as-available" basis for academic demonstration and evaluation. We do not warrant uninterrupted operation, realtime message delivery guarantees, or automated continuous backups.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.docTitle}>Privacy Policy & GDPR Compliance</Text>
            <Text style={styles.effectiveDate}>Regulation (EU) 2016/679 · Last updated: November 2026</Text>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>1. Data Controller</Text>
              <Text style={styles.body}>
                For the purposes of the General Data Protection Regulation (GDPR), the data controller is Group 1 (Lab P1), Department of Computer Science, NOVA School of Science and Technology (NOVA FCT), Caparica, Portugal. Contact: <Text style={styles.boldText}>tir@fct.unl.pt</Text>.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>2. Personal Data We Collect</Text>
              <Text style={styles.body}>
                We collect and process the following categories of personal data:
              </Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Identity & Account Data:</Text> Name, email address, password hash, bio, and avatar image uploaded through your device.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Accessibility & Sports Preferences:</Text> Self-declared mobility tags (e.g., flat terrain preference, beginner level) and sport interests used to personalize suggested events.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Geolocation Data:</Text> Approximate event search coordinates and event meeting coordinates chosen on the map.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Social & Communication Data:</Text> Direct messages sent to organizers, past activity reviews, and accessibility accuracy feedback.</Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>3. Legal Basis for Processing (Art. 6 GDPR)</Text>
              <Text style={styles.body}>
                • <Text style={styles.boldText}>Contractual Necessity (Art. 6(1)(b)):</Text> Providing user accounts, event registrations, waitlisting, and chat functionality.{"\n"}
                • <Text style={styles.boldText}>Consent (Art. 6(1)(a)):</Text> Storing voluntary accessibility requirements, profile avatars, and review media.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>4. Storage & Third-Party Processors</Text>
              <Text style={styles.body}>
                Your data is stored securely in an EU-hosted PostgreSQL database powered by Supabase, enforcing Row Level Security (RLS) policies so that private chats and personal records are accessible only by authorized participants.
              </Text>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.heading}>5. Your Rights Under GDPR</Text>
              <Text style={styles.body}>
                Under Articles 15 to 22 of the GDPR, you have the right to:
              </Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Right of Access & Rectification:</Text> View and update your profile details directly from the Profile tab.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Right to Erasure ("Right to be Forgotten"):</Text> Permanently delete your account and profile records via the "Delete account" option in Settings.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.boldText}>Right to Withdraw Consent:</Text> Modify or clear your saved accessibility attributes at any time.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F8FAF9',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary || '#166534',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted || '#6B7280',
  },
  activeTabText: {
    color: colors.primary || '#166534',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text || '#111827',
    marginBottom: 4,
  },
  effectiveDate: {
    fontSize: 12,
    color: colors.muted || '#6B7280',
    marginBottom: 16,
  },
  sectionBlock: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text || '#111827',
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    color: colors.text || '#374151',
    lineHeight: 19,
  },
  bulletItem: {
    fontSize: 13,
    color: colors.text || '#374151',
    lineHeight: 19,
    marginTop: 6,
  },
  boldText: {
    fontWeight: '600',
  },
});