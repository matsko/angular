import {AnimationFactory} from 'angular2/src/animate/animate';
import {
  waitDelay,
  query,
  staggerTimers,
  keyframe,
  stagger,
  style,
  transition,
  group,
  chain,
  parallel,
  RAFRunner,
  AnimationEventContext
} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {
  var loaded = false;
  ctx.onAttrChange('data-index', (element, value, ctx) => {
    var selectedLabel = Array.prototype.slice.apply(element.parentElement.children)
        .filter(element => element.matches('a'))[ value ];
    var left = selectedLabel.offsetLeft;
    var right = element.parentElement.clientWidth - left - selectedLabel.offsetWidth;

    //-- after initial load, add a class to tell the ink-bar which direction to animate
    if (loaded) {
      element.className = element.offsetLeft > selectedLabel.offsetLeft ? 'left' : 'right';
    }

    //-- set new position
    element.style.left = left + 'px';
    element.style.right = right + 'px';

    loaded = true;
  }, element => element.matches('ink-bar'));
});
