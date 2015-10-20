import {Host, ElementRef, Directive, Component, Injectable, CORE_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({ selector: 'tabs' })
@View({ templateUrl: 'tabs.html', directives: [CORE_DIRECTIVES] })
class Tabs {
  public tabs: Tab[] = [];
  public index: number = 0;
  public addTab(tab: Tab) {
    if (this.tabs.length === 0) tab.active = true;
    this.tabs.push(tab);
  }
  public selectTab(selectedTab: Tab) {
    this.tabs.forEach(tab => tab.active = selectedTab === tab);
    this.index = this.tabs.indexOf(selectedTab);
  }
}

@Component({ selector: 'tab', properties: [ 'title: title' ] })
@View({ templateUrl: 'tab.html', directives: [CORE_DIRECTIVES] })
class Tab {
  public active: boolean = false;
  constructor(@Host() tabs: Tabs) { tabs.addTab(this); }
}

@Component({ selector: 'animate-app' })
@View({ templateUrl: 'app.html', directives: [CORE_DIRECTIVES, Tabs, Tab] })
export class AnimateAppCmp {}

