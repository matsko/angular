import {Component, View, NgIf, NgFor} from 'angular2/angular2';
import {Renderer, ElementRef} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'component',
  properties: ['state'],
  host: {
    '[attr.state]' : 'state'
  }
})
@View({
  template: 'The component is {{ state == "open" ? "open" : "closed" }}'
})
export class ComponentCmp {
  public state;
}

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [ComponentCmp]
})
export class AnimateAppCmp {
  public state = "open";

  toggleState() {
    this.state = this.state == "open" ? "closed" : "open";
  }
}

