# CLTudo

Seus direitos trabalhistas, na ponta do lápis.

CLTudo é um site de calculadoras trabalhistas em português (pt-BR), construído com Next.js. Cada calculadora mostra o resultado e o passo a passo da conta, com base nas regras vigentes (INSS, IRRF, salário mínimo, teto, etc.) de cada ano.

## Calculadoras disponíveis

**Salário e descontos**
- Salário líquido
- Simulador de aumento
- CLT x PJ
- INSS
- IRRF
- Salário proporcional

**Desligamento**
- Rescisão
- Aviso prévio
- FGTS
- Seguro-desemprego

**Férias, 13º e benefícios**
- Férias
- 13º salário
- Salário-maternidade

**Jornada e adicionais**
- Hora extra
- Adicional noturno
- Insalubridade
- Periculosidade
- DSR
- Banco de horas

**Para empresas**
- Custo do funcionário

A lista completa, com categorias e calculadoras relacionadas, vive em [src/registry.ts](src/registry.ts).

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) para estilo
- [Zod](https://zod.dev/) para validação dos conjuntos de regras
- [Vitest](https://vitest.dev/) + Testing Library para testes
- [lucide-react](https://lucide.dev/) para ícones

## Como rodar

Pré-requisitos: Node.js 18+.

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Roda o build de produção |
| `npm test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Roda os testes em modo watch |

## Estrutura do projeto

```
src/
├── app/                  # Rotas (App Router): uma página por calculadora, sitemap, robots, etc.
├── components/
│   ├── calculators/      # Formulário + resultado de cada calculadora
│   ├── shared/           # Peças reaproveitadas entre páginas (nav, footer, anúncios, FAQ, ...)
│   └── ui/                # Componentes de UI genéricos (inputs, select, toggle de tema, ...)
├── engine/               # Lógica de cálculo pura, independente de UI e das regras vigentes
├── rules/                # Conjuntos de regras versionados por data de vigência (INSS, IRRF, etc.)
├── hooks/                # Hooks React (cálculo ao vivo, estado persistido)
├── lib/                  # Utilitários (datas, dinheiro, formatação, compartilhamento de estado)
├── content/              # Conteúdo estático (FAQ, ofertas)
└── config/site.ts        # Identidade do site e integrações de terceiros
```

### Engine e regras

O cálculo em si (`src/engine`) é separado das regras trabalhistas vigentes (`src/rules`). Cada arquivo em `src/rules` (ex.: [src/rules/2026-01.ts](src/rules/2026-01.ts)) descreve um conjunto de regras — faixas de INSS e IRRF, salário mínimo, teto, etc. — válido a partir de uma data (`effectiveFrom`), com as fontes oficiais citadas em comentário. Quando a legislação muda, um novo conjunto é adicionado; o motor de cálculo nunca precisa ser alterado. `src/rules/index.ts` escolhe o conjunto vigente na data de referência de cada cálculo (por exemplo, a data do desligamento numa rescisão) e também sabe carregar regras remotas via `RULES_SOURCE_URL`, com fallback para o conjunto embutido no bundle caso a fonte remota falhe.

## Testes

```bash
npm test
```

Os testes cobrem o motor de cálculo (`src/engine/__tests__`), utilitários (`src/lib/__tests__`), hooks (`src/hooks/__tests__`) e componentes (`src/components/__tests__`).

## Aviso legal

As calculadoras têm caráter informativo e não substituem orientação jurídica ou contábil profissional. Veja [src/app/privacidade](src/app/privacidade) para a política de privacidade.
