
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { Angular2InjectionTokens } from 'pluginlib/inject-resources';

// import {MvdURIService} from "com.rs.mvd.ng2.mvduri";

@Injectable()
export class ConfigurationService {
  // readonly DBBROWSER_URL = '/ZLUX/plugins/com.rs.configjs/services/data/com.rs.zoe.dbbrowser/';
    // readonly DBBROWSER_URL = '/ZLUX/pluginsStorage/com.rs.zoe.dbbrowser/';

  // constructor(private http: Http, private mvdUri: MvdURIService){}
  constructor(private http: Http,
  @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION) private pluginDefinition: ZLUX.ContainerPluginDefinition,

){}

  executePutRequest(path: string, scope: string, params: any, fileName: string): Observable<any> {

    // let uri = this.mvdUri.configURI(path, scope);

    // mvdUri module is not available to ng2 virtualdesktop yet
    // So here is the hack to get the uri
    let uri = ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(),scope,path,fileName);

    if (typeof params === 'object') {
      return this.http.put(uri, JSON.stringify(params));
    } else {
      return this.http.put(uri, params);
    }
  }

  executeGetQuery(path: string, scope: string, params: any): Observable<any> {
    // let uri = this.mvdUri.configURI(path, scope);

    // mvdUri module is not available to ng2 virtualdesktop yet
    // So here is the hack to get the uri
    // let uri = this.DBBROWSER_URL + scope + '/' + path;
    let uri = ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(),scope,path,params);

    let headers = new Headers({'Content-Type': 'application/json'});
    let options = new RequestOptions({headers: headers});
    return this.http.get(uri, options);
  }
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
