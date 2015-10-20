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
  private _block = 'one';

  public items = [
    1,2,3,4,5,6,7,8,9,10
  ];

  public setBlockOne() {
    this._block = 'one';
  }

  public setBlockTwo() {
    this._block = 'two';
  }

  public onBlockOne() {
    return this._block == 'one';
  }

  public onBlockTwo() {
    return this._block == 'two';
  }
}
