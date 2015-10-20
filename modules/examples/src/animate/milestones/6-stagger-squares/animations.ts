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
  RAFRunner
} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {

  ctx.onEnter(chain([
    style({ opacity: 0 }),
    stagger(keyframe({
      '0%': { transform: 'scale(0)', opacity:0, background:'red' },
      '50%': { transform: 'scale(1.4)', opacity:0.8 },
      '100%': { transform: 'scale(1)', opacity:1, background:'#2A83D9' }
    }, 1000), staggerTimers.topDownDiagonal(100))
  ]));

  ctx.onLeave(
    stagger(keyframe({
      '0%': { transform: 'scale(1)' },
      '25%': { transform: 'scale(1.4)' },
      '100%': { transform: 'scale(0)', opacity: 0 },
    }, 1000), staggerTimers.zoneIn(100))
  );

});
