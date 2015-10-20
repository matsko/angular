import {AnimationFactory} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

/*
  this would be nice:

  onAttrChange('state', {
    'closed': css('fade-out', '1s'),
    'open':   css('fade-in', '1s')
  });

  onEnter(css('ng-enter'))

  onLeave(css('ng-leave'))
*/

animations.add('component', (ctx) => {
  ctx.onAttrChange('state', (element, value) => {
    value === "closed" ? animateKeyframe(element, "fade-out", "1s")
                       : animateKeyframe(element, "fade-in", "1s");
  });
});

function animateKeyframe(element, keyframe, duration) {
  element.style.removeProperty("animation-play-state");
  element.style.setProperty("animation", keyframe + " " + duration + " linear");
  element.style.setProperty("animation-fill-mode", "forwards");
  element.addEventListener("animationend", () => {
    element.style.setProperty("animation-play-state", "paused");
  });
}
