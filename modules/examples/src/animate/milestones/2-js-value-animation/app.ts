import {Component, View, NgIf, NgFor} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html'
})
export class AnimateAppCmp {
  public count = 0;

  constructor() {
    this.setTiming();
  }

  setTiming() {
    this.count += 1;
    setTimeout(this.setTiming.bind(this), 1000);
  }
}

