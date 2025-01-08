import {
  AddPlanetToProject,
  ConnectDB,
  CreateProject,
  CreateTable,
  DeletePlanet,
  DeleteProject,
  DeleteSQLQuery,
  DisconnectDB,
  DropTable,
  ExecuteSQLQuery,
  GenerateCode,
  GetActivePlanets,
  GetApex,
  GetDevServersStatus,
  GetEnvVariable,
  GetGitStatus,
  GetPort,
  GetProjects,
  GetServerStatus,
  GetSQLHistory,
  GetTables,
  GetTableSchema,
  GitCommit,
  OpenBrowser,
  OpenPlanetInVSCode,
  OpenProjectInVSCode,
  PickGenesisPath,
  RestartServer,
  RunBash,
  SaveApex,
  SaveEnvVariable,
  SaveSQLQuery,
  StartDevServer,
  StartServer,
  StopDevServer,
  StopServer,
  UpdatePort,
} from '../wailsjs/go/main/App'

export default class Go {
  static app = {
    openBrowser: OpenBrowser,
    env: {
      get: GetEnvVariable,
      set: SaveEnvVariable,
    },
  }
  static projects = {
    get: GetProjects,
    create: CreateProject,
    delete: DeleteProject,
    open: OpenProjectInVSCode,
    changeDir: PickGenesisPath,
  }
  static server = {
    start: StartServer,
    stop: StopServer,
    restartServer: RestartServer,
    status: GetServerStatus,
    getPort: GetPort,
    updatePort: UpdatePort,
  }
  static clients = {
    get: GetActivePlanets,
    create: AddPlanetToProject,
    delete: DeletePlanet,
    open: OpenPlanetInVSCode,
    bash: RunBash,
    startDev: StartDevServer,
    stopDev: StopDevServer,
    devServers: GetDevServersStatus,
  }
  static apex = {
    get: GetApex,
    save: SaveApex,
    generate: GenerateCode,
  }
  static db = {
    connect: ConnectDB,
    disconnect: DisconnectDB,
    tables: GetTables,
    createTable: CreateTable,
    getTablesCols: GetTableSchema,
    dropTable: DropTable,
    query: ExecuteSQLQuery,
  }
  static sqlEditor = {
    get: GetSQLHistory,
    save: SaveSQLQuery,
    del: DeleteSQLQuery,
  }
  static git = {
    status: GetGitStatus,
    commit: GitCommit,
  }
}
