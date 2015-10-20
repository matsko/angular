import {Component, View, NgIf, NgFor} from 'angular2/angular2';
import {Renderer, ElementRef} from 'angular2/angular2';

/*
import {chain, parallel, wrap, AnimationFactory} from 'angular2/src/animate/animate';
import {AnimationTimeline, WebAnimationsDriver} from 'angular2/src/animate/timeline';

var animations = new AnimationFactory();
animations.find('animate-app', (ctx) => {

  var appTimeline = new AnimationTimeline(WebAnimationsDriver);

  var notificationTimeline = new AnimationTimeline(WebAnimationsDriver);
  //notificationTimeline.scope("

  appTimeline.scope("notification-panel", boxTimeline);

  var timeline;
  ctx.on("notificationMove", (element, data) => {
    if (!timeline) {
      timeline = containerTimeline.create(element);
      timeline.start(2000);
      timeline.pause();
    }
    var percentage = Math.min(data.y / 200, 1);
    timeline.progress(percentage);
  });

  ctx.on("notificationSnap", (container, data) => {
    timeline.snap();
  });
})

*/
@Component({
  selector: 'notification-panel',
  host: {
    '[title]': 'state'
  }
})
@View({
  directives: [NgIf, NgFor],
  templateUrl: "notification-panel.html"
})
export class NotificationPanel {
  public state = "closed";
}

@Component({selector: 'animate-app'})
@View({
  directives: [NgIf, NgFor, NotificationPanel],
  templateUrl: "animate-app.html"
})
export class AnimateApp {
  apps = [
    { icon: "./icons/behance.png", title: "behance" },
    { icon: "./icons/dribbble.png", title: "dribbble" },
    { icon: "./icons/lightning.png", title: "lightning" },
    { icon: "./icons/facebook.png", title: "facebook" },
    { icon: "./icons/google\ plus.png", title: "google\ plus" },
    { icon: "./icons/instagram.png", title: "instagram" },
    { icon: "./icons/linkedin.png", title: "linkedin" },
    { icon: "./icons/settings.png", title: "settings" },
    { icon: "./icons/twitter.png", title: "twitter" }
  ];

  constructor(private _render: Renderer, private _ref: ElementRef) { }

  onDrag(event) {
    //this.trigger("notificationMove", { x: event.clientX, y: event.clientY });
  }

  onDragEnd(event) {
    //this.trigger("notificationSnap", { x: event.clientX, y: event.clientY });
  }
}
