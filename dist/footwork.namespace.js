(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.footwork = global.footwork || {}, global.footwork.namespace = global.footwork.namespace || {})));
}(this, (function (exports) { 'use strict';

//
// Array utilities
//
/* eslint no-cond-assign: 0 */

function arrayForEach(array, action) {
    for (var i = 0, j = array.length; i < j; i++)
        action(array[i], i);
}

function arrayIndexOf(array, item) {
    // IE9
    if (typeof Array.prototype.indexOf == "function")
        return Array.prototype.indexOf.call(array, item);
    for (var i = 0, j = array.length; i < j; i++)
        if (array[i] === item)
            return i;
    return -1;
}



function arrayRemoveItem(array, itemToRemove) {
    var index = arrayIndexOf(array, itemToRemove);
    if (index > 0) {
        array.splice(index, 1);
    }
    else if (index === 0) {
        array.shift();
    }
}












function makeArray(arrayLikeObject) {
    var result = [];
    for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
        result.push(arrayLikeObject[i]);
    }
    return result;
}




// Go through the items that have been added and deleted and try to find matches between them.
function findMovesInArrayComparison(left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
}



var statusNotInOld = 'added';
var statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
function compareArrays(oldArray, newArray, options) {
    // For backward compatibility, if the third arg is actually a bool, interpret
    // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
    options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
    oldArray = oldArray || [];
    newArray = newArray || [];

    if (oldArray.length < newArray.length)
        return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
    else
        return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
}


function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
    var myMin = Math.min,
        myMax = Math.max,
        editDistanceMatrix = [],
        smlIndex, smlIndexMax = smlArray.length,
        bigIndex, bigIndexMax = bigArray.length,
        compareRange = (bigIndexMax - smlIndexMax) || 1,
        maxDistance = smlIndexMax + bigIndexMax + 1,
        thisRow, lastRow,
        bigIndexMaxForRow, bigIndexMinForRow;

    for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
        lastRow = thisRow;
        editDistanceMatrix.push(thisRow = []);
        bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
        bigIndexMinForRow = myMax(0, smlIndex - 1);
        for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
            if (!bigIndex)
                thisRow[bigIndex] = smlIndex + 1;
            else if (!smlIndex)  // Top row - transform empty array into new array via additions
                thisRow[bigIndex] = bigIndex + 1;
            else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
            else {
                var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
            }
        }
    }

    var editScript = [], meMinusOne, notInSml = [], notInBig = [];
    for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
        meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
        if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
            notInSml.push(editScript[editScript.length] = {     // added
                'status': statusNotInSml,
                'value': bigArray[--bigIndex],
                'index': bigIndex });
        } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
            notInBig.push(editScript[editScript.length] = {     // deleted
                'status': statusNotInBig,
                'value': smlArray[--smlIndex],
                'index': smlIndex });
        } else {
            --bigIndex;
            --smlIndex;
            if (!options['sparse']) {
                editScript.push({
                    'status': "retained",
                    'value': bigArray[bigIndex] });
            }
        }
    }

    // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
    // smlIndexMax keeps the time complexity of this algorithm linear.
    findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

    return editScript.reverse();
}

//
// This becomes ko.options
// --
//
// This is the root 'options', which must be extended by others.

var options = {
    deferUpdates: false,

    useOnlyNativeEvents: false,

    protoProperty: '__ko_proto__',

    // Modify the default attribute from `data-bind`.
    defaultBindingAttribute: 'data-bind',

    // Enable/disable <!-- ko binding: ... -> style bindings
    allowVirtualElements: true,

    // Global variables that can be accessed from bindings.
    bindingGlobals: window,

    // An instance of the binding provider.
    bindingProviderInstance: null,

    // jQuery will be automatically set to window.jQuery in applyBindings
    // if it is (strictly equal to) undefined.  Set it to false or null to
    // disable automatically setting jQuery.
    jQuery: window && window.jQuery,

    taskScheduler: null,

    debug: false,

    // Filters for bindings
    //   data-bind="expression | filter_1 | filter_2"
    filters: {},

    onError: function (e) { throw e; },

    set: function (name, value) {
        options[name] = value;
    }
};

Object.defineProperty(options, '$', {
    get: function () { return options.jQuery; }
});

//
// Error handling
// ---
//
// The default onError handler is to re-throw.
function catchFunctionErrors(delegate) {
    return options.onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            options.onError(e);
        }
    } : delegate;
}

function deferError(error) {
    safeSetTimeout(function () { options.onError(error); }, 0);
}


function safeSetTimeout(handler, timeout) {
    return setTimeout(catchFunctionErrors(handler), timeout);
}

//
// Asynchronous functionality
// ---
function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = safeSetTimeout(function () {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = safeSetTimeout(callback, timeout);
    };
}

//
// Detection and Workarounds for Internet Explorer
//
/* eslint no-empty: 0 */

// Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
// Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
// Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
// If there is a future need to detect specific versions of IE10+, we will amend this.
var ieVersion = document && (function() {
    var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
    ) {}
    return version > 4 ? version : undefined;
}());

//
// Object functions
//

function extend(target, source) {
    if (source) {
        for(var prop in source) {
            if(source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
}

function objectForEach(obj, action) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            action(prop, obj[prop]);
        }
    }
}

//
// Prototype Functions
//
var protoProperty$1 = options.protoProperty;

var canSetPrototype = ({ __proto__: [] } instanceof Array);

function setPrototypeOf(obj, proto) {
    obj.__proto__ = proto;
    return obj;
}

var setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend;

function hasPrototype(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty$1] === undefined)) return false;
    if (instance[protoProperty$1] === prototype) return true;
    return hasPrototype(instance[protoProperty$1], prototype); // Walk the prototype chain
}

//
// String (and JSON)
//


function stringTrim (string) {
    return string === null || string === undefined ? '' :
        string.trim ?
            string.trim() :
            string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}

//
// ES6 Symbols
//

var useSymbols = typeof Symbol === 'function';

function createSymbolOrString(identifier) {
    return useSymbols ? Symbol(identifier) : identifier;
}

//
// DOM - CSS
//

//
// jQuery
//
// TODO: deprecate in favour of options.$

var jQueryInstance = window && window.jQuery;

//
// Information about the DOM
//

//
// DOM node data
//
//
var dataStoreKeyExpandoPropertyName = "__ko__data" + new Date();
var dataStore;
var uniqueId = 0;
var get;
var set;
var clear;

/**
 * --- Legacy getter/setter (may cause memory leaks) ---
 */
function getAll(node, createIfNotFound) {
    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
    if (!hasExistingDataStore) {
        if (!createIfNotFound)
            return undefined;
        dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
        dataStore[dataStoreKey] = {};
    }
    return dataStore[dataStoreKey];
}

function legacyGet(node, key) {
    var allDataForNode = getAll(node, false);
    return allDataForNode === undefined ? undefined : allDataForNode[key];
}

function legacySet(node, key, value) {
    if (value === undefined) {
        // Make sure we don't actually create a new domData key if we are actually deleting a value
        if (getAll(node, false) === undefined)
            return;
    }
    var allDataForNode = getAll(node, true);
    allDataForNode[key] = value;
}

function legacyClear(node) {
    var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
    if (dataStoreKey) {
        delete dataStore[dataStoreKey];
        node[dataStoreKeyExpandoPropertyName] = null;
        return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
    }
    return false;
}

/**
 * WeakMap get/set/clear
 */

function wmGet(node, key) {
    return (dataStore.get(node) || {})[key];
}

function wmSet(node, key, value) {
    var dataForNode;
    if (dataStore.has(node)) {
        dataForNode = dataStore.get(node);
    } else {
        dataForNode = {};
        dataStore.set(node, dataForNode);
    }
    dataForNode[key] = value;
}

function wmClear(node) {
    dataStore.set(node, {});
}


if ('WeakMap' in window) {
    dataStore = new WeakMap();
    get = wmGet;
    set = wmSet;
    clear = wmClear;
} else {
    dataStore = {};
    get = legacyGet;
    set = legacySet;
    clear = legacyClear;
}



/**
 * Create a unique key-string identifier.
 * FIXME: This should be deprecated.
 */
function nextKey() {
    return (uniqueId++) + dataStoreKeyExpandoPropertyName;
}

//
// DOM node disposal
//
/* eslint no-cond-assign: 0 */
var domDataKey = nextKey();
// Exports









// Expose supplemental node cleaning functions.
var otherNodeCleanerFunctions = [];


// Special support for jQuery here because it's so commonly used.
// Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
// so notify it to tear down any resources associated with the node & descendants here.
function cleanjQueryData(node) {
    var jQueryCleanNodeFn = jQueryInstance
        ? jQueryInstance.cleanData : null;

    if (jQueryCleanNodeFn) {
        jQueryCleanNodeFn([node]);
    }
}


otherNodeCleanerFunctions.push(cleanjQueryData);

//
// DOM Events
//

// Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
var knownEvents = {};
var knownEventTypesByEventName = {};

var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';

knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];

knownEvents['MouseEvents'] = [
    'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover',
    'mouseout', 'mouseenter', 'mouseleave'];


objectForEach(knownEvents, function(eventType, knownEventsForType) {
    if (knownEventsForType.length) {
        for (var i = 0, j = knownEventsForType.length; i < j; i++)
            knownEventTypesByEventName[knownEventsForType[i]] = eventType;
    }
});

//
//  DOM node manipulation
//

/* eslint no-cond-assign: 0 */
//
// Virtual Elements
//
//
// "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
// may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
// If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
// of that virtual hierarchy
//
// The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
// without having to scatter special cases all over the binding and templating code.

// IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
// but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
// So, use node.text where available, and node.nodeValue elsewhere
var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

//
// DOM manipulation
//
/* eslint no-empty: 0 */

//
// HTML-based manipulation
//
var none = [0, "", ""];
var table = [1, "<table>", "</table>"];
var tbody = [2, "<table><tbody>", "</tbody></table>"];
var colgroup = [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"];
var tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"];
var select = [1, "<select multiple='multiple'>", "</select>"];
var fieldset = [1, "<fieldset>", "</fieldset>"];
var map = [1, "<map>", "</map>"];
var object = [1, "<object>", "</object>"];
var lookup = {
        'area': map,
        'col': colgroup,
        'colgroup': table,
        'caption': table,
        'legend': fieldset,
        'thead': table,
        'tbody': table,
        'tfoot': table,
        'tr': tbody,
        'td': tr,
        'th': tr,
        'option': select,
        'optgroup': select,
        'param': object
    };
var supportsTemplateTag = 'content' in document.createElement('template');


function getWrap(tags) {
    var m = tags.match(/^<([a-z]+)[ >]/);
    return (m && lookup[m[1]]) || none;
}


/**
 * parseHtmlFragment converts a string into an array of DOM Nodes.
 * If supported, it uses <template>-tag parsing, falling back on
 * jQuery parsing (if jQuery is present), and finally on a
 * straightforward parser.
 *
 * @param  {string} html            To be parsed.
 * @param  {Object} documentContext That owns the executing code.
 * @return {[DOMNode]}              Parsed DOM Nodes
 */



/**
  * setHtml empties the node's contents, unwraps the HTML, and
  * sets the node's HTML using jQuery.html or parseHtmlFragment
  *
  * @param {DOMNode} node Node in which HTML needs to be set
  * @param {DOMNode} html HTML to be inserted in node
  * @returns undefined
  */

//
// Memoization
//

//
//  Tasks Micro-scheduler
//  ===
//
/* eslint no-cond-assign: 0 */
var taskQueue = [];
var taskQueueLength = 0;
var nextHandle = 1;
var nextIndexToProcess = 0;

if (window.MutationObserver && !(window.navigator && window.navigator.standalone)) {
    // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
    // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
    options.taskScheduler = (function (callback) {
        var div = document.createElement("div");
        new MutationObserver(callback).observe(div, {attributes: true});
        return function () { div.classList.toggle("foo"); };
    })(scheduledProcess);
} else if (document && "onreadystatechange" in document.createElement("script")) {
    // IE 6-10
    // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
    options.taskScheduler = function (callback) {
        var script = document.createElement("script");
        script.onreadystatechange = function () {
            script.onreadystatechange = null;
            document.documentElement.removeChild(script);
            script = null;
            callback();
        };
        document.documentElement.appendChild(script);
    };
} else {
    options.taskScheduler = function (callback) {
        setTimeout(callback, 0);
    };
}

function processTasks() {
    if (taskQueueLength) {
        // Each mark represents the end of a logical group of tasks and the number of these groups is
        // limited to prevent unchecked recursion.
        var mark = taskQueueLength, countMarks = 0;

        // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
        for (var task; nextIndexToProcess < taskQueueLength; ) {
            if (task = taskQueue[nextIndexToProcess++]) {
                if (nextIndexToProcess > mark) {
                    if (++countMarks >= 5000) {
                        nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                        deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                        break;
                    }
                    mark = taskQueueLength;
                }
                try {
                    task();
                } catch (ex) {
                    deferError(ex);
                }
            }
        }
    }
}

function scheduledProcess() {
    processTasks();

    // Reset the queue
    nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
}

function scheduleTaskProcessing() {
    options.taskScheduler(scheduledProcess);
}


function schedule(func) {
    if (!taskQueueLength) {
        scheduleTaskProcessing();
    }

    taskQueue[taskQueueLength++] = func;
    return nextHandle++;
}

function cancel(handle) {
    var index = handle - (nextHandle - taskQueueLength);
    if (index >= nextIndexToProcess && index < taskQueueLength) {
        taskQueue[index] = null;
    }
}

// For testing only: reset the queue and return the previous queue length

/*
  tko.util
  ===


*/

// Sub-Modules;

//
//  Defer Updates
//  ===
//
function deferUpdates(target) {
    if (!target._deferUpdates) {
        target._deferUpdates = true;
        target.limit(function (callback) {
            var handle;
            return function () {
                cancel(handle);
                handle = schedule(callback);
                target.notifySubscribers(undefined, 'dirty');
            };
        });
    }
}

//
// Observable extenders
// ---
//
var primitiveTypes = {
    'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
};


function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}


function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            } else {
                options.onError(new Error("Extender not found: " + key));
            }
        });
    }
    return target;
}

/*
                --- DEFAULT EXTENDERS ---
 */


// Change when notifications are published.
function notify(target, notifyWhen) {
    target.equalityComparer = notifyWhen == "always" ?
        null :  // null equalityComparer means to always notify
        valuesArePrimitiveAndEqual;
}


function deferred(target, option) {
    if (option !== true) {
        throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.');
    }
    deferUpdates(target);
}


function rateLimit(target, options$$1) {
    var timeout, method, limitFunction;

    if (typeof options$$1 == 'number') {
        timeout = options$$1;
    } else {
        timeout = options$$1.timeout;
        method = options$$1.method;
    }

    // rateLimit supersedes deferred updates
    target._deferUpdates = false;

    limitFunction = method == 'notifyWhenChangesStop' ? debounce : throttle;

    target.limit(function(callback) {
        return limitFunction(callback, timeout);
    });
}


var extenders = {
    notify: notify,
    deferred: deferred,
    rateLimit: rateLimit
};

/* eslint no-cond-assign: 0 */
function subscription(target, callback, disposeCallback) {
    this._target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
}

subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

function subscribable() {
    setPrototypeOfOrExtend(this, ko_subscribable_fn);
    ko_subscribable_fn.init(this);
}

var defaultEvent = "change";


var ko_subscribable_fn = {
    init: function(instance) {
        instance._subscriptions = {};
        instance._versionNumber = 1;
    },

    subscribe: function (callback, callbackTarget, event) {
        var self = this;

        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscriptionInstance = new subscription(self, boundCallback, function () {
            arrayRemoveItem(self._subscriptions[event], subscriptionInstance);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event);
        });

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscriptionInstance);

        return subscriptionInstance;
    },

    notifySubscribers: function (valueToNotify, event) {
        event = event || defaultEvent;
        if (event === defaultEvent) {
            this.updateVersion();
        }
        if (this.hasSubscriptionsForEvent(event)) {
            try {
                begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var a = this._subscriptions[event].slice(0), i = 0, subscriptionInstance; subscriptionInstance = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscriptionInstance.isDisposed)
                        subscriptionInstance.callback(valueToNotify);
                }
            } finally {
                end(); // End suppressing dependency detection
            }
        }
    },

    getVersion: function () {
        return this._versionNumber;
    },

    hasChanged: function (versionToCheck) {
        return this.getVersion() !== versionToCheck;
    },

    updateVersion: function () {
        ++this._versionNumber;
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function (event) {
        if (event) {
            return this._subscriptions[event] && this._subscriptions[event].length || 0;
        } else {
            var total = 0;
            objectForEach(this._subscriptions, function(eventName, subscriptions) {
                if (eventName !== 'dirty')
                    total += subscriptions.length;
            });
            return total;
        }
    },

    isDifferent: function(oldValue, newValue) {
        return !this.equalityComparer ||
               !this.equalityComparer(oldValue, newValue);
    },

    extend: applyExtenders
};


// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (canSetPrototype) {
    setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

subscribable.fn = ko_subscribable_fn;


function isSubscribable(instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
}

//
// dependencyDetection
// ---
//
// In KO 3.x, dependencyDetection was also known as computedContext.
//
var outerFrames = [];
var currentFrame;
var lastId = 0;

// Return a unique ID that can be assigned to an observable for dependency tracking.
// Theoretically, you could eventually overflow the number storage size, resulting
// in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
// or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
// take over 285 years to reach that number.
// Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
function getId() {
    return ++lastId;
}

function begin(options) {
    outerFrames.push(currentFrame);
    currentFrame = options;
}

function end() {
    currentFrame = outerFrames.pop();
}


function registerDependency(subscribable$$1) {
    if (currentFrame) {
        if (!isSubscribable(subscribable$$1))
            throw new Error("Only subscribable things can act as dependencies");
        currentFrame.callback.call(currentFrame.callbackTarget, subscribable$$1, subscribable$$1._id || (subscribable$$1._id = getId()));
    }
}

//
//  Observable values
//  ---
//
var observableLatestValue = createSymbolOrString('_latestValue');


function observable(initialValue) {
    function Observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (Observable.isDifferent(Observable[observableLatestValue], arguments[0])) {
                Observable.valueWillMutate();
                Observable[observableLatestValue] = arguments[0];
                Observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            registerDependency(Observable); // The caller only needs to be notified of changes if they did a "read" operation
            return Observable[observableLatestValue];
        }
    }

    Observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        extend(Observable, subscribable.fn);
    }
    subscribable.fn.init(Observable);

    // Inherit from 'observable'
    setPrototypeOfOrExtend(Observable, observable.fn);

    if (options.deferUpdates) {
        deferUpdates(Observable);
    }

    return Observable;
}

// Define prototype for observables
observable.fn = {
    equalityComparer: valuesArePrimitiveAndEqual,
    peek: function() { return this[observableLatestValue]; },
    valueHasMutated: function () { this.notifySubscribers(this[observableLatestValue]); },
    valueWillMutate: function () {
        this.notifySubscribers(this[observableLatestValue], 'beforeChange');
    }
};



// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers(value, event) {
    if (!event || event === defaultEvent) {
        this._limitChange(value);
    } else if (event === 'beforeChange') {
        this._limitBeforeChange(value);
    } else {
        this._origNotifySubscribers(value, event);
    }
}

// Add `limit` function to the subscribable prototype
subscribable.fn.limit = function limit(limitFunction) {
    var self = this, selfIsObservable = isObservable(self),
        ignoreBeforeChange, previousValue, pendingValue, beforeChange = 'beforeChange';

    if (!self._origNotifySubscribers) {
        self._origNotifySubscribers = self.notifySubscribers;
        self.notifySubscribers = limitNotifySubscribers;
    }

    var finish = limitFunction(function() {
        self._notificationIsPending = false;

        // If an observable provided a reference to itself, access it to get the latest value.
        // This allows computed observables to delay calculating their value until needed.
        if (selfIsObservable && pendingValue === self) {
            pendingValue = self();
        }
        ignoreBeforeChange = false;
        if (self.isDifferent(previousValue, pendingValue)) {
            self._origNotifySubscribers(previousValue = pendingValue);
        }
    });

    self._limitChange = function(value) {
        self._notificationIsPending = ignoreBeforeChange = true;
        pendingValue = value;
        finish();
    };
    self._limitBeforeChange = function(value) {
        if (!ignoreBeforeChange) {
            previousValue = value;
            self._origNotifySubscribers(value, beforeChange);
        }
    };
};


// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the observable constructor
if (canSetPrototype) {
    setPrototypeOf(observable.fn, subscribable.fn);
}

var protoProperty = observable.protoProperty = options.protoProperty;
observable.fn[protoProperty] = observable;

function isObservable(instance) {
    return hasPrototype(instance, observable);
}

//
// Observable Array - Change Tracking Extender
// ---
//
/* eslint no-fallthrough: 0*/

var arrayChangeEventName = 'arrayChange';


function trackArrayChanges(target, options$$1) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
    target.compareArrayOptions = {};
    if (options$$1 && typeof options$$1 == "object") {
        extend(target.compareArrayOptions, options$$1);
    }
    target.compareArrayOptions.sparse = true;

    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        arrayChangeSubscription,
        pendingNotifications = 0,
        underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
        underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.beforeSubscriptionAdd = function (event) {
        if (underlyingBeforeSubscriptionAddFunction)
            underlyingBeforeSubscriptionAddFunction.call(target, event);
        if (event === arrayChangeEventName) {
            trackChanges();
        }
    };

    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
    target.afterSubscriptionRemove = function (event) {
        if (underlyingAfterSubscriptionRemoveFunction)
            underlyingAfterSubscriptionRemoveFunction.call(target, event);
        if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
            arrayChangeSubscription.dispose();
            trackingChanges = false;
        }
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        var underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        arrayChangeSubscription = target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;

            if (changes && changes.length) {
                target['notifySubscribers'](changes, arrayChangeEventName);
            }
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = trackArrayChanges.compareArrays(previousContents, currentContents, target.compareArrayOptions);
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        var index, argsIndex;
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
        }
        switch (operationName) {
        case 'push':
            offset = arrayLength;
        case 'unshift':
            for (index = 0; index < argsLength; index++) {
                pushDiff('added', args[index], offset + index);
            }
            break;

        case 'pop':
            offset = arrayLength - 1;
        case 'shift':
            if (arrayLength) {
                pushDiff('deleted', rawArray[offset], offset);
            }
            break;

        case 'splice':
            // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
            var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                endAddIndex = startIndex + argsLength - 2,
                endIndex = Math.max(endDeleteIndex, endAddIndex),
                additions = [], deletions = [];
            for (index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                if (index < endDeleteIndex)
                    deletions.push(pushDiff('deleted', rawArray[index], index));
                if (index < endAddIndex)
                    additions.push(pushDiff('added', args[argsIndex], index));
            }
            findMovesInArrayComparison(deletions, additions);
            break;

        default:
            return;
        }
        cachedDiff = diff;
    };
}


// Expose compareArrays for testing.
trackArrayChanges.compareArrays = compareArrays;


// Add the trackArrayChanges extender so we can use
// obs.extend({ trackArrayChanges: true })
extenders.trackArrayChanges = trackArrayChanges;

//
// Observable Arrays
// ===
//
function observableArray(initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = observable(initialValues);
    setPrototypeOfOrExtend(result, observableArray.fn);
    trackArrayChanges(result);
        // ^== result.extend({ trackArrayChanges: true })
    return result;
}

observableArray.fn = {
    remove: function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    removeAll: function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    destroy: function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    destroyAll: function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this.destroy(function() { return true; });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this.destroy(function (value) {
            return arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    indexOf: function (item) {
        var underlyingArray = this();
        return arrayIndexOf(underlyingArray, item);
    },

    replace: function(oldItem, newItem) {
        var index = this.indexOf(oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};


// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (canSetPrototype) {
    setPrototypeOf(observableArray.fn, observable.fn);
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    observableArray.fn[methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
        return methodCallResult === underlyingArray ? this : methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
arrayForEach(["slice"], function (methodName) {
    observableArray.fn[methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

//
// Helpers
// ---
// toJS & toJSON
//

//
// Observables.
// ---
//
// The following are added to the root `[t]ko` object.
//

var _$1 = require('footwork-lodash');

var privateDataSymbol$1 = Symbol.for('footwork');

/**
 * Publish data on a topic of a namespace.
 *
 * @param {any} topic
 * @param {any} data
 * @returns {object} the namespace instance
 */
function publish(topic, data) {
  this[privateDataSymbol$1].postbox.notifySubscribers(data, topic);
  return this;
}

/**
 * Subscribe to a topic on a namespace.
 *
 * @param {string} topic the topic string, or thing/message that you want to subscribe to
 * @param {function} callback the callback triggered with the data
 * @param {any} context the context given to the callback
 * @returns {object} the subscription that was created
 */
function subscribe(topic, callback, context) {
  if (arguments.length > 2) {
    callback = _$1.bind(callback, context);
  }
  var subscription = this[privateDataSymbol$1].postbox.subscribe(callback, null, topic);
  this[privateDataSymbol$1].subscriptions.push(subscription);
  return subscription;
}

/**
 * Unsubscribe a namespace subscription.
 *
 * @param {object} subscription the subscription to unsubscribe
 * @returns {object} the namespace instance
 */
function unsubscribe(subscription) {
  subscription && _$1.isFunction(subscription.dispose) && subscription.dispose();
  return this;
}

/**
 * Issue a request for data using the supplied topic and params and return the response.
 *
 * @param {string} topic the topic/data you are requesting
 * @param {any} requestParams any data to pass along to the handler on the other side
 * @param {boolean} allowMultipleResponses if true then all the responses will be returned in an array, if false (or not defined) only the first response will be returned
 * @returns {any} the returned data (or undefined)
 */
function request(topic, requestParams, allowMultipleResponses) {
  var response = undefined;

  var responseSubscription = this[privateDataSymbol$1].postbox.subscribe(function (reqResponse) {
    if (_$1.isUndefined(response)) {
      response = allowMultipleResponses ? [reqResponse] : reqResponse;
    } else if (allowMultipleResponses) {
      response.push(reqResponse);
    }
  }, null, 'req.' + topic + '.resp');

  this[privateDataSymbol$1].postbox.notifySubscribers(requestParams, 'req.' + topic);
  responseSubscription.dispose();

  return response;
}

/**
 * Create a request handler to respond to the requested topic using the specified callback.
 *
 * @param {string} topic
 * @param {function} callback the callback which is passed the topic data and whos return result is send to back to the requester
 * @param {any} context the context given to the callback
 * @returns {object} the request subscription that was created
 */
function requestHandler(topic, callback, context) {
  var self = this;

  if (!_$1.isUndefined(context)) {
    callback = _$1.bind(callback, context);
  }

  var subscription = self[privateDataSymbol$1].postbox.subscribe(function (reqResponse) {
    self[privateDataSymbol$1].postbox.notifySubscribers(callback(reqResponse), 'req.' + topic + '.resp');
  }, null, 'req.' + topic);

  self[privateDataSymbol$1].subscriptions.push(subscription);

  return subscription;
}

/**
 * Dispose of the namespace (clear all subscriptions/handlers)
 *
 * @returns {object} the namespace instance
 */
function dispose() {
  _$1.invokeMap(this[privateDataSymbol$1].subscriptions, 'dispose');
  return this;
}

/**
 * Return the name of the namespace
 * @returns {string} the namespace name
 */
function getName() {
  return this[privateDataSymbol$1].namespaceName;
}

var methods = Object.freeze({
	publish: publish,
	subscribe: subscribe,
	unsubscribe: unsubscribe,
	request: request,
	requestHandler: requestHandler,
	dispose: dispose,
	getName: getName
});

/**
 * Namespace postbox-based communication based on: http://www.knockmeout.net/2012/05/using-ko-native-pubsub.html
 */
var postboxes = {};

/**
 * Construct a new namespace instance. The generator also creates or returns an instance of the namespace subscribable.
 *
 * @param {string} namespaceName
 * @returns {object} the namespace (this)
 */
function Namespace(namespaceName) {
  if (typeof new.target === 'undefined') {
    return new Namespace(namespaceName);
  }

  this[privateDataSymbol] = {
    namespaceName: namespaceName || '__footwork',
    postbox: postboxes[namespaceName] = postboxes[namespaceName] || new subscribable(),
    subscriptions: []
  };
}

_.extend(Namespace.prototype, methods);

exports.Namespace = Namespace;

Object.defineProperty(exports, '__esModule', { value: true });

})));
