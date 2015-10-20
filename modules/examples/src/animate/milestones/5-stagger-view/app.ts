import {Pipe, Directive, PipeTransform, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

import {ProfilePageCmp} from './profile-page';
import {IndexPageCmp} from './index-page';
import {PageLink} from './page_link';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [IndexPageCmp, ProfilePageCmp, CORE_DIRECTIVES, PageLink]
})
export class AnimateAppCmp {
  get indexPage() {
    var h = window.location.hash;
    return h == "" || h == "#";
  }
  get profilePage() {
    return window.location.hash == "#profile";
  }
}
