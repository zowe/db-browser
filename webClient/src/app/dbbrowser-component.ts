
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, Inject, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import * as ace from 'brace';
import 'brace/theme/xcode';
import 'brace/mode/sql';

import * as csvStringify from 'csv-stringify'

import { Angular2InjectionTokens, Angular2PluginWindowActions, Angular2PluginWindowEvents } from 'pluginlib/inject-resources';
import { ConfigurationService } from './services/configuration.service';
import { DB2Services } from './services/db2Services';
import { FormGroup, FormControl,Validators } from '@angular/forms';
import { DiscoveryService} from "./services/discovery.service";
import { DiscoveryTable} from "./services/discovery-table";
import { ZluxPopupManagerService, ZluxErrorSeverity } from '@zlux/widgets';
//angular components

import {LabelComponent} from 'carbon-components-angular/input/label.component';
import {TableModel} from 'carbon-components-angular/table/table-model.class';
import {TableItem } from 'carbon-components-angular/table/table-item.class';
import {TableHeaderItem } from 'carbon-components-angular/table/table-header-item.class';
import { Subscription } from 'rxjs/Subscription';
import {PaginationModel} from "carbon-components-angular/pagination/pagination-model.class";
import {Pagination} from "carbon-components-angular/pagination/pagination.component";
import {Button} from "carbon-components-angular/button/button.directive" ;
import { PortValidator } from './dbbrowser-validators/config.validator.component';

const logger: ZLUX.ComponentLogger = ZoweZLUX.logger.makeComponentLogger("db-browser");

@Component({
  selector: 'dbbrowser',
  templateUrl: 'dbbrowser-component.html',
  styleUrls: ['dbbrowser-component.scss'],
  providers: [DB2Services, ConfigurationService,PortValidator]
})

export class DbBrowserComponent implements OnInit, AfterViewInit {
  
  // scope: any;
  viewChangeSystemModal : boolean;
  viewAddConnectionModal:boolean;

  readonly PATH = 'db2';
  readonly INSTANCE = 'instance';
  readonly USER = 'user';
  readonly DEFAULT_PORT_FILE = 'db2default.json';

  readonly DEFAULT_PAGE_LENGTH=10;
 
  showResultTable: boolean = false;
  notOkToQuery: boolean = false;
  resultNotReady: boolean = false;

  private columnMetaData: any = null;
  private rows: any = null;
  private editorElement: any;
  dbbrowserParameters: any;
  private editor: any;
  private error_msg: any;
   
  private resultTableModel:TableModel;
  private paginationModel: PaginationModel;
  private defSubmitObservable: Observable<any>;

 
  private	manuallyAddedConnections:Map<string, any>;
  private	connections:Map<string, any>;

  connectionsDisplay:any;
  private	manuallyAddedConnectionsDisplay:any;

  private currentSQL:string;
  private recentSQLs:string[];
  
  private isConnectionSelected : boolean;
  
 
  private profileForm = new FormGroup({
    address:new FormControl('',Validators.required),
    nickname:new FormControl('',Validators.required),
    username:new FormControl('',Validators.required),
    password:new FormControl('',Validators.required),
    port: new FormControl('',PortValidator.range(1, 65535)),
    database: new FormControl('',Validators.required),
    zssAddress:new FormControl({value:'',disabled: true}),
  });
  
  @ViewChild('connectionDropDown') connectionDropDown;
  @ViewChild('sendQueryButton') sendQueryButton;
  
  private defaultPath:string = this.PATH + this.DEFAULT_PORT_FILE;
  private _docType: string;
  private def_metadata: string;
  private def_docType: string;
  
  constructor(
              private popupManager: ZluxPopupManagerService,
              private db2Service: DB2Services,
              private element: ElementRef,
              private configService: ConfigurationService,
              private discoveryService: DiscoveryService,
              @Inject(Angular2InjectionTokens.WINDOW_ACTIONS) private windowAction: Angular2PluginWindowActions,
              @Inject(Angular2InjectionTokens.LAUNCH_METADATA) private launchMetadata: any,
              @Inject(Angular2InjectionTokens.WINDOW_EVENTS) private windowEvents: Angular2PluginWindowEvents) {
    
    popupManager.setLogger(logger);
    
  }
 
  ngOnInit(): void {
    
    // Initialize the ace.io editor
    this.editorElement = this.element.nativeElement.querySelector("#queryArea");
    this.editor = ace.edit(this.editorElement);
    this.editor.setFontSize(14);
    this.editor.$blockScrolling = Infinity;
    this.editor.setTheme("ace/theme/xcode");
    this.editor.session.setMode('ace/mode/sql');
    this.resultTableModel = new TableModel();
    this.paginationModel = new PaginationModel();
    this.connections = new Map();
    this.manuallyAddedConnections= new Map();
    this.connectionsDisplay = [];
    this.manuallyAddedConnectionsDisplay = [];

    this.disableSendQueryButton(true);
    this.isConnectionSelected=false;
    this.recentSQLs=[];
    this.editor.commands.addCommand({
      name: 'myCommand',
      bindKey: {win: 'Ctrl-Enter', mac: 'Command-Enter'},
      readOnly: true // false if this command should not apply in readOnly mode
    });
    
    if (this.launchMetadata != null && this.launchMetadata.data) {
      this.dbbrowserParameters = null;
      var metadata = this.launchMetadata.data;
      switch (metadata.type) {
      case "launch":{
        this.dbbrowserParameters = metadata.dbbrowserParameters;
        let dbbrowserTitle = "DB-Browser, Connected to : " + this.dbbrowserParameters.address;
        this.windowAction.setTitle(dbbrowserTitle);
        break;
      }
       default:
        
      }
    } else {
      this.dbbrowserParameters={};
      this.discoveryService.connect().subscribe(
        result => {
          if(result.zssServerHostName && result.zssPort){
            this.profileForm.patchValue({
            zssAddress: result.zssServerHostName 
            });           
          }
        },
      (e: any) => {
        if (e && e.message){
          logger.warn('Fail to connect to proxy server '+ e.message)
        } else {
          logger.warn('Fail to connect to proxy server ');
        }
       } 
      );
      this.changeSystemModal();

      
      this.configService.executeGetQuery(this.PATH, this.INSTANCE, this.DEFAULT_PORT_FILE)
        .map(res=>res.json())
        .subscribe(
          data=>{
            this.dbbrowserParameters = data.contents;   
            this.dbbrowserParameters.address = data.contents.zssAddress;
            this.profileForm.patchValue({
              username: this.dbbrowserParameters.user 
            });    
            this.def_docType = data._objectType;
            this.def_metadata = data._metadataVersion;
          },
          e=>{
            if (e && e.message){
              logger.warn('Fail to get configuration file'+ e.message)
            } else {
              logger.warn('Fail to get configuration file');
            }
          } 
      );
    }
  }
  
  changeSystemModal(){
    if (this.viewChangeSystemModal){
      this.viewChangeSystemModal=false;
    } else {
      this.viewChangeSystemModal=true;
    }
  }
  
  addConnectionModal(){
    if (this.viewAddConnectionModal){
      this.viewAddConnectionModal=false;
    } else {
      this.viewAddConnectionModal=true;
    }
  }
  
 
  //connect to local host. load connections from db discovery
  connect(){
    let defConfig: any = {};
    defConfig._docType = this.def_docType;
    defConfig._metadataVersion = this.def_metadata;
    defConfig = this.profileForm.getRawValue();
    defConfig.password=""
    
    this.defSubmitObservable = this.configService.executePutRequest(this.PATH, this.INSTANCE, defConfig, this.DEFAULT_PORT_FILE);
 
    this.defSubmitObservable.subscribe((res:Array<any>) => {
      this.changeSystemModal(); 
    });
    
    //this should be a different api call in the future when supporting multi-zss server connections.
    this.discoveryService.connect().subscribe(
      (result) =>  {
        this.onLoadConnections(result);
        this.dbbrowserParameters.user=this.profileForm.get("username").value;
        this.dbbrowserParameters.pass=this.profileForm.get("password").value;
        let dbbrowserTitle = "db-browser, connected to : " + this.dbbrowserParameters.address;
        this.windowAction.setTitle(dbbrowserTitle);
      },
      (e: any) =>{
        if (e && e.message){
          logger.warn('Fail to connect to proxy server'+ e.message)
        } else {
          logger.warn('Fail to connect to proxy server ');
        }
      }
    ); 
  }
  
  onLoadConnections(zssHostInfo:any) {
    if (this.dbbrowserParameters.address && this.dbbrowserParameters.pass && this.dbbrowserParameters.user) {
      this.connectionsDisplay = [];
      this.connectionsDisplay = this.manuallyAddedConnectionsDisplay;
      this.connections = new Map();
    
    }
    this.discoveryService.getAll().subscribe(
      (discoveryTable: DiscoveryTable) => this.loadDiscoveryTable(discoveryTable),
      (e: any) => {
        if (e && e.message){
          logger.warn('fail to load discovery table '+ e.message)
        } else {
          logger.warn('fail to load discovery table ');
        }
      }
    );
  }
 
  loadDiscoveryTable(discoveryTable: DiscoveryTable) {
    let rows = discoveryTable.rows;
    for (let i = 0; i < rows.length; i++){
      let subsystem= rows[i];
      if (subsystem.isActive){
        this.connections.set(subsystem.subsystemName,subsystem);
        let displayName= subsystem.subsystemName+" (Db2 for z/OS)"
        let connection = {
          key:subsystem.subsystemName,
          content:displayName,
          selected:false,
        }
        this.connectionsDisplay.push(connection);
      }
    }
    logger.info('loaded ' + this.connectionsDisplay.length+" active connections via zss discovery service");
    logger.debug('loaded ' + JSON.stringify(this.connectionsDisplay));

    if (this.connectionDropDown && this.connectionDropDown.view){
      this.connectionDropDown.view.updateList(this.connectionsDisplay);
    }
  }

  // selecting from the drop down menu
  onSelectConnection(value){

    if (value && value.item){
      if (value.item.isManuallyAdded){
        let connectionDetail = this.manuallyAddedConnections.get(value.item.key);
        if (connectionDetail.database==this.dbbrowserParameters.database){
          this.dbbrowserParameters.port=0;
          this.dbbrowserParameters.database="";
          this.isConnectionSelected=false;
          return;
        }  
        this.dbbrowserParameters.port = connectionDetail.port;
        this.dbbrowserParameters.database = connectionDetail.database;
        this.dbbrowserParameters.user = connectionDetail.username;
        this.dbbrowserParameters.pass = connectionDetail.password;
        this.dbbrowserParameters.address = connectionDetail.address;
        this.isConnectionSelected=true;
        this.checkEditor();
      } else {
        let connectionDetail = this.connections.get(value.item.key);
        if (connectionDetail.location==this.dbbrowserParameters.database && connectionDetail.listenerPort==this.dbbrowserParameters.port){
          this.dbbrowserParameters.port=0;
          this.dbbrowserParameters.database="";
          this.isConnectionSelected=false;
          return;
        }  
        this.dbbrowserParameters.address = this.profileForm.get("zssAddress").value;
        this.dbbrowserParameters.port = connectionDetail.listenerPort;
        this.dbbrowserParameters.database = connectionDetail.location;
        this.isConnectionSelected=true;
        this.checkEditor();
      } 
    } else {
      this.isConnectionSelected=false;
    }

  }
 
 
  // manually add connection as discovery service only support local LPAR discovery
  addRemoteConnection(){
    
    let user = this.profileForm.get("username").value;
    let pass = this.profileForm.get("password").value;
    let database = this.profileForm.get("database").value;
    let address = this.profileForm.get("address").value;
    let port = this.profileForm.get("port").value;
    let nickname = this.profileForm.get("nickname").value;
    let displayName = nickname + " @" + address;
    let connection = {
      key:nickname,
      content:displayName,
      isManuallyAdded:true,
      selected:false,
    }
  
    let config = {
      "username":user,
      "password":pass,
      "database":database,
      "address":address,
      "port":port
    } 
    this.connectionsDisplay.push(connection);
    this.manuallyAddedConnections.set(nickname,config);   
    this.manuallyAddedConnectionsDisplay.push(connection);
    logger.info('added remote connection ' + JSON.stringify(connection));

    if (this.connectionDropDown && this.connectionDropDown.view){
      this.connectionDropDown.view.updateList(this.connectionsDisplay);
    }
     
    this.viewAddConnectionModal=false;

  }
  
  
  onPageSelect(pageNumber) {
    this.resultTableModel.data = this.prepareData(pageNumber-1);
    this.paginationModel.currentPage = pageNumber;     
  }
 
  showNewSQLContent(){

    if (this.currentSQL && this.isConnectionSelected){
      this.disableSendQueryButton(false);
      this.editor.setValue(this.currentSQL);
    }
  }
  
  showRecentSQLContent(){
    
    this.currentSQL = this.editor.getValue();
    let rencent = "";
    if (this.recentSQLs && this.recentSQLs.length>0){
      for (let i =this.recentSQLs.length-1;i>=0;i--){
        rencent+=this.recentSQLs[i]+"\r";
      }
      this.editor.setValue(rencent);
    }
    this.disableSendQueryButton(true);
    
  }
 
  disableSendQueryButton(disable){
    this.sendQueryButton.nativeElement.disabled=disable;
  }
  
  onColumnSort(index) {
    let col = this.resultTableModel.header[index];
    if (col.ascending){
      col.ascending=false;
      col.descending=true;
    } else {
      col.ascending=true;
      col.descending=false;
    }
    this.resultTableModel.sort(index);
  }
  
  private prepareData(pageNumber:number) {
 
    let pageLength = this.paginationModel.pageLength;
    let rowLength = this.rows.length;
    let newData = [];
    for (let i=0;i<pageLength;i++){
      let singleRow = [];
      if (pageNumber*pageLength+i<rowLength){
        let row = this.rows[pageNumber*pageLength+i];
      
        for (const key of Object.keys(row)) {
          const cell = row[key];

          singleRow.push(new TableItem({data: cell}));
        }
        newData.push(singleRow);
      } else {
        break;
      }
    }  
  
    return newData;
  }
  
  ngAfterViewInit(): void {
  }

  checkEditor() {
    if(this.editor.getValue() != '' && this.isConnectionSelected){
      this.disableSendQueryButton(false);
    }
  }
  
  
  exportData(){
    csvStringify(this.rows, function(err, output){
      if (err){
        const options = {
          blocking: true
        };
        this.popupManager.reportError(ZluxErrorSeverity.ERROR, "Error: Failed to export table.",err.message+"\n", options);  
        return;
      }
      let csvFile;
      let downloadLink;
      csvFile = new Blob([output], {type: "text/csv"});

      downloadLink = document.createElement("a");
      let date: Date = new Date();
      downloadLink.download = "db_browser_exported "+date.toDateString()+".csv";

      downloadLink.href = window.URL.createObjectURL(csvFile);

      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);

      downloadLink.click();
    })

 
  }
  
  sendQuery() {
    this.resultNotReady = true;
    let myQuery: any = {};
    myQuery.query= this.editor.getValue().replace(/\r?\n|\r/g, ' '); // Replace new lines with spaces
    myQuery.address = this.dbbrowserParameters.address;
    myQuery.port = Number(this.dbbrowserParameters.port);
    myQuery.user = this.dbbrowserParameters.user;
    myQuery.pass = this.dbbrowserParameters.pass;
    myQuery.database = this.dbbrowserParameters.database;
  
    logger.info("sending query to [" + myQuery.database+"] query= ["+myQuery.query+"]");

    //TODO break these services out of the this component
    this.db2Service.query(myQuery)
    .map(res=>res.json())
    .subscribe(
      res => {
      if (res.hasOwnProperty('error')) {
        this.error_msg = res.error;
        this.showResultTable = false;
        this.resultNotReady=false;
        let errorTitle: string = "Error";
        const options = {
          blocking: true
        };
        this.popupManager.reportError(ZluxErrorSeverity.ERROR, errorTitle.toString()+": ",this.error_msg+"\n", options);  
        
      }
      else {
 
        if (this.recentSQLs.length>10){
          this.recentSQLs.shift();
        }
        this.recentSQLs.push(this.editor.getValue());
        this.columnMetaData = res.metaData.columnMetaData;
        this.rows = res.rows.map(x=>Object.assign({}, x));
        this.showResultTable = true;

        let row0 = this.rows[0];
        if (!row0) {
          row0 = [];
        }
        let headerOfTable = [];
 
        for (var i = this.columnMetaData.length - 1,j=0; i >= 0; i--) {
          if (row0.hasOwnProperty(this.columnMetaData[i]["columnIdentifier"]) == false) {
            delete this.columnMetaData.columnMetaData[i];
          }
          let headerValue =this.columnMetaData[j++]["columnIdentifier"];
          let header = new TableHeaderItem({data: headerValue});
          headerOfTable.push(header);
        }
        this.resultTableModel.header = headerOfTable;
      
        
        this.resultNotReady = false;
        this.paginationModel.currentPage=1;
        this.paginationModel.pageLength= this.DEFAULT_PAGE_LENGTH;
        this.paginationModel.totalDataLength=this.rows.length;
        let rowsdata = [];
        
        for (let i=0;i<this.paginationModel.pageLength;i++){
          let singleRow = [];
          if (i<this.rows.length){
            let row = this.rows[i];
            for (const key of Object.keys(row)) {
              const cell = row[key];
              singleRow.push(new TableItem({data: cell}));
            }
            rowsdata.push(singleRow);
          } else {
            break;
          }
        }
        this.resultTableModel.data = rowsdata;
        
      }
    },
    error => {
      this.showResultTable = false;
      this.error_msg = error;
      this.resultNotReady = false;
    });
  }
  

  isDataAvailableToExport(){
    return this.rows!==null;
  }
}


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
