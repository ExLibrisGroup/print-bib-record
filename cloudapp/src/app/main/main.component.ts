import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox'; 
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http'; 
import {
  CloudAppRestService, CloudAppEventsService, CloudAppSettingsService, Entity, PageInfo
} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

// https://jira.exlibrisgroup.com/browse/URM-129182
// https://ideas.exlibrisgroup.com/forums/308173-alma/suggestions/17421160-it-would-be-helpful-if-there-were-an-option-to-pr
// https://www.loc.gov/standards/marcxml/xslt/MARC21slim2English.xsl
export class MainComponent implements OnInit {

  private pageLoad$: Subscription;
  private xsl: string;
  bibHtmls: { [index: string]: any; } = {};
  bib: any;
  pageEntities: Entity[];
  bibEntities: Entity[];
  formattedRecord: string; 
  numRecordsToPrint: number;

  constructor(private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private settingsService: CloudAppSettingsService,
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
      if (response.xslFile)
        xslFilepath = 'assets/' + response.xslFile;
        
      this.http.get(xslFilepath, { responseType: 'application' as 'json'}).subscribe(data => {
        console.log("Load: "+ xslFilepath);
        this.xsl = data.toString();  
      })
    },
    err => console.log(err.message));
  }

  xsltOnBib(bib: any) : string {
    //var xml = new DOMParser().parseFromString(bib.anies, "application/xml");  console.log(xml);
    let xml: string = bib.anies;
    let xmlDoc = (new DOMParser()).parseFromString(xml, 'text/xml');
    let xslDoc = (new DOMParser()).parseFromString(this.xsl, 'text/xml');
    let processor = new XSLTProcessor();
    processor.importStylesheet(xslDoc); // from https://github.com/krtnio/angular-xslt
    let  output = (new XMLSerializer()).serializeToString(processor.transformToFragment(xmlDoc, document));
    return output;
  }

  printPreviewNewTab() {
    let innerHtml: string = "";
    for (let key in this.bibHtmls) {
      let value:string = this.bibHtmls[key];
      innerHtml += "<div>__________________ mms-id: "+ key + "<br/>" + value + "</div>" ; 
    }       

    let Pagelink = "about:blank";
    let pwa = window.open(Pagelink, "_new");
    pwa.document.open();
    pwa.document.write(innerHtml);
    pwa.document.close();
  }

  listChange(e: MatCheckboxChange){
    console.log({mmsId: e.source.value, checked: e.checked});
    if (e.checked) {
      this.restService.call(`/bibs/${e.source.value}`).subscribe( bib => {
        this.bib = (bib.record_format=='marc21') ? bib : null;
        let htmlBib: string = this.xsltOnBib(bib);
        this.formattedRecord = htmlBib;
        this.bibHtmls[e.source.value] = htmlBib;
        this.numRecordsToPrint = Object.keys(this.bibHtmls).length;
      },
      err => console.log(err.message));
    } else {
      this.formattedRecord = "";
      delete this.bibHtmls[e.source.value];
      this.numRecordsToPrint = Object.keys(this.bibHtmls).length;
    }
  }
 
}

