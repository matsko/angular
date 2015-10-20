import {Component, View, Injectable, CORE_DIRECTIVES} from 'angular2/angular2';
import {RouteParams} from 'angular2/router';
import {DbService} from './db_service';
import {PageLink} from './page_link';

@Component({
  selector: 'profile-page-cmp',
  viewBindings: [DbService]
})
@View({
  templateUrl: 'profile-page.html',
  directives: [CORE_DIRECTIVES, PageLink]
})
export class ProfilePageCmp {
  public user;

  constructor(private _db: DbService) {
    this.user = _db.user(19);
  }

  goHome() {
    window.location.hash = "#";
  }
}
