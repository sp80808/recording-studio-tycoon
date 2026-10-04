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
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
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
    function ReactElement(type, key, props) {
      var refProp = props.ref;
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
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
    function escape(key) {
      var escaperLookup = { "=": "=0", ":": "=2" };
      return "$" + key.replace(/[=:]/g, function(match) {
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
        return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
          return c;
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
        var n = 0;
        mapChildren(children, function() {
          n++;
        });
        return n;
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
      var props = assign({}, element.props), key = element.key;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
          !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
      var propName = arguments.length - 2;
      if (1 === propName) props.children = children;
      else if (1 < propName) {
        for (var childArray = Array(propName), i = 0; i < propName; i++)
          childArray[i] = arguments[i + 2];
        props.children = childArray;
      }
      return ReactElement(element.type, key, props);
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
      var propName, props = {}, key = null;
      if (null != config)
        for (propName in void 0 !== config.key && (key = "" + config.key), config)
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
      return ReactElement(type, key, props);
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
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
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
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
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
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
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
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
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
        var props = assign({}, element.props), key = element.key, owner = element._owner;
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
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
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
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
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
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
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
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
        return ReactElement(
          type,
          key,
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

// tests/catalog-traits-expansion.check.ts
var import_strict = __toESM(require("node:assert/strict"), 1);

// src/data/eraEquipment.ts
var availableEquipment = [
  // === 1960s Era Equipment ===
  // Basic 1960s Microphones
  {
    id: "basic_60s_mic",
    name: 'RCA Ribbon "Velvet Elvis"',
    category: "microphone",
    price: 150,
    historicalPrice: 45,
    availableFrom: 1960,
    availableUntil: 1975,
    description: "Smooth as The King himself, warm as Memphis in July",
    eraDescription: "The go-to mic for crooners and the occasional rebel",
    bonuses: { qualityBonus: 5, genreBonus: { "Rock": 1, "Pop": 2 } },
    icon: "\u{1F3A4}",
    isVintage: true,
    condition: 100
  },
  {
    id: "dynamic_60s_mic",
    name: "Shure SM-Surely-You-Jest 57",
    category: "microphone",
    price: 85,
    historicalPrice: 25,
    availableFrom: 1965,
    description: "Indestructible as Keith Richards, sounds almost as good",
    eraDescription: "Perfect for loud amps and louder personalities",
    bonuses: { qualityBonus: 8, genreBonus: { "Rock": 3, "Blues": 2 } },
    icon: "\u{1F3A4}",
    isVintage: true,
    condition: 100
  },
  // 1960s Recording Equipment
  {
    id: "tape_machine_4track",
    name: 'Tascam "Track-or-Treat" 4-Track',
    category: "instrument",
    price: 800,
    historicalPrice: 240,
    availableFrom: 1967,
    availableUntil: 1985,
    description: "Four whole tracks! The Beatles only needed this much",
    eraDescription: "Revolutionary multi-track recording for the masses",
    bonuses: { qualityBonus: 15, technicalBonus: 10, speedBonus: -5 },
    icon: "\u{1F4FC}",
    isVintage: true,
    condition: 100
  },
  {
    id: "mixing_board_60s",
    name: 'Neve "Never-Enough-Knobs" 1073',
    category: "outboard",
    price: 2500,
    historicalPrice: 750,
    availableFrom: 1970,
    description: "More knobs than NASA, sounds like heaven",
    eraDescription: "The sound of classic rock was born on this board",
    bonuses: { qualityBonus: 30, technicalBonus: 20, genreBonus: { "Rock": 4, "Pop": 3 } },
    icon: "\u{1F39B}\uFE0F",
    skillRequirement: { skill: "Rock", level: 3 },
    isVintage: true,
    condition: 100
  },
  {
    id: "fender_stratocaster",
    name: "Fender Stratocaster",
    category: "instrument",
    price: 1200,
    historicalPrice: 400,
    availableFrom: 1954,
    availableUntil: 2025,
    description: "The iconic guitar that shaped rock and roll",
    eraDescription: "A versatile instrument for any guitarist",
    bonuses: { genreBonus: { "Rock": 5, "Blues": 4, "Pop": 2 } },
    icon: "\u{1F3B8}",
    isVintage: true,
    condition: 100
  },
  {
    id: "vox_ac30",
    name: "Vox AC30",
    category: "instrument",
    price: 1500,
    historicalPrice: 500,
    availableFrom: 1958,
    availableUntil: 2025,
    description: "The amp that defined the British Invasion",
    eraDescription: "The sound of the Beatles and the Rolling Stones",
    bonuses: { genreBonus: { "Rock": 5, "Pop": 3, "Blues": 4 } },
    icon: "\u{1F3B8}",
    isVintage: true,
    condition: 100
  },
  {
    id: "telefunken_u47",
    name: "Telefunken U47",
    category: "microphone",
    price: 3e3,
    historicalPrice: 1e3,
    availableFrom: 1946,
    availableUntil: 1970,
    description: "A legendary microphone known for its warm and smooth sound",
    eraDescription: "A studio staple for vocals and instruments",
    bonuses: { qualityBonus: 40, genreBonus: { "Rock": 4, "Pop": 3, "Jazz": 5 } },
    icon: "\u{1F3A4}",
    isVintage: true,
    condition: 100
  },
  {
    id: "fairchild_660",
    name: "Fairchild 660",
    category: "outboard",
    price: 5e3,
    historicalPrice: 1500,
    availableFrom: 1959,
    availableUntil: 1975,
    description: "A legendary compressor known for its smooth and warm sound",
    eraDescription: "A studio staple for vocals and instruments",
    bonuses: { qualityBonus: 35, technicalBonus: 15, genreBonus: { "Rock": 4, "Pop": 3, "Jazz": 5 } },
    icon: "\u2699\uFE0F",
    isVintage: true,
    condition: 100
  },
  {
    id: "les_paul",
    name: "Gibson Les Paul",
    category: "instrument",
    price: 1300,
    historicalPrice: 450,
    availableFrom: 1952,
    availableUntil: 2025,
    description: "A classic electric guitar known for its sustain and thick tone",
    eraDescription: "A favorite among rock and blues guitarists",
    bonuses: { genreBonus: { "Rock": 5, "Blues": 4, "Pop": 2 } },
    icon: "\u{1F3B8}",
    isVintage: true,
    condition: 100
  },
  {
    id: "altec_604e",
    name: 'Altec "All-Tech-No-Soul" 604E',
    category: "monitor",
    price: 400,
    historicalPrice: 120,
    availableFrom: 1960,
    availableUntil: 1980,
    description: "Big, bold, and occasionally accurate",
    eraDescription: "The sound of classic studio monitoring",
    bonuses: { qualityBonus: 10, technicalBonus: 5 },
    icon: "\u{1F50A}",
    isVintage: true,
    condition: 100
  },
  {
    id: "urei_1176_compressor",
    name: 'UREI 1176 "Limiting Amplifier"',
    category: "outboard",
    price: 2200,
    historicalPrice: 700,
    availableFrom: 1967,
    availableUntil: 1990,
    // Can still be found later as vintage
    description: "The legendary FET compressor. Fast, punchy, and versatile. A studio workhorse.",
    eraDescription: "Revolutionized audio dynamics processing with its quick response.",
    bonuses: { qualityBonus: 28, technicalBonus: 22, genreBonus: { "Rock": 3, "Pop": 2, "Hip-Hop": 2 } },
    icon: "\u{1F39B}\uFE0F",
    skillRequirement: { skill: "Rock", level: 2 },
    isVintage: true,
    condition: 100
  },
  {
    id: "emt_140_plate_reverb",
    name: 'EMT 140 "Plate Mail" Reverb',
    category: "outboard",
    price: 4500,
    historicalPrice: 1500,
    availableFrom: 1960,
    // EMT 140 was introduced in 1957, widely used in 60s
    availableUntil: 1980,
    description: "A massive metal plate that creates iconic, smooth reverb. Requires its own room (almost).",
    eraDescription: "The gold standard for reverb in the 60s and 70s.",
    bonuses: { qualityBonus: 30, creativityBonus: 20, genreBonus: { "Pop": 3, "Rock": 2, "Acoustic": 3 } },
    icon: "\u2699\uFE0F",
    // Using gear icon for outboard
    skillRequirement: { skill: "Acoustic", level: 3 },
    isVintage: true,
    condition: 100
  },
  {
    id: "fairchild_670_compressor",
    name: 'Fairchild 670 "Holy Grail" Compressor',
    category: "outboard",
    price: 7500,
    historicalPrice: 2500,
    availableFrom: 1962,
    // Approx, following the 660
    availableUntil: 1980,
    description: "The ultimate stereo tube compressor. Incredibly rare and sought after for its smooth, warm sound.",
    eraDescription: "A legend in studios, known for its musicality on vocals and full mixes.",
    bonuses: { qualityBonus: 40, technicalBonus: 25, creativityBonus: 10, genreBonus: { "Pop": 4, "Rock": 3, "Jazz": 4 } },
    icon: "\u2699\uFE0F",
    skillRequirement: { skill: "Pop", level: 4 },
    isVintage: true,
    condition: 100
  },
  // === 1970s Era Equipment ===
  {
    id: "moog_modular",
    name: 'Moog "Mod-ular-Disaster" System',
    category: "instrument",
    price: 3500,
    historicalPrice: 1200,
    availableFrom: 1970,
    availableUntil: 1985,
    description: "More cables than a telephone exchange, sounds like the future",
    eraDescription: "Synthesized sounds that make people question reality",
    bonuses: { creativityBonus: 25, genreBonus: { "Electronic": 5, "Rock": 3, "Pop": 2 } },
    icon: "\u{1F3B9}",
    skillRequirement: { skill: "Electronic", level: 2 },
    isVintage: true,
    condition: 100
  },
  {
    id: "ssl_4000_console",
    name: 'SSL 4000 "Hit Maker" Console',
    category: "mixer",
    // New category, ensure it's added to equipmentCategories
    price: 15e4,
    historicalPrice: 5e4,
    availableFrom: 1976,
    availableUntil: 1995,
    description: "The console that defined the sound of the 80s. Punchy EQs and the famous bus compressor.",
    eraDescription: "A game-changer in mixing technology, heard on countless hit records.",
    bonuses: { qualityBonus: 50, technicalBonus: 40, speedBonus: 20, genreBonus: { "Pop": 5, "Rock": 4, "Hip-Hop": 3 } },
    icon: "\u{1F39A}\uFE0F",
    // Mixer icon
    skillRequirement: { skill: "Pop", level: 5 },
    isVintage: true,
    condition: 100
  },
  {
    id: "lexicon_224_reverb_70s",
    name: 'Lexicon 224 "Hall Of Fame" Reverb (Early)',
    category: "outboard",
    price: 5500,
    historicalPrice: 1800,
    availableFrom: 1978,
    // Original Lexicon 224
    availableUntil: 1988,
    // Superseded by later models like 224X/L
    description: "The pioneering digital reverb that brought lush halls and plates to studios worldwide.",
    eraDescription: "One of the first commercially successful digital reverbs, defining spacious sounds.",
    bonuses: { qualityBonus: 30, creativityBonus: 25, genreBonus: { "Pop": 3, "Electronic": 3, "Rock": 2 } },
    icon: "\u2699\uFE0F",
    skillRequirement: { skill: "Electronic", level: 3 },
    isVintage: true,
    condition: 100
  },
  {
    id: "rhodes_stage_piano",
    name: 'Rhodes "Roads-Less-Travelled" Stage Piano',
    category: "instrument",
    price: 1800,
    historicalPrice: 650,
    availableFrom: 1970,
    availableUntil: 1985,
    description: "Bell-like electric piano tone with enough bark to cut through a live band.",
    eraDescription: "A studio staple for soul, jazz fusion and soft rock sessions.",
    bonuses: { creativityBonus: 16, genreBonus: { "Soul": 4, "Jazz": 4, "Pop": 2 } },
    icon: "\u{1F3B9}",
    skillRequirement: { skill: "Jazz", level: 2 },
    isVintage: true,
    condition: 100
  },
  {
    id: "dbx_160_compressor",
    name: 'DBX 160 "Thump Wrangler"',
    category: "outboard",
    price: 950,
    historicalPrice: 330,
    availableFrom: 1976,
    description: "A fast VCA compressor that keeps bass and drums firmly in the pocket.",
    eraDescription: "Compact, practical dynamics control for the late-70s control room.",
    bonuses: { qualityBonus: 14, technicalBonus: 12, genreBonus: { "Rock": 2, "Soul": 3 } },
    icon: "\u2699\uFE0F",
    isVintage: true,
    condition: 100
  },
  // === 1980s Era Equipment ===
  {
    id: "drum_machine_808",
    name: 'Roland TR-"Ate-Oh-Ate"',
    category: "instrument",
    price: 1200,
    historicalPrice: 400,
    availableFrom: 1980,
    description: "The boom-bap that launched a thousand careers",
    eraDescription: "Hip-hop's best friend and pop music's secret weapon",
    bonuses: { genreBonus: { "Hip-Hop": 5, "Pop": 3, "Electronic": 4 }, speedBonus: 15 },
    icon: "\u{1F941}",
    skillRequirement: { skill: "Hip-Hop", level: 1 },
    isVintage: true,
    condition: 100
  },
  {
    id: "digital_delay",
    name: 'Lexicon "Lex-Icon" 224',
    category: "outboard",
    price: 6e3,
    historicalPrice: 2e3,
    availableFrom: 1982,
    description: "Digital reverb so good it makes Phil Collins cry",
    eraDescription: "The sound of the 80s: gated, reverbed, and proud of it",
    bonuses: { qualityBonus: 25, genreBonus: { "Pop": 4, "Rock": 3, "New Wave": 5 }, creativityBonus: 15 },
    icon: "\u2699\uFE0F",
    skillRequirement: { skill: "Pop", level: 2 },
    isVintage: true,
    condition: 100
  },
  {
    id: "dx7_synth",
    name: 'Yamaha "Digital Native" DX7',
    category: "instrument",
    price: 2100,
    historicalPrice: 900,
    availableFrom: 1983,
    availableUntil: 1995,
    description: "Glassy FM keys, rubbery basses and a menu system that rewards patience.",
    eraDescription: "The defining affordable digital synthesizer of mid-80s pop.",
    bonuses: { creativityBonus: 18, speedBonus: 8, genreBonus: { "Pop": 4, "Electronic": 4, "R&B": 2 } },
    icon: "\u{1F3B9}",
    skillRequirement: { skill: "Electronic", level: 2 },
    isVintage: true,
    condition: 100
  },
  // === 1990s Era Equipment ===
  {
    id: "sampler_mpc",
    name: 'Akai MPC "Most-Precious-Child"',
    category: "instrument",
    price: 2500,
    historicalPrice: 1e3,
    availableFrom: 1990,
    description: "Turns any sound into a beat, any beat into art",
    eraDescription: "Hip-hop production revolutionized with 16 pads of power",
    bonuses: { genreBonus: { "Hip-Hop": 6, "R&B": 4, "Electronic": 3 }, creativityBonus: 20, speedBonus: 10 },
    icon: "\u{1F39B}\uFE0F",
    skillRequirement: { skill: "Hip-Hop", level: 2 },
    isVintage: true,
    condition: 100
  },
  {
    id: "daw_protools",
    name: 'Pro Tools "Amateur-Drools"',
    category: "software",
    price: 8e3,
    historicalPrice: 3e3,
    availableFrom: 1995,
    description: "Digital audio workstation that makes editing magical and budgets disappear",
    eraDescription: "The industry standard that changed everything",
    bonuses: { speedBonus: 30, technicalBonus: 25, qualityBonus: 20 },
    icon: "\u{1F4BB}",
    skillRequirement: { skill: "Pop", level: 3 },
    condition: 100
  },
  {
    id: "adat_8track",
    name: 'ADAT "Eight-Is-Enough" Recorder',
    category: "recorder",
    price: 3200,
    historicalPrice: 1600,
    availableFrom: 1992,
    availableUntil: 2008,
    description: "Eight tracks of digital tape that can be chained when eight is suddenly not enough.",
    eraDescription: "Made project-studio digital multitracking practical in the 1990s.",
    bonuses: { qualityBonus: 16, technicalBonus: 14, speedBonus: 10 },
    icon: "\u{1F4FC}",
    isVintage: true,
    condition: 100
  },
  // === 2000s Era Equipment ===
  {
    id: "autotune_original",
    name: 'Auto-Tune "Robotic-Crooner"',
    category: "software",
    price: 400,
    availableFrom: 2e3,
    description: "Makes everyone sound like a cyborg, for better or worse",
    eraDescription: "The plugin that divided the music world in half",
    bonuses: { genreBonus: { "Pop": 4, "Hip-Hop": 3, "R&B": 5 }, speedBonus: 20, creativityBonus: -5 },
    icon: "\u{1F916}",
    skillRequirement: { skill: "Pop", level: 1 },
    condition: 100
  },
  {
    id: "midi_controller",
    name: 'M-Audio "M-Eh-dio" Keystation',
    category: "instrument",
    price: 200,
    availableFrom: 2002,
    description: "More keys than a janitor, less soul than expected",
    eraDescription: "MIDI controller for the digital music revolution",
    bonuses: { speedBonus: 15, genreBonus: { "Electronic": 2, "Pop": 2 } },
    icon: "\u{1F3B9}",
    condition: 100
  },
  {
    id: "small_diaphragm_pair",
    name: 'Matched "Tiny Giants" Condenser Pair',
    category: "microphone",
    price: 900,
    availableFrom: 2004,
    description: "A matched stereo pair for acoustic instruments, overheads and honest room detail.",
    eraDescription: "Project studios embrace affordable stereo recording without hiring a second mortgage.",
    bonuses: { qualityBonus: 14, technicalBonus: 8, genreBonus: { "Acoustic": 4, "Jazz": 2 } },
    icon: "\u{1F3A4}",
    skillRequirement: { skill: "Acoustic", level: 2 },
    condition: 100
  },
  // === Modern Era Equipment (2010+) ===
  // Basic modern equipment (available from start in modern era)
  {
    id: "basic_mic",
    name: 'Audio-Technica "Audio-Pathetic-a" AT2020',
    category: "microphone",
    price: 100,
    availableFrom: 2010,
    description: "Entry-level condenser that punches above its weight class",
    bonuses: { qualityBonus: 5 },
    icon: "\u{1F3A4}",
    condition: 100
  },
  {
    id: "basic_monitors",
    name: 'KRK "Kinda-Reliable-Kinda" Rokits',
    category: "monitor",
    price: 300,
    availableFrom: 2010,
    description: "Yellow cones that make everything sound... yellow",
    bonuses: { qualityBonus: 10 },
    icon: "\u{1F50A}",
    condition: 100
  },
  {
    id: "basic_interface",
    name: 'Focusrite "Focus-Wrong" Scarlett Solo',
    category: "interface",
    price: 120,
    availableFrom: 2012,
    description: "Red hot interface for red hot takes",
    bonuses: { qualityBonus: 8, speedBonus: 5 },
    icon: "\u{1F50C}",
    condition: 100
  },
  // Premium modern equipment
  {
    id: "neumann_u87",
    name: 'Neumann U87 "Uber-Expensive-Mic"',
    category: "microphone",
    price: 3500,
    availableFrom: 2015,
    description: "The microphone that costs more than your car and sounds better than your voice",
    bonuses: { qualityBonus: 40, genreBonus: { "Pop": 5, "R&B": 5, "Jazz": 4 }, creativityBonus: 15 },
    icon: "\u{1F3A4}",
    skillRequirement: { skill: "Pop", level: 4 },
    condition: 100
  },
  {
    id: "genelec_monitors",
    name: 'Genelec "Generic-Lech" 8040A',
    category: "monitor",
    price: 2e3,
    availableFrom: 2018,
    description: "Finnish precision engineering that reveals every flaw in your mix",
    bonuses: { qualityBonus: 35, technicalBonus: 25 },
    icon: "\u{1F50A}",
    skillRequirement: { skill: "Electronic", level: 3 },
    condition: 100
  },
  {
    id: "modern_daw",
    name: 'Ableton Live "Able-to-Confuse"',
    category: "software",
    price: 750,
    availableFrom: 2020,
    description: "DAW that makes electronic music creation feel like playing Tetris",
    bonuses: { speedBonus: 25, genreBonus: { "Electronic": 4, "Hip-Hop": 3, "Pop": 2 }, creativityBonus: 20 },
    icon: "\u{1F4BB}",
    skillRequirement: { skill: "Electronic", level: 2 },
    condition: 100
  },
  // Streaming era equipment
  {
    id: "podcast_setup",
    name: 'PodMic "Pod-People-Approved"',
    category: "microphone",
    price: 250,
    availableFrom: 2020,
    description: "Because everyone has a podcast now, apparently",
    bonuses: { genreBonus: { "Spoken Word": 6, "Pop": 1 }, speedBonus: 10 },
    icon: "\u{1F399}\uFE0F",
    condition: 100
  },
  {
    id: "ai_mastering",
    name: 'LANDR "Land-of-Confusion" AI Mastering',
    category: "software",
    price: 200,
    availableFrom: 2022,
    description: "AI that masters your tracks while slowly planning world domination",
    bonuses: { speedBonus: 50, qualityBonus: 15, creativityBonus: -10 },
    icon: "\u{1F916}",
    condition: 100
  }
];
var getAvailableEquipmentForYear = (year) => {
  return availableEquipment.filter((equipment) => {
    const availableFrom = equipment.availableFrom <= year;
    const notObsolete = equipment.availableUntil ? equipment.availableUntil >= year : true;
    return availableFrom && notObsolete;
  });
};

// src/data/equipmentArt.ts
var ART_SOURCE_PACKS = [
  {
    pack: "Kenney Generic Items (160 items, instruments + tools)",
    url: "https://opengameart.org/content/generic-items",
    license: "CC0",
    author: "Kenney (kenney.nl)",
    notes: "Guitar, electric guitar, keyboard, drum, tambourine, violin. Base for all instrument sprites."
  },
  {
    pack: "OGA Misc and Tool Items",
    url: "https://opengameart.org/content/misc-and-tool-items",
    license: "CC0",
    author: "OpenGameArt contributors",
    notes: "Guitars, keyboards, misc studio tools. Alt silhouettes for instruments."
  },
  {
    pack: "OGA Hifi System (pixel art components)",
    url: "https://opengameart.org/content/hifi-system",
    license: "CC0",
    author: "OpenGameArt contributor",
    notes: "receiver.png, equalizer.png, tape-deck.png, turntable.png, speaker_closed.png. Base for outboard / monitor / interface / recorder sprites."
  },
  {
    pack: "OGA Instrument Pixel Art (CC0)",
    url: "https://opengameart.org/content/instrument-pixel-art-cco",
    license: "CC0",
    author: "KaliYuga (OGA)",
    notes: "Supplemental instrument icons. Alt variants for synths / drum machines."
  },
  {
    pack: "Kenney Game Icons (105 icons, black+white)",
    url: "https://opengameart.org/content/game-icons",
    license: "CC0",
    author: "Kenney (kenney.nl)",
    notes: "Audio, settings, star, trophy icons. Base for software / plugin sprites."
  },
  {
    pack: "Kenney Digital Audio (SFX pack)",
    url: "https://kenney.nl/assets/digital-audio",
    license: "CC0",
    author: "Kenney (kenney.nl)",
    notes: "Audio reference only \u2014 no sprites taken. Listed so audio + visual sources stay in one log."
  },
  {
    pack: "Kenney Furniture Kit + Roguelike Indoor pack",
    url: "https://kenney.nl/assets/furniture-kit",
    license: "CC0",
    author: "Kenney (kenney.nl)",
    notes: "Room dressing (desks, racks, shelves). NOT per-item art \u2014 used for studio background layers."
  }
];
var STOCK = { id: "stock", label: "Stock", cssFilter: "none", unlock: "Owned" };
var ROADWORN = {
  id: "roadworn",
  label: "Roadworn",
  cssFilter: "sepia(0.35) contrast(0.95) brightness(0.92)",
  unlock: "Condition < 60 or Yard-Sale find"
};
var STUDIO_BLACK = {
  id: "studio-black",
  label: "Studio Black",
  cssFilter: "brightness(0.55) saturate(1.4) hue-rotate(-10deg)",
  unlock: "Studio Level 3"
};
var TUBE_GLOW = {
  id: "tube-glow",
  label: "Tube Glow",
  cssFilter: "saturate(1.6) brightness(1.1) drop-shadow(0 0 6px rgba(251,191,36,0.8))",
  unlock: "Apply tube-stage mod"
};
var NEON_SKIN = {
  id: "neon-skin",
  label: "Neon Skin",
  cssFilter: "saturate(2) hue-rotate(140deg) brightness(1.05)",
  unlock: "Collect 5 stickers (roadmap)"
};
function entry(equipmentId, category, sprite, fallbackIcon, tint, source, spriteAlts = [], variants = [STOCK, ROADWORN, STUDIO_BLACK]) {
  return {
    equipmentId,
    category,
    sprite,
    spriteAlts,
    fallbackIcon,
    tint,
    source,
    variants,
    wearSupport: true,
    emblemSlot: category !== "software"
  };
}
var [KENNEY_GENERIC, OGA_MISC_TOOL, OGA_HIFI, OGA_INSTR, KENNEY_ICONS] = [
  ART_SOURCE_PACKS[0],
  ART_SOURCE_PACKS[1],
  ART_SOURCE_PACKS[2],
  ART_SOURCE_PACKS[3],
  ART_SOURCE_PACKS[4]
];
var EQUIPMENT_ART_MAP = {
  // ---- Microphones (OGA Hifi turntable/mic stand + Kenney generic mic shapes) ----
  basic_mic: entry("basic_mic", "microphone", "assets/items/item_microphone.png", "\u{1F3A4}", "#94a3b8", OGA_HIFI, ["assets/items/item_microphone_alt_condenser.png"]),
  basic_60s_mic: entry("basic_60s_mic", "microphone", "assets/items/item_microphone_ribbon.png", "\u{1F3A4}", "#d6a35c", OGA_HIFI, ["assets/items/item_microphone.png"], [STOCK, ROADWORN, TUBE_GLOW]),
  dynamic_60s_mic: entry("dynamic_60s_mic", "microphone", "assets/items/item_microphone.png", "\u{1F3A4}", "#a8a29e", OGA_HIFI),
  shurely_serious_mic: entry("shurely_serious_mic", "microphone", "assets/items/item_microphone.png", "\u{1F3A4}", "#78716c", OGA_HIFI),
  condenser_mic: entry("condenser_mic", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F3A4}", "#38bdf8", OGA_HIFI, ["assets/items/item_microphone.png"], [STOCK, ROADWORN, TUBE_GLOW]),
  dynamic_mic: entry("dynamic_mic", "microphone", "assets/items/item_microphone.png", "\u{1F3A4}", "#64748b", OGA_HIFI),
  neumann_u_wish: entry("neumann_u_wish", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F3A4}", "#e2e8f0", OGA_HIFI, ["assets/items/item_microphone_ribbon.png"], [STOCK, TUBE_GLOW, STUDIO_BLACK]),
  ribbon_vintage_mic: entry("ribbon_vintage_mic", "microphone", "assets/items/item_microphone_ribbon.png", "\u{1F3A4}", "#f59e0b", OGA_HIFI, [], [STOCK, ROADWORN, TUBE_GLOW]),
  telefunken_u47: entry("telefunken_u47", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F3A4}", "#fbbf24", OGA_HIFI, [], [STOCK, TUBE_GLOW, ROADWORN]),
  neumann_u87: entry("neumann_u87", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F3A4}", "#cbd5e1", OGA_HIFI, [], [STOCK, TUBE_GLOW, STUDIO_BLACK]),
  podcast_setup: entry("podcast_setup", "microphone", "assets/items/item_microphone_podcast.png", "\u{1F399}\uFE0F", "#f472b6", KENNEY_ICONS, ["assets/items/item_microphone.png"]),
  sphere_mic_system: entry("sphere_mic_system", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F399}\uFE0F", "#22d3ee", OGA_HIFI, [], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  small_diaphragm_pair: entry("small_diaphragm_pair", "microphone", "assets/items/item_microphone_alt_condenser.png", "\u{1F3A4}", "#a3e635", OGA_HIFI, ["assets/items/item_microphone.png"]),
  // ---- Outboard / mixers / recorders (OGA Hifi receiver + equalizer + tape-deck) ----
  telefunken_around: entry("telefunken_around", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#f59e0b", OGA_HIFI),
  api_the_wiser: entry("api_the_wiser", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#38bdf8", OGA_HIFI),
  fairychild_comp: entry("fairychild_comp", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#a855f7", OGA_HIFI),
  compressor: entry("compressor", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#94a3b8", OGA_HIFI),
  ssl_console_strip: entry("ssl_console_strip", "outboard", "assets/items/item_console.png", "\u2699\uFE0F", "#22c55e", OGA_HIFI, ["assets/items/item_outboard.png"]),
  urei_1176_compressor: entry("urei_1176_compressor", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#0ea5e9", OGA_HIFI, ["assets/items/item_outboard_alt_blue.png"]),
  mixing_board_60s: entry("mixing_board_60s", "outboard", "assets/items/item_console.png", "\u{1F39B}\uFE0F", "#d6a35c", OGA_HIFI),
  fairchild_660: entry("fairchild_660", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#fbbf24", OGA_HIFI),
  fairchild_670_compressor: entry("fairchild_670_compressor", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#f59e0b", OGA_HIFI),
  emt_140_plate_reverb: entry("emt_140_plate_reverb", "outboard", "assets/items/item_outboard_plate.png", "\u2699\uFE0F", "#a8a29e", OGA_HIFI, ["assets/items/item_outboard.png"]),
  lexicon_224_reverb_70s: entry("lexicon_224_reverb_70s", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#22d3ee", OGA_HIFI),
  digital_delay: entry("digital_delay", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#06b6d4", OGA_HIFI),
  ssl_4000_console: entry("ssl_4000_console", "mixer", "assets/items/item_console_large.png", "\u{1F39A}\uFE0F", "#16a34a", OGA_HIFI, ["assets/items/item_console.png"]),
  tape_machine_4track: entry("tape_machine_4track", "instrument", "assets/items/item_tape.png", "\u{1F4FC}", "#d6a35c", OGA_HIFI, ["assets/items/item_outboard.png"]),
  mastering_chain_suite: entry("mastering_chain_suite", "outboard", "assets/items/item_console.png", "\u{1F39A}\uFE0F", "#fbbf24", OGA_HIFI, [], [STOCK, STUDIO_BLACK, NEON_SKIN]),
  dbx_160_compressor: entry("dbx_160_compressor", "outboard", "assets/items/item_outboard.png", "\u2699\uFE0F", "#e7e5e4", OGA_HIFI),
  adat_8track: entry("adat_8track", "recorder", "assets/items/item_tape.png", "\u{1F4FC}", "#64748b", OGA_HIFI, ["assets/items/item_outboard.png"]),
  // ---- Instruments (Kenney Generic Items + OGA Misc Tool Items) ----
  moog_or_less: entry("moog_or_less", "instrument", "assets/items/item_keyboard.png", "\u{1F3B9}", "#a855f7", KENNEY_GENERIC, ["assets/items/item_keyboard_alt.png"], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  moog_modular: entry("moog_modular", "instrument", "assets/items/item_keyboard_modular.png", "\u{1F3B9}", "#c084fc", KENNEY_GENERIC, ["assets/items/item_keyboard.png"]),
  synthesizer: entry("synthesizer", "instrument", "assets/items/item_keyboard.png", "\u{1F3B9}", "#8b5cf6", KENNEY_GENERIC),
  midi_controller: entry("midi_controller", "instrument", "assets/items/item_keyboard.png", "\u{1F3B9}", "#64748b", KENNEY_GENERIC),
  modular_synth_rig: entry("modular_synth_rig", "instrument", "assets/items/item_keyboard_modular.png", "\u{1F39B}\uFE0F", "#e879f9", OGA_INSTR, ["assets/items/item_keyboard.png"], [STOCK, NEON_SKIN, TUBE_GLOW]),
  fender_bender: entry("fender_bender", "instrument", "assets/items/item_guitar.png", "\u{1F3B8}", "#f97316", KENNEY_GENERIC),
  fender_stratocaster: entry("fender_stratocaster", "instrument", "assets/items/item_guitar.png", "\u{1F3B8}", "#ef4444", KENNEY_GENERIC),
  les_paul: entry("les_paul", "instrument", "assets/items/item_guitar_alt_lespaul.png", "\u{1F3B8}", "#f59e0b", KENNEY_GENERIC, ["assets/items/item_guitar.png"]),
  guitar_amp: entry("guitar_amp", "instrument", "assets/items/item_guitar_amp.png", "\u{1F3B8}", "#78716c", OGA_MISC_TOOL, ["assets/items/item_guitar.png"]),
  vox_ac30: entry("vox_ac30", "instrument", "assets/items/item_guitar_amp.png", "\u{1F3B8}", "#292524", OGA_MISC_TOOL),
  drum_machine_808: entry("drum_machine_808", "instrument", "assets/items/item_drummachine.png", "\u{1F941}", "#f43f5e", KENNEY_GENERIC, ["assets/items/item_keyboard.png"], [STOCK, NEON_SKIN, ROADWORN]),
  sampler_mpc: entry("sampler_mpc", "instrument", "assets/items/item_drummachine.png", "\u{1F39B}\uFE0F", "#94a3b8", KENNEY_GENERIC),
  rhodes_stage_piano: entry("rhodes_stage_piano", "instrument", "assets/items/item_keyboard.png", "\u{1F3B9}", "#b45309", KENNEY_GENERIC, ["assets/items/item_keyboard_alt.png"]),
  dx7_synth: entry("dx7_synth", "instrument", "assets/items/item_keyboard.png", "\u{1F3B9}", "#0ea5e9", KENNEY_GENERIC, ["assets/items/item_keyboard_alt.png"]),
  // ---- Software & plugins (Kenney Game Icons, in-house faceplates) ----
  pro_tools_shed: entry("pro_tools_shed", "software", "assets/items/item_software_daw.png", "\u{1F4BB}", "#38bdf8", KENNEY_ICONS),
  daw_protools: entry("daw_protools", "software", "assets/items/item_software_daw.png", "\u{1F4BB}", "#0ea5e9", KENNEY_ICONS),
  logic_pro_blem: entry("logic_pro_blem", "software", "assets/items/item_software_daw.png", "\u{1F4BB}", "#a3a3a3", KENNEY_ICONS),
  ableton_live_wire: entry("ableton_live_wire", "software", "assets/items/item_software_daw.png", "\u{1F4BB}", "#fbbf24", KENNEY_ICONS),
  modern_daw: entry("modern_daw", "software", "assets/items/item_software_daw.png", "\u{1F4BB}", "#22d3ee", KENNEY_ICONS),
  autotune_autobot: entry("autotune_autobot", "software", "assets/items/item_plugin.png", "\u{1F4BB}", "#e879f9", KENNEY_ICONS),
  autotune_original: entry("autotune_original", "software", "assets/items/item_plugin.png", "\u{1F916}", "#c084fc", KENNEY_ICONS),
  ai_assisted_daw: entry("ai_assisted_daw", "software", "assets/items/item_software_ai.png", "\u{1F9E0}", "#a855f7", KENNEY_ICONS, ["assets/items/item_software_daw.png"], [STOCK, NEON_SKIN, STUDIO_BLACK]),
  ai_mastering: entry("ai_mastering", "software", "assets/items/item_software_ai.png", "\u{1F916}", "#818cf8", KENNEY_ICONS),
  // ---- Monitoring (OGA Hifi speaker_closed) ----
  basic_monitors: entry("basic_monitors", "monitor", "assets/items/item_monitor.png", "\u{1F50A}", "#94a3b8", OGA_HIFI),
  studio_monitors: entry("studio_monitors", "monitor", "assets/items/item_monitor.png", "\u{1F50A}", "#38bdf8", OGA_HIFI),
  yamaha_ns_no_way: entry("yamaha_ns_no_way", "monitor", "assets/items/item_monitor_ns10.png", "\u{1F50A}", "#e2e8f0", OGA_HIFI, ["assets/items/item_monitor.png"]),
  altec_604e: entry("altec_604e", "monitor", "assets/items/item_monitor.png", "\u{1F50A}", "#d6a35c", OGA_HIFI),
  genelec_monitors: entry("genelec_monitors", "monitor", "assets/items/item_monitor.png", "\u{1F50A}", "#a3a3a3", OGA_HIFI),
  atc_scm_monitors: entry("atc_scm_monitors", "monitor", "assets/items/item_monitor.png", "\u{1F50A}", "#22c55e", OGA_HIFI, [], [STOCK, STUDIO_BLACK, ROADWORN]),
  // ---- Interfaces (OGA Hifi receiver / equalizer) ----
  audio_interface: entry("audio_interface", "interface", "assets/items/item_interface.png", "\u{1F50C}", "#f97316", OGA_HIFI),
  basic_interface: entry("basic_interface", "interface", "assets/items/item_interface.png", "\u{1F50C}", "#ef4444", OGA_HIFI),
  apogee_symphony_phony: entry("apogee_symphony_phony", "interface", "assets/items/item_interface.png", "\u{1F50C}", "#22d3ee", OGA_HIFI, [], [STOCK, TUBE_GLOW, STUDIO_BLACK])
};
var EQUIPMENT_ART_LIST = Object.values(EQUIPMENT_ART_MAP);
function missingArtFor(ids) {
  return ids.filter((id) => !EQUIPMENT_ART_MAP[id]);
}

// src/data/staffRecruitmentContent.ts
var ERA_NAME_POOLS = {
  "1960s": {
    first: ["Buddy", "Carole", "Dusty", "Aretha", "Otis", "Joni", "Brian", "Diana", "Smokey", "Phil", "Martha", "Leon", "Gladys", "Booker", "Nico", "Al"],
    last: ["Spector", "King", "Franklin", "Redding", "Mitchell", "Wilson", "Ross", "Robinson", "Holland", "Gaye", "Mayfield", "Cooke", "Springfield", "Doe"]
  },
  "1970s": {
    first: ["Stevie", "Donna", "Nile", "Chaka", "David", "Patti", "Bob", "Grace", "Curtis", "Ann", "Marvin", "Debbie", "Todd", "Sly", "Kate", "Giorgio"],
    last: ["Wonder", "Summer", "Rodgers", "Khan", "Bowie", "Smith", "Marley", "Jones", "Mayfield", "Wilson", "Gaye", "Harry", "Rundgren", "Stone", "Bush", "Moroder"]
  },
  "1980s": {
    first: ["Trevor", "Annie", "Prince", "Cyndi", "Quincy", "Madonna", "Rick", "Whitney", "Thomas", "Janet", "Midge", "Tina", "Jimmy", "Pat", "Kim", "Luther"],
    last: ["Horn", "Lennox", "Nelson", "Lauper", "Jones", "Ciccone", "Rubin", "Houston", "Dolby", "Jackson", "Ure", "Turner", "Jam", "Benatar", "Wilde", "Vandross"]
  },
  "1990s": {
    first: ["Dr", "Lauryn", "Trent", "Bjork", "Timbaland", "Missy", "Butch", "Alanis", "Pharrell", "DAngelo", "Shirley", "Moby", "Tricky", "Erykah", "DJ", "Fiona"],
    last: ["Dre", "Hill", "Reznor", "Gudmundsdottir", "Mosley", "Elliott", "Vig", "Morissette", "Williams", "Archer", "Manson", "Hall", "Badu", "Shadow", "Apple", "Yorke"]
  },
  "2000s": {
    first: ["Kanye", "Amy", "Danger", "Rihanna", "Mark", "MIA", "Diplo", "Adele", "Pharrell", "Florence", "Skrillex", "Lorde", "James", "Solange", "T", "Grimes"],
    last: ["West", "Winehouse", "Mouse", "Fenty", "Ronson", "Arulpragasam", "Pentz", "Adkins", "Williams", "Welch", "Moore", "Yelich", "Blake", "Knowles", "Pain", "Boucher"]
  },
  modern: {
    first: ["Billie", "Tyler", "Olivia", "Fred", "SZA", "Finneas", "Doja", "Harry", "Rosalia", "The", "Ice", "Phoebe", "Kaytranada", "Arlo", "Rema", "PinkPantheress"],
    last: ["Eilish", "Okazaki", "Rodrigo", "Again", "Rowiye", "OConnell", "Cat", "Styles", "Vila", "Weeknd", "Spice", "Bridgers", "Rouamba", "Parks", "Eileraas", "Mazy"]
  }
};
var ROLE_HEADLINES = {
  Engineer: [
    "Tracking engineer who hears the room before the mic",
    "Console whisperer seeking a desk that still breathes",
    "Patchbay poet looking for honest signal chains"
  ],
  Producer: [
    "Producer shaping songs around the take, not the grid",
    "Arrangement-minded producer hunting sticky hooks",
    "Session captain who keeps artists brave and on time"
  ],
  Songwriter: [
    "Topline writer with a pocket full of unfinished choruses",
    "Lyricist chasing one true line per session",
    "Melody first, ego last \u2014 available for co-writes"
  ]
};
var ERA_TRAITS = {
  "1960s": ["tape-splicing instincts", "mono-first ear", "live-room calm", "union hours respect", "horn-section diplomacy", "gain-riding reflexes", "echo-chamber patience"],
  "1970s": ["console folklore", "disco pocket", "late-night stamina", "band whisperer", "vinyl-preview taste", "razor-edit confidence", "headroom generous"],
  "1980s": ["MIDI fluent", "gated-reverb taste", "video-ready polish", "synth stacker", "chart-conscious", "automation fearless", "drum-machine pocket"],
  "1990s": ["DAW bilingual", "sample clearance wary", "grunge patience", "R&B layering", "indie thrift", "ADAT clock wrangler", "breakbeat archivist"],
  "2000s": ["laptop-rig tidy", "blog-era hustle", "plugin detective", "tour-bus ready", "myspace survivor", "vocal-stack precise", "recall-sheet disciplined"],
  modern: ["remote-session native", "stem delivery obsessive", "playlist fluent", "content-safe credits", "hybrid analog taste", "immersive-mix curious", "version-control calm"]
};
var ERA_STUDIOS = {
  "1960s": ["Muscle Shoals overflow", "Tin Pan basement", "Motown night shift", "Abbey Road runner desk"],
  "1970s": ["Sunset Sound assistant", "Criteria night ops", "Electric Lady runner", "Sigma Sound junior"],
  "1980s": ["Power Station nights", "Larrabee A2", "Battery London runner", "Hit Factory overtime"],
  "1990s": ["Sound City float", "Electric Lady II", "DARP Atlanta nights", "Strongroom London"],
  "2000s": ["Chalice Hollywood", "Metropolis London", "Jungle City nights", "Studio City freelance"],
  modern: ["Remote stem collective", "Hybrid loft sessions", "Playlist house desk", "Tour rehearsal truck"]
};
var ERA_CREDITS = {
  "1960s": ["B-side that outsold the single", "Live broadcast rescue mix", "Gospel choir tracking day"],
  "1970s": ["Side-long fade that radio still plays", "Disco edit that cleared the floor", "Concept-album sequencing pass"],
  "1980s": ['MTV-ready 12" remix', "Drum machine that finally locked", "Ballad vocal that cracked the Top 40"],
  "1990s": ["Alt-radio breakthrough mix", "Hip-hop sample flip cleared clean", "Unplugged session that stuck"],
  "2000s": ["Blog-buzz EP that got shopped", "Sync placement on a cable drama", "Tour stems delivered overnight"],
  modern: ["Playlist pitch that actually stuck", "Viral chorus demo", "Hybrid live/session hybrid release"]
};
var ERA_EDUCATION = {
  "1960s": ["Apprenticed on night tape ops", "Conservatory drop-out turned runner", "Union hall radio op certificate"],
  "1970s": ["College radio board + gig circuit", "Self-taught on a borrowed console", "Trade-school electronics ticket"],
  "1980s": ["MIDI workshop certificate", "Night classes in synthesis", "Studio internship that stuck"],
  "1990s": ["Community college DAW lab", "Bedroom 4-track diploma of bruises", "Conservatory composition year"],
  "2000s": ["Audio engineering diploma", "Online mastering cohort", "Indie label internship"],
  modern: ["Remote production mentorship", "University music-tech module", "Content-creator audio bootcamp"]
};
var LOOKING_FOR = {
  Engineer: ["A room with honest monitors and a boss who trusts the take", "Sessions that leave space to listen", "Gear that fails gracefully"],
  Producer: ["Artists who argue productively", "A diary with unfinished songs", "A desk that still has personality"],
  Songwriter: ["Co-writes without ego tax", "Reference tracks that surprise", "A piano that stays in tune past midnight"]
};

// src/i18n/content.ts
var import_react = __toESM(require_react(), 1);

// src/rpg/cities.ts
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
var getCityById = (id) => CITIES.find((c) => c.id === id);
var localName = (cityId, roll1, roll2) => {
  const city = getCityById(cityId);
  if (!city) return void 0;
  const pick = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
  return `${pick(city.names.first, roll1)} ${pick(city.names.last, roll2)}`;
};

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
var pickWithRandom = (rng, values) => {
  if (values.length === 0) {
    throw new Error("pickWithRandom requires at least one value");
  }
  return values[Math.floor(rng() * values.length)];
};

// src/utils/skillUtils.ts
var calculateXpToNextLevel = (currentLevel) => {
  if (currentLevel <= 0) return 100;
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
};
var initializeSkillsStaff = () => {
  const initialLevel = 1;
  const initialXp = 0;
  const xpToNext = calculateXpToNextLevel(initialLevel);
  const initialSkill = {
    level: initialLevel,
    xp: initialXp,
    xpToNextLevel: xpToNext
  };
  return {
    songwriting: { ...initialSkill },
    rhythm: { ...initialSkill },
    tracking: { ...initialSkill },
    mixing: { ...initialSkill },
    mastering: { ...initialSkill },
    tapeSplicing: { ...initialSkill },
    vocalComping: { ...initialSkill },
    soundDesign: { ...initialSkill },
    sampleWarping: { ...initialSkill }
    // Management skill is excluded for staff
  };
};

// src/features/sprites/npcAppearanceData.ts
var NPC_ERAS = ["1960s", "1970s", "1980s", "1990s", "2000s", "modern"];
var STUDIO_ROLES = ["engineer", "producer", "artist", "manager", "tech"];
var BUILDS = ["slim", "average", "stocky"];
var SKIN_TONES = ["fair", "warm", "olive", "tan", "deep", "rich"];
var FACES = [
  "focused",
  "eager",
  "chill",
  "stern",
  "ecstatic",
  ["vintage_shades", 0.5]
];
var SKIN_PALETTES = {
  fair: { base: "#fed7aa", shadow: "#fb923c" },
  warm: { base: "#fde047", shadow: "#eab308" },
  olive: { base: "#d4b996", shadow: "#a6825c" },
  tan: { base: "#c28b5b", shadow: "#945b2f" },
  deep: { base: "#8d5524", shadow: "#5c3311" },
  rich: { base: "#4a2c11", shadow: "#271404" }
};
var HAIR_HEX = {
  jet_black: "#171717",
  dark_brown: "#3f2212",
  chestnut: "#5c2c16",
  auburn: "#853216",
  bleached_blonde: "#fef08a",
  silver_grey: "#94a3b8",
  neon_pink: "#f43f5e",
  electric_blue: "#06b6d4"
};
var ERA_HAIR_SHAPES = {
  "1960s": ["bob", "pompadour", "slicked", "buzzcut", ["bald", 0.3]],
  "1970s": ["afro", "long_wavy", "messy_curly", "pompadour", ["bald", 0.3]],
  "1980s": ["slicked", "pompadour", "messy_curly", "long_wavy", ["bald", 0.3]],
  "1990s": ["messy_curly", "buzzcut", "dreads", "bob", "long_wavy", ["bald", 0.3]],
  "2000s": ["buzzcut", "topknot", "dreads", "messy_curly", "slicked", ["bald", 0.3]],
  modern: ["topknot", "buzzcut", "afro", "dreads", "slicked", "bob", "long_wavy", ["bald", 0.5]]
};
var ERA_HAIR_COLOURS = {
  "1960s": ["jet_black", "dark_brown", "chestnut", "auburn", ["silver_grey", 0.5], ["bleached_blonde", 0.5]],
  "1970s": ["jet_black", "dark_brown", "chestnut", "auburn", ["silver_grey", 0.5]],
  "1980s": ["bleached_blonde", "neon_pink", "jet_black", "auburn", ["electric_blue", 0.5], ["dark_brown", 0.5]],
  "1990s": ["jet_black", "dark_brown", "chestnut", ["bleached_blonde", 0.7], ["electric_blue", 0.4]],
  "2000s": ["jet_black", "dark_brown", "chestnut", ["bleached_blonde", 0.7], ["neon_pink", 0.3], ["auburn", 0.6]],
  modern: ["jet_black", "dark_brown", "chestnut", "auburn", "silver_grey", ["neon_pink", 0.4], ["electric_blue", 0.4]]
};
var ERA_FACIAL_HAIR = {
  "1960s": [["none", 3], "clean_stubble", "sideburns", ["vintage_mustache", 0.7]],
  "1970s": ["vintage_mustache", "full_beard", "sideburns", "clean_stubble", ["none", 1.5]],
  "1980s": [["none", 3], "clean_stubble", "vintage_mustache", "goatee"],
  "1990s": [["none", 3], "clean_stubble", "goatee", ["full_beard", 0.5]],
  "2000s": [["none", 3], "clean_stubble", "goatee", ["full_beard", 0.7]],
  modern: [["none", 3], "clean_stubble", "full_beard", "goatee", ["vintage_mustache", 0.4]]
};
var ERA_TOPS = {
  "1960s": ["turtleneck", "vintage_cardigan", "flannel_shirt", ["denim_vest", 0.4]],
  "1970s": ["flannel_shirt", "leather_jacket", "denim_vest", "band_tee", ["turtleneck", 0.6]],
  "1980s": ["tracksuit_jacket", "leather_jacket", "band_tee", ["denim_vest", 0.7]],
  "1990s": ["flannel_shirt", "oversized_hoodie", "band_tee", ["vintage_cardigan", 0.4]],
  "2000s": ["oversized_hoodie", "tracksuit_jacket", "band_tee", ["flannel_shirt", 0.6]],
  modern: ["turtleneck", "vintage_cardigan", "oversized_hoodie", "flannel_shirt", ["band_tee", 0.8]]
};
var ERA_LOWERS = {
  "1960s": ["corduroy_trousers", "denim_jeans"],
  "1970s": ["bell_bottoms", "corduroy_trousers", "denim_jeans"],
  "1980s": ["denim_jeans", "joggers", "ripped_jeans"],
  "1990s": ["ripped_jeans", "cargo_pants", "denim_jeans"],
  "2000s": ["cargo_pants", "joggers", "ripped_jeans", ["denim_jeans", 0.6]],
  modern: ["denim_jeans", "joggers", "corduroy_trousers", ["cargo_pants", 0.6]]
};
var ERA_SHOES = {
  "1960s": ["loafers", "leather_boots", ["creepers", 0.6]],
  "1970s": ["leather_boots", "loafers", "vintage_sneakers"],
  "1980s": ["hi_tops", "vintage_sneakers", ["creepers", 0.8], "leather_boots"],
  "1990s": ["hi_tops", "canvas_skaters", "leather_boots", "vintage_sneakers"],
  "2000s": ["canvas_skaters", "hi_tops", "vintage_sneakers"],
  modern: ["vintage_sneakers", "canvas_skaters", "leather_boots", ["loafers", 0.6]]
};
var ERA_OUTERWEAR = {
  "1960s": [["none", 3], "trenchcoat", "chore_jacket"],
  "1970s": [["none", 3], "trenchcoat", "chore_jacket", ["bomber", 0.6]],
  "1980s": [["none", 3], "bomber", "trenchcoat"],
  "1990s": [["none", 3], "bomber", "chore_jacket", "fleece"],
  "2000s": [["none", 3], "bomber", "fleece", ["chore_jacket", 0.6]],
  modern: [["none", 3], "chore_jacket", "fleece", "bomber", ["trenchcoat", 0.6]]
};
var ERA_GLASSES = {
  "1960s": ["horn_rim", "wire_round", ["none", 3]],
  "1970s": ["tinted_aviator", "wire_round", ["none", 3]],
  "1980s": [["cyber_visor", 0.6], "wayfarer", ["none", 3]],
  "1990s": ["wire_round", "wayfarer", ["none", 3]],
  "2000s": ["wayfarer", ["tinted_aviator", 0.6], ["none", 3]],
  modern: ["wayfarer", "wire_round", "horn_rim", ["none", 3]]
};
var ERA_JEWELLERY = {
  "1960s": [["none", 4], ["silver_hoops", 0.4]],
  "1970s": [["none", 3], "gold_chain", "silver_hoops"],
  "1980s": [["none", 3], "gold_chain", "cassette_pendant", "silver_hoops"],
  "1990s": [["none", 3], "choker", "silver_hoops", "cassette_pendant"],
  "2000s": [["none", 3], "gold_chain", "choker", "silver_hoops"],
  modern: [["none", 3], "silver_hoops", "choker", "gold_chain", ["cassette_pendant", 0.6]]
};
var CLOTHING_PALETTES = [
  { primary: "#b91c1c", secondary: "#450a0a" },
  // Ruby Red
  { primary: "#c2410c", secondary: "#431407" },
  // Vintage Orange
  { primary: "#d97706", secondary: "#451a03" },
  // Amber Gold
  { primary: "#15803d", secondary: "#052e16" },
  // Forest Green
  { primary: "#0f766e", secondary: "#042f2e" },
  // Deep Teal
  { primary: "#1d4ed8", secondary: "#172554" },
  // Studio Cobalt
  { primary: "#6d28d9", secondary: "#2e1065" },
  // Velvet Purple
  { primary: "#334155", secondary: "#0f172a" },
  // Charcoal Slate
  { primary: "#e2e8f0", secondary: "#64748b" },
  // Off-white Oxford
  { primary: "#a16207", secondary: "#422006" },
  // Mustard
  { primary: "#be185d", secondary: "#500724" },
  // Magenta
  { primary: "#57534e", secondary: "#1c1917" }
  // Stone
];
var LOWER_COLOURS = ["#1e3a8a", "#1e293b", "#334155", "#475569", "#172554", "#713f12", "#3f3f46", "#365314"];
var SHOE_COLOURS = ["#0f172a", "#451a03", "#ffffff", "#dc2626", "#d97706", "#1d4ed8"];
var HEADPHONE_COLOURS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#111827", "#e2e8f0"];
var PIN_OPTIONS = [[], [], ["synth", "tape"], ["peace"], ["fire", "tape"]];
var ROLE_PROPS = {
  engineer: { accessoryName: "Reference Monitor Cans", renderProp: "headphones", accentColor: "#3b82f6" },
  producer: { accessoryName: "Groove Controller & Cap", renderProp: "synth_controller", accentColor: "#f59e0b" },
  artist: { accessoryName: "Vintage Gold Condenser", renderProp: "mic", accentColor: "#ec4899" },
  manager: { accessoryName: "Session Contract & Lanyard", renderProp: "clipboard", accentColor: "#10b981" },
  tech: { accessoryName: "Pro Audio Toolbelt & Calibrator", renderProp: "toolbelt", accentColor: "#e11d48" }
};
var FIRST_NAMES = [
  "Miles",
  "Stevie",
  "Quincy",
  "Alan",
  "Jimi",
  "Debbie",
  "Rick",
  "Kate",
  "George",
  "Brian",
  "Eno",
  "Sly",
  "Nile",
  "Wendy",
  "Trevor",
  "Sylvia",
  "Giorgio",
  "Leon",
  "Carole",
  "Todd",
  "Mitch",
  "Lee",
  "Klaus",
  "Toni"
];
var LAST_NAMES = [
  "Vance",
  "Sterling",
  "Blackwood",
  "Rhodes",
  "Marley",
  "Holt",
  "Cross",
  "Wexler",
  "Alpert",
  "Rodgers",
  "Moroder",
  "Masser",
  "Parsons",
  "Kramer",
  "Swedien",
  "Horn",
  "Bell",
  "King",
  "Rundgren",
  "Perry",
  "Schulze"
];

// src/features/sprites/characterCreatorParts.ts
var unwrap = (pool) => {
  const out = [];
  for (const entry2 of pool) {
    const value = Array.isArray(entry2) ? entry2[0] : entry2;
    if (!out.includes(value)) out.push(value);
  }
  return out;
};
var labelize = (id) => id.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
var optionsFrom = (ids) => ids.map((id, index) => ({ index, id, label: labelize(id) }));
var bodyOptions = () => optionsFrom(SKIN_TONES);
var buildOptions = () => optionsFrom(unwrap(BUILDS));
var hairOptionsForEra = (era) => optionsFrom(unwrap(ERA_HAIR_SHAPES[era]));
var clothingOptionsForEra = (era) => optionsFrom(unwrap(ERA_TOPS[era]));
var accessoryOptionsForEra = (era) => optionsFrom(unwrap(ERA_GLASSES[era]));
var creatorOptionsForEra = (era) => ({
  body: bodyOptions(),
  build: buildOptions(),
  hair: hairOptionsForEra(era),
  clothing: clothingOptionsForEra(era),
  accessories: accessoryOptionsForEra(era)
});
var normalizePartPicks = (era, picks) => {
  const opts = creatorOptionsForEra(era);
  const clamp = (value, length) => {
    if (typeof value !== "number" || !Number.isInteger(value)) return 0;
    return (value % length + length) % length;
  };
  return {
    body: clamp(picks?.body, opts.body.length),
    build: clamp(picks?.build, opts.build.length),
    hair: clamp(picks?.hair, opts.hair.length),
    clothing: clamp(picks?.clothing, opts.clothing.length),
    accessories: clamp(picks?.accessories, opts.accessories.length)
  };
};
var applyPartPicks = (npc, picksInput) => {
  const picks = normalizePartPicks(npc.era, picksInput);
  const builds = unwrap(BUILDS);
  const skins = SKIN_TONES;
  const hairShapes = unwrap(ERA_HAIR_SHAPES[npc.era]);
  const hairColours = unwrap(ERA_HAIR_COLOURS[npc.era]);
  const facial = unwrap(ERA_FACIAL_HAIR[npc.era]);
  const tops = unwrap(ERA_TOPS[npc.era]);
  const lowers = unwrap(ERA_LOWERS[npc.era]);
  const outerwear = unwrap(ERA_OUTERWEAR[npc.era]);
  const glasses = unwrap(ERA_GLASSES[npc.era]);
  const jewellery = unwrap(ERA_JEWELLERY[npc.era]);
  const skinTone = skins[picks.body % skins.length];
  const build = builds[(picks.build ?? picks.body) % builds.length];
  const skin = SKIN_PALETTES[skinTone];
  const hairShape = hairShapes[picks.hair % hairShapes.length];
  const hairColour = hairColours[picks.hair % hairColours.length];
  const facialHair = hairShape === "bald" ? picks.hair % 2 === 0 ? "full_beard" : "none" : facial[picks.hair % facial.length];
  const top = tops[picks.clothing % tops.length];
  const lower = lowers[picks.clothing % lowers.length];
  const outer = outerwear[picks.clothing % outerwear.length];
  const glass = glasses[picks.accessories % glasses.length];
  const jewel = jewellery[picks.accessories % jewellery.length];
  return {
    ...npc,
    body: {
      ...npc.body,
      build,
      skinTone,
      skinHex: skin.base,
      shadowHex: skin.shadow
    },
    hair: {
      shape: hairShape,
      colour: hairColour,
      hairHex: HAIR_HEX[hairColour],
      facialHair
    },
    clothes: {
      top,
      topPrimaryHex: npc.clothes.topPrimaryHex,
      topSecondaryHex: npc.clothes.topSecondaryHex,
      lower,
      lowerHex: npc.clothes.lowerHex,
      shoes: npc.clothes.shoes,
      shoesHex: npc.clothes.shoesHex,
      outerwear: outer,
      ...outer !== "none" ? { outerwearHex: npc.clothes.outerwearHex ?? npc.clothes.topSecondaryHex } : {}
    },
    details: {
      ...npc.details,
      glasses: glass,
      jewellery: jewel
    }
  };
};

// src/features/sprites/npcAppearance.ts
var LATEST_APPEARANCE_VERSION = 1;
var pickWeighted = (rng, pool) => {
  const entries = pool.map((entry2) => Array.isArray(entry2) ? entry2 : [entry2, 1]);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
};
var identityRng = (id) => createSeededRandom(`npc:v${id.appearanceVersion}:${id.seed}:${id.role}:${id.era}`);
var generateV1 = (id, name) => {
  const rng = identityRng(id);
  const { role, era } = id;
  const build = pickWeighted(rng, BUILDS);
  const skinTone = pickWithRandom(rng, SKIN_TONES);
  const skin = SKIN_PALETTES[skinTone];
  const face = pickWeighted(rng, FACES);
  const hairShape = pickWeighted(rng, ERA_HAIR_SHAPES[era]);
  const hairColour = pickWeighted(rng, ERA_HAIR_COLOURS[era]);
  const facialHair = hairShape === "bald" && rng() < 0.5 ? "full_beard" : pickWeighted(rng, ERA_FACIAL_HAIR[era]);
  const top = pickWeighted(rng, ERA_TOPS[era]);
  const topPalette = pickWithRandom(rng, CLOTHING_PALETTES);
  const lower = pickWeighted(rng, ERA_LOWERS[era]);
  const lowerHex = pickWithRandom(rng, LOWER_COLOURS);
  const shoes = pickWeighted(rng, ERA_SHOES[era]);
  const shoesHex = pickWithRandom(rng, SHOE_COLOURS);
  const outerwear = pickWeighted(rng, ERA_OUTERWEAR[era]);
  const outerwearPalette = pickWithRandom(rng, CLOTHING_PALETTES);
  const glasses = pickWeighted(rng, ERA_GLASSES[era]);
  const jewellery = pickWeighted(rng, ERA_JEWELLERY[era]);
  const headphoneColor = pickWithRandom(rng, HEADPHONE_COLOURS);
  const patches = rng() > 0.6;
  const pins = [...pickWithRandom(rng, PIN_OPTIONS)];
  const fullName = `${pickWithRandom(rng, FIRST_NAMES)} ${pickWithRandom(rng, LAST_NAMES)}`;
  return {
    id: `npc-${id.seed}-${role}-${era}`,
    seed: id.seed,
    appearanceVersion: id.appearanceVersion,
    name: name ?? fullName,
    role,
    era,
    body: { build, skinTone, skinHex: skin.base, shadowHex: skin.shadow, face },
    hair: { shape: hairShape, colour: hairColour, hairHex: HAIR_HEX[hairColour], facialHair },
    clothes: {
      top,
      topPrimaryHex: topPalette.primary,
      topSecondaryHex: topPalette.secondary,
      lower,
      lowerHex,
      shoes,
      shoesHex,
      outerwear,
      ...outerwear !== "none" ? { outerwearHex: outerwearPalette.secondary } : {}
      // omit key (not undefined) so JSON round trips are exact
    },
    details: { glasses, jewellery, patches, pins, headphoneColor },
    roleProps: { ...ROLE_PROPS[role] }
  };
};
var GENERATORS = {
  1: generateV1
};
var resolveNpcAppearance = (id, name) => {
  const known = Object.keys(GENERATORS).map(Number).filter((v) => v <= id.appearanceVersion);
  const version = known.length ? Math.max(...known) : LATEST_APPEARANCE_VERSION;
  const generated = GENERATORS[version]({ ...id, appearanceVersion: version }, name);
  if (!id.parts) return generated;
  return applyPartPicks(generated, normalizePartPicks(id.era, id.parts));
};
var identityOf = (npc, parts) => ({
  seed: npc.seed,
  role: npc.role,
  era: npc.era,
  appearanceVersion: npc.appearanceVersion ?? 1,
  ...parts ? { parts: normalizePartPicks(npc.era, parts) } : {}
});
var identityFromSeed = (seed, options = {}) => {
  const rng = createSeededRandom(`npc-identity:${seed}`);
  const era = options.era ?? pickWithRandom(rng, NPC_ERAS);
  const role = options.role ?? pickWithRandom(rng, STUDIO_ROLES);
  return {
    seed,
    role,
    era,
    appearanceVersion: options.appearanceVersion ?? LATEST_APPEARANCE_VERSION,
    ...options.parts ? { parts: normalizePartPicks(era, options.parts) } : {}
  };
};

// src/features/sprites/staffPortrait.ts
var PIECE_PREFIX = {
  hair: "hair_",
  face: "face_",
  top: "top_",
  lower: "lower_",
  shoes: "shoes_",
  outerwear: "outerwear_",
  glasses: "glasses_",
  jewellery: "jewellery_",
  facialHair: "facial_hair_"
};
var stripPrefix = (value, prefix) => value.startsWith(prefix) ? value.slice(prefix.length) : value;
var pieceIdsFromAppearance = (npc) => ({
  hair: `${PIECE_PREFIX.hair}${npc.hair.shape}`,
  face: `${PIECE_PREFIX.face}${npc.body.face}`,
  top: `${PIECE_PREFIX.top}${npc.clothes.top}`,
  lower: `${PIECE_PREFIX.lower}${npc.clothes.lower}`,
  shoes: `${PIECE_PREFIX.shoes}${npc.clothes.shoes}`,
  outerwear: `${PIECE_PREFIX.outerwear}${npc.clothes.outerwear}`,
  glasses: `${PIECE_PREFIX.glasses}${npc.details.glasses}`,
  jewellery: `${PIECE_PREFIX.jewellery}${npc.details.jewellery}`,
  facialHair: `${PIECE_PREFIX.facialHair}${npc.hair.facialHair}`
});
var applyCreatorPieceIds = (npc, pieces) => {
  if (!pieces) return npc;
  const next = {
    ...npc,
    body: { ...npc.body },
    hair: { ...npc.hair },
    clothes: { ...npc.clothes },
    details: { ...npc.details }
  };
  if (pieces.face) next.body.face = stripPrefix(pieces.face, PIECE_PREFIX.face);
  if (pieces.hair) next.hair.shape = stripPrefix(pieces.hair, PIECE_PREFIX.hair);
  if (pieces.facialHair) {
    next.hair.facialHair = stripPrefix(pieces.facialHair, PIECE_PREFIX.facialHair);
  }
  if (pieces.top) next.clothes.top = stripPrefix(pieces.top, PIECE_PREFIX.top);
  if (pieces.lower) next.clothes.lower = stripPrefix(pieces.lower, PIECE_PREFIX.lower);
  if (pieces.shoes) next.clothes.shoes = stripPrefix(pieces.shoes, PIECE_PREFIX.shoes);
  if (pieces.outerwear) {
    next.clothes.outerwear = stripPrefix(pieces.outerwear, PIECE_PREFIX.outerwear);
  }
  if (pieces.glasses) {
    next.details.glasses = stripPrefix(pieces.glasses, PIECE_PREFIX.glasses);
  }
  if (pieces.jewellery) {
    next.details.jewellery = stripPrefix(pieces.jewellery, PIECE_PREFIX.jewellery);
  }
  return next;
};
var staffRoleToStudioRole = (role) => {
  if (role === "Engineer") return "engineer";
  if (role === "Producer") return "producer";
  return "artist";
};
var eraIdToNpcEra = (eraId, year) => {
  const id = (eraId ?? "").toLowerCase();
  if (id.includes("classic") || id.includes("analog") || id === "vintage-warmth") return "1960s";
  if (id.includes("golden") || id.includes("digital80") || id.includes("80")) return "1980s";
  if (id.includes("digital_age") || id.includes("internet") || id.includes("2000")) return "2000s";
  if (id.includes("modern") || id.includes("streaming") || id.includes("2020")) return "modern";
  if (typeof year === "number" && Number.isFinite(year)) {
    if (year < 1970) return "1960s";
    if (year < 1980) return "1970s";
    if (year < 1990) return "1980s";
    if (year < 2e3) return "1990s";
    if (year < 2015) return "2000s";
    return "modern";
  }
  return "modern";
};
var identityFromStaffSeed = (seed, options = {}) => identityFromSeed(seed, {
  role: options.role,
  era: options.era,
  appearanceVersion: options.appearanceVersion ?? LATEST_APPEARANCE_VERSION
});
var resolveStaffPortrait = (spec) => {
  const identity = identityFromStaffSeed(spec.seed, {
    role: spec.role,
    era: spec.era,
    appearanceVersion: spec.appearanceVersion
  });
  const base = resolveNpcAppearance(identity, spec.name);
  return applyCreatorPieceIds(base, spec.pieces);
};
var staffPortraitSeed = (saveSeed, day, batchKey, index) => {
  const input = `staff-portrait:${saveSeed}:${day}:${batchKey}:${index}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

// src/utils/staffRecruitment.ts
var ALL_GENRES = ["Rock", "Pop", "Electronic", "Hip-hop", "Acoustic", "Jazz", "Folk", "Soul"];
var ROLES = ["Engineer", "Producer", "Songwriter"];
var pickUnique = (rng, pool, count) => {
  const available = [...pool];
  const picked = [];
  while (picked.length < count && available.length > 0) {
    const index = Math.floor(rng() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
};
var buildStaffCv = (rng, options) => {
  const traits = pickUnique(rng, ERA_TRAITS[options.era], 3);
  const previousStudios = pickUnique(rng, ERA_STUDIOS[options.era], randomInt(rng, 1, 2));
  const notableCredits = pickUnique(rng, ERA_CREDITS[options.era], randomInt(rng, 1, 2));
  const headline = pickWithRandom(rng, ROLE_HEADLINES[options.role]);
  const education = pickWithRandom(rng, ERA_EDUCATION[options.era]);
  const lookingFor = pickWithRandom(rng, LOOKING_FOR[options.role]);
  const yearsExperience = Math.max(1, options.levelInRole + randomInt(rng, 0, 8));
  const affinityLine = options.genreAffinity ? ` Known for ${options.genreAffinity.genre.toLowerCase()} sessions (+${options.genreAffinity.bonus}% affinity).` : "";
  return {
    headline,
    summary: `${options.name} is a ${options.era} ${options.role.toLowerCase()} with ${yearsExperience} years across working rooms.${affinityLine}`,
    traits,
    previousStudios,
    notableCredits,
    yearsExperience,
    education,
    lookingFor
  };
};
var generateOneCandidate = (seed, era, index, batchKey, cityId) => {
  const rng = createSeededRandom(`staff-candidate:${seed}:${batchKey}:${index}`);
  const role = pickWithRandom(rng, ROLES);
  const names = ERA_NAME_POOLS[era];
  const eraName = `${pickWithRandom(rng, names.first)} ${pickWithRandom(rng, names.last)}`;
  const name = cityId && rng() < 0.5 ? localName(cityId, rng(), rng()) ?? eraName : eraName;
  const archetypeChance = rng();
  let primaryStats;
  let genreAffinity = null;
  let salary = 80;
  if (archetypeChance < 0.3) {
    primaryStats = {
      creativity: 10 + randomInt(rng, 0, 19),
      technical: 10 + randomInt(rng, 0, 19),
      speed: 10 + randomInt(rng, 0, 19)
    };
    const specialistStatBoost = 15 + randomInt(rng, 0, 9);
    const statToBoost = randomInt(rng, 0, 2);
    if (statToBoost === 0) primaryStats.creativity += specialistStatBoost;
    else if (statToBoost === 1) primaryStats.technical += specialistStatBoost;
    else primaryStats.speed += specialistStatBoost;
    if (rng() < 0.7) {
      genreAffinity = {
        genre: pickWithRandom(rng, ALL_GENRES),
        bonus: 20 + randomInt(rng, 0, 19)
      };
    }
  } else {
    primaryStats = {
      creativity: 15 + randomInt(rng, 0, 24),
      technical: 15 + randomInt(rng, 0, 24),
      speed: 15 + randomInt(rng, 0, 24)
    };
    if (rng() < 0.4) {
      genreAffinity = {
        genre: pickWithRandom(rng, ALL_GENRES),
        bonus: 10 + randomInt(rng, 0, 14)
      };
    }
  }
  const bestStat = Math.max(primaryStats.creativity, primaryStats.technical, primaryStats.speed);
  const affinityBonus = genreAffinity?.bonus ?? 0;
  if (bestStat >= 45 || affinityBonus >= 25) {
    salary = 160 + randomInt(rng, 0, 80);
  } else if (bestStat >= 30 || affinityBonus >= 15) {
    salary = 90 + randomInt(rng, 0, 50);
  } else {
    salary = 35 + randomInt(rng, 0, 20);
  }
  const levelInRole = 1 + (bestStat >= 40 ? randomInt(rng, 1, 3) : 0);
  const studioRole = staffRoleToStudioRole(role);
  const portrait = resolveStaffPortrait({ seed, role: studioRole, era, name });
  const appearance = identityOf(portrait);
  const pieceIds = pieceIdsFromAppearance(portrait);
  const cv = buildStaffCv(rng, { role, era, name, levelInRole, genreAffinity });
  return {
    id: `candidate_${seed}_${index}`,
    name,
    role,
    primaryStats,
    xpInRole: 0,
    levelInRole,
    genreAffinity,
    clientFamiliarity: {},
    energy: 100,
    mood: 75,
    salary,
    status: "Idle",
    assignedProjectId: null,
    skills: initializeSkillsStaff(),
    appearance,
    portraitSeed: seed,
    pieceIds,
    cv
  };
};
var generateCandidates = (countOrCtx) => {
  const ctx = typeof countOrCtx === "number" ? { count: countOrCtx } : countOrCtx;
  const count = Math.max(0, ctx.count);
  const saveSeed = ctx.saveSeed ?? "legacy";
  const day = ctx.day ?? 0;
  const batchKey = ctx.batchKey ?? "default";
  const era = eraIdToNpcEra(ctx.era, ctx.year);
  const candidates = [];
  for (let i = 0; i < count; i++) {
    const seed = staffPortraitSeed(saveSeed, day, batchKey, i);
    candidates.push(generateOneCandidate(seed, era, i, batchKey, ctx.cityId));
  }
  return candidates;
};

// tests/catalog-traits-expansion.check.ts
var additions = [
  ["rhodes_stage_piano", 1970],
  ["dbx_160_compressor", 1976],
  ["dx7_synth", 1983],
  ["adat_8track", 1992],
  ["small_diaphragm_pair", 2004]
];
import_strict.default.deepEqual(missingArtFor(additions.map(([id]) => id)), [], "new gear uses the shelf/shop art authority");
for (const [id, year] of additions) {
  const item = availableEquipment.find((candidate) => candidate.id === id);
  import_strict.default.ok(item, `${id} is in the live equipment catalogue`);
  import_strict.default.ok(getAvailableEquipmentForYear(year).some((candidate) => candidate.id === id), `${id} is purchasable in ${year}`);
  import_strict.default.ok(!getAvailableEquipmentForYear(year - 1).some((candidate) => candidate.id === id), `${id} stays era-gated`);
  import_strict.default.ok(item.price > 0 && item.condition === 100, `${id} has valid retail defaults`);
}
var expandedTraits = /* @__PURE__ */ new Set([
  "gain-riding reflexes",
  "echo-chamber patience",
  "razor-edit confidence",
  "headroom generous",
  "automation fearless",
  "drum-machine pocket",
  "ADAT clock wrangler",
  "breakbeat archivist",
  "vocal-stack precise",
  "recall-sheet disciplined",
  "immersive-mix curious",
  "version-control calm"
]);
import_strict.default.equal(Object.values(ERA_TRAITS).every((pool) => pool.length === 7), true, "each era gains two trait choices");
var seen = /* @__PURE__ */ new Set();
for (const year of [1965, 1975, 1985, 1995, 2005, 2020]) {
  for (let batch = 0; batch < 24; batch += 1) {
    for (const candidate of generateCandidates({ count: 4, saveSeed: 73, day: 5, year, batchKey: `trait-proof-${batch}` })) {
      candidate.cv?.traits.forEach((trait) => seen.add(trait));
    }
  }
}
import_strict.default.deepEqual([...expandedTraits].filter((trait) => !seen.has(trait)), [], "new traits reach generated recruitment CVs");
console.log("catalog-traits-expansion.check passed");
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
