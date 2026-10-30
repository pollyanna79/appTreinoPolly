import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
  readJsonBody,
} from '@/app/services/database';
import { ensureWorkoutPlan } from '@/app/services/workoutCatalog';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (
    !body ||
    !Number.isInteger(body.userId) ||
    !Number.isInteger(body.objetivoId) ||
    !Number.isInteger(body.frequenciaSemanal) ||
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
      const result = await new sql.Request(transaction)
        .input('userId', sql.Int, Number(body.userId))
        .input('objetivoId', sql.Int, Number(body.objetivoId))
        .input('frequencia', sql.Int, Number(body.frequenciaSemanal))
        .query(`
          UPDATE dbo.Usuarios
          SET
            objetivo_id = @objetivoId,
            frequencia_semanal = @frequencia,
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
