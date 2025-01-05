import {
  AddPlanetToProject,
  CreateProject,
  DeleteProject,
  GetActivePlanets,
  GetPort,
  GetProjects,
  GetServerStatus,
  OpenPlanetInVSCode,
  RestartServer,
  StartServer,
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
    open: OpenPlanetInVSCode,
  }
}
