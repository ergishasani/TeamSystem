import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Star, Bookmark, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.name}>{user?.full_name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benefits</Text>
        <MenuRow icon={<Bookmark size={18} color="#22C55E" />} label="Saved Offers" onPress={() => {}} />
        <MenuRow icon={<Star size={18} color="#22C55E" />} label="My Taste Profile" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MenuRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={16} color="#555" style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  content: { paddingBottom: 100, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', paddingTop: 60, paddingBottom: 24, alignSelf: 'flex-start', paddingHorizontal: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#111111' },
  name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  email: { color: '#A1A1AA', fontSize: 14, marginTop: 4 },
  roleBadge: { backgroundColor: '#22C55E20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  roleText: { color: '#22C55E', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  section: { width: '100%', paddingHorizontal: 20, marginTop: 32 },
  sectionTitle: { color: '#A1A1AA', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  menuRow: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuLabel: { color: '#FFFFFF', fontSize: 15, flex: 1, marginLeft: 12 },
  chevron: { marginLeft: 'auto' },
  logoutRow: { backgroundColor: '#EF444420', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
