# Treino+

Aplicação de acompanhamento de treinos com Next.js e SQL Server.

## Configuração do SQL Server

Crie ou confira o arquivo `.env` na raiz do projeto:

```env
DB_HOST=localhost
DB_DATABASE=AppTreinoDB
DB_USER=seu_usuario_sql
DB_SENHA=sua_senha_sql
```

O SSMS mostra o banco `AppTreinoDB` no servidor local. Para outra instalação,
ajuste o host e o banco. Se o SQL Server usar uma instância nomeada, configure
`DB_INSTANCE` com o nome dela; para uma porta TCP fixa, use `DB_PORT` no lugar
de `DB_INSTANCE`. Não configure os dois juntos.

O usuário SQL precisa ter permissão de leitura e gravação nas tabelas
`dbo.Usuarios`, `dbo.Exercicios`, `dbo.CombosTreino`, `dbo.ComboExercicios`
e `dbo.PlanosAlimentares`, além de leitura em `dbo.Objetivos`. A aplicação usa
as colunas `id`, `nome`, `email`, `senha`,
`objetivo_id`, `frequencia_semanal`, `dias_concluidos` e `fase_combo`.
As opções da tela de objetivos são consultadas em `dbo.Objetivos`; cadastro,
login, preferências e conclusão de treino usam as rotas `/api` do Next.js.
Ao salvar as preferências, o app grava objetivo e frequência em `dbo.Usuarios`
e cria os exercícios e os dias do plano escolhido em `dbo.Exercicios`,
`dbo.CombosTreino` e `dbo.ComboExercicios`. O catálogo só insere registros
ausentes; os planos aparecem após entrar com uma conta configurada.
Para instâncias nomeadas, habilite TCP/IP no SQL Server Configuration Manager
e, se necessário, o SQL Server Browser.
Ao concluir 90 treinos, a nova fase e seus exercícios são criados na mesma
transação que atualiza o progresso. A tela Alimentação consulta
`dbo.PlanosAlimentares` e cria sugestões gerais para o objetivo selecionado
quando ainda não há refeições cadastradas.

## Executar

Instale as dependências e inicie a aplicação:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Mantenha o comando
`npm run dev` em execução enquanto usa o app; as rotas `/api` são servidas
pelo próprio Next.js, sem um segundo servidor. As demonstrações locais em
`public/exercicios/fotos` são servidas localmente; os créditos e licenças estão
em `public/exercicios/CREDITOS.txt`. A alimentação é uma sugestão geral, não
uma dieta clínica ou personalizada.
