/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import {TNode, TNodeFlags} from '../interfaces/node';

import {StylingMapArray, StylingMapArrayIndex, TStylingConfigFlags, TStylingContext, TStylingContextIndex, TStylingContextPropConfigFlags} from './interfaces';

const MAP_BASED_ENTRY_PROP_NAME = '[MAP]';
export const TEMPLATE_DIRECTIVE_INDEX = 0;

/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 */
export function allocTStylingContext(initialStyling?: StylingMapArray | null): TStylingContext {
  const mapBasedConfig = TStylingContextPropConfigFlags.SanitizationRequired;
  return [
    initialStyling || [''],       // 1) initial styling values
    TStylingConfigFlags.Initial,  // 2) config for the styling context
    0,                            // 3) total amount of styling sources (template, directives, etc...)
    TEMPLATE_DIRECTIVE_INDEX,     // 4) the last binding source before styling is flushed
    mapBasedConfig,               // 5) config for all map-based bindings
    0,                            // 6) template bit mask for map-based bindings
    0,                            // 7) host bindings bit mask for map-based bindings
    MAP_BASED_ENTRY_PROP_NAME,    // 8) properties for map-based host bindings
    null,                         // 9) default value for map-based bindings
  ];
}

/**
 * Sets the provided directive as the last directive index in the provided `TStylingContext`.
 *
 * Styling in Angular can be applied from the template as well as multiple sources of
 * host bindings. This means that each binding function (the template function or the
 * hostBindings functions) will generate styling instructions as well as a styling
 * apply function (i.e. `stylingApply()`). Because host bindings functions and the
 * template function are independent from one another this means that the styling apply
 * function will be called multiple times. By tracking the last directive index (which
 * is what happens in this function) the styling algorithm knows exactly when to flush
 * styling (which is when the last styling apply function is executed).
 */
export function updateLastDirectiveIndex(
    context: TStylingContext, lastDirectiveIndex: number): void {
  if (lastDirectiveIndex === TEMPLATE_DIRECTIVE_INDEX) {
    const currentValue = context[TStylingContextIndex.LastDirectiveIndexPosition];
    if (currentValue > TEMPLATE_DIRECTIVE_INDEX) {
      // This means that a directive or two contained a host bindings function, but
      // now the template function also contains styling. When this combination of sources
      // comes up then we need to tell the context to store the state between updates
      // (because host bindings evaluation happens after template binding evaluation).
      markContextToPersistState(context);
    }
  } else {
    context[TStylingContextIndex.LastDirectiveIndexPosition] = lastDirectiveIndex;
  }
}

function getConfig(context: TStylingContext) {
  return context[TStylingContextIndex.ConfigPosition];
}

export function setConfig(context: TStylingContext, value: number) {
  context[TStylingContextIndex.ConfigPosition] = value;
}

export function getProp(context: TStylingContext, index: number) {
  return context[index + TStylingContextIndex.PropOffset] as string;
}

function getPropConfig(context: TStylingContext, index: number): number {
  return (context[index + TStylingContextIndex.ConfigOffset] as number) &
      TStylingContextPropConfigFlags.Mask;
}

export function isSanitizationRequired(context: TStylingContext, index: number) {
  return (getPropConfig(context, index) & TStylingContextPropConfigFlags.SanitizationRequired) > 0;
}

export function getGuardMask(context: TStylingContext, index: number, isHostBinding?: boolean) {
  const position = index + (isHostBinding ? TStylingContextIndex.HostBindingsBitGuardOffset : TStylingContextIndex.TemplateBitGuardOffset);
  return context[position] as number;
}

export function setGuardMask(context: TStylingContext, index: number, maskValue: number, isHostBinding?: boolean) {
  const position = index + (isHostBinding ? TStylingContextIndex.HostBindingsBitGuardOffset : TStylingContextIndex.TemplateBitGuardOffset);
  context[position] = maskValue;
}

export function getValuesCount(context: TStylingContext): number {
  return context[TStylingContextIndex.TotalSourcesPosition];
}

export function getBindingValue(context: TStylingContext, index: number, offset: number) {
  return context[index + TStylingContextIndex.BindingsStartOffset + offset] as number | string;
}

export function getDefaultValue(context: TStylingContext, index: number): string|boolean|null {
  const valuesCount = getValuesCount(context);
  return context[index + TStylingContextIndex.BindingsStartOffset + valuesCount - 1] as string |
      boolean | null;
}

/**
 * Temporary function which determines whether or not a context is
 * allowed to be flushed based on the provided directive index.
 */
export function allowStylingFlush(context: TStylingContext | null, index: number) {
  return (context && index === context[TStylingContextIndex.LastDirectiveIndexPosition]) ? true :
                                                                                           false;
}

export function lockContext(context: TStylingContext) {
  setConfig(context, getConfig(context) | TStylingConfigFlags.Locked);
}

export function isContextLocked(context: TStylingContext): boolean {
  return (getConfig(context) & TStylingConfigFlags.Locked) > 0;
}

export function stateIsPersisted(context: TStylingContext): boolean {
  return (getConfig(context) & TStylingConfigFlags.PersistStateValues) > 0;
}

export function markContextToPersistState(context: TStylingContext) {
  setConfig(context, getConfig(context) | TStylingConfigFlags.PersistStateValues);
}

export function getPropValuesStartPosition(context: TStylingContext) {
  const total = getValuesCount(context);
  return TStylingContextIndex.MapBindingsBindingsStartPosition + total + 1;
}

export function isMapBased(prop: string) {
  return prop === MAP_BASED_ENTRY_PROP_NAME;
}

export function hasValueChanged(
    a: StylingMapArray | number | String | string | null | boolean | undefined | {},
    b: StylingMapArray | number | String | string | null | boolean | undefined | {}): boolean {
  let compareValueA = Array.isArray(a) ? a[StylingMapArrayIndex.RawValuePosition] : a;
  let compareValueB = Array.isArray(b) ? b[StylingMapArrayIndex.RawValuePosition] : b;

  // these are special cases for String based values (which are created as artifacts
  // when sanitization is bypassed on a particular value)
  if (compareValueA instanceof String) {
    compareValueA = compareValueA.toString();
  }
  if (compareValueB instanceof String) {
    compareValueB = compareValueB.toString();
  }
  return !Object.is(compareValueA, compareValueB);
}

/**
 * Determines whether the provided styling value is truthy or falsy.
 */
export function isStylingValueDefined(value: any) {
  // the reason why null is compared against is because
  // a CSS class value that is set to `false` must be
  // respected (otherwise it would be treated as falsy).
  // Empty string values are because developers usually
  // set a value to an empty string to remove it.
  return value != null && value !== '';
}

export function concatString(a: string, b: string, separator = ' '): string {
  return a + ((b.length && a.length) ? separator : '') + b;
}

export function hyphenate(value: string): string {
  return value.replace(/[a-z][A-Z]/g, v => v.charAt(0) + '-' + v.charAt(1)).toLowerCase();
}

/**
 * Returns an instance of `StylingMapArray`.
 *
 * This function is designed to find an instance of `StylingMapArray` in case it is stored
 * inside of an instance of `TStylingContext`. When a styling context is created it
 * will copy over an initial styling values from the tNode (which are stored as a
 * `StylingMapArray` on the `tNode.classes` or `tNode.styles` values).
 */
export function getStylingMapArray(value: TStylingContext | StylingMapArray | null):
    StylingMapArray|null {
  return isStylingContext(value) ?
      (value as TStylingContext)[TStylingContextIndex.InitialStylingValuePosition] :
      value;
}

export function isStylingContext(value: TStylingContext | StylingMapArray | null): boolean {
  // the StylingMapArray is in the format of [initial, prop, string, prop, string]
  // and this is the defining value to distinguish between arrays
  return Array.isArray(value) &&
      value.length >= TStylingContextIndex.MapBindingsBindingsStartPosition &&
      typeof value[1] !== 'string';
}

export function getInitialStylingValue(context: TStylingContext | StylingMapArray | null): string {
  const map = getStylingMapArray(context);
  return map && (map[StylingMapArrayIndex.RawValuePosition] as string | null) || '';
}

export function hasClassInput(tNode: TNode) {
  return (tNode.flags & TNodeFlags.hasClassInput) !== 0;
}

export function hasStyleInput(tNode: TNode) {
  return (tNode.flags & TNodeFlags.hasStyleInput) !== 0;
}

export function getMapProp(map: StylingMapArray, index: number): string {
  return map[index + StylingMapArrayIndex.PropOffset] as string;
}

export function setMapValue(
    map: StylingMapArray, index: number, value: string | boolean | null): void {
  map[index + StylingMapArrayIndex.ValueOffset] = value;
}

export function getMapValue(map: StylingMapArray, index: number): string|null {
  return map[index + StylingMapArrayIndex.ValueOffset] as string | null;
}

export function forceClassesAsString(classes: string | {[key: string]: any} | null | undefined):
    string {
  if (classes && typeof classes !== 'string') {
    classes = Object.keys(classes).join(' ');
  }
  return (classes as string) || '';
}

export function forceStylesAsString(styles: {[key: string]: any} | null | undefined): string {
  let str = '';
  if (styles) {
    const props = Object.keys(styles);
    for (let i = 0; i < props.length; i++) {
      const prop = props[i];
      str = concatString(str, `${prop}:${styles[prop]}`, ';');
    }
  }
  return str;
}
