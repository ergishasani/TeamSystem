import { View, Text, StyleSheet } from 'react-native';
import type { BenefitRequest } from '@/types';

interface Step {
  key: string;
  label: string;
  date?: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

interface Props {
  request: BenefitRequest;
}

export function RequestStatusTimeline({ request }: Props) {
  const steps: Step[] = [
    {
      key: 'submitted',
      label: 'Submitted',
      date: request.submitted_at,
      isCompleted: true,
      isActive: request.status === 'pending',
    },
    {
      key: 'reviewing',
      label: 'Under Review',
      date: null,
      isCompleted: ['approved', 'rejected'].includes(request.status),
      isActive: request.status === 'pending',
    },
    {
      key: 'resolved',
      label: request.status === 'rejected' ? 'Rejected' : request.status === 'cancelled' ? 'Cancelled' : 'Approved',
      date: request.approved_at || request.rejected_at,
      isCompleted: ['approved', 'rejected', 'cancelled'].includes(request.status),
      isActive: false,
    },
  ];

  const resolvedColor = request.status === 'approved' ? '#22C55E' : request.status === 'rejected' ? '#EF4444' : '#6B7280';

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Request Timeline</Text>
      {steps.map((step, idx) => {
        const color = step.key === 'resolved' ? resolvedColor : step.isCompleted ? '#22C55E' : '#2A2A2A';
        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.leftCol}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {idx < steps.length - 1 && <View style={[styles.line, { backgroundColor: step.isCompleted ? '#22C55E' : '#2A2A2A' }]} />}
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepLabel, { color: step.isCompleted ? '#FFFFFF' : '#555' }]}>{step.label}</Text>
              {step.date && <Text style={styles.stepDate}>{new Date(step.date).toLocaleString()}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 20 },
  heading: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginBottom: 20 },
  step: { flexDirection: 'row', gap: 14 },
  leftCol: { alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 15, fontWeight: '600' },
  stepDate: { color: '#A1A1AA', fontSize: 12, marginTop: 4 },
});
