import { CalculatorDirectory } from '@/components/shared/CalculatorDirectory';
import { getRulesFor } from '@/rules';

function rulesLabel(effectiveFrom: string): string {
  const [year, month] = effectiveFrom.split('-').map(Number);
  return new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function HomePage() {
  return <CalculatorDirectory rulesLabel={rulesLabel(getRulesFor(new Date()).effectiveFrom)} />;
}
