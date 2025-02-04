export namespace main {
	
	export class Operation {
	    name: string;
	    endpoint: string;
	    method: string;
	    querySchema?: string;
	    bodySchema?: string;
	    responseSchema?: string;
	
	    static createFrom(source: any = {}) {
	        return new Operation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.endpoint = source["endpoint"];
	        this.method = source["method"];
	        this.querySchema = source["querySchema"];
	        this.bodySchema = source["bodySchema"];
	        this.responseSchema = source["responseSchema"];
	    }
	}
	export class Schema {
	    name: string;
	    type: string;
	    fields: number[];
	    required?: string[];
	
	    static createFrom(source: any = {}) {
	        return new Schema(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.fields = source["fields"];
	        this.required = source["required"];
	    }
	}
	export class Endpoint {
	    path: string;
	    methods: string[];
	    secured: string[];
	
	    static createFrom(source: any = {}) {
	        return new Endpoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.methods = source["methods"];
	        this.secured = source["secured"];
	    }
	}
	export class ApexData {
	    endpoints: Endpoint[];
	    schemas: Schema[];
	    operations: Operation[];
	
	    static createFrom(source: any = {}) {
	        return new ApexData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.endpoints = this.convertValues(source["endpoints"], Endpoint);
	        this.schemas = this.convertValues(source["schemas"], Schema);
	        this.operations = this.convertValues(source["operations"], Operation);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ClientApp {
	    type: string;
	    exists: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ClientApp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.exists = source["exists"];
	    }
	}
	export class DevServerStatus {
	    web: boolean;
	    mobile: boolean;
	    desktop: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DevServerStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.web = source["web"];
	        this.mobile = source["mobile"];
	        this.desktop = source["desktop"];
	    }
	}
	
	export class GitStashItem {
	    index: number;
	    hash: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new GitStashItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.hash = source["hash"];
	        this.message = source["message"];
	    }
	}
	export class NewProjectOptions {
	    dir: string;
	    name: string;
	    database: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new NewProjectOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dir = source["dir"];
	        this.name = source["name"];
	        this.database = source["database"];
	        this.description = source["description"];
	    }
	}
	
	export class ProjectData {
	    name: string;
	    database: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.database = source["database"];
	        this.description = source["description"];
	    }
	}
	export class ProjectInfo {
	    dir: string;
	    project: ProjectData;
	
	    static createFrom(source: any = {}) {
	        return new ProjectInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dir = source["dir"];
	        this.project = this.convertValues(source["project"], ProjectData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SQLQuery {
	    id: string;
	    timestamp: string;
	    query: string;
	
	    static createFrom(source: any = {}) {
	        return new SQLQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.query = source["query"];
	    }
	}
	export class SQLQueryHistory {
	    queries: SQLQuery[];
	
	    static createFrom(source: any = {}) {
	        return new SQLQueryHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.queries = this.convertValues(source["queries"], SQLQuery);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ServerStatus {
	    db: string;
	    server: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.db = source["db"];
	        this.server = source["server"];
	    }
	}

}

