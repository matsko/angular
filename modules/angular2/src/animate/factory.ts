import {PromiseWrapper} from 'angular2/src/core/facade/async';
import {isArray} from 'angular2/src/core/facade/lang';
import {
  chain,
  parallel,
  wrapAnimation,
  startAnimation,
  AnimationEventContext,
  AnimationStylesLookup,
  NoopAnimationStylesLookup
} from './sequence';
import {RAFRunner} from './runner';

var noopTrue = () => true;
var noopPromise = () => PromiseWrapper.wrap(noopTrue);

var elementMatches = (element, selector) => {
  // this is its own function since there are various
  // (prefixed) versions of this for other browser vendors
  return element.matches && element.matches(selector);
}

export function touchCallback(fn, block = true) {
  if(fn) {
    if (block) {
      fn['touched'] = true;
    } else if (fn['touched']) {
      delete fn['touched'];
    }
  }
}

function wrapPrepareCallbackValueAndBlock(callback, param) {
  return (element, context) => {
    context.blockInnerEvents();
    if (callback.start) {
      return callback.start(element, context);
    } else {
      return callback(element, context.detail[param], context);
    }
  };
}

export class AnimationQueryContext {
  private _registeredEvents = {};
  private _lookup = {};
  private _stylesLookup = new NoopAnimationStylesLookup();
  private _container;
  private _lastClickEvent;

  constructor(public selector) {
    this._container = window;
  }

  setStylesLookup(lookup: AnimationStylesLookup) {
    this._stylesLookup = lookup;
  }

  isSelectorMatch(element) {
    var parent = element;
    while (parent) {
      if (elementMatches(parent, this.selector)) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  trigger(element, event, data) {
    var callback = data['callback'] || noopTrue;
    data['collectedEvents'] = data['collectedEvents'] || [];
    touchCallback(callback);

    if (this.isSelectorMatch(element)) {
      var operations = this._lookup[event];
      if (operations.length) {
        var results = [];
        operations.forEach((op) => {
          if (op.test(element, data)) {
            if (this._lastClickEvent) {
              data['collectedEvents'].push(this._lastClickEvent);
            }

            var context = new AnimationEventContext(element, data, this._stylesLookup);
            var onAllComplete = () => {
              this._lastClickEvent = null;
              context.flush();
            };

            var animation = startAnimation(op.fn, element, context).then(onAllComplete, onAllComplete);
            results.push(animation);
          }
        });
        return RAFRunner.all(results).then(callback);
      }
    }
    return RAFRunner.when(true).then(callback);
  }

  listen(event: string): AnimationQueryContext {
    if (this._registeredEvents[event]) return this;

    this._container.addEventListener(event, (e) => {
      var eventData = (e instanceof CustomEvent && e.detail) || {};
      touchCallback(eventData['callback']);
      var callback = eventData['callback'] || function() { };

      this.trigger(e.target, event, eventData).then(callback);
    });

    this._registeredEvents[event] = true;
    return this;
  }

  onSwap(callback): AnimationQueryContext {
    var startFn;
    if (typeof callback == "function") {
      startFn = function(container, context) {
        context.blockInnerEvents();
        var leave = context.elements[0];
        var enter = context.elements[1];
        //var anchors = context['anchors'];
        var anchors = [];
        return callback(leave, enter, anchors, context);
      }
    } else {
      startFn = function(container, context) {
        context.blockInnerEvents();
        return RAFRunner.all([
          startAnimation(callback['leave'], context.elements[0], context),
          startAnimation(callback['enter'], context.elements[1], context)
        ]);
      };
    }

    return this.on("ng-swap", startFn, noopTrue);
  }

  onStyle(callback): AnimationQueryContext {
    return this.on("ng-style", callback, noopTrue);
  }

  onEnter(callback): AnimationQueryContext {
    return this.on("ng-enter", callback, noopTrue);
  }

  onLeave(callback): AnimationQueryContext {
    return this.on("ng-leave", callback, noopTrue);
  }

  onClick(callback): AnimationQueryContext {
    return this.on("click", callback, noopTrue);
  }

  trackClick(): void {
    document.body.addEventListener('mousedown', (event) => {
      this._lastClickEvent = event;
    });
  }

  onAttrChange(attribute, callback): AnimationQueryContext {
    return this.on("ng-attributeChange", wrapPrepareCallbackValueAndBlock(callback, 'value'), (element, data) => data.attr == attribute);
  }

  onClassAdd(className, callback): AnimationQueryContext {
    return this.on("ng-addClass", wrapPrepareCallbackValueAndBlock(callback, 'className'), (element, data) => data.className = className);
  }

  onClassRemove(className, callback): AnimationQueryContext {
    return this.on("ng-removeClass", wrapPrepareCallbackValueAndBlock(callback, 'className'), (element, data) => data.className = className);
  }

  on(event, callback, predicate = (element, data) => true): AnimationQueryContext {
    this.listen(event);

    // we prefix this so that other JS DOM event code
    // doesn't clash with our renderer system
    this._lookup[event] = this._lookup[event] || [];
    this._lookup[event].push({
      test: predicate,
      fn: callback
    });

    return this;
  }
}

export class AnimationFactory {
  private _queries = [];

  trigger(element, event, data) {
    return this._queries
      .filter((query) => query.isSelectorMatch(element))
      .map((query) => query.trigger(element, event, data));
  }

  add(selector: string, stylesheet, callback = null): AnimationFactory {
    var query = this._add(selector);

    if (arguments.length == 2) {
      callback = stylesheet;
      callback(query);
    } else {
      AnimationStylesLookup.fromStylesheet(stylesheet).then((lookup) => {
        query.setStylesLookup(lookup);
        callback(query);
      });
    }

    return this;
  }

  _add(selector: string) {
    var query = new AnimationQueryContext(selector);
    this._queries.push(query);
    return query;
  }
}

export class AnimationRegistry {
  static registry = [];
  static register(factory: AnimationFactory) {
    AnimationRegistry.registry.push(factory);
  }
}
