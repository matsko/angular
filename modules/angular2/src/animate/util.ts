import {StringMapWrapper} from 'angular2/src/core/facade/collection';

export function mergeTransformStyle(tA, tB) {
  if (tA === "none" || tB === "none") return tB;

  var i;

  var combinedA = StringMapWrapper.create();
  var keysA = tA.match(/\b(\w+)(?=\()/g);
  var valuesA = tA.match(/\(.+?\)/g);
  for (i = 0; i < keysA.length; i++) {
    combinedA[keysA[i]] = valuesA[i];
  }

  var combinedB = StringMapWrapper.create();
  var keysB = tB.match(/\b(\w+)(?=\()/g);
  var valuesB = tB.match(/\(.+?\)/g);
  for (i = 0; i < keysB.length; i++) {
    combinedB[keysB[i]] = valuesB[i];
  }

  var combined = StringMapWrapper.merge(combinedA, combinedB);
  var transform = '';
  for (var key in combined) {
    if (transform.length) {
      transform += " ";
    }
    transform += key + combined[key];
  }

  return transform;
}

export function mergeAnimationStyles(stylesA, stylesB) {
  var newStyles = StringMapWrapper.merge(stylesA, stylesB);
  var transformA = stylesA ? stylesA['transform'] : null;
  var transformB = stylesB ? stylesB['transform'] : null;
  if (transformA && transformB) {
    newStyles['transform'] = mergeTransformStyle(transformA, transformB);
  }
  return newStyles;
}

export function mergeAnimationOptions(optionsA, optionsB, duration = null, delay = null) {
  var options = StringMapWrapper.merge(optionsA, optionsB);
  var stylesA = optionsA['style'];
  var stylesB = optionsB['style'];

  if (stylesA && stylesB) {
    options['style'] = mergeAnimationStyles(stylesA, stylesB);
  }

  var durationA = optionsA['duration'];
  var durationB = optionsB['duration'];
  if (durationA != null && durationB != null) {
    options['duration'] = Math.max(durationA, durationB);
  } else {
    options['duration'] = durationA || durationB;
  }

  var delayA = optionsA['delay'];
  var delayB = optionsB['delay'];
  if (delayA != null && delayB != null) {
    options['delay'] = Math.max(delayA, delayB);
  } else {
    options['delay'] = delayA || delayB;
  }

  if (duration != null) {
    options['duration'] = duration;
  }

  if (delay != null) {
    options['delay'] = delay;
  }

  return options;
}

export function extractAndRemoveOption(object, key) {
  var value = object[key];
  delete object[key];
  return value;
}

export function parseTimingValue(value, name) {
  var convertedValue;
  switch (typeof value) {
    case "string":
      var lastChar = value[value.length - 1];
      if (lastChar == "s") {
        var secondLastChar = value[value.length - 2];
        if (secondLastChar == "m") { //ms
          convertedValue = parseInt(value.substring(0, value.length - 2), 10);
        } else {
          convertedValue = parseInt(value.substring(0, value.length - 1), 10) * 1000;
        }
      } else {
        error();
      }
      break;

    case "number":
      convertedValue = value;
      break;

    default: error();
  }

  return convertedValue;

  function error() {
    throw new Error("timing value for " + name + " must be in the format of: 10s, 10ms or 1000");
  }
}

export function suffixClasses(className, suffix) {
  if (className) {
    return className.split(' ').map((className) => className + suffix).join(' ');
  }
}

export function calculateCoordinates(element) {
  var props = element.getBoundingBox();
  var values = {};

  // these properties are traversed explicitely since
  // the bounding box object is lazy and each browser
  // reveals the properties differently...
  ['top','left','height','width'].forEach((prop) => {
    values[prop] = props[prop] + "px";
  });
  return values;
}

