/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import {createProxy} from '../../debug/proxy';
import {StyleSanitizeFn, StyleSanitizeMode} from '../../sanitization/style_sanitizer';
import {TNodeFlags} from '../interfaces/node';
import {RElement} from '../interfaces/renderer';
import {ApplyStylingFn, LStylingData, TStylingContext, TStylingContextIndex, TStylingNode} from '../interfaces/styling';
import {TData} from '../interfaces/view';
import {getCurrentStyleSanitizer} from '../state';
import {attachDebugObject} from '../util/debug_utils';
import {MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, allocStylingMapArray, allowDirectStyling as _allowDirectStyling, getBindingValue, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValue, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext, isStylingMapArray, normalizeIntoStylingMap, setValue} from '../util/styling_utils';

import {applyStylingViaContext} from './bindings';
import {generateStylingBindingIndices} from './direct_write_algorithm';
import {activateStylingMapFeature} from './map_based_bindings';



/**
 * --------
 *
 * This file contains the core debug functionality for styling in Angular.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */

/**
 * A debug-friendly version of `TStylingContext`.
 *
 * An instance of this is attached to `tStylingContext.debug` when `ngDevMode` is active.
 */
export interface DebugStylingContext {
  /** The configuration settings of the associated `TStylingContext` */
  config: DebugStylingConfig;

  /** The associated TStylingContext instance */
  context: TStylingContext;

  /** The associated TStylingContext instance */
  entries: {[prop: string]: DebugStylingContextEntry};

  /** A status report of all the sources within the context */
  printSources(): void;

  /** A status report of all the entire context as a table */
  printTable(): void;
}


/**
 * A debug/testing-oriented summary of all styling information in `TNode.flags`.
 */
export interface DebugStylingConfig {
  hasMapBindings: boolean;       //
  hasPropBindings: boolean;      //
  hasCollisions: boolean;        //
  hasTemplateBindings: boolean;  //
  hasHostBindings: boolean;      //
  allowDirectStyling: boolean;   //
}


/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 */
export interface DebugStylingContextEntry {
  /** The property (style or class property) that this entry represents */
  prop: string;

  /** The total amount of styling entries a part of this entry */
  valuesCount: number;

  /**
   * The bit guard mask that is used to compare and protect against
   * styling changes when any template style/class bindings update
   */
  templateBitMask: number;

  /**
   * The bit guard mask that is used to compare and protect against
   * styling changes when any host style/class bindings update
   */
  hostBindingsBitMask: number;

  /**
   * Whether or not the entry requires sanitization
   */
  sanitizationRequired: boolean;

  /**
   * The default value that will be applied if any bindings are falsy
   */
  defaultValue: string|boolean|null;

  /**
   * All bindingIndex sources that have been registered for this style
   */
  sources: (number|null|string)[];
}


/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 */
export interface DebugNodeStyling {
  /** The associated debug context of the TStylingContext instance */
  context: DebugStylingContext;

  /**
   * A summarization of each style/class property
   * present in the context
   */
  summary: {[propertyName: string]: DebugNodeStylingEntry};

  /**
   * A key/value map of all styling properties and their
   * runtime values
   */
  values: {[propertyName: string]: string | number | null | boolean};

  /**
   * Overrides the sanitizer used to process styles
   */
  overrideSanitizer(sanitizer: StyleSanitizeFn|null): void;
}


/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 */
export interface DebugNodeStylingEntry {
  /** The style/class property that the summary is attached to */
  prop: string;

  /** The last applied value for the style/class property */
  value: string|boolean|null;
}


/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
 */
export function attachStylingDebugObject(
    context: TStylingContext, tNode: TStylingNode, isClassBased: boolean) {
  const debug = new TStylingContextDebug(context, tNode, isClassBased);
  attachDebugObject(context, debug);
  return debug;
}

/**
 * A human-readable debug summary of the styling data present within `TStylingContext`.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
class TStylingContextDebug implements DebugStylingContext {
  constructor(
      public readonly context: TStylingContext, private _tNode: TStylingNode,
      private _isClassBased: boolean) {}

  get config(): DebugStylingConfig { return buildConfig(this._tNode, this._isClassBased); }

  /**
   * Returns a detailed summary of each styling entry in the context.
   *
   * See `DebugStylingContextEntry`.
   */
  get entries(): {[prop: string]: DebugStylingContextEntry} {
    const context = this.context;
    const totalColumns = getValuesCount(context);
    const entries: {[prop: string]: DebugStylingContextEntry} = {};
    const start = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
    let i = start;
    while (i < context.length) {
      const prop = getProp(context, i);
      const templateBitMask = getGuardMask(context, i, false);
      const hostBindingsBitMask = getGuardMask(context, i, true);
      const defaultValue = getDefaultValue(context, i);
      const sanitizationRequired = isSanitizationRequired(context, i);
      const bindingsStartPosition = i + TStylingContextIndex.BindingsStartOffset;

      const sources: (number | string | null)[] = [];

      for (let j = 0; j < totalColumns; j++) {
        const bindingIndex = context[bindingsStartPosition + j] as number | string | null;
        if (bindingIndex !== 0) {
          sources.push(bindingIndex);
        }
      }

      entries[prop] = {
        prop,
        templateBitMask,
        hostBindingsBitMask,
        sanitizationRequired,
        valuesCount: sources.length, defaultValue, sources,
      };

      i += TStylingContextIndex.BindingsStartOffset + totalColumns;
    }
    return entries;
  }

  /**
   * Prints a detailed summary of each styling source grouped together with each binding index in
   * the context.
   */
  printSources(): void {
    let output = '\n';

    const context = this.context;
    const prefix = this._isClassBased ? 'class' : 'style';
    const bindingsBySource: {
      type: string,
      entries: {binding: string, bindingIndex: number, value: any, bitMask: number}[]
    }[] = [];

    const totalColumns = getValuesCount(context);
    const itemsPerRow = TStylingContextIndex.BindingsStartOffset + totalColumns;

    for (let i = 0; i < totalColumns; i++) {
      const isDefaultColumn = i === totalColumns - 1;
      const hostBindingsMode = i !== TEMPLATE_DIRECTIVE_INDEX;
      const type = getTypeFromColumn(i, totalColumns);
      const entries: {binding: string, value: any, bindingIndex: number, bitMask: number}[] = [];

      let j = TStylingContextIndex.ValuesStartPosition;
      while (j < context.length) {
        const value = getBindingValue(context, j, i);
        if (isDefaultColumn || value > 0) {
          const bitMask = getGuardMask(context, j, hostBindingsMode);
          const bindingIndex = isDefaultColumn ? -1 : value as number;
          const prop = getProp(context, j);
          const isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
          const binding = `${prefix}${isMapBased ? '' : '.' + prop}`;
          entries.push({binding, value, bindingIndex, bitMask});
        }
        j += itemsPerRow;
      }

      bindingsBySource.push(
          {type, entries: entries.sort((a, b) => a.bindingIndex - b.bindingIndex)});
    }

    bindingsBySource.forEach(entry => {
      output += `[${entry.type.toUpperCase()}]\n`;
      output += repeat('-', entry.type.length + 2) + '\n';

      let tab = '  ';
      entry.entries.forEach(entry => {
        const isDefault = typeof entry.value !== 'number';
        const value = entry.value;
        if (!isDefault || value !== null) {
          output += `${tab}[${entry.binding}] = \`${value}\``;
          output += '\n';
        }
      });
      output += '\n';
    });

    /* tslint:disable */
    console.log(output);
  }

  /**
   * Prints a detailed table of the entire styling context.
   */
  printTable(): void {
    // IE (not Edge) is the only browser that doesn't support this feature. Because
    // these debugging tools are not apart of the core of Angular (they are just
    // extra tools) we can skip-out on older browsers.
    if (!console.table) {
      throw new Error('This feature is not supported in your browser');
    }

    const context = this.context;
    const table: any[] = [];
    const totalColumns = getValuesCount(context);
    const itemsPerRow = TStylingContextIndex.BindingsStartOffset + totalColumns;
    const totalProps = Math.floor(context.length / itemsPerRow);

    let i = TStylingContextIndex.ValuesStartPosition;
    while (i < context.length) {
      const prop = getProp(context, i);
      const isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
      const entry: {[key: string]: any} = {
        prop,
        'tpl mask': generateBitString(getGuardMask(context, i, false), isMapBased, totalProps),
        'host mask': generateBitString(getGuardMask(context, i, true), isMapBased, totalProps),
      };

      for (let j = 0; j < totalColumns; j++) {
        const key = getTypeFromColumn(j, totalColumns);
        const value = getBindingValue(context, i, j);
        entry[key] = value;
      }

      i += itemsPerRow;
      table.push(entry);
    }

    /* tslint:disable */
    console.table(table);
  }
}

function generateBitString(value: number, isMapBased: boolean, totalProps: number) {
  if (isMapBased || value > 1) {
    return `0b${leftPad(value.toString(2), totalProps, '0')}`;
  }
  return null;
}

function leftPad(value: string, max: number, pad: string) {
  return repeat(pad, max - value.length) + value;
}

function getTypeFromColumn(index: number, totalColumns: number) {
  if (index === TEMPLATE_DIRECTIVE_INDEX) {
    return 'template';
  } else if (index === totalColumns - 1) {
    return 'defaults';
  } else {
    return `dir #${index}`;
  }
}

function repeat(c: string, times: number) {
  let s = '';
  for (let i = 0; i < times; i++) {
    s += c;
  }
  return s;
}

/**
 * A human-readable debug summary of the styling data present for a `DebugNode` instance.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
export class NodeStylingDebug implements DebugNodeStyling {
  private _sanitizer: StyleSanitizeFn|null = null;
  private _debugContext: DebugStylingContext;

  constructor(
      context: TStylingContext|DebugStylingContext|null, private _tNode: TStylingNode,
      private _tData: TData, private _data: LStylingData, private _isClassBased: boolean) {
    this._debugContext = isStylingContext(context) ?
        new TStylingContextDebug(context as TStylingContext, _tNode, _isClassBased) :
        (context as DebugStylingContext);
  }

  get context() { return this._debugContext; }

  /**
   * Overrides the sanitizer used to process styles.
   */
  overrideSanitizer(sanitizer: StyleSanitizeFn|null) { this._sanitizer = sanitizer; }

  /**
   * Returns a detailed summary of each styling entry in the context and
   * what their runtime representation is.
   *
   * See `LStylingSummary`.
   */
  get summary(): {[key: string]: DebugNodeStylingEntry} {
    const entries: {[key: string]: DebugNodeStylingEntry} = {};
    this._mapValues(this._data, (prop: string, value: any) => { entries[prop] = {prop, value}; });

    // because the styling algorithm runs into two different
    // modes: direct and context-resolution, the output of the entries
    // object is different because the removed values are not
    // saved between updates. For this reason a proxy is created
    // so that the behavior is the same when examining values
    // that are no longer active on the element.
    const isClassBased = this._isClassBased;
    return createProxy({
      get(target: {}, prop: string): DebugNodeStylingEntry{
        let value: DebugNodeStylingEntry = entries[prop]; if (!value) {
          value = {
            prop,
            value: isClassBased ? false : null,
          };
        } return value;
      },
      set(target: {}, prop: string, value: any) { return false; },
      ownKeys() { return Object.keys(entries); },
      getOwnPropertyDescriptor(k: any) {
        // we use a special property descriptor here so that enumeration operations
        // such as `Object.keys` will work on this proxy.
        return {
          enumerable: true,
          configurable: true,
        };
      },
    });
  }

  get config() { return buildConfig(this._tNode, this._isClassBased); }

  /**
   * Returns a key/value map of all the styles/classes that were last applied to the element.
   */
  get values(): {[key: string]: any} {
    const entries: {[key: string]: any} = {};
    this._mapValues(this._data, (prop: string, value: any) => { entries[prop] = value; });
    return entries;
  }

  private _mapValues(data: LStylingData, fn: (prop: string, value: string|null) => any) {
    // there is no need to store/track an element instance. The
    // element is only used when the styling algorithm attempts to
    // style the value (and we mock out the stylingApplyFn anyway).
    const config = this.config;
    const mockElement = {} as any;
    const mapBindingsFlag =
        this._isClassBased ? TNodeFlags.hasClassMapBindings : TNodeFlags.hasStyleMapBindings;
    const hasMaps = hasConfig(this._tNode, mapBindingsFlag);
    if (hasMaps) {
      activateStylingMapFeature();
    }

    const sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());
    if (config.allowDirectStyling) {
      const values =
          generateStylingFromLView(data, this._tNode, this._tData, sanitizer, this._isClassBased);
      Object.keys(values).forEach(prop => fn(prop, values[prop]));
    } else {
      const mapFn: ApplyStylingFn =
          (renderer: any, element: RElement, prop: string, value: string | null,
           bindingIndex?: number | null) => fn(prop, value);

      // run the template bindings
      applyStylingViaContext(
          this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, false,
          this._isClassBased);

      // and also the host bindings
      applyStylingViaContext(
          this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, true,
          this._isClassBased);
    }
  }
}

function buildConfig(tNode: TStylingNode, isClassBased: boolean): DebugStylingConfig {
  const hasMapBindings = hasConfig(
      tNode, isClassBased ? TNodeFlags.hasClassMapBindings : TNodeFlags.hasStyleMapBindings);
  const hasPropBindings = hasConfig(
      tNode, isClassBased ? TNodeFlags.hasClassPropBindings : TNodeFlags.hasStylePropBindings);
  const hasCollisions = hasConfig(
      tNode,
      isClassBased ? TNodeFlags.hasDuplicateClassBindings : TNodeFlags.hasDuplicateStyleBindings);
  const hasTemplateBindings = hasConfig(
      tNode,
      isClassBased ? TNodeFlags.hasTemplateClassBindings : TNodeFlags.hasTemplateStyleBindings);
  const hasHostBindings = hasConfig(
      tNode, isClassBased ? TNodeFlags.hasHostClassBindings : TNodeFlags.hasHostStyleBindings);

  // `firstTemplatePass` here is false because the context has already been constructed
  // directly within the behavior of the debugging tools (outside of style/class debugging,
  // the context is constructed during the first template pass).
  const allowDirectStyling = _allowDirectStyling(tNode, isClassBased);
  return {
      hasMapBindings,       //
      hasPropBindings,      //
      hasCollisions,        //
      hasTemplateBindings,  //
      hasHostBindings,      //
      allowDirectStyling,   //
  };
}

function generateStylingFromLView(
    lView: LStylingData, tNode: TStylingNode, tData: TData, sanitizer: StyleSanitizeFn | null,
    isClassBased: boolean) {
  let values: {[key: string]: any} = {};

  const bindingIndex = isClassBased ? tNode.classesBindingIndex : tNode.stylesBindingIndex;
  const bindingIndices = generateStylingBindingIndices(tData, bindingIndex);

  for (let i = 0; i < bindingIndices.length; i++) {
    const bindingIndex = bindingIndices[i];
    const prop = tData[bindingIndex] as string | null;
    const value = getValue(lView, bindingIndex);
    if (prop === null) {
      const map = value as{[key: string]: any};
      const keys = Object.keys(map);
      for (let j = 0; j < keys.length; j++) {
        const p = keys[j];
        const v = map[p];
        const valueToApply = sanitizer ? sanitizer(p, v, StyleSanitizeMode.ValidateAndSanitize) : v;
        values[p] = valueToApply;
      }
    } else {
      const valueToApply =
          sanitizer ? sanitizer(prop, value, StyleSanitizeMode.ValidateAndSanitize) : value;
      values[prop] = valueToApply;
    }
  }

  return values;
}
