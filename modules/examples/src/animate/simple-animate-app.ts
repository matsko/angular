/*
import {Component, View, NgIf, NgFor} from 'angular2/angular2';
import {Renderer, ElementRef} from 'angular2/angular2';
import {AnimationFactory} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

var dialsTimeline = new AnimationTimeline(WebAnimationsDriver);

dialsTimeline.scope("notifications", new AnimationTimeline(WebAnimationsDriver)
  .step(0, { top: "-100px" })
  .step(0.2, { top: "0px" })
  .step(1, { top: "0px" }));

dialsTimeline.scope("notifications .content", new AnimationTimeline(WebAnimationsDriver)
  .step(0, { height: "0px" })
  .step(0.4, { height: "0px" })
  .step(0.8, { height: "400px" }));

animations.find('simple-animate-app', (ctx) => {
  var timeline;

  var baseY;
  var baseHeight;
  ctx.on("interactStart", (element, data) => {
    baseY = element.getBoundingClientRect().top;
    baseHeight = element.parentNode.offsetHeight - 300;
    timeline = dialsTimeline.create(element);
    timeline.start(2000, (tl, index) => {
      return 100;
    });
  })

  ctx.on("interact", (element, data) => {
    var y = data.y - baseY;
    var percentage = Math.min(0.99, Math.max(0, Math.min(1, y / baseHeight)));
    console.log(percentage);
    timeline.progress(percentage);
  })

  ctx.on("interactEnd", (element, data) => {
    if (!data.passed) {
      //timeline.reverse();
    }
    //timeline.resume();
  })
});

@Component({
  selector: 'notifications'
})
@View({
  templateUrl: 'notifications.html'
})
class NotificationsCmp {

}

@Component({
  selector: "simple-animate-app"
})
@View({
  templateUrl: "simple-animate-app.html",
  directives: [NgIf, NgFor, NotificationsCmp]
})
export class SimpleAnimateApp {
  public activeDrop = false;
  public dropComplete = false;

  apps = [
    { icon: "./icons/behance.png", title: "behance" },
    { icon: "./icons/dribbble.png", title: "dribbble" },
    { icon: "./icons/speech.png", title: "speech" },
    { icon: "./icons/gear.png", title: "gear" },
    { icon: "./icons/tumblr.png", title: "tumblr" },
    { icon: "./icons/lightning.png", title: "lightning" },
    { icon: "./icons/facebook.png", title: "facebook" },
    { icon: "./icons/google\ plus.png", title: "google\ plus" },
    { icon: "./icons/instagram.png", title: "instagram" },
    { icon: "./icons/linkedin.png", title: "linkedin" },
    { icon: "./icons/settings.png", title: "settings" },
    { icon: "./icons/twitter.png", title: "twitter" }
  ];

  constructor(private _render: Renderer, private _ref: ElementRef) { }

  onDrag($event) {
    this._trigger("interact", { x: $event.clientX, y: $event.clientY });
  }

  onDragStart($event) {
    this._trigger("interactStart", { x: $event.clientX, y: $event.clientY });
  }

  onDragEnd($event) {
    this._trigger("interactEnd", {
      passed: this.dropComplete
    });
  }

  onDragEnter($event) {
    this.activeDrop = true;
  }

  onDragLeave($event) {
    this.activeDrop = false;
  }

  onDragDrop($event) {
    this.activeDrop = true;
    this.dropComplete = true
    console.log('a');
  }

  _trigger(event, data = {}) {
  //this._render.triggerCustomDomEvent(this._ref, event, { detail: data, bubbles: true });
  }
}
*/
