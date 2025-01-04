export namespace main {
	
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

}

