import {NgZone} from 'angular2/src/core/zone';
import {Injectable} from 'angular2/src/core/di';

export class AnimatorEventsFilter {

  _registry = [];
  _refMap = new Map();
  _styleMap = new Map<any, Array<any>>();

  constructor(entries = []) {
    entries.forEach((entry) => this.add(entry));
  }

  _isStyleEvent(event) {
    return event == 'style';
  }

  add(entry) {
    var node = entry['node'];
    var event = entry['event'];
    var parent = node.parentNode;
    if (this._isStyleEvent(event)) {
      var sharedStyles = this._styleMap.get(node);
      if (!sharedStyles) {
        sharedStyles = [];
        this._styleMap.set(node, sharedStyles);
      }
      sharedStyles.push(entry);
      return;
    }

    var ref = node.getAttribute('data-ng-anchor');
    if (ref && this._isStructuralEvent(event)) {
      var candidateEvent = this._refMap.get(ref);
      var isOppositeEvent = candidateEvent &&
                        candidateEvent['event'] == (event == "enter" ? "leave" : "enter") &&
                        candidateEvent['node'] !== node;

      if (candidateEvent && isOppositeEvent) {
        this._refMap.delete(ref);

        // this will ensure that the events/elements are always handled
        // in leave and then enter order
        var containedAnimations = [entry, candidateEvent].sort((a,b) => {
          return a['event'] == "leave" ? 0 : 1;
        });

        var combinedCallback = () => {
          containedAnimations.forEach((c) => c['callback']());
        };

        var combinedElements = containedAnimations.map((c) => c['node']);
        this._registry.push({
          event: 'swap',
          node: entry['node'],
          callback: combinedCallback,
          data: {
            elements: combinedElements,
            anchors: []
          }
        });
      } else {
        this._refMap.set(ref, entry);
      }
    } else {
      this._registry.push(entry);
    }
  }

  _isStructuralEvent(eventName) {
    return eventName == "enter" || eventName == "leave" || eventName == "move";
  }

  getItems() {
    var items = this._registry.map((item) => item);

    this._styleMap.forEach((entry) => {
      items.push(combineStyleEntries(entry));
    });

    this._refMap.forEach((entry) => {
      items.push(entry);
    });

    return items;

    function combineStyleEntries(entries) {
      var firstEntry = entries[0];
      if (entries.length == 1) return firstEntry;

      var combinedCallback = () => {
        entries.forEach((entry) => entry['callback']());
      };

      var combinedStyles = {};
      entries.forEach((entry) => {
        var styles = entry['data']['style'];
        for (var prop in styles) {
          combinedStyles[prop] = styles[prop];
        }
      });

      return {
        node: firstEntry['node'],
        event: 'style',
        callback: combinedCallback,
        data: {
          callback: combinedCallback,
          collectedEvents: firstEntry['data']['collectedEvents'],
          style: combinedStyles
        }
      }
    }
  }

}

@Injectable()
export class AnimatorDispatch {
  private _entries = [];
  private _counter = 0;

  constructor(private _zone: NgZone) {}

  queue(node, event, data = {}, callback = null) {
    this._entries.push({
      event: event,
      node: node,
      data: data,
      callback: callback
    });

    if (this._entries.length == 1) {
      this._onTick(() => this.flush());
    }
  }

  flush() {
    var relativeEntries = this._mergeRelativeEvents(this._entries);
    var patchedEntries = relativeEntries.map((entry) => {
      entry['callback'] = entry['callback'] || function() { };
      return entry;
    });
    var sortedEntries = patchedEntries.sort((a,b) => {
      var nodeA = a['node'];
      var nodeB = b['node'];
      return nodeA.contains(nodeB) ? -1 : 1;
    });

    this._counter++;
    this._entries = [];

    for (var i = 0; i < sortedEntries.length; i++) {
      this._triggerEvent(sortedEntries[i], relativeEntries);
    }
  }

  _mergeRelativeEvents(entries) {
    return new AnimatorEventsFilter(entries).getItems();
  }

  _triggerEvent(entry, collectedEvents) {
    var callback = entry['callback'];
    if (callback['touched']) return;

    var eventData = entry.data || {};
    eventData['callback'] = callback;
    eventData['collectedEvents'] = collectedEvents.map((item) => item); //clone the array

    var eventName = "ng-" + entry['event'];
    var event = new CustomEvent(eventName, {
      detail: eventData, bubbles: true
    });

    entry['node'].dispatchEvent(event);
    if (!callback['touched']) {
      callback();
    }
  }

  _onTick(callback) {
    var count = ++this._counter;
    this._zone.overrideOnEventDone(() => {
      if (count == this._counter) {
        callback();
      }
    }, true);
  }
}
