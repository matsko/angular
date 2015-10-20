import {AnimationFactory} from 'angular2/src/animate/animate';
import {cssClass, chain, parallel, transition} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', "animations.css", (ctx) => {

  ctx.onEnter(chain([
    cssClass("invisible!"),
    parallel([
      cssClass("red"),
      cssClass("visible")
    ], 5000)
  ]))

  ctx.onLeave(chain([
    cssClass("visible!"),
    parallel([
      transition({ transform: 'rotate(180deg)' }),
      transition({ transform: 'scale(10)' }),
      cssClass("invisible"),
      cssClass("mangle"),
      cssClass("red"),
      cssClass("blue"),
      transition({ color: 'red' }),
      transition({ 'font-size': '200px' })
    ], 1000)
  ]))

});
