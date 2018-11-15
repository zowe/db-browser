

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import {Injectable, Inject} from '@angular/core';
import {Http, Response, Headers} from '@angular/http';
import {Observable} from 'rxjs/Rx';

import { Angular2InjectionTokens } from 'pluginlib/inject-resources';

import {XhrBase} from './xhr-base';
import {DiscoveryTable} from './discovery-table';

export interface GetOptions {
  uri: string;
}

@Injectable()
export class DiscoveryService extends XhrBase<DiscoveryTable> {
  private url:string = '';

  constructor(
    public http: Http,
    @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION) private pluginDefinition: ZLUX.ContainerPluginDefinition) {
    super(http);
  }

  connect():Observable<any> {
    let url = ZoweZLUX.uriBroker.serverRootUri("proxiedHostInfo");
    let result = this.http
      .get(url, XhrBase.getHeaders())
      .map((response: Response) => response.json())
      .catch(XhrBase.handleError);

    return result as Observable<any>;
  }
  
 


  getAll(): Observable<DiscoveryTable> {
    
    let url = ZoweZLUX.uriBroker.pluginRESTUri(this.pluginDefinition.getBasePlugin(),"subsystemsService","zosDiscovery/naive/db2/configuration");

    let result = this.http
      .get(url, XhrBase.getHeaders())
      .map((response: Response) => response.json() as DiscoveryTable)
      .catch(XhrBase.handleError);
 

    return result as Observable<DiscoveryTable>;
  }
}


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

