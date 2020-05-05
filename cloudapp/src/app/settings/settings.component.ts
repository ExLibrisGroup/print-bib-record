import { Component, OnInit } from '@angular/core';
import { CloudAppSettingsService} from '@exlibris/exl-cloudapp-angular-lib';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  
  optionSelected: string;

  constructor ( 
    private settingsService: CloudAppSettingsService
  ) { }
  
  ngOnInit() {     this.load();   }

  load() {
     this.settingsService.get().subscribe( response => {
       console.log("Got the settings:");
       console.log(response);
       this.optionSelected = response.xslFile;
     },
     err => console.log(err.message));
  }

  save(newVal: string) {
    console.log("Saving settings: "+ newVal);
    var toSave = { "xslFile": newVal };
    this.settingsService.set(toSave).subscribe( response => {
      console.log("Saved");
    },
    err => console.log(err.message));
  }


}
