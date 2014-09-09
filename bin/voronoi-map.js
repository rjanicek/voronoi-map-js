(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

exports.intFromBoolean = function (b) {
    return b ? 1 : 0;
};

exports.booleanFromInt = function (i) {
    return (i === null) ? false : i > 0;
};
},{}],3:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

/**
 * Copyright (c) 2010, Jeash contributors.
 * 
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *   - Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   - Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*

   Contrary to any adobe documentation , points transform with:


   [ X'  Y'  ]   =  [ X  Y  1 ] [  a   b ]
   [  c   d ]
   [  tx  ty]


 */

'use strict';

var core = require('../janicek/core');
var def = core.def;


var matrix = function (inA, inB, inC, inD, inTx, inTy) {
    
    var pub = {

        a: def(inA, 1.0),
        b: def(inB, 0.0),
        c: def(inC, 0.0),
        d: def(inD, 1.0),
        tx: def(inTx, 0.0),
        ty: def(inTy, 0.0),

        clone: function () { return matrix(pub.a, pub.b, pub.c, pub.d, pub.tx, pub.ty); },

        createGradientBox: function (inWidth, inHeight, rotation, inTx, inTy) {
            pub.a = inWidth / 1638.4;
            pub.d = inHeight / 1638.4;

            // rotation is clockwise
            if (!core.isUndefinedOrNull(rotation) && rotation !== 0.0) {
                var cos = Math.cos(rotation);
                var sin = Math.sin(rotation);
                pub.b = sin * pub.d;
                pub.c = -sin * pub.a;
                pub.a *= cos;
                pub.d *= cos;
            } else {
                pub.b = pub.c = 0;
            }

            pub.tx = !core.isUndefinedOrNull(inTx) ? inTx + inWidth / 2 : inWidth / 2;
            pub.ty = !core.isUndefinedOrNull(inTy) ? inTy + inHeight / 2 : inHeight / 2;
        },

        setRotation: function (inTheta, inScale) {
            var scale = core.isUndefinedOrNull(inScale) ? 1.0 : inScale;
            pub.a = Math.cos(inTheta) * scale;
            pub.c = Math.sin(inTheta) * scale;
            pub.b = -pub.c;
            pub.d = pub.a;
        },

        invert: function () {
            var norm = pub.a * pub.d - pub.b * pub.c;
            if (norm === 0) {
                pub.a = pub.b = pub.c = pub.d = 0;
                pub.tx = -pub.tx;
                pub.ty = -pub.ty;
            } else {
                norm = 1.0 / norm;
                var a1 = pub.d * norm;
                pub.d = pub.a * norm;
                pub.a = a1;
                pub.b *= -norm;
                pub.c *= -norm;

                var tx1 = - pub.a * pub.tx - pub.c * pub.ty;
                pub.ty = - pub.b * pub.tx - pub.d * pub.ty;
                pub.tx = tx1;
            }
            return this;
        },

        transformPoint: function (inPos) {
            return {x: inPos.x * pub.a + inPos.y * pub.c + pub.tx, y: inPos.x * pub.b + inPos.y * pub.d + pub.ty };
        },

        translate: function (inDX, inDY) {
            pub.tx += inDX;
            pub.ty += inDY;
        },

        /*
           Rotate object "after" other transforms

           [  a  b   0 ][  ma mb  0 ]
           [  c  d   0 ][  mc md  0 ]
           [  tx ty  1 ][  mtx mty 1 ]

           ma = md = cos
           mb = -sin
           mc = sin
           mtx = my = 0

         */

        rotate: function (inTheta) {
            var cos = Math.cos(inTheta);
            var sin = Math.sin(inTheta);

            var a1 = pub.a * cos - pub.b * sin;
            pub.b = pub.a * sin + pub.b * cos;
            pub.a = a1;

            var c1 = pub.c * cos - pub.d * sin;
            pub.d = pub.c * sin + pub.d * cos;
            pub.c = c1;

            var tx1 = pub.tx * cos - pub.ty * sin;
            pub.ty = pub.tx * sin + pub.ty * cos;
            pub.tx = tx1;
        },

        /*

           Scale object "after" other transforms

           [  a  b   0 ][  sx  0   0 ]
           [  c  d   0 ][  0   sy  0 ]
           [  tx ty  1 ][  0   0   1 ]
         */
        scale: function (inSX, inSY) {
            pub.a *= inSX;
            pub.b *= inSY;

            pub.c *= inSX;
            pub.d *= inSY;

            pub.tx *= inSX;
            pub.ty *= inSY;
        },

        /*

           A "translate" . concat "rotate" rotates the translation component.
           ie,

           [X'] = [X][trans][rotate]


           Multiply "after" other transforms ...


           [  a  b   0 ][  ma mb  0 ]
           [  c  d   0 ][  mc md  0 ]
           [  tx ty  1 ][  mtx mty 1 ]


         */
        concat: function (m) {
            var a1 = pub.a * m.a + pub.b * m.c;
            pub.b = pub.a * m.b + pub.b * m.d;
            pub.a = a1;

            var c1 = pub.c * m.a + pub.d * m.c;
            pub.d = pub.c * m.b + pub.d * m.d;
            pub.c = c1;

            var tx1 = pub.tx * m.a + pub.ty * m.c + m.tx;
            pub.ty = pub.tx * m.b + pub.ty * m.d + m.ty;
            pub.tx = tx1;
        },

        mult: function (m) {
            var result = matrix();
            result.a = pub.a * m.a + pub.b * m.c;
            result.b = pub.a * m.b + pub.b * m.d;
            result.c = pub.c * m.a + pub.d * m.c;
            result.d = pub.c * m.b + pub.d * m.d;

            result.tx = pub.tx * m.a + pub.ty * m.c + m.tx;
            result.ty = pub.tx * m.b + pub.ty * m.d + m.ty;
            return result;
        },

        identity: function () {
            pub.a = 1;
            pub.b = 0;
            pub.c = 0;
            pub.d = 1;
            pub.tx = 0;
            pub.ty = 0;
        },

        toMozString: function () {
            var m = 'matrix(';
            m += pub.a + ', ';
            m += pub.b + ', ';
            m += pub.c + ', ';
            m += pub.d + ', ';
            m += pub.tx + 'px, ';
            m += pub.ty + 'px)';
            return m;
        },

        toString: function () {
            var m = 'matrix(';
            m += pub.a + ', ';
            m += pub.b + ', ';
            m += pub.c + ', ';
            m += pub.d + ', ';
            m += pub.tx + ', ';
            m += pub.ty + ')';
            return m;
        }
    };

    return pub;
};

module.exports = matrix;
},{"../janicek/core":9}],4:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = {

    /**
     * The length of the line segment from (0,0) to this point.
     */
    distanceFromOrigin: function (p) {
        return Math.sqrt(p.x * p.x + p.y * p.y);
    },

    distance: function (a, b) {
        return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
    },

    /**
     * Determines a point between two specified points. The parameter f determines where the new interpolated point is 
     * located relative to the two end points specified by parameters pt1 and pt2. The closer the value of the parameter f 
     * is to 1.0, the closer the interpolated point is to the first point (parameter pt1). The closer the value of the
     * parameter f is to 0, the closer the interpolated point is to the second point (parameter pt2).
     * @param   pt1 The first point.
     * @param   pt2 The second point.
     * @param   f The level of interpolation between the two points. Indicates where the new point will be, along the line between pt1 and pt2. If f=1, pt1 is returned; if f=0, pt2 is returned.
     * @return The new, interpolated point.
     */
    interpolate: function (pt1, pt2, f) {
        return { x: (pt1.x - pt2.x) * f + pt2.x, y: (pt1.y - pt2.y) * f + pt2.y };
    },

    /**
     * Scales the line segment between (0,0) and the current point to a set length.
     * @param   thickness The scaling value. For example, if the current point is (0,5), and you normalize it to 1, the point returned is at (0,1).
     */
    normalize: function (p, thickness) {
        if (p.x === 0 && p.y === 0) {
            p.x = thickness;
        }
        else {
            var norm = thickness / Math.sqrt(p.x * p.x + p.y * p.y);
            p.x *= norm;
            p.y *= norm;
        }
    },

    /**
     * Adds the coordinates of 2 points to create a new point.
     */
    add: function (p1, p2) {
        return { x: p2.x + p1.x, y: p2.y + p1.y };
    },

    /**
     * subtract first point and second point
     * @param   p0
     * @param   p1
     * @return
     */
    subtract: function (p0, p1) {
        return { x: p0.x - p1.x, y: p0.y - p1.y };
    },

    hash: function (p) {
        return p.x + ',' + p.y;
    }

};
},{}],5:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function (x, y, width, height) {
    return {
        x: x || 0,
        y: y || 0,
        width: width || 0,
        height: height || 0
    };
};

module.exports.core = function (rectangle) {
    return {
        left: function () { return rectangle.x; },
        right: function () { return rectangle.x + rectangle.width; },
        top: function () { return rectangle.y; },
        bottom: function () { return rectangle.y + rectangle.height; }
    };
};
},{}],6:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

/**
 * Copyright (c) 2010, Jeash contributors.
 * 
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *   - Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   - Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

// @r587

/* jshint es3:false */

'use strict';

var def = require('../janicek/core').def;

var Vector3D = function (x, y, z, w) {
    this.w = def(w, 0);
    this.x = def(x, 0);
    this.y = def(y, 0);
    this.z = def(z, 0);
};

var vector3d = function (x, y, z, w) {
    return new Vector3D(x, y, z, w);
};

Vector3D.prototype = {

    getLength: function () {
        return Math.abs(vector3d.distance(this, vector3d()));
    },
    get length() { return this.getLength(); },

    getLengthSquared: function () {
        return this.length * this.length;
    },
    get lengthSquared() { return this.getLengthSquared(); },

    add: function (a) {
        return vector3d(this.x + a.x, this.y + a.y, this.z + a.z);
    },

    clone: function () {
        return vector3d(this.x, this.y, this.z, this.w);
    },

    crossProduct: function (a) {
        return vector3d(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x, 1);
    },

    decrementBy: function (a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
    },

    dotProduct: function (a) {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    },

    equals: function (toCompare, allFour) {
        allFour = def(allFour, false);
        return this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z && (!allFour || this.w === toCompare.w);
    },

    incrementBy: function (a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
    },

    nearEquals: function (toCompare, tolerance, allFour) {
        allFour = def(allFour, false);
        return Math.abs(this.x - toCompare.x) < tolerance &&
            Math.abs(this.y - toCompare.y) < tolerance &&
            Math.abs(this.z - toCompare.z) < tolerance &&
            (!allFour || Math.abs(this.w - toCompare.w) < tolerance);
    },

    negate: function () {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
    },

    normalize: function () {
        var l = this.length;
        if (l !== 0) {
            this.x /= l;
            this.y /= l;
            this.z /= l;
        }
        return l;
    },

    project: function () {
        this.x /= this.w;
        this.y /= this.w;
        this.z /= this.w;
    },

    scaleBy: function (s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
    },

    subtract: function (a) {
        return vector3d(this.x - a.x, this.y - a.y, this.z - a.z);
    },

    toString: function () {
        return 'Vector3D(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    }
};

vector3d.angleBetween = function (a, b) {
    var a0 = a.clone();
    a0.normalize();
    var b0 = b.clone();
    b0.normalize();
    return Math.acos(a0.dotProduct(b0));
};

vector3d.distance = function (pt1, pt2) {
    var x = pt2.x - pt1.x;
    var y = pt2.y - pt1.y;
    var z = pt2.z - pt1.z;
    
    return Math.sqrt(x * x + y * y + z * z);
};

Object.defineProperties(vector3d, {
    'X_AXIS': {get: function () { return vector3d(1, 0, 0); }}
});

Object.defineProperties(vector3d, {
    'Y_AXIS': {get: function () { return vector3d(0, 1, 0); }}
});

Object.defineProperties(vector3d, {
    'Z_AXIS': {get: function () { return vector3d(0, 0, 1); }}
});

module.exports = vector3d;
},{"../janicek/core":9}],7:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = {
    canvasRender: require('./voronoimap/canvas-render'),
    islandShape: require('./voronoimap/island-shape'),
    lava: require('./voronoimap/lava'),
    map: require('./voronoimap/map'),
    mapLands: require('./voronoimap/map-lands'),
    noisyEdges: require('./voronoimap/noisy-edges'),
    pointSelector: require('./voronoimap/point-selector'),
    roads: require('./voronoimap/roads'),
    style: require('./voronoimap/style'),
    watersheds: require('./voronoimap/watersheds')
};
},{"./voronoimap/canvas-render":34,"./voronoimap/island-shape":38,"./voronoimap/lava":39,"./voronoimap/map":41,"./voronoimap/map-lands":40,"./voronoimap/noisy-edges":42,"./voronoimap/point-selector":43,"./voronoimap/roads":44,"./voronoimap/style":45,"./voronoimap/watersheds":46}],8:[function(require,module,exports){
/* jshint bitwise:false */

'use strict';

var core = require('./core');
var _ = require('lodash');

/**
 * Two dimensional array functions.
 */
module.exports = function (array) {
    array = core.def(array, []);
    return {

        value: array,

         /**
         * Get value at index.
         */
        get: function (x, y) {
            if (_(array[y]).isUndefined()) {
                return null;
            }
            return array[y][x];
        },

        /**
         * Set value at index.
         */
        set: function (x, y, value) {
            array[y] = core.def(array[y], []);
            array[y][x] = value;
            return array;
        },

        /**
         * Iterate rows.
         * @param  {function} returnRow
         */
        foreachY: function (returnRow) {
            _(array).each(function (y) {
                if (!_(y).isUndefined()) {
                    returnRow(y);
                }
            });
        },

        /**
         * Iterate cells.
         * @param  {function} returnXYAndValue
         */
        foreachXY: function (returnXYAndValue) {
            var yIndex;
            for (yIndex = 0; yIndex < array.length; yIndex++) {
                if (!_(array[yIndex]).isUndefined()) {
                    var xIndex;
                    for (xIndex = 0; xIndex < array[yIndex].length; xIndex++) {
                        if (!_(array[yIndex][xIndex]).isUndefined()) {
                            var value = array[yIndex][xIndex];
                            if (value !== null) {
                                returnXYAndValue(xIndex, yIndex, value);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Find index of anything in array.
         * @param  {function} testValue Function should return true for match, else false.
         */
        any: function (testValue) {
            var yIndex;
            for (yIndex = 0; yIndex < array.length; yIndex++) {
                if (!_(array[yIndex]).isUndefined()) {
                    var xIndex;
                    for (xIndex = 0; xIndex < array[yIndex].length; xIndex++) {
                        if (!_(array[yIndex][xIndex]).isUndefined()) {
                            var value = array[yIndex][xIndex];
                            if (value !== null) {
                                if (testValue(value)) {
                                    return {x: xIndex, y: yIndex };
                                }
                            }
                        }
                    }
                }
            }
            return null;
        },

        /**
         * Get dimensions of array.
         * @return {object} x is width, y is height
         */
        dimensions: function () {
            var height = array.length;
            var width = 0;
            
            this.foreachY(function (y) {
                width = Math.max(width, y.length);
            });

            return {x: width, y: height};
        }
    };
};

/**
 * Compute two dimensional indices of a flat index based on array width and block size.
 * @param {int} index
 * @param {int} width
 * @param {int} blockSize
 */
module.exports.getIndices = function (index, width, blockSize) {
    blockSize = blockSize || 1;
    return {
        x : (index / blockSize) % width,
        y : core.toInt((index / blockSize) / width)
    };
};
},{"./core":9,"lodash":1}],9:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: false, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');

module.exports = {
    // Return value or default if undefined.
    // Usefull for assigning argument default values.
    def: function (value, defaultValue) {
        return _.isUndefined(value) ? defaultValue : value;
    },

    toInt: function (something) {
        return something | 0;
    },

    // Return first argument that is not undefined and not null.
    coalesce: function () {
        return _.find(arguments, function (arg) {
            return !_.isNull(arg) && !_.isUndefined(arg);
        });
    },

    isUndefinedOrNull: function (thing) {
        return _.isUndefined(thing) || _.isNull(thing);
    }
};
},{"lodash":1}],10:[function(require,module,exports){
/**
 * janicek-core-js
 * ------------------
 * My personal collection of JavaScript core libraries.
 * Copyright (c) 2013 Richard Janicek, http://www.janicek.co
 * 
 * The MIT License (MIT) http://www.opensource.org/licenses/mit-license.php
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* jshint bitwise:false */

'use strict';

/**
 * Compute string hash using djb2 algorithm.
 * 
 * Has a good balance of being extremely fast, while providing a reasonable distribution of hash values.
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
exports.djb2 = function (string) {
    var hash = 5381;
    var i;
    for (i = 0; i < string.length; i++) {
        hash = ((hash << 5) + hash) + string.charCodeAt(i);
    }
    return hash;
};

/**
 * Compute string hash using sdbm algorithm.
 * 
 * This algorithm was created for sdbm (a public-domain reimplementation of ndbm) database library.
 * It was found to do well in scrambling bits, causing better distribution of the keys and fewer splits.
 * It also happens to be a good general hashing function with good distribution.
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
exports.sdbm = function (string) {
    var hash = 0;
    var i;
    for (i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
};

/**
 * Java's String.hashCode() method implemented in Haxe.
 * @see http://docs.oracle.com/javase/1.4.2/docs/api/java/lang/String.html#hashCode%28%29
 */
exports.javaHashCode = function (string) {
    var hash = 0;
    if (string.length === 0) { return hash; }
    for (var i = 0; i < string.length; i++) {
        hash = ((hash << 5) - hash) + string.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
},{}],11:[function(require,module,exports){
/* jshint bitwise:false */

'use strict';

var core = require('./core');

exports.MAX_COLOR_COMPONENT = 0xff;

/**
 * Get red component of Int color.
 */
exports.getRedComponent = function (c) {
    return (c >> 16) & 0xff;
};

/**
 * Get green component of Int color.
 */
exports.getGreenComponent = function (c) {
    return (c >> 8) & 0xff;
};

/**
 * Get blue component of Int color.
 */
exports.getBlueComponent = function (c) {
    return c & 0xff;
};

/**
 * Interpolate color between color0 and color1 using fraction f. When f==0, result is color0. When f==1, result is color1.
 * @author Amit Patel
 */
exports.interpolateColor = function (color0, color1, f) {
    var r = core.toInt((1 - f) * (color0 >> 16) + f * (color1 >> 16));
    var g = core.toInt((1 - f) * ((color0 >> 8) & 0xff) + f * ((color1 >> 8) & 0xff));
    var b = core.toInt((1 - f) * (color0 & 0xff) + f * (color1 & 0xff));
    if (r > 255) { r = 255; }
    if (g > 255) { g = 255; }
    if (b > 255) { b = 255; }
    return (r << 16) | (g << 8) | b;
};

/**
 * Convert a fraction (0.0 - 1.0) to a color value (0 - 0xff).
 */
exports.colorFraction = function (fraction) {
    return core.toInt(exports.MAX_COLOR_COMPONENT * fraction);
};

/**
 * Make HTML hex color string from Int value. Example: 0 -> #000000
 * @param   color Int color value.
 * @return  HTML color string.
 */
exports.intToHexColor = function (color) {
    return '#' + ('00000' + color.toString(16).toUpperCase()).substr(-6);
};

/**
 * Make HTML rgb(r,g,b,a) color string.
 * @param   red Red channel (0 - 0xff).
 * @param   green Green channel (0 - 0xff).
 * @param   blue Blue channel (0 - 0xff).
 */
exports.rgb = function (red, green, blue) {
    return 'rgb(' + red + ',' + green + ',' + blue + ')';
};

/**
 * Make HTML rgba(r,g,b,a) color string.
 * @param   red Red channel (0 - 0xff).
 * @param   green Green channel (0 - 0xff).
 * @param   blue Blue channel (0 - 0xff).
 * @param   alpha Alpha channel (0.0 - 1.0).
 */
exports.rgba = function (red, green, blue, alpha) {
    return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
};

/**
 * Make HTML rgb(r,g,b) color string using fractions.
 * @param   red Red channel (0.0 - 1.0).
 * @param   green Green channel (0.0 - 1.0).
 * @param   blue Blue channel (0.0 - 1.0).
 */
exports.rgbF = function (red, green, blue) {
    return 'rgb(' + red * 100 + '%,' + green * 100 + '%,' + blue * 100 + '%)';
};

/**
 * Make HTML rgba(r,g,b,a) color string using fractions.
 * @param   red Red channel (0.0 - 1.0).
 * @param   green Green channel (0.0 - 1.0).
 * @param   blue Blue channel (0.0 - 1.0).
 * @param   alpha Alpha channel (0.0 - 1.0).
 */
exports.rgbaF = function (red, green, blue, alpha) {
    return 'rgba(' + red * 100 + '%,' + green * 100 + '%,' + blue * 100 + '%,' + alpha + ')';
};

/**
 * Make HTML hsl(h,s,l) color string.
 * @param   hue A degree on the color wheel (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue. 
 * @param   saturation A percentage value; 0.0 means a shade of gray and 1.0 is the full color.
 * @param   lightness Lightness is also a percentage; 0.0 is black, 1.0 is white.
 * @return  HTML color string.
 */
exports.hsl = function (hue, saturation, lightness) {
    return 'hsl(' + hue + ',' + saturation * 100 + '%,' + lightness * 100 + '%)';
};

/**
 * Make HTML hsla(h,s,l,a) color string.
 * @param   hue A degree on the color wheel (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue. 
 * @param   saturation A percentage value; 0.0 means a shade of gray and 1.0 is the full color.
 * @param   lightness Lightness is also a percentage; 0.0 is black, 1.0 is white.
 * @param   alpha Number between 0.0 (fully transparent) and 1.0 (fully opaque).
 * @return  HTML color string.
 */
exports.hsla = function (hue, saturation, lightness, alpha) {
    return 'hsla(' + hue + ',' + saturation * 100 + '%,' + lightness * 100 + '%,' + alpha + ')';
};
},{"./core":9}],12:[function(require,module,exports){
/* jshint bitwise:false */

/**
Title:          Perlin noise
Version:        1.3
Author:         Ron Valstar
Author URI:     http://www.sjeiti.com/
Original code port from http://mrl.nyu.edu/~perlin/noise/
and some help from http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
AS3 optimizations by Mario Klingemann http://www.quasimondo.com
Haxe port and optimization by Nicolas Cannasse http://haxe.org
JavaScript port and simplified by Richard Janicek http://janicek.co
*/

'use strict';

var array2d = require('./array2d');

var p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95,
    96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
    142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252,
    219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
    237, 149, 56, 87, 174, 20, 125, 136, 171,
    168, 68, 175, 74, 165, 71, 134, 139, 48, 27,
    166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46,
    245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
    18, 169, 200, 196, 135, 130, 116, 188, 159,
    86, 164, 100, 109, 198, 173, 186, 3, 64, 52,
    217, 226, 250, 124, 123, 5, 202, 38, 147, 118,
    126, 255, 82, 85, 212, 207, 206, 59, 227, 47,
    16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
    213, 119, 248, 152, 2, 44, 154, 163, 70, 221,
    153, 101, 155, 167, 43, 172, 9, 129, 22, 39,
    253, 19, 98, 108, 110, 79, 113, 224, 232,
    178, 185, 112, 104, 218, 246, 97, 228, 251,
    34, 242, 193, 238, 210, 144, 12, 191, 179,
    162, 241, 81, 51, 145, 235, 249, 14, 239,
    107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4,
    150, 254, 138, 236, 205, 93, 222, 114, 67, 29,
    24, 72, 243, 141, 128, 195, 78, 66, 215, 61,
    156, 180, 151, 160, 137, 91, 90, 15, 131, 13,
    201, 95, 96, 53, 194, 233, 7, 225, 140, 36,
    103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197,
    62, 94, 252, 219, 203, 117, 35, 11, 32, 57,
    177, 33, 88, 237, 149, 56, 87, 174, 20, 125,
    136, 171, 168, 68, 175, 74, 165, 71, 134, 139,
    48, 27, 166, 77, 146, 158, 231, 83, 111, 229,
    122, 60, 211, 133, 230, 220, 105, 92, 41, 55,
    46, 245, 40, 244, 102, 143, 54, 65, 25, 63,
    161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
    89, 18, 169, 200, 196, 135, 130, 116, 188,
    159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
    118, 126, 255, 82, 85, 212, 207, 206, 59,
    227, 47, 16, 58, 17, 182, 189, 28, 42, 223,
    183, 170, 213, 119, 248, 152, 2, 44, 154,
    163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113,
    224, 232, 178, 185, 112, 104, 218, 246, 97,
    228, 251, 34, 242, 193, 238, 210, 144, 12,
    191, 179, 162, 241, 81, 51, 145, 235, 249,
    14, 239, 107, 49, 192, 214, 31, 181, 199,
    106, 157, 184, 84, 204, 176, 115, 121, 50,
    45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128,
    195, 78, 66, 215, 61, 156, 180
];

/*
 * Makes some Perlin Noise.
 * @returns [[int]] A bitmap of Perlin Noise.
 */
exports.makePerlinNoise = function (width, height, _x, _y, _z, seed, octaves, falloff) {
    seed = seed || 666;
    octaves = octaves || 4;
    falloff = falloff || 0.5;

    var baseFactor = 1 / 64;
    
    var iXoffset = seed = (seed * 16807.0) % 2147483647;
    var iYoffset = seed = (seed * 16807.0) % 2147483647;
    var iZoffset = seed = (seed * 16807.0) % 2147483647;
  
    var aOctFreq = []; // frequency per octave
    var aOctPers = []; // persistence per octave
    var fPersMax = 0.0; // 1 / max persistence

    var fFreq, fPers;

    var i;
    for (i = 0; i < octaves; i++) {
        fFreq = Math.pow(2, i);
        fPers = Math.pow(falloff, i);
        fPersMax += fPers;
        aOctFreq.push(fFreq);
        aOctPers.push(fPers);
    }

    fPersMax = 1 / fPersMax;

    var bitmap = array2d([]); // Array<Array<Int>>
    
    var baseX = _x * baseFactor + iXoffset;
    _y = _y * baseFactor + iYoffset;
    _z = _z * baseFactor + iZoffset;

    var py;
    for (py = 0; py < height; py++) {
        _x = baseX;
        
        var px;
        for (px = 0; px < width; px++) {
            var s = 0.0;

            for (i = 0; i < octaves; i++) {
                var fFreq2 = aOctFreq[i];
                var fPers2 = aOctPers[i];

                var x = _x * fFreq2;
                var y = _y * fFreq2;
                var z = _z * fFreq2;

                var xf = x - (x % 1);
                var yf = y - (y % 1);
                var zf = z - (z % 1);

                var X = xf & 255;
                var Y = yf & 255;
                var Z = zf & 255;

                x -= xf;
                y -= yf;
                z -= zf;

                var u = x * x * x * (x * (x * 6 - 15) + 10);
                var v = y * y * y * (y * (y * 6 - 15) + 10);
                var w = z * z * z * (z * (z * 6 - 15) + 10);

                var A  = (p[X]) + Y;
                var AA = (p[A]) + Z;
                var AB = (p[A + 1]) + Z;
                var B  = (p[X + 1]) + Y;
                var BA = (p[B]) + Z;
                var BB = (p[B + 1]) + Z;

                var x1 = x - 1;
                var y1 = y - 1;
                var z1 = z - 1;

                var hash = (p[BB + 1]) & 15;
                var g1 = ((hash&1) === 0 ? (hash < 8 ? x1 : y1) : (hash < 8 ? -x1 : -y1)) + ((hash&2) === 0 ? hash < 4 ? y1 : (hash === 12 ? x1 : z1) : hash < 4 ? -y1 : (hash === 14 ? -x1 : -z1));

                hash = (p[AB + 1]) & 15;
                var g2 = ((hash&1) === 0 ? (hash < 8 ? x  : y1) : (hash < 8 ? -x  : -y1)) + ((hash&2) === 0 ? hash < 4 ? y1 : (hash === 12 ? x  : z1) : hash < 4 ? -y1 : (hash === 14 ? -x : -z1));

                hash = (p[BA + 1]) & 15;
                var g3 = ((hash&1) === 0 ? (hash < 8 ? x1 : y) : (hash < 8 ? -x1 : -y)) + ((hash&2) === 0 ? hash < 4 ? y  : (hash === 12 ? x1 : z1) : hash < 4 ? -y  : (hash === 14 ? -x1 : -z1));

                hash = (p[AA + 1]) & 15;
                var g4 = ((hash&1) === 0 ? (hash < 8 ? x  : y) : (hash < 8 ? -x  : -y)) + ((hash&2) === 0 ? hash < 4 ? y  : (hash === 12 ? x  : z1) : hash < 4 ? -y  : (hash === 14 ? -x  : -z1));

                hash = (p[BB]) & 15;
                var g5 = ((hash&1) === 0 ? (hash < 8 ? x1 : y1) : (hash < 8 ? -x1 : -y1)) + ((hash&2) === 0 ? hash < 4 ? y1 : (hash === 12 ? x1 : z) : hash < 4 ? -y1 : (hash === 14 ? -x1 : -z));

                hash = (p[AB]) & 15;
                var g6 = ((hash&1) === 0 ? (hash < 8 ? x  : y1) : (hash < 8 ? -x  : -y1)) + ((hash&2) === 0 ? hash < 4 ? y1 : (hash === 12 ? x  : z) : hash < 4 ? -y1 : (hash === 14 ? -x  : -z));

                hash = (p[BA]) & 15;
                var g7 = ((hash&1) === 0 ? (hash < 8 ? x1 : y) : (hash < 8 ? -x1 : -y)) + ((hash&2) === 0 ? hash < 4 ? y  : (hash === 12 ? x1 : z) : hash < 4 ? -y  : (hash === 14 ? -x1 : -z));

                hash = (p[AA]) & 15;
                var g8 = ((hash&1) === 0 ? (hash < 8 ? x  : y) : (hash < 8 ? -x  : -y)) + ((hash&2) === 0 ? hash < 4 ? y  : (hash === 12 ? x  : z) : hash < 4 ? -y  : (hash === 14 ? -x  : -z));

                g2 += u * (g1 - g2);
                g4 += u * (g3 - g4);
                g6 += u * (g5 - g6);
                g8 += u * (g7 - g8);

                g4 += v * (g2 - g4);
                g8 += v * (g6 - g8);

                s += (g8 + w * (g4 - g8)) * fPers2;
            }

            var color = (s * fPersMax + 1) * 128;

            bitmap.set(px, py, 0xff000000 | color << 16 | color << 8 | color);

            _x += baseFactor;
        }

        _y += baseFactor;
    }
    return bitmap.value;
};
},{"./array2d":8}],13:[function(require,module,exports){
/* jshint bitwise:false */

'use strict';

var hash = require('./hash');

/**
 * (a Mersenne prime M31) modulus constant = 2^31 - 1 = 0x7ffffffe
 */
var MPM = 2147483647.0;

/**
 * (a primitive root modulo M31)
 */
var MINSTD = 16807.0;

/**
 * Make a non deterministic random seed using standard libraries.
 * @return Non deterministic random seed.
 */
exports.makeRandomSeed = function () {
    return Math.floor(Math.random() * MPM);
};

/**
 * Park-Miller-Carta algorithm.
 * @see <a href="http://lab.polygonal.de/?p=162">http://lab.polygonal.de/?p=162</a>
 * @see <a href="http://code.google.com/p/polygonal/source/browse/trunk/src/lib/de/polygonal/core/math/random/ParkMiller.hx?r=547">http://code.google.com/p/polygonal/source/browse/trunk/src/lib/de/polygonal/core/math/random/ParkMiller.hx?r=547</a> 
 * @see <a href="http://en.wikipedia.org/wiki/Lehmer_random_number_generator">http://en.wikipedia.org/wiki/Lehmer_random_number_generator</a>
 * @return Returns the next pseudo-random int value.
 */
exports.nextParkMiller = function (seed) {
    return (seed * MINSTD) % MPM;
};

/**
 * <p>A Park-Miller-Carta PRNG (pseudo random number generator).</p>
 * <p>Integer implementation, using only 32 bit integer maths and no divisions.</p>
 * @see <a href="https://github.com/polygonal/core/blob/dev/src/de/polygonal/core/math/random/ParkMiller31.hx">POLYGONAL - A HAXE LIBRARY FOR GAME DEVELOPERS</a>
 * @see <a href="http://www.firstpr.com.au/dsp/rand31/rand31-park-miller-carta.cc.txt" target="_blank">http://www.firstpr.com.au/dsp/rand31/rand31-park-miller-carta.cc.txt</a>
 * @see <a href="http://en.wikipedia.org/wiki/Park%E2%80%93Miller_random_number_generator" target="_blank">Park-Miller random number generator</a>.
 * @see <a href="http://lab.polygonal.de/?p=162" target="_blank">A good Pseudo-Random Number Generator (PRNG)</a>.
 */
exports.nextParkMiller31 = function (seed) {
    var lo = 16807 * (seed & 0xffff);
    var hi = 16807 * (seed >>> 16);
    lo += (hi & 0x7fff) << 16;
    lo += hi >>> 15;
    if (lo > 0x7fffffff) { lo -= 0x7fffffff; }
    return lo;
};

/**
 * Linear congruential generator using GLIBC constants.
 * 
 * @see <a href="http://en.wikipedia.org/wiki/Linear_congruential_generator">http://en.wikipedia.org/wiki/Linear_congruential_generator</a>
 * @see <a href="https://github.com/aduros/flambe/blob/master/src/flambe/util/Random.hx">https://github.com/aduros/flambe/blob/master/src/flambe/util/Random.hx</a>
 * @return Returns an integer in [0, INT_MAX)
 */
exports.nextLCG = function (seed) {
    // These constants borrowed from glibc
    // Force float multiplication here to avoid overflow in Flash (and keep parity with JS)
    return (1103515245.0 * seed + 12345) % MPM;
};

/**
 * Returns the pseudo-random double value x in the range 0 <= x < 1.
 */
exports.toFloat = function (seed) {
    return seed / MPM;
};

/**
 * Returns a pseudo-random boolean value (coin flip).
 */
exports.toBool = function (seed) {
    return exports.toFloat(seed) > 0.5;
};

/**
 * Returns a pseudo-random double value x in the range min <= x <= max.
 */
exports.toFloatRange = function (seed, min, max) {
    return min + (max - min) * exports.toFloat(seed);
};

/**
 * Returns a pseudo-random integral value x in the range min <= x <= max.
 */
exports.toIntRange = function (seed, min, max) {
    return Math.round((min - 0.4999) + ((max + 0.4999) - (min - 0.4999)) * exports.toFloat(seed));
};

/**
 * Converts a string to a seed.
 * Lets you use words as seeds.
 */
exports.stringToSeed = function (s) {
    return hash.djb2(s) % MPM;
};

/**
 * Closure for tracking random number state.
 * @param   seed
 * @param   algorithm
 */
exports.randomGenerator = function (seed, nextRandomNumberAlgorithm) {
    return function () {
        seed = nextRandomNumberAlgorithm(seed);
        return seed;
    };
};
},{"./hash":10}],14:[function(require,module,exports){
/* jshint bitwise: false */

'use strict';

module.exports = {
    TOP: 1,
    BOTTOM: 2,
    LEFT: 4,
    RIGHT: 8,

    /**
     * 
     * @param point
     * @param bounds
     * @return an int with the appropriate bits set if the Point lies on the corresponding bounds lines
     * 
     */
    check: function (point, bounds) {
        bounds = require('../../as3/rectangle').core(bounds);
        var value = 0;
        if (point.x === bounds.left()) {
            value |= this.LEFT;
        }
        if (point.x === bounds.right()) {
            value |= this.RIGHT;
        }
        if (point.y === bounds.top()) {
            value |= this.TOP;
        }
        if (point.y === bounds.bottom()) {
            value |= this.BOTTOM;
        }
        return value;
    }
};
},{"../../as3/rectangle":5}],15:[function(require,module,exports){
'use strict';

module.exports = {
    vertex: 'vertex',
    site: 'site'
};
},{}],16:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = {

    delaunayLinesForEdges: function (edges) {
        var segments = [];
        _(edges).each(function (edge) {
            segments.push(edge.delaunayLine());
        });
        return segments;
    },

    selectEdgesForSitePoint: function (coord, edgesToTest) {
        return _(edgesToTest).filter(function (edge) {
            return ((edge.leftSite !== null && edge.leftSite.coord === coord) ||
                (edge.rightSite !== null && edge.rightSite.coord === coord));
        });
    },

    selectNonIntersectingEdges: function (keepOutMask, edgesToTest) {
        if (keepOutMask === null) {
            return edgesToTest;
        }
        
        var zeroPoint = {x: 0.0, y: 0.0};
        return _(edgesToTest).filter(function (edge) {
            var delaunayLineBmp = edge.makeDelaunayLineBmp();
            var notIntersecting = !(keepOutMask.hitTest(zeroPoint, 1, delaunayLineBmp, zeroPoint, 1));
            delaunayLineBmp.dispose();
            return notIntersecting;
        });
    },

    visibleLineSegments: function (edges) {
        var lr = require('./lr');
        var lineSegment = require('../geom/line-segment');
        var segments = [];
        
        _(edges).each(function (edge) {
            if (edge.visible) {
                var p1 = edge.clippedEnds[lr.LEFT];
                var p2 = edge.clippedEnds[lr.RIGHT];
                segments.push(lineSegment(p1, p2));
            }
        });
        
        return segments;
    }

};
},{"../geom/line-segment":30,"./lr":23,"lodash":1}],17:[function(require,module,exports){
/* jshint bitwise:false */

'use strict';

var halfedgeModule = require('./halfedge');
var edgeModule = require('./edge');

module.exports = function (xmin, deltax, sqrtNsites) {
    var pub = {};

    var _deltax = 0.0;
    var _xmin  = 0.0;
    
    var _hashsize = 0;
    var _hash = []; // Vector<Halfedge>;

    var _leftEnd = null; //Halfedge;
    pub.getLeftEnd = function () {
        return _leftEnd;
    };
    Object.defineProperties(pub, {
        'leftEnd': {get: function () { return pub.getLeftEnd(); }}
    });

    var _rightEnd = null; //Halfedge;
    pub.getRightEnd = function () {
        return _rightEnd;
    };
    Object.defineProperties(pub, {
        'rightEnd': {get: function () { return pub.getRightEnd(); }}
    });

    pub.dispose = function () {
        var halfEdge = _leftEnd;
        var prevHe;
        while (halfEdge !== _rightEnd) {
            prevHe = halfEdge;
            halfEdge = halfEdge.edgeListRightNeighbor;
            prevHe.dispose();
        }
        _leftEnd = null;
        _rightEnd.dispose();
        _rightEnd = null;

        var i;
        for (i = 0; i < _hashsize; i++) {
            _hash[i] = null;
        }
        _hash = null;
    };

    /**
     * Insert newHalfedge to the right of lb 
     * @param lb
     * @param newHalfedge
     * 
     */
    pub.insert = function (lb, newHalfedge) {
        newHalfedge.edgeListLeftNeighbor = lb;
        newHalfedge.edgeListRightNeighbor = lb.edgeListRightNeighbor;
        lb.edgeListRightNeighbor.edgeListLeftNeighbor = newHalfedge;
        lb.edgeListRightNeighbor = newHalfedge;
    };

    /**
     * This function only removes the Halfedge from the left-right list.
     * We cannot dispose it yet because we are still using it. 
     * @param halfEdge
     * 
     */
    pub.remove = function (halfEdge) {
        halfEdge.edgeListLeftNeighbor.edgeListRightNeighbor = halfEdge.edgeListRightNeighbor;
        halfEdge.edgeListRightNeighbor.edgeListLeftNeighbor = halfEdge.edgeListLeftNeighbor;
        halfEdge.edge = edgeModule.DELETED;
        halfEdge.edgeListLeftNeighbor = halfEdge.edgeListRightNeighbor = null;
    };


    /* Get entry from hash table, pruning any deleted nodes */
    function getHash(b) {
        var halfEdge;
    
        if (b < 0 || b >= _hashsize) {
            return null;
        }
        halfEdge = _hash[b];
        if (halfEdge !== null && halfEdge.edge === edgeModule.DELETED) {
            /* Hash table points to deleted halfedge.  Patch as necessary. */
            _hash[b] = null;
            // still can't dispose halfEdge yet!
            return null;
        } else {
            return halfEdge;
        }
    }

    /**
     * Find the rightmost Halfedge that is still left of p 
     * @param p
     * @return 
     * 
     */
    pub.edgeListLeftNeighbor = function (p) {
        var bucket;
        var halfEdge;
    
        /* Use hash table to get close to desired halfedge */
        bucket = ((p.x - _xmin) / _deltax) * _hashsize;
        if (bucket < 0) {
            bucket = 0;
        }
        if (bucket >= _hashsize) {
            bucket = _hashsize - 1;
        }
        halfEdge = getHash(bucket);
        if (halfEdge === null) {
            var i = 1;
            while (true) {
                if ((halfEdge = this.getHash(bucket - i)) !== null) {
                    break;
                }
                if ((halfEdge = this.getHash(bucket + i)) !== null) {
                    break;
                }
                
                i++;
            }
        }
        /* Now search linear list of halfedges for the correct one */
        if (halfEdge === this.getLeftEnd()  || (halfEdge !== this.getRightEnd() && halfEdge.isLeftOf(p))) {
            do {
                halfEdge = halfEdge.edgeListRightNeighbor;
            } while (halfEdge !== this.getRightEnd() && halfEdge.isLeftOf(p));
            halfEdge = halfEdge.edgeListLeftNeighbor;
        } else {
            do {
                halfEdge = halfEdge.edgeListLeftNeighbor;
            } while (halfEdge !== this.getLeftEnd() && !halfEdge.isLeftOf(p));
        }
    
        /* Update hash table and reference counts */
        if (bucket > 0 && bucket < _hashsize - 1) {
            _hash[bucket] = halfEdge;
        }
        return halfEdge;
    };

    _xmin = xmin;
    _deltax = deltax;
    _hashsize = 2 * sqrtNsites;

    //var i:Int;
    _hash = [];
    
    // two dummy Halfedges:
    _leftEnd = halfedgeModule.createDummy();
    _rightEnd = halfedgeModule.createDummy();
    _leftEnd.edgeListLeftNeighbor = null;
    _leftEnd.edgeListRightNeighbor = _rightEnd;
    _rightEnd.edgeListLeftNeighbor = _leftEnd;
    _rightEnd.edgeListRightNeighbor = null;
    _hash[0] = _leftEnd;
    _hash[_hashsize - 1] = _rightEnd;

    return pub;
};
},{"./edge":19,"./halfedge":21}],18:[function(require,module,exports){
'use strict';

var criterionModule = require('./criterion');
var lr = require('./lr');
var vertex = require('./vertex');

var EdgeReorderer = function (origEdges, criterion) {
    if (criterion !== criterionModule.vertex && criterion !== criterionModule.site) {
        throw 'Edges: criterion must be Vertex or Site';
    }
    this.edges = [];
    this.edgeOrientations = [];
    if (origEdges.length > 0) {
        this.edges = this._reorderEdges(origEdges, criterion);
    }
};

EdgeReorderer.prototype = {

    edges: null, // Vector<Edge>
    edgeOrientations: null, // Vector<LR>

    dispose: function () {
        this.edges = null;
        this.edgeOrientations = null;
    },

    _reorderEdges: function (origEdges, criterion) {
        var i;
        var n = origEdges.length;
        var edge;
        // we're going to reorder the edges in order of traversal
        var done = []; // Vector<Boolean>
        var nDone = 0;
        
        var newEdges = []; // Vector<Edge>
        
        i = 0;
        edge = origEdges[i];
        newEdges.push(edge);
        this.edgeOrientations.push(lr.LEFT);
        var firstPoint;
        var lastPoint;
        if (criterion === criterionModule.vertex) {
            firstPoint = edge.leftVertex;
            lastPoint = edge.rightVertex;
        } else {
            firstPoint = edge.leftSite;
            lastPoint = edge.rightSite;
        }
        
        if (firstPoint === vertex.VERTEX_AT_INFINITY || lastPoint === vertex.VERTEX_AT_INFINITY) {
            return []; // Vector<Edge>;
        }
        
        done[i] = true;
        ++nDone;
        
        while (nDone < n) {
            for (i = 1; i < n; i++) {
                if (done[i]) {
                    continue;
                }
                edge = origEdges[i];
                var leftPoint;
                var rightPoint;
                if (criterion === criterionModule.vertex) {
                    leftPoint = edge.leftVertex;
                    rightPoint = edge.rightVertex;
                } else {
                    leftPoint = edge.leftSite;
                    rightPoint = edge.rightSite;
                }
                
                if (leftPoint === vertex.VERTEX_AT_INFINITY || rightPoint === vertex.VERTEX_AT_INFINITY) {
                    return []; //Vector<Edge>()
                }
                if (leftPoint === lastPoint) {
                    lastPoint = rightPoint;
                    this.edgeOrientations.push(lr.LEFT);
                    newEdges.push(edge);
                    done[i] = true;
                }
                else if (rightPoint === firstPoint) {
                    firstPoint = leftPoint;
                    this.edgeOrientations.unshift(lr.LEFT);
                    newEdges.unshift(edge);
                    done[i] = true;
                }
                else if (leftPoint === firstPoint) {
                    firstPoint = rightPoint;
                    this.edgeOrientations.unshift(lr.RIGHT);
                    newEdges.unshift(edge);
                    done[i] = true;
                }
                else if (rightPoint === lastPoint) {
                    lastPoint = leftPoint;
                    this.edgeOrientations.push(lr.RIGHT);
                    newEdges.push(edge);
                    done[i] = true;
                }
                if (done[i]) {
                    ++nDone;
                }
            }
        }
        
        return newEdges;
    }

};

module.exports = function (origEdges, criterion) {
    return new EdgeReorderer(origEdges, criterion);
};
},{"./criterion":15,"./lr":23,"./vertex":27}],19:[function(require,module,exports){
/* jshint es3:false */

'use strict';

var lineSegment = require('../geom/line-segment');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var rectangle = require('../../as3/rectangle');

var _pool = [];
var _nedges = 0;

exports.Edge = function () {
    this._edgeIndex = _nedges++;
    this.init();
};

exports.Edge.prototype = {
    _delaunayLineBmp: null,
    getDelaunayLineBmp: function () {
        if (this._delaunayLineBmp === null) {
            this._delaunayLineBmp = this.makeDelaunayLineBmp();
        }
        return this._delaunayLineBmp;
    },
    get delaunayLineBmp() { return this.getDelaunayLineBmp(); },

    // making this available to Voronoi; running out of memory in AIR so I cannot cache the bmp
    makeDelaunayLineBmp: function () {
        throw 'unimplemented';
        
        var p0 = this.leftSite.coord;
        var p1 = this.rightSite.coord;
        
        var w = Math.ceil(Math.max(p0.x, p1.x));
        if (w < 1) {
            w = 1;
        }
        var h = Math.ceil(Math.max(p0.y, p1.y));
        if (h < 1) {
            h = 1;
        }
        //var bmp:BitmapData = new BitmapData(w, h, true, 0);
        var bmp = new BitmapData();

        //GRAPHICS.clear();
        // clear() resets line style back to undefined!
        //GRAPHICS.lineStyle(0, 0, 1.0, false, LineScaleMode.NONE, CapsStyle.NONE);
        //GRAPHICS.moveTo(p0.x, p0.y);
        //GRAPHICS.lineTo(p1.x, p1.y);
        
        bmp.drawLine(p0, p1);
        
        //bmp.draw(LINESPRITE);
        return bmp;
    },

    delaunayLine: function () {
        // draw a line connecting the input Sites for which the edge is a bisector:
        return lineSegment(this.leftSite.coord, this.rightSite.coord);
    },

    voronoiEdge: function () {
        if (!this.visible) {
            return lineSegment(null, null);
        }
        return lineSegment(this.clippedEnds[lr.LEFT], this.clippedEnds[lr.RIGHT]);
    },

    // the equation of the edge: ax + by = c
    a: null,
    b: null,
    c: null,

    // the two Voronoi vertices that the edge connects
    //      (if one of them is null, the edge extends to infinity)
    leftVertex: null,
    rightVertex: null,

    vertex: function (leftRight) {
        return (leftRight === lr.LEFT) ? this.leftVertex : this.rightVertex;
    },

    setVertex: function (leftRight, v) {
        if (leftRight === lr.LEFT) {
            this.leftVertex = v;
        } else {
            this.rightVertex = v;
        }
    },

    isPartOfConvexHull: function () {
        return (this.leftVertex === null || this.rightVertex === null);
    },

    sitesDistance: function () {
        return pointCore.distance(this.leftSite.coord, this.rightSite.coord);
    },

    // Once clipVertices() is called, this Dictionary will hold two Points
    // representing the clipped coordinates of the left and right ends...
    //private var _clippedVertices:Dictionary;
    clippedEnds: null, // Dictionary<Point>

    // unless the entire Edge is outside the bounds.
    // In that case visible will be false:
    get visible() { return this.clippedEnds !== null; },

    // the two input Sites for which this Edge is a bisector:
    //private var _sites:Dictionary<Site>;
    // the two input Sites for which this Edge is a bisector:               
    leftSite: null,
    rightSite: null,

    site: function (leftRight) {
        return (leftRight === lr.LEFT) ? this.leftSite : this.rightSite;
    },

    _edgeIndex: 0,

    dispose: function () {
        if (this._delaunayLineBmp !== null) {
            this._delaunayLineBmp.dispose();
            this._delaunayLineBmp = null;
        }
        this.leftVertex = null;
        this.rightVertex = null;
        if (this.clippedEnds !== null) {
            this.clippedEnds[lr.LEFT] = null;
            this.clippedEnds[lr.RIGHT] = null;
            this.clippedEnds = null;
        }

        this.leftSite = null;
        this.rightSite = null;
        
        _pool.push(this);
    },

    toString: function () {
        return 'Edge ' + this._edgeIndex + '; sites ' + this.leftSite + ', ' + this.rightSite +
            '; endVertices ' + (this.leftVertex !== null ? String(this.leftVertex.vertexIndex) : 'null') + ', ' +
            (this.rightVertex !== null ? String(this.rightVertex.vertexIndex) : 'null') + '::';
    },

    /**
     * Set _clippedVertices to contain the two ends of the portion of the Voronoi edge that is visible
     * within the bounds.  If no part of the Edge falls within the bounds, leave _clippedVertices null. 
     * @param bounds
     * 
     */
    clipVertices: function (bounds) {
        var boundsCore = rectangle.core(bounds);
        var xmin = bounds.x;
        var ymin = bounds.y;
        var xmax = boundsCore.right();
        var ymax = boundsCore.bottom();
        
        var vertex0, vertex1;
        var x0, x1, y0, y1;
        
        if (this.a === 1.0 && this.b >= 0.0) {
            vertex0 = this.rightVertex;
            vertex1 = this.leftVertex;
        } else {
            vertex0 = this.leftVertex;
            vertex1 = this.rightVertex;
        }
    
        if (this.a === 1.0) {
            y0 = ymin;
            if (vertex0 !== null && vertex0.y > ymin) {
                y0 = vertex0.y;
            }
            if (y0 > ymax) {
                return;
            }
            x0 = this.c - this.b * y0;
            
            y1 = ymax;
            if (vertex1 !== null && vertex1.y < ymax) {
                y1 = vertex1.y;
            }
            if (y1 < ymin) {
                return;
            }
            x1 = this.c - this.b * y1;
            
            if ((x0 > xmax && x1 > xmax) || (x0 < xmin && x1 < xmin)) {
                return;
            }
            
            if (x0 > xmax) {
                x0 = xmax;
                y0 = (this.c - x0) / this.b;
            }
            else if (x0 < xmin) {
                x0 = xmin;
                y0 = (this.c - x0) / this.b;
            }
            
            if (x1 > xmax) {
                x1 = xmax;
                y1 = (this.c - x1) / this.b;
            }
            else if (x1 < xmin) {
                x1 = xmin;
                y1 = (this.c - x1) / this.b;
            }
        } else {
            x0 = xmin;
            if (vertex0 !== null && vertex0.x > xmin) {
                x0 = vertex0.x;
            }
            if (x0 > xmax) {
                return;
            }
            y0 = this.c - this.a * x0;
            
            x1 = xmax;
            if (vertex1 !== null && vertex1.x < xmax) {
                x1 = vertex1.x;
            }
            if (x1 < xmin) {
                return;
            }
            y1 = this.c - this.a * x1;
            
            if ((y0 > ymax && y1 > ymax) || (y0 < ymin && y1 < ymin)) {
                return;
            }
            
            if (y0 > ymax) {
                y0 = ymax;
                x0 = (this.c - y0) / this.a;
            }
            else if (y0 < ymin) {
                y0 = ymin;
                x0 = (this.c - y0) / this.a;
            }
            
            if (y1 > ymax) {
                y1 = ymax;
                x1 = (this.c - y1) / this.a;
            }
            else if (y1 < ymin) {
                y1 = ymin;
                x1 = (this.c - y1) / this.a;
            }
        }

        this.clippedEnds = {};
        if (vertex0 === this.leftVertex) {
            this.clippedEnds[lr.LEFT] = {x: x0, y: y0};
            this.clippedEnds[lr.RIGHT] = {x: x1, y: y1};
        } else {
            this.clippedEnds[lr.RIGHT] = {x: x0, y: y0};
            this.clippedEnds[lr.LEFT] = {x: x1, y: y1};
        }
    },

    init: function () {
        this.leftSite = null;
        this.rightSite = null;
    }

};

function create() {
    var edge;
    if (_pool.length > 0) {
        edge = _pool.pop();
        edge.init();
    } else {
        edge = new exports.Edge();
    }
    return edge;
}

exports.DELETED = new exports.Edge();

/**
 * This is the only way to create a new Edge 
 * @param site0
 * @param site1
 * @return 
 * 
 */
exports.createBisectingEdge = function (site0, site1) {
    var dx, dy, absdx, absdy;
    var a, b, c;

    dx = site1.x - site0.x;
    dy = site1.y - site0.y;
    absdx = dx > 0 ? dx : -dx;
    absdy = dy > 0 ? dy : -dy;
    c = site0.x * dx + site0.y * dy + (dx * dx + dy * dy) * 0.5;
    if (absdx > absdy) {
        a = 1.0;
        b = dy / dx;
        c /= dx;
    } else {
        b = 1.0;
        a = dx / dy;
        c /= dy;
    }
    
    var edge = create();

    edge.leftSite = site0;
    edge.rightSite = site1;
    site0.addEdge(edge);
    site1.addEdge(edge);
    
    edge.leftVertex = null;
    edge.rightVertex = null;
    
    edge.a = a;
    edge.b = b;
    edge.c = c;
    //trace("createBisectingEdge: a ", edge.a, "b", edge.b, "c", edge.c);
    
    return edge;
};

exports.compareSitesDistancesMax = function (edge0, edge1) {
    var length0 = edge0.sitesDistance();
    var length1 = edge1.sitesDistance();
    if (length0 < length1) {
        return 1;
    }
    if (length0 > length1) {
        return -1;
    }
    return 0;
};

exports.compareSitesDistances = function (edge0, edge1) {
    return - exports.compareSitesDistancesMax(edge0, edge1);
};
},{"../../as3/point-core":4,"../../as3/rectangle":5,"../geom/line-segment":30,"./lr":23}],20:[function(require,module,exports){
/* jshint bitwise:false */

'use strict';

var halfedgeModule = require('./halfedge');
var core = require('../../janicek/core');

module.exports = function (ymin, deltay, sqrtNsites) {
    var pub = {};

    var _hash = null; //Vector<Halfedge>
    var _count = 0;
    var _minBucket = 0;
    var _hashsize = 0;
    
    var _ymin = 0.0;
    var _deltay = 0.0;

    function initialize() {
        var i;

        _count = 0;
        _minBucket = 0;
        _hash = [];
        // dummy Halfedge at the top of each hash
        for (i = 0; i < _hashsize; i++) {
            _hash[i] = halfedgeModule.createDummy();
            _hash[i].nextInPriorityQueue = null;
        }
    }

    function bucket(halfEdge) {
        var theBucket = core.toInt((halfEdge.ystar - _ymin) / _deltay * _hashsize);
        if (theBucket < 0) {
            theBucket = 0;
        }
        if (theBucket >= _hashsize) {
            theBucket = _hashsize - 1;
        }
        return theBucket;
    }

    pub.dispose = function () {
        // get rid of dummies
        var i;
        for (i = 0; i < _hashsize; i++) {
            _hash[i].dispose();
            _hash[i] = null;
        }
        _hash = null;
    };

    pub.insert = function (halfEdge) {
        var previous, next;
        var insertionBucket = bucket(halfEdge);

        if (insertionBucket < _minBucket) {
            _minBucket = insertionBucket;
        }
        previous = _hash[insertionBucket];
        while ((next = previous.nextInPriorityQueue) !== null &&
            (halfEdge.ystar  > next.ystar || (halfEdge.ystar === next.ystar && halfEdge.vertex.x > next.vertex.x))) {
            previous = next;
        }
        halfEdge.nextInPriorityQueue = previous.nextInPriorityQueue;
        previous.nextInPriorityQueue = halfEdge;
        ++_count;
    };

    pub.remove = function (halfEdge) {
        var previous;
        var removalBucket = bucket(halfEdge);
        
        if (halfEdge.vertex !== null) {
            previous = _hash[removalBucket];
            while (previous.nextInPriorityQueue !== halfEdge) {
                previous = previous.nextInPriorityQueue;
            }
            previous.nextInPriorityQueue = halfEdge.nextInPriorityQueue;
            _count--;
            halfEdge.vertex = null;
            halfEdge.nextInPriorityQueue = null;
            halfEdge.dispose();
        }
    };

    function isEmpty(bucket) {
        return (_hash[bucket].nextInPriorityQueue === null);
    }

     /**
     * move _minBucket until it contains an actual Halfedge (not just the dummy at the top); 
     * 
     */
    function adjustMinBucket() {
        while (_minBucket < _hashsize - 1 && isEmpty(_minBucket)) {
            ++_minBucket;
        }
    }

    pub.empty = function () {
        return _count === 0;
    };

    /**
     * @return coordinates of the Halfedge's vertex in V*, the transformed Voronoi diagram
     * 
     */
    pub.min = function () {
        adjustMinBucket();
        var answer = _hash[_minBucket].nextInPriorityQueue;
        return {x: answer.vertex.x, y: answer.ystar};
    };

    /**
     * remove and return the min Halfedge
     * @return 
     * 
     */
    pub.extractMin = function () {
        var answer;
    
        // get the first real Halfedge in _minBucket
        answer = _hash[_minBucket].nextInPriorityQueue;
        
        _hash[_minBucket].nextInPriorityQueue = answer.nextInPriorityQueue;
        _count--;
        answer.nextInPriorityQueue = null;
        
        return answer;
    };


    _ymin = ymin;
    _deltay = deltay;
    _hashsize = 4 * sqrtNsites;
    initialize();

    return pub;
};
},{"../../janicek/core":9,"./halfedge":21}],21:[function(require,module,exports){
'use strict';

var def = require('../../janicek/core').def;
var lrModule = require('./lr');

var _pool = []; // Vector<Halfedge>

var Halfedge = function (edge, lr) {
    edge = def(edge, null);
    lr = def(lr, null);
    this.init(edge, lr);
};

Halfedge.prototype = {
    edgeListLeftNeighbor: null,
    edgeListRightNeighbor: null,
    nextInPriorityQueue: null,
    
    edge: null,
    leftRight: null,
    vertex: null,

    // the vertex's y-coordinate in the transformed Voronoi space V*
    ystar: 0.0,

    toString: function () {
        return 'Halfedge (leftRight: ' + this.leftRight + '; vertex: ' + this.vertex + ')';
    },

    dispose: function () {
        if (this.edgeListLeftNeighbor !== null || this.edgeListRightNeighbor !== null) {
            // still in EdgeList
            return;
        }
        if (this.nextInPriorityQueue !== null) {
            // still in PriorityQueue
            return;
        }
        this.edge = null;
        this.leftRight = null;
        this.vertex = null;
        _pool.push(this);
    },

    reallyDispose: function () {
        this.edgeListLeftNeighbor = null;
        this.edgeListRightNeighbor = null;
        this.nextInPriorityQueue = null;
        this.edge = null;
        this.leftRight = null;
        this.vertex = null;
        _pool.push(this);
    },

    isLeftOf: function (p) {
        var topSite;
        var rightOfSite, above, fast;
        var dxp, dyp, dxs, t1, t2, t3, yl;
        
        topSite = this.edge.rightSite;
        rightOfSite = p.x > topSite.x;
        if (rightOfSite && this.leftRight === lrModule.LEFT) {
            return true;
        }
        if (!rightOfSite && this.leftRight === lrModule.RIGHT) {
            return false;
        }
        
        if (this.edge.a === 1.0) {
            dyp = p.y - topSite.y;
            dxp = p.x - topSite.x;
            fast = false;
            if ((!rightOfSite && this.edge.b < 0.0) || (rightOfSite && this.edge.b >= 0.0)) {
                above = dyp >= (this.edge.b * dxp);
                fast = above;
            } else {
                above = p.x + p.y * this.edge.b > this.edge.c;
                if (this.edge.b < 0.0) {
                    above = !above;
                }
                if (!above) {
                    fast = true;
                }
            }
            if (!fast) {
                dxs = topSite.x - this.edge.leftSite.x;
                above = this.edge.b * (dxp * dxp - dyp * dyp) < (dxs * dyp * (1.0 + 2.0 * dxp / dxs + this.edge.b * this.edge.b));
                if (this.edge.b < 0.0) {
                    above = !above;
                }
            }
        }
        else  { /* this.edge.b == 1.0 */
            yl = this.edge.c - this.edge.a * p.x;
            t1 = p.y - yl;
            t2 = p.x - topSite.x;
            t3 = yl - topSite.y;
            above = (t1 * t1) > (t2 * t2 + t3 * t3);
        }
        return this.leftRight === lrModule.LEFT ? above : !above;
    },

    init: function (edge, lr) {
        this.edge = edge;
        this.leftRight = lr;
        this.nextInPriorityQueue = null;
        this.vertex = null;
        return this;
    }

};

exports.create = function (edge, lr) {
    if (_pool.length > 0) {
        return _pool.pop().init(edge, lr);
    }
    else {
        return new Halfedge(edge, lr);
    }
};

exports.createDummy = function () {
    return exports.create(null, null);
};
},{"../../janicek/core":9,"./lr":23}],22:[function(require,module,exports){
/* jshint camelcase:false */

'use strict';

var _ = require('lodash');
var def = require('../../janicek/core').def;
var lineSegmentCore = require('../geom/line-segment').core;
var nodeModule = require('./node');
var pointCore = require('../../as3/point-core');

exports.find = function (node) {
    if (node.parent === node) {
        return node;
    } else {
        var root = exports.find(node.parent);
        // this line is just to speed up subsequent finds by keeping the tree depth low:
        node.parent = root;
        return root;
    }
};

/**
*  Kruskal's spanning tree algorithm with union-find
 * Skiena: The Algorithm Design Manual, p. 196ff
 * Note: the sites are implied: they consist of the end points of the line segments
*/
exports.kruskal = function (lineSegments, type) {
    type = def(type, 'minimum');

    var nodes = {}; // Dictionary<Node>
    var mst = []; // Vector<LineSegment>
    var nodePool = []; // Vector<Node>
    
    switch (type) {
        // note that the compare functions are the reverse of what you'd expect
        // because (see below) we traverse the lineSegments in reverse order for speed
    case 'maximum':
        lineSegments.sort(lineSegmentCore.compareLengths);
        break;
    default:
        lineSegments.sort(lineSegmentCore.compareLengthsMax);
    }

    var i = lineSegments.length - 1;
    //for (var i:int = lineSegments.length; --i > -1;)
    while (i >= 0) {
        var lineSegment = lineSegments[i];
        i--;
        
        var node0 = nodes[pointCore.hash(lineSegment.p0)];
        var rootOfSet0;
        if (node0 === null) {
            node0 = nodePool.length > 0 ? nodePool.pop() : nodeModule();
            // intialize the node:
            rootOfSet0 = node0.parent = node0;
            node0.treeSize = 1;
        
            nodes[pointCore.hash(lineSegment.p0)] = node0;
        } else {
            rootOfSet0 = exports.find(node0);
        }
        
        var node1 = nodes[pointCore.hash(lineSegment.p1)];
        var rootOfSet1;
        if (node1 === null) {
            node1 = nodePool.length > 0 ? nodePool.pop() : nodeModule();
            // intialize the node:
            rootOfSet1 = node1.parent = node1;
            node1.treeSize = 1;
        
            nodes[pointCore.hash(lineSegment.p1)] = node1;
        } else {
            rootOfSet1 = exports.find(node1);
        }
        
        if (rootOfSet0 !== rootOfSet1) {   // nodes not in same set
            mst.push(lineSegment);
            
            // merge the two sets:
            var treeSize0 = rootOfSet0.treeSize;
            var treeSize1 = rootOfSet1.treeSize;
            if (treeSize0 >= treeSize1) {
                // set0 absorbs set1:
                rootOfSet1.parent = rootOfSet0;
                rootOfSet0.treeSize += treeSize1;
            } else {
                // set1 absorbs set0:
                rootOfSet0.parent = rootOfSet1;
                rootOfSet1.treeSize += treeSize0;
            }
        }
    }
    
    _(nodes).each(function (node) {
        nodePool.push(node);
    });
    
    return mst;
};
},{"../../as3/point-core":4,"../../janicek/core":9,"../geom/line-segment":30,"./node":24,"lodash":1}],23:[function(require,module,exports){
'use strict';

module.exports = {
    LEFT: 'left',
    RIGHT: 'right',

    other: function (leftRight) {
        return leftRight === this.LEFT ? this.RIGHT : this.LEFT;
    }
};
},{}],24:[function(require,module,exports){
'use strict';

module.exports = function () {
    return {
        parent: null,
        treeSize: 0
    };
};

module.exports.pool = [];
},{}],25:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var circle = require('../geom/circle');
var def = require('../../janicek/core').def;
var rectangle = require('../../as3/rectangle');
var siteModule = require('./site');

module.exports = function () {
    var _sites = []; // Vector<Site>
    var _currentIndex = 0;
    var _sorted = false;

    var pub = {};

    pub.dispose = function () {
        if (_sites !== null) {
            _(_sites).each(function (site) {
                site.dispose();
            });
            _sites = null;
        }
    };

    pub.push = function (site) {
        _sorted = false;
        return _sites.push(site);
    };

    Object.defineProperties(pub, {
        'length': {get: function () { return _sites.length; }}
    });

    pub.next = function () {
        if (_sorted === false) {
            throw 'SiteList::next():  sites have not been sorted';
        }
        if (_currentIndex < _sites.length) {
            return _sites[_currentIndex++];
        } else {
            return null;
        }
    };

    pub.getSitesBounds = function () {
        if (_sorted === false) {
            siteModule.sortSites(_sites);
            _currentIndex = 0;
            _sorted = true;
        }
        var xmin, xmax, ymin, ymax;
        if (_sites.length === 0) {
            return rectangle(0, 0, 0, 0);
        }
        
        xmin = Number.POSITIVE_INFINITY;
        xmax = Number.POSITIVE_INFINITY;
        _(_sites).each(function (site) {
            if (site.x < xmin) {
                xmin = site.x;
            }
            if (site.x > xmax) {
                xmax = site.x;
            }
        });
        // here's where we assume that the sites have been sorted on y:
        ymin = _sites[0].y;
        ymax = _sites[_sites.length - 1].y;
        
        return rectangle(xmin, ymin, xmax - xmin, ymax - ymin);
    };

    pub.siteColors = function (referenceImage) {
        referenceImage = def(referenceImage, null);

        var colors = []; // Vector<Int>
        _(_sites).each(function (site) {
            colors.push(referenceImage !== null ? referenceImage.getPixel(site.x, site.y) : site.color);
        });
        return colors;
    };

    pub.siteCoords = function () {
        var coords = []; // Vector<Point>
        _(_sites).each(function (site) {
            coords.push(site.coord);
        });
        return coords;
    };

    /**
     * 
     * @return the largest circle centered at each site that fits in its region;
     * if the region is infinite, return a circle of radius 0.
     * 
     */
    pub.circles = function () {
        var circles = []; // Vector<Circle>
        _(_sites).each(function (site) {
            //var radius:Number = 0;
            var nearestEdge = site.nearestEdge();
            
            var radius = (!nearestEdge.isPartOfConvexHull()) ? (nearestEdge.sitesDistance() * 0.5): 0;
            //!nearestEdge.isPartOfConvexHull() && (radius = nearestEdge.sitesDistance() * 0.5);
            circles.push(circle(site.x, site.y, radius));
        });
        return circles;
    };

    pub.regions = function (plotBounds) {
        var regions = []; // Vector<Vector<Point>>
        _(_sites).each(function (site) {
            regions.push(site.region(plotBounds));
        });
        return regions;
    };

    /**
     * 
     * @param proximityMap a BitmapData whose regions are filled with the site index values; see PlanePointsCanvas::fillRegions()
     * @param x
     * @param y
     * @return coordinates of nearest Site to (x, y)
     * 
     */
    pub.nearestSitePoint = function (proximityMap, x, y) {
        var index = proximityMap.getPixel(x, y);
        if (index > _sites.length - 1) {
            return null;
        }
        return _sites[index].coord;
    };

    return pub;
};
},{"../../as3/rectangle":5,"../../janicek/core":9,"../geom/circle":29,"./site":26,"lodash":1}],26:[function(require,module,exports){
/* jshint bitwise:false, es3:false */

'use strict';

var _ = require('lodash');
var boundsCheck = require('./bounds-check');
var criterion = require('./criterion');
var def = require('../../janicek/core').def;
var edgeModule = require('./edge');
var edgeReordererModule = require('./edge-reorderer');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var polygon = require('../geom/polygon');
var rect = require('../../as3/rectangle').core;
var voronoiModule = require('./voronoi');
var winding = require('../geom/winding');

var _pool = []; // Vector<Site>


var EPSILON = 0.005;
function closeEnough(p0, p1) {
    return pointCore.distance(p0, p1) < EPSILON;
}

var Site = function (p, index, weight, color) {
    this.init(p, index, weight, color);
};

Site.prototype = {
    _coord: null,
    get coord() { return this._coord; },
    color: 0,
    weight: 0.0,
    _siteIndex: 0,

    // the edges that define this Site's Voronoi region:
    _edges: null, // Vector<Edge>
    get edges() { return this._edges; },

    // which end of each edge hooks up with the previous edge in _edges:
    _edgeOrientations: null, // Vector<LR>;
    // ordered list of points that define the region clipped to bounds:
    _region: null, // Vector<Point>

    init: function (p, index, weight, color) {
        this._coord = p;
        this._siteIndex = index;
        this.weight = weight;
        this.color = color;
        this._edges = [];
        this._region = null;
        return this;
    },

    toString: function () {
        return 'Site ' + this._siteIndex + ': ' + String(this.coord);
    },

    dispose: function () {
        this._coord = null;
        this._clear();
        _pool.push(this);
    },

    _clear: function () {
        if (this._edges !== null) {
            this._edges = null;
        }
        if (this._edgeOrientations !== null) {
            this._edgeOrientations = null;
        }
        if (this._region !== null) {
            this._region = null;
        }
    },

    addEdge: function (edge) {
        this._edges.push(edge);
    },

    nearestEdge: function () {
        this._edges.sort(edgeModule.compareSitesDistances);
        return this._edges[0];
    },

    neighborSites: function () {
        if (this._edges === null || this._edges.length === 0) {
            return [];
        }
        if (this._edgeOrientations === null) {
            this._reorderEdges();
        }
        var list = []; // Vector<Site>

        _.each(this._edges, function (edge) {
            list.push(this._neighborSite(edge));
        });

        return list;
    },

    _neighborSite: function (edge) {
        if (this === edge.leftSite) {
            return edge.rightSite;
        }
        if (this === edge.rightSite) {
            return edge.leftSite;
        }
        return null;
    },

    region: function (clippingBounds) {
        if (this._edges === null || this._edges.length === 0) {
            return [];
        }
        if (this._edgeOrientations === null) {
            this._reorderEdges();
            this._region = this._clipToBounds(clippingBounds);
            if ((polygon(this._region)).winding() === winding.CLOCKWISE) {
                this._region.reverse();
            }
        }
        return this._region;
    },

    _reorderEdges: function () {
        var reorderer = edgeReordererModule(this._edges, criterion.vertex);
        this._edges = reorderer.edges;
        this._edgeOrientations = reorderer.edgeOrientations;
        reorderer.dispose();
    },

    _clipToBounds: function (bounds) {
        var points = []; // Vector<Point>
        var n = this._edges.length;
        var i = 0;
        var edge = null;
        while (i < n && (this._edges[i].visible === false)) {
            ++i;
        }
        
        if (i === n) {
            // no edges visible
            return [];
        }
        edge = this._edges[i];
        var orientation = this._edgeOrientations[i];
        points.push(edge.clippedEnds[orientation]);
        points.push(edge.clippedEnds[lr.other(orientation)]);

        for (var j = (i + 1); j < n; j++) {
            edge = this._edges[j];
            if (edge.visible === false) {
                continue;
            }
            this._connect(points, j, bounds);
        }
        // close up the polygon by adding another corner point of the bounds if needed:
        this._connect(points, i, bounds, true);
        
        return points;
    },

    _connect: function (points, j, bounds, closingUp) {
        closingUp = def(closingUp, false);

        var rightPoint = points[points.length - 1];
        var newEdge = this._edges[j];
        var newOrientation = this._edgeOrientations[j];
        // the point that  must be connected to rightPoint:
        var newPoint = newEdge.clippedEnds[newOrientation];
        if (!closeEnough(rightPoint, newPoint)) {
            // The points do not coincide, so they must have been clipped at the bounds;
            // see if they are on the same border of the bounds:
            if (rightPoint.x !== newPoint.x && rightPoint.y !== newPoint.y) {
                // They are on different borders of the bounds;
                // insert one or two corners of bounds as needed to hook them up:
                // (NOTE this will not be correct if the region should take up more than
                // half of the bounds rect, for then we will have gone the wrong way
                // around the bounds and included the smaller part rather than the larger)
                var rightCheck = boundsCheck.check(rightPoint, bounds);
                var newCheck = boundsCheck.check(newPoint, bounds);
                var px, py;
                if ((rightCheck & boundsCheck.RIGHT) !== 0) {
                    px = rect(bounds).right();
                    if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        py = rect(bounds).bottom();
                        points.push({x: px, y: py});
                    }
                    else if ((newCheck & boundsCheck.TOP) !== 0) {
                        py = rect(bounds).top();
                        points.push({x: px, y: py});
                    }
                    else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        if (rightPoint.y - bounds.y + newPoint.y - bounds.y < bounds.height) {
                            py = rect(bounds).top();
                        } else {
                            py = rect(bounds).bottom();
                        }
                        points.push({x: px, y: py});
                        points.push({x: rect(bounds).left(), y: py});
                    }
                } else if ((rightCheck & boundsCheck.LEFT) !== 0) {
                    px = rect(bounds).left();
                    if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        py = rect(bounds).bottom();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.TOP) !== 0) {
                        py = rect(bounds).top();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        if (rightPoint.y - bounds.y + newPoint.y - bounds.y < bounds.height) {
                            py = rect(bounds).top();
                        } else {
                            py = rect(bounds).bottom();
                        }
                        points.push({x: px, y: py});
                        points.push({x: rect(bounds).right(), y: py});
                    }
                } else if ((rightCheck & boundsCheck.TOP) !== 0) {
                    py = rect(bounds).top();
                    if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        px = rect(bounds).right();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        px = rect(bounds).left();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        if (rightPoint.x - bounds.x + newPoint.x - bounds.x < bounds.width) {
                            px = rect(bounds).left();
                        } else {
                            px = rect(bounds).right();
                        }
                        points.push({x: px, y: py});
                        points.push({x: px, y: rect(bounds).bottom()});
                    }
                } else if ((rightCheck & boundsCheck.BOTTOM) !== 0) {
                    py = rect(bounds).bottom();
                    if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        px = rect(bounds).right();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        px = rect(bounds).left();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.TOP) !== 0) {
                        if (rightPoint.x - bounds.x + newPoint.x - bounds.x < bounds.width) {
                            px = rect(bounds).left();
                        } else {
                            px = rect(bounds).right();
                        }
                        points.push({x: px, y: py});
                        points.push({x: px, y: rect(bounds).top()});
                    }
                }
            }
            if (closingUp) {
                // newEdge's ends have already been added
                return;
            }
            points.push(newPoint);
        }
        var newRightPoint = newEdge.clippedEnds[lr.other(newOrientation)];
        if (!closeEnough(points[0], newRightPoint)) {
            points.push(newRightPoint);
        }
    },

    get x() { return this._coord.x; },

    get y() { return this._coord.y; },

    dist: function (p) {
        return pointCore.distance(p.coord, this.coord);
    }
};

exports.create = function (p, index, weight, color) {
    if (_pool.length > 0) {
        return _pool.pop().init(p, index, weight, color);
    } else {
        return new Site(p, index, weight, color);
    }
};

/**
 * sort sites on y, then x, coord
 * also change each site's _siteIndex to match its new position in the list
 * so the _siteIndex can be used to identify the site for nearest-neighbor queries
 * 
 * haha "also" - means more than one responsibility...
 * 
 */
exports.sortSites = function (sites) {
    sites.sort(voronoiModule.compareSiteByYThenX);
    _(sites).each(function (site, i) {
        sites[i]._siteIndex = i;
    });
};
},{"../../as3/point-core":4,"../../as3/rectangle":5,"../../janicek/core":9,"../geom/polygon":31,"../geom/winding":32,"./bounds-check":14,"./criterion":15,"./edge":19,"./edge-reorderer":18,"./lr":23,"./voronoi":28,"lodash":1}],27:[function(require,module,exports){
/* jshint es3:false */

'use strict';

var _pool = [];
var _nvertices = 0;

var Vertex = function (x, y) {
    this.init(x, y);
};

Vertex.prototype = {
    _coord: null,

    get coord() { return this._coord; },

    vertexIndex: 0,

    init: function (x, y) {
        this._coord = {x: x, y: y};
        return this;
    },

    dispose: function () {
        this._coord = null;
        _pool.push(this);
    },

    setIndex: function () {
        this.vertexIndex = _nvertices++;
    },

    toString: function () {
        return 'Vertex (' + this.vertexIndex + ')';
    },

    get x() {
        return this._coord.x;
    },

    get y() {
        return this._coord.y;
    }

};

function create(x, y) {
    if (isNaN(x) || isNaN(y)) {
        return exports.VERTEX_AT_INFINITY;
    }
    if (_pool.length > 0) {
        return _pool.pop().init(x, y);
    } else {
        return new Vertex(x, y);
    }
}

exports.VERTEX_AT_INFINITY = new Vertex(NaN, NaN);

/**
 * This is the only way to make a Vertex
 * 
 * @param halfedge0
 * @param halfedge1
 * @return 
 * 
 */
exports.intersect = function (halfedge0, halfedge1) {
    var voronoi = require('./voronoi');
    var lr = require('./lr');

    var edge0, edge1, edge;
    var halfedge;
    var determinant, intersectionX, intersectionY;
    var rightOfSite;

    edge0 = halfedge0.edge;
    edge1 = halfedge1.edge;
    if (edge0 === null || edge1 === null) {
        return null;
    }
    if (edge0.rightSite === edge1.rightSite) {
        return null;
    }

    determinant = edge0.a * edge1.b - edge0.b * edge1.a;
    if (-1.0e-10 < determinant && determinant < 1.0e-10) {
        // the edges are parallel
        return null;
    }

    intersectionX = (edge0.c * edge1.b - edge1.c * edge0.b) / determinant;
    intersectionY = (edge1.c * edge0.a - edge0.c * edge1.a) / determinant;

    //if (Voronoi.isInfSite(edge0.rightSite, edge1.rightSite))  //HxDelaunay
    if (voronoi.compareSiteByYThenX(edge0.rightSite, edge1.rightSite) < 0) {
        halfedge = halfedge0;
        edge = edge0;
    } else {
        halfedge = halfedge1;
        edge = edge1;
    }
    rightOfSite = intersectionX >= edge.rightSite.x;
    if ((rightOfSite && halfedge.leftRight === lr.LEFT) ||
        (!rightOfSite && halfedge.leftRight === lr.RIGHT)) {
        return null;
    }
    return create(intersectionX, intersectionY);
};
},{"./lr":23,"./voronoi":28}],28:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var criterion = require('./criterion');
var core = require('../../janicek/core');
var def = require('../../janicek/core').def;
var delaunayModule = require('./delaunay');
var edgeListModule = require('./edge-list');
var edgeModule = require('./edge');
var edgeReordererModule = require('./edge-reorderer');
var halfEdgeModule = require('./halfedge');
var halfedgePriorityQueue = require('./halfedge-priority-queue');
var kruskalModule = require('./kruskal');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var prngModule = require('../../polygonal/pm-prng');
var siteListModule = require('./site-list');
var siteModule = require('./site');
var vertexModule = require('./vertex');

exports.make = function (points, colors, plotBoundsArg) {

    var _prng = prngModule();
    var _sites = siteListModule();
    var _sitesIndexedByLocation = {}; // Dictionary<Site>
    var _triangles = []; // Vector<Triangle>
    var _edges = []; // Vector<Edge>

    var pub = {};

    // TODO generalize this so it doesn't have to be a rectangle;
    // then we can make the fractal voronois-within-voronois
    pub.plotBounds = plotBoundsArg;

    pub.dispose = function () {
        var i, n;
        if (_sites !== null) {
            _sites.dispose();
            _sites = null;
        }
        if (_triangles !== null) {
            n = _triangles.length;
            for (i = 0; i < n; i++) {
                _triangles[i].dispose();
            }
            //_triangles.length = 0;
            _triangles = null;
        }
        if (_edges !== null) {
            n = _edges.length;
            for (i = 0; i < n; i++) {
                _edges[i].dispose();
            }
            //_edges.length = 0;
            _edges = null;
        }
        pub.plotBounds = null;
        _sitesIndexedByLocation = null;
    };

    /**
     * AS3 Dictionary stores object keys by object identity.
     * Haxe Hash only supports string keys.
     * This means duplicate coordinates can't be stored in hash.
     * Prevent this case until it's possible to store duplicate points coords.
     */
    function makeSureNoDuplicatePoints(points) {
        var h = {};
        _(points).each(function (p) {
            if (_(h).has(pointCore.hash(p))) {
                throw 'Duplicate points not supported yet!';
            }
            h[pointCore.hash(p)] = p;
        });
    }

    function addSites(points, colors) {
        var length = points.length;
        for (var i = 0; i < length; i++) {
            addSite(points[i], (colors !== null) ? colors[i] : 0, i);
        }
    }

    function addSite(p, color, index) {
        var weight = _prng.nextDouble() * 100;
        var site = siteModule.create(p, index, weight, color);
        _sites.push(site);
        _sitesIndexedByLocation[pointCore.hash(p)] = site;
    }

    pub.edges = function () {
        return _edges;
    };

    pub.region = function (p) {
        var site = _sitesIndexedByLocation[pointCore.hash(p)];
        if (site === null) {
            return [];
        }
        return site.region(pub.plotBounds);
    };

    // TODO: bug: if you call this before you call region(), something goes wrong :(
    pub.neighborSitesForSite = function (coord) {
        var points = []; // Vector<Point>
        var site = _sitesIndexedByLocation[pointCore.hash(coord)];
        if (site === null) {
            return points;
        }
        var sites = site.neighborSites();
        _(sites).each(function (neighbor) {
            points.push(neighbor.coord);
        });
        return points;
    };

    pub.circles = function () {
        return _sites.circles();
    };

    pub.voronoiBoundaryForSite = function (coord) {
        return delaunayModule.visibleLineSegments(delaunayModule.selectEdgesForSitePoint(coord, _edges));
    };

    pub.delaunayLinesForSite = function (coord) {
        return delaunayModule.delaunayLinesForEdges(delaunayModule.selectEdgesForSitePoint(coord, _edges));
    };

    pub.voronoiDiagram = function () {
        return delaunayModule.visibleLineSegments(_edges);
    };

    pub.delaunayTriangulation = function (keepOutMask) {
        keepOutMask = def(keepOutMask, null);
        return delaunayModule.delaunayLinesForEdges(delaunayModule.selectNonIntersectingEdges(keepOutMask, _edges));
    };

    pub.hull = function () {
        return delaunayModule.delaunayLinesForEdges(hullEdges());
    };

    function hullEdges() {
        return _(_edges).filter(function (edge) {
            return (edge.isPartOfConvexHull());
        });
    }

    pub.hullPointsInOrder = function () {
        var hullEdges = hullEdges();
        
        var points = [];
        if (hullEdges.length === 0) {
            return points;
        }
        
        var reorderer = edgeReordererModule(hullEdges, criterion.site);
        hullEdges = reorderer.edges;
        var orientations = reorderer.edgeOrientations;
        reorderer.dispose();
        
        var orientation;

        var n = hullEdges.length;
        var i;
        for (i = 0; i < n; i++) {
            var edge = hullEdges[i];
            orientation = orientations[i];
            points.push(edge.site(orientation).coord);
        }
        return points;
    };

    pub.spanningTree = function (type, keepOutMask) {
        type = def(type, 'minimum');
        keepOutMask = def(keepOutMask, null);

        var edges = delaunayModule.selectNonIntersectingEdges(keepOutMask, _edges);
        var segments = delaunayModule.delaunayLinesForEdges(edges);
        return kruskalModule.kruskal(segments, type);
    };

    pub.regions = function () {
        return _sites.regions(pub.plotBounds);
    };

    pub.siteColors = function (referenceImage) {
        referenceImage = def(referenceImage, null);
        return _sites.siteColors(referenceImage);
    };

    /**
     * 
     * @param proximityMap a BitmapData whose regions are filled with the site index values; see PlanePointsCanvas::fillRegions()
     * @param x
     * @param y
     * @return coordinates of nearest Site to (x, y)
     * 
     */
    pub.nearestSitePoint = function (proximityMap, x, y) {
        return _sites.nearestSitePoint(proximityMap, x, y);
    };

    pub.siteCoords = function () {
        return _sites.siteCoords();
    };

    function fortunesAlgorithm() {
        var newSite, bottomSite, topSite, tempSite;
        var v, vertex;
        var newintstar;
        var leftRight;
        var lbnd, rbnd, llbnd, rrbnd, bisector;
        var edge;
        
        var dataBounds = _sites.getSitesBounds();
        
        var sqrtNsites = core.toInt(Math.sqrt(_sites.length + 4));
        var heap = halfedgePriorityQueue(dataBounds.y, dataBounds.height, sqrtNsites);
        var edgeList = edgeListModule(dataBounds.x, dataBounds.width, sqrtNsites);
        var halfEdges = [];
        var vertices = [];
        
        var bottomMostSite = _sites.next();
        newSite = _sites.next();

        function leftRegion(he) {
            var edge = he.edge;
            if (edge === null) {
                return bottomMostSite;
            }
            return edge.site(he.leftRight);
        }
        
        function rightRegion(he) {
            var edge = he.edge;
            if (edge === null) {
                return bottomMostSite;
            }
            return edge.site(lr.other(he.leftRight));
        }
        
        while (true) {
            if (heap.empty() === false) {
                newintstar = heap.min();
            }
        
            if (newSite !== null &&  (heap.empty() || exports.comparePointByYThenX(newSite, newintstar) < 0)) {
                /* new site is smallest */
                
                // Step 8:
                lbnd = edgeList.edgeListLeftNeighbor(newSite.coord);    // the Halfedge just to the left of newSite
                rbnd = lbnd.edgeListRightNeighbor;      // the Halfedge just to the right
                bottomSite = rightRegion(lbnd);     // this is the same as leftRegion(rbnd)
                // this Site determines the region containing the new site
                
                // Step 9:
                edge = edgeModule.createBisectingEdge(bottomSite, newSite);
                _edges.push(edge);
                
                bisector = halfEdgeModule.create(edge, lr.LEFT);
                halfEdges.push(bisector);
                // inserting two Halfedges into edgeList constitutes Step 10:
                // insert bisector to the right of lbnd:
                edgeList.insert(lbnd, bisector);
                
                // first half of Step 11:
                if ((vertex = vertexModule.intersect(lbnd, bisector)) !== null) {
                    vertices.push(vertex);
                    heap.remove(lbnd);
                    lbnd.vertex = vertex;
                    lbnd.ystar = vertex.y + newSite.dist(vertex);
                    heap.insert(lbnd);
                }
                
                lbnd = bisector;
                bisector = halfEdgeModule.create(edge, lr.RIGHT);
                halfEdges.push(bisector);
                // second Halfedge for Step 10:
                // insert bisector to the right of lbnd:
                edgeList.insert(lbnd, bisector);
                
                // second half of Step 11:
                if ((vertex = vertexModule.intersect(bisector, rbnd)) !== null) {
                    vertices.push(vertex);
                    bisector.vertex = vertex;
                    bisector.ystar = vertex.y + newSite.dist(vertex);
                    heap.insert(bisector);
                }
                
                newSite = _sites.next();
            } else if (heap.empty() === false) {
                /* intersection is smallest */
                lbnd = heap.extractMin();
                llbnd = lbnd.edgeListLeftNeighbor;
                rbnd = lbnd.edgeListRightNeighbor;
                rrbnd = rbnd.edgeListRightNeighbor;
                bottomSite = leftRegion(lbnd);
                topSite = rightRegion(rbnd);
                // these three sites define a Delaunay triangle
                // (not actually using these for anything...)
                //_triangles.push(new Triangle(bottomSite, topSite, rightRegion(lbnd)));
                
                v = lbnd.vertex;
                v.setIndex();
                lbnd.edge.setVertex(lbnd.leftRight, v);
                rbnd.edge.setVertex(rbnd.leftRight, v);
                edgeList.remove(lbnd);
                heap.remove(rbnd);
                edgeList.remove(rbnd);
                leftRight = lr.LEFT;
                if (bottomSite.y > topSite.y) {
                    tempSite = bottomSite;
                    bottomSite = topSite;
                    topSite = tempSite;
                    leftRight = lr.RIGHT;
                }
                edge = edgeModule.createBisectingEdge(bottomSite, topSite);
                _edges.push(edge);
                bisector = halfEdgeModule.create(edge, leftRight);
                halfEdges.push(bisector);
                edgeList.insert(llbnd, bisector);
                edge.setVertex(lr.other(leftRight), v);
                if ((vertex = vertexModule.intersect(llbnd, bisector)) !== null) {
                    vertices.push(vertex);
                    heap.remove(llbnd);
                    llbnd.vertex = vertex;
                    llbnd.ystar = vertex.y + bottomSite.dist(vertex);
                    heap.insert(llbnd);
                }
                if ((vertex = vertexModule.intersect(bisector, rrbnd)) !== null) {
                    vertices.push(vertex);
                    bisector.vertex = vertex;
                    bisector.ystar = vertex.y + bottomSite.dist(vertex);
                    heap.insert(bisector);
                }
            } else {
                break;
            }
        }
        
        // heap should be empty now
        heap.dispose();
        edgeList.dispose();
        
        _(halfEdges).each(function (halfEdge) {
            halfEdge.reallyDispose();
        });
        //halfEdges.length = 0;
        
        // we need the vertices to clip the edges
        _(_edges).each(function (edge) {
            edge.clipVertices(pub.plotBounds);
        });
        // but we don't actually ever use them again!
        _(vertices).each(function (vertex) {
            vertex.dispose();
        });
        //vertices.length = 0;
    }

    makeSureNoDuplicatePoints(points);
    _prng.seed = 1;
    addSites(points, colors);
    fortunesAlgorithm();

    return pub;
};

/**
 * HxDelaunay
 */
exports.isInfSite = function (s1, s2) {
    return (s1.y < s2.y) || (s1.y === s2.y && s1.x < s2.x);
};

exports.comparePointByYThenX = function (s1, s2) {
    return exports.compareByYThenX(s1.x, s1.y, s2.x, s2.y);
};

exports.compareSiteByYThenX = function (s1, s2) {
    return exports.compareByYThenX(s1.x, s1.y, s2.x, s2.y);
};

exports.compareByYThenX = function (s1x, s1y, s2x, s2y) {
    if (s1y < s2y) { return -1; }
    if (s1y > s2y) { return 1; }
    if (s1x < s2x) { return -1; }
    if (s1x > s2x) { return 1; }
    return 0;
};
},{"../../as3/point-core":4,"../../janicek/core":9,"../../polygonal/pm-prng":33,"./criterion":15,"./delaunay":16,"./edge":19,"./edge-list":17,"./edge-reorderer":18,"./halfedge":21,"./halfedge-priority-queue":20,"./kruskal":22,"./lr":23,"./site":26,"./site-list":25,"./vertex":27,"lodash":1}],29:[function(require,module,exports){
'use strict';

module.exports = function (centerX, centerY, radius) {
    return {
        center: {x: centerX, y: centerY},
        radius: radius,
        toString: function () {
            return 'Circle (center: ' + this.center + '; radius: ' + this.radius + ')';
        }
    };
};
},{}],30:[function(require,module,exports){
'use strict';

var pointCore = require('../../as3/point-core');

module.exports = function (p0, p1) {
    return {
        p0: p0,
        p1: p1
    };
};

module.exports.core = {
    compareLengthsMax: function (segment0, segment1) {
        var length0 = pointCore.distance(segment0.p0, segment0.p1);
        var length1 = pointCore.distance(segment1.p0, segment1.p1);
        if (length0 < length1) {
            return 1;
        }
        if (length0 > length1) {
            return -1;
        }
        return 0;
    },

    compareLengths: function (edge0, edge1) {
        return - this.compareLengthsMax(edge0, edge1);
    }
};
},{"../../as3/point-core":4}],31:[function(require,module,exports){
'use strict';

var winding = require('./winding');

var Polygon = function (vertices) {
    this._vertices = vertices;
};

Polygon.prototype = {
    area: function () {
        return Math.abs(this.signedDoubleArea() * 0.5);
    },

    winding: function () {
        var signedDoubleArea = this.signedDoubleArea();
        if (signedDoubleArea < 0) {
            return winding.CLOCKWISE;
        }
        if (signedDoubleArea > 0) {
            return winding.COUNTERCLOCKWISE;
        }
        return winding.NONE;
    },

    signedDoubleArea: function () {
        var index, nextIndex;
        var n = this._vertices.length;
        var point, next;
        var signedDoubleArea = 0;
        for (index = 0; index < n; index++) {
            nextIndex = (index + 1) % n;
            point = this._vertices[index];
            next = this._vertices[nextIndex];
            signedDoubleArea += point.x * next.y - next.x * point.y;
        }
        return signedDoubleArea;
    }
};

module.exports = function (vertices) {
    return new Polygon(vertices);
};
},{"./winding":32}],32:[function(require,module,exports){
'use strict';

module.exports = {
    CLOCKWISE: 'clockwise',
    COUNTERCLOCKWISE: 'counterclockwise',
    NONE: 'none'
};
},{}],33:[function(require,module,exports){
'use strict';

module.exports = function () {

    return {

        /**
         * set seed with a 31 bit unsigned integer
         * between 1 and 0X7FFFFFFE inclusive. don't use 0!
         */
        seed: 1,

        /**
         * provides the next pseudorandom number
         * as a float between nearly 0 and nearly 1.0.
         */
        nextDouble: function () {
            return (this.gen() / 2147483647);
        },

        /**
         * provides the next pseudorandom number
         * as an unsigned integer (31 bits) betweeen
         * a given range.
         */
        nextIntRange: function (min, max) {
            min -= 0.4999;
            max += 0.4999;
            return Math.round(min + ((max - min) * this.nextDouble()));
        },

        /**
         * provides the next pseudorandom number
         * as a float between a given range.
         */
        nextDoubleRange: function (min, max) {
            return min + ((max - min) * this.nextDouble());
        },

        /**
         * generator:
         * new-value = (old-value * 16807) mod (2^31 - 1)
         */
        gen: function () {
            //integer version 1, for max int 2^46 - 1 or larger.
            this.seed = (this.seed * 16807) % 2147483647;
            return this.seed;
            
            /**
             * integer version 2, for max int 2^31 - 1 (slowest)
             */
            //var test:int = 16807 * (seed % 127773 >> 0) - 2836 * (seed / 127773 >> 0);
            //return seed = (test > 0 ? test : test + 2147483647);
            
            /**
             * david g. carta's optimisation is 15% slower than integer version 1
             */
            //var hi:uint = 16807 * (seed >> 16);
            //var lo:uint = 16807 * (seed & 0xFFFF) + ((hi & 0x7FFF) << 16) + (hi >> 15);
            //return seed = (lo > 0x7FFFFFFF ? lo - 0x7FFFFFFF : lo);
        }
    };
};
},{}],34:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var colorModule = require('../janicek/html-color');
var convert = require('../as3/conversion-core');
var core = require('../janicek/core');
var matrix = require('../as3/matrix');
var pointCore = require('../as3/point-core');
var vector3d = require('../as3/vector-3d');

exports.graphicsReset = function (c, mapWidth, mapHeight, displayColors) {
    c.lineWidth = 1.0;
    c.clearRect(0, 0, 2000, 2000);
    c.fillStyle = '#bbbbaa';
    c.fillRect(0, 0, 2000, 2000);
    c.fillStyle = colorModule.intToHexColor(displayColors.OCEAN);
    c.fillRect(0, 0, core.toInt(mapWidth), core.toInt(mapHeight));
};

var lightVector = vector3d(-1, -1, 0);

exports.calculateLighting = function (p, r, s) {
    var A = vector3d(p.point.x, p.point.y, p.elevation);
    var B = vector3d(r.point.x, r.point.y, r.elevation);
    var C = vector3d(s.point.x, s.point.y, s.elevation);
    var normal = B.subtract(A).crossProduct(C.subtract(A));
    if (normal.z < 0) { normal.scaleBy(-1); }
    normal.normalize();
    var light = 0.5 + 35 * normal.dotProduct(lightVector);
    if (light < 0) { light = 0; }
    if (light > 1) { light = 1; }
    return light;
};

exports.colorWithSlope = function (color, p, q, edge, displayColors) {
    var r = edge.v0;
    var s = edge.v1;
    if (_.isNull(r) || _.isNull(s)) {
        // Edge of the map
        return displayColors.OCEAN;
    } else if (p.water) {
        return color;
    }

    if (q !== null && p.water === q.water) {
        color = colorModule.interpolateColor(color, displayColors[q.biome], 0.4);
    }
    var colorLow = colorModule.interpolateColor(color, 0x333333, 0.7);
    var colorHigh = colorModule.interpolateColor(color, 0xffffff, 0.3);
    var light = exports.calculateLighting(p, r, s);
    if (light < 0.5) {
        return colorModule.interpolateColor(colorLow, color, light * 2);
    } else {
        return colorModule.interpolateColor(color, colorHigh, light * 2 - 1);
    }
};

exports.colorWithSmoothColors = function (color, p, q, edge, displayColors) {
    if (q !== null && p.water === q.water) {
        color = colorModule.interpolateColor(displayColors[p.biome], displayColors[q.biome], 0.25);
    }
    return color;
};

exports.renderDebugPolygons = function (context, map, displayColors) {

    var color;

    if (map.centers.length === 0) {
        // We're still constructing the map so we may have some points
        
        context.fillStyle = '#dddddd';
        context.fillRect(0, 0, core.toInt(map.SIZE.width), core.toInt(map.SIZE.height) /*context.canvas.width, context.canvas.height */); //graphics.drawRect(0, 0, SIZE, SIZE);
        _(map.points).each(function (point) {
            context.beginPath();
            context.strokeStyle = '#000000';
            context.fillStyle = '#000000';
            context.arc(point.x, point.y, 1.3, Math.PI, 2 * Math.PI, false);
            context.closePath();
            context.fill();
            context.stroke();
        });
    }
    
    _(map.centers).each(function (p) {
        color = !_.isNull(p.biome) ? displayColors[p.biome] : (p.ocean ? displayColors.OCEAN : p.water ? displayColors.RIVER : 0xffffff);
      
        //Draw shape
        context.beginPath();
        _(p.borders).each(function (edge) {
            if (!_.isNull(edge.v0) && !_.isNull(edge.v1)) {
                context.moveTo(p.point.x, p.point.y);
                context.lineTo(edge.v0.point.x, edge.v0.point.y);
                context.lineTo(edge.v1.point.x, edge.v1.point.y);
            }
        });
        context.closePath();
        context.fillStyle = colorModule.intToHexColor(colorModule.interpolateColor(color, 0xdddddd, 0.2));
        context.fill();

        //Draw borders
        _(p.borders).each(function (edge) {
            if (!_.isNull(edge.v0) && !_.isNull(edge.v1)) {
                context.beginPath();
                context.moveTo(edge.v0.point.x, edge.v0.point.y);
                if (edge.river > 0) {
                    context.lineWidth = 1;
                    context.strokeStyle = colorModule.intToHexColor(displayColors.RIVER);
                } else {
                    context.lineWidth = 0.1;
                    context.strokeStyle = '#000000';
                }
                context.lineTo(edge.v1.point.x, edge.v1.point.y);
                context.closePath();
                context.stroke();
            }
        });
        
        context.beginPath();
        context.fillStyle = (p.water ? '#003333' : '#000000');
        context.globalAlpha = 0.7;
        context.arc(p.point.x, p.point.y, 1.3, Math.PI, 2 * Math.PI, false);
        context.closePath();
        context.fill();
        context.globalAlpha = 1.0;
        _(p.corners).each(function (q) {
            context.fillStyle = q.water ? '#0000ff' : '#009900';
            context.fillRect(core.toInt(q.point.x - 0.7), core.toInt(q.point.y - 0.7), core.toInt(1.5), core.toInt(1.5));
        });
    });
};

// Render the paths from each polygon to the ocean, showing watersheds.
exports.renderWatersheds = function (graphics, map, watersheds) {
    var edge, w0, w1;

    _(map.edges).each(function (edge) {
        if (!_.isNull(edge.d0) && !_.isNull(edge.d1) && !_.isNull(edge.v0) && !_.isNull(edge.v1) && !edge.d0.ocean && !edge.d1.ocean) {
            w0 = watersheds.watersheds[edge.d0.index];
            w1 = watersheds.watersheds[edge.d1.index];
            if (w0 !== w1) {
                graphics.beginPath();
                //graphics.lineStyle(3.5, 0x000000, 0.1 * Math.sqrt((map.corners[w0].watershedSize || 1) + (map.corners[w1].watershed.watershedSize || 1)));
                graphics.lineWidth = 3.5;
                graphics.strokeStyle = colorModule.rgba(0, 0, 0, 0.1 * Math.sqrt((core.coalesce(map.corners[w0].watershedSize, 1)) + (core.coalesce(map.corners[w1].watershed.watershedSize, 1))));
                graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
                graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
                graphics.closePath(); //graphics.lineStyle();
                graphics.stroke();
            }
        }
    });

    for (edge in map.edges) {
        if (convert.booleanFromInt(edge.river)) {
            graphics.beginPath();
            //graphics.lineStyle(1.0, 0x6699ff);
            graphics.lineWidth = 1.0;
            graphics.strokeStyle = '#6699ff';
            graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
            graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
            //graphics.lineStyle();
            graphics.closePath();
            graphics.stroke();
        }
    }
};

function drawPathForwards(graphics, path) {
    for (var i = 0; i < path.length; i++) {
        graphics.lineTo(path[i].x, path[i].y);
    }
}

// Helper function for drawing triangles with gradients. This
// function sets up the fill on the graphics object, and then
// calls fillFunction to draw the desired path.
function drawGradientTriangle(graphics, v1, v2, v3, colors, fillFunction, fillX, fillY) {
    var m = matrix();

    // Center of triangle:
    var V = v1.add(v2).add(v3);
    V.scaleBy(1 / 3.0);

    // Normal of the plane containing the triangle:
    var N = v2.subtract(v1).crossProduct(v3.subtract(v1));
    N.normalize();

    // Gradient vector in x-y plane pointing in the direction of increasing z
    var G = vector3d(-N.x / N.z, -N.y / N.z, 0);

    // Center of the color gradient
    var C = vector3d(V.x - G.x * ((V.z - 0.5) / G.length / G.length), V.y - G.y * ((V.z - 0.5) / G.length / G.length));

    if (G.length < 1e-6) {
        // If the gradient vector is small, there's not much
        // difference in colors across this triangle. Use a plain
        // fill, because the numeric accuracy of 1/G.length is not to
        // be trusted.  NOTE: only works for 1, 2, 3 colors in the array
        var color = colors[0];
        if (colors.length === 2) {
            color = colorModule.interpolateColor(colors[0], colors[1], V.z);
        } else if (colors.length === 3) {
            if (V.z < 0.5) {
                color = colorModule.interpolateColor(colors[0], colors[1], V.z * 2);
            } else {
                color = colorModule.interpolateColor(colors[1], colors[2], V.z * 2 - 1);
            }
        }
        graphics.fillStyle = colorModule.intToHexColor(color); //graphics.beginFill(color);
    } else {
        // The gradient box is weird to set up, so we let Flash set up
        // a basic matrix and then we alter it:
        m.createGradientBox(1, 1, 0, 0, 0);
        m.translate(-0.5, -0.5);
        m.scale((1 / G.length), (1 / G.length));
        m.rotate(Math.atan2(G.y, G.x));
        m.translate(C.x, C.y);
        var alphas = _(colors).map(function (c) { return 1.0; });
        var spread = _(colors).map(function (c, index) { return 255 * index / (colors.length - 1); });
        //graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, spread, m, SpreadMethod.PAD);
    }
    fillFunction(graphics, fillX, fillY);
    graphics.fill(); //graphics.endFill();
}

// Render the interior of polygons
exports.renderPolygons = function (graphics, colors, gradientFillProperty, colorOverrideFunction, map, noisyEdges)  {
    // My Voronoi polygon rendering doesn't handle the boundary
    // polygons, so I just fill everything with ocean first.
    graphics.fillStyle = colorModule.intToHexColor(colors.OCEAN);
    graphics.fillRect(0, 0, core.toInt(map.SIZE.width), core.toInt(map.SIZE.height));
 
    var drawPath0 = function (graphics, x, y) {
        var path = noisyEdges.path0[edge.index];
        graphics.moveTo(x, y);
        graphics.lineTo(path[0].x, path[0].y);
        drawPathForwards(graphics, path);
        graphics.lineTo(x, y);
    };

    var drawPath1 = function (graphics, x, y) {
        var path = noisyEdges.path1[edge.index];
        graphics.moveTo(x, y);
        graphics.lineTo(path[0].x, path[0].y);
        drawPathForwards(graphics, path);
        graphics.lineTo(x, y);
    };

    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            var edge = map.lookupEdgeFromCenter(p, r);
            var color = core.coalesce(colors[p.biome], 0);
            if (colorOverrideFunction !== null) {
                color = colorOverrideFunction(color, p, r, edge, colors);
            }

            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index])) {
                // It's at the edge of the map, where we don't have
                // the noisy edges computed. TODO: figure out how to
                // fill in these edges from the voronoi library.
                continue;
            }

            if (!core.isUndefinedOrNull(gradientFillProperty)) {
                // We'll draw two triangles: center - corner0 -
                // midpoint and center - midpoint - corner1.
                var corner0 = edge.v0;
                var corner1 = edge.v1;

                // We pick the midpoint elevation/moisture between
                // corners instead of between polygon centers because
                // the resulting gradients tend to be smoother.
                var midpoint = edge.midpoint;
                var midpointAttr = 0.5 * (corner0[gradientFillProperty] + corner1[gradientFillProperty]);
                drawGradientTriangle(
                    graphics,
                    vector3d(p.point.x, p.point.y, p[gradientFillProperty]),
                    vector3d(corner0.point.x, corner0.point.y, corner0[gradientFillProperty]),
                    vector3d(midpoint.x, midpoint.y, midpointAttr),
                    [colors.GRADIENT_LOW, colors.GRADIENT_HIGH],
                    drawPath0, p.point.x, p.point.y
                );
                drawGradientTriangle(
                    graphics,
                    vector3d(p.point.x, p.point.y, p[gradientFillProperty]),
                    vector3d(midpoint.x, midpoint.y, midpointAttr),
                    vector3d(corner1.point.x, corner1.point.y, corner1[gradientFillProperty]),
                    [colors.GRADIENT_LOW, colors.GRADIENT_HIGH],
                    drawPath1, p.point.x, p.point.y
                );
            } else {
                graphics.fillStyle = colorModule.intToHexColor(color);
                graphics.strokeStyle = graphics.fillStyle;
                graphics.beginPath();
                drawPath0(graphics, p.point.x, p.point.y);
                drawPath1(graphics, p.point.x, p.point.y);
                graphics.closePath();
                graphics.fill();
                graphics.stroke();
            }
        }
    }
};

// Render bridges across every narrow river edge. Bridges are
// straight line segments perpendicular to the edge. Bridges are
// drawn after rivers. TODO: sometimes the bridges aren't long
// enough to cross the entire noisy line river. TODO: bridges
// don't line up with curved road segments when there are
// roads. It might be worth making a shader that draws the bridge
// only when there's water underneath.
exports.renderBridges = function (graphics, map, roads, colors) {
    _(map.edges).each(function (edge) {
        if (edge.river > 0 && edge.river < 4 &&
            !edge.d0.water && !edge.d1.water &&
            (edge.d0.elevation > 0.05 || edge.d1.elevation > 0.05)) {

            var n = { x: -(edge.v1.point.y - edge.v0.point.y), y: edge.v1.point.x - edge.v0.point.x };
            pointCore.normalize(n, 0.25 + (!_.isNull(roads.road[edge.index]) ? 0.5 : 0) + 0.75 * Math.sqrt(edge.river));
            graphics.beginPath();
            graphics.lineWidth = 1.1;
            graphics.strokeStyle = colorModule.intToHexColor(colors.BRIDGE);
            graphics.lineCap = 'square';
            graphics.moveTo(edge.midpoint.x - n.x, edge.midpoint.y - n.y);
            graphics.lineTo(edge.midpoint.x + n.x, edge.midpoint.y + n.y);
            graphics.closePath();
            graphics.stroke();
        }
    });
};

// Render roads. We draw these before polygon edges, so that rivers overwrite roads.
exports.renderRoads = function (graphics, map, roads, colors) {
    // First draw the roads, because any other feature should draw
    // over them. Also, roads don't use the noisy lines.
    var A, B, C;
    var i, j, d, edge1, edge2, edges;

    // Helper function: find the normal vector across edge 'e' and
    // make sure to point it in a direction towards 'c'.
    function normalTowards(e, c, len) {
        // Rotate the v0-->v1 vector by 90 degrees:
        var n = { x: -(e.v1.point.y - e.v0.point.y), y: e.v1.point.x - e.v0.point.x };
        // Flip it around it if doesn't point towards c
        var d = pointCore.subtract(c, e.midpoint);
        if (n.x * d.x + n.y * d.y < 0) {
            n.x = -n.x;
            n.y = -n.y;
        }
        pointCore.normalize(n, len);
        return n;
    }
  
    _(map.centers).each(function (p) {
        if (!core.isUndefinedOrNull(roads.roadConnections[p.index])) {
            if (roads.roadConnections[p.index].length === 2) {
                // Regular road: draw a spline from one edge to the other.
                edges = p.borders;
                for (i = 0; i < edges.length; i++) {
                    edge1 = edges[i];
                    if (roads.road[edge1.index] > 0) {
                        for (j = i + 1; j < edges.length; j++) {
                            edge2 = edges[j];
                            if (roads.road[edge2.index] > 0) {
                                // The spline connects the midpoints of the edges
                                // and at right angles to them. In between we
                                // generate two control points A and B and one
                                // additional vertex C.  This usually works but
                                // not always.
                                d = 0.5 * Math.min(
                                    pointCore.distanceFromOrigin(pointCore.subtract(edge1.midpoint, p.point)),
                                    pointCore.distanceFromOrigin(pointCore.subtract(edge2.midpoint, p.point))
                                );
                                A = pointCore.add(normalTowards(edge1, p.point, d), edge1.midpoint);
                                B = pointCore.add(normalTowards(edge2, p.point, d), edge2.midpoint);
                                C = pointCore.interpolate(A, B, 0.5);
                                graphics.beginPath();
                                graphics.lineWidth = 1.1;
                                graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge1.index]]);
                                graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                                graphics.quadraticCurveTo(A.x, A.y, C.x, C.y);
                                graphics.moveTo(C.x, C.y);
                                graphics.lineWidth = 1.1;
                                graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge2.index]]);
                                graphics.quadraticCurveTo(B.x, B.y, edge2.midpoint.x, edge2.midpoint.y);
                                graphics.stroke();
                                graphics.closePath();
                            }
                        }
                    }
                }
            } else {
                // Intersection or dead end: draw a road spline from
                // each edge to the center
                _(p.borders).each(function (edge1) {
                    if (roads.road[edge1.index] > 0) {
                        d = 0.25 * pointCore.distanceFromOrigin(pointCore.subtract(edge1.midpoint, p.point));
                        A = pointCore.add(normalTowards(edge1, p.point, d), edge1.midpoint);
                        graphics.beginPath();
                        graphics.lineWidth = 1.4;
                        graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge1.index]]);
                        graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                        graphics.quadraticCurveTo(A.x, A.y, p.point.x, p.point.y);
                        graphics.stroke();
                        graphics.closePath();
                    }
                });
            }
        }
    });
};

function drawPathBackwards(graphics, path) {
    var i = path.length - 1;
    while (i >= 0) {
        graphics.lineTo(path[i].x, path[i].y);
        i--;
    }
}

// Render the exterior of polygons: coastlines, lake shores,
// rivers, lava fissures. We draw all of these after the polygons
// so that polygons don't overwrite any edges.
exports.renderEdges = function (graphics, colors, map, noisyEdges, lava, renderRivers) {
    renderRivers = core.def(renderRivers, true);
    var edge;
    
    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            edge = map.lookupEdgeFromCenter(p, r);
            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index])) {
                // It's at the edge of the map
                continue;
            }
            if (p.ocean !== r.ocean) {
                // One side is ocean and the other side is land -- coastline
                graphics.lineWidth = 2;
                graphics.strokeStyle = colorModule.intToHexColor(colors.COAST);
            } else if ((convert.intFromBoolean(p.water) > 0) !== (convert.intFromBoolean(r.water) > 0) && p.biome !== 'ICE' && r.biome !== 'ICE') {
                // Lake boundary
                graphics.lineWidth = 1;
                graphics.strokeStyle = colorModule.intToHexColor(colors.LAKESHORE);
            } else if (p.water || r.water) {
                // Lake interior – we don't want to draw the rivers here
                continue;
            } else if (lava.lava[edge.index]) {
                // Lava flow
                graphics.lineWidth = 1;
                graphics.strokeStyle = colorModule.intToHexColor(colors.LAVA);
            } else if (edge.river > 0 && renderRivers) {
                // River edge
                graphics.lineWidth = Math.sqrt(edge.river);
                graphics.strokeStyle = colorModule.intToHexColor(colors.RIVER);
            } else {
                continue;
            }
            
            graphics.beginPath();
            graphics.moveTo(noisyEdges.path0[edge.index][0].x, noisyEdges.path0[edge.index][0].y);
            drawPathForwards(graphics, noisyEdges.path0[edge.index]);
            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);
            graphics.stroke();
            graphics.closePath();
        }
    }
};

exports.renderAllEdges = function (graphics, strokeStyle, map, noisyEdges) {
    var edge;

    graphics.lineWidth = 5;
    graphics.strokeStyle = strokeStyle;

    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            edge = map.lookupEdgeFromCenter(p, r);

            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index]) || p.water) {
                // It's at the edge of the map or water
                continue;
            }

            // edge

            graphics.beginPath();
            graphics.moveTo(noisyEdges.path0[edge.index][0].x, noisyEdges.path0[edge.index][0].y);
            drawPathForwards(graphics, noisyEdges.path0[edge.index]);
            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);
            graphics.stroke();
            graphics.closePath();
        }
    }
};

},{"../as3/conversion-core":2,"../as3/matrix":3,"../as3/point-core":4,"../as3/vector-3d":6,"../janicek/core":9,"../janicek/html-color":11,"lodash":1}],35:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function () {
    return {
        index: null,
      
        point: null,        // Point location
        water: null,        // lake or ocean
        ocean: null,        // ocean
        coast: null,        // land polygon touching an ocean
        border: null,       // at the edge of the map
        biome: null,          // biome type (see article)
        elevation: null,     // 0.0-1.0
        moisture: null,      // 0.0-1.0

        neighbors: null,    // Vector<Center>
        borders: null,      // Vector<Edge>
        corners: null       // Vector<Corner>
    };
};
},{}],36:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function () {
    return {
        index: null,
      
        point: null,  // location
        ocean: null,  // ocean
        water: null,  // lake or ocean
        coast: null,  // touches ocean and land polygons
        border: null,  // at the edge of the map
        elevation: null,  // 0.0-1.0
        moisture: null,  // 0.0-1.0

        touches: null,
        protrudes: null,
        adjacent: null,
      
        river: null,  // 0 if no river, or volume of water in river
        downslope: null,  // pointer to adjacent corner most downhill
        watershed: null,  // pointer to coastal corner, or null
        watershedSize: null
    };
};
},{}],37:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function () {
    return {
        index: 0,
        d0: null,  // Delaunay edge
        d1: null,  // Delaunay edge
        v0: null,  // Voronoi edge
        v1: null,  // Voronoi edge
        midpoint: null,  // halfway between v0,v1
        river: 0  // volume of water, or 0
    };
};
},{}],38:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: false, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

/**
 * Factory class to build the 'inside' function that tells us whether
 * a point should be on the island or in the water.
 * 
 * This class has factory functions for generating islands of
 * different shapes. The factory returns a function that takes a
 * normalized point (x and y are -1 to +1) and returns true if the
 * point should be on the island, and false if it should be water
 * (lake or ocean).
 */

'use strict';

var array2d = require('../janicek/array2d');
var core = require('../janicek/core');
var distanceFromOrigin = require('../as3/point-core').distanceFromOrigin;
var perlinNoise = require('../janicek/perlin-noise');
var prngModule = require('../polygonal/pm-prng');
var prng = require('../janicek/pseudo-random-number-generators');

/**
* The radial island radius is based on overlapping sine waves 
* @param seed
* @param islandFactor = 1.0 means no small islands; 2.0 leads to a lot
*/
exports.makeRadial = function (seed, islandFactor) {
    islandFactor = core.def(islandFactor, 1.07);

    var islandRandom = prngModule();
    islandRandom.seed = seed;
    var bumps = islandRandom.nextIntRange(1, 6);
    var startAngle = islandRandom.nextDoubleRange(0, 2 * Math.PI);
    var dipAngle = islandRandom.nextDoubleRange(0, 2 * Math.PI);
    var dipWidth = islandRandom.nextDoubleRange(0.2, 0.7);

    function inside(q) {
        var angle = Math.atan2(q.y, q.x);
        var length = 0.5 * (Math.max(Math.abs(q.x), Math.abs(q.y)) + distanceFromOrigin(q));

        var r1 = 0.5 + 0.40 * Math.sin(startAngle + bumps * angle + Math.cos((bumps + 3) * angle));
        var r2 = 0.7 - 0.20 * Math.sin(startAngle + bumps * angle - Math.sin((bumps + 2) * angle));
        if (Math.abs(angle - dipAngle) < dipWidth ||
            Math.abs(angle - dipAngle + 2 * Math.PI) < dipWidth ||
            Math.abs(angle - dipAngle - 2 * Math.PI) < dipWidth) {
            r1 = r2 = 0.2;
        }
        return  (length < r1 || (length > r1 * islandFactor && length < r2));
    }

    return inside;
};

/**
 * The Perlin-based island combines perlin noise with the radius.
 * @param   seed
 * @param   oceanRatio 0 = least ocean, 1 = most ocean
 */
exports.makePerlin = function (seed, oceanRatio) {
    oceanRatio = core.def(oceanRatio, 0.5);

    var landRatioMinimum = 0.1;
    var landRatioMaximum = 0.5;
    oceanRatio = ((landRatioMaximum - landRatioMinimum) * oceanRatio) + landRatioMinimum;  //min: 0.1 max: 0.5
    var perlin = array2d(perlinNoise.makePerlinNoise(256, 256, 1.0, 1.0, 1.0, seed, 8));
    //perlin.perlinNoise(64, 64, 8, seed, false, true); //mapgen2

    return function (q) {
        var c = (perlin.get(core.toInt((q.x + 1) * 128), core.toInt((q.y + 1) * 128)) & 0xff) / 255.0;
        //var c:Number = (perlin.getPixel(Std.int((q.x+1)*128), Std.int((q.y+1)*128)) & 0xff) / 255.0; //mapgen2
        return c > (oceanRatio + oceanRatio * distanceFromOrigin(q) * distanceFromOrigin(q));
    };
};

/**
 * The square shape fills the entire space with land
 */
exports.makeSquare = function () {
    return function (q) {
        return true;
    };
};

/**
* The blob island is shaped like Amit's blob logo
*/
exports.makeBlob = function () {
    return function (q) {
        var eye1 = distanceFromOrigin({ x: q.x - 0.2, y: q.y / 2 + 0.2 }) < 0.05;
        var eye2 = distanceFromOrigin({ x: q.x + 0.2, y: q.y / 2 + 0.2 }) < 0.05;
        var body = distanceFromOrigin(q) < 0.8 - 0.18 * Math.sin(5 * Math.atan2(q.y, q.x));
        return body && !eye1 && !eye2;
    };
};

/**
 * Make island from bitmap.
 * @param {[[boolean]]} bitmap
 */
exports.makeBitmap = function (bitmap) {
    bitmap = array2d(bitmap);
    var dimensions = bitmap.dimensions();
    return function (q) {
        var x = core.toInt(((q.x + 1) / 2) * dimensions.x);
        var y = core.toInt(((q.y + 1) / 2) * dimensions.y);
        return bitmap.get(x, y);
    };
};

/**
 * Make island from simple noise.
 */
exports.makeNoise = function (seed) {
    return function (q) {
        seed = prng.nextParkMiller(seed);
        return prng.toBool(seed);
    };
};
},{"../as3/point-core":4,"../janicek/array2d":8,"../janicek/core":9,"../janicek/perlin-noise":12,"../janicek/pseudo-random-number-generators":13,"../polygonal/pm-prng":33}],39:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var cc = require('../as3/conversion-core');

module.exports = function () {
    return {

        // The lava array marks the edges that hava lava.
        lava: [], // Array<Boolean> edge index -> Boolean

        // Lava fissures are at high elevations where moisture is low
        createLava: function (map, randomDouble) {
            _(map.edges).each(function (edge) {
                if (!cc.booleanFromInt(edge.river) &&
                    !edge.d0.water && !edge.d1.water &&
                    edge.d0.elevation > 0.8 && edge.d1.elevation > 0.8 &&
                    edge.d0.moisture < 0.3 && edge.d1.moisture < 0.3 &&
                    randomDouble() < exports.FRACTION_LAVA_FISSURES) {

                    this.lava[edge.index] = true;
                }
            });
        }

    };
};

module.exports.FRACTION_LAVA_FISSURES = 0.2;  // 0 to 1, probability of fissure
},{"../as3/conversion-core":2,"lodash":1}],40:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var mapModule = require('./map');

var api = {};

api.countLands = function (centers) {
    return _(_(centers).filter(function (c) { return !c.water; })).size();
};

// Rebuilds the map varying the number of points until desired number of land
// centers are generated or timeout is reached. Not an efficient algorithim,
// but gets the job done.
api.tryMutateMapPointsToGetNumberLands = function (map, pointSelector, numberOfLands, options) {
    options = _.defaults(options || {}, {
        timeoutMilliseconds: 10 * 1000,
        initialNumberOfPoints: numberOfLands,
        lakeThreshold: mapModule.DEFAULT_LAKE_THRESHOLD
    });

    var pointCount = options.initialNumberOfPoints;
    var startTime = Date.now();
    var targetLandCountFound = false;
    do {
        map.go0PlacePoints(pointCount, pointSelector);
        map.go1BuildGraph();
        map.go2AssignElevations(options.lakeThreshold);
        var lands = api.countLands(map.centers);
        if (lands === numberOfLands) {
            targetLandCountFound = true;
        } else {
            pointCount += (lands < numberOfLands ? 1 : -1);
        }
    } while (!targetLandCountFound && Date.now() - startTime < options.timeoutMilliseconds);
    return map;
};

module.exports = api;
},{"./map":41,"lodash":1}],41:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var centerModule = require('./graph/center');
var convert = require('../as3/conversion-core');
var core = require('../janicek/core');
var cornerModule = require('./graph/corner');
var edgeModule = require('./graph/edge');
var pc = require('../as3/point-core');
var pointSelectorModule = require('./point-selector');
var prng = require('../polygonal/pm-prng');
var rectangle = require('../as3/rectangle');
var voronoiModule = require('../nodename/delaunay/voronoi');

// Make a new map.
// size: width and height of map
var mapModule = function (size) {
    var pub = {};

    // Passed in by the caller:
    pub.SIZE = size;

    // Island shape is controlled by the islandRandom seed and the
    // type of island, passed in when we set the island shape. The
    // islandShape function uses both of them to determine whether any
    // point should be water or land.
    pub.islandShape = null;

    // Island details are controlled by this random generator. The initial map
    // upon loading is always deterministic, but subsequent maps reset this
    // random number generator with a random seed.
    pub.mapRandom = prng();
    pub.needsMoreRandomness; // see comment in point-selector.js

    // These store the graph data
    
    // Only useful during map construction
    pub.points = []; // Vector<Point>
    pub.centers = []; // Vector<Center>
    pub.corners = []; // Vector<Corner>
    pub.edges = []; // Vector<Edge>


    // Random parameters governing the overall shape of the island
    pub.newIsland = function (islandShape, variant) {
        pub.islandShape = islandShape;
        pub.mapRandom.seed = variant;
    };

    // Generate the initial random set of points.
    pub.go0PlacePoints = function (numberOfPoints, pointSelector) {
        pub.needsMoreRandomness = pointSelectorModule.needsMoreRandomness(pointSelector);
        numberOfPoints = core.def(numberOfPoints, mapModule.DEFAULT_NUMBER_OF_POINTS);
        pub.reset();
        pub.points = pointSelector(numberOfPoints);
    };

    // Create a graph structure from the Voronoi edge list. The
    // methods in the Voronoi object are somewhat inconvenient for
    // my needs, so I transform that data into the data I actually
    // need: edges connected to the Delaunay triangles and the
    // Voronoi polygons, a reverse map from those four points back
    // to the edge, a map from these four points to the points
    // they connect to (both along the edge and crosswise).
    pub.go1BuildGraph = function () {
        var voronoi = voronoiModule.make(pub.points, null, rectangle(0, 0, pub.SIZE.width, pub.SIZE.height));
        pub.buildGraph(pub.points, voronoi);
        pub.improveCorners();
        voronoi.dispose();
        voronoi = null;
        pub.points = null;
    };

    // lakeThreshold: 0 to 1, fraction of water corners for water polygon, default = 0.3
    pub.go2AssignElevations = function (lakeThreshold) {
        lakeThreshold = core.def(lakeThreshold, mapModule.DEFAULT_LAKE_THRESHOLD);

        // Determine the elevations and water at Voronoi corners.
        pub.assignCornerElevations();

        // Determine polygon and corner type: ocean, coast, land.
        pub.assignOceanCoastAndLand(lakeThreshold);

        // Rescale elevations so that the highest is 1.0, and they're
        // distributed well. We want lower elevations to be more common
        // than higher elevations, in proportions approximately matching
        // concentric rings. That is, the lowest elevation is the
        // largest ring around the island, and therefore should more
        // land area than the highest elevation, which is the very
        // center of a perfectly circular island.
        pub.redistributeElevations(pub.landCorners(pub.corners));

        // Assign elevations to non-land corners
        _(pub.corners).each(function (q) {
            if (q.ocean || q.coast) {
                q.elevation = 0.0;
            }
        });

        // Polygon elevations are the average of their corners
        pub.assignPolygonElevations();
    };

    // riverChance: 0 = no rivers, > 0 = more rivers, default = map area / 4
    pub.go3AssignMoisture = function (riverChance) {
        riverChance = core.def(riverChance, null);

        // Determine downslope paths.
        pub.calculateDownslopes();

        // Determine watersheds: for every corner, where does it flow
        // out into the ocean? 
        pub.calculateWatersheds();

        // Create rivers.
        pub.createRivers(riverChance);

        // Determine moisture at corners, starting at rivers
        // and lakes, but not oceans. Then redistribute
        // moisture to cover the entire range evenly from 0.0
        // to 1.0. Then assign polygon moisture as the average
        // of the corner moisture.
        pub.assignCornerMoisture();
        pub.redistributeMoisture(pub.landCorners(pub.corners));
        pub.assignPolygonMoisture();
    };

    pub.go4DecorateMap = function () {
        pub.assignBiomes();
    };

    pub.reset = function () {
        // Break cycles so the garbage collector will release data.
        if (pub.points !== null) {
            pub.points.splice(0, pub.points.length);
        }
        if (pub.edges !== null) {
            _(pub.edges).each(function (edge) {
                edge.d0 = edge.d1 = null;
                edge.v0 = edge.v1 = null;
            });
            pub.edges.splice(0, pub.edges.length);
        }
        if (pub.centers !== null) {
            _(pub.centers).each(function (p) {
                p.neighbors.splice(0, p.neighbors.length);
                p.corners.splice(0, p.corners.length);
                p.borders.splice(0, p.borders.length);
            });
            pub.centers.splice(0, pub.centers.length);
        }
        if (pub.corners !== null) {
            _(pub.corners).each(function (q) {
                q.adjacent.splice(0, q.adjacent.length);
                q.touches.splice(0, q.touches.length);
                q.protrudes.splice(0, q.protrudes.length);
                q.downslope = null;
                q.watershed = null;
            });
            pub.corners.splice(0, pub.corners.length);
        }
        // Clear the previous graph data.
        if (pub.points === null) { pub.points = []; }
        if (pub.edges === null) { pub.edges = []; }
        if (pub.centers === null) { pub.centers = []; }
        if (pub.corners === null) { pub.corners = []; }
      
        // Disabled for JavaScript
        //System.gc();
    };

    // Although Lloyd relaxation improves the uniformity of polygon
    // sizes, it doesn't help with the edge lengths. Short edges can
    // be bad for some games, and lead to weird artifacts on
    // rivers. We can easily lengthen short edges by moving the
    // corners, but **we lose the Voronoi property**.  The corners are
    // moved to the average of the polygon centers around them. Short
    // edges become longer. Long edges tend to become shorter. The
    // polygons tend to be more uniform after this step.
    pub.improveCorners = function () {
        var newCorners = []; // Vector<Point>
        var point, i;

        // First we compute the average of the centers next to each corner.
        _(pub.corners).each(function (q) {
            if (q.border) {
                newCorners[q.index] = q.point;
            } else {
                point = {x: 0.0, y: 0.0};
                _(q.touches).each(function (r) {
                    point.x += r.point.x;
                    point.y += r.point.y;
                });
                point.x /= q.touches.length;
                point.y /= q.touches.length;
                newCorners[q.index] = point;
            }
        });

        // Move the corners to the new locations.
        for (i = 0; i < pub.corners.length; i++) {
            pub.corners[i].point = newCorners[i];
        }

        // The edge midpoints were computed for the old corners and need
        // to be recomputed.
        _(pub.edges).each(function (edge) {
            if (edge.v0 !== null && edge.v1 !== null) {
                edge.midpoint = pc.interpolate(edge.v0.point, edge.v1.point, 0.5);
            }
        });
    };

    // Create an array of corners that are on land only, for use by
    // algorithms that work only on land.  We return an array instead
    // of a vector because the redistribution algorithms want to sort
    // this array using Array.sortOn.
    pub.landCorners = function (corners) {
        var locations = [];
        _(corners).each(function (q) {
            if (!q.ocean && !q.coast) {
                locations.push(q);
            }
        });
        return locations;
    };

    // Build graph data structure in 'edges', 'centers', 'corners',
    // based on information in the Voronoi results: point.neighbors
    // will be a list of neighboring points of the same type (corner
    // or center); point.edges will be a list of edges that include
    // that point. Each edge connects to four points: the Voronoi edge
    // edge.{v0,v1} and its dual Delaunay triangle edge edge.{d0,d1}.
    // For boundary polygons, the Delaunay edge will have one null
    // point, and the Voronoi edge may be null.
    pub.buildGraph = function (points, voronoi) {
        var p;
        var libedges = voronoi.edges();
        var centerLookup = {}; // Dictionary<Center>

        // Build Center objects for each of the points, and a lookup map
        // to find those Center objects again as we build the graph
        _(points).each(function (point) {
            p = centerModule();
            p.index = pub.centers.length;
            p.point = point;
            p.neighbors = [];
            p.borders = [];
            p.corners = [];
            pub.centers.push(p);
            centerLookup[pc.hash(point)] = p;
        });

        // Workaround for Voronoi lib bug: we need to call region()
        // before Edges or neighboringSites are available
        _(pub.centers).each(function (p) {
            voronoi.region(p.point);
        });
      
        // The Voronoi library generates multiple Point objects for
        // corners, and we need to canonicalize to one Corner object.
        // To make lookup fast, we keep an array of Points, bucketed by
        // x value, and then we only have to look at other Points in
        // nearby buckets. When we fail to find one, we'll create a new
        // Corner object.
        var _cornerMap = [];
        function makeCorner(point) {
            var q;
            if (point === null) { return null; }
            var bucket;
            for (bucket = core.toInt(point.x) - 1; bucket < core.toInt(point.x) + 2; bucket++) {
                if (!core.isUndefinedOrNull(_cornerMap[bucket])) {
                    for (var z = 0; z < _cornerMap[bucket].length; z++) {
                        q = _cornerMap[bucket][z];
                        var dx = point.x - q.point.x;
                        var dy = point.y - q.point.y;
                        if (dx * dx + dy * dy < 1e-6) {
                            return q;
                        }
                    }
                }
            }
            bucket = core.toInt(point.x);
            if (core.isUndefinedOrNull(_cornerMap[bucket])) { _cornerMap[bucket] = []; }
            q = cornerModule();
            q.index = pub.corners.length;
            pub.corners.push(q);
            q.point = point;
            q.border = (point.x === 0 || point.x === pub.SIZE.width || point.y === 0 || point.y === pub.SIZE.height);
            q.touches = [];
            q.protrudes = [];
            q.adjacent = [];
            _cornerMap[bucket].push(q);
            return q;
        }

        // Helper functions for the following for loop; ideally these
        // would be inlined
        function addToCornerList(v, x) {
            if (x !== null && v.indexOf(x) < 0) { v.push(x); }
        }

        function addToCenterList(v, x) {
            if (x !== null && v.indexOf(x) < 0) { v.push(x); }
        }

        _(libedges).each(function (libedge) {
            var dedge = libedge.delaunayLine();
            var vedge = libedge.voronoiEdge();

            // Fill the graph data. Make an Edge object corresponding to
            // the edge from the voronoi library.
            var edge = edgeModule();
            edge.index = pub.edges.length;
            edge.river = 0;
            pub.edges.push(edge);
            edge.midpoint = (vedge.p0 !== null && vedge.p1 !== null) ? pc.interpolate(vedge.p0, vedge.p1, 0.5) : null;
          
            // Edges point to corners. Edges point to centers. 
            edge.v0 = makeCorner(vedge.p0);
            edge.v1 = makeCorner(vedge.p1);
            edge.d0 = centerLookup[pc.hash(dedge.p0)];
            edge.d1 = centerLookup[pc.hash(dedge.p1)];

            // Centers point to edges. Corners point to edges.
            if (edge.d0 !== null) { edge.d0.borders.push(edge); }
            if (edge.d1 !== null) { edge.d1.borders.push(edge); }
            if (edge.v0 !== null) { edge.v0.protrudes.push(edge); }
            if (edge.v1 !== null) { edge.v1.protrudes.push(edge); }
          
            // Centers point to centers.
            if (edge.d0 !== null && edge.d1 !== null) {
                addToCenterList(edge.d0.neighbors, edge.d1);
                addToCenterList(edge.d1.neighbors, edge.d0);
            }

            // Corners point to corners
            if (edge.v0 !== null && edge.v1 !== null) {
                addToCornerList(edge.v0.adjacent, edge.v1);
                addToCornerList(edge.v1.adjacent, edge.v0);
            }

            // Centers point to corners
            if (edge.d0 !== null) {
                addToCornerList(edge.d0.corners, edge.v0);
                addToCornerList(edge.d0.corners, edge.v1);
            }
            if (edge.d1 !== null) {
                addToCornerList(edge.d1.corners, edge.v0);
                addToCornerList(edge.d1.corners, edge.v1);
            }

            // Corners point to centers
            if (edge.v0 !== null) {
                addToCenterList(edge.v0.touches, edge.d0);
                addToCenterList(edge.v0.touches, edge.d1);
            }
            if (edge.v1 !== null) {
                addToCenterList(edge.v1.touches, edge.d0);
                addToCenterList(edge.v1.touches, edge.d1);
            }
        });
    };

    // Determine elevations and water at Voronoi corners. By
    // construction, we have no local minima. This is important for
    // the downslope vectors later, which are used in the river
    // construction algorithm. Also by construction, inlets/bays
    // push low elevation areas inland, which means many rivers end
    // up flowing out through them. Also by construction, lakes
    // often end up on river paths because they don't raise the
    // elevation as much as other terrain does.
    pub.assignCornerElevations = function () {
        var queue = []; // Array<Corner>
      
        _(pub.corners).each(function (q) {
            q.water = !pub.inside(q.point);
        });

        _(pub.corners).each(function (q) {
            // The edges of the map are elevation 0
            if (q.border) {
                q.elevation = 0.0;
                queue.push(q);
            } else {
                q.elevation = Number.POSITIVE_INFINITY;
            }
        });
        // Traverse the graph and assign elevations to each point. As we
        // move away from the map border, increase the elevations. This
        // guarantees that rivers always have a way down to the coast by
        // going downhill (no local minima).
        while (queue.length > 0) {
            var q = queue.shift();
            for (var adjacentIndex = 0; adjacentIndex < q.adjacent.length; adjacentIndex++) {
                var s = q.adjacent[adjacentIndex];

                // Every step up is epsilon over water or 1 over land. The
                // number doesn't matter because we'll rescale the
                // elevations later.
                var newElevation = 0.01 + q.elevation;
                if (!q.water && !s.water) {
                    newElevation += 1;
                    if (pub.needsMoreRandomness) {
                        // HACK: the map looks nice because of randomness of
                        // points, randomness of rivers, and randomness of
                        // edges. Without random point selection, I needed to
                        // inject some more randomness to make maps look
                        // nicer. I'm doing it here, with elevations, but I
                        // think there must be a better way. This hack is only
                        // used with square/hexagon grids.
                        newElevation += pub.mapRandom.nextDouble();
                    }

                }

                // If this point changed, we'll add it to the queue so
                // that we can process its neighbors too.
                if (newElevation < s.elevation) {
                    s.elevation = newElevation;
                    queue.push(s);
                }
            }
        }
    };

    // Change the overall distribution of elevations so that lower
    // elevations are more common than higher
    // elevations. Specifically, we want elevation X to have frequency
    // (1-X).  To do this we will sort the corners, then set each
    // corner to its desired elevation.
    pub.redistributeElevations = function (locations) {
        // SCALE_FACTOR increases the mountain area. At 1.0 the maximum
        // elevation barely shows up on the map, so we set it to 1.1.
        var SCALE_FACTOR = 1.1;
        var i, y, x;

        //JavaScript port
        //locations.sortOn('elevation', Array.NUMERIC);
        locations.sort(function (c1, c2) {
            if (c1.elevation > c2.elevation) { return 1; }
            if (c1.elevation < c2.elevation) { return -1; }
            if (c1.index > c2.index) { return 1; }
            if (c1.index < c2.index) { return -1; }
            return 0;
        });
      
        for (i = 0; i < locations.length; i++) {
            // Let y(x) be the total area that we want at elevation <= x.
            // We want the higher elevations to occur less than lower
            // ones, and set the area to be y(x) = 1 - (1-x)^2.
            y = i / (locations.length - 1);
            // Now we have to solve for x, given the known y.
            //  *  y = 1 - (1-x)^2
            //  *  y = 1 - (1 - 2x + x^2)
            //  *  y = 2x - x^2
            //  *  x^2 - 2x + y = 0
            // From this we can use the quadratic equation to get:
            x = Math.sqrt(SCALE_FACTOR) - Math.sqrt(SCALE_FACTOR * (1 - y));
            if (x > 1.0) { x = 1.0; }  // TODO: does this break downslopes?
            locations[i].elevation = x;
        }
    };

    // Change the overall distribution of moisture to be evenly distributed.
    pub.redistributeMoisture = function (locations) {
        var i;
      
        locations.sort(function (c1, c2) {
            if (c1.moisture > c2.moisture) { return 1; }
            if (c1.moisture < c2.moisture) { return -1; }
            if (c1.index > c2.index) { return 1; }
            if (c1.index < c2.index) { return -1; }
            return 0;
        });
      
        for (i = 0; i < locations.length; i++) {
            locations[i].moisture = i / (locations.length - 1);
        }
    };

    // Determine polygon and corner types: ocean, coast, land.
    pub.assignOceanCoastAndLand = function (lakeThreshold) {
        // Compute polygon attributes 'ocean' and 'water' based on the
        // corner attributes. Count the water corners per
        // polygon. Oceans are all polygons connected to the edge of the
        // map. In the first pass, mark the edges of the map as ocean;
        // in the second pass, mark any water-containing polygon
        // connected an ocean as ocean.
        var queue = []; // Array<Center>
        var p, numWater;
      
        _(pub.centers).each(function (p) {
            numWater = 0;
            _(p.corners).each(function (q) {
                if (q.border) {
                    p.border = true;
                    p.ocean = true;
                    q.water = true;
                    queue.push(p);
                }
                if (q.water) {
                    numWater += 1;
                }
            });
            p.water = (p.ocean || numWater >= p.corners.length * lakeThreshold);
        });
        while (queue.length > 0) {
            p = queue.shift();
            for (var neighbourIndex = 0; neighbourIndex < p.neighbors.length; neighbourIndex++) {
                var r = p.neighbors[neighbourIndex];
                if (r.water && !r.ocean) {
                    r.ocean = true;
                    queue.push(r);
                }
            }
        }
      
        // Set the polygon attribute 'coast' based on its neighbors. If
        // it has at least one ocean and at least one land neighbor,
        // then this is a coastal polygon.
        _(pub.centers).each(function (p) {
            var numOcean = 0;
            var numLand = 0;
            _(p.neighbors).each(function (r) {
                numOcean += convert.intFromBoolean(r.ocean);
                numLand += convert.intFromBoolean(!r.water);
            });
            p.coast = (numOcean > 0) && (numLand > 0);
        });


        // Set the corner attributes based on the computed polygon
        // attributes. If all polygons connected to this corner are
        // ocean, then it's ocean; if all are land, then it's land;
        // otherwise it's coast.
        _(pub.corners).each(function (q) {
            var numOcean = 0;
            var numLand = 0;
            _(q.touches).each(function (p) {
                numOcean += convert.intFromBoolean(p.ocean);
                numLand += convert.intFromBoolean(!p.water);
            });
            q.ocean = (numOcean === q.touches.length);
            q.coast = (numOcean > 0) && (numLand > 0);
            q.water = q.border || ((numLand !== q.touches.length) && !q.coast);
        });
    };

    // Polygon elevations are the average of the elevations of their corners.
    pub.assignPolygonElevations = function () {
        var sumElevation;
        _(pub.centers).each(function (p) {
            sumElevation = 0.0;
            _(p.corners).each(function (q) {
                sumElevation += q.elevation;
            });
            p.elevation = sumElevation / p.corners.length;
        });
    };

    // Calculate downslope pointers.  At every point, we point to the
    // point downstream from it, or to itself.  This is used for
    // generating rivers and watersheds.
    pub.calculateDownslopes = function () {
        var r;
      
        _(pub.corners).each(function (q) {
            r = q;
            _(q.adjacent).each(function (s) {
                if (s.elevation <= r.elevation) {
                    r = s;
                }
            });
            q.downslope = r;
        });
    };

    // Calculate the watershed of every land point. The watershed is
    // the last downstream land point in the downslope graph. TODO:
    // watersheds are currently calculated on corners, but it'd be
    // more useful to compute them on polygon centers so that every
    // polygon can be marked as being in one watershed.
    pub.calculateWatersheds = function () {
        var r, i, changed;
      
        // Initially the watershed pointer points downslope one step.      
        _(pub.corners).each(function (q) {
            q.watershed = q;
            if (!q.ocean && !q.coast) {
                q.watershed = q.downslope;
            }
        });
        // Follow the downslope pointers to the coast. Limit to 100
        // iterations although most of the time with numPoints==2000 it
        // only takes 20 iterations because most points are not far from
        // a coast.  TODO: can run faster by looking at
        // p.watershed.watershed instead of p.downslope.watershed.
        var cornerIndex, q;
        for (i = 0; i < 100; i++) {
            changed = false;
            for (cornerIndex = 0; cornerIndex < pub.corners.length; cornerIndex++) {
                q = pub.corners[cornerIndex];
                if (!q.ocean && !q.coast && !q.watershed.coast) {
                    r = q.downslope.watershed;
                    if (!r.ocean) { q.watershed = r; }
                    changed = true;
                }
            }
            if (!changed) { break; }
        }
        // How big is each watershed?
        for (cornerIndex = 0; cornerIndex < pub.corners.length; cornerIndex++) {
            q = pub.corners[cornerIndex];
            r = q.watershed;
            r.watershedSize = 1 + (r.watershedSize || 0);
        }
    };

    // Create rivers along edges. Pick a random corner point,
    // then move downslope. Mark the edges and corners as rivers.
    // riverChance: Higher = more rivers.
    pub.createRivers = function (riverChance) {
        riverChance = core.coalesce(riverChance, core.toInt((pub.SIZE.width + pub.SIZE.height) / 4));

        var i, q, edge;
      
        for (i = 0; i < riverChance; i++) {
            q = pub.corners[pub.mapRandom.nextIntRange(0, pub.corners.length - 1)];
            if (q.ocean || q.elevation < 0.3 || q.elevation > 0.9) { continue; }
            // Bias rivers to go west: if (q.downslope.x > q.x) continue;
            while (!q.coast) {
                if (q === q.downslope) {
                    break;
                }
                edge = pub.lookupEdgeFromCorner(q, q.downslope);
                edge.river = edge.river + 1;
                q.river = (q.river || 0) + 1;
                q.downslope.river = (q.downslope.river || 0) + 1;  // TODO: fix double count
                q = q.downslope;
            }
        }
    };

    // Calculate moisture. Freshwater sources spread moisture: rivers
    // and lakes (not oceans). Saltwater sources have moisture but do
    // not spread it (we set it at the end, after propagation).
    pub.assignCornerMoisture = function () {
        var q, newMoisture;
        var queue = []; // Array<Corner>
        // Fresh water
        _(pub.corners).each(function (q) {
            if ((q.water || q.river > 0) && !q.ocean) {
                q.moisture = q.river > 0 ? Math.min(3.0, (0.2 * q.river)) : 1.0;
                queue.push(q);
            } else {
                q.moisture = 0.0;
            }
        });
        while (queue.length > 0) {
            q = queue.shift();

            for (var adjacentIndex = 0; adjacentIndex < q.adjacent.length; adjacentIndex++) {
                var r = q.adjacent[adjacentIndex];
                newMoisture = q.moisture * 0.9;
                if (newMoisture > r.moisture) {
                    r.moisture = newMoisture;
                    queue.push(r);
                }
            }
        }
        // Salt water
        _(pub.corners).each(function (q) {
            if (q.ocean || q.coast) {
                q.moisture = 1.0;
            }
        });
    };

    // Polygon moisture is the average of the moisture at corners
    pub.assignPolygonMoisture = function () {
        var sumMoisture;
        _(pub.centers).each(function (p) {
            sumMoisture = 0.0;
            _(p.corners).each(function (q) {
                if (q.moisture > 1.0) { q.moisture = 1.0; }
                sumMoisture += q.moisture;
            });
            p.moisture = sumMoisture / p.corners.length;
        });
    };

    pub.assignBiomes = function () {
        _(pub.centers).each(function (p) {
            p.biome = mapModule.getBiome(p);
        });
    };

    // Look up a Voronoi Edge object given two adjacent Voronoi
    // polygons, or two adjacent Voronoi corners
    pub.lookupEdgeFromCenter = function (p, r) {
        for (var i = 0; i < p.borders.length; i++) {
            var edge = p.borders[i];
            if (edge.d0 === r || edge.d1 === r) { return edge; }
        }
        return null;
    };

    pub.lookupEdgeFromCorner = function (q, s) {
        for (var i = 0; i < q.protrudes.length; i++) {
            var edge = q.protrudes[i];
            if (edge.v0 === s || edge.v1 === s) { return edge; }
        }
        return null;
    };

    // Determine whether a given point should be on the island or in the water.
    pub.inside = function (p) {
        return pub.islandShape({ x: 2 * (p.x / pub.SIZE.width - 0.5), y: 2 * (p.y / pub.SIZE.height - 0.5) });
    };

    pub.reset();

    return pub;
};

mapModule.DEFAULT_LAKE_THRESHOLD = 0.3;
mapModule.DEFAULT_LLOYD_ITERATIONS = 2;
mapModule.DEFAULT_NUMBER_OF_POINTS = 1000;

// Assign a biome type to each polygon. If it has
// ocean/coast/water, then that's the biome; otherwise it depends
// on low/high elevation and low/medium/high moisture. This is
// roughly based on the Whittaker diagram but adapted to fit the
// needs of the island map generator.
mapModule.getBiome = function (p) {
    if (p.ocean) {
        return 'OCEAN';
    } else if (p.water) {
        if (p.elevation < 0.1) { return 'MARSH'; }
        if (p.elevation > 0.8) { return 'ICE'; }
        return 'LAKE';
    } else if (p.coast) {
        return 'BEACH';
    } else if (p.elevation > 0.8) {
        if (p.moisture > 0.50) { return 'SNOW'; }
        else if (p.moisture > 0.33) { return 'TUNDRA'; }
        else if (p.moisture > 0.16) { return 'BARE'; }
        else { return 'SCORCHED'; }
    } else if (p.elevation > 0.6) {
        if (p.moisture > 0.66) { return 'TAIGA'; }
        else if (p.moisture > 0.33) { return 'SHRUBLAND'; }
        else { return 'TEMPERATE_DESERT'; }
    } else if (p.elevation > 0.3) {
        if (p.moisture > 0.83) { return 'TEMPERATE_RAIN_FOREST'; }
        else if (p.moisture > 0.50) { return 'TEMPERATE_DECIDUOUS_FOREST'; }
        else if (p.moisture > 0.16) { return 'GRASSLAND'; }
        else { return 'TEMPERATE_DESERT'; }
    } else {
        if (p.moisture > 0.66) { return 'TROPICAL_RAIN_FOREST'; }
        else if (p.moisture > 0.33) { return 'TROPICAL_SEASONAL_FOREST'; }
        else if (p.moisture > 0.16) { return 'GRASSLAND'; }
        else { return 'SUBTROPICAL_DESERT'; }
    }
};

module.exports = mapModule;
},{"../as3/conversion-core":2,"../as3/point-core":4,"../as3/rectangle":5,"../janicek/core":9,"../nodename/delaunay/voronoi":28,"../polygonal/pm-prng":33,"./graph/center":35,"./graph/corner":36,"./graph/edge":37,"./point-selector":43,"lodash":1}],42:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var convert = require('../as3/conversion-core');
var core = require('../janicek/core');
var pc = require('../as3/point-core');
var prng = require('../janicek/pseudo-random-number-generators');

module.exports = function () {
    var pub = {};

    pub.path0 = []; // Array<Vector<Point>> // edge index -> Vector.<Point>
    pub.path1 = []; // Array<Vector<Point>> // edge index -> Vector.<Point>

    /**
     * Build noisy line paths for each of the Voronoi edges. There are
     * two noisy line paths for each edge, each covering half the
     * distance: path0 is from v0 to the midpoint and path1 is from v1
     * to the midpoint. When drawing the polygons, one or the other
     * must be drawn in reverse order.
     * @param noisyLineTradeoff low: jagged vedge; high: jagged dedge (default = 0.5)
     */
    pub.buildNoisyEdges = function (map, lava, seed, noisyLineTradeoff) {
        noisyLineTradeoff = core.def(noisyLineTradeoff, 0.5);
        var gen = prng.randomGenerator(seed, prng.nextParkMiller);
        _(map.centers).each(function (p) {
            _(p.borders).each(function (edge) {
                if (!core.isUndefinedOrNull(edge.d0) && !core.isUndefinedOrNull(edge.d1) && !core.isUndefinedOrNull(edge.v0) && !core.isUndefinedOrNull(edge.v1) && core.isUndefinedOrNull(pub.path0[edge.index])) {
                    var f = noisyLineTradeoff;
                    var t = pc.interpolate(edge.v0.point, edge.d0.point, f);
                    var q = pc.interpolate(edge.v0.point, edge.d1.point, f);
                    var r = pc.interpolate(edge.v1.point, edge.d0.point, f);
                    var s = pc.interpolate(edge.v1.point, edge.d1.point, f);

                    var minLength = 10;
                    if (edge.d0.biome !== edge.d1.biome) { minLength = 3; }
                    if (edge.d0.ocean && edge.d1.ocean) { minLength = 100; }
                    if (edge.d0.coast || edge.d1.coast)  { minLength = 1; }
                    if (convert.booleanFromInt(edge.river) || !core.isUndefinedOrNull(lava.lava[edge.index])) { minLength = 1; }
                    pub.path0[edge.index] = module.exports.buildNoisyLineSegments(gen(), edge.v0.point, t, edge.midpoint, q, minLength);
                    pub.path1[edge.index] = module.exports.buildNoisyLineSegments(gen(), edge.v1.point, s, edge.midpoint, r, minLength);
                }
            });
        });
    };

    return pub;
};

// Helper function: build a single noisy line in a quadrilateral A-B-C-D,
// and store the output points in a Vector.
module.exports.buildNoisyLineSegments = function (seed, A, B, C, D, minLength) {
    var gen = prng.randomGenerator(seed, prng.nextParkMiller);
    var points = []; // Vector<Point>
    
    // var limit = 10;
  
    function subdivide(A, B, C, D) {
        if (pc.distanceFromOrigin(pc.subtract(A, C)) < minLength || pc.distanceFromOrigin(pc.subtract(B, D)) < minLength) {
            return;
        }

        // Subdivide the quadrilateral
        var p = prng.toFloatRange(gen(), 0.2, 0.8); // vertical (along A-D and B-C)
        var q = prng.toFloatRange(gen(), 0.2, 0.8); // horizontal (along A-B and D-C)

        // Midpoints
        var E = pc.interpolate(A, D, p);
        
        var F = pc.interpolate(B, C, p);
        var G = pc.interpolate(A, B, q);
        var I = pc.interpolate(D, C, q);
        
        // Central point
        var H = pc.interpolate(E, F, q);
        
        // Divide the quad into subquads, but meet at H
        var s = 1.0 - prng.toFloatRange(gen(), -0.4, 0.4); //random.nextDoubleRange(-0.4, 0.4);
        var t = 1.0 - prng.toFloatRange(gen(), -0.4, 0.4); //random.nextDoubleRange(-0.4, 0.4);
        
        //if(limit-- > 0) {trace([p, q, s, t]);}
        
        subdivide(A, pc.interpolate(G, B, s), H, pc.interpolate(E, D, t));
        points.push(H);
        subdivide(H, pc.interpolate(F, C, s), C, pc.interpolate(I, D, t));
    }

    points.push(A);
    subdivide(A, B, C, D);
    points.push(C);
    return points;
};
},{"../as3/conversion-core":2,"../as3/point-core":4,"../janicek/core":9,"../janicek/pseudo-random-number-generators":13,"lodash":1}],43:[function(require,module,exports){
// Factory class to choose points for the graph

// Point selection is random for the original article, with Lloyd
// Relaxation, but there are other ways of choosing points. Grids in
// particular can be much simpler to start with, because you don't need
// Voronoi at all. HOWEVER for ease of implementation, I continue to use
// Voronoi here, to reuse the graph building code. If you're using a grid,
// generate the graph directly.

/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var prng = require('../polygonal/pm-prng');
var rectangle = require('../as3/rectangle');
var voronoiModule = require('../nodename/delaunay/voronoi');

var api = {

	// The square and hex grid point selection remove randomness from
	// where the points are; we need to inject more randomness elsewhere
	// to make the maps look better. I do this in the corner
	// elevations. However I think more experimentation is needed.
	needsMoreRandomness: function (fn) {
		return fn === api.generateSquare || fn === api.generateHexagon;	
	},

	// Generate points at random locations
	generateRandom: function (width, height, seed) {
		return function (numPoints) {
		  	var mapRandom = prng();
		  	mapRandom.seed = seed;
		  	var points = []; // Vector.<Point>

		  	for (var i = 0; i < numPoints; i++) {
		    	points.push({
		    		x: mapRandom.nextDoubleRange(10, width - 10),
		        	y: mapRandom.nextDoubleRange(10, height - 10)
		    	});
		  	}

			return points;
		};
	},

  	// Improve the random set of points with Lloyd Relaxation
	generateRelaxed: function (width, height, seed, numLloydRelaxations) {
	    numLloydRelaxations = numLloydRelaxations || 2;
	    return function (numPoints) {
			// We'd really like to generate "blue noise". Algorithms:
			// 1. Poisson dart throwing: check each new point against all
			//     existing points, and reject it if it's too close.
			// 2. Start with a hexagonal grid and randomly perturb points.
			// 3. Lloyd Relaxation: move each point to the centroid of the
			//     generated Voronoi polygon, then generate Voronoi again.
			// 4. Use force-based layout algorithms to push points away.
			// 5. More at http://www.cs.virginia.edu/~gfx/pubs/antimony/
			// Option 3 is implemented here. If it's run for too many iterations,
			// it will turn into a grid, but convergence is very slow, and we only
			// run it a few times.
			var points = api.generateRandom(width, height, seed)(numPoints);
	      	for (var i = 0; i < numLloydRelaxations; i++) {
	        	var voronoi = voronoiModule.make(points, null, rectangle(0, 0, width, height));
	        	for (var pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
	        		var p = points[pointsIndex];
		            var region = voronoi.region(p);
		            p.x = 0.0;
		            p.y = 0.0;
		            for (var regionIndex = 0; regionIndex < region.length; regionIndex++) {
		            	var q = region[regionIndex];
		                p.x += q.x;
		                p.y += q.y;
		            }
		            p.x /= region.length;
		            p.y /= region.length;
		            region.splice(0, region.length);
	          	}
	        	voronoi.dispose();
	      	}
	      	return points;
	    };
  	},

  	// Generate points on a square grid
	generateSquare: function (width, height) {
		return function (numPoints) {
		  	var points = []; // Vector.<Point>
		  	var n = Math.sqrt(numPoints);
		  	for (var x = 0; x < n; x++) {
		    	for (var y = 0; y < n; y++) {
		      		points.push({
		      			x: (0.5 + x) / n * width,
		      			y: (0.5 + y) / n * height
		      		});
		    	}
		  	}
		  	return points;
		};
	},

 	// Generate points on a hexagon grid
  	generateHexagon: function (width, height) {
		return function (numPoints) {
			var points = []; // Vector.<Point>
			var n = Math.sqrt(numPoints);
			for (var x = 0; x < n; x++) {
				for (var y = 0; y < n; y++) {
					points.push({
						x: (0.5 + x) / n * width,
						y: (0.25 + 0.5 * x % 2 + y) / n * height
					});
				}
			}
			return points;
		};
  	}

};

module.exports = api;
},{"../as3/rectangle":5,"../nodename/delaunay/voronoi":28,"../polygonal/pm-prng":33}],44:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var core = require('../janicek/core');

module.exports = function () {
    var pub = {};

    // The road array marks the edges that are roads.  The mark is 1,
    // 2, or 3, corresponding to the three contour levels. Note that
    // these are sparse arrays, only filled in where there are roads.
    pub.road = []; // Array<Int> // edge index -> int contour level
    pub.roadConnections = []; // Array<Array<Edge>>  // center index -> array of Edges with roads

    // We want to mark different elevation zones so that we can draw
    // island-circling roads that divide the areas.
    pub.createRoads = function (map, elevationThresholds) {
        // Oceans and coastal polygons are the lowest contour zone
        // (1). Anything connected to contour level K, if it's below
        // elevation threshold K, or if it's water, gets contour level
        // K.  (2) Anything not assigned a contour level, and connected
        // to contour level K, gets contour level K+1.
        var queue = []; // Array<Center>
        var p, newLevel;
        //var elevationThresholds = [0, 0.05, 0.37, 0.64];
        var cornerContour = []; // Array<Int> // corner index -> int contour level
        var centerContour = []; //:Array<Int> // center index -> int contour level
    
        _(map.centers).each(function (p) {
            if (p.coast || p.ocean) {
                centerContour[p.index] = 1;
                queue.push(p);
            }
        });
      
        while (queue.length > 0) {
            p = queue.shift();
            for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
                var r = p.neighbors[neighborIndex];
                newLevel = core.coalesce(centerContour[p.index], 0);
                while (r.elevation > elevationThresholds[newLevel] && !r.water) {
                    // NOTE: extend the contour line past bodies of
                    // water so that roads don't terminate inside lakes.
                    newLevel += 1;
                }
                if (newLevel < core.coalesce(centerContour[r.index], 999)) {
                    centerContour[r.index] = newLevel;
                    queue.push(r);
                }
            }
        }

        // A corner's contour level is the MIN of its polygons
        _(map.centers).each(function (p) {
            _(p.corners).each(function (q) {
                cornerContour[q.index] = core.toInt(Math.min(core.coalesce(cornerContour[q.index], 999), core.coalesce(centerContour[p.index], 999)));
            });
        });

        // Roads go between polygons that have different contour levels
        _(map.centers).each(function (p) {
            _(p.borders).each(function (edge) {
                if (!_.isNull(edge.v0) && !_.isNull(edge.v1) && cornerContour[edge.v0.index] !== cornerContour[edge.v1.index]) {
                    pub.road[edge.index] = core.toInt(Math.min(cornerContour[edge.v0.index], cornerContour[edge.v1.index]));
                    if (core.isUndefinedOrNull(pub.roadConnections[p.index])) {
                        pub.roadConnections[p.index] = [];
                    }
                    pub.roadConnections[p.index].push(edge);
                }
            });
        });
    };

    return pub;
};
},{"../janicek/core":9,"lodash":1}],45:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

exports.displayColors = {
    // Features
    OCEAN: 0x44447a,
    COAST: 0x33335a,
    LAKESHORE: 0x225588,
    LAKE: 0x336699,
    RIVER: 0x225588,
    MARSH: 0x2f6666,
    ICE: 0x99ffff,
    BEACH: 0xa09077,
    ROAD1: 0x442211,
    ROAD2: 0x553322,
    ROAD3: 0x664433,
    BRIDGE: 0x686860,
    LAVA: 0xcc3333,

    // Terrain
    SNOW: 0xffffff,
    TUNDRA: 0xbbbbaa,
    BARE: 0x888888,
    SCORCHED: 0x555555,
    TAIGA: 0x99aa77,
    SHRUBLAND: 0x889977,
    TEMPERATE_DESERT: 0xc9d29b,
    TEMPERATE_RAIN_FOREST: 0x448855,
    TEMPERATE_DECIDUOUS_FOREST: 0x679459,
    GRASSLAND: 0x88aa55,
    SUBTROPICAL_DESERT: 0xd2b98b,
    TROPICAL_RAIN_FOREST: 0x337755,
    TROPICAL_SEASONAL_FOREST: 0x559944
};

exports.elevationGradientColors = {
    OCEAN: 0x008800,
    GRADIENT_LOW: 0x008800,
    GRADIENT_HIGH: 0xffff00
};
},{}],46:[function(require,module,exports){
/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');

module.exports = function () {
    var pub = {};
    pub.lowestCorner = [];   // Array<Int> // polygon index -> corner index
    pub.watersheds = [];     //Array<Int>;  // polygon index -> corner index

    // We want to mark each polygon with the corner where water would
    // exit the island.
    pub.createWatersheds = function (map) {
        var s;

        // Find the lowest corner of the polygon, and set that as the
        // exit point for rain falling on this polygon
        _(map.centers).each(function (p) {
            s = null;
            _(p.corners).each(function (q) {
                if (s === null || q.elevation < s.elevation) {
                    s = q;
                }
            });
            pub.lowestCorner[p.index] = (s === null) ? -1 : s.index;
            pub.watersheds[p.index] = (s === null) ? -1 : (s.watershed === null) ? -1 : s.watershed.index;
        });
    };

    return pub;
};
},{"lodash":1}]},{},[7]);
