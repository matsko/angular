import {Directive} from 'angular2/angular2';

@Directive({
  selector: '[page-link]',
  properties: ['pageParams: pageLink'],
  host: { '(click)': 'onClick()' }
})
export class PageLink {
  constructor() {}

  set pageParams(changes: any[]) { }

  onClick() {
    window.location.hash = '#profile';
  }
}
