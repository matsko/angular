import {Component, View, NgIf, NgFor} from 'angular2/angular2';
import {Renderer, ElementRef} from 'angular2/angular2';
import {AnimationFactory, group} from 'angular2/src/animate/animate';

function cssBefore(e, className) {
  e.classList.add(className);
  e.style.setProperty("transition-delay", "-9999s");
}
function cssAfter(e, className, duration, delay) {
  return new Promise((resolve) => {
    e.style.removeProperty("transition-delay");
    if (duration) {
      e.style.setProperty("transition-duration", duration + "ms");
    }
    if (delay) {
      e.style.setProperty("transition-delay", delay + "ms");
    }
    e.classList.add(className + "-active");
    var progress = () => {
      e.classList.remove(className);
      e.classList.remove(className + "-active");
      if (duration) {
        e.style.removeProperty("transition-duration");
      }
      if (delay) {
        e.style.removeProperty("transition-delay");
      }

      e.removeEventListener("transitionend", progress);
      resolve();
    };
    e.addEventListener("transitionend", progress);
  });
}

function stagger(className, delay, sortFn) {
  return group(
          (elements) => {
            elements = elements.map((record) => record[0]);
            if (sortFn) {
              elements = elements.sort(sortFn);
            }
            document.body.clientWidth + 1;
            return Promise.all(elements.map((element, i) => {
              return cssAfter(element, className, null, delay * i);
            }));
          },
          (element) => cssBefore(element, className));
}

@Component({
  selector: 'stagger-animate-app'
})
@View({
  directives: [NgIf, NgFor],
  templateUrl: 'stagger-animate-app.html'
})
export class StaggerAnimateApp {
  public items;

  setItems() {
    this.items = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
      9, 10, 11,
      12, 13, 14,
      15, 16, 17,
      18, 19, 20
    ];
  }

  removeItems() {
    this.items.length = 0;
  }
}
