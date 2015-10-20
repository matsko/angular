import {Component, View, NgIf, NgFor} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html'
})
export class AnimateAppCmp {
  public state = 'one';
}

