import { Component, OnInit } from '@angular/core';
import { CloudAppSettingsService} from '@exlibris/exl-cloudapp-angular-lib';
import { CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  
  optionSelected: string;
  saving: boolean = false;
  xslFiles = [
    { id: 'MARC21ColumnarFormat.xsl', name: 'MARC21ColumnarFormat.xsl' },
    { id: 'MARC21slim2English.xsl',   name: 'MARC21slim2English.xsl' }
  ];

  constructor ( 
    private configService: CloudAppConfigService,
    private settingsService: CloudAppSettingsService
  ) { }
  
  ngOnInit() {     this.load();   }

  load() {
    // if the App has inst-level-config - add it to the dropdown
    this.configService.get().subscribe( response => {
      console.log("Got the config:");
      console.log(response);
      this.xslFiles[2] = { id: response.customXsls[0].name,   name: response.customXsls[0].name }; 
      console.log(this.xslFiles);
    },
    err => console.log(err.message));    


    // change the dropdown to show the selection according to the saved settings
     this.settingsService.get().subscribe( response => {
       console.log("Got the settings:");
       console.log(response);
       this.optionSelected = response.xslFile;
     },
     err => console.log(err.message));
  }

  save(newVal: string) {
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
