import {ElementRef, Directive, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'modal',
  host: {
    '[style.top]': 'topStyle',
    '[style.left]': 'leftStyle'
  }
})
@View({
  templateUrl: 'modal.html'
})
export class ModalCmp {
  private _element;

  constructor(element: ElementRef) {
    this._element = element.nativeElement;
  }

  get topStyle() {
    return '80px';
  }

  get leftStyle() {
    return ((document.body.clientWidth / 2) - (this._element.clientWidth / 2)) + 'px';
  }
}

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [CORE_DIRECTIVES, ModalCmp]
})
export class AnimateAppCmp {
  public modal = false;

  showModal() {
    this.modal = true;
  }

  hideModal() {
    this.modal = false;
  }
}

