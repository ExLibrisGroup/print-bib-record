import { Component, OnInit } from '@angular/core';
import { CloudAppSettingsService} from '@exlibris/exl-cloudapp-angular-lib';
import { CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import { Constants } from '../constants';
import { HttpClient } from '@angular/common/http'; 


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  
  optionSelected: string;
  saving: boolean = false;
  xslFiles = [];
  formattedRecord: string; 
  sampleMarcxml: string = Constants.SAMPLE_MARCXML;

  constructor ( 
    private configService: CloudAppConfigService,
    private settingsService: CloudAppSettingsService,
    private readonly http: HttpClient
  ) {}
  
  ngOnInit() {     this.load();   }

  load() {
    // if the App has inst-level-config - add it to the dropdown
    this.xslFiles = JSON.parse(JSON.stringify(Constants.XSL_FILES)); // clone by val
    this.configService.get().subscribe( response => {
      console.log("Got the config:");      console.log(response);
      if (response.customXsls) {
        response.customXsls.forEach(customXsl => {
          this.xslFiles.push( { id: "instConfig:"+customXsl.name,   name: customXsl.name } );
          console.log("Added another line to the drop-down");
          console.log(this.xslFiles);
        });
      }
    },
    err => console.log(err.message));    


    // change the dropdown to show the selection according to the saved settings
     this.settingsService.get().subscribe( response => {
       console.log("Got the settings:");       console.log(response);
       if (response.xslFile) {
        this.optionSelected = response.xslFile;
        this.onSelectXsl(response.xslFile);
       } else {
        this.onSelectXsl(this.xslFiles[0].id);
       }
     },
     err => console.log(err.message));
  }

  onSelectXsl(xslFileName: string) {
    console.log("Selection changed to: "+ xslFileName);
    let xslFilepath: string = 'assets/' + xslFileName;
    if (xslFilepath.endsWith(".xsl")) {
      // One of the OTB files
      this.http.get(xslFilepath, { responseType: 'application' as 'json'}).subscribe(data => {
        console.log("Load: "+ xslFilepath);
        this.formattedRecord = this.runXsl(this.sampleMarcxml,data.toString());
      })
    } else {
      // XSL configured by the Inst admin - load from the config.
      this.configService.get().subscribe( response => {
        console.log("Got the config:");        console.log(response);
        if (response.customXsls)
          this.formattedRecord = this.runXsl(this.sampleMarcxml,response.customXsls[0].xsl);
      },
      err => console.log(err.message));    
    }
    this.http.get(xslFilepath, { responseType: 'application' as 'json'}).subscribe(data => {
        console.log("Load: "+ xslFilepath);
        this.formattedRecord = this.runXsl(this.sampleMarcxml,data.toString());
    })
  }

  runXsl(xml: string, xsl: string) : string {
    try {
      let xmlDoc = (new DOMParser()).parseFromString(xml, 'text/xml');
      let xslDoc = (new DOMParser()).parseFromString(xsl, 'text/xml');
      let processor = new XSLTProcessor();
      processor.importStylesheet(xslDoc); // from https://github.com/krtnio/angular-xslt
      let  output = (new XMLSerializer()).serializeToString(processor.transformToFragment(xmlDoc, document));
      return (output);
    } catch (err) {
      return (err);
    }
    return "";
  }

  onSaveBtnClicked(newVal: string) {
    console.log("Saving settings: "+ newVal);
    this.saving=true;
    var toSave = { "xslFile": newVal };
    this.settingsService.set(toSave).subscribe( response => {
      console.log("Saved");
      this.saving=false;
    },
    err => console.log(err.message));
  }


}
