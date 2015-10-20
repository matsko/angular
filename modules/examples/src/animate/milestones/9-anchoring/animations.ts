import {AnimationFactory} from 'angular2/src/animate/animate';
import {cssClass, chain, parallel, transition} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', "animations.css", (ctx) => {
//ctx.onSwap(function(leave, enter, anchors, options) {
  //console.log(anchors);
    //});
});
