import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox'; 
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http'; 
import {
  CloudAppRestService, CloudAppEventsService, CloudAppSettingsService, CloudAppConfigService, Entity, PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

// https://jira.exlibrisgroup.com/browse/URM-129182
// https://ideas.exlibrisgroup.com/forums/308173-alma/suggestions/17421160-it-would-be-helpful-if-there-were-an-option-to-pr
export class MainComponent implements OnInit {

  private pageLoad$: Subscription;
  private xsl: string;
  bibHash: { [index: string]: any; } = {};
  bib: any;
  pageEntities: Entity[];
  bibEntities: Entity[];
  formattedRecord: string; 
  numRecordsToPrint: number;

  constructor(private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private settingsService: CloudAppSettingsService,
    private configService: CloudAppConfigService,
    private readonly http: HttpClient) { }

  ngOnInit() {
    this.eventsService.getPageMetadata().subscribe(this.onPageLoad);
    this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
    this.loadXsl();
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  onPageLoad = (pageInfo: PageInfo) => {
    this.bibEntities = (pageInfo.entities||[]).filter(e=>['BIB_MMS', 'IEP', 'BIB'].includes(e.type));
  }

  loadXsl() {
    let xslFilepath: string = 'assets/' + 'MARC21slim2English.xsl'; // default
    this.settingsService.get().subscribe( response => {
      console.log("Got the settings :");
      console.log(response);
      if (response.xslFile) {
        xslFilepath = 'assets/' + response.xslFile;
      }
      if (xslFilepath.endsWith(".xsl")) {
        this.http.get(xslFilepath, { responseType: 'application' as 'json'}).subscribe(data => {
          console.log("Load: "+ xslFilepath);
          this.xsl = data.toString();  
        })
      } else {
        // XSL configured by the Inst admin - load from the config.
        this.configService.get().subscribe( response => {
          console.log("Got the config:");
          console.log(response);
          this.xsl = response.customXsls[0].xsl;
        },
        err => console.log(err.message));    
      }
    },
    err => console.log(err.message));
  }

  xsltOnBib(bib: any) : string {
    let xml: string = bib.anies;
    let xmlDoc = (new DOMParser()).parseFromString(xml, 'text/xml');
    let xslDoc = (new DOMParser()).parseFromString(this.xsl, 'text/xml');
    let processor = new XSLTProcessor();
    processor.importStylesheet(xslDoc); // from https://github.com/krtnio/angular-xslt
    let  output = (new XMLSerializer()).serializeToString(processor.transformToFragment(xmlDoc, document));
    return output;
  }

  xsltOnCollection(bibCollectionXml: any) : string {
    //console.log("bibCollectionXml:"+bibCollectionXml);
    //console.log("this.xsl:"+this.xsl);
    let xmlDoc = (new DOMParser()).parseFromString(bibCollectionXml, 'text/xml');
    let xslDoc = (new DOMParser()).parseFromString(this.xsl, 'text/xml');
    let processor = new XSLTProcessor();
    processor.importStylesheet(xslDoc); // from https://github.com/krtnio/angular-xslt
    let  output = (new XMLSerializer()).serializeToString(processor.transformToFragment(xmlDoc, document));
    //console.log("output:"+output);
    return output;
  }

  singleRecMarcXml(bibRec: any) : string {
    let marcXml: string = String(bibRec.anies);
    marcXml = marcXml.replace("<?xml version=\"1.0\" encoding=\"UTF-16\"?>","");

    // enriching the MARCXML with additional useful fields
    marcXml = marcXml.replace("</record>","<mms_id>"+bibRec.mms_id+"</mms_id>"+"</record>");
    marcXml = marcXml.replace("</record>","<title>"+bibRec.title+"</title>"+"</record>");
    marcXml = marcXml.replace("</record>","<author>"+bibRec.author+"</author>"+"</record>");
    
    return marcXml;
  }


  printPreviewNewTab() {
    let innerHtml: string = "";
    let xmlAllBibs: string = "";
    for (let key in this.bibHash) {
      xmlAllBibs = xmlAllBibs + this.singleRecMarcXml(this.bibHash[key]);
    }       
    innerHtml = this.xsltOnCollection("<collection>" + xmlAllBibs + "</collection>"); 

    let Pagelink = "about:blank";
    let pwa = window.open(Pagelink, "_new");
    pwa.document.open();
    pwa.document.write(innerHtml);
    pwa.document.close();
  }

  clearSelected() {
    this.bibHash = {};
    this.numRecordsToPrint = 0;
  }

  listChange(e: MatCheckboxChange){
    console.log({mmsId: e.source.value, checked: e.checked});
    if (e.checked) {
      this.restService.call(`/bibs/${e.source.value}`).subscribe( bib => {
        this.bibHash[e.source.value] = bib;
        this.formattedRecord = this.xsltOnCollection("<collection>" + this.singleRecMarcXml(bib) + "</collection>"); 
        this.bib = (bib.record_format=='marc21') ? bib : null;
        this.numRecordsToPrint = Object.keys(this.bibHash).length;
      },
      err => console.log(err.message));
    } else {
      this.formattedRecord = "";
      delete this.bibHash[e.source.value];
      this.numRecordsToPrint = Object.keys(this.bibHash).length;
    }
  }
 
}

