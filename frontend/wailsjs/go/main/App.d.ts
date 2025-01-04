// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function CreateProject(arg1:main.NewProjectOptions):Promise<void>;

export function DeleteProject(arg1:string):Promise<void>;

export function GetPort(arg1:string):Promise<string>;

export function GetProjects():Promise<Array<main.ProjectInfo>>;

export function GetServerStatus(arg1:string):Promise<main.ServerStatus>;

export function RestartServer(arg1:string):Promise<void>;

export function StartServer(arg1:string):Promise<void>;

export function StopServer(arg1:string):Promise<void>;

export function UpdatePort(arg1:string,arg2:string):Promise<void>;
