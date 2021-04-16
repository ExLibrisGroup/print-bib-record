import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http'; 
import { CloudAppRestService, CloudAppEventsService, CloudAppSettingsService, CloudAppConfigService, Entity, EntityType } from '@exlibris/exl-cloudapp-angular-lib';
// @ts-ignore
import { entities as supportedEntities } from '../../../../manifest.json';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

// https://jira.exlibrisgroup.com/browse/URM-129182
// https://ideas.exlibrisgroup.com/forums/308173-alma/suggestions/17421160-it-would-be-helpful-if-there-were-an-option-to-pr
export class MainComponent implements OnInit {

  showDebugWin: boolean = false;
  private xsl: string;
  formattedRecord: string; 
  loading = false;
  selectedEntities = new Array<Entity>();
  entityTypes = supportedEntities;

  entities$ = this.eventsService.entities$.pipe(
    tap(() => this.loading = true),
    switchMap(entities => {
      const bibEntities: Observable<Entity>[] = entities.map(e => {
        switch (e.type) {
          case EntityType.BIB_MMS:
            return of(e);
          case EntityType.PORTFOLIO:
          case EntityType.ITEM:
            return this.bibEntityFromItemOrPortfolio(e)
          case EntityType.PO_LINE:
            return this.bibEntityFromPOLine(e);
          default: 
            return of(null)
        }
      });
      return forkJoin(bibEntities);
    }),
    map(entities => entities
      /* Filter out null entities */
      .filter(e=>!!e)
      /* Unique */
      .filter((entity, index, self) =>
        index === self.findIndex(e => e.id === entity.id)
      )
    ), 
    tap(() => this.loading = false)
  )

  bibEntityFromItemOrPortfolio(entity: Entity): Observable<Entity> {
    const link = entity.link.match(/(\/bibs\/\d*)/)[1];
    return this.restService.call(link).pipe(map(bib=>this.entityFromBib(bib)))
  }

  bibEntityFromPOLine(entity: Entity): Observable<Entity> {
    return this.restService.call(entity.link).pipe(
      map(item => item.resource_metadata.mms_id.link + "?view=brief"),
      switchMap(link => this.restService.call(link)),
      map(bib => this.entityFromBib(bib)),
      catchError(e => of(null)), /* If BIB doesn't exist */ 
    )
  }

  entityFromBib(bib: any): Entity {
    return bib.record_format != 'marc21' ? null : 
    { 
      description: bib.title + ' ' + (bib.author || ''),
      id: bib.mms_id,
      link: bib.link,
      type: EntityType.BIB_MMS
    }
  }

  constructor(private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private settingsService: CloudAppSettingsService,
    private configService: CloudAppConfigService,
    private readonly http: HttpClient) { }

  ngOnInit() {
    this.loadXsl();
    this.eventsService.getInitData().subscribe(      data => {
      if (data.user.primaryId === "exl_impl") {
        this.showDebugWin = true;
      }
    });
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
    const link = '/bibs?mms_id=' + this.selectedEntities.map(e=>e.id).join(',');
    this.loading = true;
    this.restService.call(link).pipe(finalize(()=>this.loading = false))
    .subscribe(bibs => {
      for (let bib of bibs.bib) {
        xmlAllBibs = xmlAllBibs + this.singleRecMarcXml(bib);
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
    })
  }
}
