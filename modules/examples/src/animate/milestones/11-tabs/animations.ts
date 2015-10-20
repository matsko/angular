import {AnimationFactory} from 'angular2/src/animate/animate';
import { waitDelay, query, staggerTimers, keyframe, stagger, style, transition, group, chain,
  parallel, RAFRunner, AnimationEventContext } from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {
  var loaded = false;

  ctx.onAttrChange('data-index', (element, value) => {
    positionContent(element.getElementsByClassName('tabs-content')[0], value);
    positionInkBar(element.getElementsByTagName('ink-bar')[0], value);

    loaded = true;
  });

  function positionInkBar(element, value) {
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
  }

  function positionContent(element, value) {
    Array.prototype.slice.apply(element.children).forEach((element, index) => {

      //-- on initial load, skip the transition
      if (!loaded) element.classList.add('no-transition');
      else element.classList.remove('no-transition');

      //-- toggle classes appropriately for left/right movement
      if (index < value) toggleClasses('right', 'left');
      else if (index > value) toggleClasses('left', 'right');
      else removeAll();

      //-- after initial positioning, remove `no-transition` class
      if (!loaded) element.classList.remove('no-transition');

      function removeAll() {
        element.classList.remove('right');
        element.classList.remove('left');
      }

      function toggleClasses(a, b) {
        if (element.classList.contains(a)) {
          element.classList.add('no-transition');
          element.classList.remove(a);
        }
        element.classList.add(b);
      }
    });
  }
});
