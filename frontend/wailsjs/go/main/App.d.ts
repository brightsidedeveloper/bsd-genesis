// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function AddPlanetToProject(arg1:string,arg2:string):Promise<void>;

export function ApplyStash(arg1:string,arg2:number):Promise<void>;

export function ConnectDB(arg1:string):Promise<void>;

export function CreateBranch(arg1:string,arg2:string):Promise<void>;

export function CreateProject(arg1:main.NewProjectOptions):Promise<void>;

export function CreateTable(arg1:string,arg2:string,arg3:{[key: string]: string}):Promise<void>;

export function DeleteCurrentBranch(arg1:string):Promise<void>;

export function DeletePlanet(arg1:string,arg2:string):Promise<void>;

export function DeleteProject(arg1:string):Promise<void>;

export function DeleteSQLQuery(arg1:string,arg2:string):Promise<void>;

export function DeleteStash(arg1:string,arg2:number):Promise<void>;

export function DiscardChanges(arg1:string):Promise<void>;

export function DisconnectDB():Promise<void>;

export function DropTable(arg1:string,arg2:string):Promise<void>;

export function ExecuteSQLQuery(arg1:string,arg2:string):Promise<Array<{[key: string]: any}>>;

export function GenerateCode(arg1:string):Promise<void>;

export function GetActivePlanets(arg1:string):Promise<Array<main.ClientApp>>;

export function GetAllBranches(arg1:string):Promise<Array<string>>;

export function GetAllStashes(arg1:string):Promise<Array<main.GitStashItem>>;

export function GetApex(arg1:string):Promise<main.ApexData>;

export function GetCommitHistory(arg1:string,arg2:number):Promise<Array<string>>;

export function GetCurrentBranch(arg1:string):Promise<string>;

export function GetDSN(arg1:string):Promise<string>;

export function GetDevServersStatus(arg1:string):Promise<main.DevServerStatus>;

export function GetEnvVariable(arg1:string):Promise<string>;

export function GetGitStatus(arg1:string):Promise<string>;

export function GetPort(arg1:string):Promise<string>;

export function GetProjects():Promise<Array<main.ProjectInfo>>;

export function GetSQLHistory(arg1:string):Promise<main.SQLQueryHistory>;

export function GetServerStatus(arg1:string):Promise<main.ServerStatus>;

export function GetTableSchema(arg1:string,arg2:string):Promise<{[key: string]: string}>;

export function GetTables(arg1:string):Promise<Array<string>>;

export function GitCommit(arg1:string,arg2:string):Promise<void>;

export function InitGitRepo(arg1:string):Promise<void>;

export function LoadEnv():Promise<void>;

export function MergeBranch(arg1:string,arg2:string,arg3:string):Promise<void>;

export function OpenBrowser(arg1:string):Promise<void>;

export function OpenPlanetInVSCode(arg1:string,arg2:string):Promise<void>;

export function OpenProjectInVSCode(arg1:string):Promise<void>;

export function PickGenesisPath():Promise<string>;

export function RestartServer(arg1:string):Promise<void>;

export function RunBash(arg1:string,arg2:string,arg3:string):Promise<string>;

export function SaveApex(arg1:string,arg2:main.ApexData):Promise<void>;

export function SaveEnvVariable(arg1:string,arg2:string):Promise<void>;

export function SaveSQLQuery(arg1:string,arg2:string):Promise<void>;

export function StartDevServer(arg1:string,arg2:string):Promise<string>;

export function StartServer(arg1:string):Promise<void>;

export function StashChanges(arg1:string,arg2:string):Promise<void>;

export function StopDevServer(arg1:string,arg2:string):Promise<string>;

export function StopServer(arg1:string):Promise<void>;

export function SwitchBranch(arg1:string,arg2:string):Promise<void>;

export function UpdatePort(arg1:string,arg2:string):Promise<void>;
