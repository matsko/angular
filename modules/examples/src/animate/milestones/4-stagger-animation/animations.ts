import {AnimationFactory} from 'angular2/src/animate/animate';
import {stagger, cssClass, chain, staggerTimers} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();
animations.add('tr', 'animations.css', (ctx) => {
  ctx.onEnter(staggerCss('ng-enter', 1000, staggerTimers.reverse(100)));
  ctx.onLeave(staggerCss('ng-leave', 1000, staggerTimers.forward(100)));
});

function staggerCss(className, duration, delay) {
  return chain([
    cssClass(className + '!'),
    stagger(
      cssClass(className + '-active', duration),
      delay)
  ]);
}
