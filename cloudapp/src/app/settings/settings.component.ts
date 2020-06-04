import { Component, OnInit } from '@angular/core';
import { CloudAppSettingsService} from '@exlibris/exl-cloudapp-angular-lib';
import { CloudAppConfigService} from '@exlibris/exl-cloudapp-angular-lib';
import { Constants } from '../constants';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  
  optionSelected: string;
  saving: boolean = false;
  xslFiles = [];

  constructor ( 
    private configService: CloudAppConfigService,
    private settingsService: CloudAppSettingsService
  ) {}
  
  ngOnInit() {     this.load();   }

  load() {
    // if the App has inst-level-config - add it to the dropdown
    this.xslFiles = JSON.parse(JSON.stringify(Constants.XSL_FILES)); // clone by val
    this.configService.get().subscribe( response => {
      console.log("Got the config:");
      console.log(response);
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
       console.log("Got the settings:");
       console.log(response);
       this.optionSelected = response.xslFile;
     },
     err => console.log(err.message));
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
