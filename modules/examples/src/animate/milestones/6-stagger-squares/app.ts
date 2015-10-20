import {Directive, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [CORE_DIRECTIVES]
})
export class AnimateAppCmp {

  private _show;

  showItems() {
    this._show = true;
  }

  hideItems() {
    this._show = false;
  }

  get items() {
    if (this._show) {
      return this._items;
    }
  }

  _items = [
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10,
    11, 12, 13, 14, 15,
    16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ];

}
