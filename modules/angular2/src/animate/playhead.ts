/*
  [start]
  - take in provided head
  - set the starting position
  - start the timer
  - run start()
    - examine the associated animations
    - GO [next]

  [next]
  - examine the starting position
    - if no starting position then run when the previous animation completes
    - keep chaining for unknowns onto this chain
  - otherwise
    - set the starting position of the next animation and queue
    -

  [timer loop]
  - if no matching position then continue
  - start the animation at position
    - collect the duration and update the dependent animations
      (both label and completion dependent)
class AnimationPlayhead {

  TIMER_VALUE = 10;

  private _timerQueue = {};
  private _currentPosition = 0;
  private _labels = {};

  constructor(startingAnimation: CssAnimation) {
    this.enqueue(startingAnimation, startingAnimation.position || 0);
  }

  enqueue(animation: CssAnimation, position: number) {
    this._timerQueue[position.toString()] = animation;
    if (animation.label) {
      this._assignLabel(animation.label, position, position + animation.getDuration(), animation);
    }
  }

  _startTimer() {
    window.setInterval(() => this._tick(this._currentPosition + this._TIMER_VALUE), this.TIMER_VALUE);
  }

  _tick(position) {
    var nextAnimation = this._timerQueue[position.toString()];
    if (!nextAnimation) return;

    var animationDetails = nextAnimation.start(this._element);
    if (animationDetails['time']) {
      animationDetails['next'].forEach((entry) => {
        this.enqueue(entry, position + animationDetails['time']);
      });
    }
  }

  _updateLabelDuration(label :string, duration: number) {
    var labelEntry = this._labels[label];
    labelEntry['duration'] = duration;
    this._resolveLabelDependencies(label);
  }

  _resolveLabelDependencies(labelEntry) {
    labelEntry['animations'].forEach((futureAnimation) => {
      if (futureAnimation.label) {
        var labelEntry =
      }
    });
  }

  _assignLabel(label :string, startTime: number, endTime: number, animation: CssAnimation, allowOverride: boolean = false) {
    var existingLabel = this._labels[label];
    if (existingLabel) {
      if (!allowOverride) {
        throw new Error("Label has already been assigned");
      }

      this._labels[label] = {
        start: startTime,
        end: endTime,
        animation: animation
      };
    }
  }

  seekTo(percentage) {
    this.getPlayers().forEach((player) => player.pause());
  }

  pause() {
    this.getPlayers().forEach((player) => player.pause());
  }

  play() {
    this.getPlayers().forEach((player) => player.play());
  }

  start(element) {
    this._element = element;
  }
}
*/
