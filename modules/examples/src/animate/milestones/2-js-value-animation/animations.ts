import {AnimationFactory} from 'angular2/src/animate/animate';

var animations = new AnimationFactory();

animations.add('.number-counter', (ctx) => {
  ctx.onAttrChange('data-counter', (element, value) => {
    animateValueChange(element, value);
  });
});

function animateValueChange(element, value) {
  var oldFrame = element.querySelector(".number-frame");
  var newFrame = document.createElement('div');
  newFrame.className = "number-frame"
  newFrame.innerHTML = value;
  element.appendChild(newFrame);

  newFrame.classList.add("fade-in-start");
  newFrame.clientWidth + 1;
  newFrame.classList.add("fade-in");
  newFrame.addEventListener("transitionend", () => {
    newFrame.classList.remove("fade-in-start");
    newFrame.classList.remove("fade-in");
  });

  if (oldFrame) {
    oldFrame.classList.add("fade-out-start");
    oldFrame.clientWidth + 1;
    oldFrame.classList.add("fade-out");
    oldFrame.addEventListener("transitionend", () => {
      oldFrame.remove();
    });
  }
}
