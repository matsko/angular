import {AnimationFactory} from 'angular2/src/animate/animate';
import {wait, query, stagger, style, transition, group, chain, parallel, RAFRunner} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('animate-app', (ctx) => {
  ctx.onSwap({
    leave: chain([
      style({ opacity: 1 }),
      parallel([
        query(".special-user",
          stagger(transition({ opacity: 0, transform: 'translateY(-100px)' }, 1000), 100)),
        query("hr, h2, table",
          stagger(transition({ opacity: 0 }, 1000), 100))
      ]),
      query(".index-details", transition({ opacity: 0 }, 1000))
    ]),

    enter: chain([
      style({ position: 'fixed', top:'1px', left:'2px', right:'2px', opacity: 0 }),
      query("li", style({ transform: "translateX(-100px)", opacity: 0 })),
      query("p, img", style({ transform: "translateY(-100px)", opacity: 0 })),
      query("img", style({ background:'white' })),
      transition({ opacity: 1 }, 1000, 1000),
      parallel([
        query("li",
          stagger(transition({ opacity: 1, transform: 'translateX(0px)' }, 1000), 100)),
        query("p, img",
          stagger(transition({ opacity: 1, transform: 'translateY(0px)' }, 1000), 100))
      ]),
      query("p img", transition({ background: '#ddd' }, 500))
    ])
  });

});
