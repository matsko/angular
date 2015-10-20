function copyObj(obj) {
  var newObj = {};
  for (var i in obj) {
    newObj[i] = obj[i];
  }
  return newObj;
}

class WebAnimationsDriver {
  static create(element, steps, duration) {
    return new WebAnimationsDriver(element, steps, duration);
  }

  private _steps;
  private _player;
  private _closingPromise;

  constructor(private _element, steps, private _duration) {
    this._steps = this._formatSteps(steps, _duration);
  }

  _formatSteps(steps, totalDuration) {
    var compiledSteps = [];
    for (var position in steps) {
      // we copy this since for each timeline/element/duration
      // value there is a different combination of step timing
      // values and if we modify the existing step object then
      // that data will trickle over to the next time the same
      // timeline is used to create a new timeline session.
      var stepDetails = copyObj(steps[position]);

      // maybe offset?
      stepDetails['duration'] = position <= 1
          ? totalDuration * position // percentage-based
          : position;                // millisecond magnitude

      compiledSteps.push(stepDetails);
    }

    return compiledSteps.sort((a, b) => {
      return a.duration - b.duration;
    });
  }

  start() {
    if (!this._closingPromise) {
      this._closingPromise = new Promise((resolve) => {
        this._player = this._element.animate(this._steps, { duration: this._duration });

        this._player.onfinish = () => resolve();
        this.resume();
      });
    }
    return this._closingPromise;
  }

  resume() {
    this._player.resume();
  }

  pause() {
    this._player.pause();
  }

  reverse() {
    this._player.reverse();
  }

  snap() {
    if (this._player.currentTime > (this._duration / 2)) {
      this._player.reverse();
    }
    this.resume();
  }

  goTo(percentage) {
    this.pause();
    var time = percentage <= 1
        ? percentage * this._duration
        : percentage;
    this._player.currentTime = time;
  }
}

class AnimationPlayhead {
  private _playing = false;
  private _player;

  constructor(private _driver, private _element, private _steps, private _playheads) { }

  pause() {
    if (this._playing) {
      this._playing = false;
      this._playheads.forEach((ph) => ph.pause());
    }
  }

  resume() {
    if (!this._playing) {
      this._playing = true;
      this._playheads.forEach((ph) => ph.resume());
    }
  }

  snap() {
    this._player.snap();
    this._playheads.forEach((ph) => ph.snap());
  }

  start(duration) {
    if (!this._player) {
      this._player = this._driver.create(this._element, this._steps, duration);
      this._player.start();

      this._playing = true;
      this._playheads.forEach((ph) => ph.start(duration));
    }
  }

  progress(stepValue) {
    this.pause();
    this._goTo(stepValue);

    this._playheads.forEach((ph) => ph.progress(stepValue));
  }

  _goTo(stepValue) {
    this._player.goTo(stepValue);
  }
}

class AnimationTimeline {

  private _steps = {};
  private _scopes = {};

  constructor(private _driver) {}

  step(position, value) {
    this._steps[position] = value;
    return this;
  }

  scope(selector, timeline: AnimationTimeline) {
    this._scopes[selector] = timeline;
  }

  create(container) {
    var playheads = [];
    for (var selector in this._scopes) {
      let timeline = this._scopes[selector];
      let elements = container.querySelectorAll(selector);
      for (var i = 0; i < elements.length; i++) {
        playheads.push(timeline.create(elements[i]));
      }
    }

    return new AnimationPlayhead(this._driver, container, this._steps, playheads);
  }
}
