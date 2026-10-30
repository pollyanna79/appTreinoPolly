import sql from 'mssql';

const exercises = [
  { key: 'supino-reto', name: 'Supino reto com barra', muscle: 'Peito', photo: '/exercicios/fotos/supino-reto-inicio.png|/exercicios/fotos/supino-reto-final.png' },
  { key: 'flexao', name: 'Flexão declinada', legacyNames: ['Flexão de braços'], muscle: 'Peito', photo: '/exercicios/fotos/flexao.png' },
  { key: 'supino-inclinado', name: 'Supino inclinado com barra', legacyNames: ['Supino inclinado com halteres'], muscle: 'Peito', photo: '/exercicios/fotos/supino-inclinado-inicio.png|/exercicios/fotos/supino-inclinado-final.png' },
  { key: 'crucifixo-maquina', name: 'Crucifixo no cabo', legacyNames: ['Crucifixo na máquina'], muscle: 'Peito', photo: '/exercicios/fotos/crucifixo-cabo.webp' },
  { key: 'remada-curvada', name: 'Remada curvada', muscle: 'Costas', photo: '/exercicios/fotos/remada-curvada-inicio.png|/exercicios/fotos/remada-curvada-final.png' },
  { key: 'puxada-frente', name: 'Puxada pela frente', muscle: 'Costas', photo: '/exercicios/fotos/puxada-frente-inicio.png|/exercicios/fotos/puxada-frente-final.webp' },
  { key: 'remada-baixa', name: 'Remada baixa', muscle: 'Costas', photo: '/exercicios/fotos/remada-baixa.png' },
  { key: 'agachamento', name: 'Agachamento goblet', legacyNames: ['Agachamento livre'], muscle: 'Pernas', photo: '/exercicios/fotos/agachamento-inicio.jpeg|/exercicios/fotos/agachamento-final.jpeg' },
  { key: 'leg-press', name: 'Leg press', muscle: 'Pernas', photo: '/exercicios/fotos/leg-press.webp' },
  { key: 'afundo', name: 'Afundo alternado', muscle: 'Pernas', photo: '/exercicios/fotos/afundo-inicio.jfif|/exercicios/fotos/afundo-final.jfif' },
  { key: 'levantamento-romeno', name: 'Levantamento terra romeno', muscle: 'Posterior de coxa', photo: '/exercicios/fotos/levantamento-romeno.png' },
  { key: 'hip-thrust', name: 'Elevação de quadril', muscle: 'Glúteos', photo: '/exercicios/fotos/hip-thrust.webp' },
  { key: 'desenvolvimento', name: 'Desenvolvimento com halteres', muscle: 'Ombros', photo: '/exercicios/fotos/desenvolvimento-inicio.png|/exercicios/fotos/desenvolvimento-final.png' },
  { key: 'elevacao-lateral', name: 'Elevação lateral', muscle: 'Ombros', photo: '/exercicios/fotos/elevacao-lateral-inicio.png|/exercicios/fotos/elevacao-lateral-final.png' },
  { key: 'rosca-direta', name: 'Rosca direta', muscle: 'Bíceps', photo: '/exercicios/fotos/rosca-direta-inicio.png|/exercicios/fotos/rosca-direta-final.png' },
  { key: 'triceps-corda', name: 'Extensão de tríceps no cabo', legacyNames: ['Tríceps na corda'], muscle: 'Tríceps', photo: '/exercicios/fotos/extensao-triceps-cabo.png' },
  { key: 'triceps-testa', name: 'Tríceps testa com barra H', muscle: 'Tríceps', photo: '/exercicios/fotos/triceps-testa-inicio.png|/exercicios/fotos/triceps-testa-final.png' },
  { key: 'prancha', name: 'Prancha', muscle: 'Abdômen', photo: '/exercicios/fotos/prancha-inicio.png|/exercicios/fotos/prancha-final.png' },
  { key: 'dead-bug', name: 'Dead bug', muscle: 'Abdômen', photo: '/exercicios/dead-bug.svg' },
] as const;

const sessionsByFrequency: Record<number, (keyof typeof sessionsByKey)[]> = {
  2: ['full-a', 'full-b'],
  3: ['full-a', 'full-b', 'full-c'],
  4: ['upper-a', 'lower-a', 'upper-b', 'lower-b'],
  5: ['push-a', 'pull-a', 'legs-a', 'upper-b', 'full-c'],
  6: ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'],
};

const weekdaysByFrequency: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

const sessionsByKey = {
  'full-a': ['supino-reto', 'agachamento', 'remada-curvada', 'desenvolvimento', 'prancha'],
  'full-b': ['supino-inclinado', 'levantamento-romeno', 'puxada-frente', 'afundo', 'dead-bug'],
  'full-c': ['flexao', 'hip-thrust', 'remada-baixa', 'elevacao-lateral', 'rosca-direta'],
  'upper-a': ['supino-reto', 'remada-curvada', 'supino-inclinado', 'desenvolvimento', 'triceps-corda'],
  'lower-a': ['agachamento', 'leg-press', 'levantamento-romeno', 'afundo', 'prancha'],
  'upper-b': ['supino-inclinado', 'puxada-frente', 'crucifixo-maquina', 'elevacao-lateral', 'rosca-direta'],
  'lower-b': ['hip-thrust', 'levantamento-romeno', 'afundo', 'leg-press', 'dead-bug'],
  'push-a': ['supino-reto', 'supino-inclinado', 'desenvolvimento', 'crucifixo-maquina', 'triceps-corda'],
  'pull-a': ['remada-curvada', 'puxada-frente', 'remada-baixa', 'rosca-direta', 'dead-bug'],
  'legs-a': ['agachamento', 'leg-press', 'afundo', 'levantamento-romeno', 'hip-thrust'],
  'push-b': ['flexao', 'supino-inclinado', 'elevacao-lateral', 'desenvolvimento', 'triceps-testa'],
  'pull-b': ['remada-baixa', 'puxada-frente', 'remada-curvada', 'rosca-direta', 'prancha'],
  'legs-b': ['agachamento', 'levantamento-romeno', 'hip-thrust', 'leg-press', 'dead-bug'],
} as const;

const phaseTwoSessionsByFrequency: Record<number, (keyof typeof phaseTwoSessionsByKey)[]> = {
  2: ['full-a', 'full-b'],
  3: ['full-a', 'full-b', 'full-c'],
  4: ['upper-a', 'lower-a', 'upper-b', 'lower-b'],
  5: ['push-a', 'pull-a', 'legs-a', 'upper-b', 'full-c'],
  6: ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'],
};

const phaseTwoSessionsByKey = {
  'full-a': ['flexao', 'leg-press', 'remada-baixa', 'elevacao-lateral', 'dead-bug'],
  'full-b': ['supino-reto', 'hip-thrust', 'remada-curvada', 'rosca-direta', 'prancha'],
  'full-c': ['supino-inclinado', 'afundo', 'puxada-frente', 'triceps-corda', 'prancha'],
  'upper-a': ['supino-inclinado', 'puxada-frente', 'desenvolvimento', 'elevacao-lateral', 'rosca-direta'],
  'lower-a': ['leg-press', 'hip-thrust', 'afundo', 'levantamento-romeno', 'dead-bug'],
  'upper-b': ['supino-reto', 'remada-baixa', 'crucifixo-maquina', 'triceps-corda', 'rosca-direta'],
  'lower-b': ['agachamento', 'levantamento-romeno', 'leg-press', 'hip-thrust', 'prancha'],
  'push-a': ['supino-inclinado', 'flexao', 'elevacao-lateral', 'triceps-testa', 'desenvolvimento'],
  'pull-a': ['remada-baixa', 'puxada-frente', 'remada-curvada', 'rosca-direta', 'prancha'],
  'legs-a': ['agachamento', 'hip-thrust', 'afundo', 'leg-press', 'dead-bug'],
  'push-b': ['supino-reto', 'crucifixo-maquina', 'desenvolvimento', 'triceps-corda', 'flexao'],
  'pull-b': ['remada-curvada', 'puxada-frente', 'remada-baixa', 'rosca-direta', 'dead-bug'],
  'legs-b': ['leg-press', 'levantamento-romeno', 'hip-thrust', 'afundo', 'prancha'],
} as const;

const weekdayNames: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

function getRepetitions(goalId: number, exerciseKey: string, phase: number): string {
  const progression = Math.max(0, phase - 1) % 3;
  if (exerciseKey === 'prancha') {
    const durations = ['3 séries de 30 a 45 segundos', '3 séries de 35 a 50 segundos', '4 séries de 30 a 45 segundos'];
    return goalId === 8 ? '2 séries de 20 segundos' : durations[progression];
  }
  if (exerciseKey === 'dead-bug') {
    return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '10 a 14' : '8 a 12'} por lado`;
  }
  if (goalId === 4) {
    const strengthTargets = [
      '4 séries de 4 a 6 repetições',
      '4 séries de 5 a 7 repetições',
      '5 séries de 3 a 5 repetições',
    ];
    return strengthTargets[progression];
  }
  if (goalId === 2) {
    const targets = [
      '3 séries de 10 a 15 repetições',
      '4 séries de 8 a 12 repetições',
      '4 séries de 10 a 15 repetições',
    ];
    return targets[progression];
  }
  if (goalId === 5 || goalId === 7) {
    return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '12 a 18' : '12 a 15'} repetições`;
  }
  if (goalId === 6 || goalId === 8) {
    return '2 séries de 10 a 12 repetições';
  }
  return `${progression === 2 ? 4 : 3} séries de ${progression === 1 ? '10 a 14' : '8 a 12'} repetições`;
}

function getSuggestedWeight(exerciseKey: string): string {
  if (exerciseKey === 'prancha' || exerciseKey === 'dead-bug' || exerciseKey === 'flexao') {
    return 'Peso corporal; adapte ao seu nível';
  }
  return 'Carga confortável, com técnica controlada';
}

export async function ensureWorkoutPlan(
  transaction: sql.Transaction,
  objectiveId: number,
  frequency: number,
  phase: number,
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

  for (const exercise of exercises) {
    for (const legacyName of 'legacyNames' in exercise ? exercise.legacyNames : []) {
      await new sql.Request(transaction)
        .input('legacyName', sql.VarChar(100), legacyName)
        .input('name', sql.VarChar(100), exercise.name)
        .input('photo', sql.VarChar(255), exercise.photo)
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
      .input('photo', sql.VarChar(255), exercise.photo)
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
    'SELECT id, nome FROM dbo.Exercicios',
  );
  const exerciseIds = new Map<string, number>(
    exerciseRows.recordset.map((exercise: { id: number; nome: string }) => [
      exercise.nome,
      exercise.id,
    ]),
  );

  const sessionKeys =
    phase % 2 === 0
      ? phaseTwoSessionsByFrequency[frequency]
      : sessionsByFrequency[frequency];
  const weekdays = weekdaysByFrequency[frequency];

  if (!sessionKeys || !weekdays) {
    throw new Error('A frequência selecionada não possui um plano de treino.');
  }

  const existingCombos = await new sql.Request(transaction)
    .input('objectiveId', sql.Int, objectiveId)
    .input('frequency', sql.Int, frequency)
    .input('phase', sql.Int, phase)
    .query(`
      SELECT id, dia_semana_num
      FROM dbo.CombosTreino
      WHERE objetivo_id = @objectiveId
        AND frequencia_semanal = @frequency
        AND fase = @phase
    `);

  const comboByWeekday = new Map<number, number>(
    existingCombos.recordset.map(
      (combo: { id: number; dia_semana_num: number }) => [
        combo.dia_semana_num,
        combo.id,
      ],
    ),
  );

  for (let index = 0; index < sessionKeys.length; index += 1) {
    const weekday = weekdays[index];
    let comboId = comboByWeekday.get(weekday);

    if (!comboId) {
      const combo = await new sql.Request(transaction)
        .input('objectiveId', sql.Int, objectiveId)
        .input('frequency', sql.Int, frequency)
        .input('phase', sql.Int, phase)
        .input('weekday', sql.Int, weekday)
        .query(`
          INSERT INTO dbo.CombosTreino
            (objetivo_id, frequencia_semanal, fase, dia_semana_num)
          OUTPUT inserted.id
          VALUES (@objectiveId, @frequency, @phase, @weekday)
        `);

      comboId = combo.recordset[0].id as number;
      comboByWeekday.set(weekday, comboId);
    }

    const linkedExercises = await new sql.Request(transaction)
      .input('comboId', sql.Int, comboId)
      .query('SELECT exercicio_id FROM dbo.ComboExercicios WHERE combo_id = @comboId');

    if (linkedExercises.recordset.length > 0) {
      continue;
    }

    const session = sessionKeys[index];
    const exerciseKeys =
      phase % 2 === 0
        ? phaseTwoSessionsByKey[session as keyof typeof phaseTwoSessionsByKey]
        : sessionsByKey[session as keyof typeof sessionsByKey];

    for (const exerciseKey of exerciseKeys) {
      const exercise = exercises.find((entry) => entry.key === exerciseKey);
      const exerciseId = exercise ? exerciseIds.get(exercise.name) : undefined;

      if (!exerciseId) {
        throw new Error(`O exercício "${exerciseKey}" não foi encontrado no catálogo.`);
      }

      await new sql.Request(transaction)
        .input('comboId', sql.Int, comboId)
        .input('exerciseId', sql.Int, exerciseId)
        .input('repetitions', sql.VarChar(50), getRepetitions(objectiveId, exerciseKey, phase))
        .input('weight', sql.VarChar(50), getSuggestedWeight(exerciseKey))
        .query(`
          INSERT INTO dbo.ComboExercicios
            (combo_id, exercicio_id, repeticoes, peso_sugerido)
          VALUES (@comboId, @exerciseId, @repetitions, @weight)
        `);
    }
  }
}

export function getWeekdayName(weekday: number): string {
  return weekdayNames[weekday] ?? `Dia ${weekday}`;
}
