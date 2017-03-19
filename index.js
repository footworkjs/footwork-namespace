import { subscribable } from 'tko.observable';
import * as methods from './src/methods.js';

/**
 * Namespace postbox-based communication based on: http://www.knockmeout.net/2012/05/using-ko-native-pubsub.html
 */
const postboxes = {};

/**
 * Construct a new namespace instance. The generator also creates or returns an instance of the namespace subscribable.
 *
 * @param {string} namespaceName
 * @returns {object} the namespace (this)
 */
export function Namespace (namespaceName) {
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
