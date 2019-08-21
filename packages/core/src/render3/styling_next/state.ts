/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import {RElement} from '../interfaces/renderer';
import {TEMPLATE_DIRECTIVE_INDEX} from './util';

/**
 * --------
 *
 * This file contains all state-based logic for styling in Angular.
 *
 * Styling in Angular is evaluated with a series of styling-specific
 * template instructions which are called one after another each time
 * change detection occurs in Angular.
 *
 * Styling makes use of various temporary, state-based variables between
 * instructions so that it can better cache and optimize its values.
 * These values are usually populated and cleared when an element is
 * exited in change detection (once all the instructions are run for
 * that element).
 *
 * There are, however, situations where the state-based values
 * need to be stored and used at a later point. This ONLY occurs when
 * there are template-level as well as host-binding-level styling
 * instructions on the same element. The example below shows exactly
 * what could be:
 *
 * ```html
 * <!-- two sources of styling: the template and the directive -->
 * <div [style.width]="width" dir-that-sets-height></div>
 * ```
 *
 * If and when this situation occurs, the current styling state is
 * stored in a storage map value and then later accessed once the
 * host bindings are evaluated. Once styling for the current element
 * is over then the map entry will be cleared.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */

/**
 * Used as a state reference for update values between style/class binding instructions.
 */
export interface StylingState {
  element: RElement|null;
  classesBitMask: number;
  classesIndex: number;
  stylesBitMask: number;
  stylesIndex: number;
  directiveIndex: number;
  sourceIndex: number;
}

// these values will get filled in the very firs time this is accessed...
const _state: StylingState = {
  element: null,
  classesBitMask: -1,
  classesIndex: -1,
  stylesBitMask: -1,
  stylesIndex: -1,
  directiveIndex: -1,
  sourceIndex: -1,
};

// the `0` start value is reserved for [map]-based entries
const INDEX_START_VALUE = 1;
const BIT_MASK_START_VALUE = 0;

export function getStylingState(element: RElement, directiveIndex: number): StylingState {
  if (_state.element !== element) {
    _state.element = element;
    _state.classesBitMask = BIT_MASK_START_VALUE;
    _state.classesIndex = INDEX_START_VALUE;
    _state.stylesBitMask = BIT_MASK_START_VALUE;
    _state.stylesIndex = INDEX_START_VALUE;
    _state.directiveIndex = directiveIndex;
    _state.sourceIndex = directiveIndex === TEMPLATE_DIRECTIVE_INDEX ? 0 : 1;
  } else if (_state.directiveIndex !== directiveIndex) {
    _state.directiveIndex = directiveIndex;
    _state.sourceIndex++;
  }
  return _state;
}

export function resetStylingState() {
  _state.element = null;
}
