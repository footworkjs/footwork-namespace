var _ = require('footwork-lodash');

var privateDataSymbol = Symbol.for('footwork');

/**
 * Publish data on a topic of a namespace.
 *
 * @param {any} topic
 * @param {any} data
 * @returns {object} the namespace instance
 */
export function publish (topic, data) {
  this[privateDataSymbol].postbox.notifySubscribers(data, topic);
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
export function subscribe (topic, callback, context) {
  if (arguments.length > 2) {
    callback = _.bind(callback, context);
  }
  var subscription = this[privateDataSymbol].postbox.subscribe(callback, null, topic);
  this[privateDataSymbol].subscriptions.push(subscription);
  return subscription;
}

/**
 * Unsubscribe a namespace subscription.
 *
 * @param {object} subscription the subscription to unsubscribe
 * @returns {object} the namespace instance
 */
export function unsubscribe (subscription) {
  subscription && _.isFunction(subscription.dispose) && subscription.dispose();
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
export function request (topic, requestParams, allowMultipleResponses) {
  var response = undefined;

  var responseSubscription = this[privateDataSymbol].postbox.subscribe(function (reqResponse) {
    if (_.isUndefined(response)) {
      response = allowMultipleResponses ? [reqResponse] : reqResponse;
    } else if (allowMultipleResponses) {
      response.push(reqResponse);
    }
  }, null, 'req.' + topic + '.resp');

  this[privateDataSymbol].postbox.notifySubscribers(requestParams, 'req.' + topic);
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
export function requestHandler (topic, callback, context) {
  var self = this;

  if (!_.isUndefined(context)) {
    callback = _.bind(callback, context);
  }

  var subscription = self[privateDataSymbol].postbox.subscribe(function (reqResponse) {
    self[privateDataSymbol].postbox.notifySubscribers(callback(reqResponse), 'req.' + topic + '.resp');
  }, null, 'req.' + topic);

  self[privateDataSymbol].subscriptions.push(subscription);

  return subscription;
}

/**
 * Dispose of the namespace (clear all subscriptions/handlers)
 *
 * @returns {object} the namespace instance
 */
export function dispose () {
  _.invokeMap(this[privateDataSymbol].subscriptions, 'dispose');
  return this;
}

/**
 * Return the name of the namespace
 * @returns {string} the namespace name
 */
export function getName () {
  return this[privateDataSymbol].namespaceName;
}
