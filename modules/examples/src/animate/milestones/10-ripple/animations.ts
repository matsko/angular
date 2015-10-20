import {AnimationFactory} from 'angular2/src/animate/animate';
import { waitDelay, query, staggerTimers, keyframe, stagger, style, transition, group, chain,
  parallel, RAFRunner, AnimationEventContext } from 'angular2/src/animate/animate';

declare var jQuery;

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {

  ctx.trackClick();

  ctx.on('click', animateRipple, element => element.matches('button'));

  function animateRipple (element, context) {
    var event = context.detail.collectedEvents[ 0 ];

    var elem = jQuery('<div class="ripple test">')
      .appendTo(element)
      .css(getInitialStyles(element, event))
      .transit({ left: '50%', top: '50%', opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)' }, 450)
      .transit({ opacity: 0 }, 450, remove);

    function remove () {
      elem.remove();
    }
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
    return Math.ceil(size * 1.3);
  }
});
