import sql from 'mssql';
import {
  databaseErrorResponse,
  getDatabasePool,
} from '@/app/services/database';

type Meal = {
  name: string;
  description: string;
  calories: number;
};

function getMealsForObjective(objective: string): Meal[] {
  const normalizedObjective = objective
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/massa|hipertrof|ganho/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Aveia com leite, banana e ovos mexidos.', calories: 500 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com fruta e castanhas.', calories: 300 },
      { name: 'Almoço', description: 'Arroz, feijão, frango grelhado e salada.', calories: 650 },
      { name: 'Lanche da tarde', description: 'Pão integral com queijo branco e uma fruta.', calories: 350 },
      { name: 'Jantar', description: 'Batata, peixe ou frango e legumes variados.', calories: 600 },
    ];
  }

  if (/emagrec|perda de peso|perder peso|reduzir/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Ovos mexidos, pão integral e uma fruta.', calories: 400 },
      { name: 'Lanche da manhã', description: 'Iogurte natural e uma fruta da estação.', calories: 200 },
      { name: 'Almoço', description: 'Arroz, feijão, frango grelhado e salada variada.', calories: 600 },
      { name: 'Lanche da tarde', description: 'Fruta com um punhado pequeno de castanhas.', calories: 250 },
      { name: 'Jantar', description: 'Omelete com legumes, salada e uma porção de batata.', calories: 500 },
    ];
  }

  return [
    { name: 'Café da manhã', description: 'Pão integral, ovos e uma fruta.', calories: 450 },
    { name: 'Lanche da manhã', description: 'Iogurte natural com aveia.', calories: 250 },
    { name: 'Almoço', description: 'Arroz, feijão, proteína grelhada e salada.', calories: 650 },
    { name: 'Lanche da tarde', description: 'Sanduíche integral com queijo branco e tomate.', calories: 350 },
    { name: 'Jantar', description: 'Proteína grelhada, legumes e uma porção de arroz ou batata.', calories: 550 },
  ];
}

export async function GET(request: Request) {
  const userId = Number(new URL(request.url).searchParams.get('userId'));
  if (!Number.isInteger(userId) || userId < 1) {
    return Response.json(
      { error: 'Não foi possível identificar o usuário do menu alimentar.' },
      { status: 400 },
    );
  }

  try {
    const pool = await getDatabasePool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const user = await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT o.id AS objetivo_id, o.titulo AS objetivo
          FROM dbo.Usuarios u
          INNER JOIN dbo.Objetivos o ON o.id = u.objetivo_id
          WHERE u.id = @userId
        `);

      if (user.recordset.length === 0) {
        await transaction.rollback();
        return Response.json(
          { error: 'Salve seu objetivo antes de consultar o menu alimentar.' },
          { status: 409 },
        );
      }

      const { objetivo_id: objectiveId, objetivo } = user.recordset[0];
      await new sql.Request(transaction).query(`
        DECLARE @lockResult int;
        EXEC @lockResult = sys.sp_getapplock
          @Resource = N'app-treino-meal-catalog',
          @LockMode = N'Exclusive',
          @LockOwner = N'Transaction',
          @LockTimeout = 10000;
        IF @lockResult < 0
          THROW 51000, 'Não foi possível preparar o menu alimentar.', 1;
      `);

      for (const meal of getMealsForObjective(String(objetivo))) {
        await new sql.Request(transaction)
          .input('objectiveId', sql.Int, Number(objectiveId))
          .input('meal', sql.VarChar(50), meal.name)
          .input('description', sql.VarChar(800), meal.description)
          .input('calories', sql.Int, meal.calories)
          .query(`
            IF NOT EXISTS (
              SELECT 1
              FROM dbo.PlanosAlimentares
              WHERE objetivo_id = @objectiveId AND refeicao = @meal
            )
              INSERT INTO dbo.PlanosAlimentares
                (objetivo_id, refeicao, descricao, calorias_aprox)
              VALUES (@objectiveId, @meal, @description, @calories);
          `);
      }

      const meals = await new sql.Request(transaction)
        .input('objectiveId', sql.Int, Number(objectiveId))
        .query(`
          SELECT id, refeicao, descricao, calorias_aprox
          FROM dbo.PlanosAlimentares
          WHERE objetivo_id = @objectiveId
          ORDER BY CASE refeicao
            WHEN 'Café da manhã' THEN 1
            WHEN 'Lanche da manhã' THEN 2
            WHEN 'Almoço' THEN 3
            WHEN 'Lanche da tarde' THEN 4
            WHEN 'Jantar' THEN 5
            ELSE 6
          END, id
        `);

      await transaction.commit();

      const refeicoes = meals.recordset;
      return Response.json({
        objetivo,
        refeicoes,
        caloriasAproximadas: refeicoes.reduce(
          (total: number, meal: { calorias_aprox: number | null }) =>
            total + (meal.calorias_aprox ?? 0),
          0,
        ),
        observacao:
          'Sugestão geral, não é uma dieta clínica. As calorias são estimativas e não consideram necessidades individuais, alergias ou restrições.',
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[menu alimentar] Falha ao desfazer transação:', rollbackError);
      }
      throw error;
    }
  } catch (error) {
    return databaseErrorResponse(error, 'consulta do menu alimentar');
  }
}
