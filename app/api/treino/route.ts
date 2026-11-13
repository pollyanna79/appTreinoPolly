import sql from 'mssql';
import {
  ensureUserFocusColumn,
  databaseErrorResponse,
  getDatabasePool,
} from '@/app/services/database';
import {
  hasCompletedWorkoutToday,
  getWeekdayName,
  getWorkoutSplitLabel,
  prepareUserWorkoutRotation,
} from '@/app/services/workoutCatalog';
import type { WorkoutFocus } from '@/app/services/api';

const weekdayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const validWorkoutFocuses: WorkoutFocus[] = [
  'pernas-gluteos',
  'superiores-empurrar',
  'superiores-puxar',
  'abdomen-core',
  'corpo-inteiro',
];

function isWorkoutFocus(value: unknown): value is WorkoutFocus {
  return validWorkoutFocuses.includes(value as WorkoutFocus);
}

export async function GET(request: Request) {
  const userId = Number(new URL(request.url).searchParams.get('userId'));
  if (!Number.isInteger(userId) || userId < 1) {
    return Response.json(
      { error: 'Não foi possível identificar o usuário do treino.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    await ensureUserFocusColumn(pool);
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    let planDetails: {
      objectiveId: number;
      focus: WorkoutFocus;
      frequency: number;
      phase: number;
      objective: string;
      workoutsInCombo: number;
      completedToday: boolean;
    };

    try {
      const userResult = await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT
            u.objetivo_id,
            u.foco_treino,
            u.frequencia_semanal,
            ISNULL(u.dias_concluidos, 0) AS dias_concluidos,
            CASE
              WHEN ISNULL(u.fase_combo, 0) < 1 THEN 1
              ELSE u.fase_combo
            END AS fase_combo,
            o.titulo AS objetivo
          FROM dbo.Usuarios u
          LEFT JOIN dbo.Objetivos o ON o.id = u.objetivo_id
          WHERE u.id = @userId
        `);

      if (userResult.recordset.length === 0) {
        await transaction.rollback();
        return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      const savedUser = userResult.recordset[0];
      if (
        !savedUser.objetivo_id ||
        !isWorkoutFocus(savedUser.foco_treino) ||
        !savedUser.frequencia_semanal ||
        !savedUser.objetivo
      ) {
        await transaction.rollback();
        return Response.json(
          { error: 'Selecione seu objetivo e sua frequência para gerar o treino.' },
          { status: 409 },
        );
      }

      const objectiveId = Number(savedUser.objetivo_id);
      const frequency = Number(savedUser.frequencia_semanal);
      const focus = savedUser.foco_treino;
      const rotation = await prepareUserWorkoutRotation(
        transaction,
        userId,
        objectiveId,
        frequency,
        Number(savedUser.fase_combo),
        Number(savedUser.dias_concluidos),
        focus,
      );
      planDetails = {
        objectiveId,
        focus,
        frequency,
        phase: rotation.phase,
        objective: savedUser.objetivo,
        workoutsInCombo: rotation.workoutsInCombo,
        completedToday: await hasCompletedWorkoutToday(transaction, userId),
      };
      await transaction.commit();
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[consulta do plano de treino] Falha ao desfazer transação:', rollbackError);
      }
      throw error;
    }

    const plan = await pool
      .request()
      .input('objectiveId', sql.Int, planDetails.objectiveId)
      .input('frequency', sql.Int, planDetails.frequency)
      .input('phase', sql.Int, planDetails.phase)
      .input('focus', sql.VarChar(30), planDetails.focus)
      .query(`
        SELECT
          c.id AS comboId,
          c.dia_semana_num AS diaSemana,
          e.id AS exercicioId,
          e.nome,
          e.foto_url AS imagem,
          e.grupo_muscular AS grupoMuscular,
          ce.repeticoes,
          ce.peso_sugerido AS pesoSugerido
        FROM dbo.CombosTreino c
        INNER JOIN dbo.ComboExercicios ce ON ce.combo_id = c.id
        INNER JOIN dbo.Exercicios e ON e.id = ce.exercicio_id
        WHERE c.objetivo_id = @objectiveId
          AND c.frequencia_semanal = @frequency
          AND c.fase = @phase
          AND c.foco_treino = @focus
        ORDER BY c.dia_semana_num, ce.id
      `);

    const workoutsByWeekday = new Map<
      number,
      {
        id: number;
        diaSemana: number;
        nomeDia: string;
        exercicios: Array<{
          id: number;
          nome: string;
          imagem: string;
          grupoMuscular: string;
          repeticoes: string;
          pesoSugerido: string;
        }>;
      }
    >();

    for (const row of plan.recordset) {
      let workout = workoutsByWeekday.get(row.diaSemana);
      if (!workout) {
        workout = {
          id: row.comboId,
          diaSemana: row.diaSemana,
          nomeDia: getWeekdayName(row.diaSemana),
          exercicios: [],
        };
        workoutsByWeekday.set(row.diaSemana, workout);
      }

      workout.exercicios.push({
        id: row.exercicioId,
        nome: row.nome,
        imagem: row.imagem,
        grupoMuscular: row.grupoMuscular,
        repeticoes: row.repeticoes,
        pesoSugerido: row.pesoSugerido,
      });
    }

    const treinos = [...workoutsByWeekday.values()];
    if (treinos.length !== planDetails.frequency) {
      return Response.json(
        { error: 'O plano do banco está incompleto. Salve suas preferências novamente.' },
        { status: 409 },
      );
    }

    treinos.forEach((workout, index) => {
      workout.nomeDia = `${getWeekdayName(workout.diaSemana)} · ${getWorkoutSplitLabel(
        planDetails.frequency,
        index,
        planDetails.focus,
      )}`;
    });

    const todayWeekday = new Date().getDay();
    const nextWorkout =
      treinos.find((workout) => workout.diaSemana === todayWeekday) ?? treinos[0];

    return Response.json({
      objetivo: planDetails.objective,
      focoTreino: planDetails.focus,
      aerobico:
        planDetails.objectiveId === 2
          ? 'Faça caminhada rápida, bicicleta ou elíptico por 20 a 30 minutos, em 3 a 4 dias da semana. Você pode distribuir as sessões nos dias de descanso ou ao final da força; comece pelo mínimo confortável e aumente aos poucos.'
          : planDetails.objectiveId === 3
            ? 'Se a recuperação estiver boa, faça 15 a 25 minutos de caminhada ou bicicleta leve a moderada, em 2 a 3 dias da semana.'
            : planDetails.objectiveId === 5
              ? 'Priorize pelo menos 2 sessões semanais de caminhada rápida, corrida leve ou bicicleta. Alterne dias fáceis e moderados para preservar a recuperação.'
              : planDetails.objectiveId === 6 || planDetails.objectiveId === 7
                ? 'Faça pelo menos 2 sessões semanais de caminhada, bicicleta ou dança em intensidade confortável a moderada. Distribua-as na semana e aumente a duração gradualmente.'
                : planDetails.objectiveId === 1 || planDetails.objectiveId === 4
                  ? 'Faça pelo menos 2 sessões semanais de caminhada ou bicicleta leve. Prefira os dias de descanso ou o final do treino de força para preservar a recuperação.'
                : null,
      frequenciaSemanal: planDetails.frequency,
      fase: planDetails.phase,
      treinosNoCombo: planDetails.workoutsInCombo,
      treinoConcluidoHoje: planDetails.completedToday,
      diaAtual: weekdayNames[todayWeekday],
      treinoSelecionado: nextWorkout.id,
      treinos,
    });
  } catch (error) {
    return databaseErrorResponse(error, 'consulta do plano de treino');
  }
}
