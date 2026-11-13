import sql from 'mssql';
import {
  databaseErrorResponse,
  ensureUserFocusColumn,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';
import { ensureWorkoutPlan } from '@/app/services/workoutCatalog';
import type { WorkoutFocus } from '@/app/services/api';

const focusOptionsByObjective: Record<number, WorkoutFocus[]> = {
  1: ['pernas-gluteos', 'superiores-empurrar', 'superiores-puxar'],
  2: ['abdomen-core', 'corpo-inteiro'],
};

function isValidFocus(objectiveId: unknown, focus: unknown): focus is WorkoutFocus {
  if (!Number.isInteger(objectiveId) || typeof focus !== 'string') {
    return false;
  }
  const options = focusOptionsByObjective[Number(objectiveId)] ?? ['corpo-inteiro'];
  return options.includes(focus as WorkoutFocus);
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (
    !body ||
    !Number.isInteger(body.userId) ||
    !Number.isInteger(body.objetivoId) ||
    !Number.isInteger(body.frequenciaSemanal) ||
    !isValidFocus(body.objetivoId, body.focoTreino) ||
    Number(body.userId) < 1 ||
    Number(body.objetivoId) < 1 ||
    Number(body.objetivoId) > 8 ||
    Number(body.frequenciaSemanal) < 2 ||
    Number(body.frequenciaSemanal) > 6
  ) {
    return Response.json(
      { error: 'Confira o objetivo e a frequência semanal selecionados.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await ensureUserFocusColumn(transaction);
      const result = await new sql.Request(transaction)
        .input('userId', sql.Int, Number(body.userId))
        .input('objetivoId', sql.Int, Number(body.objetivoId))
        .input('frequencia', sql.Int, Number(body.frequenciaSemanal))
        .input('focus', sql.VarChar(30), body.focoTreino)
        .query(`
          UPDATE dbo.Usuarios
          SET
            objetivo_id = @objetivoId,
            frequencia_semanal = @frequencia,
            foco_treino = @focus,
            fase_combo = CASE
              WHEN ISNULL(fase_combo, 0) < 1 THEN 1
              ELSE fase_combo
            END
          WHERE id = @userId
        `);

      if (result.rowsAffected[0] === 0) {
        await transaction.rollback();
        return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      const user = await new sql.Request(transaction)
        .input('userId', sql.Int, Number(body.userId))
        .query('SELECT fase_combo FROM dbo.Usuarios WHERE id = @userId');
      const phase = Math.max(Number(user.recordset[0].fase_combo ?? 1), 1);

      await ensureWorkoutPlan(
        transaction,
        Number(body.objetivoId),
        Number(body.frequenciaSemanal),
        phase,
        body.focoTreino,
      );
      await transaction.commit();

      return Response.json({
        message: 'Preferências salvas e plano de treino criado!',
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[onboarding] Falha ao desfazer transação:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    return databaseErrorResponse(error, 'onboarding');
  }
}
