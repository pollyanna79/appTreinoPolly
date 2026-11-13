import sql from 'mssql';

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

type SqlGlobal = typeof globalThis & {
  appTreinoSqlPool?: Promise<sql.ConnectionPool>;
};

const globalForSql = globalThis as SqlGlobal;

function getDatabaseConfig(): sql.config {
  const configuredHost = process.env.DB_HOST?.trim();
  const database = process.env.DB_DATABASE?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_SENHA;

  if (!configuredHost || !database || !user || !password) {
    throw new DatabaseConfigurationError(
      'Configure DB_HOST, DB_DATABASE, DB_USER e DB_SENHA no arquivo .env.',
    );
  }

  const instanceSeparator = /[\\/]/.exec(configuredHost);
  const server = instanceSeparator
    ? configuredHost.slice(0, instanceSeparator.index)
    : configuredHost;
  const instanceFromHost = instanceSeparator
    ? configuredHost.slice(instanceSeparator.index + 1)
    : undefined;
  const instanceName = process.env.DB_INSTANCE?.trim() || instanceFromHost;
  const configuredPort = process.env.DB_PORT?.trim();

  if (!server || (instanceFromHost && process.env.DB_INSTANCE?.trim())) {
    throw new DatabaseConfigurationError(
      'Informe a instância SQL em DB_HOST ou DB_INSTANCE, não nas duas opções.',
    );
  }

  if (instanceName && configuredPort) {
    throw new DatabaseConfigurationError(
      'Use DB_INSTANCE ou DB_PORT, mas não configure ambos ao mesmo tempo.',
    );
  }

  const port = configuredPort ? Number(configuredPort) : undefined;
  if (
    configuredPort &&
    (port === undefined || !Number.isInteger(port) || port < 1 || port > 65535)
  ) {
    throw new DatabaseConfigurationError('DB_PORT precisa ser uma porta válida.');
  }

  return {
    server,
    database,
    user,
    password,
    ...(port ? { port } : {}),
    options: {
      encrypt: false,
      trustServerCertificate: true,
      ...(instanceName ? { instanceName } : {}),
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };
}

export async function getDatabasePool(): Promise<sql.ConnectionPool> {
  let poolPromise = globalForSql.appTreinoSqlPool;

  if (!poolPromise) {
    const pool = new sql.ConnectionPool(getDatabaseConfig());
    poolPromise = pool.connect().catch((error: unknown) => {
      globalForSql.appTreinoSqlPool = undefined;
      throw error;
    });
    globalForSql.appTreinoSqlPool = poolPromise;
  }

  return poolPromise;
}

export async function ensureUserFocusColumn(
  connection: sql.ConnectionPool | sql.Transaction,
): Promise<void> {
  const request =
    connection instanceof sql.Transaction
      ? new sql.Request(connection)
      : connection.request();
  await request.query(`
    DECLARE @lockResult int;
    EXEC @lockResult = sys.sp_getapplock
      @Resource = N'app-treino-user-focus-schema',
      @LockMode = N'Exclusive',
      @LockOwner = N'Session',
      @LockTimeout = 10000;
    IF @lockResult < 0
      THROW 51002, 'Não foi possível preparar as preferências do usuário.', 1;

    BEGIN TRY
      IF COL_LENGTH(N'dbo.Usuarios', N'foco_treino') IS NULL
        ALTER TABLE dbo.Usuarios ADD foco_treino VARCHAR(30) NULL;

      IF EXISTS (SELECT 1 FROM dbo.Usuarios WHERE foco_treino IS NULL)
        UPDATE dbo.Usuarios
        SET foco_treino = CASE
          WHEN objetivo_id = 1 THEN 'pernas-gluteos'
          ELSE 'corpo-inteiro'
        END
        WHERE foco_treino IS NULL;

      EXEC sys.sp_releaseapplock
        @Resource = N'app-treino-user-focus-schema',
        @LockOwner = N'Session';
    END TRY
    BEGIN CATCH
      EXEC sys.sp_releaseapplock
        @Resource = N'app-treino-user-focus-schema',
        @LockOwner = N'Session';
      THROW;
    END CATCH;
  `);
}

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function databaseErrorResponse(
  error: unknown,
  operation: string,
): Response {
  if (error instanceof DatabaseConfigurationError) {
    return Response.json({ error: error.message }, { status: 503 });
  }

  console.error(`[${operation}] Falha ao acessar o SQL Server:`, error);
  const sqlNumber =
    typeof error === 'object' &&
    error !== null &&
    'number' in error &&
    typeof error.number === 'number'
      ? error.number
      : undefined;

  if (sqlNumber === 208) {
    return Response.json(
      {
        error:
          'A tabela esperada não foi encontrada no banco configurado. Confira DB_DATABASE e o schema dbo no SQL Server.',
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      error:
        'Não foi possível concluir a operação no SQL Server. Confira a conexão e os registros do servidor.',
    },
    { status: 500 },
  );
}
