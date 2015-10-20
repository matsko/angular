import {AnimationFactory} from 'angular2/src/animate/animate';
import {
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

  ctx.onClassRemove('modal-active', (element, className, animationContext: AnimationEventContext) => {
    var fadeOutAnimation = transition({ opacity: 0 }, 1000);
    return parallel([
      query('.overlay', fadeOutAnimation),
      query('modal', fadeOutAnimation)
    ]).start(element, animationContext);
  });

  ctx.onClassAdd('modal-active', (element, className, animationContext: AnimationEventContext) => {
    var eventData = animationContext.detail;
    var events = animationContext.innerEvents;

    var styleEvent = findEvent(events, 'style');
    var y = styleEvent.data.style.top;
    var x = styleEvent.data.style.left;

    var midY = parseInt(y) * 2;

    var clickEvent = findEvent(events, 'click');
    var button = clickEvent.target;
    var coords = button.getBoundingClientRect();

    var modal = element.querySelector('modal');
    var width = modal.offsetWidth;
    var height = modal.offsetHeight;

    var fadeIn = function(duration, delay = null) {
      return transition({ opacity: 1}, duration, delay);
    }

    return chain([
      query('.overlay, modal .content, .modal .header, modal .content img', style({ opacity: 0 })),
      query('modal .content, .modal .header', style({ transform: 'translateY(-100px)' })),
      query('modal .content img', style({ transform: 'translateX(100px)' })),

      query('modal', style({
        transform: 'scale(0)',
        'transform-origin': '0% 0%',
        top: px(clickEvent.pageY),
        left: px(clickEvent.pageX)
      })),

      chain([
        parallel([
          query('.overlay', fadeIn(500)),
          query('modal', transition({ top: px(midY), left: px(x), transform: 'scale(1)' }, 1000))
        ]),
        parallel([
          query('modal', transition({ top: px(y), left: px(x) }, 1000)),
          query('modal .header, modal .content', stagger(
            transition({ opacity: 1, transform: 'translateY(0px)' }, 1000, 200)
          , 200)),
          query('modal img ',
            transition({ opacity: 1, transform: 'translateX(0px)' }, 1000, 500))
        ])
      ])

    ]).start(element, animationContext);
  });

  function px(value) {
    if (!/px$/.test(value)) {
      value = value + 'px';
    }
    return value;
  }

  function findEvent(events, name) {
    return (events.filter((entry) => {
      return entry['event'] == name || (name == "click" && (entry instanceof MouseEvent));
    }) || [null])[0];
  }

  function triggerCallbacks(events) {
    events.forEach((event) => {
      event['callback']();
    });
  }
});
