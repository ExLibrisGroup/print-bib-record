import { Component, OnInit } from '@angular/core';
import { CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import { HttpClient } from '@angular/common/http'; 
import {Constants} from '../constants';


@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})

export class ConfigComponent implements OnInit {
  
  lib_xsl_name_0: string = "";
  lib_xsl_val_0: string = "";
  xslFiles = [];
  sampleMarcxml: string = "";
  formattedRecord: string; 
  saving: boolean = false;

  constructor ( 
    private configService: CloudAppConfigService, 
    private readonly http: HttpClient
  ) {}
  
  ngOnInit() {   this.load();   }

  load() {
    this.sampleMarcxml = Constants.SAMPLE_MARCXML;
    this.xslFiles = JSON.parse(JSON.stringify(Constants.XSL_FILES)); // clone by val
    this.configService.get().subscribe( response => {
      console.log("Got the config:");
      console.log(response);
      if (response.customXsls) {
        this.lib_xsl_name_0 = response.customXsls[0].name;
        this.lib_xsl_val_0  = response.customXsls[0].xsl;
        this.runXsl();
      }
    },
    err => console.log(err.message));    
  }    

  save() {
    console.log("Saving config: "+ this.lib_xsl_name_0);
    this.saving=true;
    this.lib_xsl_name_0 = this.lib_xsl_name_0.replace(".xsl",""); // TODO explain...
    var toSave = {
            customXsls: [
                {
                    name: this.lib_xsl_name_0,
                    xsl: this.lib_xsl_val_0
                }
            ]
        };
    this.configService.set(toSave).subscribe( response => {
      console.log("Saved");
      this.saving=false;
    },
    err => console.log(err.message));
  }

  loadStartingPoint(xslFileName: string) {
    console.log("Using: "+ xslFileName);
    let xslFilepath: string = 'assets/' + xslFileName;
    this.http.get(xslFilepath, { responseType: 'application' as 'json'}).subscribe(data => {
        console.log("Load: "+ xslFilepath);
        this.lib_xsl_val_0 = data.toString();  
    })
  }

  runXsl() {
    let xmlDoc = (new DOMParser()).parseFromString(this.sampleMarcxml, 'text/xml');
    let xslDoc = (new DOMParser()).parseFromString(this.lib_xsl_val_0, 'text/xml');
    let processor = new XSLTProcessor();
    processor.importStylesheet(xslDoc); // from https://github.com/krtnio/angular-xslt
    let  output = (new XMLSerializer()).serializeToString(processor.transformToFragment(xmlDoc, document));
    this.formattedRecord = output; 
  }

}
