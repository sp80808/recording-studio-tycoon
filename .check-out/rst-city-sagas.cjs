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

// tests/city-sagas.check.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"), 1);

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

// src/narrative/citySagas.ts
var fx = (rows) => rows.map(([kind, amount]) => ({ kind, amount }));
var SAGAS = [
  { code: "la", city: "los-angeles", place: "LOS ANGELES", name: "The Reel in the Wall", beats: [
    ["A Tape Behind the Plaster", "Rewiring the control room, an electrician finds a reel of tape sealed in the wall with a date from decades ago.", ["Play it before anyone else hears", "You thread it up alone, after midnight.", [["xp", 40], ["reputation", 1]], "Faint, warm, unmistakable. Someone very good once played in this room."], ["Hand it to a restoration lab", "Do it properly and pay for it.", [["money", -120], ["reputation", 2]], "The lab calls it a find and promises a clean transfer."]],
    ["Whose Voice Is on the Reel?", "The transfer is back. A singer, a band that never released a thing, and a name scrawled on the box.", ["Track down the family", "Letters, phone calls, an afternoon in an archive.", [["xp", 30], ["reputation", 3]], "A granddaughter cries on the phone, then asks you to come to dinner."], ["Keep it quiet and keep the tape", "Some things are better left in the vault.", [["money", 150]], "The tape goes in a drawer. The drawer feels heavier."]],
    ["The Reel Gets Its Release", "Word has spread. A reissue label wants the tape and the story of the room that kept it.", ["Release it with the family", "Split the credit and the proceeds fairly.", [["reputation", 8], ["money", 200]], "The reissue sells out. Your name is in the liner notes, near theirs."], ["License it outright", "Take the cheque and thank them kindly.", [["money", 450], ["reputation", 2]], "It pays well. The family never quite writes back."]]
  ] },
  { code: "nashville", city: "nashville", place: "NASHVILLE", name: "The Unfinished Song", beats: [
    ["A Chorus Without Verses", "A weathered songwriter leaves a cassette on your desk: one perfect chorus, no verses, no name.", ["Write the verses yourself", "Sit with it until it talks.", [["xp", 40], ["reputation", 1]], "By morning you have three verses. None feel like yours."], ["Ask around town", "Somebody on Music Row will know.", [["reputation", 2], ["xp", 15]], "Four different people recognise it. All four give a different name."]],
    ["The Songwriter Comes Back", "They are in the lobby, older than the tape suggested, and slightly offended you changed a word.", ["Let them rewrite it in the room", "Give them the good mic and the afternoon.", [["xp", 30], ["reputation", 3]], "The new lyric is plainer and much, much better."], ["Defend your version", "It works. Why break it?", [["reputation", 1], ["money", 120]], "They leave unconvinced, but the demo gets airplay."]],
    ["A Cover from the Top of the Charts", "A chart-topping act wants to cut the song. The songwriter has one condition: your room.", ["Record it all in your room", "Take the session and the spotlight.", [["reputation", 8], ["money", 250]], "It goes to number one. The songwriter sends a handwritten card."], ["Step back and take a credit in the notes", "Smaller fee, bigger friend.", [["money", 80], ["reputation", 4], ["xp", 40]], "The credit is a single line. People in town read it twice."]]
  ] },
  { code: "london", city: "london", place: "LONDON", name: "Radio Silence", beats: [
    ["A Pirate Signal Reaches the Roof", "Your aerial picks up a pirate station playing nothing but demos, and the DJ keeps naming your street.", ["Climb up and trace the signal", "Cold fingers, good view.", [["xp", 35], ["reputation", 1]], "A cheap transmitter, a stolen car battery, and a note addressed to the studio."], ["Send them a mixtape", "If they like unknown music, send them some.", [["reputation", 2], ["money", -60]], "It is on air within the hour."]],
    ["The DJ Asks to Meet", "The voice behind the station turns up with a thermos, two crates of tapes and a problem with the regulator.", ["Hide the crates until the heat passes", "A favour, off the books.", [["reputation", 3], ["xp", 20]], "The crates rest under your tape shelf. Nobody knocks."], ["Offer a legal broadcast slot", "Take it above ground.", [["money", -100], ["reputation", 4]], "They hate the paperwork and love the signal."]],
    ["A Legal Licence and a Live Session", "The station goes legal. The first broadcast is a live session in your room.", ["Make it a weekly show", "Regular airtime, regular hustle.", [["reputation", 8], ["xp", 50]], "By week three the queue of bands reaches the stairs."], ["Do it once, do it brilliantly", "One hour, no repeats.", [["reputation", 5], ["money", 300]], "It trends for a day and is quoted for a year."]]
  ] },
  { code: "berlin", city: "berlin", place: "BERLIN", name: "The Bunker Tape", beats: [
    ["A Key to a Concrete Door", "A promoter hands you a key to a cold bunker and says the acoustics are unreal.", ["Bring a field recorder and go", "No schedule, no safety net.", [["xp", 40], ["reputation", 1]], "The reverb tail lasts eleven seconds. You clap and listen to it ring."], ["Send an assistant and stay in the studio", "Someone has to mind the desk.", [["xp", 15], ["money", 60]], "The recording comes back muddy but full of promise."]],
    ["The Bunker Wants a Residency", "The promoter wants a monthly night. The crowd shows up before the sound system does.", ["Rig the room with your own gear", "Heavy, expensive and worth it.", [["money", -180], ["reputation", 4], ["gearCondition", -4]], "The first night, you hear the room before the music starts."], ["Rent them a system and stay home", "Cleaner books, smaller story.", [["money", 150], ["reputation", 1]], "Cheques arrive on time. The night still sounds wonderful."]],
    ["The Bunker Album", "A live album from the bunker is being cut. Press want a cover and a story.", ["Own the story", "Put the studio name on the front.", [["reputation", 8], ["xp", 30]], "The review calls it the sound of a concrete cathedral."], ["Let the venue take the credit", "Quiet pride, solid fee.", [["money", 350], ["reputation", 3]], "You are in the credits. You are not on the cover."]]
  ] },
  { code: "tokyo", city: "tokyo", place: "TOKYO", name: "The Last Kissaten", beats: [
    ["A Jazz Cafe Is Closing", "A tiny cafe with a legendary record collection is closing at the end of the month. The owner says you can choose three.", ["Pick three and record the owner talking", "Preserve the voice as well as the vinyl.", [["xp", 40], ["reputation", 2]], "Ninety minutes of stories about every record on the wall."], ["Buy the collection outright", "Too much to lose to a stranger.", [["money", -200], ["reputation", 3]], "The shelves arrive in a van. The whole room smells of old paper."]],
    ["One Last Night of Music", "The owner asks for one live night with the regulars, and wants it recorded properly.", ["Record the night in full", "Dedicated mics and a full multitrack.", [["xp", 35], ["reputation", 4]], "Forty people, one piano, no applause until the last chord fades."], ["Keep it small and hands-off", "Let the night be a night.", [["reputation", 2], ["money", 100]], "You sit in the back with the owner and drink the last cup."]],
    ["The Records Get a Second Home", "A label wants to build a listening room around the collection. They want your studio involved.", ["Co-curate the room", "Share the shelves with the public.", [["reputation", 8], ["xp", 40]], "The new listening room opens with a queue around the block."], ["Sell the story, keep the vinyl", "A generous fee, a private shelf.", [["money", 400], ["reputation", 3]], "The story sells beautifully. The vinyl stays yours."]]
  ] },
  { code: "rio", city: "rio", place: "RIO", name: "The Carnival Rehearsal Tape", beats: [
    ["A Tape from Last Year", "A samba teacher brings a rehearsal tape from last year, ruined by a leaking roof, and asks if anything can be saved.", ["Bake the tape and try", "Eight hours in a low oven, fingers crossed.", [["xp", 40], ["reputation", 1]], "It plays for ninety seconds before it dies. They are the best ninety seconds you have heard."], ["Rebuild it from memory", "Re-record with the same players.", [["money", -90], ["reputation", 3]], "They remember every beat, and add a few new ones."]],
    ["The Drummers Want a Proper Album", "The whole school wants the rebuilt song on an album, in time for carnival.", ["Rush to finish before carnival", "Overtime and espresso.", [["money", -120], ["reputation", 4], ["xp", 30]], "You finish at dawn, the same hour the parade begins to form."], ["Take the season, release after", "Done right, if late.", [["reputation", 3], ["money", 100]], "They are impatient but proud, and the final mix is stunning."]],
    ["The Parade Plays Your Record", "The song opens the parade. Half the city hears it from a truck, a window and a bar.", ["Join the parade with the mixing desk", "Obviously.", [["reputation", 8], ["xp", 40], ["gearCondition", -3]], "You push a flight case through the crowd and no one is annoyed."], ["Watch from the roof with a thermos", "The best seat in the city.", [["reputation", 5], ["money", 250]], "You hear your own mix a block away and it holds up."]]
  ] },
  { code: "detroit", city: "detroit", place: "DETROIT", name: "The Arrangement Book", beats: [
    ["A Bandleader Leaves a Notebook", "A retired bandleader lends you a book of unfinished arrangements. One page has every part except the bass line.", ["Invite the old rhythm section", "Hear what the page cannot tell you.", [["money", -100], ["xp", 40]], "They argue about two bars, then play them perfectly."], ["Make a careful demo first", "Leave space for the missing part.", [["xp", 25], ["reputation", 1]], "The bandleader listens twice and taps the empty bars."]],
    ["The Missing Bass Player Calls", "The player who wrote the missing part has heard your demo. They want an afternoon in the room and their name on the record.", ["Give them the room and the credit", "Let the arrangement find its owner.", [["money", -120], ["reputation", 4]], "The line changes the whole song. You write their name in ink."], ["Pay for a written arrangement", "Clear credit, clear terms.", [["money", -60], ["xp", 30]], "The signed page arrives with three useful performance notes."]],
    ["A Neighbourhood Record Night", "The finished recording is ready. The local hall offers a listening night with the players in the front row.", ["Host it with the whole band", "A record belongs to the people in it.", [["reputation", 8], ["xp", 40]], "The room applauds the bass player before the final note."], ["Release it through a small label", "Keep the credits and share the proceeds.", [["money", 250], ["reputation", 4]], "The notebook returns with a new date and a thank-you on the cover."]]
  ] },
  { code: "lagos", city: "lagos", place: "LAGOS", name: "The Hotel Bandstand", beats: [
    ["A Hotel Band Needs a Quiet Morning", "A resident band asks to use the studio before their evening set. Their new song keeps growing longer on the bandstand.", ["Record the whole arrangement live", "Follow the band through every turn.", [["money", -90], ["xp", 40]], "The last chorus is twice as long and somehow feels shorter."], ["Start with a short rehearsal recording", "Find the shape before booking the session.", [["xp", 25], ["reputation", 1]], "The band circles two passages worth keeping."]],
    ["The Singer Brings Another Verse", "The rehearsal recording has travelled through the hotel staff. A singer arrives with a new verse and asks the band to try it.", ["Give everyone an afternoon together", "Let the new voice change the arrangement.", [["money", -120], ["reputation", 4]], "The horns answer the singer without a word from you."], ["Record a guide and send it to the band", "Keep the session small and clear.", [["xp", 30], ["reputation", 2]], "The players return a guide with a stronger ending."]],
    ["The Bandstand Hears the Master", "The hotel offers its bandstand for the first public play of the finished master. Everyone who helped wants to be there.", ["Make it a live release night", "Credit the room and every player.", [["reputation", 8], ["xp", 40]], "The audience sings the new verse before the band does."], ["Deliver copies with the session credits", "Let the record travel at its own pace.", [["money", 250], ["reputation", 4]], "The first copy goes behind the bar, with every name on the sleeve."]]
  ] }
];
var CITY_SAGA_EVENTS = SAGAS.flatMap(
  (s) => s.beats.map((beat, i) => {
    const [title, context, a, b] = beat;
    const n = i + 1;
    const key = `saga.${s.code}.${n}`;
    const optionFor = (letter, o) => ({
      id: `saga_${s.code}_${n}_${letter}`,
      label: o[0],
      flavorText: o[1],
      effects: fx(o[2]),
      memories: [{ scope: "studio", key, ttlDays: 400 }],
      outcome: o[3]
    });
    return {
      id: `saga_${s.code}_${n}`,
      family: `city-saga-${s.code}`,
      baseWeight: 14,
      cooldownDays: 20 + i * 4,
      maxOccurrences: 1,
      eligible: (f) => f.cityId === s.city && (n > 1 || f.reputation >= 12),
      requiredMemories: n > 1 ? [`studio/saga.${s.code}.${n - 1}`] : void 0,
      narrativeKey: `city.${key}`,
      kicker: `${s.place} // ${s.name.toUpperCase()} (${n}/3)`,
      title,
      context: () => context,
      options: [optionFor("a", a), optionFor("b", b)],
      delegable: true,
      defaultOptionId: `saga_${s.code}_${n}_b`
    };
  })
);
var SAGA_CITY_BY_EVENT = Object.fromEntries(
  SAGAS.flatMap((s) => [1, 2, 3].map((n) => [`saga_${s.code}_${n}`, s.city]))
);

// src/narrative/cityEventCity.ts
var PREFIXES = {
  la: "los-angeles",
  nashville: "nashville",
  london: "london",
  berlin: "berlin",
  tokyo: "tokyo",
  tok: "tokyo",
  rio: "rio",
  detroit: "detroit",
  lagos: "lagos"
};
var cityForEvent = (eventId) => {
  if (SAGA_CITY_BY_EVENT[eventId]) return SAGA_CITY_BY_EVENT[eventId];
  const city = PREFIXES[eventId.split("_")[0]];
  return city && CITIES.some((c) => c.id === city) ? city : void 0;
};

// src/features/usedGear/condition.ts
var maintenanceCategories = ["interface", "microphone", "mixer", "outboard"];
var isMaintainable = (item) => maintenanceCategories.includes(item.category);

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
  let state2 = hashSeed(seed);
  return () => {
    state2 += 1831565813;
    let value = state2;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

// src/narrative/eventDirector.ts
var DIRECTOR_GAP_DAYS = 3;
var FAMILY_MAX_IN_WINDOW = 2;
var FAMILY_WINDOW_RECORDS = 5;
var FAMILY_WINDOW_DAYS = 14;
var MEMORY_LIMIT = 200;
var HISTORY_LIMIT = 120;
var EFFECT_LIMITS = { money: 5e3, reputation: 25, xp: 500, clientXp: 100, staffXp: 60, gearCondition: 15 };
var EMPTY = { memories: [], history: [], opportunitySeq: 0 };
var getDirector = (state2) => state2.storylineState?.director ?? EMPTY;
var withDirector = (state2, director, chronicle) => {
  const story = state2.storylineState;
  if (!story) return state2;
  const next = { ...story, director };
  if (chronicle) next.chronicle = [...story.chronicle ?? [], chronicle].slice(-60);
  return { ...state2, storylineState: next };
};
var memoryId = (scope, key, entityId) => `${scope}:${entityId ?? "-"}/${key}`;
var isLive = (m, day) => m.expiresDay === void 0 || m.expiresDay > day;
var hasMemory = (state2, scope, key, entityId) => {
  const id = memoryId(scope, key, entityId);
  const day = state2.currentDay;
  return getDirector(state2).memories.some((m) => m.id === id && isLive(m, day));
};
var addMemory = (state2, write) => {
  if (!state2.storylineState) return state2;
  const director = getDirector(state2);
  const id = memoryId(write.scope, write.key, write.entityId);
  const memory = {
    id,
    scope: write.scope,
    entityId: write.entityId,
    key: write.key,
    createdDay: state2.currentDay,
    expiresDay: write.ttlDays !== void 0 ? state2.currentDay + write.ttlDays : void 0,
    intensity: write.intensity,
    sourceEventId: write.sourceEventId
  };
  const memories = [...director.memories.filter((m) => m.id !== id && isLive(m, state2.currentDay)), memory].slice(-MEMORY_LIMIT);
  return withDirector(state2, { ...director, memories });
};
var buildFacts = (state2) => ({
  day: state2.currentDay,
  era: state2.currentEra || state2.selectedEra || "",
  cityId: state2.cityId,
  money: state2.money ?? 0,
  reputation: state2.reputation ?? 0,
  staffCount: state2.hiredStaff?.length ?? 0,
  equipmentCount: state2.ownedEquipment?.length ?? 0,
  clients: Object.values(state2.clientRelationships ?? {}).sort((a, b) => a.clientId.localeCompare(b.clientId)),
  staff: (state2.hiredStaff ?? []).map((m) => ({ id: m.id, name: m.name })),
  gear: (state2.ownedEquipment ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    condition: e.condition,
    faulted: Boolean(e.fault && state2.currentDay < e.fault.readyDay),
    maintainable: isMaintainable(e)
  })),
  bands: (state2.bands ?? []).map((b) => ({
    id: b.id,
    name: b.bandName,
    genre: b.genre,
    fame: b.fame ?? 0,
    notoriety: b.notoriety ?? 0,
    onTour: Boolean(b.tourStatus?.isOnTour),
    isPlayerCreated: Boolean(b.isPlayerCreated),
    releases: b.pastReleases?.length ?? 0,
    daysSinceShow: typeof b.lastShowDay === "number" ? state2.currentDay - b.lastShowDay : void 0
  })),
  has: (scope, key, entityId) => hasMemory(state2, scope, key, entityId),
  flag: (name) => Boolean(state2.storylineState?.storyFlags?.[name])
});
var directorSeed = (state2, key, seq) => `${state2.saveSeed ?? state2.storylineState?.runSeed ?? 4242}:director:${state2.currentDay}:${key}:${seq}`;
var requiredMemoryHolds = (facts, key, subject) => key.startsWith("studio/") ? facts.has("studio", key.slice(7)) : subject ? facts.has(subject.scope, key, subject.id) : false;
var applyFamilyAntiRepeat = (state2, candidates) => {
  const recent = getDirector(state2).history.filter((h) => state2.currentDay - h.day <= FAMILY_WINDOW_DAYS).slice(-FAMILY_WINDOW_RECORDS);
  return candidates.filter((c) => recent.filter((h) => h.family === c.family).length < FAMILY_MAX_IN_WINDOW);
};
var pickWeighted = (state2, candidates, key) => {
  const pool = candidates.filter((c) => c.weight > 0);
  if (pool.length === 0) return null;
  const rng = createSeededRandom(directorSeed(state2, key, getDirector(state2).opportunitySeq));
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = rng() * total;
  for (const c of pool) {
    roll -= c.weight;
    if (roll < 0) return c;
  }
  return pool[pool.length - 1];
};
var recordSelection = (state2, record) => {
  if (!state2.storylineState) return state2;
  const director = getDirector(state2);
  const history = [...director.history, { ...record, day: state2.currentDay }].slice(-HISTORY_LIMIT);
  return withDirector(state2, { ...director, history, lastEventDay: state2.currentDay });
};
var resolveEligibleEvents = (state2, defs) => {
  const facts = buildFacts(state2);
  const director = getDirector(state2);
  const out = [];
  for (const def of defs) {
    const subject = def.pickSubject ? def.pickSubject(facts) : void 0;
    if (def.pickSubject && !subject) continue;
    if (!def.eligible(facts, subject)) continue;
    const mine = director.history.filter((h) => h.eventId === def.id && (!subject || h.subjectId === subject.id));
    if (def.maxOccurrences !== void 0 && mine.length >= def.maxOccurrences) continue;
    const lastAny = director.history.filter((h) => h.eventId === def.id).slice(-1)[0];
    if (lastAny && state2.currentDay - lastAny.day < def.cooldownDays) continue;
    if (def.requiredMemories && !def.requiredMemories.every((k) => requiredMemoryHolds(facts, k, subject))) continue;
    if (def.blockedMemories && def.blockedMemories.some((k) => requiredMemoryHolds(facts, k, subject))) continue;
    let weight = def.baseWeight;
    for (const [k, mult] of Object.entries(def.memoryWeights ?? {})) {
      if (requiredMemoryHolds(facts, k, subject)) weight *= mult;
    }
    out.push({ def, subject, weight });
  }
  return out;
};
var selectDirectorEvent = (state2, defs, opportunityKey) => {
  const eligible = resolveEligibleEvents(state2, defs);
  const allowed = applyFamilyAntiRepeat(
    state2,
    eligible.map((e) => ({ ...e, id: e.def.id, family: e.def.family }))
  );
  const pick = pickWeighted(state2, allowed, opportunityKey);
  return pick ? { def: pick.def, subject: pick.subject } : null;
};
var takeDirectorOpportunity = (state2, defs, opts = {}) => {
  const story = state2.storylineState;
  if (!story || opts.busy) return state2;
  const director = getDirector(state2);
  if (director.pending) return state2;
  if (director.lastOpportunityDay === state2.currentDay) return state2;
  const lastBeat = Math.max(director.lastEventDay ?? -999, opts.lastOtherBeatDay ?? -999);
  if (state2.currentDay - lastBeat < DIRECTOR_GAP_DAYS) return state2;
  const spent = withDirector(state2, {
    ...director,
    opportunitySeq: director.opportunitySeq + 1,
    lastOpportunityDay: state2.currentDay
  });
  const pick = selectDirectorEvent(spent, defs, `day${state2.currentDay}`);
  if (!pick) return spent;
  const recorded = recordSelection(spent, { eventId: pick.def.id, family: pick.def.family, subjectId: pick.subject?.id });
  const d = getDirector(recorded);
  return withDirector(recorded, { ...d, pending: { eventId: pick.def.id, openedDay: state2.currentDay, subject: pick.subject } });
};
var validateEffects = (effects) => effects.flatMap((e) => {
  switch (e.kind) {
    case "money":
    case "reputation":
    case "xp":
    case "clientXp":
    case "staffXp":
    case "gearCondition": {
      const cap = EFFECT_LIMITS[e.kind];
      const amount = Math.max(-cap, Math.min(cap, Math.round(Number(e.amount) || 0)));
      return amount === 0 ? [] : [{ kind: e.kind, amount }];
    }
    case "referral":
      return [{ kind: "referral", amount: 1 }];
    default:
      return [];
  }
});
var canAffordEffects = (state2, effects) => validateEffects(effects).filter((e) => e.kind === "money" && e.amount < 0).every((e) => (state2.money ?? 0) + e.amount >= 0);
var applyDomainEffects = (state2, effects, subjectId) => {
  let next = state2;
  for (const e of validateEffects(effects)) {
    switch (e.kind) {
      case "money":
        next = { ...next, money: Math.max(0, next.money + e.amount) };
        break;
      case "reputation":
        next = { ...next, reputation: Math.max(0, next.reputation + e.amount) };
        break;
      case "xp":
        next = { ...next, playerData: { ...next.playerData, xp: Math.max(0, (next.playerData?.xp ?? 0) + e.amount) } };
        break;
      case "staffXp":
        next = {
          ...next,
          hiredStaff: (next.hiredStaff ?? []).map((m) => ({ ...m, xpInRole: Math.max(0, (m.xpInRole ?? 0) + e.amount) }))
        };
        break;
      case "gearCondition": {
        const targeted = subjectId !== void 0 && (next.ownedEquipment ?? []).some((eq) => eq.id === subjectId);
        next = {
          ...next,
          ownedEquipment: (next.ownedEquipment ?? []).map((eq) => targeted && eq.id !== subjectId ? eq : {
            ...eq,
            condition: Math.max(0, Math.min(100, (eq.condition ?? 100) + e.amount))
          })
        };
        break;
      }
      case "clientXp":
      case "referral": {
        const rel = subjectId ? next.clientRelationships?.[subjectId] : void 0;
        if (!rel || !next.clientRelationships || !subjectId) break;
        next = {
          ...next,
          clientRelationships: {
            ...next.clientRelationships,
            [subjectId]: e.kind === "clientXp" ? { ...rel, relationshipXp: Math.max(0, rel.relationshipXp + e.amount) } : { ...rel, referralCount: rel.referralCount + 1 }
          }
        };
        break;
      }
    }
  }
  return next;
};
var resolveDirectorOption = (state2, defs, optionId) => {
  const pending = getDirector(state2).pending;
  if (!pending) return state2;
  const def = defs.find((d2) => d2.id === pending.eventId);
  if (!def) return withDirector(state2, { ...getDirector(state2), pending: void 0 });
  const option = def.options.find((o) => o.id === optionId);
  if (!option || !canAffordEffects(state2, option.effects)) return state2;
  let next = applyDomainEffects(state2, option.effects, pending.subject?.id);
  for (const m of option.memories ?? []) {
    next = addMemory(next, {
      ...m,
      scope: m.scope ?? (pending.subject ? pending.subject.scope : "studio"),
      entityId: (m.scope ?? (pending.subject ? pending.subject.scope : "studio")) === "studio" ? void 0 : pending.subject?.id,
      sourceEventId: def.id
    });
  }
  const d = getDirector(next);
  const history = d.history.map(
    (h, i, all) => i === findLastIndex(all, (r) => r.eventId === def.id && !r.optionId) ? { ...h, optionId } : h
  );
  return withDirector(
    next,
    { ...d, history, pending: void 0, lastEventDay: state2.currentDay },
    {
      day: state2.currentDay,
      kind: "event",
      title: pending.subject ? `${def.title} \u2014 ${pending.subject.label}` : def.title,
      outcome: option.outcome
    }
  );
};
var findLastIndex = (arr, pred) => {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
};

// src/narrative/narrativeEventPool.ts
var ERAS = ["analog60s", "digital80s", "internet2000s", "streaming2020s"];
var fromEra = (startIndex) => (facts) => ERAS.indexOf(facts.era) >= startIndex;
var hasBands = (facts) => facts.bands.length > 0;
var playerBand = (facts) => facts.bands.find((b) => b.isPlayerCreated);
var touringBand = (facts) => facts.bands.find((b) => b.onTour);
var bandSubject = (pick) => (facts) => {
  const band = pick(facts);
  return band ? { scope: "band", id: band.id, label: band.name } : void 0;
};
var opt = (o) => o;
var hasFinishedJobs = (facts) => facts.clients.some((c) => c.sessionsCompleted >= 1);
var NARRATIVE_EVENTS = [
  // ───────── Band ─────────
  {
    id: "garage_band_walkout",
    family: "band-life",
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 2,
    pickSubject: bandSubject(playerBand),
    eligible: (facts) => hasBands(facts) && facts.staffCount > 0,
    narrativeKey: "band.walkout",
    kicker: "BAND // THE ROOM WENT QUIET",
    title: "A Walkout",
    context: (s) => `${s?.label ?? "One of your bands"} has had enough. Nobody said when, and nobody is answering the phone.`,
    options: [
      opt({ id: "walkout_mediate", label: "Pay for mediation", flavorText: "A neutral room, everyone present.", effects: [{ kind: "money", amount: -400 }, { kind: "reputation", amount: 1 }], memories: [{ key: "band-tension-eased", ttlDays: 120 }], outcome: "They sit down, say the quiet part, and stay a band \u2014 for now." }),
      opt({ id: "walkout_overtime", label: "Offer more studio hours", flavorText: "Nothing but time.", effects: [{ kind: "staffXp", amount: 25 }, { kind: "money", amount: -120 }], memories: [{ key: "band-overworked", ttlDays: 60 }], outcome: "They take the deal. They are quieter in the room than before." }),
      opt({ id: "walkout_let_go", label: "Let them walk", flavorText: "Some bands end.", effects: [{ kind: "reputation", amount: -4 }], memories: [{ key: "band-member-quit" }], outcome: "The last take belongs to whoever stayed." })
    ],
    delegable: true,
    defaultOptionId: "walkout_mediate"
  },
  {
    id: "viral_cover",
    family: "band-life",
    baseWeight: 10,
    cooldownDays: 60,
    maxOccurrences: 3,
    pickSubject: bandSubject((facts) => facts.bands.find((b) => b.isPlayerCreated && b.releases > 0)),
    eligible: (facts) => facts.bands.some((b) => b.isPlayerCreated && b.releases > 0),
    narrativeKey: "band.viral-cover",
    kicker: "BAND // SOMEONE COVERED YOU",
    title: "An Unsanctioned Cover",
    context: (s) => `Someone recorded ${s?.label ?? "one of your bands"} in a bedroom studio and it is spreading faster than anything you made.`,
    options: [
      opt({ id: "cover_take_credit", label: "Claim the credit publicly", flavorText: "Free reach.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: 300 }], memories: [{ key: "band-cover-credit" }], outcome: "Your name rides it. So does the resentment." }),
      opt({ id: "cover_charge_fee", label: "Invoice the label", flavorText: "Paperwork as a weapon.", effects: [{ kind: "money", amount: 1100 }, { kind: "reputation", amount: -2 }], memories: [{ key: "band-cover-fee" }], outcome: "The money arrives. So does the story about you." })
    ]
  },
  {
    id: "tour_bus_breakdown",
    family: "band-life",
    baseWeight: 7,
    cooldownDays: 70,
    maxOccurrences: 3,
    pickSubject: bandSubject(touringBand),
    eligible: (facts) => facts.bands.some((b) => b.onTour),
    narrativeKey: "band.bus-breakdown",
    kicker: "BAND // STRANDED",
    title: "The Bus Is Not Moving",
    context: (s) => `${s?.label ?? "Your band"} is somewhere between towns with a broken bus and a promoter who does not appreciate excuses.`,
    options: [
      opt({ id: "bus_emergency_repair", label: "Pay the roadside bill", flavorText: "Get them to the next date.", effects: [{ kind: "money", amount: -700 }, { kind: "reputation", amount: 2 }], memories: [{ key: "tour-rescued" }], outcome: "They play the date. They tell the promoter who paid." }),
      opt({ id: "bus_cancel_dates", label: "Cancel the remaining dates", flavorText: "Cut the losses.", effects: [{ kind: "reputation", amount: -4 }], memories: [{ key: "tour-cancelled" }], outcome: "Three promoters remember. One of them is the one you need." })
    ]
  },
  {
    id: "reunion_rumor",
    family: "band-life",
    baseWeight: 5,
    cooldownDays: 90,
    maxOccurrences: 2,
    // Gated on bead c5b: the breakup slice has to write `band-broken-up` first.
    eligible: (facts) => hasFinishedJobs(facts) && facts.flag("band-broken-up"),
    narrativeKey: "band.reunion-rumor",
    kicker: "BAND // OLD NAMES IN A NEW STORY",
    title: "They Are Saying The Name Again",
    context: (s) => `Someone saw ${s?.label ?? "the old band"} at a show that was not billed as a reunion. The rumour has your studio on it.`,
    options: [
      opt({ id: "rumor_pursue", label: "Book the room and make it real", flavorText: "Law of the Reunion: every breakup is a future payday.", effects: [{ kind: "money", amount: -600 }, { kind: "reputation", amount: 5 }], memories: [{ key: "reunion-pursued" }], outcome: "You pay for a room they may never fill. They fill it." }),
      opt({ id: "rumor_ignore", label: "Let the rumour die", flavorText: "Some things stay finished.", effects: [{ kind: "reputation", amount: 1 }], memories: [{ key: "reunion-declined" }], outcome: "By next month nobody is asking." })
    ]
  },
  // ───────── Lore ─────────
  {
    id: "rival_diss_track",
    family: "lore-weave",
    baseWeight: 8,
    cooldownDays: 45,
    maxOccurrences: 3,
    eligible: fromEra(1),
    narrativeKey: "lore.rival-diss",
    kicker: "RIVAL // ON RECORD",
    title: "Somebody Answered",
    context: () => "A rival studio has put out a record with your name in the credits of the complaint. The trade press noticed before you did.",
    options: [
      opt({ id: "diss_ignore", label: "Say nothing at all", flavorText: "Let them age.", effects: [{ kind: "reputation", amount: -2 }], memories: [{ key: "rival-diss-ignored" }], outcome: "It is still being played on the radio in March." }),
      opt({ id: "diss_answer", label: "Answer on tape", flavorText: "Twelve inches of spine.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: -250 }], memories: [{ key: "rival-diss-answered" }], outcome: "The trade press now has two records and one story." })
    ]
  },
  {
    id: "console_law_anecdote",
    family: "lore-weave",
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 4,
    // Any era, but the room needs a history before it can have "the sentence everyone here lives by".
    eligible: (facts) => hasFinishedJobs(facts),
    narrativeKey: "lore.console-law",
    kicker: "CODEX // A LAW, RECALLED",
    title: "Somebody Wrote Your Law Down",
    context: () => "An old engineer drops by with the sentence everyone in this room has been living by, and an invoice-free favour to go with it.",
    options: [
      opt({ id: "law_coffee", label: "Buy the coffee and listen", flavorText: "Nothing beats a story for free.", effects: [{ kind: "xp", amount: 120 }, { kind: "reputation", amount: 1 }], memories: [{ key: "law-recalled" }], outcome: "You leave with a better way to explain the room." }),
      opt({ id: "law_spares", label: "Trade him the spare parts", flavorText: "Barter, not charity.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "money", amount: -60 }], memories: [{ key: "law-traded-spares" }], outcome: "He leaves with a drawer of valves. The rack runs cleaner." })
    ]
  },
  {
    id: "venue_anniversary",
    family: "lore-weave",
    baseWeight: 7,
    cooldownDays: 75,
    maxOccurrences: 3,
    // Historical weave: the Marquee Cellar era, or the stream festival era.
    eligible: (facts) => (facts.era === "analog60s" || facts.era === "streaming2020s") && hasFinishedJobs(facts),
    narrativeKey: "lore.venue-anniversary",
    kicker: "HISTORY // THE ROOM REMEMBERS",
    title: "An Anniversary Booking",
    context: () => "The venue your era is built on is celebrating, and the only studio they called is yours.",
    options: [
      opt({ id: "venue_take_slot", label: "Take the anniversary slot", flavorText: "The room will be full.", effects: [{ kind: "money", amount: 1500 }, { kind: "reputation", amount: 4 }], memories: [{ key: "venue-anniversary-played" }], outcome: "Everyone who ever queued on that street is in one room." }),
      opt({ id: "venue_send_rookie", label: "Send the newest engineer", flavorText: "Make it someone else\u2019s night.", effects: [{ kind: "staffXp", amount: 45 }, { kind: "money", amount: 500 }], memories: [{ key: "venue-rookie-sent" }], outcome: "They come back talking about it for a year." })
    ]
  },
  {
    id: "award_nomination",
    family: "lore-weave",
    baseWeight: 4,
    cooldownDays: 365,
    maxOccurrences: 2,
    pickSubject: (facts) => {
      const best = [...facts.clients].filter((c) => c.sessionsCompleted >= 3).sort((a, b) => b.relationshipXp - a.relationshipXp || a.clientId.localeCompare(b.clientId))[0];
      return best ? { scope: "client", id: best.clientId, label: best.clientName } : void 0;
    },
    eligible: (facts) => facts.reputation >= 45 && facts.clients.some((c) => c.sessionsCompleted >= 3),
    narrativeKey: "lore.award-nomination",
    kicker: "AWARDS // THE SHORTLIST",
    title: "You Have Been Nominated",
    context: (s) => `Your name is on the shortlist, and ${s?.label ?? "the client you built it with"} is the one who put it there.`,
    options: [
      opt({ id: "award_campaign", label: "Work the campaign", flavorText: "Spend money to be louder.", effects: [{ kind: "money", amount: -500 }, { kind: "reputation", amount: 8 }], memories: [{ key: "award-campaigned" }], outcome: "The trade notices you are playing the game. Then they vote." }),
      opt({ id: "award_thank_client", label: "Thank them instead", flavorText: "Credit where it is due.", effects: [{ kind: "reputation", amount: 3 }, { kind: "clientXp", amount: 30 }], memories: [{ key: "award-thanked-client" }], outcome: "The nomination goes nowhere. The relationship goes everywhere." })
    ],
    delegable: true,
    defaultOptionId: "award_thank_client"
  },
  // ───────── Studio ─────────
  {
    id: "tube_stash_find",
    family: "studio-trouble",
    baseWeight: 8,
    cooldownDays: 40,
    maxOccurrences: 4,
    // Historical weave: the tube era, or the plug-in era.
    eligible: (facts) => facts.equipmentCount > 0 && (facts.era === "analog60s" || facts.era === "streaming2020s"),
    narrativeKey: "studio.tube-stash",
    kicker: "STUDIO // THE BACK OF THE RACK",
    title: "A Stash Nobody Claimed",
    context: () => "Clearing out the back of the rack turned up a box that predates everyone currently working here.",
    options: [
      opt({ id: "stash_refurb", label: "Refurbish and keep it", flavorText: "Valves, cloth, patience.", effects: [{ kind: "gearCondition", amount: 8 }, { kind: "money", amount: -180 }], memories: [{ key: "stash-refurbished" }], outcome: "It goes back into the chain and sounds like itself again." }),
      opt({ id: "stash_sell", label: "Sell it on as found", flavorText: "Someone else\u2019s problem.", effects: [{ kind: "money", amount: 700 }, { kind: "gearCondition", amount: -3 }], memories: [{ key: "stash-sold" }], outcome: "It leaves the building before lunch." })
    ]
  },
  {
    id: "power_surge",
    family: "studio-trouble",
    baseWeight: 9,
    cooldownDays: 50,
    maxOccurrences: 4,
    eligible: (facts) => facts.equipmentCount > 0,
    narrativeKey: "studio.power-surge",
    kicker: "STUDIO // EVERYTHING AT ONCE",
    title: "The Mains Blew",
    context: () => "A surge came through the whole floor at once. Nothing is on fire. Several things are no longer working perfectly.",
    options: [
      opt({ id: "surge_engineer", label: "Call an engineer", flavorText: "Slow, proper, expensive.", effects: [{ kind: "money", amount: -550 }, { kind: "gearCondition", amount: 7 }], memories: [{ key: "surge-serviced" }], outcome: "Everything comes back better isolated than it left." }),
      opt({ id: "surge_ride_it", label: "Ride it out", flavorText: "It usually stops.", effects: [{ kind: "money", amount: 90 }, { kind: "gearCondition", amount: -9 }], memories: [{ key: "surge-ignored", ttlDays: 90 }], outcome: "The desk hums at a slightly different note now." })
    ],
    delegable: true,
    defaultOptionId: "surge_engineer"
  },
  {
    id: "intern_prodigy",
    family: "studio-trouble",
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (facts) => facts.staffCount > 0,
    narrativeKey: "studio.intern-prodigy",
    kicker: "STUDIO // SOMEONE IS LEARNING FAST",
    title: "The One You Least Expected",
    context: () => "The newest person on the roster has quietly stopped needing the session explained twice.",
    options: [
      opt({ id: "prodigy_own_session", label: "Give them their own session", flavorText: "Trust, early.", effects: [{ kind: "staffXp", amount: 50 }, { kind: "money", amount: 350 }], memories: [{ key: "prodigy-trusted" }], outcome: "They run the session. It holds." }),
      opt({ id: "prodigy_shadow", label: "Keep them shadowing", flavorText: "Nothing goes wrong.", effects: [{ kind: "staffXp", amount: 20 }, { kind: "reputation", amount: 1 }], memories: [{ key: "prodigy-shadowing" }], outcome: "They keep watching. They keep getting better." })
    ],
    delegable: true,
    defaultOptionId: "prodigy_shadow"
  },
  {
    id: "sync_brief_lands",
    family: "studio-trouble",
    baseWeight: 11,
    cooldownDays: 30,
    maxOccurrences: 4,
    // Historical weave: the download era (iTunes / social feeds).
    eligible: (facts) => facts.reputation >= 30 && facts.era === "internet2000s",
    narrativeKey: "studio.sync-brief",
    kicker: "STUDIO // A SYNC, UNSOLICITED",
    title: "A Brief With Your Name On It",
    context: () => "A picture and an advert want a needle drop, they heard your room, and they want it this week.",
    options: [
      opt({ id: "sync_take_it", label: "Take the session", flavorText: "Deadline money.", effects: [{ kind: "money", amount: 900 }, { kind: "reputation", amount: 3 }], memories: [{ key: "sync-landed" }], outcome: "It airs on schedule. Everyone asks who did the needle drop." }),
      opt({ id: "sync_decline", label: "Decline politely", flavorText: "The calendar is honest.", effects: [{ kind: "reputation", amount: 2 }, { kind: "money", amount: 0 }], memories: [{ key: "sync-declined" }], outcome: "They find someone else, and remember that you were busy." })
    ]
  }
];

// src/narrative/cityEvents.ts
var opt2 = (o) => o;
var CITY_EVENTS = [
  {
    id: "la_label_dropin",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 60,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "los-angeles" && f.reputation >= 15,
    narrativeKey: "city.la.label-dropin",
    kicker: "LOS ANGELES // A&R IN THE LOBBY",
    title: "An A&R Walks In Off Sunset",
    context: () => "A label scout was in the building for another room and heard your monitors through the wall. They have twenty minutes and a business card.",
    options: [
      opt2({ id: "la_play_reel", label: "Play them your best reel", flavorText: "Twenty minutes, no second take.", effects: [{ kind: "reputation", amount: 5 }, { kind: "money", amount: 200 }], outcome: "They leave a finder fee on the desk and a promise to call." }),
      opt2({ id: "la_hold_slot", label: "Keep the booking, offer a rain check", flavorText: "Clients first.", effects: [{ kind: "clientXp", amount: 12 }], outcome: "Your client notices. The scout writes down the studio name anyway." })
    ],
    delegable: true,
    defaultOptionId: "la_hold_slot"
  },
  {
    id: "nashville_songwriter_round",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "nashville",
    narrativeKey: "city.nashville.round",
    kicker: "NASHVILLE // WRITERS IN THE ROUND",
    title: "A Songwriters\u2019 Round Needs a Room",
    context: () => "Four writers want to demo a whole night of songs on a handshake and a tip jar. Whatever you charge, the songs will be good.",
    options: [
      opt2({ id: "nash_host", label: "Host the round at cost", flavorText: "Coffee, a few mics, no invoice.", effects: [{ kind: "money", amount: -120 }, { kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }], outcome: "By midnight there are three songs worth finishing and one you will hum for a week." }),
      opt2({ id: "nash_book_paid", label: "Book it as a paid half-day", flavorText: "Fair rate, fair songs.", effects: [{ kind: "money", amount: 260 }], outcome: "They pay on the spot and promise to bring friends." })
    ],
    delegable: true,
    defaultOptionId: "nash_book_paid"
  },
  {
    id: "london_pirate_radio",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "london",
    narrativeKey: "city.london.pirate-radio",
    kicker: "LONDON // THE AERIAL ON THE ROOF",
    title: "Pirate Radio Wants an Exclusive",
    context: () => "A pirate station on the twelfth floor next door wants to play your latest session before anyone else has heard it. Quietly, of course.",
    options: [
      opt2({ id: "lon_give_it", label: "Hand over the rough mix", flavorText: "Buzz is currency.", effects: [{ kind: "reputation", amount: 6 }, { kind: "clientXp", amount: -6 }], outcome: "The phones light up. Your client is flattered and a little annoyed." }),
      opt2({ id: "lon_ask_client", label: "Ask the client first", flavorText: "Permission, then volume.", effects: [{ kind: "clientXp", amount: 10 }, { kind: "reputation", amount: 2 }], outcome: "They say yes with a grin. A smaller splash, a bigger thank-you." })
    ],
    delegable: true,
    defaultOptionId: "lon_ask_client"
  },
  {
    id: "berlin_curfew_night",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "berlin",
    narrativeKey: "city.berlin.curfew",
    kicker: "BERLIN // THE NIGHT THAT DID NOT END",
    title: "The Club Next Door Never Closed",
    context: () => "The bass from the club next door has been leaking through your live room since midnight. A promoter pokes his head in: want to record the afterparty?",
    options: [
      opt2({ id: "ber_record_it", label: "Roll tape on the afterparty", flavorText: "Raw, loud, unrepeatable.", effects: [{ kind: "money", amount: 220 }, { kind: "gearCondition", amount: -4 }, { kind: "xp", amount: 30 }], outcome: "You get a hundred minutes of something nobody will ever be able to recreate." }),
      opt2({ id: "ber_soundproof", label: "Insist on a quiet night", flavorText: "Pay the promoter in good faith.", effects: [{ kind: "money", amount: -80 }, { kind: "clientXp", amount: 8 }], outcome: "The promoter respects it. The bass drops two floors down." })
    ],
    delegable: true,
    defaultOptionId: "ber_soundproof"
  },
  {
    id: "tokyo_city_pop_revival",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "tokyo",
    narrativeKey: "city.tokyo.city-pop",
    kicker: "TOKYO // THE VINYL BAR DOWNSTAIRS",
    title: "A Reissue Label Wants Your Room",
    context: () => "The owner of the vinyl bar downstairs is reissuing a forgotten record and wants it remastered through your gear. The tapes are in a shoebox.",
    options: [
      opt2({ id: "tok_remaster", label: "Take the remaster job", flavorText: "Patience, steady hands, no clipping.", effects: [{ kind: "money", amount: 240 }, { kind: "xp", amount: 35 }], outcome: "The tapes sing. The owner bows lower than you expected." }),
      opt2({ id: "tok_trade", label: "Trade it for a rare fader set", flavorText: "Gear for goodwill.", effects: [{ kind: "gearCondition", amount: 8 }, { kind: "reputation", amount: 3 }], outcome: "Your console feels newer than it has in a decade." })
    ],
    delegable: true,
    defaultOptionId: "tok_remaster"
  },
  {
    id: "rio_carnival_rehearsal",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "rio",
    narrativeKey: "city.rio.carnival",
    kicker: "RIO // A HUNDRED DRUMS AT THE DOOR",
    title: "A Samba School Brings the Whole Bateria",
    context: () => "A samba school wants to record its carnival rehearsal in your room. It does not fit. They intend to make it fit.",
    options: [
      opt2({ id: "rio_full_band", label: "Open every door and record it all", flavorText: "Mic the street, mic the stairs.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: 120 }, { kind: "gearCondition", amount: -3 }], outcome: "It is the loudest and best thing you have ever put to tape." }),
      opt2({ id: "rio_small_group", label: "Take the percussion section only", flavorText: "Quality over crowd.", effects: [{ kind: "money", amount: 180 }, { kind: "xp", amount: 25 }], outcome: "Clean, tight, danceable, and the drums still shake the glass." })
    ],
    delegable: true,
    defaultOptionId: "rio_small_group"
  },
  {
    id: "detroit_house_band_call",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "detroit",
    narrativeKey: "city.detroit.house-band",
    kicker: "DETROIT // THE RHYTHM SECTION IS READY",
    title: "A House Band Has One Free Hour",
    context: () => "A rhythm section arrives between label dates with one hour, a finished arrangement and the tightest pocket in town.",
    options: [
      opt2({ id: "det_roll_tape", label: "Roll tape immediately", flavorText: "No rehearsal needed.", effects: [{ kind: "money", amount: -100 }, { kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }], outcome: "The first take locks so hard the second feels unnecessary." }),
      opt2({ id: "det_book_later", label: "Book a proper paid date", flavorText: "Give the session room to breathe.", effects: [{ kind: "money", amount: 220 }, { kind: "clientXp", amount: 6 }], outcome: "They leave a deposit and the arrangement on your piano." })
    ],
    delegable: true,
    defaultOptionId: "det_book_later"
  },
  {
    id: "lagos_generator_session",
    family: "city-local",
    baseWeight: 9,
    cooldownDays: 55,
    maxOccurrences: 3,
    eligible: (f) => f.cityId === "lagos",
    narrativeKey: "city.lagos.generator",
    kicker: "LAGOS // THE LIGHTS GO OUT",
    title: "The Generator Joins the Rhythm Section",
    context: () => "Power drops halfway through a live take. The backup generator catches, humming almost exactly in key, and the band never stops.",
    options: [
      opt2({ id: "lag_keep_rolling", label: "Keep rolling on backup power", flavorText: "The groove survived; follow it.", effects: [{ kind: "xp", amount: 40 }, { kind: "reputation", amount: 4 }, { kind: "gearCondition", amount: -3 }], outcome: "The generator hum becomes part of the breakdown." }),
      opt2({ id: "lag_reset", label: "Reset and protect the equipment", flavorText: "Clean power, fresh take.", effects: [{ kind: "money", amount: -100 }, { kind: "gearCondition", amount: 4 }], outcome: "The next take is safer, cleaner and nearly as alive." })
    ],
    delegable: true,
    defaultOptionId: "lag_reset"
  }
];
var local = (id, city, key, kicker, title, context, a, b, defaultOptionId, gate = () => true) => ({
  id,
  family: "city-local",
  baseWeight: 8,
  cooldownDays: 65,
  maxOccurrences: 2,
  eligible: (f) => f.cityId === city && gate(f),
  narrativeKey: `city.${key}`,
  kicker,
  title,
  context: () => context,
  options: [opt2(a), opt2(b)],
  delegable: true,
  defaultOptionId
});
var MORE_CITY_EVENTS = [
  local(
    "la_session_player_dropin",
    "los-angeles",
    "la.session-player",
    "LOS ANGELES // A FAMOUS HAND",
    "A Session Legend Needs a Room for an Hour",
    "A session guitarist who has played on half the records in your collection has an hour free and a cancelled booking across town.",
    { id: "la_sp_pay", label: "Pay their rate and record something", flavorText: "One take, one hour.", effects: [{ kind: "money", amount: -180 }, { kind: "xp", amount: 45 }, { kind: "reputation", amount: 3 }], outcome: "You get a take nobody else in town can play." },
    { id: "la_sp_trade", label: "Trade the hour for a favour", flavorText: "They owe you one.", effects: [{ kind: "clientXp", amount: 12 }, { kind: "reputation", amount: 2 }], outcome: "They shake your hand. The favour is noted in a very small book." },
    "la_sp_trade"
  ),
  local(
    "la_heatwave_blackout",
    "los-angeles",
    "la.heatwave",
    "LOS ANGELES // 41 DEGREES",
    "The Heatwave Takes the Power",
    "A brownout rolls across the valley. The air conditioning dies, the racks start to cook and a nervous client sits in the live room.",
    { id: "la_hw_generator", label: "Rent a generator", flavorText: "Loud, but safe.", effects: [{ kind: "money", amount: -260 }, { kind: "gearCondition", amount: 4 }], outcome: "Everything survives. The client buys lunch." },
    { id: "la_hw_shut", label: "Shut down and wait", flavorText: "Cool the room, rebook the day.", effects: [{ kind: "clientXp", amount: -6 }, { kind: "gearCondition", amount: 2 }], outcome: "Nothing breaks. Nothing gets recorded either." },
    "la_hw_generator"
  ),
  local(
    "nashville_demo_wall",
    "nashville",
    "nashville.demo-wall",
    "NASHVILLE // THE DEMO WALL",
    "A Wall of Cassettes Falls Off the Shelf",
    "Someone leans on the shelf and a decade of unlabelled demos hits the floor. One of the tapes has a song you recognise from the radio.",
    { id: "nash_dw_digitise", label: "Digitise the whole wall", flavorText: "A weekend of transfers.", effects: [{ kind: "xp", amount: 55 }, { kind: "reputation", amount: 3 }], outcome: "You find three songs worth recording again." },
    { id: "nash_dw_sell", label: "Sell the radio one to a publisher", flavorText: "Quick money.", effects: [{ kind: "money", amount: 300 }, { kind: "reputation", amount: -2 }], outcome: "The publisher is delighted. The writer is not." },
    "nash_dw_digitise"
  ),
  local(
    "nashville_open_mic",
    "nashville",
    "nashville.open-mic",
    "NASHVILLE // WEDNESDAY NIGHT",
    "The Open Mic Down the Street Wants a Mixer",
    "The bar around the corner has a famous open mic and a broken board. The owner needs a mixer by seven.",
    { id: "nash_om_volunteer", label: "Volunteer for the night", flavorText: "Fix the board, run the room.", effects: [{ kind: "reputation", amount: 4 }, { kind: "xp", amount: 30 }], outcome: "You meet three writers and one future client." },
    { id: "nash_om_invoice", label: "Send an invoice", flavorText: "Fair work, fair pay.", effects: [{ kind: "money", amount: 140 }], outcome: "The owner pays on the nail and offers you a free pint." },
    "nash_om_invoice"
  ),
  local(
    "london_tube_strike",
    "london",
    "london.tube-strike",
    "LONDON // NO TRAINS",
    "The Tube Strike Strands the Band",
    "Half your session is stuck on a platform in zone four. The other half is already in the live room, drinking tea.",
    { id: "lon_ts_rework", label: "Re-plan the day around who is here", flavorText: "Start with the rhythm section.", effects: [{ kind: "xp", amount: 35 }, { kind: "clientXp", amount: 6 }], outcome: "The day gets stranger and the record gets better." },
    { id: "lon_ts_cabs", label: "Send cabs for the rest", flavorText: "Pay for punctuality.", effects: [{ kind: "money", amount: -140 }, { kind: "clientXp", amount: 10 }], outcome: "Everyone arrives annoyed. The take that follows is excellent." },
    "lon_ts_rework"
  ),
  local(
    "london_music_press",
    "london",
    "london.press",
    "LONDON // NEXT WEEK'S COVER",
    "A Writer from the Music Press Wants a Studio Visit",
    "A weekly music paper wants five hundred words on your room. They also want a quote about your favourite microphone.",
    { id: "lon_mp_yes", label: "Give them the full tour", flavorText: "Honest, charming, slightly too long.", effects: [{ kind: "reputation", amount: 5 }], outcome: "The piece runs under a headline you did not choose." },
    { id: "lon_mp_polite", label: "Politely decline", flavorText: "Let the records talk.", effects: [{ kind: "clientXp", amount: 6 }], outcome: "Your clients like your discretion." },
    "lon_mp_yes"
  ),
  local(
    "berlin_techno_loan",
    "berlin",
    "berlin.loan",
    "BERLIN // A CABLE LOOM",
    "The Club Wants to Borrow Your Speakers",
    "A club three streets over has blown a stack and the headliner lands at midnight. They offer to rent your monitors for a night.",
    { id: "ber_tl_rent", label: "Rent them out", flavorText: "Make them a deal.", effects: [{ kind: "money", amount: 240 }, { kind: "gearCondition", amount: -5 }], outcome: "They come back hot, bass-dusted and perfectly fine." },
    { id: "ber_tl_decline", label: "Say no and keep the room quiet", flavorText: "Your clients come first.", effects: [{ kind: "clientXp", amount: 8 }], outcome: "The promoter respects that and finds a loan elsewhere." },
    "ber_tl_decline"
  ),
  local(
    "berlin_modular_swap",
    "berlin",
    "berlin.modular",
    "BERLIN // THE RACK IN THE CORNER",
    "A Modular Wizard Offers a Swap",
    "A local synth builder with silver rings and no sleep offers a patched-up voice module in exchange for a day of studio time.",
    { id: "ber_ms_swap", label: "Take the swap", flavorText: "Time for sound.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "xp", amount: 40 }], outcome: "Your studio has a new voice and a few new bruises on the patch bay." },
    { id: "ber_ms_cash", label: "Rent them the room for cash", flavorText: "Keep it simple.", effects: [{ kind: "money", amount: 210 }], outcome: "They bring their own cables and leave them behind." },
    "ber_ms_cash"
  ),
  local(
    "tokyo_karaoke_night",
    "tokyo",
    "tokyo.karaoke",
    "TOKYO // PRIVATE ROOM 7",
    "A Label Throws a Karaoke Night",
    "A label is looking for a backing-track engineer and has booked you a seat at a very long table.",
    { id: "tok_kn_sing", label: "Sing one song", flavorText: "Courage, not talent.", effects: [{ kind: "reputation", amount: 4 }, { kind: "clientXp", amount: 8 }], outcome: "You are terrible. They love you for it." },
    { id: "tok_kn_pitch", label: "Pitch the label instead", flavorText: "Be the professional in the room.", effects: [{ kind: "money", amount: 220 }], outcome: "You leave with a contract and a very strange haircut photo." },
    "tok_kn_pitch"
  ),
  local(
    "tokyo_earthquake_drill",
    "tokyo",
    "tokyo.drill",
    "TOKYO // 3.2 ON THE SCALE",
    "A Small Quake Shakes the Racks",
    "The racks sway and a rack-mount compressor slides a few millimetres off its ears. Nothing falls, but the whole room is thinking about it.",
    { id: "tok_ed_secure", label: "Strap down the racks", flavorText: "Prepare properly.", effects: [{ kind: "money", amount: -160 }, { kind: "gearCondition", amount: 5 }], outcome: "The racks are quiet and a lot more confident." },
    { id: "tok_ed_ignore", label: "Carry on recording", flavorText: "It was only a small one.", effects: [{ kind: "gearCondition", amount: -5 }, { kind: "xp", amount: 20 }], outcome: "You get a great take and a cracked hinge." },
    "tok_ed_secure"
  ),
  local(
    "rio_street_party",
    "rio",
    "rio.street-party",
    "RIO // A BLOCK PARTY AT THE DOOR",
    "The Street Party Wants Your Console",
    "A block party has set up speakers in the street. They would very much like to wheel your mixing desk out to the pavement.",
    { id: "rio_sp_lend", label: "Wheel it out", flavorText: "Mics in the street, desk on the kerb.", effects: [{ kind: "reputation", amount: 6 }, { kind: "gearCondition", amount: -6 }], outcome: "You record the best crowd you have ever heard. The desk smells of caipirinha." },
    { id: "rio_sp_mics", label: "Send two mics and an engineer", flavorText: "Compromise, with cables.", effects: [{ kind: "reputation", amount: 3 }, { kind: "money", amount: 120 }], outcome: "You get a hundred friends and a clean multitrack." },
    "rio_sp_mics"
  ),
  local(
    "rio_rainy_season",
    "rio",
    "rio.rain",
    "RIO // THE RAINY SEASON",
    "The Roof Starts Singing",
    "The tropical rain finds a hole in the live room roof and starts a rhythm of its own on the snare drum.",
    { id: "rio_rs_repair", label: "Patch the roof", flavorText: "Buckets first, tiles after.", effects: [{ kind: "money", amount: -200 }, { kind: "gearCondition", amount: 3 }], outcome: "Dry, tidy and a little sad." },
    { id: "rio_rs_record", label: "Record the rain as an instrument", flavorText: "Roll tape, close the window.", effects: [{ kind: "xp", amount: 50 }, { kind: "gearCondition", amount: -4 }], outcome: "It ends up on three records and a ringtone." },
    "rio_rs_repair"
  ),
  local(
    "detroit_ballroom_echo",
    "detroit",
    "detroit.ballroom",
    "DETROIT // THE BALLROOM FLOOR",
    "A Ballroom Offers You the Room After Midnight",
    "The old dance hall is empty after midnight, and its wooden floor turns every snare hit into a second drummer.",
    { id: "det_be_record", label: "Move the drums there tonight", flavorText: "One van, many stairs.", effects: [{ kind: "xp", amount: 45 }, { kind: "reputation", amount: 4 }, { kind: "money", amount: -100 }], outcome: "The room gives the chorus a backbeat you could not program." },
    { id: "det_be_sample", label: "Capture the room ambience", flavorText: "Bring the room back to the studio.", effects: [{ kind: "xp", amount: 25 }, { kind: "money", amount: 100 }], outcome: "The room recording is tidy. The caretaker says the real room sounds better." },
    "det_be_sample"
  ),
  local(
    "detroit_drum_machine",
    "detroit",
    "detroit.drum-machine",
    "DETROIT // A MACHINE FROM A BASEMENT",
    "A DJ Brings a Modified Drum Machine",
    "A local DJ has rewired an old rhythm box until the kick rattles the patch bay. They need a clean two-track master by dawn.",
    { id: "det_dm_master", label: "Master it loud and clean", flavorText: "Precision at club volume.", effects: [{ kind: "money", amount: 220 }, { kind: "xp", amount: 35 }], outcome: "At sunrise the loop still sounds like the future." },
    { id: "det_dm_trade", label: "Trade the fee for the modification notes", flavorText: "Learn the circuit.", effects: [{ kind: "gearCondition", amount: 6 }, { kind: "xp", amount: 25 }], outcome: "Your technician reads the notes twice and reaches for a soldering iron." },
    "det_dm_master"
  ),
  local(
    "lagos_horn_section",
    "lagos",
    "lagos.horns",
    "LAGOS // ELEVEN HORNS IN RECEPTION",
    "A Touring Horn Section Needs a Demo",
    "Eleven players arrive between shows with three arrangements and exactly enough cash for one hour.",
    { id: "lag_hs_full", label: "Mic the whole section live", flavorText: "Clear the room and count them in.", effects: [{ kind: "reputation", amount: 5 }, { kind: "xp", amount: 35 }, { kind: "gearCondition", amount: -2 }], outcome: "The air in the room moves before the meters do." },
    { id: "lag_hs_split", label: "Record them in smaller groups", flavorText: "Control the spill.", effects: [{ kind: "money", amount: 180 }, { kind: "xp", amount: 20 }], outcome: "Every note is clean, though the players miss shouting across the room." },
    "lag_hs_split"
  ),
  local(
    "lagos_radio_jingle",
    "lagos",
    "lagos.radio",
    "LAGOS // LIVE FROM THE RADIO HOUSE",
    "A Radio Host Needs a Theme by Evening",
    "A drive-time host wants a new theme before tonight\u2019s show: memorable in five seconds, unmistakably local in ten.",
    { id: "lag_rj_band", label: "Bring in a live rhythm section", flavorText: "Make five seconds feel enormous.", effects: [{ kind: "money", amount: -80 }, { kind: "reputation", amount: 5 }, { kind: "xp", amount: 25 }], outcome: "By the second broadcast, callers sing it before the host does." },
    { id: "lag_rj_keys", label: "Build it quickly on keys", flavorText: "Fast, bright, delivered.", effects: [{ kind: "money", amount: 220 }], outcome: "The station pays before airtime and asks for three more." },
    "lag_rj_keys"
  )
];

// src/narrative/recurringClient.ts
var fx2 = (rows) => rows.map(([kind, amount]) => ({ kind, amount }));
var TTL = 5e3;
var ERA_ORDER = ["analog60s", "digital80s", "internet2000s", "streaming2020s"];
var eraIdx = (era) => Math.max(0, ERA_ORDER.indexOf(era));
var BEATS = [
  {
    era: "analog60s",
    minRep: 15,
    title: "The Girl with the Borrowed Guitar",
    context: "A teenager called Wren Calloway turns up with a borrowed guitar and two songs she wrote on the bus. She says she is moving on to another city next month and wants something to take with her.",
    a: ["Give her a free afternoon", "Tape rolling, no invoice.", [["xp", 35], ["reputation", 2]], "Two songs in four takes. She leaves with an acetate and writes your address on her hand.", "wren.generous"],
    b: ["Book her at the cheap rate", "Fair is fair.", [["money", 60], ["xp", 15]], "She pays in coins and thanks you twice.", "wren.fair"]
  },
  {
    era: "digital80s",
    minRep: 0,
    title: "Wren Calloway, Now With Synthesisers",
    context: "Years on and a different city on the postmark, Wren walks in with a drum machine under one arm. She says she has been recording in rooms all over, and wants to make something that sounds nothing like where she started.",
    a: ["Let her take over the room for a week", "She wants to experiment, so let her.", [["xp", 40], ["reputation", 3], ["gearCondition", -3]], "Seven days, one record, a lot of fingerprints on the desk. It sounds like the future.", "wren.experiment"],
    b: ["Keep it to a tight three-day session", "Focused and billable.", [["money", 200], ["reputation", 2]], "Three days, four songs, a neat invoice and a happy artist.", "wren.focused"]
  },
  {
    era: "internet2000s",
    minRep: 0,
    title: "Wren Puts the Record Online",
    context: "Wren has self-released and the downloads are climbing. A label has noticed and wants the masters. She calls from yet another time zone to ask what you think.",
    a: ["Tell her to stay independent", "Keep the masters, keep the story.", [["reputation", 5], ["xp", 30]], "She turns the label down and credits your room in the thread. It trends for a weekend.", "wren.independent"],
    b: ["Help her negotiate a fair deal", "Read the contract with her.", [["money", 250], ["reputation", 3]], "You mark up the contract together. The final version is the first one she is proud to sign.", "wren.signed"]
  },
  {
    era: "streaming2020s",
    minRep: 0,
    title: "Wren Calloway, Last Chorus",
    context: "Wren is a veteran now, with a catalogue and a quiet tour bus. Her farewell album is the last thing on her list, and she wants to cut it in the room where the first acetate was made.",
    a: ["Close the studio for her and tell the story", "Let the room be part of the record.", [["reputation", 10], ["xp", 50], ["money", 150]], "The album opens with the sound of your door closing. The reviews quote it.", "wren.farewell"],
    b: ["Record it quietly and keep the credit small", "A small credit, a long friendship.", [["money", 400], ["reputation", 4]], "It is the best session of her career. Your name is in the notes, in small print, and she sends a card.", "wren.quiet"]
  }
];
var RECURRING_CLIENT_EVENTS = BEATS.map((beat, i) => {
  const n = i + 1;
  const key = `wren.${n}`;
  const optionFor = (letter, o) => ({
    id: `wren_${n}_${letter}`,
    label: o[0],
    flavorText: o[1],
    effects: fx2(o[2]),
    memories: [{ scope: "studio", key, ttlDays: TTL }, { scope: "studio", key: o[4], ttlDays: TTL }],
    outcome: o[3]
  });
  return {
    id: `wren_${n}`,
    family: "recurring-client-wren",
    baseWeight: 14,
    cooldownDays: 30,
    maxOccurrences: 1,
    // Entry from any era: a beat opens in its own era or later, once the earlier beat is done or its era has passed.
    // A later beat's memory blocks the earlier ones, so the order only ever moves forward.
    eligible: (f) => eraIdx(f.era) >= eraIdx(beat.era) && f.reputation >= beat.minRep && (n === 1 || f.has("studio", `wren.${n - 1}`) || eraIdx(f.era) > eraIdx(BEATS[i - 1].era)),
    blockedMemories: BEATS.slice(i + 1).map((_, j) => `studio/wren.${n + 1 + j}`),
    narrativeKey: `client.wren.${n}`,
    kicker: `WREN CALLOWAY // THE CLIENT WHO FOLLOWED (${n}/4)`,
    title: beat.title,
    context: () => beat.context,
    options: [optionFor("a", beat.a), optionFor("b", beat.b)],
    delegable: true,
    defaultOptionId: `wren_${n}_b`
  };
});

// src/narrative/gearUpkeep.ts
var TROUBLE_CONDITION = 40;
var troubled = (facts) => {
  const g = [...facts.gear].filter((x) => x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION || x.faulted)).sort((a, b) => (a.condition ?? 100) - (b.condition ?? 100) || a.id.localeCompare(b.id))[0];
  return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
};
var GEAR_UPKEEP_EVENTS = [
  {
    id: "gear_trouble",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 15,
    maxOccurrences: 1,
    pickSubject: troubled,
    eligible: () => true,
    narrativeKey: "gear.trouble",
    kicker: "THE RACK // SOMETHING IS OFF",
    title: "A Piece of Gear Is Sulking",
    context: (s) => `${s?.label ?? "A piece of gear"} has started crackling and cutting out. Nothing is broken for good, but it will keep getting in the way of sessions until someone deals with it.`,
    options: [
      { id: "gear_trouble_a", label: "Pay for a proper service now", flavorText: "Parts and a careful afternoon.", effects: [{ kind: "money", amount: -60 }, { kind: "gearCondition", amount: 12 }], memories: [{ key: "serviced-early", ttlDays: 120 }], outcome: "The contacts are cleaned and the pots reseated. It sounds like new." },
      { id: "gear_trouble_b", label: "Work around it for now", flavorText: "Plenty of life left, if you are careful.", effects: [], memories: [{ key: "run-rough", ttlDays: 60 }], outcome: "You tape a note to the front and book around it." }
    ],
    delegable: true,
    defaultOptionId: "gear_trouble_b"
  },
  {
    id: "gear_trouble_payoff",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["serviced-early"],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has("gear", "serviced-early", x.id));
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: () => true,
    narrativeKey: "gear.payoff",
    kicker: "THE RACK // WORTH THE AFTERNOON",
    title: "It Has Never Sounded Better",
    context: (s) => `A visiting engineer plugs into ${s?.label ?? "the serviced piece"} and asks what you did to it. The service paid off, and word gets around.`,
    options: [
      { id: "gear_payoff_a", label: "Share the trick", flavorText: "Good gear talk is good business.", effects: [{ kind: "reputation", amount: 2 }, { kind: "xp", amount: 25 }], memories: [], outcome: "They write the settings on their hand and tell two friends." },
      { id: "gear_payoff_b", label: "Keep it to yourself", flavorText: "A studio secret.", effects: [{ kind: "xp", amount: 15 }], memories: [], outcome: "You smile and say it is all in the cables." }
    ],
    delegable: true,
    defaultOptionId: "gear_payoff_b"
  },
  {
    id: "gear_trouble_fallout",
    family: "gear-upkeep",
    baseWeight: 12,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["run-rough"],
    pickSubject: (facts) => {
      const g = facts.gear.find((x) => facts.has("gear", "run-rough", x.id) && x.maintainable && ((x.condition ?? 100) < TROUBLE_CONDITION + 10 || x.faulted));
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: () => true,
    narrativeKey: "gear.fallout",
    kicker: "THE RACK // A CLIENT NOTICED",
    title: "The Crackle Made the Tape",
    context: (s) => `A client heard ${s?.label ?? "the tired piece"} cutting out on a playback and asked politely about it. It is still fixable, and they are not angry, just curious.`,
    options: [
      { id: "gear_fallout_a", label: "Own up and service it now", flavorText: "Be honest about it.", effects: [{ kind: "money", amount: -60 }, { kind: "gearCondition", amount: 12 }, { kind: "reputation", amount: 1 }], memories: [{ key: "serviced-early", ttlDays: 120 }], outcome: "They appreciate the honesty. It is fixed by the weekend." },
      { id: "gear_fallout_b", label: "Laugh it off", flavorText: "Every room has its character.", effects: [], memories: [], outcome: "They laugh too. You put a service on the list." }
    ],
    delegable: true,
    defaultOptionId: "gear_fallout_b"
  }
];

// src/narrative/directorEvents.ts
var HEALTHY = ["Friendly", "Regular", "Loyal", "Advocate"];
var ESTABLISHED = ["Regular", "Loyal", "Advocate"];
var clientWhere = (pred) => (facts) => {
  const c = [...facts.clients].filter(pred).sort((a, b) => b.sessionsCompleted - a.sessionsCompleted || a.clientId.localeCompare(b.clientId))[0];
  return c ? { scope: "client", id: c.clientId, label: c.clientName } : void 0;
};
var clientOf = (facts, s) => facts.clients.find((c) => c.clientId === s?.id);
var opt3 = (o) => o;
var DIRECTOR_EVENTS = [
  ...NARRATIVE_EVENTS,
  ...CITY_EVENTS,
  ...MORE_CITY_EVENTS,
  ...CITY_SAGA_EVENTS,
  ...RECURRING_CLIENT_EVENTS,
  ...GEAR_UPKEEP_EVENTS,
  // ───────── Recurring-client chain ─────────
  {
    id: "client_rush_request",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 20,
    maxOccurrences: 1,
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 2 && c.tier !== "Unknown"),
    eligible: () => true,
    narrativeKey: "client.rush.request",
    kicker: "CLIENT // A FAVOUR ASKED",
    title: "Can You Turn It Around Faster?",
    context: (s) => `${s?.label ?? "A regular client"} is back with a deadline that has moved up. They are asking whether you can deliver in half the usual time.`,
    options: [
      opt3({ id: "rush_accept", label: "Accept the rush job", flavorText: "Long nights, rush fee on the invoice.", effects: [{ kind: "money", amount: 600 }, { kind: "clientXp", amount: 5 }], memories: [{ key: "rush-accepted", ttlDays: 90 }], outcome: "You shake on it. The diary gets tight." }),
      opt3({ id: "rush_reduce", label: "Offer a smaller scope", flavorText: "Fewer tracks, done properly.", effects: [{ kind: "money", amount: 250 }, { kind: "clientXp", amount: 8 }], memories: [{ key: "rush-accepted", ttlDays: 90 }], outcome: "They grumble, then agree that less, done well, beats more, done badly." }),
      opt3({ id: "rush_decline", label: "Decline politely", flavorText: "Quality needs its time.", effects: [], memories: [{ key: "rush-declined", ttlDays: 90 }], outcome: "They understand. Mostly." })
    ],
    delegable: true,
    defaultOptionId: "rush_decline"
  },
  {
    id: "client_rush_payoff",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-accepted"],
    blockedMemories: ["rush-success", "rush-poor"],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore >= 75),
    eligible: () => true,
    narrativeKey: "client.rush.payoff",
    kicker: "CLIENT // IT PAID OFF",
    title: "The Rush Job Landed",
    context: (s) => `${s?.label ?? "Your client"} just heard how the rushed release went. They are delighted, and they want you to know it.`,
    options: [
      opt3({ id: "payoff_thanks", label: "Accept the thank-you", flavorText: "A handshake and a bottle.", effects: [{ kind: "clientXp", amount: 25 }, { kind: "reputation", amount: 4 }], memories: [{ key: "rush-success" }], outcome: "They tell people the studio delivers when it counts." }),
      opt3({ id: "payoff_discount", label: "Offer a discount on their next booking", flavorText: "Loyalty, repaid.", effects: [{ kind: "money", amount: -150 }, { kind: "clientXp", amount: 40 }], memories: [{ key: "rush-success" }], outcome: "They book the next session before leaving the room." })
    ],
    delegable: true,
    defaultOptionId: "payoff_thanks"
  },
  {
    id: "client_rush_fallout",
    family: "client-rush",
    baseWeight: 10,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-accepted"],
    blockedMemories: ["rush-success", "rush-poor"],
    pickSubject: clientWhere((c) => c.sessionsCompleted >= 3 && c.bestQualityScore < 75),
    eligible: () => true,
    narrativeKey: "client.rush.fallout",
    kicker: "CLIENT // CORNERS WERE CUT",
    title: "The Rush Job Stumbled",
    context: (s) => `The rushed release for ${s?.label ?? "your client"} shows its seams. They are not angry, but they are being careful with you now.`,
    options: [
      opt3({ id: "fallout_rework", label: "Rework it on the house", flavorText: "Own the mistake.", effects: [{ kind: "money", amount: -300 }, { kind: "clientXp", amount: 10 }], memories: [{ key: "rush-poor", ttlDays: 40 }], outcome: "The reworked version is better. The trust comes back slowly." }),
      opt3({ id: "fallout_explain", label: "Explain the constraints and move on", flavorText: "You did warn them.", effects: [{ kind: "clientXp", amount: -10 }], memories: [{ key: "rush-poor", ttlDays: 40 }], outcome: "Fair, and cold. They book elsewhere for a while." })
    ],
    delegable: true,
    defaultOptionId: "fallout_rework"
  },
  {
    id: "client_rush_respected",
    family: "client-rush",
    baseWeight: 6,
    cooldownDays: 10,
    maxOccurrences: 1,
    requiredMemories: ["rush-declined"],
    blockedMemories: ["rush-respected"],
    pickSubject: clientWhere((c) => HEALTHY.includes(c.tier) && c.sessionsCompleted >= 3),
    eligible: () => true,
    narrativeKey: "client.rush.respected",
    kicker: "CLIENT // NO HARD FEELINGS",
    title: "They Understood",
    context: (s) => `${s?.label ?? "Your client"} did not hold the declined rush against you. They would like to make sure it stays that way.`,
    options: [
      opt3({ id: "respected_note", label: "Send a thank-you note", flavorText: "Small and sincere.", effects: [{ kind: "clientXp", amount: 10 }], memories: [{ key: "rush-respected" }], outcome: "The note goes up on their studio wall." }),
      opt3({ id: "respected_slot", label: "Offer a standing priority slot", flavorText: "So the next rush is easier.", effects: [{ kind: "money", amount: -100 }, { kind: "clientXp", amount: 20 }], memories: [{ key: "rush-respected" }], outcome: "You have a regular, and they know it." })
    ],
    delegable: true,
    defaultOptionId: "respected_note"
  },
  {
    id: "client_referral_ask",
    family: "client-referral",
    baseWeight: 12,
    cooldownDays: 30,
    maxOccurrences: 1,
    requiredMemories: ["rush-success"],
    blockedMemories: ["referral-made"],
    pickSubject: clientWhere((c) => ESTABLISHED.includes(c.tier) && c.sessionsCompleted >= 4),
    eligible: (facts, s) => (clientOf(facts, s)?.sessionsCompleted ?? 0) >= 4,
    narrativeKey: "client.referral.ask",
    kicker: "CLIENT // A NAME PASSED ON",
    title: "A Friend of a Friend",
    context: (s) => `${s?.label ?? "Your client"} has been singing your praises. They can introduce you to someone bigger, or put their name behind the studio in public.`,
    options: [
      opt3({ id: "referral_take", label: "Take the introduction", flavorText: "New faces, new money.", effects: [{ kind: "referral" }, { kind: "reputation", amount: 5 }], memories: [{ key: "referral-made" }], outcome: "A new name appears in the booking diary." }),
      opt3({ id: "referral_credit", label: "Ask for a public credit", flavorText: "Put the studio\u2019s name on the sleeve.", effects: [{ kind: "reputation", amount: 10 }, { kind: "xp", amount: 50 }], memories: [{ key: "referral-made" }, { scope: "studio", key: "prestige-credit" }], outcome: "The credit line is small, and it opens doors." })
    ]
  },
  // ───────── Studio, crew and gear ─────────
  {
    id: "studio_label_scout",
    family: "studio-industry",
    baseWeight: 8,
    cooldownDays: 60,
    maxOccurrences: 1,
    eligible: (f) => f.reputation >= 40,
    narrativeKey: "studio.scout.visit",
    kicker: "INDUSTRY // A QUIET VISIT",
    title: "A Label Scout Stops By",
    context: () => "A scout from a larger label is in the building \u201Cjust for the coffee\u201D. They are listening to everything.",
    options: [
      opt3({ id: "scout_tour", label: "Give them the full tour", flavorText: "Let the room make its case.", effects: [{ kind: "reputation", amount: 8 }], memories: [{ scope: "studio", key: "scout-toured" }], outcome: "The scout leaves with a notebook full of names, and yours is on the first page." }),
      opt3({ id: "scout_private", label: "Keep the sessions private", flavorText: "Your clients come first.", effects: [{ kind: "money", amount: 300 }], memories: [{ scope: "studio", key: "scout-declined" }], outcome: "Word gets round that the studio protects its artists." })
    ],
    delegable: true,
    defaultOptionId: "scout_private"
  },
  {
    id: "studio_press_inquiry",
    family: "studio-industry",
    baseWeight: 6,
    cooldownDays: 45,
    maxOccurrences: 2,
    memoryWeights: { "studio/prestige-credit": 2 },
    eligible: (f) => f.reputation >= 25,
    narrativeKey: "studio.press.inquiry",
    kicker: "INDUSTRY // A PHONE CALL",
    title: "The Press Wants a Word",
    context: () => "A trade journalist wants ten minutes about how the studio works. It could be flattering. It could be long.",
    options: [
      opt3({ id: "press_talk", label: "Give a proper interview", flavorText: "Open the doors, put the kettle on.", effects: [{ kind: "reputation", amount: 6 }, { kind: "money", amount: -100 }], outcome: "The piece runs with a good photograph of the console." }),
      opt3({ id: "press_statement", label: "Send a short statement", flavorText: "Ten words, on the record.", effects: [{ kind: "reputation", amount: 2 }], outcome: "A brief mention, and a brief silence." })
    ],
    delegable: true,
    defaultOptionId: "press_statement"
  },
  {
    id: "staff_artist_conflict",
    family: "crew",
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const m = f.staff[0];
      return m ? { scope: "staff", id: m.id, label: m.name } : void 0;
    },
    eligible: (f) => f.staffCount >= 1 && f.day >= 15,
    narrativeKey: "staff.artist.conflict",
    kicker: "CREW // TWO STRONG OPINIONS",
    title: "An Argument in the Live Room",
    context: (s) => `${s?.label ?? "One of your crew"} and a visiting artist disagree loudly about a take. Both think they are right.`,
    options: [
      opt3({ id: "conflict_back_crew", label: "Back your crew member", flavorText: "You hired them for a reason.", effects: [{ kind: "reputation", amount: 2 }], memories: [{ key: "backed-by-boss" }], outcome: "The crew member stands a little taller. The artist sulks through lunch." }),
      opt3({ id: "conflict_mediate", label: "Step in and mediate", flavorText: "A cup of tea, a fresh take.", effects: [{ kind: "money", amount: -80 }, { kind: "reputation", amount: 3 }], memories: [{ key: "mediated-conflict" }], outcome: "Both walk out with a better take than either planned." })
    ]
  },
  {
    id: "gear_overheated",
    family: "gear",
    baseWeight: 7,
    cooldownDays: 30,
    maxOccurrences: 1,
    pickSubject: (f) => {
      const g = f.gear[0];
      return g ? { scope: "gear", id: g.id, label: g.name } : void 0;
    },
    eligible: (f) => f.equipmentCount >= 2 && f.day >= 20,
    narrativeKey: "gear.overheated",
    kicker: "GEAR // A BURNING SMELL",
    title: "It Ran Hot",
    context: (s) => `The ${s?.label ?? "desk"} has been running all week and something smells warm. It survived, but only just.`,
    options: [
      opt3({ id: "gear_service", label: "Pay for a proper service", flavorText: "Do it right.", effects: [{ kind: "money", amount: -350 }, { kind: "reputation", amount: 2 }], memories: [{ key: "serviced-after-heat" }], outcome: "The technician finds and fixes two other problems." }),
      opt3({ id: "gear_fan", label: "Put a fan on it and carry on", flavorText: "It has got this far.", effects: [{ kind: "money", amount: 60 }], memories: [{ key: "ran-hot-ignored", ttlDays: 60 }], outcome: "It works. For now." })
    ]
  }
];
var resolveDirectorChoice = (state2, optionId) => resolveDirectorOption(state2, DIRECTOR_EVENTS, optionId);

// tests/city-sagas.check.ts
var state = (cityId, over = {}) => ({
  currentDay: 40,
  currentEra: "analog60s",
  selectedEra: "analog60s",
  saveSeed: 7,
  money: 9e3,
  reputation: 40,
  cityId,
  hiredStaff: [],
  ownedEquipment: [{ id: "e", name: "Desk", condition: 90 }],
  studioRooms: [],
  bands: [],
  playerBands: [],
  financials: { income: 0, expenses: 0, profit: 0, reports: [] },
  playerData: { xp: 0, level: 3 },
  clientRelationships: {},
  storylineState: { runSeed: 1, activeCampaignNodeId: "a", campaignCompleted: false, branchHistory: [], storyFlags: {}, activeSubplots: [], resolvedSubplotIds: [] },
  ...over
});
(0, import_node_test.describe)("city sagas", () => {
  (0, import_node_test.it)("has valid, registered, capped events (3 per city)", () => {
    import_strict.default.equal(CITY_SAGA_EVENTS.length, CITIES.length * 3);
    const live = new Set(DIRECTOR_EVENTS.map((d) => d.id));
    for (const e of CITY_SAGA_EVENTS) {
      import_strict.default.ok(live.has(e.id));
      import_strict.default.equal(e.maxOccurrences, 1);
      import_strict.default.ok(e.options.some((o) => o.id === e.defaultOptionId));
      for (const o of e.options) {
        import_strict.default.ok(o.memories?.length, `${o.id} writes a memory`);
        for (const x of validateEffects(o.effects)) import_strict.default.ok(Math.abs(x.amount) <= EFFECT_LIMITS[x.kind]);
      }
    }
    for (const c of CITIES) import_strict.default.equal(CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === c.id).length, 3, c.id);
  });
  (0, import_node_test.it)("maps events to scene cities", () => {
    import_strict.default.equal(cityForEvent("saga_tokyo_2"), "tokyo");
    import_strict.default.equal(cityForEvent("tokyo_karaoke_night"), "tokyo");
    import_strict.default.equal(cityForEvent("la_heatwave_blackout"), "los-angeles");
    import_strict.default.equal(cityForEvent("studio_press_inquiry"), void 0);
  });
  (0, import_node_test.it)("plays each saga in order, only in its own city", () => {
    for (const c of CITIES) {
      const defs = CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === c.id);
      const other = CITIES.find((x) => x.id !== c.id).id;
      import_strict.default.equal(getDirector(takeDirectorOpportunity(state(other), defs)).pending, void 0, `${c.id} leaks`);
      import_strict.default.equal(getDirector(takeDirectorOpportunity(state(void 0), defs)).pending, void 0, "legacy save");
      let s = state(c.id);
      for (let n = 1; n <= 3; n++) {
        s = takeDirectorOpportunity({ ...s, currentDay: s.currentDay + 60 }, defs);
        import_strict.default.equal(getDirector(s).pending?.eventId, defs[n - 1].id, `${c.id} beat ${n}`);
        s = resolveDirectorChoice(s, defs[n - 1].options[0].id);
      }
      const after = takeDirectorOpportunity({ ...s, currentDay: s.currentDay + 200 }, defs);
      import_strict.default.equal(getDirector(after).pending, void 0, `${c.id} saga repeats`);
    }
  });
  (0, import_node_test.it)("needs reputation to open", () => {
    const defs = CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === "rio");
    import_strict.default.equal(getDirector(takeDirectorOpportunity(state("rio", { reputation: 2 }), defs)).pending, void 0);
  });
});
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
