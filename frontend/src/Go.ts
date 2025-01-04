import {
  CreateProject,
  DeleteProject,
  GetPort,
  GetProjects,
  GetServerStatus,
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
}
