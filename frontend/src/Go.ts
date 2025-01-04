import { CreateProject, DeleteProject, GetProjects } from '../wailsjs/go/main/App'

export default class Go {
  static getProjects = GetProjects
  static createProject = CreateProject
  static deleteProject = DeleteProject
}
