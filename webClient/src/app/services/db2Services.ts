
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
 
import { Injectable, Inject } from '@angular/core';
import { Http} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Angular2InjectionTokens } from 'pluginlib/inject-resources';

@Injectable()
export class DB2Services {

  constructor(private http: Http,
  @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION) private pluginDefinition: ZLUX.ContainerPluginDefinition){
    
  }
  query(query: any): Observable<any> {

    const requestBody = {
      "_objectType"      : "org.zowe.dbbrowser.db2.request.query",
      "_metaDataVersion" : "1.0.0",
      "query"            : query.query,
      "database"         : query.database,
      "hostname"         : query.address,
      "uid"              : query.user,
      "password"         : query.pass,
      "port"             : query.port,
      "protocol"         : "TCPIP"
    }
    const url =  ZoweZLUX.uriBroker.pluginRESTUri(this.pluginDefinition.getBasePlugin(),"db2Service","");
    return this.http.post(url, requestBody);
  }
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
