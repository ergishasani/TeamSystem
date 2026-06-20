import { View, Text, StyleSheet } from 'react-native';
import type { BenefitRequest } from '@/types';
import { colors, fonts, radius } from '@/lib/theme';

interface Step {
  key: string;
  label: string;
  date?: string | null;
  isCompleted: boolean;
}

interface Props {
  request: BenefitRequest;
}

export function RequestStatusTimeline({ request }: Props) {
  const steps: Step[] = [
    { key: 'submitted', label: 'Submitted', date: request.submitted_at, isCompleted: true },
    { key: 'reviewing', label: 'Under Review', date: null, isCompleted: ['approved', 'rejected'].includes(request.status) },
    {
      key: 'resolved',
      label: request.status === 'rejected' ? 'Rejected' : request.status === 'cancelled' ? 'Cancelled' : 'Approved',
      date: request.approved_at || request.rejected_at,
      isCompleted: ['approved', 'rejected', 'cancelled'].includes(request.status),
    },
  ];

  const resolvedColor = request.status === 'approved' ? colors.success : request.status === 'rejected' ? colors.destructive : colors.labelTertiary;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Request Timeline</Text>
      {steps.map((step, idx) => {
        const dotColor = step.key === 'resolved' ? (step.isCompleted ? resolvedColor : colors.surface3) : (step.isCompleted ? colors.ink : colors.surface3);
        const lineColor = step.isCompleted ? colors.ink : colors.surface3;
        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.leftCol}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              {idx < steps.length - 1 && <View style={[styles.line, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepLabel, { color: step.isCompleted ? colors.ink : colors.labelTertiary }]}>{step.label}</Text>
              {step.date && <Text style={styles.stepDate}>{new Date(step.date).toLocaleString()}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20 },
  heading: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 16, marginBottom: 20 },
  step: { flexDirection: 'row', gap: 14 },
  leftCol: { alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  line: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  stepBody: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 15, fontFamily: fonts.semiBold },
  stepDate: { color: colors.labelTertiary, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 },
});
