import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox'; 
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http'; 
import {
  CloudAppRestService, CloudAppEventsService, CloudAppSettingsService, CloudAppConfigService, Entity, PageInfo, RestErrorResponse
} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

// https://jira.exlibrisgroup.com/browse/URM-129182
// https://ideas.exlibrisgroup.com/forums/308173-alma/suggestions/17421160-it-would-be-helpful-if-there-were-an-option-to-pr
export class MainComponent implements OnInit {

  private showDebugWin: boolean = false;
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
    this.eventsService.getInitData().subscribe(      data => {
      console.log(data);      
      if (data.user.primaryId === "exl_impl") {
        this.showDebugWin = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  onPageLoad = (pageInfo: PageInfo) => {
    //console.log("onPageLoad pageInfo:");     console.log(pageInfo);
    this.pageEntities = pageInfo.entities;

    this.bibEntities = (pageInfo.entities||[]).filter(e=>['BIB_MMS', 'IEP', 'BIB'].includes(e.type));

    this.getListOfBibsFromListOfItemsOrPortfolios((pageInfo.entities||[]).filter(e=>['ITEM','PORTFOLIO'].includes(e.type)));

    this.getListOfBibsFromListOfPOLs((pageInfo.entities||[]).filter(e=>['PO_LINE'].includes(e.type)));
  }

  getListOfBibsFromListOfItemsOrPortfolios(itemEntities: Entity[]) {
    itemEntities.forEach(itemEntity => {
      if (itemEntity.link) {
        var mmsId: string = itemEntity.link.replace("/bibs/","").replace(/\/holdings\/.*/,"").replace(/\/portfolios\/.*/,"");
        this.restService.call(`/bibs/${mmsId}?view=brief`).subscribe( response => {
            let title: string = response.title ? response.title : "";
            let author: string = response.author ? response.author : "";
            this.bibEntities.push({ id:mmsId, description:title + " " + author });
            this.dedupByMmsId();
        },
        err => console.log(err.message));    
      }
    });
  }

  getListOfBibsFromListOfPOLs(itemEntities: Entity[]) {
    itemEntities.forEach(itemEntity => {
      if (itemEntity.link) {
        this.restService.call(itemEntity.link).subscribe( response => {
            var getBibLink = response.resource_metadata.mms_id.link.replace("/almaws/v1","") + "?view=brief";
            this.restService.call(getBibLink).subscribe( response => {
              let title: string = response.title ? response.title : "";
              let author: string = response.author ? response.author : "";
              this.bibEntities.push({ id:response.mms_id, description:title + " " + author });
              this.dedupByMmsId();
            },
            err => console.log(err.message));    
        },
        err => console.log(err.message));    
      }
    });
  }

  dedupByMmsId() {
    var bibEntitiesUniq: Entity[] = [];
    this.bibEntities.forEach(bibEntity => {
      var alreadyThere: boolean = false;
      bibEntitiesUniq.forEach(bibEntityUniq => {
        if (bibEntity.id === bibEntityUniq.id) {
          alreadyThere = true;
        }
      });
      if (!alreadyThere) {
        // console.log("adding to deduped list: "+bibEntity.description);
        bibEntitiesUniq.push(bibEntity);
      }
    });
    this.bibEntities = bibEntitiesUniq;
  }

  loadXsl() {
    let xslFilepath: string = 'assets/' + 'MARC21ColumnarFormat.xsl'; // default
    this.settingsService.get().subscribe( response => {
      console.log("Got the settings: ");
      console.log(response);
      if (response.xslFile) {
        xslFilepath = 'assets/' + response.xslFile;
      }
      console.log("xslFilepath: "+ xslFilepath);
      if (xslFilepath.endsWith(".xsl")) {
        // One of the OTB files
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
    let moreFields: string = 
      "<mms_id>"+this.escapeXml(bibRec.mms_id)+"</mms_id>"+
      "<title>"+this.escapeXml(bibRec.title)+"</title>"+
      "<author>"+this.escapeXml(bibRec.author)+"</author>"+
      "<isbn>"+this.escapeXml(bibRec.isbn)+"</isbn>"+
      "<issn>"+this.escapeXml(bibRec.issn)+"</issn>"+
      "<complete_edition>"+this.escapeXml(bibRec.complete_edition)+"</complete_edition>"+
      "<network_numbers>"+this.escapeXml(bibRec.network_numbers)+"</network_numbers>"+
      "<place_of_publication>"+this.escapeXml(bibRec.place_of_publication)+"</place_of_publication>"+
      "<date_of_publication>"+this.escapeXml(bibRec.date_of_publication)+"</date_of_publication>"+
      "<publisher_const>"+this.escapeXml(bibRec.publisher_const)+"</publisher_const>";

      marcXml = marcXml.replace("</record>",moreFields+"</record>");
    return marcXml;
  }

  escapeXml(inXml: string) : string {
    if (inXml) {
      return inXml.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    } else {
      return "";
    }
  }

  onPrintPreviewNewTab() {
    let innerHtml: string = "";
    let xmlAllBibs: string = "";
    for (let key in this.bibHash) {
      xmlAllBibs = xmlAllBibs + this.singleRecMarcXml(this.bibHash[key]);
    }       
    innerHtml = this.xsltOnCollection("<collection>" + xmlAllBibs + "</collection>"); 

    var content = "<html>";
    content += "<body onload=\"window.print(); \">";
    content += innerHtml;
    content += "</body>";
    content += "</html>";
    var win = window.open('','','left=0,top=0,width=552,height=477,toolbar=0,scrollbars=0,status =0');
    win.document.write(content);
    win.document.close();
  }

  onClearSelected() {
    this.bibHash = {};
    this.numRecordsToPrint = 0;
  }

  onListChanged(e: MatCheckboxChange){
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

const isRestErrorResponse = (object: any): object is RestErrorResponse => 'error' in object;