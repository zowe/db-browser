
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import {TableModule} from 'carbon-components-angular/table/table.module'
import {PaginationModule} from 'carbon-components-angular/pagination/pagination.module'
import {InputModule} from 'carbon-components-angular/input/input.module'

import {ButtonModule} from 'carbon-components-angular/button/button.module'
import {DiscoveryService} from './services/discovery.service';
import {ModalModule} from 'carbon-components-angular/modal/modal.module';

import {DropdownModule} from 'carbon-components-angular/dropdown/dropdown.module'
import {TabsModule} from 'carbon-components-angular/tabs/tabs.module'

import {ConfigurationService} from './services/configuration.service';
import {DbBrowserComponent} from './dbbrowser-component';

import{IconModule}from 'carbon-components-angular/icon/icon.module';
import { ConfigValidatorModule } from './dbbrowser-validators/config.validator.module';

import { 
ZluxPopupManagerModule,
ZluxPopupWindowModule
} from '@zlux/widgets'

@NgModule({
  imports: [FormsModule, HttpModule, ReactiveFormsModule, CommonModule, ZluxPopupWindowModule,ZluxPopupManagerModule,
    TableModule,PaginationModule,InputModule,ButtonModule,DropdownModule,TabsModule,ModalModule,IconModule],
  declarations: [DbBrowserComponent],
  providers: [ConfigurationService,DiscoveryService,ConfigValidatorModule],
  exports: [ DbBrowserComponent],
  entryComponents: [DbBrowserComponent ]
})
export class DbBrowserModule { }


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
