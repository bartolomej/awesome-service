import "reflect-metadata";
import { Connection, createConnection, getConnectionManager } from "typeorm";
import Link from "./repos/entity/link";
import List from "./repos/entity/list";
import Repository from "./repos/entity/repository";
import Website from "./repos/entity/website";
import SearchLog from "./repos/entity/searchlog";

interface TypeormProps {
  host: string;
  port?: number;
  url?: string;
  username: string;
  password: string;
  database: string;
  connectionName?: string
}

export async function create ({
  host = 'localhost',
  connectionName = 'default',
  url,
  username,
  password,
  database,
  port = 3306
}: TypeormProps): Promise<Connection> {
  // @ts-ignore
  return await createConnection({
    type: "mysql",
    charset: "utf8mb4_unicode_ci",
    insecureAuth: true,
    host,
    port,
    username,
    password,
    database,
    url,
    entities: [
      Link,
      List,
      Repository,
      Website,
      SearchLog
    ],
    synchronize: true,
    // migrationsRun: true, // autorun migrations
    logging: false,
    // https://github.com/typeorm/typeorm/issues/390
    cli: {
      migrationsDir: 'repos/migration'
    },
    migrations: ["repos/migration/*.js"],
    extra: {
      charset: "utf8mb4_unicode_ci",
    }
  });
}

export async function close (name = "default") {
  const connectionManager = getConnectionManager();
  if (connectionManager.has(name)) {
    await connectionManager.get(name).close();
  }
}
