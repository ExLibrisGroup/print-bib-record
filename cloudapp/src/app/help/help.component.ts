import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help',
  template: `
  <div class="title">
    <a [routerLink]="['']" style="float: right;">
      <button mat-raised-button><mat-icon>arrow_back</mat-icon>Back</button>
    </a>
    <h1>Help</h1>
  </div>
  <div>
    <p>For more help with this app, or to report a problem, please open an issue by clicking on the link below.</p>
    <p><a translate href="https://github.com/ori229/print-bib-record/issues" target="_blank">Open an issue</a></p>
  </div>
  `
})
export class HelpComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
