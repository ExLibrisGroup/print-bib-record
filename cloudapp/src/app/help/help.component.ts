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
    <p>The App uses XSL to convert MARCXML records to HTML.</p>
    <p>It has 3 built-in XSLs and supports adding one custom XSL.</p>
    <p>Under Settings you can select one of the pre-built XSLs.</p>
    <p>Under Configuration (available for Admin users) - you can create a custom XSL. Use the option to “Pick an XSL file to use as a starting point”, provide a name and save.</p>
    <p>For details see <a href="https://developers.exlibrisgroup.com/blog/how-to-make-a-custom-format-in-the-print-bib-records-cloud-app/" target="_blank">this blog post</a>.</p>
    <p>For more help with this app, or to report a problem, please open an issue by clicking on the link below.</p>
    <p><a translate href="https://github.com/exlibrisgroup/print-bib-record/issues" target="_blank">Open an issue</a></p>
  </div>
  `
})
export class HelpComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
