import {ElementRef, Directive, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [CORE_DIRECTIVES]
})
export class AnimateAppCmp {
  public on:boolean = false;
}
