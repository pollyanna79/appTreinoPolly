import sql from 'mssql';
import type { WorkoutFocus } from './api';

type WorkoutSplit = 'upper-front' | 'upper-back' | 'lower-front' | 'lower-back';

const exercises = [
  { key: 'supino-reto', name: 'Supino reto com barra', muscle: 'Peitoral' },
  { key: 'flexao-escapular', name: 'Flexão escapular', muscle: 'Peitoral' },
  { key: 'supino-inclinado', name: 'Supino inclinado com barra', legacyNames: ['Supino inclinado com halteres'], muscle: 'Peitoral' },
  { key: 'crossover', name: 'Crossover no cabo', legacyNames: ['Crucifixo no cabo', 'Crucifixo na máquina'], muscle: 'Peitoral' },
  { key: 'peck-deck', name: 'Peck deck', muscle: 'Peitoral' },
  { key: 'remada-curvada', name: 'Remada curvada', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'puxada-frente', name: 'Puxada pela frente', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'remada-baixa', name: 'Remada baixa', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'remada-unilateral', name: 'Remada unilateral no cabo', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'remada-maquina', name: 'Remada sentada na máquina', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'puxada-neutra', name: 'Puxada alta com pegada fechada', muscle: 'Costas (dorsais, trapézio, romboides)' },
  { key: 'agachamento', name: 'Agachamento goblet', legacyNames: ['Agachamento livre'], muscle: 'Quadríceps' },
  { key: 'hack-squat', name: 'Agachamento no hack', muscle: 'Quadríceps' },
  { key: 'agachamento-frontal', name: 'Agachamento frontal com barra', muscle: 'Quadríceps' },
  { key: 'agachamento-pistol', name: 'Agachamento pistol', muscle: 'Quadríceps' },
  { key: 'afundo', name: 'Afundo alternado', muscle: 'Quadríceps' },
  { key: 'afundo-caminhando', name: 'Afundo caminhando com halteres', muscle: 'Glúteos' },
  { key: 'levantamento-rack', name: 'Levantamento terra com barra', muscle: 'Isquiotibiais' },
  { key: 'extensora', name: 'Cadeira extensora', muscle: 'Quadríceps' },
  { key: 'mesa-flexora', name: 'Mesa flexora', muscle: 'Isquiotibiais' },
  { key: 'cadeira-flexora', name: 'Cadeira flexora', muscle: 'Isquiotibiais' },
  { key: 'panturrilha', name: 'Panturrilha em pé', muscle: 'Panturrilhas' },
  { key: 'desenvolvimento', name: 'Desenvolvimento com halteres', muscle: 'Ombros (deltoide anterior/lateral)' },
  { key: 'desenvolvimento-maquina', name: 'Desenvolvimento na máquina', muscle: 'Ombros (deltoide anterior/lateral)' },
  { key: 'elevacao-lateral', name: 'Elevação lateral', muscle: 'Ombros (deltoide anterior/lateral)' },
  { key: 'crucifixo-inverso', name: 'Crucifixo inverso inclinado', muscle: 'Ombros (deltoide posterior)' },
  { key: 'rosca-direta', name: 'Rosca direta', muscle: 'Bíceps' },
  { key: 'rosca-alternada', name: 'Rosca alternada com halteres', muscle: 'Bíceps' },
  { key: 'rosca-martelo', name: 'Rosca martelo', muscle: 'Bíceps' },
  { key: 'rosca-scott', name: 'Rosca Scott', muscle: 'Bíceps' },
  { key: 'supino-fechado', name: 'Supino com pegada fechada', muscle: 'Tríceps' },
  { key: 'triceps-testa', name: 'Tríceps testa com barra H', muscle: 'Tríceps' },
  { key: 'triceps-banco', name: 'Tríceps no banco', muscle: 'Tríceps' },
  { key: 'prancha', name: 'Prancha', muscle: 'Abdômen' },
  { key: 'abdominal-crunch', name: 'Abdominal crunch', muscle: 'Abdômen' },
  { key: 'elevacao-pernas', name: 'Elevação de pernas deitado', muscle: 'Abdômen' },
  { key: 'supino-halteres', name: 'Supino reto com halteres', muscle: 'Peitoral' },
  { key: 'supino-maquina', name: 'Supino na máquina', muscle: 'Peitoral' },
  { key: 'face-pull', name: 'Face pull com corda', muscle: 'Ombros (deltoide posterior)' },
  { key: 'adutora', name: 'Cadeira adutora', muscle: 'Adutores' },
  { key: 'agachamento-sumo', name: 'Agachamento sumô com halter', muscle: 'Adutores' },
  { key: 'tibial-parede', name: 'Elevação de ponta dos pés na parede', muscle: 'Tibial anterior' },
  { key: 'tibial-faixa', name: 'Dorsiflexão com faixa elástica', muscle: 'Tibial anterior' },
  { key: 'ponte-gluteos', name: 'Ponte de glúteos', muscle: 'Glúteos' },
  { key: 'hip-thrust', name: 'Elevação pélvica (hip thrust)', muscle: 'Glúteos' },
  { key: 'panturrilha-sentado', name: 'Panturrilha sentada', muscle: 'Panturrilhas' },
] as const;

type ExerciseKey = (typeof exercises)[number]['key'];

const exerciseImages: Record<ExerciseKey, string> = {
  'supino-reto': '/exercicios/fotos/supino-reto-inicio.png|/exercicios/fotos/supino-reto-final.png',
  'flexao-escapular': '/exercicios/fotos/flexao-escapular-inicio.png|/exercicios/fotos/flexao-escapular-final.png',
  'supino-inclinado': '/exercicios/fotos/supino-inclinado-inicio.png|/exercicios/fotos/supino-inclinado-final.png',
  crossover: '/exercicios/fotos/crossover-inicio.png|/exercicios/fotos/crossover-final.png',
  'peck-deck': '/exercicios/fotos/peck-deck-inicio.png|/exercicios/fotos/peck-deck-final.png',
  'remada-curvada': '/exercicios/fotos/remada-curvada-inicio.png|/exercicios/fotos/remada-curvada-final.png',
  'puxada-frente': '/exercicios/fotos/puxada-frente-inicio.png|/exercicios/fotos/puxada-frente-final.webp',
  'remada-baixa': '/exercicios/fotos/remada-baixa.png',
  'remada-unilateral': '/exercicios/ilustracoes/remada-unilateral.svg',
  'remada-maquina': '/exercicios/fotos/remada-maquina-inicio.png|/exercicios/fotos/remada-maquina-final.png',
  'puxada-neutra': '/exercicios/fotos/puxada-neutra-inicio.png|/exercicios/fotos/puxada-neutra-final.webp',
  agachamento: '/exercicios/ilustracoes/agachamento-goblet.svg',
  'hack-squat': '/exercicios/fotos/hack-squat-inicio.png|/exercicios/fotos/hack-squat-final.png',
  'agachamento-frontal': '/exercicios/fotos/agachamento-frontal-inicio.png|/exercicios/fotos/agachamento-frontal-final.png',
  'agachamento-pistol': '/exercicios/ilustracoes/agachamento-pistol.svg',
  afundo: '/exercicios/ilustracoes/afundo.svg',
  'afundo-caminhando': '/exercicios/fotos/afundo-caminhando-inicio.png|/exercicios/fotos/afundo-caminhando-final.png',
  'levantamento-rack': '/exercicios/fotos/levantamento-rack-inicio.png|/exercicios/fotos/levantamento-rack-final.png',
  extensora: '/exercicios/fotos/extensora-inicio.png|/exercicios/fotos/extensora-final.webp',
  'mesa-flexora': '/exercicios/fotos/mesa-flexora-inicio.png|/exercicios/fotos/mesa-flexora-final.png',
  'cadeira-flexora': '/exercicios/fotos/cadeira-flexora-inicio.png|/exercicios/fotos/cadeira-flexora-final.png',
  panturrilha: '/exercicios/fotos/panturrilha-inicio.jpeg|/exercicios/fotos/panturrilha-final.jpeg',
  desenvolvimento: '/exercicios/fotos/desenvolvimento-inicio.png|/exercicios/fotos/desenvolvimento-final.png',
  'desenvolvimento-maquina': '/exercicios/fotos/desenvolvimento-maquina-inicio.png|/exercicios/fotos/desenvolvimento-maquina-final.png',
  'elevacao-lateral': '/exercicios/fotos/elevacao-lateral-inicio.png|/exercicios/fotos/elevacao-lateral-final.png',
  'crucifixo-inverso': '/exercicios/fotos/crucifixo-inverso-inicio.png|/exercicios/fotos/crucifixo-inverso-final.png',
  'rosca-direta': '/exercicios/fotos/rosca-direta-inicio.png|/exercicios/fotos/rosca-direta-final.png',
  'rosca-alternada': '/exercicios/fotos/rosca-alternada-inicio.png|/exercicios/fotos/rosca-alternada-final.png',
  'rosca-martelo': '/exercicios/fotos/rosca-martelo-inicio.png|/exercicios/fotos/rosca-martelo-final.png',
  'rosca-scott': '/exercicios/fotos/rosca-scott-inicio.png|/exercicios/fotos/rosca-scott-final.png',
  'supino-fechado': '/exercicios/fotos/supino-fechado-inicio.png|/exercicios/fotos/supino-fechado-final.png',
  'triceps-testa': '/exercicios/ilustracoes/triceps-testa.svg',
  'triceps-banco': '/exercicios/fotos/triceps-banco-inicio.png|/exercicios/fotos/triceps-banco-final.png',
  prancha: '/exercicios/fotos/prancha-inicio.png|/exercicios/fotos/prancha-final.png',
  'abdominal-crunch': '/exercicios/fotos/abdominal-crunch-inicio.png|/exercicios/fotos/abdominal-crunch-final.png',
  'elevacao-pernas': '/exercicios/fotos/elevacao-pernas-inicio.png|/exercicios/fotos/elevacao-pernas-final.png',
  'supino-halteres': '/exercicios/fotos/supino-halteres-inicio.png|/exercicios/fotos/supino-halteres-final.png',
  'supino-maquina': '/exercicios/fotos/supino-maquina-inicio.webp|/exercicios/fotos/supino-maquina-final.png',
  'face-pull': '/exercicios/ilustracoes/face-pull.svg',
  adutora: '/exercicios/ilustracoes/cadeira-adutora.svg',
  'agachamento-sumo': '/exercicios/ilustracoes/agachamento-sumo.svg',
  'tibial-parede': '/exercicios/ilustracoes/tibial-parede.svg',
  'tibial-faixa': '/exercicios/ilustracoes/tibial-faixa.svg',
  'ponte-gluteos': '/exercicios/ilustracoes/ponte-gluteos.svg',
  'hip-thrust': '/exercicios/fotos/hip-thrust.webp',
  'panturrilha-sentado': '/exercicios/ilustracoes/panturrilha-sentado.svg',
};

const weekdaysByFrequency: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 5, 6, 0],
  7: [1, 2, 3, 4, 5, 6, 0],
};

const muscleGroupsBySplit: Record<WorkoutSplit, string[]> = {
  'upper-front': ['Peitoral', 'Ombros (deltoide anterior/lateral)', 'Bíceps', 'Abdômen'],
  'upper-back': ['Costas (dorsais, trapézio, romboides)', 'Ombros (deltoide posterior)', 'Tríceps'],
  'lower-front': ['Quadríceps', 'Adutores', 'Tibial anterior'],
  'lower-back': ['Isquiotibiais', 'Glúteos', 'Panturrilhas'],
};

const splitLabels: Record<WorkoutSplit, string> = {
  'upper-front': 'Superiores - Frente',
  'upper-back': 'Superiores - Costas',
  'lower-front': 'Inferiores - Frente',
  'lower-back': 'Inferiores - Trás',
};

const weekdayNames: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

export class WorkoutCompletionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkoutCompletionConflictError';
  }
}

function getRepetitions(goalId: number, exerciseKey: string, phase: number): string {
  const progression = Math.max(0, phase - 1) % 3;
  const unilateral = [
    'afundo-caminhando',
    'agachamento-pistol',
    'remada-unilateral',
    'rosca-alternada',
    'rosca-martelo',
  ].includes(exerciseKey);
  if (exerciseKey === 'prancha') {
    const durations = ['3 séries de 30 a 45 segundos', '3 séries de 35 a 50 segundos', '4 séries de 30 a 45 segundos'];
    return goalId === 8 ? '2 séries de 20 segundos' : durations[progression];
  }
  if (goalId === 4) {
    return ['4 séries de 4 a 6 repetições', '4 séries de 5 a 7 repetições', '5 séries de 3 a 5 repetições'][progression];
  }
  if (goalId === 2) {
    return ['3 séries de 12 a 15 repetições', '3 séries de 10 a 15 repetições', '4 séries de 10 a 15 repetições'][progression];
  }
  if (goalId === 5) {
    return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '15 a 20' : '12 a 18'} repetições`;
  }
  if (goalId === 8) {
    return `2 séries de ${unilateral ? '8 a 10 por lado' : '10 a 12 repetições'}`;
  }
  if (goalId === 6 || goalId === 7) {
    return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '12 a 15' : '10 a 15'} repetições`;
  }
  return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '10 a 14' : '8 a 12'}${unilateral ? ' por lado' : ' repetições'}`;
}

function getSuggestedWeight(goalId: number, exerciseKey: string): string {
  if (goalId === 8) {
    return 'Carga leve e sem dor; siga orientação profissional';
  }
  if (['prancha', 'flexao-escapular', 'agachamento-pistol', 'triceps-banco'].includes(exerciseKey)) {
    return 'Peso corporal; adapte ao seu nível';
  }
  if (goalId === 4) {
    return 'Carga alta, técnica firme e 2 reps em reserva';
  }
  if (goalId === 5 || goalId === 7) {
    return 'Carga leve a moderada; priorize execução contínua';
  }
  return 'Carga para terminar com 1 a 3 reps em reserva';
}

function getSplitsForFrequency(
  frequency: number,
  focus: WorkoutFocus,
  phase: number,
): WorkoutSplit[] | undefined {
  const weekdays = weekdaysByFrequency[frequency];
  if (!weekdays) {
    return undefined;
  }

  const lowerFocus = focus === 'inferiores' || focus === 'pernas-gluteos';
  const neutralFocus = focus === 'abdomen-core' || focus === 'corpo-inteiro';
  const base: WorkoutSplit[] = lowerFocus
    ? ['lower-front', 'upper-front', 'lower-back', 'upper-back']
    : ['upper-front', 'lower-front', 'upper-back', 'lower-back'];
  const primaryFront = lowerFocus ? 'lower-front' : 'upper-front';
  const primaryBack = lowerFocus ? 'lower-back' : 'upper-back';

  if (frequency === 2) {
    return lowerFocus
      ? ['lower-front', 'lower-back']
      : ['upper-front', 'upper-back'];
  }

  if (frequency === 3) {
    if (neutralFocus) {
      return ['upper-front', phase % 2 ? 'lower-back' : 'lower-front', 'upper-back'];
    }
    return lowerFocus
      ? ['lower-front', 'lower-back', phase % 2 ? 'upper-back' : 'upper-front']
      : ['upper-front', 'upper-back', phase % 2 ? 'lower-back' : 'lower-front'];
  }

  if (frequency === 4) {
    return base;
  }
  if (frequency === 5) {
    return [...base, primaryFront];
  }
  if (frequency === 6) {
    return [...base, primaryFront, primaryBack];
  }
  return [...base, primaryFront, lowerFocus ? 'upper-front' : 'lower-front', primaryBack];
}

function getExerciseKeysForSplit(
  split: WorkoutSplit,
  phase: number,
  workoutIndex: number,
): string[] {
  return muscleGroupsBySplit[split].flatMap((group) => {
    const candidates = exercises.filter((exercise) => exercise.muscle === group);
    if (candidates.length < 2) {
      throw new Error(`O grupo muscular "${group}" precisa de pelo menos dois exercícios.`);
    }
    const start = (Math.max(phase - 1, 0) + workoutIndex) % candidates.length;
    return [
      candidates[start].key,
      candidates[(start + 1) % candidates.length].key,
    ];
  });
}

export async function ensureWorkoutPlan(
  transaction: sql.Transaction,
  objectiveId: number,
  frequency: number,
  phase: number,
  focus: WorkoutFocus,
): Promise<void> {
  await new sql.Request(transaction).query(`
    DECLARE @lockResult int;
    EXEC @lockResult = sys.sp_getapplock
      @Resource = N'app-treino-workout-catalog',
      @LockMode = N'Exclusive',
      @LockOwner = N'Transaction',
      @LockTimeout = 10000;
    IF @lockResult < 0
      THROW 51000, 'Não foi possível preparar o catálogo de exercícios.', 1;
  `);

  const objective = await new sql.Request(transaction)
    .input('objectiveId', sql.Int, objectiveId)
    .query('SELECT id FROM dbo.Objetivos WHERE id = @objectiveId');

  if (objective.recordset.length === 0) {
    throw new Error('O objetivo escolhido não existe na tabela dbo.Objetivos.');
  }

  await new sql.Request(transaction).query(`
    IF COL_LENGTH(N'dbo.CombosTreino', N'foco_treino') IS NULL
      ALTER TABLE dbo.CombosTreino
        ADD foco_treino VARCHAR(30) NOT NULL
          CONSTRAINT DF_CombosTreino_Foco DEFAULT 'geral';

    DECLARE @comboIndex sysname;
    DECLARE @isConstraint bit;
    DECLARE @indexType nvarchar(60);
    DECLARE @filter nvarchar(max);
    DECLARE @ddl nvarchar(max);

    SELECT TOP (1)
      @comboIndex = i.name,
      @isConstraint = i.is_unique_constraint,
      @indexType = i.type_desc,
      @filter = MAX(CONVERT(nvarchar(max), i.filter_definition))
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic
      ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    INNER JOIN sys.columns c
      ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.CombosTreino')
      AND i.is_unique = 1
      AND i.is_primary_key = 0
      AND ic.key_ordinal > 0
    GROUP BY i.name, i.is_unique_constraint, i.type_desc
    HAVING COUNT(*) = 4
      AND COUNT(DISTINCT c.name) = 4
      AND SUM(CASE WHEN c.name IN (
        N'objetivo_id', N'frequencia_semanal', N'fase', N'dia_semana_num'
      ) THEN 1 ELSE 0 END) = 4;

    IF @comboIndex IS NOT NULL
    BEGIN
      IF @isConstraint = 1
        SET @ddl = N'ALTER TABLE dbo.CombosTreino DROP CONSTRAINT ' + QUOTENAME(@comboIndex);
      ELSE
        SET @ddl = N'DROP INDEX ' + QUOTENAME(@comboIndex) + N' ON dbo.CombosTreino';
      EXEC sys.sp_executesql @ddl;

      IF @isConstraint = 1
        SET @ddl = N'ALTER TABLE dbo.CombosTreino ADD CONSTRAINT ' + QUOTENAME(@comboIndex) +
          N' UNIQUE (objetivo_id, frequencia_semanal, fase, dia_semana_num, foco_treino)';
      ELSE
        SET @ddl = N'CREATE UNIQUE ' + @indexType + N' INDEX ' + QUOTENAME(@comboIndex) +
          N' ON dbo.CombosTreino (objetivo_id, frequencia_semanal, fase, dia_semana_num, foco_treino)' +
          COALESCE(N' WHERE ' + @filter, N'');
      EXEC sys.sp_executesql @ddl;
    END;
  `);

  await new sql.Request(transaction).query(
    "DBCC CHECKIDENT ('dbo.Exercicios', RESEED);",
  );

  for (const exercise of exercises) {
    const illustration = exerciseImages[exercise.key];
    for (const legacyName of 'legacyNames' in exercise ? exercise.legacyNames : []) {
      await new sql.Request(transaction)
        .input('legacyName', sql.VarChar(100), legacyName)
        .input('name', sql.VarChar(100), exercise.name)
        .input('photo', sql.VarChar(255), illustration)
        .input('muscle', sql.VarChar(50), exercise.muscle)
        .query(`
          IF EXISTS (SELECT 1 FROM dbo.Exercicios WHERE nome = @legacyName)
            UPDATE dbo.Exercicios
            SET
              nome = CASE
                WHEN EXISTS (SELECT 1 FROM dbo.Exercicios WHERE nome = @name)
                  THEN nome
                ELSE @name
              END,
              foto_url = @photo,
              grupo_muscular = @muscle
            WHERE nome = @legacyName;
        `);
    }

    await new sql.Request(transaction)
      .input('name', sql.VarChar(100), exercise.name)
      .input('photo', sql.VarChar(255), illustration)
      .input('muscle', sql.VarChar(50), exercise.muscle)
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.Exercicios WHERE nome = @name)
          UPDATE dbo.Exercicios
          SET foto_url = @photo, grupo_muscular = @muscle
          WHERE nome = @name;
        ELSE
          INSERT INTO dbo.Exercicios (nome, foto_url, grupo_muscular)
          VALUES (@name, @photo, @muscle);
      `);
  }

  const exerciseRows = await new sql.Request(transaction).query(
    'SELECT id, nome, grupo_muscular FROM dbo.Exercicios',
  );
  const exerciseIds = new Map<string, number>(
    exerciseRows.recordset.map((exercise: { id: number; nome: string }) => [
      exercise.nome,
      exercise.id,
    ]),
  );

  const splits = getSplitsForFrequency(frequency, focus, phase);
  const weekdays = weekdaysByFrequency[frequency];

  if (!splits || !weekdays) {
    throw new Error('A frequência selecionada não possui um plano de treino.');
  }

  const existingCombos = await new sql.Request(transaction)
    .input('objectiveId', sql.Int, objectiveId)
    .input('frequency', sql.Int, frequency)
    .input('phase', sql.Int, phase)
    .input('focus', sql.VarChar(30), focus)
    .query(`
      SELECT id, dia_semana_num
      FROM dbo.CombosTreino
      WHERE objetivo_id = @objectiveId
        AND frequencia_semanal = @frequency
        AND fase = @phase
        AND foco_treino = @focus
    `);

  const comboByWeekday = new Map<number, number>(
    existingCombos.recordset.map(
      (combo: { id: number; dia_semana_num: number }) => [
        combo.dia_semana_num,
        combo.id,
      ],
    ),
  );
  for (let index = 0; index < splits.length; index += 1) {
    const weekday = weekdays[index];
    let comboId = comboByWeekday.get(weekday);

    if (!comboId) {
      const combo = await new sql.Request(transaction)
        .input('objectiveId', sql.Int, objectiveId)
        .input('frequency', sql.Int, frequency)
        .input('phase', sql.Int, phase)
        .input('focus', sql.VarChar(30), focus)
        .input('weekday', sql.Int, weekday)
        .query(`
          INSERT INTO dbo.CombosTreino
            (objetivo_id, frequencia_semanal, fase, dia_semana_num, foco_treino)
          OUTPUT inserted.id
          VALUES (@objectiveId, @frequency, @phase, @weekday, @focus)
        `);

      comboId = combo.recordset[0].id as number;
      comboByWeekday.set(weekday, comboId);
    }

    const workoutSplit = splits[index];
    const desiredExerciseKeys = getExerciseKeysForSplit(
      workoutSplit,
      phase,
      index,
    );
    const desiredExercises = desiredExerciseKeys.map((exerciseKey) => {
      const exercise = exercises.find((entry) => entry.key === exerciseKey);
      const exerciseId = exercise ? exerciseIds.get(exercise.name) : undefined;
      if (!exerciseId) {
        throw new Error(`O exercício "${exerciseKey}" não foi encontrado no catálogo.`);
      }
      return { exerciseKey, exerciseId };
    });

    const linkedExercises = await new sql.Request(transaction)
      .input('comboId', sql.Int, comboId)
      .query('SELECT exercicio_id FROM dbo.ComboExercicios WHERE combo_id = @comboId');

    const currentIds = linkedExercises.recordset
      .map((row: { exercicio_id: number }) => Number(row.exercicio_id))
      .sort((left: number, right: number) => left - right);
    const desiredIds = desiredExercises
      .map(({ exerciseId }) => exerciseId)
      .sort((left, right) => left - right);

    if (currentIds.join(',') === desiredIds.join(',')) {
      for (const { exerciseKey, exerciseId } of desiredExercises) {
        await new sql.Request(transaction)
          .input('comboId', sql.Int, comboId)
          .input('exerciseId', sql.Int, exerciseId)
          .input('repetitions', sql.VarChar(50), getRepetitions(objectiveId, exerciseKey, phase))
          .input('weight', sql.VarChar(50), getSuggestedWeight(objectiveId, exerciseKey))
          .query(`
            UPDATE dbo.ComboExercicios
            SET repeticoes = @repetitions, peso_sugerido = @weight
            WHERE combo_id = @comboId AND exercicio_id = @exerciseId
          `);
      }
      continue;
    }

    if (currentIds.length > 0) {
      await new sql.Request(transaction)
        .input('comboId', sql.Int, comboId)
        .query('DELETE FROM dbo.ComboExercicios WHERE combo_id = @comboId');
    }

    for (const { exerciseKey, exerciseId } of desiredExercises) {
      await new sql.Request(transaction)
        .input('comboId', sql.Int, comboId)
        .input('exerciseId', sql.Int, exerciseId)
        .input('repetitions', sql.VarChar(50), getRepetitions(objectiveId, exerciseKey, phase))
        .input('weight', sql.VarChar(50), getSuggestedWeight(objectiveId, exerciseKey))
        .query(`
          INSERT INTO dbo.ComboExercicios
            (combo_id, exercicio_id, repeticoes, peso_sugerido)
          VALUES (@comboId, @exerciseId, @repetitions, @weight)
        `);
    }
  }
}

async function ensureRotationHistoryTable(
  transaction: sql.Transaction,
): Promise<void> {
  await new sql.Request(transaction).query(`
    IF OBJECT_ID(N'dbo.UsuarioRotacaoTreinos', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.UsuarioRotacaoTreinos (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        usuario_id INT NOT NULL,
        objetivo_id INT NOT NULL,
        frequencia_semanal INT NOT NULL,
        foco_treino VARCHAR(30) NULL,
        fase INT NOT NULL,
        assinatura VARCHAR(2000) NOT NULL,
        inicio_treino_total INT NOT NULL,
        treinos_concluidos INT NOT NULL CONSTRAINT DF_UsuarioRotacaoTreinos_Concluidos DEFAULT 0,
        iniciado_em DATETIME2(0) NOT NULL CONSTRAINT DF_UsuarioRotacaoTreinos_Iniciado DEFAULT SYSUTCDATETIME(),
        encerrado_em DATETIME2(0) NULL,
        CONSTRAINT FK_UsuarioRotacaoTreinos_Usuarios
          FOREIGN KEY (usuario_id) REFERENCES dbo.Usuarios(id)
      );
      CREATE INDEX IX_UsuarioRotacaoTreinos_Usuario_Data
        ON dbo.UsuarioRotacaoTreinos (usuario_id, iniciado_em DESC);
      CREATE UNIQUE INDEX UX_UsuarioRotacaoTreinos_Ativa
        ON dbo.UsuarioRotacaoTreinos (usuario_id)
        WHERE encerrado_em IS NULL;
    END;

    IF COL_LENGTH(N'dbo.UsuarioRotacaoTreinos', N'inicio_treino_total') IS NULL
      ALTER TABLE dbo.UsuarioRotacaoTreinos
        ADD inicio_treino_total INT NOT NULL CONSTRAINT DF_UsuarioRotacaoTreinos_InicioTotal DEFAULT 0;
    IF COL_LENGTH(N'dbo.UsuarioRotacaoTreinos', N'treinos_concluidos') IS NULL
      ALTER TABLE dbo.UsuarioRotacaoTreinos
        ADD treinos_concluidos INT NOT NULL CONSTRAINT DF_UsuarioRotacaoTreinos_Concluidos DEFAULT 0;
    IF COL_LENGTH(N'dbo.UsuarioRotacaoTreinos', N'foco_treino') IS NULL
      ALTER TABLE dbo.UsuarioRotacaoTreinos ADD foco_treino VARCHAR(30) NULL;

    IF OBJECT_ID(N'dbo.UsuarioTreinosConcluidos', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.UsuarioTreinosConcluidos (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        usuario_id INT NOT NULL,
        combo_id INT NOT NULL,
        data_conclusao DATE NOT NULL CONSTRAINT DF_UsuarioTreinosConcluidos_Data DEFAULT CONVERT(date, GETDATE()),
        CONSTRAINT FK_UsuarioTreinosConcluidos_Usuarios
          FOREIGN KEY (usuario_id) REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_UsuarioTreinosConcluidos_Combos
          FOREIGN KEY (combo_id) REFERENCES dbo.CombosTreino(id)
      );
      CREATE UNIQUE INDEX UX_UsuarioTreinosConcluidos_Usuario_Data
        ON dbo.UsuarioTreinosConcluidos (usuario_id, data_conclusao);
    END;
  `);
}

export async function prepareUserWorkoutRotation(
  transaction: sql.Transaction,
  userId: number,
  objectiveId: number,
  frequency: number,
  savedPhase: number,
  totalCompletedWorkouts: number,
  focus: WorkoutFocus,
): Promise<{ phase: number; workoutsInCombo: number }> {
  await ensureRotationHistoryTable(transaction);

  await new sql.Request(transaction)
    .input('resource', sql.NVarChar(255), `app-treino-user-rotation-${userId}`)
    .query(`
      DECLARE @lockResult int;
      EXEC @lockResult = sys.sp_getapplock
        @Resource = @resource,
        @LockMode = N'Exclusive',
        @LockOwner = N'Transaction',
        @LockTimeout = 10000;
      IF @lockResult < 0
        THROW 51001, 'Não foi possível registrar a rotação do treino.', 1;
    `);

  const activeResult = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT TOP (1)
        fase,
        objetivo_id,
        frequencia_semanal,
        foco_treino,
        inicio_treino_total,
        treinos_concluidos
      FROM dbo.UsuarioRotacaoTreinos
      WHERE usuario_id = @userId AND encerrado_em IS NULL
      ORDER BY iniciado_em DESC
    `);

  const active = activeResult.recordset[0] as
    | {
        fase: number;
        objetivo_id: number;
        frequencia_semanal: number;
        foco_treino: string | null;
        inicio_treino_total: number;
        treinos_concluidos: number;
      }
    | undefined;

  if (
    active &&
    Number(active.objetivo_id) === objectiveId &&
    Number(active.frequencia_semanal) === frequency &&
    active.foco_treino === focus &&
    Number(active.treinos_concluidos) < 60
  ) {
    await ensureWorkoutPlan(transaction, objectiveId, frequency, Number(active.fase), focus);
    return {
      phase: Number(active.fase),
      workoutsInCombo: Math.max(0, Number(active.treinos_concluidos)),
    };
  }

  if (active) {
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.UsuarioRotacaoTreinos
        SET encerrado_em = SYSUTCDATETIME()
        WHERE usuario_id = @userId AND encerrado_em IS NULL
      `);
  }

  const nextPhase =
    active && Number(active.objetivo_id) === objectiveId &&
    Number(active.frequencia_semanal) === frequency
      ? Number(active.fase) + 1
      : Math.max(savedPhase, 1);
  const recentHistory = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .input('totalCompleted', sql.Int, totalCompletedWorkouts)
    .input('focus', sql.VarChar(30), focus)
    .query(`
      SELECT assinatura
      FROM dbo.UsuarioRotacaoTreinos
      WHERE usuario_id = @userId
        AND inicio_treino_total > @totalCompleted - 180
        AND foco_treino = @focus
    `);
  const recentSignatures = new Set(
    recentHistory.recordset.map((row: { assinatura: string }) => row.assinatura),
  );

  for (let phase = nextPhase; phase < nextPhase + 100; phase += 1) {
    await ensureWorkoutPlan(transaction, objectiveId, frequency, phase, focus);
    const comboRows = await new sql.Request(transaction)
      .input('objectiveId', sql.Int, objectiveId)
      .input('frequency', sql.Int, frequency)
      .input('phase', sql.Int, phase)
      .input('focus', sql.VarChar(30), focus)
      .query(`
        SELECT c.dia_semana_num, ce.exercicio_id
        FROM dbo.CombosTreino c
        INNER JOIN dbo.ComboExercicios ce ON ce.combo_id = c.id
        WHERE c.objetivo_id = @objectiveId
          AND c.frequencia_semanal = @frequency
          AND c.fase = @phase
          AND c.foco_treino = @focus
        ORDER BY c.dia_semana_num, ce.exercicio_id
      `);
    const signature = JSON.stringify(
      comboRows.recordset.map(
        (row: { dia_semana_num: number; exercicio_id: number }) => [
          Number(row.dia_semana_num),
          Number(row.exercicio_id),
        ],
      ),
    );

    if (comboRows.recordset.length === 0 || recentSignatures.has(signature)) {
      continue;
    }

    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('objectiveId', sql.Int, objectiveId)
      .input('frequency', sql.Int, frequency)
      .input('phase', sql.Int, phase)
      .input('focus', sql.VarChar(30), focus)
      .input('signature', sql.VarChar(2000), signature)
      .input('totalCompleted', sql.Int, totalCompletedWorkouts)
      .query(`
        INSERT INTO dbo.UsuarioRotacaoTreinos
          (usuario_id, objetivo_id, frequencia_semanal, foco_treino, fase, assinatura, inicio_treino_total)
        VALUES (@userId, @objectiveId, @frequency, @focus, @phase, @signature, @totalCompleted)

        UPDATE dbo.Usuarios SET fase_combo = @phase WHERE id = @userId
      `);

    return { phase, workoutsInCombo: 0 };
  }

  throw new Error('Não foi possível encontrar um combo diferente dos usados nos últimos 180 dias.');
}

export async function hasCompletedWorkoutToday(
  transaction: sql.Transaction,
  userId: number,
): Promise<boolean> {
  const result = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT TOP (1) 1 AS concluido
      FROM dbo.UsuarioTreinosConcluidos
      WHERE usuario_id = @userId
        AND data_conclusao = CONVERT(date, GETDATE())
    `);
  return result.recordset.length > 0;
}

export async function registerWorkoutCompletion(
  transaction: sql.Transaction,
  userId: number,
  comboId: number,
): Promise<{
  totalCompleted: number;
  phase: number;
  workoutsInCombo: number;
  phaseChanged: boolean;
}> {
  await ensureRotationHistoryTable(transaction);

  await new sql.Request(transaction)
    .input('resource', sql.NVarChar(255), `app-treino-user-rotation-${userId}`)
    .query(`
      DECLARE @lockResult int;
      EXEC @lockResult = sys.sp_getapplock
        @Resource = @resource,
        @LockMode = N'Exclusive',
        @LockOwner = N'Transaction',
        @LockTimeout = 10000;
      IF @lockResult < 0
        THROW 51001, 'Não foi possível registrar a conclusão do treino.', 1;
    `);

  const active = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .input('comboId', sql.Int, comboId)
    .query(`
      SELECT TOP (1)
        u.objetivo_id,
        u.foco_treino,
        u.frequencia_semanal,
        u.fase_combo,
        u.dias_concluidos,
        r.fase,
        r.treinos_concluidos
      FROM dbo.Usuarios u
      INNER JOIN dbo.UsuarioRotacaoTreinos r
        ON r.usuario_id = u.id AND r.encerrado_em IS NULL
      INNER JOIN dbo.CombosTreino c
        ON c.id = @comboId
        AND c.objetivo_id = r.objetivo_id
        AND c.frequencia_semanal = r.frequencia_semanal
        AND c.fase = r.fase
        AND c.foco_treino = r.foco_treino
      WHERE u.id = @userId
        AND u.objetivo_id = r.objetivo_id
        AND u.frequencia_semanal = r.frequencia_semanal
        AND u.foco_treino = r.foco_treino
        AND r.treinos_concluidos < 60
    `);

  if (active.recordset.length === 0) {
    throw new WorkoutCompletionConflictError(
      'O combo selecionado não pertence ao plano atual do usuário.',
    );
  }

  const completion = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .input('comboId', sql.Int, comboId)
    .query(`
      IF EXISTS (
        SELECT 1
        FROM dbo.UsuarioTreinosConcluidos
        WHERE usuario_id = @userId
          AND data_conclusao = CONVERT(date, GETDATE())
      )
        SELECT CAST(0 AS bit) AS registrado;
      ELSE
      BEGIN
        INSERT INTO dbo.UsuarioTreinosConcluidos (usuario_id, combo_id)
        VALUES (@userId, @comboId);
        SELECT CAST(1 AS bit) AS registrado;
      END
    `);

  if (!completion.recordset[0].registrado) {
    throw new WorkoutCompletionConflictError('O treino de hoje já foi registrado.');
  }

  const progress = await new sql.Request(transaction)
    .input('userId', sql.Int, userId)
    .query(`
      SET NOCOUNT ON;
      UPDATE dbo.Usuarios
      SET dias_concluidos = ISNULL(dias_concluidos, 0) + 1
      WHERE id = @userId;

      UPDATE dbo.UsuarioRotacaoTreinos
      SET treinos_concluidos = treinos_concluidos + 1
      WHERE usuario_id = @userId AND encerrado_em IS NULL;

      SELECT
        u.dias_concluidos AS totalCompleted,
        r.fase,
        r.treinos_concluidos AS workoutsInCombo
      FROM dbo.Usuarios u
      INNER JOIN dbo.UsuarioRotacaoTreinos r
        ON r.usuario_id = u.id AND r.encerrado_em IS NULL
      WHERE u.id = @userId;
    `);

  const row = progress.recordset[0] as {
    totalCompleted: number;
    fase: number;
    workoutsInCombo: number;
  };
  const rotation = await prepareUserWorkoutRotation(
    transaction,
    userId,
    Number(active.recordset[0].objetivo_id),
    Number(active.recordset[0].frequencia_semanal),
    Number(row.fase),
    Number(row.totalCompleted),
    active.recordset[0].foco_treino,
  );

  return {
    totalCompleted: Number(row.totalCompleted),
    phase: rotation.phase,
    workoutsInCombo: rotation.workoutsInCombo,
    phaseChanged: rotation.phase !== Number(row.fase),
  };
}

export function getWeekdayName(weekday: number): string {
  return weekdayNames[weekday] ?? `Dia ${weekday}`;
}

export function getWorkoutSplitLabel(
  frequency: number,
  index: number,
  focus: WorkoutFocus,
  phase: number,
): string {
  const split = getSplitsForFrequency(frequency, focus, phase)?.[index];
  if (!split) {
    return 'Treino complementar';
  }
  return splitLabels[split];
}
