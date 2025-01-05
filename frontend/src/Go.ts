import {
  AddPlanetToProject,
  CreateProject,
  DeletePlanet,
  DeleteProject,
  GetActivePlanets,
  GetDevServersStatus,
  GetPort,
  GetProjects,
  GetServerStatus,
  OpenPlanetInVSCode,
  RestartServer,
  RunBash,
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
}
