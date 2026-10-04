var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react.production.js
var require_react_production = __commonJS({
  "node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react.production.js"(exports2) {
    "use strict";
    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
    var REACT_PORTAL_TYPE = Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
    var REACT_CONTEXT_TYPE = Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
    var REACT_MEMO_TYPE = Symbol.for("react.memo");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
    var REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    function getIteratorFn(maybeIterable) {
      if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
      maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
      return "function" === typeof maybeIterable ? maybeIterable : null;
    }
    var ReactNoopUpdateQueue = {
      isMounted: function() {
        return false;
      },
      enqueueForceUpdate: function() {
      },
      enqueueReplaceState: function() {
      },
      enqueueSetState: function() {
      }
    };
    var assign = Object.assign;
    var emptyObject = {};
    function Component(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    Component.prototype.isReactComponent = {};
    Component.prototype.setState = function(partialState, callback) {
      if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables."
        );
      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };
    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };
    function ComponentDummy() {
    }
    ComponentDummy.prototype = Component.prototype;
    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }
    var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
    pureComponentPrototype.constructor = PureComponent;
    assign(pureComponentPrototype, Component.prototype);
    pureComponentPrototype.isPureReactComponent = true;
    var isArrayImpl = Array.isArray;
    function noop() {
    }
    var ReactSharedInternals = { H: null, A: null, T: null, S: null };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function ReactElement(type, key2, props) {
      var refProp = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key: key2,
        ref: void 0 !== refProp ? refProp : null,
        props
      };
    }
    function cloneAndReplaceKey(oldElement, newKey) {
      return ReactElement(oldElement.type, newKey, oldElement.props);
    }
    function isValidElement(object) {
      return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function escape(key2) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key2.replace(/[=:]/g, function(match) {
        return escaperLookup[match];
      });
    }
    var userProvidedKeyEscapeRegex = /\/+/g;
    function getElementKey(element, index) {
      return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
    }
    function resolveThenable(thenable) {
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
        default:
          switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
            function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            },
            function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          )), thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
          }
      }
      throw thenable;
    }
    function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
      var type = typeof children;
      if ("undefined" === type || "boolean" === type) children = null;
      var invokeCallback = false;
      if (null === children) invokeCallback = true;
      else
        switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(
                  invokeCallback(children._payload),
                  array,
                  escapedPrefix,
                  nameSoFar,
                  callback
                );
            }
        }
      if (invokeCallback)
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c2) {
          return c2;
        })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
          callback,
          escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
            userProvidedKeyEscapeRegex,
            "$&/"
          ) + "/") + invokeCallback
        )), array.push(callback)), 1;
      invokeCallback = 0;
      var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
      if (isArrayImpl(children))
        for (var i = 0; i < children.length; i++)
          nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if (i = getIteratorFn(children), "function" === typeof i)
        for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
          nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
            nameSoFar,
            array,
            escapedPrefix,
            type,
            callback
          );
      else if ("object" === type) {
        if ("function" === typeof children.then)
          return mapIntoArray(
            resolveThenable(children),
            array,
            escapedPrefix,
            nameSoFar,
            callback
          );
        array = String(children);
        throw Error(
          "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
        );
      }
      return invokeCallback;
    }
    function mapChildren(children, func, context) {
      if (null == children) return children;
      var result = [], count = 0;
      mapIntoArray(children, result, "", "", function(child) {
        return func.call(context, child, count++);
      });
      return result;
    }
    function lazyInitializer(payload) {
      if (-1 === payload._status) {
        var ctor = payload._result, thenable = ctor();
        thenable.then(
          function(moduleObject) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 1, payload._result = moduleObject, void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
          },
          function(error) {
            if (0 === payload._status || -1 === payload._status)
              payload._status = 2, payload._result = error, void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
          }
        );
        -1 === payload._status && (payload._status = 0, payload._result = thenable);
      }
      if (1 === payload._status) return payload._result.default;
      throw payload._result;
    }
    var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
      if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
        var event = new window.ErrorEvent("error", {
          bubbles: true,
          cancelable: true,
          message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
          error
        });
        if (!window.dispatchEvent(event)) return;
      } else if ("object" === typeof process && "function" === typeof process.emit) {
        process.emit("uncaughtException", error);
        return;
      }
      console.error(error);
    };
    function startTransition(scope) {
      var prevTransition = ReactSharedInternals.T, currentTransition = {};
      currentTransition.types = null !== prevTransition ? prevTransition.types : null;
      ReactSharedInternals.T = currentTransition;
      try {
        var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
        null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
      } catch (error) {
        reportGlobalError(error);
      } finally {
        null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
      }
    }
    function addTransitionType(type) {
      var transition = ReactSharedInternals.T;
      if (null !== transition) {
        var transitionTypes = transition.types;
        null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
      } else startTransition(addTransitionType.bind(null, type));
    }
    var Children = {
      map: mapChildren,
      forEach: function(children, forEachFunc, forEachContext) {
        mapChildren(
          children,
          function() {
            forEachFunc.apply(this, arguments);
          },
          forEachContext
        );
      },
      count: function(children) {
        var n2 = 0;
        mapChildren(children, function() {
          n2++;
        });
        return n2;
      },
      toArray: function(children) {
        return mapChildren(children, function(child) {
          return child;
        }) || [];
      },
      only: function(children) {
        if (!isValidElement(children))
          throw Error(
            "React.Children.only expected to receive a single React element child."
          );
        return children;
      }
    };
    exports2.Activity = REACT_ACTIVITY_TYPE;
    exports2.Children = Children;
    exports2.Component = Component;
    exports2.Fragment = REACT_FRAGMENT_TYPE;
    exports2.Profiler = REACT_PROFILER_TYPE;
    exports2.PureComponent = PureComponent;
    exports2.StrictMode = REACT_STRICT_MODE_TYPE;
    exports2.Suspense = REACT_SUSPENSE_TYPE;
    exports2.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
    exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
    exports2.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function(size) {
        return ReactSharedInternals.H.useMemoCache(size);
      }
    };
    exports2.addTransitionType = addTransitionType;
    exports2.cache = function(fn) {
      return function() {
        return fn.apply(null, arguments);
      };
    };
    exports2.cacheSignal = function() {
      return null;
    };
    exports2.cloneElement = function(element, config, children) {
      if (null === element || void 0 === element)
        throw Error(
          "The argument must be a React element, but you passed " + element + "."
        );
      var props = assign({}, element.props), key2 = element.key;
      if (null != config)
        for (propName in void 0 !== config.key && (key2 = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key2, props);
    };
    exports2.createContext = function(defaultValue) {
      defaultValue = {
        $$typeof: REACT_CONTEXT_TYPE,
        _currentValue: defaultValue,
        _currentValue2: defaultValue,
        _threadCount: 0,
        Provider: null,
        Consumer: null
      };
      defaultValue.Provider = defaultValue;
      defaultValue.Consumer = {
        $$typeof: REACT_CONSUMER_TYPE,
        _context: defaultValue
      };
      return defaultValue;
    };
    exports2.createElement = function(type, config, children) {
      var propName, props = {}, key2 = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key2 = "" + config.key), config)
          hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
      var childrenLength = arguments.length - 2;
      if (1 === childrenLength) props.children = children;
      else if (1 < childrenLength) {
        for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      if (type && type.defaultProps)
        for (propName in childrenLength = type.defaultProps, childrenLength)
          void 0 === props[propName] && (props[propName] = childrenLength[propName]);
      return ReactElement(type, key2, props);
    };
    exports2.createRef = function() {
      return { current: null };
    };
    exports2.forwardRef = function(render) {
      return { $$typeof: REACT_FORWARD_REF_TYPE, render };
    };
    exports2.isValidElement = isValidElement;
    exports2.lazy = function(ctor) {
      return {
        $$typeof: REACT_LAZY_TYPE,
        _payload: { _status: -1, _result: ctor },
        _init: lazyInitializer
      };
    };
    exports2.memo = function(type, compare) {
      return {
        $$typeof: REACT_MEMO_TYPE,
        type,
        compare: void 0 === compare ? null : compare
      };
    };
    exports2.startTransition = startTransition;
    exports2.unstable_useCacheRefresh = function() {
      return ReactSharedInternals.H.useCacheRefresh();
    };
    exports2.use = function(usable) {
      return ReactSharedInternals.H.use(usable);
    };
    exports2.useActionState = function(action, initialState, permalink) {
      return ReactSharedInternals.H.useActionState(action, initialState, permalink);
    };
    exports2.useCallback = function(callback, deps) {
      return ReactSharedInternals.H.useCallback(callback, deps);
    };
    exports2.useContext = function(Context) {
      return ReactSharedInternals.H.useContext(Context);
    };
    exports2.useDebugValue = function() {
    };
    exports2.useDeferredValue = function(value, initialValue) {
      return ReactSharedInternals.H.useDeferredValue(value, initialValue);
    };
    exports2.useEffect = function(create, deps) {
      return ReactSharedInternals.H.useEffect(create, deps);
    };
    exports2.useEffectEvent = function(callback) {
      return ReactSharedInternals.H.useEffectEvent(callback);
    };
    exports2.useId = function() {
      return ReactSharedInternals.H.useId();
    };
    exports2.useImperativeHandle = function(ref, create, deps) {
      return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
    };
    exports2.useInsertionEffect = function(create, deps) {
      return ReactSharedInternals.H.useInsertionEffect(create, deps);
    };
    exports2.useLayoutEffect = function(create, deps) {
      return ReactSharedInternals.H.useLayoutEffect(create, deps);
    };
    exports2.useMemo = function(create, deps) {
      return ReactSharedInternals.H.useMemo(create, deps);
    };
    exports2.useOptimistic = function(passthrough, reducer) {
      return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
    };
    exports2.useReducer = function(reducer, initialArg, init) {
      return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
    };
    exports2.useRef = function(initialValue) {
      return ReactSharedInternals.H.useRef(initialValue);
    };
    exports2.useState = function(initialState) {
      return ReactSharedInternals.H.useState(initialState);
    };
    exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
      return ReactSharedInternals.H.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
      );
    };
    exports2.useTransition = function() {
      return ReactSharedInternals.H.useTransition();
    };
    exports2.version = "19.3.0";
  }
});

// node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react.development.js"(exports2, module2) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
          case REACT_VIEW_TRANSITION_TYPE:
            return "ViewTransition";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key2, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key: key2,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key2) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key2.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c2) {
            return c2;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
            resolveDebugValue = resolve;
            rejectDebugValue = reject;
          }));
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                if (null != _ioInfo) {
                  _ioInfo.end = performance.now();
                  var debugValue = null == moduleObject ? void 0 : moduleObject.default;
                  resolveDebugValue(debugValue);
                  _ioInfo.value.status = "fulfilled";
                  _ioInfo.value.value = debugValue;
                }
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop, noop), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function startTransition(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = null !== prevTransition ? prevTransition.types : null;
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function addTransitionType(type) {
        var transition = ReactSharedInternals.T;
        if (null !== transition) {
          var transitionTypes = transition.types;
          null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
        } else
          0 === ReactSharedInternals.asyncTransitions && console.error(
            "addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."
          ), startTransition(addTransitionType.bind(null, type));
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module2 && module2[requireString]).call(
              module2,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n2 = 0;
          mapChildren(children, function() {
            n2++;
          });
          return n2;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports2.Activity = REACT_ACTIVITY_TYPE;
      exports2.Children = fnName;
      exports2.Component = Component;
      exports2.Fragment = REACT_FRAGMENT_TYPE;
      exports2.Profiler = REACT_PROFILER_TYPE;
      exports2.PureComponent = PureComponent;
      exports2.StrictMode = REACT_STRICT_MODE_TYPE;
      exports2.Suspense = REACT_SUSPENSE_TYPE;
      exports2.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
      exports2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports2.__COMPILER_RUNTIME = deprecatedAPIs;
      exports2.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports2.addTransitionType = addTransitionType;
      exports2.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports2.cacheSignal = function() {
        return null;
      };
      exports2.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports2.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key2 = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key2 = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key2,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key2 = 2; key2 < arguments.length; key2++)
          validateChildKeys(arguments[key2]);
        return props;
      };
      exports2.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports2.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        var propName;
        i = {};
        var key2 = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key2 = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key2 && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
        return ReactElement(
          type,
          key2,
          i,
          getOwner(),
          childrenLength,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports2.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports2.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports2.isValidElement = isValidElement;
      exports2.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports2.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports2.startTransition = startTransition;
      exports2.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports2.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports2.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports2.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports2.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports2.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports2.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports2.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports2.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports2.useId = function() {
        return resolveDispatcher().useId();
      };
      exports2.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports2.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports2.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports2.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports2.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports2.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports2.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports2.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports2.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports2.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports2.version = "19.3.0";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/.pnpm/react@19.3.0/node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/.pnpm/react@19.3.0/node_modules/react/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_production();
    } else {
      module2.exports = require_react_development();
    }
  }
});

// src/simulation/seededRandom.ts
var hashSeed = (value) => {
  const input = String(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
var createSeededRandom = (seed) => {
  let state = hashSeed(seed);
  return () => {
    state += 1831565813;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};
var randomInt = (rng, minInclusive, maxInclusive) => {
  if (maxInclusive <= minInclusive) return minInclusive;
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
};

// src/data/subGenreData.ts
var subGenres = [
  // Pop Subgenres
  { id: "synthPop", name: "Synth Pop", parentGenre: "pop", description: "Characterized by prominent synthesizer use, often with a retro 80s feel.", typicalElements: ["Synthesizers", "Drum Machines", "Catchy Hooks", "Reverb Vocals"] },
  { id: "dancePop", name: "Dance Pop", parentGenre: "pop", description: "Upbeat pop music designed for dancing, common in clubs.", typicalElements: ["Four-on-the-floor Beat", "Strong Basslines", "Repetitive Choruses"] },
  { id: "indiePop", name: "Indie Pop", parentGenre: "pop", description: "Pop music produced independently, often with a lo-fi or quirky aesthetic.", typicalElements: ["Jangly Guitars", "Softer Vocals", "Unconventional Song Structures"] },
  // Rock Subgenres
  { id: "altRock90s", name: "90s Alt-Rock", parentGenre: "rock", description: "Alternative rock that gained mainstream popularity in the 1990s.", typicalElements: ["Distorted Guitars", "Angsty Lyrics", "Dynamic Shifts"] },
  { id: "punkRock", name: "Punk Rock", parentGenre: "rock", description: "Fast, aggressive rock music with a rebellious attitude.", typicalElements: ["Fast Tempos", "Simple Chord Progressions", "Anti-establishment Lyrics"] },
  { id: "progRock", name: "Progressive Rock", parentGenre: "rock", description: "Rock music with complex song structures, instrumentation, and lyrical themes.", typicalElements: ["Long Compositions", "Unusual Time Signatures", "Concept Albums"] },
  // Hip-Hop Subgenres
  { id: "trapRap", name: "Trap Rap", parentGenre: "hip-hop", description: "Hip-hop subgenre originating from the Southern US, known for its 808s and hi-hat patterns.", typicalElements: ["808 Bass", "Roland TR-808 Hi-Hats", "Layered Synths", "Autotuned Vocals"] },
  { id: "boomBap", name: "Boom Bap", parentGenre: "hip-hop", description: "Classic East Coast hip-hop style, emphasizing hard drum beats.", typicalElements: ["Sample-based Beats", "Acoustic Drum Sounds", "Lyrical Dexterity"] },
  { id: "consciousHipHop", name: "Conscious Hip-Hop", parentGenre: "hip-hop", description: "Hip-hop with lyrics focused on social issues and awareness.", typicalElements: ["Thought-provoking Lyrics", "Often Jazz/Soul Samples", "Positive Messages"] },
  // Electronic Subgenres
  { id: "house", name: "House", parentGenre: "electronic", description: "Electronic dance music characterized by a repetitive four-on-the-floor beat.", typicalElements: ["4/4 Beat", "Off-beat Hi-hats", "Synth Basslines"] },
  { id: "techno", name: "Techno", parentGenre: "electronic", description: "Repetitive instrumental music, often used in clubs.", typicalElements: ["Repetitive Rhythms", "Synthesized Sounds", "Often Minimalistic"] },
  { id: "ambient", name: "Ambient", parentGenre: "electronic", description: "Atmospheric electronic music focusing on texture and soundscape.", typicalElements: ["Soundscapes", "Slow Tempos", "Lack of Traditional Structure"] },
  // Country Subgenres
  { id: "bluegrass", name: "Bluegrass", parentGenre: "country", description: "Traditional country music with acoustic instruments and intricate harmonies.", typicalElements: ["Banjo", "Fiddle", "Acoustic Guitar", "Tight Harmonies"] },
  { id: "countryPop", name: "Country Pop", parentGenre: "country", description: "Country music with pop sensibilities and broader appeal.", typicalElements: ["Polished Production", "Catchy Melodies", "Crossover Appeal"] },
  // Jazz Subgenres
  { id: "smoothJazz", name: "Smooth Jazz", parentGenre: "jazz", description: "Accessible jazz style with melodic appeal and polished production.", typicalElements: ["Melodic Solos", "Soft Rhythms", "Contemporary Production"] },
  { id: "fusion", name: "Jazz Fusion", parentGenre: "jazz", description: "Jazz combined with rock, funk, and electronic elements.", typicalElements: ["Electric Instruments", "Complex Rhythms", "Technical Virtuosity"] },
  // R&B Subgenres
  { id: "neoSoul", name: "Neo Soul", parentGenre: "r&b", description: "Modern R&B with classic soul influences and contemporary production.", typicalElements: ["Organic Instruments", "Live Drums", "Conscious Lyrics"] },
  { id: "contemporaryRB", name: "Contemporary R&B", parentGenre: "r&b", description: "Modern R&B with electronic production and urban influences.", typicalElements: ["Programmed Beats", "Synthesizers", "Auto-tune"] },
  // Alternative Subgenres
  { id: "grunge", name: "Grunge", parentGenre: "alternative", description: "Raw, distorted alternative rock from the Pacific Northwest.", typicalElements: ["Heavy Distortion", "Flannel Aesthetic", "Anti-commercial Attitude"] },
  { id: "shoegaze", name: "Shoegaze", parentGenre: "alternative", description: "Ethereal alternative rock with layers of guitar effects.", typicalElements: ["Wall of Sound", "Effects Pedals", "Dreamy Vocals"] },
  // Classical Subgenres
  { id: "baroque", name: "Baroque", parentGenre: "classical", description: "Ornate classical music from the 17th-18th centuries.", typicalElements: ["Counterpoint", "Harpsichord", "Mathematical Precision"] },
  { id: "romantic", name: "Romantic", parentGenre: "classical", description: "Expressive classical music emphasizing emotion and individualism.", typicalElements: ["Emotional Expression", "Large Orchestras", "Program Music"] },
  // Folk Subgenres
  { id: "indieFolk", name: "Indie Folk", parentGenre: "folk", description: "Contemporary folk music with indie sensibilities.", typicalElements: ["Acoustic Instruments", "Intimate Vocals", "DIY Aesthetic"] },
  { id: "folkRock", name: "Folk Rock", parentGenre: "folk", description: "Folk music with rock instrumentation and attitude.", typicalElements: ["Electric Guitars", "Folk Melodies", "Social Commentary"] }
];
var getSubGenreById = (id) => {
  return subGenres.find((sg) => sg.id === id);
};

// src/services/marketService.ts
var currentMarketTrends = [];
var allSubGenres = [...subGenres];
var initializeMockData = (roll = createSeededRandom("market:initial")) => {
  if (currentMarketTrends.length === 0) {
    const genres2 = ["pop", "rock", "hip-hop", "electronic", "country", "jazz"];
    const directions = ["rising", "stable", "falling", "emerging"];
    genres2.forEach((genre, index) => {
      const relevantSubGenre = allSubGenres.find((sg) => sg.parentGenre === genre);
      currentMarketTrends.push({
        id: `trend-${genre}-${index}`,
        genreId: genre,
        subGenreId: relevantSubGenre ? relevantSubGenre.id : void 0,
        popularity: randomInt(roll, 30, 99),
        trendDirection: directions[randomInt(roll, 0, directions.length - 1)],
        growthRate: roll() * 10 - 5,
        lastUpdated: 0,
        growth: roll() * 100 - 50,
        events: [],
        duration: 30,
        startDay: 1
      });
    });
  }
};
initializeMockData();
var resetMarketTrends = (seed = "initial") => {
  currentMarketTrends = [];
  initializeMockData(createSeededRandom(`market:${seed}`));
};
var MAX_REPLAY_DAYS = 3650;
var marketTrendsAt = (seed, day) => {
  const saved = currentMarketTrends;
  try {
    resetMarketTrends(seed);
    let trends = [...currentMarketTrends];
    for (let d = 1; d <= Math.min(MAX_REPLAY_DAYS, Math.max(0, Math.floor(day))); d++) {
      trends = marketService.updateAllMarketTrends({ saveSeed: seed, currentDay: d });
    }
    return trends;
  } finally {
    currentMarketTrends = saved;
  }
};
var marketService = {
  updateAllMarketTrends: (gameState, playerProjectsCompletedSinceLastUpdate = [], globalEventsHappenedSinceLastUpdate = []) => {
    const roll = createSeededRandom(`${gameState.saveSeed ?? "market"}:market:${gameState.currentDay}`);
    currentMarketTrends = currentMarketTrends.map((trend) => {
      let newPopularity = trend.popularity;
      let newGrowthRate = trend.growthRate;
      let newTrendDirection = trend.trendDirection;
      newPopularity += trend.growthRate * (roll() * 0.5 + 0.75);
      newGrowthRate += (roll() * 2 - 1) * 0.5;
      playerProjectsCompletedSinceLastUpdate.forEach((project) => {
        if (project.genre === trend.genreId && project.qualityScore && project.qualityScore > 70) {
          newPopularity += project.qualityScore / 20;
          newGrowthRate += project.qualityScore / 100;
        }
      });
      globalEventsHappenedSinceLastUpdate.forEach((event) => {
        if (event.affectedGenres.includes(trend.genreId)) {
          newPopularity += event.impact / 2;
          newGrowthRate += event.impact / 10;
        }
      });
      newPopularity = Math.max(5, Math.min(100, newPopularity));
      newGrowthRate = Math.max(-10, Math.min(10, newGrowthRate));
      if (newGrowthRate > 3) newTrendDirection = "rising";
      else if (newGrowthRate < -3) newTrendDirection = "falling";
      else if (newPopularity > 80 && newGrowthRate >= 0) newTrendDirection = "stable";
      else if (newPopularity < 20 && newGrowthRate <= 0) newTrendDirection = "fading";
      else if (newPopularity < 30 && newGrowthRate > 1) newTrendDirection = "emerging";
      else newTrendDirection = "stable";
      return {
        ...trend,
        popularity: Math.round(newPopularity),
        growthRate: parseFloat(newGrowthRate.toFixed(2)),
        trendDirection: newTrendDirection,
        lastUpdated: gameState.currentDay,
        growth: Math.round(newGrowthRate * 10)
      };
    });
    return [...currentMarketTrends];
  },
  getCurrentPopularity: (genreId, subGenreId) => {
    let relevantTrend;
    if (subGenreId) {
      relevantTrend = currentMarketTrends.find(
        (trend) => trend.genreId === genreId && trend.subGenreId === subGenreId
      );
    }
    if (!relevantTrend) {
      relevantTrend = currentMarketTrends.find(
        (trend) => trend.genreId === genreId && !trend.subGenreId
      );
    }
    if (!relevantTrend) {
      const genericTrend = currentMarketTrends.find((trend) => trend.genreId === genreId);
      return genericTrend?.popularity || 50;
    }
    return relevantTrend.popularity;
  },
  getAllTrends: () => {
    return [...currentMarketTrends];
  },
  getAllSubGenres: () => {
    return [...subGenres];
  },
  getSubGenreById: (subGenreId) => {
    return getSubGenreById(subGenreId);
  }
};

// src/rpg/marketDemand.ts
var MARKET_WEEK_DAYS = 7;
var ENQUIRY_DEMAND_SWING = 0.25;
var RELEASE_DEMAND_POINTS = 6;
var weekStartDay = (day) => Math.max(0, Math.floor(day / MARKET_WEEK_DAYS) * MARKET_WEEK_DAYS);
var MARKET_GENRE = {
  pop: "pop",
  "synth pop": "pop",
  "dance pop": "pop",
  rock: "rock",
  punk: "rock",
  "pop-punk": "rock",
  blues: "rock",
  "hair metal": "rock",
  "alt rock": "rock",
  "hip-hop": "hip-hop",
  trap: "hip-hop",
  electronic: "electronic",
  edm: "electronic",
  house: "electronic",
  techno: "electronic",
  country: "country",
  jazz: "jazz"
};
var cache = /* @__PURE__ */ new Map();
var weeklyMarket = (seed, day) => {
  const start = weekStartDay(day);
  const key2 = `${seed}:${start}`;
  let trends = cache.get(key2);
  if (!trends) {
    trends = marketTrendsAt(seed, start);
    if (cache.size > 64) cache.clear();
    cache.set(key2, trends);
  }
  return trends;
};
var scoreOf = (t) => Math.max(-1, Math.min(1, (t.popularity - 50) / 50));
var genreDemand = (seed, day, genre) => {
  const market = MARKET_GENRE[genre.trim().toLowerCase()];
  if (!market || seed === void 0) return 0;
  const t = weeklyMarket(seed, day).find((x) => x.genreId === market);
  return t ? scoreOf(t) : 0;
};
var enquiryDemandWeight = (seed, day) => (genre) => 1 + ENQUIRY_DEMAND_SWING * genreDemand(seed, day, genre);
var releaseDemandPoints = (seed, day, genre) => Math.round(RELEASE_DEMAND_POINTS * genreDemand(seed, day, genre));
var GENRE_NAME = { pop: "Pop", rock: "Rock", "hip-hop": "Hip-Hop", electronic: "Electronic", country: "Country", jazz: "Jazz" };
var industryPulse = (seed, day, limit = 3) => {
  if (seed === void 0) return [];
  return weeklyMarket(seed, day).map((t) => ({ t, s: scoreOf(t) })).sort((a2, b2) => Math.abs(b2.s) - Math.abs(a2.s) || a2.t.genreId.localeCompare(b2.t.genreId)).slice(0, limit).map(({ t, s }) => {
    const word = t.trendDirection === "falling" || s < -0.3 ? "Cooling" : t.trendDirection === "rising" || t.trendDirection === "emerging" || s > 0.3 ? "Rising" : "Stable";
    return {
      genre: GENRE_NAME[t.genreId] ?? t.genreId,
      word,
      arrow: word === "Rising" ? "\u2191" : word === "Cooling" ? "\u2193" : "\u2192",
      effect: s > 0.3 ? "More enquiries, releases land a little better" : s < -0.3 ? "Fewer enquiries, releases land a little softer" : "Typical enquiries"
    };
  });
};

// src/rpg/artistCareer.ts
var CAREER_TIERS = ["local", "emerging", "established", "breakout", "prestige"];
var CAREER_POINTS = { local: 0, emerging: 3, established: 8, breakout: 16, prestige: 28 };
var RELEASE_CAP = 8;
var FOLLOW_UP_KINDS = ["Second single", "EP follow-up", "Album mix", "Deluxe track", "Live session", "Remaster"];
var TIER_REQUESTS = {
  local: ["tracking", "vocal-production"],
  emerging: ["vocal-production", "mix"],
  established: ["full-production", "mix"],
  breakout: ["full-production", "master"],
  prestige: ["full-production"]
};
var careerTierForPoints = (points) => {
  let tier = "local";
  for (const t of CAREER_TIERS) if (points >= CAREER_POINTS[t]) tier = t;
  return tier;
};
var clientCareerTier = (rel2) => careerTierForPoints(rel2?.careerPoints ?? 0);
var outcomeBandFor = (projectId, quality, demandPoints = 0) => {
  const swing = randomInt(createSeededRandom(`release:${projectId}`), -8, 8);
  const score = Math.max(0, Math.min(100, quality)) + swing + Math.max(-RELEASE_DEMAND_POINTS, Math.min(RELEASE_DEMAND_POINTS, demandPoints));
  return score < 45 ? "quiet" : score < 70 ? "solid" : score < 88 ? "breakthrough" : "prestige";
};
function recordRelease(rel2, input) {
  const releases = rel2.releases ?? [];
  if (releases.some((r) => r.projectId === input.projectId)) return rel2;
  const delay = randomInt(createSeededRandom(`release-delay:${input.projectId}`), 2, 5);
  const release = {
    id: `release:${input.projectId}`,
    projectId: input.projectId,
    title: input.title,
    genre: input.genre,
    qualityScore: Math.max(0, Math.min(100, Math.round(input.qualityScore))),
    releaseDay: input.day,
    resolveDay: input.day + delay,
    outcomeBand: outcomeBandFor(input.projectId, input.qualityScore, input.demandPoints ?? 0),
    resolved: false,
    ...input.followUpOf ? { followUpOf: input.followUpOf } : {}
  };
  return { ...rel2, releases: [...releases, release].slice(-RELEASE_CAP) };
}
var requestedServiceFor = (rel2, projectId) => {
  const options = TIER_REQUESTS[clientCareerTier(rel2)];
  return options[randomInt(createSeededRandom(`careerreq:${projectId}`), 0, options.length - 1)];
};
var followUpCandidate = (rel2) => {
  const releases = rel2?.releases ?? [];
  const followed = new Set(releases.map((r) => r.followUpOf).filter(Boolean));
  return [...releases].reverse().find((r) => r.resolved && r.outcomeBand !== "quiet" && !followed.has(r.id));
};
var followUpKind = (projectId) => FOLLOW_UP_KINDS[randomInt(createSeededRandom(`followup:${projectId}`), 0, FOLLOW_UP_KINDS.length - 1)];

// src/i18n/content.ts
var import_react = __toESM(require_react(), 1);

// src/rpg/cities.ts
var HOT_POPULARITY = 8;
var COOL_POPULARITY = -6;
var HOT_ENQUIRY_WEIGHT = 1.5;
var CITIES = [
  {
    id: "los-angeles",
    name: "Los Angeles",
    country: "USA",
    tagline: "Sunset sessions, label money and a studio on every corner.",
    currency: { code: "USD", symbol: "$", perDollar: 1 },
    hotGenres: ["Pop", "Hip-Hop", "Soul", "Trap"],
    coolGenres: ["Folk", "Punk"],
    names: {
      first: ["Jordan", "Mason", "Kiara", "Devin", "Tatum", "Marisol", "Dre", "Skylar", "Ximena", "Rudy"],
      last: ["Alvarez", "Whitaker", "Nakamura", "Okafor", "Delgado", "Sinclair", "Park", "Reyes", "Holloway", "Barnes"]
    },
    scene: "Canyon sessions and label lunches",
    accent: "#f2a65a",
    edge: { attribute: "businessAcumen", label: "Deal-maker", why: "Label lunches teach you how a rate card really works." },
    lore: {
      blurb: "The studio capital of the Pacific: every second building has a live room and a story about who cut what there.",
      landmarks: ["The Sunset Strip sound-stage rooms", "A Hollywood tracking floor with a famous echo chamber", "A canyon house with a mountain of tape"],
      legend: "They say a producer in LA is only ever one lunch away from a hit, or a very long wait for the check.",
      eras: { analog60s: "Session players, tiki bars and big-band engineers hand the town its first sound.", digital80s: "Gloss, gated drums and a label on every corner.", internet2000s: "Every bedroom is a studio; the boulevards still pay for the polish.", streaming2020s: "Streaming money, beat-makers in rented villas and one very good taco truck." }
    }
  },
  {
    id: "nashville",
    name: "Nashville",
    country: "USA",
    tagline: "Songwriters on every porch and a round at every bar.",
    currency: { code: "USD", symbol: "$", perDollar: 1 },
    hotGenres: ["Country", "Folk", "Blues", "Acoustic"],
    coolGenres: ["EDM", "Electronic"],
    names: {
      first: ["Waylon", "Loretta", "Hank", "Tammy", "Cash", "Dolly", "Merle", "Reba", "Clay", "Savannah"],
      last: ["Tillman", "Haggard", "McBride", "Crenshaw", "Parton", "Rutledge", "Buckner", "Calloway", "Dunn", "Stapleton"]
    },
    scene: "Songwriter rounds and Music Row",
    accent: "#d98c4a",
    edge: { attribute: "creativeIntuition", label: "Song sense", why: "Writers' rounds sharpen your ear for a hook that holds." },
    lore: {
      blurb: "Music City: songwriters share stages the way other towns share parking lots, and a three-chord idea is a serious thing.",
      landmarks: ["Music Row's converted houses", "A radio-station-turned-studio with a beloved vocal booth", "A honky-tonk with a stage-door demo tape box"],
      legend: "Locals swear the best songs are written between the first coffee and the second verse.",
      eras: { analog60s: "Country meets rock and roll in tiny rooms with big, warm microphones.", digital80s: "Polished Nashville pop-country finds its crossover audience.", internet2000s: "Writers sell songs to every genre; the town learns to wear a different hat.", streaming2020s: "Indie-folk and streaming playlists put the old rooms back on the map." }
    }
  },
  {
    id: "london",
    name: "London",
    country: "UK",
    tagline: "Pirate radio, Soho studios and a taste for whatever is next.",
    currency: { code: "GBP", symbol: "\xA3", perDollar: 0.8 },
    hotGenres: ["Indie", "Punk", "Electronic", "New Wave"],
    coolGenres: ["Country", "Hair Metal"],
    names: {
      first: ["Arthur", "Poppy", "Callum", "Imogen", "Rhys", "Zadie", "Jamal", "Elsie", "Harvey", "Priya"],
      last: ["Pemberton", "Okonkwo", "Hartley", "Banerjee", "Fairweather", "Doyle", "Ashworth", "Mensah", "Caldwell", "Quinn"]
    },
    scene: "Soho basements and pirate radio",
    accent: "#7fa8d9",
    edge: { attribute: "focusMastery", label: "Studio discipline", why: "Short sessions and tight budgets teach you to hold focus." },
    lore: {
      blurb: "Basement studios, pirate aerials and a music press that decides what is cool by Tuesday.",
      landmarks: ["A Soho basement with a ceiling pipe that sings", "A zebra-crossing-adjacent studio everyone photographs", "A railway-arch room with train-timed takes"],
      legend: "Every London engineer has a recording ruined by the Northern line, and a tale that makes up for it.",
      eras: { analog60s: "The Mod beat boom and the first real British studio sound.", digital80s: "Synth-pop, post-punk and a hundred bands in one postcode.", internet2000s: "Britpop, garage and dance floors that never really close.", streaming2020s: "Grime, bedroom pop and big-label rooms turned into co-working desks." }
    },
    eraCurrency: { analog60s: { code: "GBP", symbol: "\xA3", perDollar: 0.36 }, digital80s: { code: "GBP", symbol: "\xA3", perDollar: 0.6 }, internet2000s: { code: "GBP", symbol: "\xA3", perDollar: 0.6 }, streaming2020s: { code: "GBP", symbol: "\xA3", perDollar: 0.8 } }
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    tagline: "Club culture, cheap rent and rooms that never close.",
    currency: { code: "EUR", symbol: "\u20AC", perDollar: 0.92 },
    hotGenres: ["Electronic", "EDM", "Digital", "Lo-fi"],
    coolGenres: ["Country", "Motown"],
    names: {
      first: ["Lukas", "Mira", "Jonas", "Elif", "Tobias", "Nina", "Ruben", "Greta", "Felix", "Amara"],
      last: ["Vogel", "Kaya", "Brandt", "Neumann", "Richter", "Yilmaz", "Hartmann", "Lindqvist", "Becker", "Sommer"]
    },
    scene: "Warehouse nights and Kreuzberg studios",
    accent: "#9aa3b8",
    edge: { attribute: "technicalAptitude", label: "Signal nerd", why: "Warehouse rigs and modular racks make you fluent in signal flow." },
    lore: {
      blurb: "Concrete, club culture and the cheap rent that lets weird ideas run all night.",
      landmarks: ["A wartime-bunker-turned-studio with thick walls", "A hall by the Wall with a famous drum room", "A Kreuzberg backroom with a modular wall"],
      legend: "They say Berlin doesn't close; it just changes tempo around six a.m.",
      eras: { analog60s: "A divided city, a cold-war sound and a few studios by the border.", digital80s: "Krautrock's children meet synth pop in a half-empty city.", internet2000s: "Reunified rooms, techno clubs and rent so low the experiments never stop.", streaming2020s: "A global capital of electronic music, with a waiting list for the good rooms." }
    },
    eraCurrency: { analog60s: { code: "DEM", symbol: "DM", perDollar: 4 }, digital80s: { code: "DEM", symbol: "DM", perDollar: 2 }, internet2000s: { code: "EUR", symbol: "\u20AC", perDollar: 1.1 }, streaming2020s: { code: "EUR", symbol: "\u20AC", perDollar: 0.92 } }
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Immaculate rooms, vinyl bars and pop built like precision gear.",
    currency: { code: "JPY", symbol: "\xA5", perDollar: 150 },
    hotGenres: ["Pop", "Indie Pop", "Lo-fi", "TikTok Pop"],
    coolGenres: ["Blues", "Country"],
    names: {
      first: ["Haruto", "Yui", "Ren", "Sakura", "Kaito", "Mio", "Daichi", "Aoi", "Takumi", "Hinata"],
      last: ["Tanaka", "Fujimoto", "Kobayashi", "Matsuda", "Okada", "Shimizu", "Arai", "Hayashi", "Mori", "Ishikawa"]
    },
    scene: "Shibuya live houses and vinyl bars",
    accent: "#e87aa0",
    edge: { attribute: "technicalAptitude", label: "Precision ear", why: "A culture of immaculate craft rewards every careful detail." },
    lore: {
      blurb: "Immaculate rooms, vinyl bars the size of a closet and pop engineered like fine hardware.",
      landmarks: ["A Shibuya live house with a perfect small room", "A vinyl listening bar under a railway arch", "A Roppongi tower studio with a city-wide view"],
      legend: "A veteran engineer here can tell a patch cable was bought secondhand just by the way it sounds.",
      eras: { analog60s: "Jazz kissas and mellow ballads; the first big studios open their doors.", digital80s: "City pop, synthesizers and the world's best-built hardware.", internet2000s: "Idol factories, J-pop hits and rooms packed with gear.", streaming2020s: "Streaming brings city pop back; the vinyl bars are full again." }
    },
    eraCurrency: { analog60s: { code: "JPY", symbol: "\xA5", perDollar: 360 }, digital80s: { code: "JPY", symbol: "\xA5", perDollar: 220 }, internet2000s: { code: "JPY", symbol: "\xA5", perDollar: 115 }, streaming2020s: { code: "JPY", symbol: "\xA5", perDollar: 145 } }
  },
  {
    id: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    tagline: "Samba schools, funk parties and music that lives outdoors.",
    currency: { code: "BRL", symbol: "R$", perDollar: 5 },
    hotGenres: ["Disco", "Hip-Hop", "Soul", "Jazz"],
    coolGenres: ["Hair Metal", "Emo"],
    names: {
      first: ["Thiago", "Beatriz", "Caetano", "Luana", "Gilberto", "Marina", "Rafael", "Iara", "Joao", "Camila"],
      last: ["Silva", "Nascimento", "Moreira", "Barros", "Carvalho", "Duarte", "Teixeira", "Pacheco", "Lacerda", "Veloso"]
    },
    scene: "Lapa rodas and carnival rehearsals",
    accent: "#5fbf7a",
    edge: { attribute: "creativeIntuition", label: "Groove sense", why: "Samba schools teach you where the one really is." },
    lore: {
      blurb: "Samba schools, funk parties and music that lives outdoors, and a room that fits ninety drummers is called intimate.",
      landmarks: ["A Lapa roda de samba room with a famous hum", "A hillside favela studio with a rooftop live room", "A Copacabana bossa-nova apartment with a legendary piano"],
      legend: "Local engineers say the secret of any Rio record is simple: leave the door open and let the street in.",
      eras: { analog60s: "Bossa nova turns apartments into studios and exports a whole mood.", digital80s: "Tropicalia's children meet synthesizers and a very loud pop scene.", internet2000s: "Baile funk and electronic crossovers pour out of the hills.", streaming2020s: "Streaming turns local funk into a global party playlist." }
    },
    eraCurrency: { analog60s: { code: "BRL", symbol: "R$", perDollar: 0.5 }, digital80s: { code: "BRL", symbol: "R$", perDollar: 1 }, internet2000s: { code: "BRL", symbol: "R$", perDollar: 1.8 }, streaming2020s: { code: "BRL", symbol: "R$", perDollar: 5 } }
  },
  {
    id: "detroit",
    name: "Detroit",
    country: "USA",
    tagline: "Assembly-line rhythm, basement techno and records built to move.",
    currency: { code: "USD", symbol: "$", perDollar: 1 },
    hotGenres: ["Soul", "R&B", "Electronic", "Hip-Hop"],
    coolGenres: ["Country", "Folk"],
    names: {
      first: ["Marcus", "Denise", "Andre", "Rochelle", "Calvin", "Aaliyah", "Darnell", "Simone", "Malik", "Janice"],
      last: ["Williams", "Jefferson", "Banks", "Robinson", "Turner", "Harris", "Coleman", "Brooks", "Walker", "Franklin"]
    },
    scene: "West Grand Boulevard and basement machines",
    accent: "#5aa7a7",
    edge: { attribute: "focusMastery", label: "Pocket discipline", why: "Detroit sessions teach every player to serve the groove." },
    lore: {
      blurb: "A factory town that treated the studio like an instrument: tight rhythm sections upstairs, futuristic machines below street level.",
      landmarks: ["A converted house with a crowded attic echo chamber", "A downtown ballroom where the floor adds its own backbeat", "A basement room wired for drum machines after midnight"],
      legend: "Detroit engineers say a record is ready when the line moves, the bass holds and nobody wastes a note.",
      eras: { analog60s: "House bands, handclaps and an assembly-line studio turn soul records into a worldwide sound.", digital80s: "Synths and drum machines carry the city pulse from basement parties to dance floors.", internet2000s: "Hip-hop, garage rock and independent rooms rebuild around the city\u2019s stubborn musical core.", streaming2020s: "Producers connect soul history, techno precision and rap sessions across a renewed studio network." }
    }
  },
  {
    id: "lagos",
    name: "Lagos",
    country: "Nigeria",
    tagline: "Highlife guitars, restless grooves and a city louder than the monitors.",
    currency: { code: "NGN", symbol: "\u20A6", perDollar: 1500 },
    hotGenres: ["Soul", "Pop", "Hip-Hop", "Electronic"],
    coolGenres: ["Country", "Hair Metal"],
    names: {
      first: ["Tunde", "Adaeze", "Femi", "Ngozi", "Kunle", "Amara", "Chidi", "Bisi", "Emeka", "Yewande"],
      last: ["Adeyemi", "Okafor", "Balogun", "Eze", "Afolayan", "Nwosu", "Ogunleye", "Ibrahim", "Obi", "Akinola"]
    },
    scene: "Surulere studios and all-night bandstands",
    accent: "#d5a52f",
    edge: { attribute: "creativeIntuition", label: "Live-wire instinct", why: "Long band sets teach you when a groove is about to turn." },
    lore: {
      blurb: "A coastal megacity where highlife, Afrobeat, gospel and pop meet traffic, generators and audiences that expect the band to play on.",
      landmarks: ["A Surulere room built around a broad live floor", "A hotel bandstand where arrangements grow overnight", "An island studio whose generator has perfect timing"],
      legend: "The city\u2019s producers say the best take begins after the arrangement has outgrown the page.",
      eras: { analog60s: "Highlife bands fill hotel rooms and radio studios with guitars, horns and dance-floor arrangements.", digital80s: "Afrobeat\u2019s long forms meet boogie keyboards, cassette studios and a fast-moving pop circuit.", internet2000s: "Home studios and music-video channels carry a new Nigerian pop sound across the continent.", streaming2020s: "Afrobeats sessions travel worldwide while Lagos rooms keep the percussion and call-and-response close." }
    },
    eraCurrency: { analog60s: { code: "NGP", symbol: "\xA3", perDollar: 0.36 }, digital80s: { code: "NGN", symbol: "\u20A6", perDollar: 0.8 }, internet2000s: { code: "NGN", symbol: "\u20A6", perDollar: 130 }, streaming2020s: { code: "NGN", symbol: "\u20A6", perDollar: 1500 } }
  }
];
var getCityById = (id) => CITIES.find((c2) => c2.id === id);
var norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
var genreIn = (list, genre) => list.some((g2) => norm(g2) === norm(genre));
var regionalPopularityDelta = (genre, cityId) => {
  const city = getCityById(cityId);
  if (!city) return 0;
  if (genreIn(city.hotGenres, genre)) return HOT_POPULARITY;
  if (genreIn(city.coolGenres, genre)) return COOL_POPULARITY;
  return 0;
};
var regionalEnquiryWeight = (genre, cityId) => {
  const city = getCityById(cityId);
  return city && genreIn(city.hotGenres, genre) ? HOT_ENQUIRY_WEIGHT : 1;
};

// src/utils/bandUtils.ts
var bandAdjectives = [
  "Electric",
  "Crimson",
  "Midnight",
  "Silver",
  "Golden",
  "Dark",
  "Neon",
  "Velvet",
  "Crystal",
  "Thunder",
  "Lightning",
  "Fire",
  "Ice",
  "Shadow",
  "Bright",
  "Wild",
  "Lost",
  "Broken",
  "Rising",
  "Falling",
  "Secret",
  "Hidden",
  "Ancient",
  "Modern"
];
var bandNouns = [
  "Waves",
  "Tides",
  "Dreams",
  "Nights",
  "Days",
  "Stars",
  "Moons",
  "Suns",
  "Hearts",
  "Souls",
  "Minds",
  "Eyes",
  "Voices",
  "Songs",
  "Beats",
  "Rhythms",
  "Echoes",
  "Whispers",
  "Screams",
  "Lights",
  "Shadows",
  "Mirrors",
  "Angels",
  "Devils"
];
var generateBandName = () => {
  const adjective = bandAdjectives[Math.floor(Math.random() * bandAdjectives.length)];
  const noun = bandNouns[Math.floor(Math.random() * bandNouns.length)];
  return `${adjective} ${noun}`;
};
var generateAIBand = (genre) => {
  return {
    id: `ai_band_${Date.now()}_${Math.random()}`,
    bandName: generateBandName(),
    genre,
    fame: 0,
    notoriety: 0,
    memberIds: [],
    isPlayerCreated: false,
    pastReleases: [],
    tourStatus: {
      isOnTour: false,
      daysRemaining: 0,
      dailyIncome: 0
    }
  };
};

// src/engine/gameEventBus.ts
var GameEventBus = class {
  listeners = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }
  once(event, handler) {
    const wrapped = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }
  off(event, handler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[GameEventBus] Error in handler for event "${event}":`, err);
      }
    }
  }
  clear() {
    this.listeners.clear();
  }
};
var gameEvents = new GameEventBus();

// src/utils/eraProgression.ts
var ERA_DEFINITIONS = [
  {
    id: "analog60s",
    name: "The Analog Foundation (1960s-1970s)",
    startYear: 1960,
    endYear: 1979,
    description: "Basic analog equipment, 4-track recording, vinyl era",
    availableGenres: ["Rock", "Folk", "Soul", "Motown", "Country", "Jazz", "Blues"],
    technologyLevel: "analog",
    icon: "\u{1F39B}\uFE0F",
    colors: {
      gradient: "from-amber-800 to-orange-700",
      primary: "#D97706",
      secondary: "#92400E"
    },
    features: [
      "4-track analog recording",
      "Vintage microphones and preamps",
      "Tape-based mixing",
      "Vinyl mastering capabilities",
      "Classic reverb chambers",
      "Tube-driven warmth"
    ],
    unlockRequirements: {}
    // Starting era
  },
  {
    id: "digital80s",
    name: "The Digital Dawn (1980s-1990s)",
    startYear: 1980,
    endYear: 1999,
    description: "Digital recording, MIDI, CD production, MTV influence",
    availableGenres: ["New Wave", "Hip-Hop", "Electronic", "Hair Metal", "Punk", "Disco"],
    technologyLevel: "early_digital",
    icon: "\u{1F50A}",
    colors: {
      gradient: "from-purple-800 to-pink-700",
      primary: "#A855F7",
      secondary: "#7C3AED"
    },
    features: [
      "Digital multitrack recording",
      "MIDI sequencing and synthesis",
      "CD mastering and production",
      "Early sampling technology",
      "Digital effects processors",
      "MTV-style production techniques"
    ],
    unlockRequirements: {
      minReputation: 50,
      minLevel: 5,
      completedProjects: 10,
      minDays: 90
    }
  },
  {
    id: "internet2000s",
    name: "The Internet Disruption (2000s-2010s)",
    startYear: 2e3,
    endYear: 2019,
    description: "DAWs, file sharing, digital distribution, social media",
    availableGenres: ["Pop-punk", "Emo", "Electronic", "Indie", "Digital", "Hip-Hop"],
    technologyLevel: "digital",
    icon: "\u{1F4BB}",
    colors: {
      gradient: "from-blue-800 to-cyan-700",
      primary: "#3B82F6",
      secondary: "#1E40AF"
    },
    features: [
      "Professional DAW software",
      "Digital distribution platforms",
      "High-quality audio interfaces",
      "VST plugin ecosystem",
      "Social media marketing tools",
      "Home studio accessibility"
    ],
    unlockRequirements: {
      minReputation: 100,
      minLevel: 10,
      completedProjects: 25,
      minDays: 180
    }
  },
  {
    id: "streaming2020s",
    name: "The Streaming Age (2020s+)",
    startYear: 2020,
    endYear: 2030,
    description: "Streaming dominance, AI tools, social media marketing",
    availableGenres: ["EDM", "Trap", "Indie Pop", "Lo-fi", "TikTok Pop", "Hip-Hop"],
    technologyLevel: "modern",
    icon: "\u{1F3B5}",
    colors: {
      gradient: "from-green-800 to-emerald-700",
      primary: "#10B981",
      secondary: "#047857"
    },
    features: [
      "AI-powered mixing and mastering",
      "Streaming optimization tools",
      "TikTok and social media integration",
      "Real-time collaboration platforms",
      "Advanced analytics and insights",
      "Blockchain music distribution"
    ],
    unlockRequirements: {
      minReputation: 150,
      minLevel: 15,
      completedProjects: 50,
      minDays: 270
    }
  }
];
var getGenrePopularity = (genre, era) => {
  const genreByEra = {
    "analog60s": {
      "Rock": 90,
      "Folk": 80,
      "Soul": 85,
      "Motown": 90,
      "Country": 70,
      "Jazz": 60,
      "Blues": 65
    },
    "digital80s": {
      "New Wave": 90,
      "Hip-Hop": 70,
      "Electronic": 60,
      "Hair Metal": 80,
      "Punk": 75,
      "Rock": 70,
      "Disco": 60,
      "Pop": 80
    },
    "internet2000s": {
      "Pop-punk": 85,
      "Emo": 80,
      "Electronic": 90,
      "Indie": 75,
      "Hip-Hop": 85,
      "Rock": 60,
      "Digital": 75,
      "Pop": 80
    },
    "streaming2020s": {
      "EDM": 90,
      "Trap": 85,
      "Indie Pop": 80,
      "Lo-fi": 70,
      "Hip-Hop": 95,
      "Pop": 85,
      "TikTok Pop": 90
    }
  };
  const offTrendStaples = ["Rock", "Acoustic", "Folk", "Jazz", "Soul", "Pop", "Blues"];
  return genreByEra[era]?.[genre] || (offTrendStaples.includes(genre) ? 60 : 50);
};
var MARKET_NEUTRAL_POPULARITY = 75;
var getGenreMarketMultiplier = (genre, era, cityId) => {
  const popularity = getGenrePopularity(genre, era) + regionalPopularityDelta(genre, cityId);
  const multiplier = 1 + (popularity - MARKET_NEUTRAL_POPULARITY) / 100;
  return Math.max(0.7, Math.min(1.3, multiplier));
};

// src/game-mechanics/relationship-management.ts
function bumpMatchRatingForReturn(matchRating) {
  if (matchRating === "Poor") return "Good";
  if (matchRating === "Good") return "Excellent";
  return "Excellent";
}

// src/rpg/projectBrief.ts
var SERVICE_LABELS = {
  tracking: "Tracking",
  "vocal-production": "Vocal production",
  mix: "Mix",
  master: "Master",
  "full-production": "Full production"
};
var SERVICE_ROOM = {
  tracking: "live-room",
  "vocal-production": "vocal-suite",
  mix: "mix-suite",
  master: "mix-suite",
  "full-production": "project-studio"
};
var SERVICE_ROLE = {
  tracking: "Engineer",
  "vocal-production": "Producer",
  mix: "Engineer",
  master: "Engineer",
  "full-production": "Producer"
};
var ROOM_NAMES = {
  "project-studio": "Project Studio",
  "vocal-suite": "Vocal Suite",
  "live-room": "Live Room",
  "mix-suite": "Mix Suite"
};
var GENRE_DIRECTIONS = {
  Rock: ["raw", "live", "heavy"],
  Pop: ["polished", "intimate", "experimental"],
  Electronic: ["polished", "experimental", "heavy"],
  "Hip-hop": ["heavy", "polished", "raw"],
  Acoustic: ["intimate", "raw", "live"],
  Jazz: ["live", "intimate", "raw"],
  Folk: ["intimate", "raw", "live"],
  Soul: ["intimate", "polished", "live"]
};
var DEFAULT_DIRECTIONS = ["raw", "polished", "intimate"];
var SERVICES = ["tracking", "vocal-production", "mix", "master", "full-production"];
var PRIORITIES = ["quality", "speed", "budget"];
var pick = (items, rng) => items[Math.floor(rng() * items.length) % items.length];
function deriveBrief(project) {
  const rng = createSeededRandom(`brief:${project.id}:${project.genre}`);
  return {
    serviceType: pick(SERVICES, rng),
    direction: pick(GENRE_DIRECTIONS[project.genre] ?? DEFAULT_DIRECTIONS, rng),
    priority: pick(PRIORITIES, rng),
    genre: project.genre
  };
}
var avg = (xs) => xs.length ? xs.reduce((a2, b2) => a2 + b2, 0) / xs.length : 0;
var has = (c2, ...cats) => cats.some((k) => c2.gearCategories.has(k));
var FIT_RULES = [
  {
    id: "room-match",
    apply: (c2) => {
      const want = SERVICE_ROOM[c2.brief.serviceType];
      if (c2.roomType === want && want !== "project-studio") return { delta: 14, reason: `${ROOM_NAMES[want]} matches the brief` };
      if (c2.roomType === "project-studio") return { delta: 4, reason: "Project Studio handles most briefs" };
      return { delta: -10, reason: `This brief wants a ${ROOM_NAMES[want]}, not the ${c2.roomName}` };
    }
  },
  {
    id: "intimate-vocal-chain",
    discovery: "Intimate Vocal Chain",
    apply: (c2) => c2.direction === "intimate" && ["vocal-production", "tracking"].includes(c2.brief.serviceType) && c2.roomType === "vocal-suite" && has(c2, "microphone") ? { delta: 12, reason: "Close mic in the Vocal Suite suits an intimate take" } : null
  },
  {
    id: "live-room-energy",
    discovery: "Live Room Energy",
    apply: (c2) => ["live", "raw", "heavy"].includes(c2.direction) && c2.roomType === "live-room" ? { delta: 12, reason: "The Live Room gives this direction real energy" } : null
  },
  {
    id: "electronic-stack",
    discovery: "Electronic Production Stack",
    apply: (c2) => c2.brief.genre === "Electronic" && ["polished", "experimental"].includes(c2.direction) && has(c2, "software", "interface") ? { delta: 10, reason: "Interface and software rig fit electronic production" } : null
  },
  {
    id: "trusted-mix-pair",
    discovery: "Trusted Mix Pair",
    apply: (c2) => {
      if (!["mix", "master"].includes(c2.brief.serviceType) || !c2.clientId) return null;
      const s = c2.staff.find((m) => (m.clientFamiliarity?.[c2.clientId] ?? 0) >= 2);
      return s ? { delta: 12, reason: `${s.name} already knows this client's sound` } : null;
    }
  },
  {
    id: "genre-specialist",
    apply: (c2) => {
      const s = c2.staff.filter((m) => m.genreAffinity?.genre === c2.brief.genre).sort((a2, b2) => (b2.genreAffinity?.bonus ?? 0) - (a2.genreAffinity?.bonus ?? 0))[0];
      return s?.genreAffinity ? { delta: Math.min(12, Math.round(s.genreAffinity.bonus / 3)), reason: `${s.name} specializes in ${c2.brief.genre}` } : null;
    }
  },
  {
    id: "role-fit",
    apply: (c2) => {
      const role = SERVICE_ROLE[c2.brief.serviceType];
      const s = c2.staff.find((m) => m.role === role);
      return s ? { delta: 8, reason: `${s.name} is a ${role.toLowerCase()} for ${SERVICE_LABELS[c2.brief.serviceType].toLowerCase()}` } : null;
    }
  },
  {
    id: "polished-monitoring",
    apply: (c2) => c2.direction === "polished" && (c2.roomType === "mix-suite" || has(c2, "monitor")) ? { delta: 8, reason: "Good monitoring keeps a polished sound honest" } : null
  },
  {
    id: "heavy-punch",
    apply: (c2) => c2.direction === "heavy" && has(c2, "outboard", "mixer") ? { delta: 8, reason: "Outboard and console give it the punch it needs" } : null
  },
  {
    id: "quick-turnaround",
    apply: (c2) => c2.brief.priority === "speed" && c2.staff.length > 0 && avg(c2.staff.map((m) => m.primaryStats.speed)) >= 30 ? { delta: 8, reason: "A quick crew suits the fast turnaround" } : null
  },
  {
    id: "lean-budget",
    apply: (c2) => c2.brief.priority === "budget" && c2.staff.length <= 1 ? { delta: 6, reason: "A lean crew keeps the budget tight" } : null
  },
  {
    id: "quality-hands",
    apply: (c2) => c2.brief.priority === "quality" && c2.staff.length > 0 && avg(c2.staff.map((m) => m.primaryStats.technical)) >= 30 ? { delta: 8, reason: "Technical hands suit a quality-first brief" } : null
  },
  {
    id: "experimental-leap",
    apply: (c2) => {
      if (c2.direction !== "experimental") return null;
      return c2.staff.length > 0 && avg(c2.staff.map((m) => m.primaryStats.creativity)) >= 35 ? { delta: 10, reason: "A creative crew can carry an experimental leap" } : { delta: -6, reason: "An experimental brief needs a more creative crew" };
    }
  },
  {
    id: "house-recipe",
    apply: (c2) => c2.approachId === "house-recipe" ? { delta: 6, reason: `Your house recipe: the studio knows how to cut ${c2.genre}` } : null
  },
  {
    id: "repeat-client",
    apply: (c2) => c2.clientSessions > 0 ? { delta: Math.min(10, c2.clientSessions * 3), reason: "Repeat client: you already speak the same language" } : null
  }
];
var BRIEF_RULE_COUNT = FIT_RULES.length;

// src/rpg/studioRider.ts
var RIDER_MIN_REPUTATION = 25;
var RIDER_MIN_LEVEL = 5;
var RIDER_MIN_DIFFICULTY = 5;
var STUDIO_RIDERS = [
  {
    id: "rider-rock-beers-outboard",
    title: "Green Room Rider",
    blurb: "A cold six-pack and something that actually saturates.",
    genres: ["Rock"],
    eras: ["analog60s", "digital80s"],
    items: [
      { id: "beers", kind: "beer", label: "Cold beers on the candle table" },
      { id: "outboard", kind: "gear", label: "Working outboard / console colour", required: true, gearCategory: "outboard" },
      { id: "snacks", kind: "snacks", label: "Salted crisps (no onion)" }
    ]
  },
  {
    id: "rider-jazz-hospitality",
    title: "Quiet Room Rider",
    blurb: "Soft lights, soft voices, a mic that flatters.",
    genres: ["Jazz", "Soul", "Acoustic", "Folk"],
    eras: ["analog60s", "digital80s", "internet2000s"],
    items: [
      { id: "tea", kind: "hospitality", label: "Hot tea / quiet hospitality" },
      { id: "mic", kind: "gear", label: "Decent microphone", required: true, gearCategory: "microphone" },
      { id: "snacks", kind: "snacks", label: "Light snacks \u2014 nothing crunchy mid-take" }
    ]
  },
  {
    id: "rider-hiphop-snacks-rig",
    title: "Late Night Rider",
    blurb: "Snacks that survive a four-hour pocket hunt.",
    genres: ["Hip-hop", "Pop"],
    eras: ["internet2000s", "streaming2020s", "digital80s"],
    items: [
      { id: "snacks", kind: "snacks", label: "Late-night snacks & water" },
      { id: "interface", kind: "gear", label: "Clean audio interface", required: true, gearCategory: "interface" },
      { id: "beers", kind: "beer", label: "A couple of beers for the hook writers" }
    ]
  },
  {
    id: "rider-pop-full-hospitality",
    title: "Chart Act Rider",
    blurb: "Hospitality first \u2014 then monitors that tell the truth.",
    genres: ["Pop", "Soul"],
    eras: ["digital80s", "internet2000s", "streaming2020s"],
    items: [
      { id: "beers", kind: "beer", label: "Beers (and a backup six)" },
      { id: "snacks", kind: "snacks", label: "Styled snacks / fruit bowl" },
      { id: "monitors", kind: "gear", label: "Honest studio monitors", required: true, gearCategory: "monitor" },
      { id: "hospitality", kind: "hospitality", label: "Clean lounge + fresh towels" }
    ]
  },
  {
    id: "rider-electronic-rig",
    title: "Laptop Band Rider",
    blurb: "Power, software, and something cold that is not coffee.",
    genres: ["Electronic"],
    eras: ["internet2000s", "streaming2020s"],
    items: [
      { id: "beers", kind: "beer", label: "Cold drinks on the candle table" },
      { id: "software", kind: "gear", label: "DAW / software stack ready", required: true, gearCategory: "software" },
      { id: "interface", kind: "gear", label: "Low-latency interface", required: true, gearCategory: "interface" }
    ]
  }
];
var RIDER_TEMPLATE_COUNT = STUDIO_RIDERS.length;
function canHaveRider(ctx) {
  const midCareer = ctx.reputation >= RIDER_MIN_REPUTATION || ctx.playerLevel >= RIDER_MIN_LEVEL;
  return midCareer && ctx.difficulty >= RIDER_MIN_DIFFICULTY;
}
var riderMatches = (rider, genre, eraId) => {
  const genreOk = !rider.genres?.length || rider.genres.includes(genre);
  const eraOk = !rider.eras?.length || rider.eras.includes(eraId);
  return genreOk && eraOk;
};
var pick2 = (items, rng) => items[Math.floor(rng() * items.length) % items.length];
function deriveRider(project, ctx) {
  if (!canHaveRider({ reputation: ctx.reputation, playerLevel: ctx.playerLevel, difficulty: project.difficulty })) {
    return void 0;
  }
  const pool = STUDIO_RIDERS.filter((r) => riderMatches(r, project.genre, ctx.eraId));
  const candidates = pool.length > 0 ? pool : STUDIO_RIDERS;
  const rng = createSeededRandom(`rider:${project.id}:${project.genre}:${ctx.eraId}`);
  if (rng() > 0.7) return void 0;
  return pick2(candidates, rng);
}

// src/data/gigTemplates.ts
var stage = (stageName, workUnitsBase, ...focusAreas) => ({
  stageName,
  workUnitsBase,
  focusAreas
});
var A = "analog60s";
var D = "digital80s";
var I = "internet2000s";
var S = "streaming2020s";
var GIG_TEMPLATES = [
  // ───────────────────────── Timeless staples (offered in every era) ─────────────────────────
  {
    id: "timeless-rock-demo",
    titleTemplates: ["Local Band Demo", "Garage Band Recording", "Indie Demo Session"],
    genre: "Rock",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [A],
    timeless: true,
    baseStages: [stage("Setup & Recording", 8, "soundCapture", "performance"), stage("Basic Mixing", 10, "layering", "soundCapture"), stage("Demo Master", 6, "performance", "layering")],
    basePayout: 900,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "timeless-rock-anthem",
    titleTemplates: ["Rock Anthem", "Power Ballad", "Stadium Rocker"],
    genre: "Rock",
    clientType: "Record Label",
    difficulty: 4,
    tier: "advanced",
    eras: [],
    timeless: true,
    baseStages: [stage("Songwriting & Arrangement", 10, "performance", "soundCapture"), stage("Tracking & Recording", 14, "soundCapture", "layering"), stage("Mixing & Production", 12, "layering", "performance"), stage("Mastering & Polish", 8, "soundCapture", "layering")],
    basePayout: 1700,
    baseRep: 6,
    baseDuration: 8
  },
  {
    id: "timeless-acoustic",
    titleTemplates: ["Coffee Shop Sessions", "Acoustic Evening", "Songwriter Demo"],
    genre: "Acoustic",
    clientType: "Independent",
    difficulty: 1,
    tier: "starter",
    eras: [],
    timeless: true,
    baseStages: [stage("Live Recording", 6, "soundCapture", "performance"), stage("Light Production", 8, "layering", "soundCapture")],
    basePayout: 750,
    baseRep: 2,
    baseDuration: 3
  },
  {
    id: "timeless-folk",
    titleTemplates: ["Folk Harmony Sessions", "Front-Porch Field Recording", "Songwriter Circle Live"],
    genre: "Folk",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [A],
    timeless: true,
    baseStages: [stage("Acoustic Setup", 7, "performance", "soundCapture"), stage("Multi-Vocal Recording", 9, "layering", "performance"), stage("Traditional Mix", 5, "soundCapture", "layering")],
    basePayout: 850,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "timeless-jazz",
    titleTemplates: ["Jazz Session Recording", "Big Band Live Session", "Trumpet & Piano Duo"],
    genre: "Jazz",
    clientType: "Independent",
    difficulty: 3,
    tier: "starter",
    eras: [A],
    timeless: true,
    baseStages: [stage("Live Setup & Mic Placement", 9, "soundCapture", "performance"), stage("Live Recording Session", 11, "performance", "soundCapture"), stage("Analog Mix & Press", 7, "soundCapture", "layering")],
    basePayout: 950,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "timeless-soul",
    titleTemplates: ["Soul Vocal Session", "Late-Night Rhythm & Blues", "Gospel Choir Overdubs"],
    genre: "Soul",
    clientType: "Independent",
    difficulty: 3,
    tier: "starter",
    eras: [A],
    timeless: true,
    baseStages: [stage("Rhythm Section Setup", 10, "soundCapture", "performance"), stage("Lead Vocal Recording", 12, "performance", "soundCapture"), stage("Horn Section Overdubs", 8, "layering", "performance")],
    basePayout: 1e3,
    baseRep: 4,
    baseDuration: 5
  },
  {
    id: "timeless-pop-commercial",
    titleTemplates: ["Corporate Harmony", "Brand Anthem", "Commercial Melody"],
    genre: "Pop",
    clientType: "Commercial",
    difficulty: 4,
    tier: "advanced",
    eras: [],
    timeless: true,
    baseStages: [stage("Client Consultation & Concept", 8, "performance", "soundCapture"), stage("Multiple Variations & Testing", 12, "layering", "performance"), stage("Final Production & Delivery", 10, "soundCapture", "layering")],
    basePayout: 1500,
    baseRep: 6,
    baseDuration: 6
  },
  // ───────────────────────── 1960s — analog ─────────────────────────
  {
    id: "a-motown-single",
    titleTemplates: ["Hitsville Rhythm Section", "Three-Minute Soul Single", "Girl-Group Harmony Take"],
    genre: "Motown",
    clientType: "Record Label",
    difficulty: 3,
    tier: "starter",
    eras: [A],
    baseStages: [stage("Rhythm Section Live Take", 9, "performance", "soundCapture"), stage("Tambourine & Handclap Layers", 7, "layering", "performance"), stage("Lead & Backing Vocals", 10, "performance", "layering")],
    basePayout: 1e3,
    baseRep: 4,
    baseDuration: 5
  },
  {
    id: "a-country-ballad",
    titleTemplates: ["Nashville Weeper", "Pedal-Steel Ballad", "Honky-Tonk Two-Step"],
    genre: "Country",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [A],
    baseStages: [stage("Band Tracking Live", 8, "soundCapture", "performance"), stage("Pedal Steel & Fiddle Overdubs", 8, "layering", "performance"), stage("Vocal Double & Mix", 6, "performance", "soundCapture")],
    basePayout: 850,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "a-rock-45",
    titleTemplates: ["Surf-Rock 45", "British Invasion B-Side", "Fuzz-Box Garage Single"],
    genre: "Rock",
    clientType: "Record Label",
    difficulty: 3,
    tier: "starter",
    eras: [A],
    timeless: true,
    baseStages: [stage("Amp Mic-Up & Tracking", 8, "soundCapture", "performance"), stage("Fuzz & Spring Reverb Overdubs", 8, "layering", "soundCapture"), stage("Mono Mix for Radio", 6, "layering", "performance")],
    basePayout: 950,
    baseRep: 4,
    baseDuration: 4
  },
  {
    id: "a-motown-showcase",
    titleTemplates: ["Revue Night Headliner", "Chart-Topper Follow-Up", "Studio-A Marathon"],
    genre: "Motown",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [A],
    baseStages: [stage("Charts & Arrangement", 10, "performance", "soundCapture"), stage("Full Band Live Take", 14, "soundCapture", "performance"), stage("Strings & Horn Overdubs", 12, "layering", "performance"), stage("Mono Mastering Cut", 8, "soundCapture", "layering")],
    basePayout: 1900,
    baseRep: 8,
    baseDuration: 8
  },
  {
    id: "a-jazz-concept",
    titleTemplates: ["Modal Suite in Two Parts", "Blue-Room Live Album", "Quartet at Midnight"],
    genre: "Jazz",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [A],
    timeless: true,
    baseStages: [stage("Room Tuning & Mic Placement", 10, "soundCapture", "performance"), stage("One-Take Live Session", 14, "performance", "soundCapture"), stage("Analog Mix", 10, "soundCapture", "layering")],
    basePayout: 1800,
    baseRep: 7,
    baseDuration: 7
  },
  {
    id: "a-blues-house",
    titleTemplates: ["Delta Slide Session", "Chicago Harp & Amp", "Juke-Joint Two-Track"],
    genre: "Blues",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [A],
    baseStages: [stage("Amp & Harp Mic-Up", 7, "soundCapture", "performance"), stage("Live Take", 9, "performance", "soundCapture"), stage("Raw Mix", 5, "soundCapture", "layering")],
    basePayout: 800,
    baseRep: 3,
    baseDuration: 3
  },
  // ───────────────────────── 1980s — digital ─────────────────────────
  {
    id: "d-newwave-single",
    titleTemplates: ["Drum-Machine Love Song", "Skinny-Tie Single", "Post-Punk Synth Hook"],
    genre: "New Wave",
    clientType: "Record Label",
    difficulty: 3,
    tier: "starter",
    eras: [D],
    baseStages: [stage("Drum Machine Programming", 8, "layering", "performance"), stage("Synth Hook Layers", 9, "layering", "soundCapture"), stage("Gated Reverb Mix", 7, "soundCapture", "layering")],
    basePayout: 950,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "d-hiphop-breaks",
    titleTemplates: ["Block-Party Breakbeat", "Cut & Scratch Cassette", "Cipher Demo Tape"],
    genre: "Hip-Hop",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [D, I, S],
    baseStages: [stage("Beat Digging & Sampling", 7, "layering", "performance"), stage("Verse Tracking", 8, "performance", "soundCapture"), stage("Hard-Panned Mix", 6, "soundCapture", "layering")],
    basePayout: 700,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "d-hairmetal-riff",
    titleTemplates: ["Sunset-Strip Power Chords", "Spandex Stadium Chorus", "Shred Solo Overdubs"],
    genre: "Hair Metal",
    clientType: "Record Label",
    difficulty: 4,
    tier: "starter",
    eras: [D],
    baseStages: [stage("Wall-of-Guitars Tracking", 10, "soundCapture", "performance"), stage("Gang Vocal Stack", 9, "layering", "performance"), stage("Big Snare Mix", 8, "layering", "soundCapture")],
    basePayout: 1150,
    baseRep: 5,
    baseDuration: 5
  },
  {
    id: "d-punk-7inch",
    titleTemplates: ["Basement 7-Inch", "Two-Minute Fury", "Squat Show Live Tape"],
    genre: "Punk",
    clientType: "Independent",
    difficulty: 1,
    tier: "starter",
    eras: [D],
    baseStages: [stage("Live-to-Two-Track", 5, "performance", "soundCapture"), stage("Loud Mix", 5, "soundCapture", "layering")],
    basePayout: 450,
    baseRep: 2,
    baseDuration: 2
  },
  {
    id: "d-disco-floor",
    titleTemplates: ["Twelve-Inch Extended Mix", "Mirror-Ball Floor Filler", "Strings & Four-on-the-Floor"],
    genre: "Disco",
    clientType: "Record Label",
    difficulty: 3,
    tier: "starter",
    eras: [D],
    baseStages: [stage("Rhythm Section Groove", 9, "performance", "soundCapture"), stage("String & Horn Stabs", 8, "layering", "performance"), stage("Club Mix", 8, "layering", "soundCapture")],
    basePayout: 950,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "d-electronic-synthwave",
    titleTemplates: ["Bedroom Beat Session", "First Synth Single", "Club Demo"],
    genre: "Electronic",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [D, I],
    baseStages: [stage("Beat Programming", 7, "layering", "performance"), stage("Synth Tracking", 8, "soundCapture", "layering"), stage("Rough Mix", 6, "layering", "soundCapture")],
    basePayout: 320,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "d-newwave-video",
    titleTemplates: ["Video-Ready Chart Hit", "MTV Rotation Single", "Neon-Suit Comeback"],
    genre: "New Wave",
    clientType: "Record Label",
    difficulty: 6,
    tier: "advanced",
    eras: [D],
    baseStages: [stage("Sequencer Arrangement", 12, "layering", "performance"), stage("Polysynth Layers", 14, "layering", "soundCapture"), stage("Vocal Comping", 10, "performance", "layering"), stage("Radio Mix & Edit", 10, "soundCapture", "layering")],
    basePayout: 2100,
    baseRep: 9,
    baseDuration: 9
  },
  {
    id: "d-hiphop-album",
    titleTemplates: ["Crate-Digger Debut LP", "Golden-Age Posse Cut", "Turntable Suite"],
    genre: "Hip-Hop",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [D, I, S],
    baseStages: [stage("Sample Clearance & Chops", 12, "layering", "performance"), stage("Multi-Verse Tracking", 14, "performance", "soundCapture"), stage("Full-Length Mix", 12, "soundCapture", "layering")],
    basePayout: 1900,
    baseRep: 8,
    baseDuration: 8
  },
  {
    id: "d-hairmetal-album",
    titleTemplates: ["Platinum-Bound Power Ballad", "Arena Tour Album", "Video Vixen Anthem"],
    genre: "Hair Metal",
    clientType: "Record Label",
    difficulty: 6,
    tier: "advanced",
    eras: [D],
    baseStages: [stage("Pre-Production Rehearsal", 10, "performance", "soundCapture"), stage("Bed Track Tracking", 14, "soundCapture", "performance"), stage("Harmony Guitar Stacks", 12, "layering", "performance"), stage("Slick Mix", 10, "layering", "soundCapture")],
    basePayout: 2200,
    baseRep: 9,
    baseDuration: 9
  },
  // ───────────────────────── 2000s — internet ─────────────────────────
  {
    id: "i-poppunk-single",
    titleTemplates: ["Skate-Park Singalong", "Mall-Punk Radio Edit", "Suburban Anthem"],
    genre: "Pop-punk",
    clientType: "Record Label",
    difficulty: 3,
    tier: "starter",
    eras: [I],
    baseStages: [stage("Power-Chord Tracking", 8, "soundCapture", "performance"), stage("Gang-Vocal Hooks", 8, "layering", "performance"), stage("Loud Radio Mix", 7, "layering", "soundCapture")],
    basePayout: 950,
    baseRep: 4,
    baseDuration: 4
  },
  {
    id: "i-emo-ep",
    titleTemplates: ["Diary Entry EP", "Screamo Split 7-Inch", "Midnight Burned CD"],
    genre: "Emo",
    clientType: "Independent",
    difficulty: 3,
    tier: "starter",
    eras: [I],
    baseStages: [stage("Dynamic Guitar Tracking", 8, "soundCapture", "performance"), stage("Confessional Vocal Takes", 10, "performance", "soundCapture"), stage("Emotional Mix", 7, "layering", "soundCapture")],
    basePayout: 850,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "i-indie-mp3",
    titleTemplates: ["MySpace Lo-Fi Single", "Blog-Buzz Debut", "Dorm-Room Four-Track"],
    genre: "Indie",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [I],
    baseStages: [stage("DIY Tracking", 7, "soundCapture", "performance"), stage("Layer the Hook", 8, "layering", "performance"), stage("Web-Ready Master", 5, "soundCapture", "layering")],
    basePayout: 700,
    baseRep: 3,
    baseDuration: 3
  },
  {
    id: "i-digital-ringtone",
    titleTemplates: ["Polyphonic Ringtone Pack", "CD-Burn Compilation", "Digital Single Launch"],
    genre: "Digital",
    clientType: "Commercial",
    difficulty: 2,
    tier: "starter",
    eras: [I],
    baseStages: [stage("Hook Sequencing", 6, "layering", "performance"), stage("Loudness Master", 6, "soundCapture", "layering")],
    basePayout: 500,
    baseRep: 2,
    baseDuration: 3
  },
  {
    id: "i-poppunk-album",
    titleTemplates: ["Warped-Tour Debut LP", "Platinum Teen Anthem", "Arena Singalong LP"],
    genre: "Pop-punk",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [I],
    baseStages: [stage("Pre-Production", 8, "performance", "soundCapture"), stage("Full Tracking", 14, "soundCapture", "performance"), stage("Vocal Stack", 10, "layering", "performance"), stage("Radio Mix & Master", 10, "layering", "soundCapture")],
    basePayout: 1900,
    baseRep: 8,
    baseDuration: 8
  },
  {
    id: "i-electronic-club",
    titleTemplates: ["Festival Banger", "Electronic Anthem", "Bass Drop Empire"],
    genre: "Electronic",
    clientType: "Commercial",
    difficulty: 6,
    tier: "advanced",
    eras: [D, I],
    baseStages: [stage("Beat Programming & Sound Design", 14, "layering", "performance"), stage("Arrangement & Build-ups", 16, "performance", "layering"), stage("Mixing & Master", 12, "layering", "soundCapture")],
    basePayout: 1800,
    baseRep: 8,
    baseDuration: 8
  },
  {
    id: "i-indie-breakout",
    titleTemplates: ["Pitchfork-Bound LP", "Blog Darling Full-Length", "Cult Record Reissue"],
    genre: "Indie",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [I],
    baseStages: [stage("Concept & Tracking", 12, "soundCapture", "performance"), stage("Layered Textures", 14, "layering", "soundCapture"), stage("Analog-Digital Hybrid Mix", 12, "soundCapture", "layering")],
    basePayout: 1600,
    baseRep: 7,
    baseDuration: 7
  },
  {
    id: "di-electronic-symphony",
    titleTemplates: ["Symphony of Code", "Digital Orchestra", "Cyber Symphony"],
    genre: "Electronic",
    clientType: "Commercial",
    difficulty: 8,
    tier: "advanced",
    eras: [D, I],
    baseStages: [stage("Thematic Composition", 16, "performance", "layering"), stage("Orchestration & Programming", 20, "layering", "soundCapture"), stage("Interactive Implementation", 18, "performance", "layering"), stage("Final Mix & Mastering", 14, "layering", "soundCapture")],
    basePayout: 3200,
    baseRep: 12,
    baseDuration: 12
  },
  {
    id: "di-electronic-neon",
    titleTemplates: ["Neon Dreams", "Synthwave Journey", "Retro Future"],
    genre: "Electronic",
    clientType: "Streaming",
    difficulty: 5,
    tier: "advanced",
    eras: [D, I],
    baseStages: [stage("Concept & Sound Design", 12, "layering", "performance"), stage("Recording & Layering", 16, "soundCapture", "layering"), stage("Mixing & Mastering", 14, "layering", "performance")],
    basePayout: 1600,
    baseRep: 7,
    baseDuration: 7
  },
  // ───────────────────────── 2020s — streaming ─────────────────────────
  {
    id: "s-edm-drop",
    titleTemplates: ["Festival Mainstage Drop", "Sidechain Anthem", "Sunrise Set Closer"],
    genre: "EDM",
    clientType: "Streaming",
    difficulty: 3,
    tier: "starter",
    eras: [S],
    baseStages: [stage("Sound Design", 8, "layering", "performance"), stage("Build & Drop Arrangement", 9, "performance", "layering"), stage("Loud Master", 6, "soundCapture", "layering")],
    basePayout: 900,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "s-trap-beats",
    titleTemplates: ["808 Slide Cut", "Hi-Hat Roll Single", "Bedroom Trap Tape"],
    genre: "Trap",
    clientType: "Streaming",
    difficulty: 2,
    tier: "starter",
    eras: [S],
    baseStages: [stage("808 & Hi-Hat Programming", 6, "layering", "performance"), stage("Vocal Tracking & Ad-libs", 8, "performance", "soundCapture"), stage("Sub-Heavy Mix", 6, "soundCapture", "layering")],
    basePayout: 650,
    baseRep: 3,
    baseDuration: 3
  },
  {
    id: "s-indiepop",
    titleTemplates: ["Bedroom Pop Single", "Indie Chorus Session", "First Release"],
    genre: "Indie Pop",
    clientType: "Independent",
    difficulty: 2,
    tier: "starter",
    eras: [S],
    baseStages: [stage("Vocal & Guitar Takes", 7, "performance", "soundCapture"), stage("Layer the Hook", 8, "layering", "performance"), stage("Streaming Master", 6, "soundCapture", "layering")],
    basePayout: 330,
    baseRep: 3,
    baseDuration: 4
  },
  {
    id: "s-lofi",
    titleTemplates: ["Late Night Lo-fi", "Study Beats EP", "Tape Hiss Sessions"],
    genre: "Lo-fi",
    clientType: "Independent",
    difficulty: 1,
    tier: "starter",
    eras: [S],
    baseStages: [stage("Sample & Texture", 6, "layering", "performance"), stage("Warm Mix", 7, "soundCapture", "layering")],
    basePayout: 260,
    baseRep: 2,
    baseDuration: 3
  },
  {
    id: "s-tiktokpop",
    titleTemplates: ["Fifteen-Second Hook", "Dance-Challenge Chorus", "Viral Snippet Single"],
    genre: "TikTok Pop",
    clientType: "Streaming",
    difficulty: 3,
    tier: "starter",
    eras: [S],
    baseStages: [stage("Hook Engineering", 7, "performance", "layering"), stage("Vocal Chop Layers", 8, "layering", "performance"), stage("Loudness-Normalised Master", 6, "soundCapture", "layering")],
    basePayout: 900,
    baseRep: 3,
    baseDuration: 3
  },
  {
    id: "s-edm-collab",
    titleTemplates: ["Mainstage Residency Single", "Festival Headliner Collab", "Stadium Drop Suite"],
    genre: "EDM",
    clientType: "Commercial",
    difficulty: 7,
    tier: "advanced",
    eras: [S],
    baseStages: [stage("Thematic Composition", 16, "performance", "layering"), stage("Orchestration & Programming", 20, "layering", "soundCapture"), stage("Interactive Implementation", 18, "performance", "layering"), stage("Final Mix & Mastering", 14, "layering", "soundCapture")],
    basePayout: 2600,
    baseRep: 12,
    baseDuration: 12
  },
  {
    id: "s-trap-album",
    titleTemplates: ["Platinum Streaming Run", "Playlist-Heavy Mixtape", "Autotune Collective LP"],
    genre: "Trap",
    clientType: "Record Label",
    difficulty: 5,
    tier: "advanced",
    eras: [S],
    baseStages: [stage("Beat Selection & Sound Design", 12, "layering", "performance"), stage("Multi-Song Vocal Tracking", 14, "performance", "soundCapture"), stage("Album Mix & Master", 12, "soundCapture", "layering")],
    basePayout: 1800,
    baseRep: 8,
    baseDuration: 8
  },
  {
    id: "s-tiktokpop-viral",
    titleTemplates: ["Algorithm Darling", "Playlist Bait", "Sound-On Sensation"],
    genre: "TikTok Pop",
    clientType: "Streaming",
    difficulty: 5,
    tier: "advanced",
    eras: [S],
    baseStages: [stage("Concept & Sound Design", 12, "layering", "performance"), stage("Recording & Layering", 16, "soundCapture", "layering"), stage("Mixing & Mastering", 14, "layering", "performance")],
    basePayout: 1700,
    baseRep: 7,
    baseDuration: 7
  }
];
var TIMELESS_WEIGHT = 0.2;
var isNative = (template, eraId, eraGenres) => template.eras.length > 0 ? template.eras.includes(eraId) : eraGenres.has(template.genre);
var getEraGigPool = (eraId, tier, eraGenres) => {
  const genreSet = new Set(eraGenres);
  const inTier = GIG_TEMPLATES.filter((t) => t.tier === tier);
  const pool = [];
  for (const template of inTier) {
    if (isNative(template, eraId, genreSet)) pool.push({ template, weight: 1 });
    else if (template.timeless) pool.push({ template, weight: TIMELESS_WEIGHT });
  }
  return pool.length > 0 ? pool : inTier.map((template) => ({ template, weight: 1 }));
};
var pickWeightedGig = (pool, roll) => {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.min(0.999999, Math.max(0, roll)) * total;
  for (const item of pool) {
    cursor -= item.weight;
    if (cursor < 0) return item.template;
  }
  return pool[pool.length - 1].template;
};

// src/utils/projectUtils.ts
var generateNewProjects = (count, playerLevel = 1, currentEra = "analog60s", knownClients = [], repeatClientPremium = 1.1, reputation = 0, cityId, demandWeight) => {
  const projects = [];
  const usedTitles = /* @__PURE__ */ new Set();
  const followUpsOffered = /* @__PURE__ */ new Set();
  const currentEraDefinition = ERA_DEFINITIONS.find((era) => era.id === currentEra);
  const eraGenres = currentEraDefinition?.availableGenres || ERA_DEFINITIONS[0].availableGenres;
  const starterPool = getEraGigPool(currentEra, "starter", eraGenres);
  const advancedPool = getEraGigPool(currentEra, "advanced", eraGenres);
  const isEarlyGame = playerLevel < 5;
  const rawTemplatePool = isEarlyGame ? starterPool : [...starterPool, ...advancedPool];
  const regional = (pool) => cityId || demandWeight ? pool.map((g2) => ({
    ...g2,
    weight: g2.weight * (cityId ? regionalEnquiryWeight(g2.template.genre, cityId) : 1) * (demandWeight ? demandWeight(g2.template.genre) : 1)
  })) : pool;
  const templatePool = regional(rawTemplatePool);
  const basePool = isEarlyGame ? starterPool : advancedPool;
  const weightedPool = regional(basePool);
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let project;
    do {
      const useAppropriateLevel = Math.random() < 0.7;
      const selectedPool = useAppropriateLevel ? weightedPool : templatePool;
      const template = pickWeightedGig(selectedPool, Math.random());
      const returningClientChance = 0.35;
      const returningClient = knownClients.length > 0 && Math.random() < returningClientChance ? knownClients[Math.floor(Math.random() * knownClients.length)] : void 0;
      const titleIndex = Math.floor(Math.random() * template.titleTemplates.length);
      const selectedTitle = template.titleTemplates[titleIndex];
      const difficultyVariation = Math.random() * 2 - 1;
      let finalDifficulty = Math.max(1, Math.min(10, template.difficulty + Math.floor(difficultyVariation)));
      if (isEarlyGame) {
        finalDifficulty = Math.min(finalDifficulty, 4);
      }
      const stages = template.baseStages.map((stageTemplate) => ({
        stageName: stageTemplate.stageName,
        focusAreas: stageTemplate.focusAreas,
        workUnitsBase: Math.max(4, stageTemplate.workUnitsBase + Math.floor(Math.random() * 4 - 2)),
        workUnitsCompleted: 0,
        completed: false
      }));
      const marketMultiplier = 0.8 + Math.random() * 0.4;
      const difficultyMultiplier = 1 + (finalDifficulty - 1) * 0.15;
      const eraPopularityMultiplier = getGenreMarketMultiplier(template.genre, currentEra, cityId);
      const repeatClientMultiplier = returningClient ? Math.max(1, Math.min(1.5, repeatClientPremium)) : 1;
      const finalPayout = Math.floor(
        template.basePayout * marketMultiplier * difficultyMultiplier * eraPopularityMultiplier * repeatClientMultiplier
      );
      const finalRep = Math.floor(template.baseRep * difficultyMultiplier * eraPopularityMultiplier);
      const finalDuration = Math.max(3, template.baseDuration + Math.floor(Math.random() * 3 - 1));
      const requiredSkills = {};
      requiredSkills[template.genre] = Math.max(1, Math.floor(finalDifficulty / 2));
      const baseMatchRating = finalDifficulty <= playerLevel ? "Excellent" : finalDifficulty <= playerLevel + 2 ? "Good" : "Poor";
      const matchRating = returningClient ? bumpMatchRatingForReturn(baseMatchRating) : baseMatchRating;
      const associatedBand = returningClient ? null : generateAIBand(template.genre);
      const clientId = returningClient?.clientId ?? associatedBand.id;
      const clientName = returningClient?.clientName ?? associatedBand.bandName;
      project = {
        id: `project-${Date.now()}-${i}`,
        title: returningClient ? `Return: ${selectedTitle}` : selectedTitle,
        genre: template.genre,
        clientType: template.clientType,
        clientId,
        clientName,
        difficulty: finalDifficulty,
        payoutBase: finalPayout,
        repGainBase: finalRep,
        durationDaysTotal: finalDuration,
        requiredSkills,
        matchRating,
        stages,
        currentStageIndex: 0,
        completedStages: [],
        stake: "safe",
        // Booking gamble default (sd3.2); ambitious/moonshot UI lands later
        accumulatedCPoints: 0,
        accumulatedTPoints: 0,
        workSessionCount: 0,
        associatedBandId: clientId,
        focusAllocation: { performance: 33, soundCapture: 33, layering: 34 }
        // ADDED default focus allocation
      };
      attempts++;
    } while (usedTitles.has(project.title) && attempts < 50);
    project.brief = deriveBrief(project);
    const careerClient = knownClients.find((c2) => c2.clientName === project.clientName);
    if (careerClient) {
      project.brief = { ...project.brief, serviceType: requestedServiceFor(careerClient, project.id) };
      const seedRelease = followUpCandidate(careerClient);
      if (seedRelease && !followUpsOffered.has(seedRelease.id)) {
        followUpsOffered.add(seedRelease.id);
        project.followUpOf = seedRelease.id;
        project.title = `Follow-up: ${followUpKind(project.id)} for ${seedRelease.title}`;
      }
    }
    const rider = deriveRider(project, {
      reputation,
      playerLevel,
      eraId: currentEra
    });
    if (rider) project.rider = rider;
    usedTitles.add(project.title);
    projects.push(project);
  }
  return projects;
};

// src/game-mechanics/market-trends.ts
var MarketService = class {
  marketTrends = /* @__PURE__ */ new Map();
  // Key: genreId or genreId_subGenreId
  genres = /* @__PURE__ */ new Map();
  // Load from game data
  subGenres = /* @__PURE__ */ new Map();
  // Load from game data
  roll;
  /** Seeded (#52): no Math.random, so the same seed always builds the same market. */
  constructor(initialGenres, initialSubGenres, seed = "mechanics-market") {
    this.roll = createSeededRandom(`market:${seed}`);
    initialGenres.forEach((genre) => this.genres.set(genre.id, genre));
    initialSubGenres.forEach((subGenre) => this.subGenres.set(subGenre.id, subGenre));
    this.initializeMarketTrends();
  }
  initializeMarketTrends() {
    this.genres.forEach((genre) => {
      this.getOrCreateTrend(genre.id);
    });
    this.subGenres.forEach((subGenre) => {
      this.getOrCreateTrend(subGenre.mainGenreId, subGenre.id);
    });
  }
  getTrendKey(genreId, subGenreId) {
    return subGenreId ? `${genreId}_${subGenreId}` : genreId;
  }
  getOrCreateTrend(genreId, subGenreId) {
    const key2 = this.getTrendKey(genreId, subGenreId);
    if (!this.marketTrends.has(key2)) {
      this.marketTrends.set(key2, {
        genreId,
        subGenreId,
        popularity: Math.floor(this.roll() * 70) + 15,
        // Initial popularity 15-85
        trendDirection: ["rising", "stable", "falling"][Math.floor(this.roll() * 3)],
        lastUpdated: 0
        // Assuming game time starts at 0
      });
    }
    return this.marketTrends.get(key2);
  }
  /**
   * Updates market trends based on various factors.
   * This would be called periodically by the game loop.
   * @param currentTime - Current game time.
   * @param successfulReleases - Array of recent successful player releases.
   * @param globalEvents - Array of active global events affecting trends.
   */
  updateMarketTrends(currentTime, successfulReleases, globalEvents) {
    this.marketTrends.forEach((trend) => {
      let popularityChange = 0;
      if (trend.trendDirection === "rising") {
        popularityChange += this.roll() * 2;
      } else if (trend.trendDirection === "falling") {
        popularityChange -= this.roll() * 2;
      }
      popularityChange += (this.roll() - 0.5) * 1;
      successfulReleases?.forEach((release) => {
        if (release.genreId === trend.genreId && release.subGenreId === trend.subGenreId) {
          popularityChange += release.impact;
        }
      });
      globalEvents?.forEach((event) => {
        if (event.genreId === trend.genreId && event.subGenreId === trend.subGenreId) {
          popularityChange += event.effect;
        }
      });
      trend.popularity = Math.max(0, Math.min(100, trend.popularity + popularityChange));
      trend.lastUpdated = currentTime;
      if (popularityChange > 1.5 && trend.popularity < 90) {
        trend.trendDirection = "rising";
      } else if (popularityChange < -1.5 && trend.popularity > 10) {
        trend.trendDirection = "falling";
      } else if (Math.abs(popularityChange) <= 0.5 || trend.popularity >= 90 || trend.popularity <= 10) {
        trend.trendDirection = "stable";
      }
    });
  }
  /**
   * Gets the current popularity for a specific genre/subgenre.
   */
  getPopularity(genreId, subGenreId) {
    const trend = this.marketTrends.get(this.getTrendKey(genreId, subGenreId));
    return trend ? trend.popularity : 0;
  }
  /**
   * Gets the full market trend details for a specific genre/subgenre.
   */
  getMarketTrend(genreId, subGenreId) {
    return this.marketTrends.get(this.getTrendKey(genreId, subGenreId));
  }
  /**
   * Gets all current market trends.
   */
  getAllMarketTrends() {
    return Array.from(this.marketTrends.values());
  }
};

// src/rpg/staffCareer.ts
var DISCIPLINES = ["recording", "mixing", "production", "technical"];
var SENIORITY_ORDER = ["junior", "regular", "senior", "lead"];
var DISCIPLINE_LABEL = {
  recording: "Recording",
  mixing: "Mixing",
  production: "Production",
  technical: "Technical"
};
var CAREER_LEVEL_XP = [0, 30, 80, 150, 250, 400];
var CREDIT_LOG_CAP = 12;
var levelFor = (xp) => {
  let level = 0;
  for (let i = 1; i < CAREER_LEVEL_XP.length; i++) if (xp >= CAREER_LEVEL_XP[i]) level = i;
  return level;
};
var num = (v) => typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
function defaultDiscipline(staff) {
  if (staff.role === "Producer" || staff.role === "Songwriter") return "production";
  const mixing = staff.skills?.mixing?.level ?? 0;
  const tracking = staff.skills?.tracking?.level ?? 0;
  return mixing > tracking ? "mixing" : "recording";
}
function getStaffCareer(staff) {
  const raw = staff.career;
  const active = raw && DISCIPLINES.includes(raw.activeDiscipline) ? raw.activeDiscipline : defaultDiscipline(staff);
  const experience = DISCIPLINES.map((discipline) => {
    const found = raw?.experience?.find((e) => e?.discipline === discipline);
    const xp = num(found?.xp);
    return { discipline, xp, level: levelFor(xp), creditedSessions: num(found?.creditedSessions) };
  });
  const seniority = raw && SENIORITY_ORDER.includes(raw.seniority) ? raw.seniority : (staff.levelInRole ?? 1) >= 3 ? "regular" : "junior";
  const secondary = raw?.secondaryDiscipline && DISCIPLINES.includes(raw.secondaryDiscipline) && raw.secondaryDiscipline !== active ? raw.secondaryDiscipline : void 0;
  return {
    activeDiscipline: active,
    experience,
    seniority,
    credited: Array.isArray(raw?.credited) ? raw.credited.filter((x) => typeof x === "string").slice(-CREDIT_LOG_CAP) : [],
    ...secondary ? { secondaryDiscipline: secondary } : {},
    crossTrained: num(raw?.crossTrained),
    ...typeof raw?.mentorId === "string" && raw.mentorId ? { mentorId: raw.mentorId } : {}
  };
}
var disciplineForStage = (stageName) => {
  const n2 = stageName.toLowerCase();
  if (n2.includes("master") || n2.includes("mix")) return "mixing";
  if (n2.includes("produc") || n2.includes("arrang") || n2.includes("overdub") || n2.includes("vocal") || n2.includes("song")) return "production";
  if (n2.includes("setup") || n2.includes("maint") || n2.includes("repair") || n2.includes("calibr")) return "technical";
  return "recording";
};
var experienceIn = (career, d) => career.experience.find((e) => e.discipline === d);
function careerFitBonus(staff, stageName) {
  const career = getStaffCareer(staff);
  const d = disciplineForStage(stageName);
  const exp = experienceIn(career, d);
  const rank2 = SENIORITY_ORDER.indexOf(career.seniority);
  const onActive = d === career.activeDiscipline;
  const onSecondary = d === career.secondaryDiscipline;
  const points = Math.min(10, exp.level * 1.5 + (onActive ? rank2 * 1.5 : onSecondary ? rank2 * 0.75 : 0));
  if (points <= 0) return { points: 0 };
  const who = onActive && rank2 >= 2 ? `${career.seniority} ` : "";
  return { points, reason: `${who}${DISCIPLINE_LABEL[d].toLowerCase()} experience (level ${exp.level})` };
}

// src/utils/studioRoomUtils.ts
var inferProjectStageKind = (project) => {
  const stage2 = project.stages?.[project.currentStageIndex || 0];
  const name = stage2?.stageName?.toLowerCase() || "";
  if (name.includes("master")) return "mastering";
  if (name.includes("mix")) return "mixing";
  if (name.includes("record") || name.includes("tracking") || name.includes("vocal") || name.includes("mic") || name.includes("setup")) return "tracking";
  if (name.includes("production") || name.includes("arrangement") || name.includes("composition") || name.includes("sound design") || name.includes("layer")) return "production";
  return "general";
};

// src/utils/staffFitUtils.ts
var getStageSkill = (staff, project) => {
  const stageName = project.stages?.[project.currentStageIndex || 0]?.stageName?.toLowerCase() || "";
  const kind = inferProjectStageKind(project);
  let skillName;
  if (stageName.includes("vocal")) {
    skillName = "vocalComping";
  } else if (kind === "mastering") {
    skillName = "mastering";
  } else if (kind === "mixing") {
    skillName = "mixing";
  } else if (kind === "tracking") {
    skillName = "tracking";
  } else if (stageName.includes("sound design") || project.genre.toLowerCase() === "electronic") {
    skillName = "soundDesign";
  } else if (stageName.includes("sample") || project.genre.toLowerCase() === "hip-hop") {
    skillName = "sampleWarping";
  } else {
    skillName = "songwriting";
  }
  return {
    name: skillName,
    level: staff.skills[skillName]?.level || 0
  };
};
var calculateStaffProjectFit = (staff, project) => {
  const stageSkill = getStageSkill(staff, project);
  const baseStat = (staff.primaryStats.creativity + staff.primaryStats.technical + staff.primaryStats.speed) / 3;
  const genreBonus = staff.genreAffinity?.genre.toLowerCase() === project.genre.toLowerCase() ? staff.genreAffinity.bonus : 0;
  const clientSessions = project.clientId && staff.clientFamiliarity ? staff.clientFamiliarity[project.clientId] || 0 : 0;
  const readiness = Math.max(
    0.15,
    Math.min(1, staff.energy / 100 * 0.6 + staff.mood / 100 * 0.4)
  );
  const roleBonus = staff.role === "Engineer" && ["tracking", "mixing", "mastering"].includes(inferProjectStageKind(project)) || staff.role === "Producer" && inferProjectStageKind(project) === "production" || staff.role === "Songwriter" && stageSkill.name === "songwriting" ? 8 : 0;
  const familiarityBonus = Math.min(10, clientSessions * 2);
  const career = careerFitBonus(staff, project.stages?.[project.currentStageIndex || 0]?.stageName ?? "");
  const rawScore = baseStat * 0.45 + stageSkill.level * 7 + genreBonus * 0.35 + roleBonus + familiarityBonus + career.points;
  const score = Math.max(1, Math.min(100, Math.round(rawScore * readiness)));
  const reasons = [
    `${stageSkill.name} ${stageSkill.level}`,
    ...genreBonus > 0 ? [`${project.genre} affinity +${genreBonus}%`] : [],
    ...career.reason ? [career.reason] : [],
    ...clientSessions > 0 ? [`${clientSessions} prior client session${clientSessions === 1 ? "" : "s"}`] : [],
    `${Math.round(staff.energy)}% energy`,
    `${Math.round(staff.mood)}% mood`
  ];
  return {
    score,
    stageSkill: stageSkill.name,
    stageSkillLevel: stageSkill.level,
    genreBonus,
    clientSessions,
    readiness,
    reasons
  };
};

// tests/market-demand.check.ts
var n = 0;
var ok = (c2, m) => {
  if (!c2) throw new Error(`FAIL: ${m}`);
  n++;
  console.log(`PASS: ${m}`);
};
ok(weekStartDay(0) === 0 && weekStartDay(6) === 0 && weekStartDay(7) === 7 && weekStartDay(20) === 14, "weeks start every seven days");
var genres = ["Pop", "Rock", "Hip-Hop", "Electronic", "Country", "Jazz"];
var snap = (seed, day) => JSON.stringify(genres.map((g2) => genreDemand(seed, day, g2)));
ok(snap(5, 21) === snap(5, 21), "same save and day give the same demand (reload safe)");
ok(snap(5, 21) === snap(5, 21 + MARKET_WEEK_DAYS - 1), "demand does not move inside a week");
var moved = false;
for (let d = 7; d <= 140 && !moved; d += 7) if (snap(5, d) !== snap(5, 0)) moved = true;
ok(moved, "demand moves between weeks");
ok(snap(5, 70) !== snap(6, 70), "a different save has a different market");
var allBounded = true;
for (let d = 0; d <= 700; d += 7) for (const g2 of genres) {
  const s = genreDemand(9, d, g2);
  const w = enquiryDemandWeight(9, d)(g2);
  if (s < -1 || s > 1 || w < 1 - ENQUIRY_DEMAND_SWING - 1e-9 || w > 1 + ENQUIRY_DEMAND_SWING + 1e-9) allBounded = false;
  if (Math.abs(releaseDemandPoints(9, d, g2)) > RELEASE_DEMAND_POINTS) allBounded = false;
}
ok(allBounded, "demand, enquiry weight and release points stay inside their bounds over 100 weeks");
ok(genreDemand(9, 70, "Folk") === 0 && enquiryDemandWeight(9, 70)("Folk") === 1, "a genre the market does not model is neutral");
ok(genreDemand(void 0, 70, "Pop") === 0 && enquiryDemandWeight(void 0, 70)("Pop") === 1 && industryPulse(void 0, 5).length === 0, "a save with no seed is neutral");
var seen = {};
for (let seed = 1; seed <= 12; seed++) for (let d = 0; d <= 700; d += 7) for (const g2 of genres) {
  const s = genreDemand(seed, d, g2);
  const cur = seen[g2] ??= [false, false];
  if (s > 0.3) cur[0] = true;
  if (s < -0.3) cur[1] = true;
}
ok(genres.every((g2) => seen[g2][0] && seen[g2][1]), "every genre is sometimes hot and sometimes cold across saves");
var hotCold = (() => {
  for (let seed = 1; seed < 60; seed++) for (let d = 0; d < 400; d += 7) {
    const sc = genres.map((g2) => [g2, genreDemand(seed, d, g2)]).sort((a2, b2) => b2[1] - a2[1]);
    if (sc[0][1] > 0.6 && sc[sc.length - 1][1] < -0.6) return { seed, d, hot: sc[0][0], cold: sc[sc.length - 1][0] };
  }
  return null;
})();
ok(hotCold !== null, "the sweep finds a week with one hot and one cold genre");
if (hotCold) {
  const count = (weight) => {
    const c2 = {};
    for (let i = 0; i < 160; i++) for (const p of generateNewProjects(3, 6, "modern", [], 1, 5, void 0, weight)) c2[p.genre] = (c2[p.genre] ?? 0) + 1;
    return c2;
  };
  const w = enquiryDemandWeight(hotCold.seed, hotCold.d);
  const on = count(w);
  const eras = (on[hotCold.hot] ?? 0) + (on[hotCold.cold] ?? 0);
  const off = count();
  ok(eras === 0 || (on[hotCold.hot] ?? 0) / Math.max(1, off[hotCold.hot] ?? 1) > (on[hotCold.cold] ?? 0) / Math.max(1, off[hotCold.cold] ?? 1) - 0.05, `hot ${hotCold.hot} gains share over cold ${hotCold.cold} compared with no demand`);
  ok(Object.keys(on).length >= Object.keys(off).length - 1, "demand never removes whole genres from the board");
}
ok(outcomeBandFor.length === 2, "the outcome signature still has two required inputs");
ok(outcomeBandFor("x", 80) === outcomeBandFor("x", 80, 0), "no demand gives the original outcome");
var rank = { quiet: 0, solid: 1, breakthrough: 2, prestige: 3 };
var nudgeOk = true;
for (let i = 0; i < 200; i++) {
  const base = rank[outcomeBandFor(`r${i}`, 40 + i % 50)];
  const up = rank[outcomeBandFor(`r${i}`, 40 + i % 50, RELEASE_DEMAND_POINTS)];
  const down = rank[outcomeBandFor(`r${i}`, 40 + i % 50, -RELEASE_DEMAND_POINTS)];
  if (up < base || down > base || up - base > 1 || base - down > 1) nudgeOk = false;
  if (rank[outcomeBandFor(`r${i}`, 40 + i % 50, 999)] !== up) nudgeOk = false;
}
ok(nudgeOk, "demand moves an outcome by at most one band, in the right direction, and is clamped");
var rel = recordRelease(
  { clientId: "c", clientName: "C", primaryGenre: "Pop", relationshipXp: 0, tier: "Neutral", sessionsCompleted: 1, lastSessionDay: 1, bestQualityScore: 60, referralCount: 0 },
  { projectId: "p", title: "T", genre: "Pop", qualityScore: 75, day: 3, demandPoints: RELEASE_DEMAND_POINTS }
);
ok(rel.releases[0].outcomeBand === outcomeBandFor("p", 75, RELEASE_DEMAND_POINTS), "a recorded release uses the demand at release time");
ok(calculateStaffProjectFit.length >= 1 && !String(calculateStaffProjectFit).includes("marketDemand") && !String(calculateStaffProjectFit).includes("genreDemand"), "staff-to-project fit does not read demand");
var pulse = industryPulse(5, 70);
ok(pulse.length === 3 && pulse.every((l) => ["Rising", "Stable", "Cooling"].includes(l.word) && l.effect.length > 0), "the pulse shows three genres with a word and a plain effect");
ok(JSON.stringify(industryPulse(5, 70)) === JSON.stringify(industryPulse(5, 74)), "the pulse holds all week");
var g = [{ id: "pop", name: "Pop", description: "" }, { id: "rock", name: "Rock", description: "" }];
var a = new MarketService(g, [], 3);
var b = new MarketService(g, [], 3);
var c = new MarketService(g, [], 4);
var key = (m) => JSON.stringify(m.getAllMarketTrends());
ok(key(a) === key(b) && key(a) !== key(c), "the game-mechanics market is deterministic per seed (no Math.random)");
a.updateMarketTrends(5);
b.updateMarketTrends(5);
ok(key(a) === key(b), "its updates are deterministic too");
console.log(`market-demand: all ${n} checks passed`);
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
