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

  ctx.trackClick();

  ctx.on('click', animateRipple, element => element.matches('button'));

  function animateRipple (element, context) {
    var event = context.detail.collectedEvents[ 0 ];
    var ripple = createRipple(element);

    return chain([
      style(getInitialStyles(element, event)),
      transition({ opacity: 0.5, transform: 'translate(-50%,-50%)' }, 650),
      transition({ opacity: 0, left: '50%', top: '50%' }, 650)
    ]).start(ripple, context);
  }

  function createRipple(parent) {
    var ripple = document.createElement('div');
    ripple.className = 'ripple';
    parent.appendChild(ripple);
    return ripple;
  }

  function getInitialStyles(element, event) {
    var size = getSize(element);
    return {
      left: event.offsetX + 'px',
      top: event.offsetY + 'px',
      width: size + 'px',
      height: size + 'px'
    };
  }

  function getSize (element) {
    var x = element.offsetWidth;
    var y = element.offsetHeight;
    var size = Math.sqrt(x * x + y + y);
    return Math.ceil(size);
  }
});
