var noop = () => {};

import {CssAnimation} from "./css";
import {RAFRunner} from "./runner";
import {touchCallback} from "./factory";

export function wrapAnimation(fn) {
  return RAFRunner.wrap(fn);
}

export function cssClassVal(className) {
  return className[0] == '.' ? className : ('.' + className);
}

export class NoopAnimationStylesLookup {
  fetchClassStyles(className) {
    return {};
  }
}

export class AnimationStylesLookup {
  private _classMap = {};

  static fromStylesheet(url): Promise<any> {
    return new Promise((resolve) => {
      var request = new XMLHttpRequest();
      request.addEventListener("load", () => {
        var content = request.responseText;
        var lookup = new AnimationStylesLookup(content);
        resolve(lookup);
      });
      request.open("GET", url);
      request.send(null);
    });
  }

  constructor(cssCode) {
    this._parseRulesIntoLookup(cssCode);
  }

  _parsePropertiesFromCss(rule) {
    var firstBrace = rule.indexOf('{');
    var inner = rule.substr(firstBrace);
    return inner.match(/\b\w+(?=:)/g);
  }

  _parseRulesIntoLookup(cssCode) {
    var styleTag = document.createElement('style');
    styleTag.setAttribute('type','text/css');
    styleTag.innerHTML = cssCode;
    document.body.appendChild(styleTag);

    var rules = styleTag['sheet']['rules'];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var selector = rule.selectorText;
      if (selector[0] == ".") {
        var stylesEntry = {};
        var properties = this._parsePropertiesFromCss(rule.cssText);
        properties.forEach((property) => {
          stylesEntry[property] = rule.style[property];
        });
        this._classMap[selector] = stylesEntry;
      }
    };
    styleTag.remove();
  }

  fetchClassStyles(className) {
    return copyObj(this._classMap[cssClassVal(className)] || {});
  }
}

function copyObj(object) {
  var newObject = {};
  for (var i in object) {
    newObject[i] = object[i];
  }
  return newObject;
}

export class AnimationEventContext {
  private _styles = [];
  private _classes = [];
  private _children = [];
  private _flushCallbacks = [];

  public constructor(private _element, private _data = {}, private _stylesLookup) {}

  // this is used to emulate an event
  public get detail() {
    return this._data;
  }

  public get elements() {
    return (this.detail['elements'] || []).map((elm) => elm);
  }

  public blockInnerEvents(): void {
    this.fetchAndBlockInnerEvents(true);
  }

  public permitInnerEvents(): void {
    this.fetchAndBlockInnerEvents(false);
  }

  get innerEvents() {
    return this._data['collectedEvents'];
  }

  public fetchAndBlockInnerEvents(block) {
    return this.innerEvents.map((event) => {
      var callback = event['callback'];
      touchCallback(callback, block);
      this._flushCallbacks.push(callback);
      return event;
    });
  }

  public getClassStyles(className) {
    return this._stylesLookup.fetchClassStyles(className);
  }

  public queueStyles(styles) {
    for (var i in styles) {
      this.queueStyle(i, styles[i]);
    }
  }

  public queueStyle(key, value) {
    this._styles.push({
      'prop': key,
      'value': value
    });
  }

  public queueTempClasses(classes, remove = false) {
    classes.forEach((className) => this.queueTempClass(className, remove));
  }

  public queueTempClass(className, remove = false) {
    this._classes.push({
      className: className,
      remove: remove
    });
  }

  public queueKeyframe() {
    this.queueStyle('animation-fill-mode', true);
    this.queueStyle('-webkit-animation-fill-mode', true);
    this.queueStyle('animation', true);
    this.queueStyle('-webkit-animation', true);
  }

  public fork(child, data = {}) {
    var instance = new AnimationEventContext(child, data, this._stylesLookup);
    this._children.push(instance);
    return instance;
  }

  public flush() {
    this._classes.forEach((entry) => {
      var className = entry['className'];
      this._element.classList[entry.remove ? 'remove' : 'add'](className);
    });

    this._styles.forEach((record) => {
      var value = record['value'];
      var prop = record['prop'];
      if (value === true) {
        this._element.style.removeProperty(prop);
      } else {
        this._element.style.setProperty(prop, value);
      }
    });

    this._styles = [];
    this._classes = [];

    this._children.forEach((child) => child.flush());
    this._children = [];

    this._flushCallbacks.forEach((callback) => callback());
    this._flushCallbacks = [];
  }
}

export var DEFAULT_STAGGER_TIME = 100;

export var staggerTimers = {
  reverse: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      return (total - relativeIndex) * delay;
    }
  },

  forward: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      return relativeIndex * delay;
    }
  },

  middleOut: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var midIndex = Math.floor(total / 2);
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      var diff = Math.abs(relativeIndex - midIndex);
      return diff * delay;
    }
  },

  topDownDiagonal: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var cellWidth = element.clientWidth;
      var cellHeight = element.clientHeight;
      var leftIndex = Math.floor(element.offsetLeft / cellWidth);
      var topIndex = Math.floor(element.offsetTop / cellHeight);
      return Math.max(leftIndex, topIndex) * delay;
    };
  },

  middleOutDiagonal: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var container       = element.parentNode;
      var cellWidth       = element.clientWidth;
      var cellHeight      = element.clientHeight;
      var containerWidth  = container.clientWidth;
      var containerHeight = container.clientHeight;
      var leftIndex       = Math.floor(element.offsetLeft / cellWidth);
      var topIndex        = Math.floor(element.offsetTop / cellHeight);
      var rightIndex      = Math.floor((containerWidth - element.offsetLeft) / cellWidth);
      var bottomIndex     = Math.floor((containerHeight - element.offsetTop) / cellHeight);
      return Math.max(leftIndex, topIndex, rightIndex, bottomIndex) * delay;
    };
  },

  rightToLeft: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var container = element.parentNode;
      var width = container.clientWidth;
      var cellWidth = element.clientWidth;
      var rightIndex = Math.floor((width - element.offsetLeft) / cellWidth);
      return rightIndex * delay;
    };
  },

  leftToRight: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var cellWidth = element.clientWidth;
      var leftIndex = Math.floor(element.offsetLeft / cellWidth);
      return leftIndex * delay;
    };
  },

  zoneIn: (delay = DEFAULT_STAGGER_TIME) => {
    return (element, index, total) => {
      var midIndex = Math.floor(total / 2);
      var relativeIndex = Array.prototype.indexOf.call(element.parentNode.children, element);
      var diff = Math.abs(relativeIndex - midIndex);
      return (midIndex - diff) * delay;
    };
  }
};

export function startAnimation(factory, element, context, duration = null, delay = null) {
  if (!factory || !element) {
    return RAFRunner.wrap(true);
  }

  var fn = factory.start ? factory.start : factory;

  // I don't know why I need to use `call`... The scope gets bound to element somehow
  return wrapAnimation(fn.call(factory, element, context, duration, delay));
}

export function parallel(operations, duration = null, delay = null) {
  var zeroDuration = duration === 0;
  var immediate = true;
  var group = new CssAnimation({
    duration: duration,
    delay: delay
  });

  var nonCssAnimations = operations.filter((operation) => {
    immediate = immediate && operation.immediate;

    if (operation.duration === 0) {
      zeroDuration = true;
    }

    var isCssAnimation = operation instanceof CssAnimation;
    if (isCssAnimation) {
      group.merge(operation);
    }
    return !isCssAnimation;
  });

  var animations = [group];
  nonCssAnimations.forEach((animation) => {
    animations.push(animation);
  });

  return {
    immediate: immediate,
    start: function(element, context, duration = null, delay = null) {
      if (zeroDuration) {
        zeroDuration = true;
      }
      return RAFRunner.all(animations.map((animation) => {
        return startAnimation(animation, element, context, duration, delay);
      }));
    }
  };
}

export function chain(operations, duration = null, delay = null) {
  var hasTimings = arguments.length > 2;
  operations = groupImmediateOperations(operations);

  var isFullyImmediate = operations.reduce((previous,b) => {
    return previous && b.immediate;
  }, true);

  return {
    immediate: isFullyImmediate,
    start: function(element, context, duration = null, delay = null) {
      if (operations.length == 0) {
        return RAFRunner.when(true);
      }

      var perTaskDuration;
      if (hasTimings) {
        perTaskDuration = operations.length > 1
            ? Math.floor(duration / operations.length)
            : duration;
      }
      return RAFRunner.chain(operations.map((operation, i) => {
        return () => startAnimation(operation, element, context, perTaskDuration, i == 0 ? delay : null);
      }));
    }
  };

  function groupImmediateOperations(allOperations) {
    var operations = [];
    var immediateOperations = [];

    allOperations.forEach((operation) => {
      if (operation.immediate) {
        immediateOperations.push(operation);
      } else {
        if (immediateOperations.length) {
          operations.push({
            immediate: true,
            _immediateOperations: copy(immediateOperations),
            start: function(element, context, duration, delay) {
              this._immediateOperations.forEach((operation) => {
                operation.start(element, context, 0, 0);
              });
              return RAFRunner.when(true);
            }
          });
          immediateOperations = [];
        }
        operations.push(operation);
      }
    });

    return operations;
  }
}

function copy(arr) {
  return [].concat(arr);
}

export var rafWait = (function globalRafWaitFactory() {
  var cancelLastRaf = () => {}, queue = [];
  return function(callback) {
    queue.push(callback);
    cancelLastRaf();
    var id = window.requestAnimationFrame(() => {
      for(var i = 0; i < queue.length; i++) {
        queue[i]();
      }
      queue = [];
      cancelLastRaf = () => {};
    });
    cancelLastRaf = function() {
      window.cancelAnimationFrame(id);
    };
  }
})();

// TODO: test for two levels of queuing
export function group(beforeFn, afterFn) {
  var sharedPromise;
  var isPendingTick;
  var elementQueue = [];
  var contextQueue = [];

  return function queueFn(element, context, duration = null, delay = null) {
    if (!sharedPromise) {
      sharedPromise = new RAFRunner();
    }
    if (!isPendingTick) {
      isPendingTick = true;
      rafWait(() => {
        isPendingTick = false;
        startAnimation(afterFn, elementQueue, contextQueue).then(() => {
          sharedPromise.resolve();
          sharedPromise = null;
        }, () => {
          sharedPromise.reject();
          sharedPromise = null;
        });
        elementQueue = [];
      });
    }
    startAnimation(beforeFn, element, context, duration, delay);
    elementQueue.push(element);
    contextQueue.push(context);
    return sharedPromise;
  }
}

export function stagger(animationFactory, staggerDelay, duration = null, delay = null) {
  delay = typeof delay == "number" ? delay : null;
  var delayFn = typeof staggerDelay == 'function'
    ? staggerDelay
    : (element, index, total) => {
      return index * staggerDelay;
    };

  return group(noop, (elements, contexts) => {
    return RAFRunner.all(elements.map((element, index) => {
      return wait(delayFn(element, index, elements.length)).then(() => {
        return startAnimation(animationFactory, element, contexts[index], duration, null);
      });
    }));
  });
}

export function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function waitDelay(time) {
  return {
    start: function () {
      return new Promise((resolve) => {
        setTimeout(resolve, time);
      });
    }
  };
}

export function query(selector, factory) {
  return {
    immediate: factory.immediate,
    start: function(element, context, duration = null, delay = null) {
      var contexts = [];
      var targets = element.querySelectorAll(selector);
      if (targets.length == 0) return RAFRunner.when(true);

      var queueElement = group(noop, (elements, contexts) => {
        return RAFRunner.all(elements.map((elm, index) => startAnimation(factory, elm, contexts[index])));
      });

      var sharedRunner;
      for (var i = 0; i < targets.length; i++) {
        var newTarget = targets[i];
        var newContext = context.fork(newTarget);
        sharedRunner = queueElement(newTarget, newContext, duration, delay);
      }
      return sharedRunner;
    }
  };
}

export function repeat(times, factory, duration, delay) {
  return {
    immediate: factory.immediate,
    start: function(element, context) {
      var counter = 0;
      var head = startAnimation(factory, element, context, duration, delay);
      while (counter++ < times) {
        head = head.then(() => {
          return startAnimation(factory, element, context, duration, delay);
        });
      }
      return head;
    }
  };
}
