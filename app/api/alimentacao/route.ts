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

type MealOption = {
  nivel: string;
  icone: string;
  titulo: string;
  descricao: string;
};

function getMealOptions(meal: string): MealOption[] {
  if (meal === 'Café da manhã') {
    return [
      { nivel: 'Econômica', icone: '🍌', titulo: 'Cuscuz, ovos e banana', descricao: 'Cuscuz com 2 ovos e uma banana da estação.' },
      { nivel: 'Equilibrada', icone: '🥣', titulo: 'Aveia, leite e ovos', descricao: 'Aveia com leite e banana, acompanhada de 2 ovos.' },
      { nivel: 'Completa', icone: '🍓', titulo: 'Iogurte, frutas e aveia', descricao: 'Iogurte natural, frutas, aveia e ovos mexidos.' },
    ];
  }
  if (meal === 'Lanche da manhã') {
    return [
      { nivel: 'Econômica', icone: '🍎', titulo: 'Fruta com amendoim', descricao: 'Uma fruta da estação com um punhado pequeno de amendoim.' },
      { nivel: 'Equilibrada', icone: '🥛', titulo: 'Iogurte com aveia', descricao: 'Iogurte natural com aveia e fruta picada.' },
      { nivel: 'Completa', icone: '🧀', titulo: 'Queijo, fruta e castanhas', descricao: 'Queijo branco, fruta fresca e algumas castanhas.' },
    ];
  }
  if (meal === 'Almoço') {
    return [
      { nivel: 'Econômica', icone: '🍛', titulo: 'Arroz, feijão e ovos', descricao: 'Arroz, feijão, 2 ovos e legumes ou verduras da estação.' },
      { nivel: 'Equilibrada', icone: '🍗', titulo: 'Frango e prato feito', descricao: 'Arroz, feijão, frango grelhado e salada variada.' },
      { nivel: 'Completa', icone: '🐟', titulo: 'Peixe, grãos e vegetais', descricao: 'Peixe, arroz integral ou quinoa, legumes e salada.' },
    ];
  }
  if (meal === 'Lanche da tarde') {
    return [
      { nivel: 'Econômica', icone: '🥚', titulo: 'Pão com ovo', descricao: 'Pão (integral ou comum) com ovo e tomate.' },
      { nivel: 'Equilibrada', icone: '🥪', titulo: 'Sanduíche de frango', descricao: 'Pão integral com frango desfiado e folhas.' },
      { nivel: 'Completa', icone: '🥑', titulo: 'Iogurte, fruta e sementes', descricao: 'Iogurte natural com fruta, aveia e chia.' },
    ];
  }
  return [
    { nivel: 'Econômica', icone: '🍳', titulo: 'Omelete com legumes', descricao: 'Omelete com legumes da estação e batata ou mandioca.' },
    { nivel: 'Equilibrada', icone: '🍲', titulo: 'Frango, arroz e vegetais', descricao: 'Frango ou sardinha com arroz, feijão e vegetais.' },
    { nivel: 'Completa', icone: '🐠', titulo: 'Peixe e acompanhamento', descricao: 'Peixe, batata ou arroz e uma porção generosa de vegetais.' },
  ];
}

function getObjectiveGuidance(objectiveId: number): string {
  const guidance: Record<number, string> = {
    1: 'Para favorecer o ganho de massa, distribua fontes de proteína ao longo do dia e combine-as com carboidratos que deem energia para treinar. O superávit e as porções devem ser ajustados ao seu corpo.',
    2: 'Para perda de peso, priorize refeições saciantes com proteína, feijão, frutas e vegetais. Evite cortes extremos: um déficit moderado e sustentável é mais importante que pular refeições.',
    3: 'Para recomposição corporal, mantenha proteína em todas as refeições, inclua vegetais e ajuste carboidratos em torno dos treinos sem excluir grupos alimentares.',
    4: 'Para força, mantenha refeições regulares com proteína e carboidratos suficientes para sustentar o treino e a recuperação.',
    5: 'Para resistência, dê atenção aos carboidratos antes e depois das sessões e mantenha hidratação ao longo do dia.',
    6: 'Para saúde e qualidade de vida, varie frutas, verduras, feijões e fontes de proteína; prefira uma rotina que consiga manter.',
    7: 'Para condicionamento, combine refeições variadas com hidratação e energia suficiente para se movimentar e recuperar.',
    8: 'Durante a reabilitação, priorize refeições variadas e suficientes. Restrições, suplementação ou ajustes clínicos devem ser definidos com seu profissional de saúde.',
  };
  return guidance[objectiveId] ?? 'Monte refeições variadas com uma fonte de proteína, alimentos ricos em fibras e porções adequadas à sua rotina.';
}

function getMealsForObjective(objectiveId: number, objective: string): Meal[] {
  const normalizedObjective = objective
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (objectiveId === 1 || /massa|hipertrof|ganho/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Aveia com leite, banana e ovos mexidos.', calories: 500 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com fruta e castanhas.', calories: 300 },
      { name: 'Almoço', description: 'Arroz, feijão, frango grelhado e salada.', calories: 700 },
      { name: 'Lanche da tarde', description: 'Pão integral com queijo branco e uma fruta.', calories: 350 },
      { name: 'Jantar', description: 'Batata, peixe ou frango e legumes variados.', calories: 650 },
    ];
  }

  if (objectiveId === 2 || /emagrec|perda de peso|perder peso|reduzir/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Ovos mexidos, pão integral e uma fruta.', calories: 350 },
      { name: 'Lanche da manhã', description: 'Iogurte natural e uma fruta da estação.', calories: 180 },
      { name: 'Almoço', description: 'Feijão, frango grelhado, salada variada e arroz em porção moderada.', calories: 500 },
      { name: 'Lanche da tarde', description: 'Fruta com iogurte natural.', calories: 180 },
      { name: 'Jantar', description: 'Omelete com legumes e salada.', calories: 400 },
    ];
  }

  if (objectiveId === 4 || /forca/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Pão integral, ovos e banana.', calories: 500 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com aveia e fruta.', calories: 300 },
      { name: 'Almoço', description: 'Arroz, feijão, carne magra e legumes.', calories: 700 },
      { name: 'Lanche da tarde', description: 'Sanduíche integral de frango e uma fruta.', calories: 350 },
      { name: 'Jantar', description: 'Batata, peixe ou frango e salada.', calories: 600 },
    ];
  }

  if (objectiveId === 5 || /resistencia/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Aveia, banana, leite e ovos.', calories: 500 },
      { name: 'Lanche da manhã', description: 'Pão integral com queijo branco e fruta.', calories: 300 },
      { name: 'Almoço', description: 'Arroz, feijão, frango e legumes.', calories: 700 },
      { name: 'Lanche da tarde', description: 'Iogurte com granola e banana.', calories: 350 },
      { name: 'Jantar', description: 'Macarrão integral com atum e vegetais.', calories: 600 },
    ];
  }

  if (objectiveId === 6 || /saude|qualidade de vida/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Pão integral, queijo branco e uma fruta.', calories: 400 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com aveia.', calories: 200 },
      { name: 'Almoço', description: 'Arroz, feijão, proteína grelhada e salada colorida.', calories: 600 },
      { name: 'Lanche da tarde', description: 'Fruta da estação e castanhas.', calories: 200 },
      { name: 'Jantar', description: 'Omelete com legumes e uma porção de batata.', calories: 500 },
    ];
  }

  if (objectiveId === 7 || /condicionamento/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Ovos, pão integral e mamão.', calories: 450 },
      { name: 'Lanche da manhã', description: 'Banana com iogurte natural.', calories: 250 },
      { name: 'Almoço', description: 'Arroz, feijão, frango e legumes variados.', calories: 600 },
      { name: 'Lanche da tarde', description: 'Sanduíche integral com queijo branco.', calories: 250 },
      { name: 'Jantar', description: 'Peixe ou frango, legumes e arroz.', calories: 500 },
    ];
  }

  if (objectiveId === 8 || /reabilitacao|prevencao/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Aveia com leite, fruta e ovos.', calories: 450 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com fruta.', calories: 250 },
      { name: 'Almoço', description: 'Arroz, feijão, proteína grelhada e vegetais.', calories: 600 },
      { name: 'Lanche da tarde', description: 'Pão integral com queijo branco.', calories: 250 },
      { name: 'Jantar', description: 'Sopa de legumes com frango desfiado e batata.', calories: 500 },
    ];
  }

  if (objectiveId === 3 || /recomposicao/.test(normalizedObjective)) {
    return [
      { name: 'Café da manhã', description: 'Ovos mexidos, pão integral e uma fruta.', calories: 450 },
      { name: 'Lanche da manhã', description: 'Iogurte natural com aveia.', calories: 250 },
      { name: 'Almoço', description: 'Arroz, feijão, frango grelhado e salada.', calories: 600 },
      { name: 'Lanche da tarde', description: 'Queijo branco com fruta.', calories: 250 },
      { name: 'Jantar', description: 'Peixe ou frango, legumes e batata.', calories: 500 },
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
      const mealsForGoal = getMealsForObjective(Number(objectiveId), String(objetivo));
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

      for (const meal of mealsForGoal) {
        await new sql.Request(transaction)
          .input('objectiveId', sql.Int, Number(objectiveId))
          .input('meal', sql.VarChar(50), meal.name)
          .input('description', sql.VarChar(800), meal.description)
          .input('calories', sql.Int, meal.calories)
          .query(`
            UPDATE dbo.PlanosAlimentares
            SET descricao = @description, calorias_aprox = @calories
            WHERE id = (
              SELECT MIN(id)
              FROM dbo.PlanosAlimentares
              WHERE objetivo_id = @objectiveId AND refeicao = @meal
            );

            IF @@ROWCOUNT = 0
              INSERT INTO dbo.PlanosAlimentares
                (objetivo_id, refeicao, descricao, calorias_aprox)
              VALUES (@objectiveId, @meal, @description, @calories);

            DELETE FROM dbo.PlanosAlimentares
            WHERE objetivo_id = @objectiveId
              AND refeicao = @meal
              AND id <> (
                SELECT MIN(id)
                FROM dbo.PlanosAlimentares
                WHERE objetivo_id = @objectiveId AND refeicao = @meal
              );
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

      const refeicoes = meals.recordset.map((meal) => ({
        ...meal,
        opcoes: getMealOptions(String(meal.refeicao)),
      }));
      return Response.json({
        objetivo,
        orientacaoObjetivo: getObjectiveGuidance(Number(objectiveId)),
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
