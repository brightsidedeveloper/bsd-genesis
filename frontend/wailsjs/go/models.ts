export namespace main {
	
	export class NewProjectOptions {
	    dir: string;
	    name: string;
	    database: string;
	
	    static createFrom(source: any = {}) {
	        return new NewProjectOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dir = source["dir"];
	        this.name = source["name"];
	        this.database = source["database"];
	    }
	}
	export class ProjectInfo {
	    dir: string;
	    project: {[key: string]: any};
	
	    static createFrom(source: any = {}) {
	        return new ProjectInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dir = source["dir"];
	        this.project = source["project"];
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

