declare var TweenLite;

import {AnimationFactory} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('[state]', (ctx) => {
  ctx.onAttrChange('state', function(element, value) {
    return new Promise((resolve) => {
      animateState(element, value, resolve);
    });
  });
});

function animateState(element, state, cb) {
  switch (state) {
    case "one":
      TweenLite.to(element, 1, {
        backgroundColor:"#ff0000",
        borderColor:"#880000",
        fontSize: "20px",
        padding:"100px",
        onComplete: cb
      });
      break;

    case "two":
      TweenLite.to(element, 1, {
        backgroundColor:"#dddddd",
        borderColor:"#000000",
        fontSize: "20px",
        padding:"20px",
        onComplete: cb
      });
      break;

    case "three":
      TweenLite.to(element, 1, {
        backgroundColor:"#00bb00",
        borderColor:"#999999",
        fontSize: "100px",
        padding:"20px",
        onComplete: cb
      });
      break;
  }
}
