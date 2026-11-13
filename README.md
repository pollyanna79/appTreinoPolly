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
e `dbo.PlanosAlimentares`, além de leitura em `dbo.Objetivos`. Na primeira
consulta ao treino, a aplicação também cria `dbo.UsuarioRotacaoTreinos`; para
isso, o usuário SQL precisa poder criar e alterar tabelas e índices no schema `dbo`.
A tabela `dbo.UsuarioTreinosConcluidos` também é criada automaticamente.
A aplicação usa
as colunas `id`, `nome`, `email`, `senha`,
`objetivo_id`, `frequencia_semanal`, `dias_concluidos`, `fase_combo` e
`foco_treino`. A aplicação adiciona `foco_treino` a `dbo.Usuarios`,
`dbo.CombosTreino` e `dbo.UsuarioRotacaoTreinos` quando necessário.
As opções da tela de objetivos são consultadas em `dbo.Objetivos`; cadastro,
login, preferências e conclusão de treino usam as rotas `/api` do Next.js.
Ao salvar as preferências, o app grava objetivo, ênfase muscular e frequência
em `dbo.Usuarios` e sincroniza os exercícios e os dias do plano escolhido em
`dbo.Exercicios`, `dbo.CombosTreino` e `dbo.ComboExercicios`. A frequência pode
ser de 3, 4, 5, 6 ou 7 dias por semana. Os treinos alternam Superiores - Frente,
Superiores - Costas, Inferiores - Frente e Inferiores - Trás, com dois exercícios
por grupo muscular de cada divisão. O aeróbico é sugerido após a força em um
dos treinos semanais. As imagens dos exercícios são diagramas vetoriais
padronizados, sem fotos de pessoas reais. Os planos aparecem após entrar com
uma conta configurada.
Para instâncias nomeadas, habilite TCP/IP no SQL Server Configuration Manager
e, se necessário, o SQL Server Browser.
A aplicação oferece mais de 40 exercícios com pesos livres, máquinas, cabos e
movimentos com peso corporal. Séries, repetições e orientação de carga variam
conforme o objetivo salvo; a carga continua sendo uma recomendação por esforço,
pois o app não conhece o peso que cada pessoa consegue levantar com segurança.
Cada usuário recebe um combo até concluir 60 treinos. A troca e o histórico são
gravados em `dbo.UsuarioRotacaoTreinos`, e o mesmo conjunto de exercícios não é
atribuído novamente ao usuário antes de ele concluir 180 treinos desde o uso
anterior. Só é registrado um treino concluído por usuário em cada data. Os
registros de combos em `dbo.CombosTreino` e `dbo.ComboExercicios` são
compartilhados entre usuários; o histórico da rotação é individual.

A tela Alimentação mantém uma sugestão geral específica para cada objetivo e
remove refeições duplicadas ou antigas daquele objetivo ao sincronizar o menu.
As calorias são estimativas fixas, não uma meta individual ou dieta clínica.

## Executar

Instale as dependências e inicie a aplicação:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Mantenha o comando
`npm run dev` em execução enquanto usa o app; as rotas `/api` são servidas
pelo próprio Next.js, sem um segundo servidor. Os diagramas vetoriais usados
nos treinos ficam em `public/exercicios/ilustracoes`. A alimentação é uma
sugestão geral, não uma dieta clínica ou personalizada.
