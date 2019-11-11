/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import {createProxy} from '../../debug/proxy';
import {RendererStyleFlags2} from '../../render/api';
import {StyleSanitizeFn} from '../../sanitization/style_sanitizer';
import {TNodeFlags} from '../interfaces/node';
import {ProceduralRenderer3, RComment, RElement, RNode, RText, Renderer3, RendererStyleFlags3} from '../interfaces/renderer';
import {LStylingData, StylingMapArrayIndex, TStylingContext, TStylingContextIndex, TStylingNode} from '../interfaces/styling';
import {getCurrentStyleSanitizer} from '../state';
import {attachDebugObject} from '../util/debug_utils';
import {MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, allowDirectStyling as _allowDirectStyling, getBindingValue, getDefaultValue, getGuardMask, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getValue, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext, normalizeIntoStylingMap, setValue} from '../util/styling_utils';

import {applyStylingViaContext, setClass, setStyle} from './bindings';
import {activateStylingMapFeature} from './map_based_bindings';
import {parseStyleString} from './style_string_parser';



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
      context: TStylingContext|DebugStylingContext, private _tNode: TStylingNode,
      private _data: LStylingData, private _isClassBased: boolean) {
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
    const config = this.config;
    const isClassBased = this._isClassBased;

    let data = this._data;

    // the direct pass code doesn't convert [style] or [class] values
    // into StylingMapArray instances. For this reason, the values
    // need to be converted ahead of time since the styling debug
    // relies on context resolution to figure out what styling
    // values have been added/removed on the element.
    if (config.allowDirectStyling && config.hasMapBindings) {
      data = data.concat([]);  // make a copy
      this._convertMapBindingsToStylingMapArrays(data);
    }

    this._mapValues(data, (prop: string, value: any) => { entries[prop] = {prop, value}; });

    // because the styling algorithm runs into two different
    // modes: direct and context-resolution, the output of the entries
    // object is different because the removed values are not
    // saved between updates. For this reason a proxy is created
    // so that the behavior is the same when examining values
    // that are no longer active on the element.
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
    const config = this.config;
    let data = this._data;

    // the direct pass code doesn't convert [style] or [class] values
    // into StylingMapArray instances. For this reason, the values
    // need to be converted ahead of time since the styling debug
    // relies on context resolution to figure out what styling
    // values have been added/removed on the element.
    if (config.allowDirectStyling && config.hasMapBindings) {
      data = data.concat([]);  // make a copy
      this._convertMapBindingsToStylingMapArrays(data);
    }

    this._mapValues(data, (prop: string, value: any) => { entries[prop] = value; });
    return entries;
  }

  private _convertMapBindingsToStylingMapArrays(data: LStylingData) {
    const context = this.context.context;
    const limit = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
    for (let i =
             TStylingContextIndex.ValuesStartPosition + TStylingContextIndex.BindingsStartOffset;
         i < limit; i++) {
      const bindingIndex = context[i] as number;
      const bindingValue = bindingIndex !== 0 ? getValue(data, bindingIndex) : null;
      if (bindingValue && !Array.isArray(bindingValue)) {
        const stylingMapArray = normalizeIntoStylingMap(null, bindingValue, !this._isClassBased);
        setValue(data, bindingIndex, stylingMapArray);
      }
    }
  }

  private _mapValues(data: LStylingData, fn: (prop: string, value: string|null) => any) {
    // there is no need to store/track an element instance. The
    // element is only used when the styling algorithm attempts to
    // style the value (and we mock out the stylingApplyFn anyway).
    const mockElement = {} as any;
    const mapBindingsFlag =
        this._isClassBased ? TNodeFlags.hasClassMapBindings : TNodeFlags.hasStyleMapBindings;
    const hasMaps = hasConfig(this._tNode, mapBindingsFlag);
    if (hasMaps) {
      activateStylingMapFeature();
    }

    const renderer = new MockRendererForStyling();
    const mapFn = this._isClassBased ? setClass : setStyle;
    const sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());

    // run the template bindings
    applyStylingViaContext(
        this.context.context, this._tNode, renderer, mockElement, data, true, mapFn, sanitizer,
        false, this._isClassBased);

    // and also the host bindings
    applyStylingViaContext(
        this.context.context, this._tNode, renderer, mockElement, data, true, mapFn, sanitizer,
        true, this._isClassBased);

    const values =
        this._isClassBased ? renderer.computeClassValues() : renderer.computeStyleValues();
    Object.keys(values).forEach(prop => { fn(prop, values[prop]); });
  }
}

class MockRendererForStyling implements ProceduralRenderer3 {
  private _classAttr: string = '';
  private _styleAttr: string = '';
  private _styles: {[key: string]: any} = {};
  private _classes: {[key: string]: any} = {};

  destroy(): void { throwUndefinedMethodError(); }

  createComment(value: string): RComment { return throwUndefinedMethodError(); }

  createElement(name: string, namespace?: string|null): RElement {
    return throwUndefinedMethodError();
  }

  createText(value: string): RText { return throwUndefinedMethodError(); }

  appendChild(parent: RElement, newChild: RNode): void { throwUndefinedMethodError(); }

  insertBefore(parent: RNode, newChild: RNode, refChild: RNode|null): void {
    throwUndefinedMethodError();
  }

  removeChild(parent: RElement, oldChild: RNode, isHostElement?: boolean): void {
    throwUndefinedMethodError();
  }

  selectRootElement(selectorOrNode: string|any): RElement { return throwUndefinedMethodError(); }

  parentNode(node: RNode): RElement|null { return throwUndefinedMethodError(); }

  nextSibling(node: RNode): RNode|null { return throwUndefinedMethodError(); }

  setProperty(el: RElement, name: string, value: any): void { throwUndefinedMethodError(); }

  setValue(node: RText|RComment, value: string): void { throwUndefinedMethodError(); }

  listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void {
    throwUndefinedMethodError();
    return () => {};
  }

  setAttribute(el: RElement, name: string, value: string, namespace?: string|null): void {
    if (name === 'class') {
      this._classAttr = value;
    } else {
      this._styleAttr = value;
    }
  }

  removeAttribute(el: RElement, name: string, namespace?: string|null): void {
    if (name === 'class') {
      this._classAttr = '';
    } else {
      this._styleAttr = '';
    }
  }

  addClass(el: RElement, name: string): void { this._classes[name] = true; }

  removeClass(el: RElement, name: string): void { this._classes[name] = false; }

  setStyle(
      el: RElement, style: string, value: any,
      flags?: RendererStyleFlags2|RendererStyleFlags3): void {
    this._styles[style] = value;
  }

  removeStyle(el: RElement, style: string, flags?: RendererStyleFlags2|RendererStyleFlags3): void {
    this._styles[style] = null;
  }

  computeStyleValues(): {[key: string]: any} {
    let values: {[prop: string]: string | null} = {};
    if (this._styleAttr) {
      const directStyles = parseStyleString(this._styleAttr);
      for (let i = StylingMapArrayIndex.ValuesStartPosition; i < directStyles.length;
           i += StylingMapArrayIndex.TupleSize) {
        const prop = getMapProp(directStyles, i);
        const value = getMapValue(directStyles, i);
        values[prop] = value;
      }
    }
    values = {...values, ...this._styles};
    return values;
  }

  computeClassValues(): {[key: string]: any} {
    let values: {[klass: string]: boolean} = {};
    if (this._classAttr) {
      this._classAttr.split(/\s+/).forEach(klass => values[klass] = true);
    }
    values = {...values, ...this._classes};
    return values;
  }
}

function throwUndefinedMethodError() {
  throw new Error('DebugStyle Mock does not implement');
  return null as any;
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
  const allowDirectStyling = _allowDirectStyling(tNode, isClassBased, false);
  return {
      hasMapBindings,       //
      hasPropBindings,      //
      hasCollisions,        //
      hasTemplateBindings,  //
      hasHostBindings,      //
      allowDirectStyling,   //
  };
}
