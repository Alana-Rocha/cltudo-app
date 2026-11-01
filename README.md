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

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) para estilo
- [Zod](https://zod.dev/) para validação dos conjuntos de regras
- [Vitest](https://vitest.dev/) + Testing Library para testes
- [lucide-react](https://lucide.dev/) para ícones

## Como rodar

Pré-requisitos: Node.js 22.12+.

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
| `npm run test:e2e` | Roda os testes E2E (Playwright) contra o build de produção |
| `npm run test:e2e:ui` | Abre o modo interativo do Playwright |
| `npm run fixtures:trct` | Regera os TRCTs sintéticos em PDF usados nos testes (`test-fixtures/trct`) |

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

### Testes E2E

```bash
npx playwright install chromium   # só na primeira vez
npm run test:e2e
```

Os testes em [e2e/](e2e) sobem o build de produção na porta 3100 e usam o site como uma pessoa usaria, no desktop e no celular:

- `e2e/calculations/`: cada calculadora com valores esperados **calculados à mão** a partir da tabela de regras (a conta está no comentário de cada teste), sem usar o motor do app como gabarito.
- Navegação, busca, banner de cookies, tema, link compartilhado, impressão, validação dos formulários, headers de segurança e layout sem rolagem horizontal.
- Todo teste falha se a página tiver erro de JavaScript ou de console (inclusive de hidratação).

O relógio fica congelado em 15/06/2026 ([e2e/fixtures.ts](e2e/fixtures.ts)), então os valores não mudam quando um novo conjunto de regras entrar em vigor. Ao adicionar regras de um novo ano, crie novos cenários com a data correspondente em vez de alterar os existentes.

## Aviso legal

As calculadoras têm caráter informativo e não substituem orientação jurídica ou contábil profissional. Veja [src/app/privacidade](src/app/privacidade) para a política de privacidade.
