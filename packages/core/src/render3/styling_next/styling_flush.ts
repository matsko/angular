import {TStylingContext, LStylingData, ApplyStylingFn, TStylingContextIndex, StylingMapArray} from "./interfaces";
import {Renderer3, ProceduralRenderer3, RElement} from "../interfaces/renderer";
import {StyleSanitizeFn} from "../../sanitization/style_sanitizer";
import {getGuardMask, getValuesCount, getPropValuesStartPosition} from "./util";

/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
export function applyStyling(
    context: TStylingContext, renderer: Renderer3 | ProceduralRenderer3 | null, element: RElement,
    bindingData: LStylingData, bitMaskValue: number | boolean, applyStylingFn: ApplyStylingFn,
    sanitizer: StyleSanitizeFn | null, isHostBinding: boolean) {

  const bitMask = normalizeBitMaskValue(bitMaskValue);
  const mapsGuardMask = getGuardMask(context, TStylingContextIndex.MapBindingsPosition);
  const applyAllValues = (bitMask & mapsGuardMask) > 0;
  const valuesCount = getValuesCount(context);
  const valuesCountUpToDefault = valuesCount - 1;

  let i = getPropValuesStartPosition(context);
  while (i < context.length) {
    const guardMask = getGuardMask(context, i, isHostBinding);
    const defaultValue = context[i + valuesCountUpToDefault];
  }

  resetCursors();
}

const enum ForwardModeFlags {
  ApplyTemplateValues     = 0b001,
  ApplyHostBindingValues  = 0b010,
  ApplyTargetProp         = 0b100,
}

function forwardStylingMap(
    target: TStylingContext|StylingMapArray, renderer: Renderer3 | ProceduralRenderer3 | null, element: RElement,
    bindingData: LStylingData, bitMaskValue: number | boolean, applyStylingFn: ApplyStylingFn,
    sanitizer: StyleSanitizeFn | null, mode: ForwardModeFlags) {
}

const CURSORS: number[] = [0, 0, 0];
function getCursor(index: number) {
  if (index === CURSORS.length) {
    CURSORS.push(0);
  }
  return CURSORS[index];
}

function resetCursors() {
  for (let i = 0; i < CURSORS.length; i++) {
    CURSORS[i] = 0;
  }
}

function normalizeBitMaskValue(value: number | boolean): number {
  // if pass => apply all values (-1 implies that all bits are flipped to true)
  if (value === true) return -1;

  // if pass => skip all values
  if (value === false) return 0;

  // return the bit mask value as is
  return value;
}
