import { CalculatorDirectory } from '@/components/shared/CalculatorDirectory';

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Calculadora Trabalhista</h1>
      <p className="mt-2 text-gray-600">
        Calcule salário, rescisão, férias, 13º, FGTS e outros valores trabalhistas de forma simples
        — gratuito e sem cadastro.
      </p>
      <CalculatorDirectory />
    </div>
  );
}
