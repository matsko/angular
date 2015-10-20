import {suffixClasses} from "./util";
import {chain, parallel} from "./sequence";
import {addClass, setTempClass, setClass} from "./css";

export function ng1AddRemoveClass(add, remove, duration, delay) {
  var preAddClasses = suffixClasses(add, "-add");
  var postAddClasses = suffixClasses(add, "-add-active");

  var preRemoveClasses = suffixClasses(remove, "-remove");
  var postRemoveClasses = suffixClasses(remove, "-remove-active");

  return chain([
    setTempClass(preAddClasses, preRemoveClasses, 0, 0),
    parallel([
      setClass(add, remove),
      setTempClass(postAddClasses, postRemoveClasses)
    ], duration, delay)
  ]);
}

export function ng1AddClass(className, duration, delay) {
  return ng1AddRemoveClass(className, null, duration, delay);
}

export function ng1Removelass(className, duration, delay) {
  return ng1AddRemoveClass(null, className, duration, delay);
}

export function ng1AnimateEvent(className, duration, delay) {
  return chain([
    addClass(className, 0, 0),
    addClass(className + '-active', duration, delay)
  ]);
}

