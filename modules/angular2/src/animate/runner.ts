import {mergeAnimationOptions} from "./util";

export interface AnimationPromise {
  then(c1, c2): Promise<any>;
  finally(callback): Promise<any>;
  catch(callback): Promise<any>;
}

export interface AnimationRunner extends AnimationPromise {
  pause(): void;
  resume(): void;
  close(): void;
  isPaused(): boolean;
  isClosed(): boolean;
}

export class RAFRunner implements AnimationPromise {
  protected _promise;
  private _resolvePromise;
  private _rejectPromise;
  private _runnerResolved;
  private _resolved;
  private _rafResolved;
  private _destroyEvents = [];

  static chain(operations) {
    var head;
    operations.forEach((operation) => {
      if (head) {
        head = head.then(operation);
      } else {
        head = operation();
      }
    });
    return head || RAFRunner.when(true);
  }

  static when(value) {
    var promise = new RAFRunner();
    promise.resolve(value);
    return promise;
  }

  static wrap(value) {
    if (value instanceof RAFRunner) {
      return value;
    }

    if (value instanceof Promise) {
      return value.then(() => RAFRunner.when(true));
    }

    return RAFRunner.when(value);
  }

  static all(runners) {
    var count = 0;
    var rejected = false;
    var runnerWrapper = new RAFRunner();

    runners.forEach((runner) => {
      runner.then(progress, () => {
        rejected = true;
        progress();
      });
    });

    return runnerWrapper;

    function progress() {
      if (++count == runners.length) {
        if (rejected) {
          runnerWrapper.reject();
        } else {
          runnerWrapper.resolve();
        }
      }
    }
  }

  public constructor() {
    this._promise = new Promise((resolve, reject) => {
      this._resolvePromise = resolve,
      this._rejectPromise = reject
    });
    window.requestAnimationFrame(() => this._onRAF());
  }

  public resolve(value = null) {
    this._runnerResolved = true;
    if (this._rafResolved) {
      this._resolve(value);
    }
  }

  public reject(reason = null) {
    if (!this._resolved) {
      this._runnerResolved = true;
      this._reject(reason);
    }
  }

  get promise() {
    return this._promise;
  }

  private _onRAF() {
    this._rafResolved = true;
    if (this._runnerResolved) {
      this._resolve(true);
    }
  }

  protected _resolve(value = null) {
    this._resolvePromise(value);
    this._resolved = true;
  }

  protected _reject(reason = null) {
    this._rejectPromise(reason);
    this._resolved = true;
  }

  public onBeforeDestroy(fn) {
    this._destroyEvents.push(fn);
  }

  public destroy() {
    this._destroyEvents.forEach((fn) => fn());
    this._destroyEvents = [];
  }

  get resolved() {
    return this._resolved;
  }

  public then(c1, c2 = () => {}) {
    return this._promise.then(c1, c2);
  }

  public catch(callback) {
    return this._promise.catch(callback);
  }

  public finally(callback) {
    return this._promise.finally(callback);
  }
}

export class CssAnimationRunner extends RAFRunner implements AnimationRunner {
  private _paused;

  protected _resolve(value = null) {
    super._resolve(value);
    document.body.clientWidth + 1;
  }

  public cancel() {
    this.reject();
    return this._promise;
  }

  public close() {
    this.resolve();
    return this._promise;
  }

  public isClosed() {
    return this.resolved;
  }

  public pause() {
    this._paused = true;
  }

  public resume() {
    this._paused = false;
  }

  public isPaused() {
    return this._paused;
  }
}
