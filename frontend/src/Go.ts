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
  GetPort,
  GetProjects,
  GetServerStatus,
  GetSQLHistory,
  GetTables,
  GetTableSchema,
  OpenPlanetInVSCode,
  OpenProjectInVSCode,
  RestartServer,
  RunBash,
  SaveApex,
  SaveSQLQuery,
  StartDevServer,
  StartServer,
  StopDevServer,
  StopServer,
  UpdatePort,
} from '../wailsjs/go/main/App'

export default class Go {
  static projects = {
    get: GetProjects,
    create: CreateProject,
    delete: DeleteProject,
    open: OpenProjectInVSCode,
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
}
