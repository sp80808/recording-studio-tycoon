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

// src/i18n/content.ts
var import_react = __toESM(require_react(), 1);

// src/rpg/cities.ts
var DEFAULT_CITY_ID = "los-angeles";
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
var getCityById = (id) => CITIES.find((c) => c.id === id);
var isCityId = (id) => CITIES.some((c) => c.id === id);
var norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
var genreIn = (list, genre) => list.some((g) => norm(g) === norm(genre));
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
var localName = (cityId, roll1, roll2) => {
  const city = getCityById(cityId);
  if (!city) return void 0;
  const pick3 = (list, r) => list[Math.min(list.length - 1, Math.floor(r * list.length))];
  return `${pick3(city.names.first, roll1)} ${pick3(city.names.last, roll2)}`;
};
var applyCityEdge = (state, cityId) => {
  const city = getCityById(cityId);
  if (!city) return state;
  const attr = city.edge.attribute;
  const attrs = state.playerData.attributes;
  return {
    ...state,
    playerData: { ...state.playerData, attributes: { ...attrs, [attr]: (attrs[attr] ?? 1) + 1 } }
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
var visualEraId = (id) => ({
  modern: "streaming2020s",
  digital_age: "internet2000s",
  golden_age: "digital80s",
  classic_rock: "analog60s"
})[id] ?? id;
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
  const inTier = GIG_TEMPLATES.filter((t2) => t2.tier === tier);
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
function deriveBrief(project2) {
  const rng = createSeededRandom(`brief:${project2.id}:${project2.genre}`);
  return {
    serviceType: pick(SERVICES, rng),
    direction: pick(GENRE_DIRECTIONS[project2.genre] ?? DEFAULT_DIRECTIONS, rng),
    priority: pick(PRIORITIES, rng),
    genre: project2.genre
  };
}
var avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
var has = (c, ...cats) => cats.some((k) => c.gearCategories.has(k));
var FIT_RULES = [
  {
    id: "room-match",
    apply: (c) => {
      const want = SERVICE_ROOM[c.brief.serviceType];
      if (c.roomType === want && want !== "project-studio") return { delta: 14, reason: `${ROOM_NAMES[want]} matches the brief` };
      if (c.roomType === "project-studio") return { delta: 4, reason: "Project Studio handles most briefs" };
      return { delta: -10, reason: `This brief wants a ${ROOM_NAMES[want]}, not the ${c.roomName}` };
    }
  },
  {
    id: "intimate-vocal-chain",
    discovery: "Intimate Vocal Chain",
    apply: (c) => c.direction === "intimate" && ["vocal-production", "tracking"].includes(c.brief.serviceType) && c.roomType === "vocal-suite" && has(c, "microphone") ? { delta: 12, reason: "Close mic in the Vocal Suite suits an intimate take" } : null
  },
  {
    id: "live-room-energy",
    discovery: "Live Room Energy",
    apply: (c) => ["live", "raw", "heavy"].includes(c.direction) && c.roomType === "live-room" ? { delta: 12, reason: "The Live Room gives this direction real energy" } : null
  },
  {
    id: "electronic-stack",
    discovery: "Electronic Production Stack",
    apply: (c) => c.brief.genre === "Electronic" && ["polished", "experimental"].includes(c.direction) && has(c, "software", "interface") ? { delta: 10, reason: "Interface and software rig fit electronic production" } : null
  },
  {
    id: "trusted-mix-pair",
    discovery: "Trusted Mix Pair",
    apply: (c) => {
      if (!["mix", "master"].includes(c.brief.serviceType) || !c.clientId) return null;
      const s = c.staff.find((m) => (m.clientFamiliarity?.[c.clientId] ?? 0) >= 2);
      return s ? { delta: 12, reason: `${s.name} already knows this client's sound` } : null;
    }
  },
  {
    id: "genre-specialist",
    apply: (c) => {
      const s = c.staff.filter((m) => m.genreAffinity?.genre === c.brief.genre).sort((a, b) => (b.genreAffinity?.bonus ?? 0) - (a.genreAffinity?.bonus ?? 0))[0];
      return s?.genreAffinity ? { delta: Math.min(12, Math.round(s.genreAffinity.bonus / 3)), reason: `${s.name} specializes in ${c.brief.genre}` } : null;
    }
  },
  {
    id: "role-fit",
    apply: (c) => {
      const role = SERVICE_ROLE[c.brief.serviceType];
      const s = c.staff.find((m) => m.role === role);
      return s ? { delta: 8, reason: `${s.name} is a ${role.toLowerCase()} for ${SERVICE_LABELS[c.brief.serviceType].toLowerCase()}` } : null;
    }
  },
  {
    id: "polished-monitoring",
    apply: (c) => c.direction === "polished" && (c.roomType === "mix-suite" || has(c, "monitor")) ? { delta: 8, reason: "Good monitoring keeps a polished sound honest" } : null
  },
  {
    id: "heavy-punch",
    apply: (c) => c.direction === "heavy" && has(c, "outboard", "mixer") ? { delta: 8, reason: "Outboard and console give it the punch it needs" } : null
  },
  {
    id: "quick-turnaround",
    apply: (c) => c.brief.priority === "speed" && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.speed)) >= 30 ? { delta: 8, reason: "A quick crew suits the fast turnaround" } : null
  },
  {
    id: "lean-budget",
    apply: (c) => c.brief.priority === "budget" && c.staff.length <= 1 ? { delta: 6, reason: "A lean crew keeps the budget tight" } : null
  },
  {
    id: "quality-hands",
    apply: (c) => c.brief.priority === "quality" && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.technical)) >= 30 ? { delta: 8, reason: "Technical hands suit a quality-first brief" } : null
  },
  {
    id: "experimental-leap",
    apply: (c) => {
      if (c.direction !== "experimental") return null;
      return c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.creativity)) >= 35 ? { delta: 10, reason: "A creative crew can carry an experimental leap" } : { delta: -6, reason: "An experimental brief needs a more creative crew" };
    }
  },
  {
    id: "house-recipe",
    apply: (c) => c.approachId === "house-recipe" ? { delta: 6, reason: `Your house recipe: the studio knows how to cut ${c.genre}` } : null
  },
  {
    id: "repeat-client",
    apply: (c) => c.clientSessions > 0 ? { delta: Math.min(10, c.clientSessions * 3), reason: "Repeat client: you already speak the same language" } : null
  }
];
var BRIEF_RULE_COUNT = FIT_RULES.length;

// src/rpg/labelInterest.ts
var LABEL_ACCOUNTS = [
  { id: "major_label_001", name: "Stellar Records", tier: "global", genres: ["pop", "rock", "hip-hop", "tiktok", "soul", "motown"] },
  { id: "indie_label_001", name: "Underground Sounds", tier: "indie", genres: ["indie", "punk", "emo", "folk", "lo-fi", "blues"] },
  { id: "electronic_label_001", name: "Digital Waves Music", tier: "regional", genres: ["electronic", "edm", "disco", "new wave", "digital"] },
  { id: "hiphop_label_001", name: "Street Crown Entertainment", tier: "national", genres: ["hip-hop", "trap", "drill"] }
];
var labelsForGenre = (genre) => {
  const g = genre.toLowerCase();
  return LABEL_ACCOUNTS.filter((l) => l.genres.some((frag) => g.includes(frag)));
};
var interestOf = (interest, labelId) => interest?.[labelId] ?? 0;

// src/rpg/labelAccounts.ts
var LABEL_WEEK_DAYS = 7;
var TIER_UNLOCK = { indie: 25, regional: 50 };
var TIER_FEE_FACTOR = { indie: 1.15, regional: 1.35 };
var TIER_DEADLINE = { indie: 12, regional: 10 };
var TIER_TARGET = { indie: 60, regional: 72 };
var RUSH_DAYS = 3;
var RUSH_FEE = 0.15;
var REVISION_FEE = -0.08;
var FREEDOM_FEE = -0.1;
var FREEDOM_TARGET = -8;
var LATE_FEE_PER_DAY = 0.1;
var LATE_FEE_CAP = 0.3;
var SHORTFALL_FEE = 0.1;
var ON_TIME_BONUS = 0.1;
var INTEREST_GAIN = 5;
var INTEREST_LOSS = 3;
var INTEREST_FLOOR = 10;
var NO_CHOICES = { rush: false, extraRevision: false, openFreedom: false };
var resolveTerms = (base2, c) => ({
  fee: Math.round(base2.baseFee * (1 + (c.rush ? RUSH_FEE : 0) + (c.extraRevision ? REVISION_FEE : 0) + (c.openFreedom ? FREEDOM_FEE : 0))),
  deadlineDays: Math.max(3, base2.baseDeadlineDays - (c.rush ? RUSH_DAYS : 0)),
  qualityTarget: Math.max(30, base2.baseTarget + (c.openFreedom ? FREEDOM_TARGET : 0)),
  revisions: base2.baseRevisions + (c.extraRevision ? 1 : 0)
});
var withChoices = (project2, choices) => {
  const t2 = project2.labelTerms;
  if (!t2) return project2;
  const r = resolveTerms(t2, choices);
  return { ...project2, payoutBase: r.fee, durationDaysTotal: r.deadlineDays, labelTerms: { ...t2, choices, ...r } };
};
var templateFor = (label, eraId, rng) => {
  const eraGenres = (ERA_DEFINITIONS.find((e) => e.id === eraId) ?? ERA_DEFINITIONS[0]).availableGenres;
  const fits = (t2) => labelsForGenre(t2.genre).some((l) => l.id === label.id);
  const native = GIG_TEMPLATES.filter((t2) => eraGenres.includes(t2.genre) && fits(t2));
  const pool = native.length ? native : GIG_TEMPLATES.filter(fits);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : void 0;
};
var labelOffersFor = (state) => {
  const week = Math.floor(state.currentDay / LABEL_WEEK_DAYS);
  const out = [];
  for (const label of LABEL_ACCOUNTS) {
    const unlock = TIER_UNLOCK[label.tier];
    if (unlock === void 0 || interestOf(state.labelInterest, label.id) < unlock) continue;
    const id = `label-${label.id}-${week}`;
    if (state.claimedOffers?.includes(id)) continue;
    const rng = createSeededRandom(`label-offer:${state.saveSeed ?? "legacy"}:${label.id}:${week}`);
    const template = templateFor(label, state.currentEra ?? "analog60s", rng);
    if (!template) continue;
    const stages = [0, 1, 2].map((i) => template.baseStages[i % template.baseStages.length]);
    const base2 = {
      baseFee: Math.round(template.basePayout * (TIER_FEE_FACTOR[label.tier] ?? 1)),
      baseDeadlineDays: TIER_DEADLINE[label.tier] ?? 12,
      baseTarget: TIER_TARGET[label.tier] ?? 60,
      baseRevisions: 1
    };
    const title = template.titleTemplates[Math.floor(rng() * template.titleTemplates.length)];
    const r = resolveTerms(base2, NO_CHOICES);
    const project2 = {
      id,
      title: `${label.name}: 3-track ${title}`,
      genre: template.genre,
      clientType: "Record Label",
      clientId: `label-${label.id}`,
      clientName: label.name,
      difficulty: Math.min(5, template.difficulty + (label.tier === "regional" ? 1 : 0)),
      payoutBase: r.fee,
      repGainBase: Math.round(template.baseRep * 2),
      durationDaysTotal: r.deadlineDays,
      requiredSkills: { [template.genre]: Math.max(1, Math.floor(template.difficulty / 2)) },
      matchRating: "Good",
      stages: stages.map((s, i) => ({ stageName: `Track ${i + 1}: ${s.stageName}`, focusAreas: s.focusAreas, workUnitsBase: s.workUnitsBase, workUnitsCompleted: 0, completed: false })),
      currentStageIndex: 0,
      completedStages: [],
      stake: "safe",
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0,
      focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
      labelTerms: { labelId: label.id, labelName: label.name, tier: label.tier, ...base2, choices: NO_CHOICES, ...r }
    };
    project2.brief = deriveBrief(project2);
    out.push(project2);
  }
  return out;
};
var labelOutcome = (terms, daysTaken, quality, fee) => {
  const lateDays = Math.max(0, Math.floor(daysTaken) - terms.deadlineDays);
  const onTime = lateDays === 0;
  const metTarget = quality >= terms.qualityTarget;
  let cut = 0;
  if (!onTime) cut += Math.min(LATE_FEE_CAP, lateDays * LATE_FEE_PER_DAY);
  if (!metTarget && terms.revisions < 2) cut += SHORTFALL_FEE;
  const good2 = onTime && metTarget;
  const money = good2 ? Math.round(fee * ON_TIME_BONUS) : -Math.round(fee * cut);
  const interest = good2 ? INTEREST_GAIN : onTime && metTarget === false ? 0 : -INTEREST_LOSS;
  const message = good2 ? `${terms.labelName} is delighted: on time and on target. A ${Math.round(ON_TIME_BONUS * 100)}% bonus and a stronger account.` : !onTime ? `${terms.labelName} waited ${lateDays} extra day${lateDays === 1 ? "" : "s"}. They knocked ${Math.round(cut * 100)}% off the invoice and will remember it.` : terms.revisions >= 2 ? `${terms.labelName} wanted a little more, and the extra revision round absorbed it. Full fee, no bonus.` : `${terms.labelName} wanted a little more than this. They trimmed ${Math.round(cut * 100)}% off the invoice.`;
  return { money, interest, onTime, metTarget, message };
};
var applyLabelOutcome = (state, project2, quality, fee) => {
  const terms = project2?.labelTerms;
  if (!terms || !project2) return state;
  const daysTaken = Math.max(1, state.currentDay - (project2.bookedDay ?? state.currentDay) + 1);
  const o2 = labelOutcome(terms, daysTaken, quality, fee);
  const before = interestOf(state.labelInterest, terms.labelId);
  const after2 = o2.interest < 0 ? Math.max(Math.min(before, INTEREST_FLOOR), before + o2.interest) : Math.min(100, before + o2.interest);
  return {
    ...state,
    money: Math.max(0, state.money + o2.money),
    labelInterest: { ...state.labelInterest ?? {}, [terms.labelId]: after2 },
    notifications: [...state.notifications, { id: `label-outcome-${project2.id}`, message: o2.message, type: o2.money >= 0 ? "success" : "info", timestamp: Date.now(), duration: 7e3 }]
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
  for (const entry of pool) {
    const value = Array.isArray(entry) ? entry[0] : entry;
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
var parseNpcPartPicks = (value) => {
  if (!value || typeof value !== "object") return null;
  const record = value;
  const out = {};
  for (const key of ["body", "hair", "clothing", "accessories"]) {
    const raw = record[key];
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) return null;
    out[key] = raw;
  }
  const buildRaw = record.build;
  if (buildRaw !== void 0) {
    if (typeof buildRaw !== "number" || !Number.isInteger(buildRaw) || buildRaw < 0) return null;
    out.build = buildRaw;
  }
  return out;
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
  const entries = pool.map((entry) => Array.isArray(entry) ? entry : [entry, 1]);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
};
var isNpcEra = (value) => NPC_ERAS.includes(value);
var isStudioRole = (value) => STUDIO_ROLES.includes(value);
var parseNpcVisualIdentity = (value) => {
  if (!value || typeof value !== "object") return null;
  const v = value;
  if (typeof v.seed !== "number" || !Number.isFinite(v.seed)) return null;
  if (!isStudioRole(v.role) || !isNpcEra(v.era)) return null;
  const version = v.appearanceVersion === void 0 ? 1 : v.appearanceVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return null;
  const parts = v.parts === void 0 ? void 0 : parseNpcPartPicks(v.parts);
  if (v.parts !== void 0 && !parts) return null;
  return {
    seed: v.seed,
    role: v.role,
    era: v.era,
    appearanceVersion: version,
    ...parts ? { parts: normalizePartPicks(v.era, parts) } : {}
  };
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
var sessionMusicianNames = [
  "Jake Miller",
  "Sarah Johnson",
  "Mike Rodriguez",
  "Lisa Chen",
  "Tom Wilson",
  "Amy Davis",
  "Chris Brown",
  "Nina Patel",
  "Alex Kim",
  "Maya Thompson"
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
var generateSessionMusicians = (count, cityId) => {
  const roles = [
    "Session Guitarist",
    "Session Drummer",
    "Session Bassist",
    "Session Keyboardist",
    "Session Vocalist"
  ];
  const musicians = [];
  for (let i = 0; i < count; i++) {
    musicians.push({
      id: `session_${Date.now()}_${i}`,
      name: (cityId && Math.random() < 0.6 ? localName(cityId, Math.random(), Math.random()) : void 0) ?? sessionMusicianNames[Math.floor(Math.random() * sessionMusicianNames.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      creativity: 20 + Math.floor(Math.random() * 30),
      // 20-50
      technical: 20 + Math.floor(Math.random() * 30),
      // 20-50
      hireCost: 500
    });
  }
  return musicians;
};

// src/utils/playerUtils.ts
var xpForPlayerLevel = (level) => Math.floor(100 * Math.pow(1.4, Math.max(0, level - 1) * 0.7));
var resolvePlayerLevelUps = (state) => {
  const player = state.playerData;
  if (!Number.isFinite(player.xp) || player.xp < xpForPlayerLevel(player.level)) return state;
  let { xp, level, perkPoints } = player;
  while (xp >= xpForPlayerLevel(level)) {
    xp -= xpForPlayerLevel(level);
    level++;
    perkPoints += level <= 10 ? 2 : level <= 25 ? 1 : 0;
  }
  return {
    ...state,
    playerData: {
      ...player,
      xp,
      level,
      perkPoints,
      xpToNextLevel: xpForPlayerLevel(level),
      dailyWorkCapacity: player.dailyWorkCapacity + level - player.level
    },
    notifications: [...state.notifications, {
      id: `producer-level-${level}`,
      type: "success",
      timestamp: Date.now(),
      duration: 6e3,
      message: `Producer level ${level}! +${perkPoints - player.perkPoints} talent points and +${level - player.level} daily sessions.`
    }]
  };
};

// src/game-mechanics/relationship-management.ts
function bumpMatchRatingForReturn(matchRating) {
  if (matchRating === "Poor") return "Good";
  if (matchRating === "Good") return "Excellent";
  return "Excellent";
}

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

// src/services/marketService.ts
var currentMarketTrends = [];
var allSubGenres = [...subGenres];
var initializeMockData = (roll = createSeededRandom("market:initial")) => {
  if (currentMarketTrends.length === 0) {
    const genres = ["pop", "rock", "hip-hop", "electronic", "country", "jazz"];
    const directions = ["rising", "stable", "falling", "emerging"];
    genres.forEach((genre, index) => {
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

// src/rpg/artistCareer.ts
var CAREER_TIERS = ["local", "emerging", "established", "breakout", "prestige"];
var CAREER_POINTS = { local: 0, emerging: 3, established: 8, breakout: 16, prestige: 28 };
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
  for (const t2 of CAREER_TIERS) if (points >= CAREER_POINTS[t2]) tier = t2;
  return tier;
};
var clientCareerTier = (rel) => careerTierForPoints(rel?.careerPoints ?? 0);
var requestedServiceFor = (rel, projectId) => {
  const options = TIER_REQUESTS[clientCareerTier(rel)];
  return options[randomInt(createSeededRandom(`careerreq:${projectId}`), 0, options.length - 1)];
};
var followUpCandidate = (rel) => {
  const releases = rel?.releases ?? [];
  const followed = new Set(releases.map((r) => r.followUpOf).filter(Boolean));
  return [...releases].reverse().find((r) => r.resolved && r.outcomeBand !== "quiet" && !followed.has(r.id));
};
var followUpKind = (projectId) => FOLLOW_UP_KINDS[randomInt(createSeededRandom(`followup:${projectId}`), 0, FOLLOW_UP_KINDS.length - 1)];

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
function deriveRider(project2, ctx) {
  if (!canHaveRider({ reputation: ctx.reputation, playerLevel: ctx.playerLevel, difficulty: project2.difficulty })) {
    return void 0;
  }
  const pool = STUDIO_RIDERS.filter((r) => riderMatches(r, project2.genre, ctx.eraId));
  const candidates = pool.length > 0 ? pool : STUDIO_RIDERS;
  const rng = createSeededRandom(`rider:${project2.id}:${project2.genre}:${ctx.eraId}`);
  if (rng() > 0.7) return void 0;
  return pick2(candidates, rng);
}

// src/utils/skillUtils.ts
var calculateXpToNextLevel = (currentLevel) => {
  if (currentLevel <= 0) return 100;
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
};
var initializeSkillsPlayer = () => {
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
    sampleWarping: { ...initialSkill },
    management: { ...initialSkill }
    // Player-specific skill
  };
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
  const base2 = resolveNpcAppearance(identity, spec.name);
  return applyCreatorPieceIds(base2, spec.pieces);
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
  const regional = (pool) => cityId || demandWeight ? pool.map((g) => ({
    ...g,
    weight: g.weight * (cityId ? regionalEnquiryWeight(g.template.genre, cityId) : 1) * (demandWeight ? demandWeight(g.template.genre) : 1)
  })) : pool;
  const templatePool = regional(rawTemplatePool);
  const basePool = isEarlyGame ? starterPool : advancedPool;
  const weightedPool = regional(basePool);
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let project2;
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
      project2 = {
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
    } while (usedTitles.has(project2.title) && attempts < 50);
    project2.brief = deriveBrief(project2);
    const careerClient = knownClients.find((c) => c.clientName === project2.clientName);
    if (careerClient) {
      project2.brief = { ...project2.brief, serviceType: requestedServiceFor(careerClient, project2.id) };
      const seedRelease = followUpCandidate(careerClient);
      if (seedRelease && !followUpsOffered.has(seedRelease.id)) {
        followUpsOffered.add(seedRelease.id);
        project2.followUpOf = seedRelease.id;
        project2.title = `Follow-up: ${followUpKind(project2.id)} for ${seedRelease.title}`;
      }
    }
    const rider = deriveRider(project2, {
      reputation,
      playerLevel,
      eraId: currentEra
    });
    if (rider) project2.rider = rider;
    usedTitles.add(project2.title);
    projects.push(project2);
  }
  return projects;
};

// src/rpg/premises.ts
var PREMISES_TIERS = {
  0: { tier: 0, name: "Borrowed Room", staffCap: 3, roomAllowanceBonus: 0, dailyRent: 0, extraCandidates: 0 },
  1: { tier: 1, name: "Project Studio", staffCap: 6, roomAllowanceBonus: 1, dailyRent: 40, extraCandidates: 2, grantsRoomId: "vocal-suite" },
  2: { tier: 2, name: "Commercial Studio", staffCap: 10, roomAllowanceBonus: 2, dailyRent: 140, extraCandidates: 4, grantsRoomId: "live-room" },
  3: { tier: 3, name: "Multi-room Facility", staffCap: 14, roomAllowanceBonus: 3, dailyRent: 320, extraCandidates: 6, grantsRoomId: "mix-suite" }
};
var getPremisesTier = (s) => s.premisesTier === 3 ? 3 : s.premisesTier === 2 ? 2 : s.premisesTier === 1 ? 1 : 0;
var getPremisesDef = (s) => PREMISES_TIERS[getPremisesTier(s)];
var premisesRoomAllowanceBonus = (s) => getPremisesDef(s).roomAllowanceBonus;

// src/rpg/studioKnowHow.ts
var createInitialKnowHow = () => ({
  totalEarned: 0,
  available: 0,
  totalSpent: 0,
  domains: { tracking: 0, production: 0, editing: 0, mixing: 0, mastering: 0, acoustics: 0, business: 0 },
  discoveries: [],
  repeatCounts: {},
  awardLog: []
});
var isCapabilityUnlocked = (state, id) => state.discoveries.includes(`capability:${id}`);
var grantsDelegation = (kh) => !!kh && isCapabilityUnlocked(kh, "delegation-policy");

// src/utils/studioRoomUtils.ts
var createDefaultStudioRooms = () => [
  {
    id: "studio-a",
    name: "Studio A",
    type: "project-studio",
    unlocked: true,
    level: 1,
    purchaseCost: 0,
    requiredPlayerLevel: 1,
    supportedStageKinds: ["general", "tracking", "production", "mixing", "mastering"],
    qualityBonus: 0,
    speedBonus: 0
  },
  {
    id: "vocal-suite",
    name: "Vocal Suite",
    type: "vocal-suite",
    unlocked: false,
    level: 1,
    purchaseCost: 1800,
    requiredPlayerLevel: 3,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 4,
    speedBonus: 2
  },
  {
    id: "live-room",
    name: "Live Room",
    type: "live-room",
    unlocked: false,
    level: 1,
    purchaseCost: 5200,
    requiredPlayerLevel: 5,
    supportedStageKinds: ["tracking", "production"],
    qualityBonus: 6,
    speedBonus: 3
  },
  {
    id: "mix-suite",
    name: "Mix Suite",
    type: "mix-suite",
    unlocked: false,
    level: 1,
    purchaseCost: 9e3,
    requiredPlayerLevel: 8,
    supportedStageKinds: ["mixing", "mastering", "production"],
    qualityBonus: 8,
    speedBonus: 5
  }
];
var getOperationalStudioRooms = (gameState) => (gameState.studioRooms || []).filter((room) => room.unlocked);
var getPhysicalStudioCapacity = (gameState) => Math.max(1, getOperationalStudioRooms(gameState).length);

// src/services/ProgressionSystem.ts
var ProgressionSystem = class {
  // Define progression milestones
  static MILESTONES = [
    {
      level: 1,
      staffCount: 0,
      projectsCompleted: 0,
      unlockMessage: "Welcome to your recording studio! Start with single projects to learn the basics.",
      features: ["Single Project Management", "Basic Staff Hiring", "Equipment Purchasing"]
    },
    {
      level: 3,
      staffCount: 2,
      projectsCompleted: 3,
      unlockMessage: "\u{1F389} Studio Expansion Available! You can now purchase a second production suite.",
      features: ["Second Room Expansion", "Basic Automation", "Project Prioritization"]
    },
    {
      level: 5,
      staffCount: 4,
      projectsCompleted: 8,
      unlockMessage: "\u{1F680} Multi-Project Mastery! A third studio suite can now be brought online.",
      features: ["Third Room Expansion", "Smart Staff Automation", "Advanced Scheduling"]
    },
    {
      level: 8,
      staffCount: 6,
      projectsCompleted: 15,
      unlockMessage: "\u{1F3C6} Studio Empire Mode! Your facility can now support a fourth production suite.",
      features: ["Fourth Room Expansion", "AI-Powered Optimization", "Advanced Analytics"]
    },
    {
      level: 12,
      staffCount: 8,
      projectsCompleted: 25,
      unlockMessage: "\u{1F451} Industry Legend! Your room expansion limit is fully unlocked.",
      features: ["Maximum Room Expansion", "Complete Automation Suite", "Industry Dominance"]
    }
  ];
  /**
   * Check if multi-project mode should be unlocked
   */
  static shouldUnlockMultiProject(gameState) {
    const status = this.getProgressionStatus(gameState);
    return status.isMultiProjectUnlocked;
  }
  /**
   * Get the current progression status
   */
  static getProgressionStatus(gameState) {
    const playerLevel = gameState.playerData.level;
    const staffCount2 = gameState.hiredStaff.length;
    const projectsCompleted = this.calculateCompletedProjects(gameState);
    let currentMilestone = null;
    let nextMilestone = null;
    for (let i = 0; i < this.MILESTONES.length; i++) {
      const milestone = this.MILESTONES[i];
      if (this.meetsMilestoneRequirements(milestone, playerLevel, staffCount2, projectsCompleted)) {
        currentMilestone = milestone;
        nextMilestone = this.MILESTONES[i + 1] || null;
      } else {
        if (!nextMilestone) {
          nextMilestone = milestone;
        }
        break;
      }
    }
    if (!currentMilestone) {
      currentMilestone = this.MILESTONES[0];
      nextMilestone = this.MILESTONES[1];
    }
    let progressToNext = 1;
    if (nextMilestone) {
      const levelProgress = Math.min(1, playerLevel / nextMilestone.level);
      const staffProgress = Math.min(1, staffCount2 / nextMilestone.staffCount);
      const projectProgress = Math.min(1, projectsCompleted / nextMilestone.projectsCompleted);
      progressToNext = (levelProgress + staffProgress + projectProgress) / 3;
    }
    const isMultiProjectUnlocked = currentMilestone && (currentMilestone.level >= 3 && currentMilestone.staffCount >= 2);
    const reason = this.generateProgressionReason(
      playerLevel,
      staffCount2,
      projectsCompleted,
      nextMilestone
    );
    return {
      isMultiProjectUnlocked: Boolean(isMultiProjectUnlocked),
      currentMilestone,
      nextMilestone,
      progressToNext,
      reason
    };
  }
  /**
   * Get maximum concurrent projects based on progression
   */
  static getRoomExpansionLimit(gameState) {
    const status = this.getProgressionStatus(gameState);
    const milestone = status.currentMilestone;
    const bonus = premisesRoomAllowanceBonus(gameState);
    if (!milestone || !status.isMultiProjectUnlocked) return 1 + bonus;
    if (milestone.level >= 12) return 5 + bonus;
    if (milestone.level >= 8) return 4 + bonus;
    if (milestone.level >= 5) return 3 + bonus;
    if (milestone.level >= 3) return 2 + bonus;
    return 1 + bonus;
  }
  static getMaxConcurrentProjects(gameState) {
    const physicalCapacity = getPhysicalStudioCapacity(gameState);
    const progressionLimit = this.getRoomExpansionLimit(gameState);
    return Math.max(1, Math.min(physicalCapacity, progressionLimit));
  }
  /**
   * Get automation features available at current progression
   */
  static getAvailableAutomationFeatures(gameState) {
    const status = this.getProgressionStatus(gameState);
    if (!status.currentMilestone) return [];
    const milestone = status.currentMilestone;
    const features = [];
    if (milestone.level >= 3) {
      features.push("basic_automation", "dual_projects");
    }
    if (milestone.level >= 5) {
      features.push("smart_automation", "priority_system", "advanced_dashboard");
    }
    if (milestone.level >= 8) {
      features.push("ai_optimization", "advanced_analytics", "enterprise_features");
    }
    if (milestone.level >= 12) {
      features.push("legendary_automation", "complete_suite", "industry_tools");
    }
    return features;
  }
  /**
   * Check if a specific feature is unlocked
   */
  static isFeatureUnlocked(gameState, feature) {
    if (feature === "basic_automation" && grantsDelegation(gameState.studioKnowHow)) return true;
    const availableFeatures = this.getAvailableAutomationFeatures(gameState);
    return availableFeatures.includes(feature);
  }
  /**
   * Get next unlock requirements
   */
  static getNextUnlockRequirements(gameState) {
    const status = this.getProgressionStatus(gameState);
    if (!status.nextMilestone) return null;
    const playerLevel = gameState.playerData.level;
    const staffCount2 = gameState.hiredStaff.length;
    const projectsCompleted = this.calculateCompletedProjects(gameState);
    return {
      levelNeeded: status.nextMilestone.level,
      staffNeeded: status.nextMilestone.staffCount,
      projectsNeeded: status.nextMilestone.projectsCompleted,
      currentLevel: playerLevel,
      currentStaff: staffCount2,
      currentProjects: projectsCompleted
    };
  }
  /**
   * Generate a notification when a new milestone is reached
   */
  static checkForNewMilestone(oldGameState, newGameState) {
    const oldStatus = this.getProgressionStatus(oldGameState);
    const newStatus = this.getProgressionStatus(newGameState);
    const hasProgressed = newStatus.currentMilestone && (!oldStatus.currentMilestone || newStatus.currentMilestone.level > oldStatus.currentMilestone.level);
    return {
      unlocked: hasProgressed,
      milestone: hasProgressed ? newStatus.currentMilestone : null
    };
  }
  /**
   * Private helper methods
   */
  static meetsMilestoneRequirements(milestone, level, staffCount2, projectsCompleted) {
    return level >= milestone.level && staffCount2 >= milestone.staffCount && projectsCompleted >= milestone.projectsCompleted;
  }
  static calculateCompletedProjects(gameState) {
    const baseProjects = Math.floor(gameState.playerData.xp / 1e3);
    const levelBonus = Math.floor(gameState.playerData.level / 2);
    return Math.max(0, baseProjects + levelBonus);
  }
  static generateProgressionReason(level, staffCount2, projectsCompleted, nextMilestone) {
    if (!nextMilestone) {
      return "You've reached the highest progression level!";
    }
    const requirements = [];
    if (level < nextMilestone.level) {
      requirements.push(`Level ${nextMilestone.level} (currently ${level})`);
    }
    if (staffCount2 < nextMilestone.staffCount) {
      requirements.push(`${nextMilestone.staffCount} staff members (currently ${staffCount2})`);
    }
    if (projectsCompleted < nextMilestone.projectsCompleted) {
      requirements.push(`${nextMilestone.projectsCompleted} completed projects (currently ${projectsCompleted})`);
    }
    if (requirements.length === 0) {
      return "Ready for next milestone!";
    }
    return `To unlock next features, you need: ${requirements.join(", ")}`;
  }
  /** Map milestone level requirement to studio tier (1-5) */
  static getStudioTierFromMilestone(milestoneLevel) {
    if (!milestoneLevel || milestoneLevel < 3) return 1;
    if (milestoneLevel < 5) return 2;
    if (milestoneLevel < 8) return 3;
    if (milestoneLevel < 12) return 4;
    return 5;
  }
  /**
   * Authoritative studio tier (1-5).
   * Prioritizes authoritative gameState.studioLevel, falling back to milestone status.
   */
  static getStudioTier(gameState) {
    if (typeof gameState.studioLevel === "number") {
      const clamped = Math.max(1, Math.min(5, Math.floor(gameState.studioLevel)));
      return clamped;
    }
    const status = this.getProgressionStatus(gameState);
    return this.getStudioTierFromMilestone(status.currentMilestone?.level);
  }
  /** Metadata, console hardware, and unlock details for each tier */
  static getStudioTierDetails(tier) {
    const t2 = Math.max(1, Math.min(5, Math.floor(tier)));
    const names = [
      "HOME STUDIO",
      "BEDROOM+ STUDIO",
      "PROJECT STUDIO",
      "STUDIO A",
      "HIT FACTORY"
    ];
    const desks = [
      "4-channel compact valve desk",
      "8-channel analog slate console with rack bay",
      "12-channel British console (SSL/Neve) with analog VU meters",
      "16-channel large-format console with digital telemetry displays",
      "20-channel custom flagship master console with gold accents"
    ];
    const perks = [
      ["4-track analog warmth", "Single project focus", "Vintage valve chassis"],
      ["8-channel summing", "Second room expansion", "Basic automation routing"],
      ["12-channel British EQ", "Third room expansion", "Smart staff automation"],
      ["16-channel multitrack", "Fourth room expansion", "AI-assisted routing"],
      ["20-channel mastering suite", "Maximum expansion limit", "Complete automation suite"]
    ];
    return {
      tier: t2,
      name: names[t2 - 1],
      desk: desks[t2 - 1],
      perks: perks[t2 - 1]
    };
  }
  /**
   * Authoritative upgrade of studio tier.
   * State updates FIRST before presentation.
   * Idempotent: cannot downgrade or double-grant bonuses.
   */
  static advanceStudioTier(gameState, targetTier) {
    const oldTier = this.getStudioTier(gameState);
    const newTier = targetTier !== void 0 ? Math.max(1, Math.min(5, Math.floor(targetTier))) : Math.min(5, oldTier + 1);
    if (newTier <= oldTier) {
      return {
        newGameState: gameState,
        oldTier,
        newTier: oldTier,
        upgraded: false
      };
    }
    const newGameState = {
      ...gameState,
      studioLevel: newTier,
      studioTier: newTier,
      reputation: gameState.reputation + 25
    };
    try {
      gameEvents.emit("studio:tier_upgraded", { oldTier, newTier });
    } catch {
    }
    return {
      newGameState,
      oldTier,
      newTier,
      upgraded: true
    };
  }
};

// src/rpg/houseStyle.ts
var createInitialExpertise = () => ({ genres: {}, services: {}, approaches: {}, awarded: [] });

// src/simulation/choreEngine.ts
var AUTHORED_CHORES = {
  clean_tape_heads: {
    id: "clean_tape_heads",
    title: "Clean Tape Heads",
    description: "Swab isopropyl alcohol over the reel-to-reel playback & record heads to stabilize tape flutter.",
    category: "maintenance",
    energyCost: 1,
    hotspotId: "console",
    buffDurationSessions: 1,
    buffType: "timing_bonus",
    buffMagnitude: 0.1
    // +10% sweet-spot tolerance
  },
  calibrate_outboard: {
    id: "calibrate_outboard",
    title: "Calibrate Outboard Rack",
    description: "Align stereo compressor gains and zero VU meters for optimal analog headroom.",
    category: "maintenance",
    energyCost: 1,
    hotspotId: "console",
    buffDurationSessions: 1,
    buffType: "tech_bonus",
    buffMagnitude: 0.15
    // +15% technical gain
  },
  organize_patchbay: {
    id: "organize_patchbay",
    title: "Organize Patchbay & Cabling",
    description: "Neatly dress studio snakes and routing jacks to prevent grounding hum and quicken session changes.",
    category: "maintenance",
    energyCost: 1,
    hotspotId: "console",
    buffDurationSessions: 1,
    buffType: "energy_saver",
    buffMagnitude: 1
    // 1 energy cost refund
  },
  tune_acoustics: {
    id: "tune_acoustics",
    title: "Tune Acoustic Baffles",
    description: "Position gobos and diffuser panels around the drum booth for richer room ambience.",
    category: "acoustics",
    energyCost: 1,
    hotspotId: "liveRoom",
    buffDurationSessions: 1,
    buffType: "creativity_bonus",
    buffMagnitude: 0.15
    // +15% creativity gain
  },
  brew_espresso: {
    id: "brew_espresso",
    title: "Brew Fresh Espresso",
    description: "Grind dark roast beans in the studio lounge to elevate artist mood and producer alertness.",
    category: "hospitality",
    energyCost: 0,
    hotspotId: "shelf",
    buffDurationSessions: 1,
    buffType: "vibe_boost",
    buffMagnitude: 0.1
    // +10% client vibe & mood
  }
};
function createInitialChoreState() {
  const chores = {
    clean_tape_heads: { ...AUTHORED_CHORES.clean_tape_heads, completed: false, assignedStaffId: null },
    calibrate_outboard: { ...AUTHORED_CHORES.calibrate_outboard, completed: false, assignedStaffId: null },
    organize_patchbay: { ...AUTHORED_CHORES.organize_patchbay, completed: false, assignedStaffId: null },
    tune_acoustics: { ...AUTHORED_CHORES.tune_acoustics, completed: false, assignedStaffId: null },
    brew_espresso: { ...AUTHORED_CHORES.brew_espresso, completed: false, assignedStaffId: null }
  };
  return {
    chores,
    activeBuffs: [],
    dailyCompletedCount: 0,
    streakDays: 0,
    lastCompletedDay: 0,
    autoProcessEnabled: true
  };
}

// src/rpg/rankChase.ts
var THRESHOLDS = [
  { rank: "D", min: 0, payoutMult: 0.6 },
  { rank: "C", min: 30, payoutMult: 0.85 },
  { rank: "B", min: 55, payoutMult: 1 },
  { rank: "A", min: 80, payoutMult: 1.3 },
  { rank: "S", min: 90, payoutMult: 1.8 },
  { rank: "S+", min: 97, payoutMult: 2.5 }
];
var gradeQuality = (quality) => {
  const q = Math.max(0, Math.min(100, Math.floor(quality)));
  let idx = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (q >= THRESHOLDS[i].min) idx = i;
  }
  const current = THRESHOLDS[idx];
  const next = THRESHOLDS[idx + 1] ?? null;
  const pointsToNext = next ? next.min - q : 0;
  return {
    rank: current.rank,
    pointsToNext,
    payoutMult: current.payoutMult,
    nearMiss: next !== null && pointsToNext > 0 && pointsToNext <= 3,
    nextRank: next ? next.rank : null
  };
};

// src/narrative/characterOrigins.ts
var PRODUCER_ORIGINS = [
  {
    id: "bedroom-beatmaker",
    name: "The Bedroom Beatmaker",
    tagline: "Scrappy MPC chops and nocturnal groove intuition",
    lore: "Cut your teeth crafting beats on a cracked laptop with second-hand studio monitors propped on milk crates. You know how to make heavy 808s and punchy samples out of thin air, with zero patience for gatekeeping.",
    primaryPlaystyle: "underground",
    startingAttributeBonus: {
      creativeIntuition: 3,
      focusMastery: 1
    },
    passivePerk: {
      name: "Sample Alchemy",
      description: "+8 Quality on Hip Hop, Lo-Fi, Electronic and Trap sessions. +20% Sound Design and Sample Warping XP.",
      qualityBonus: 8,
      xpMultiplier: 1.2,
      xpSkills: ["soundDesign", "sampleWarping"],
      freeGigRefresh: true,
      specialTrait: "Chasing new gigs costs nothing (the cooldown still applies)."
    },
    startingGearSuggestion: "MPC Drum Sampler & Vintage Casio Keyboard",
    signatureGenres: ["Hip Hop", "Lo-Fi", "Electronic", "Trap"],
    preferredTheme: "neon-digital"
  },
  {
    id: "tape-purist",
    name: "The Analog Tape Purist",
    tagline: "Guardian of 2-inch tape, tube preamps, and live acoustic room magic",
    lore: "Spent three years winding reel-to-reel tape and demagnetizing record heads in damp basements. You believe music died the day digital waveforms replaced spinning oxide ribbons, but your organic vocal clarity is undisputed.",
    primaryPlaystyle: "purist",
    startingAttributeBonus: {
      technicalAptitude: 3,
      creativeIntuition: 1
    },
    passivePerk: {
      name: "Harmonic Saturation",
      description: "+10 Quality on Acoustic, Rock, Folk, Blues and Jazz sessions.",
      qualityBonus: 10,
      rankARepBonus: 0.15,
      specialTrait: "A-rank or better sessions earn +15% reputation."
    },
    startingGearSuggestion: "Reel-to-Reel Tape Machine & Ribbon Microphone",
    signatureGenres: ["Rock", "Acoustic", "Folk", "Blues", "Jazz"],
    preferredTheme: "warm-analog"
  },
  {
    id: "hit-factory-mercenary",
    name: "The Hit Factory Mercenary",
    tagline: "Viral hook radar and ruthless commercial efficiency",
    lore: "A former junior A&R scout who realized the money wasn\u2019t in finding talent, but in mass-producing earworms. You can arrange a four-chord radio anthem in your sleep and have every major playlist curator on speed dial.",
    primaryPlaystyle: "hit-maker",
    startingAttributeBonus: {
      businessAcumen: 3,
      focusMastery: 1
    },
    passivePerk: {
      name: "Chart Penetration",
      description: "+25% payout on Pop, Dance, RnB and Synthpop sessions.",
      payoutMultiplier: 1.25,
      hotMarketPayoutBonus: 0.08,
      specialTrait: "Genres in a hot market pay an extra +8%."
    },
    startingGearSuggestion: "Precision DSP Workstation & High-End Nearfield Monitors",
    signatureGenres: ["Pop", "Dance", "Commercial RnB", "Synthpop"],
    preferredTheme: "velvet-lounge"
  },
  {
    id: "sonic-alchemist",
    name: "The Sonic Alchemist",
    tagline: "Soldering iron wizard, circuit bender, and acoustic architect",
    lore: "Dropped out of electrical engineering to hot-rod vintage mixing boards and wind custom guitar pickups. Your patchbays look like bird nests, but you coax frequencies out of equipment that manufacturers said were impossible.",
    primaryPlaystyle: "sound-lab",
    startingAttributeBonus: {
      technicalAptitude: 2,
      creativeIntuition: 2
    },
    passivePerk: {
      name: "Component Overclock",
      description: "-35% daily equipment upkeep.",
      upkeepDiscount: 0.35,
      synergyMultiplier: 1.25,
      specialTrait: "Studio synergy quality bonuses are 25% stronger."
    },
    startingGearSuggestion: "Boutique Tube Equalizer & Modular Patch Synth",
    signatureGenres: ["Synthwave", "Ambient", "Experimental Rock", "Techno"],
    preferredTheme: "modular-rack"
  },
  {
    id: "charismatic-svengali",
    name: "The Charismatic Svengali",
    tagline: "Psychologist in the control room; turns fragile divas into icons",
    lore: "Part therapist, part diplomat, part creative director. You might not know the exact resistor value in a compressor, but you know exactly what words will make a terrified singer deliver a Grammy-winning breakdown on Take 3.",
    primaryPlaystyle: "purist",
    startingAttributeBonus: {
      creativeIntuition: 2,
      businessAcumen: 2
    },
    passivePerk: {
      name: "Vocal Spell",
      description: "+50% client relationship XP, so regulars reach Loyal much faster.",
      relationshipXpMultiplier: 1.5,
      repeatClientPremium: 1.18,
      specialTrait: "Returning clients pay an 18% loyalty premium (instead of 10%)."
    },
    startingGearSuggestion: "Gold-Plated Condenser Microphone & Vintage Leather Studio Couch",
    signatureGenres: ["Soul", "RnB", "Indie Rock", "Ballads"],
    preferredTheme: "velvet-lounge"
  }
];
var getProducerOrigin = (id) => {
  const origin = PRODUCER_ORIGINS.find((o2) => o2.id === id);
  return origin ?? PRODUCER_ORIGINS[0];
};
var applyOriginAttributes = (baseAttributes, originId) => {
  const origin = getProducerOrigin(originId);
  const bonus = origin.startingAttributeBonus;
  return {
    focusMastery: baseAttributes.focusMastery + (bonus.focusMastery ?? 0),
    creativeIntuition: baseAttributes.creativeIntuition + (bonus.creativeIntuition ?? 0),
    technicalAptitude: baseAttributes.technicalAptitude + (bonus.technicalAptitude ?? 0),
    businessAcumen: baseAttributes.businessAcumen + (bonus.businessAcumen ?? 0)
  };
};

// src/narrative/studioLore.ts
var RIVAL_STUDIOS = [
  {
    id: "black-wax-vault",
    name: "Black Wax Vault",
    headProducer: "Silas Vance",
    epithet: "The Analog High Priest",
    philosophy: "Digital audio is a sterile illusion. If it didn\u2019t pass through magnetised iron particles, it\u2019s not music.",
    primaryPlaystyle: "purist",
    preferredEra: "vintage-warmth",
    signatureGenres: ["Rock", "Jazz", "Blues", "Folk"],
    threatLevel: "Iconic Nemesis",
    catchphrase: "Feel the tape hiss. That is the sound of truth breathing.",
    rivalryBonus: "Beating Black Wax Vault in Golden Reels awards grants +15 Permanent Reputation with purist labels."
  },
  {
    id: "apex-velocity",
    name: "Apex Velocity Sound",
    headProducer: "Chad Sterling",
    epithet: "The Billboard Algorithm",
    philosophy: "Hooks every 7 seconds, autotuned perfection, and brand integration. Music is high-frequency commerce.",
    primaryPlaystyle: "hit-maker",
    preferredEra: "modern-digital",
    signatureGenres: ["Pop", "Electronic", "Hip Hop", "RnB"],
    threatLevel: "Titan",
    catchphrase: "If it doesn\u2019t trend on day one, delete the stems.",
    rivalryBonus: "Out-selling Apex Velocity on weekly charts unlocks exclusive corporate brand sponsorship contracts."
  },
  {
    id: "distortion-cellar",
    name: "The Distortion Cellar",
    headProducer: "Roxy Riot",
    epithet: "The Sonic Saboteur",
    philosophy: "Clean production is cowardice. Crank the preamps until the red lights burn out.",
    primaryPlaystyle: "underground",
    preferredEra: "retro-glam",
    signatureGenres: ["Punk", "Garage Rock", "Grunge", "Alternative"],
    threatLevel: "Contender",
    catchphrase: "Turn it up until the landlord calls the cops.",
    rivalryBonus: "Collaborating or rivaling Roxy unlocks rare Lo-Fi pedal mod blueprints and underground cult referrals."
  },
  {
    id: "silicon-harmonics",
    name: "Silicon Harmonics Labs",
    headProducer: "Dr. Aris Thorne",
    epithet: "The Frequency Architect",
    philosophy: "Sound is mathematical vibration. With correct modular routing and DSP, emotion can be synthesized.",
    primaryPlaystyle: "sound-lab",
    preferredEra: "digital-revolution",
    signatureGenres: ["Synthwave", "Ambient", "Techno", "Electronic"],
    threatLevel: "Contender",
    catchphrase: "Everything is an oscillator if you push enough voltage through it.",
    rivalryBonus: "Solving Dr. Thorne\u2019s frequency riddles grants unique circuit mod components and synergy discoveries."
  },
  {
    id: "velvet-static-collective",
    name: "Velvet Static Collective",
    headProducer: "Mira Gloss",
    epithet: "The Idol Architect",
    philosophy: "Pop is choreography glued to a chorus. Manufacture desire, then sell the encore.",
    primaryPlaystyle: "hit-maker",
    preferredEra: "modern-streaming",
    signatureGenres: ["Pop", "RnB", "Dance"],
    threatLevel: "Rising",
    catchphrase: "If the fans can lip-sync it in an elevator, we already won.",
    rivalryBonus: "Beating Velvet Static on playlist bids unlocks idol-group package briefs."
  },
  {
    id: "basement-tapes-union",
    name: "The Basement Tapes Union",
    headProducer: "Jules Ash",
    epithet: "The Co-op Saboteur",
    philosophy: "No contracts, no polish, only cassette hiss and collective veto power.",
    primaryPlaystyle: "underground",
    preferredEra: "retro-glam",
    signatureGenres: ["Lo-Fi", "Punk", "Garage Rock"],
    threatLevel: "Rising",
    catchphrase: "If the landlord can hear it, the mix is almost loud enough.",
    rivalryBonus: "Surviving a Union challenge unlocks underground co-op tour referrals."
  }
];

// src/narrative/rivalCast.ts
var GAME_ERA_BY_ANY_ERA = {
  "vintage-warmth": "analog60s",
  "retro-glam": "digital80s",
  "digital-revolution": "internet2000s",
  "modern-streaming": "streaming2020s",
  classic_rock: "analog60s",
  golden_age: "digital80s",
  digital_age: "internet2000s",
  modern: "streaming2020s",
  analog60s: "analog60s",
  digital80s: "digital80s",
  internet2000s: "internet2000s",
  streaming2020s: "streaming2020s"
};
var toGameEraId = (eraId) => eraId && GAME_ERA_BY_ANY_ERA[eraId] || "analog60s";
var PRIMARY_RIVAL_BY_PLAYSTYLE = {
  purist: "black-wax-vault",
  "hit-maker": "apex-velocity",
  underground: "distortion-cellar",
  "sound-lab": "silicon-harmonics"
};
var ACT2_RIVAL_BY_NODE = {
  act2_purist: "black-wax-vault",
  act2_commercial: "apex-velocity"
};
var FINALE_RIVAL_BY_NODE = {
  act3_golden_legend: "black-wax-vault",
  act3_sonic_alchemy: "silicon-harmonics",
  act3_billboard_monopoly: "apex-velocity",
  act3_rogue_factory: "distortion-cellar"
};
var fallbackRival = () => RIVAL_STUDIOS[0];
var byId = (id) => RIVAL_STUDIOS.find((r) => r.id === id) ?? fallbackRival();
var getPrimaryRival = (playstyle) => byId(PRIMARY_RIVAL_BY_PLAYSTYLE[playstyle ?? "purist"] ?? "black-wax-vault");
var getRivalForNode = (nodeId, playstyle) => {
  if (ACT2_RIVAL_BY_NODE[nodeId]) return byId(ACT2_RIVAL_BY_NODE[nodeId]);
  if (FINALE_RIVAL_BY_NODE[nodeId]) return byId(FINALE_RIVAL_BY_NODE[nodeId]);
  return getPrimaryRival(playstyle);
};
var RIVAL_LINES = {
  "black-wax-vault": {
    taunt: "\u201CYou have made enough noise for the old rooms to notice. Charts forget. Tape remembers.\u201D",
    challenge: "\u201CLet us see if your wooden walls survive real scrutiny. Bring a master. Leave the excuses.\u201D",
    showdown: "\u201COne reel. One take. Let the lacquer decide which of us was ever listening.\u201D",
    defeated: "Silas Vance hands you his own hand-labelled reel, unspooled and unmarked. \u201CKeep it. I have nothing left to prove to the tape.\u201D",
    respect: "Silas Vance nods once from the back of the room. \u201CNot how I would have done it. But it hums.\u201D"
  },
  "apex-velocity": {
    taunt: "\u201CYour room has a nice vibe. Adorable. Ask me what your streams-per-session are.\u201D",
    challenge: "\u201CIn this business, cash talks and indie rooms fold. Sign, or spectate.\u201D",
    showdown: "\u201CHooks every seven seconds. Beat the algorithm, or become its training data.\u201D",
    defeated: "Chad Sterling deletes the Apex Velocity press release he drafted about you. \u201CFine. Fine! Send me your rate card.\u201D",
    respect: "Chad Sterling leaves a voicemail: \u201CThe numbers were close. Numbers are never close. Call me.\u201D"
  },
  "distortion-cellar": {
    taunt: "\u201CYou mic the room like it might bite. Turn it up until the landlord calls the cops.\u201D",
    challenge: "\u201CClean is cowardice. Play the festival with us, or watch it from the parking lot.\u201D",
    showdown: "\u201CEvery amp in the city is plugged into this warehouse tonight. Do not be the quiet one.\u201D",
    defeated: "Roxy Riot crowd-surfs your control room door. \u201CBest record the ceiling ever heard!\u201D The ceiling agrees.",
    respect: "Roxy Riot spits, grins, and signs your console in marker. \u201CNot punk. But loud.\u201D"
  },
  "silicon-harmonics": {
    taunt: "\u201CYour signal chain is charming. Everything is an oscillator if you push enough voltage through it.\u201D",
    challenge: "\u201CThere is a frequency in this circuit no one has heard. Do you want to hear it?\u201D",
    showdown: "\u201CRoute it. Measure it. Feel the resonance, or explain why you cannot.\u201D",
    defeated: "Dr. Aris Thorne stares at the oscilloscope for a long time. \u201CThe math was wrong. The record is right.\u201D",
    respect: "Dr. Aris Thorne annotates your schematic in green ink. \u201CReproducible. Barely. I will allow it.\u201D"
  }
};
var getRivalLines = (rivalId) => RIVAL_LINES[rivalId] ?? RIVAL_LINES["black-wax-vault"];

// src/narrative/eraBranchCopy.ts
var ACT1_BY_ERA = {
  analog60s: {
    kicker: "CAMPAIGN CROSSROAD // TAPE OR THROUGHPUT",
    context: "Your first reels have drawn both the folk clubs and a regional label. Protect the live-room craft, or hire hands and chase radio rotation?",
    options: {
      pathA: {
        label: "Double down on acoustic craft & heritage",
        flavorText: "Rebuild the baffles, trust the tape, refuse the rush release.",
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: "Session players start asking for your room by name."
        }
      },
      pathB: {
        label: "Scale the diary for radio hits",
        flavorText: "More engineers, shorter sessions, choruses that survive AM.",
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: "Program directors learn your studio\u2019s number."
        }
      }
    }
  },
  digital80s: {
    kicker: "CAMPAIGN CROSSROAD // GLOSS OR GRIT",
    context: "MTV wants a look; the live room still wants a band. Chase the gated-snare spectacle, or keep the takes honest and slightly dangerous?",
    options: {
      pathA: {
        label: "Defend the honest live take",
        flavorText: "Less gloss, more air. Let the room breathe on tape.",
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: "Audiophiles notice; the video team shrugs."
        }
      },
      pathB: {
        label: "Build a hit factory for the charts",
        flavorText: "More tracks, brighter choruses, engineers who never sleep.",
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: "The first video edit books before the master is dry."
        }
      }
    }
  },
  internet2000s: {
    kicker: "CAMPAIGN CROSSROAD // DOWNLOAD OR DIY",
    context: "File-sharing eats singles while blogs crown underground rooms. Harden into a commercial pipeline, or stay the scene\u2019s quiet ally?",
    options: {
      pathA: {
        label: "Protect craft over click-count",
        flavorText: "Master for speakers, not for a 128kbps preview.",
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: "Serious artists book you because the forums said so."
        }
      },
      pathB: {
        label: "Optimise for the download era",
        flavorText: "Faster turnarounds, louder masters, sync-friendly stems.",
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: "A ringtone deal pays the quarter\u2019s rent."
        }
      }
    }
  },
  streaming2020s: {
    kicker: "CAMPAIGN CROSSROAD // PLAYLIST OR PRINCIPLE",
    context: "Playlist curators and indie collectives both want a piece of your next release. Chase the algorithm, or build a room artists still trust?",
    options: {
      pathA: {
        label: "Double down on craft & artist trust",
        flavorText: "Refuse playlist shortcuts. Make records that age past a swipe.",
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: "Artists praise your uncompromising sonic integrity."
        }
      },
      pathB: {
        label: "Scale for streaming throughput",
        flavorText: "Expand staff, ship hooks on schedule, monetise every spike.",
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: "Streaming revenue starts to flow into the studio accounts."
        }
      }
    }
  }
};
var ACT2_PURIST_BY_ERA = {
  analog60s: {
    kicker: "HERITAGE SPLIT // THE MASTERING DUEL",
    context: "A historic master reel needs a philosophy: pure lacquer, or a careful hybrid that keeps the soul and adds options?",
    options: {
      pathA: {
        label: "The Golden Reel: pure analog master",
        flavorText: "Live lacquer cut. No digital safety net.",
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: "Audiophiles treat the release as a fidelity benchmark."
        }
      },
      pathB: {
        label: "The Sonic Alchemist: hybrid innovation",
        flavorText: "Tubes up front, careful processing at the end.",
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: "Engineering journals ask for your schematic."
        }
      }
    }
  },
  digital80s: {
    kicker: "HERITAGE SPLIT // THE MASTERING DUEL",
    context: "A heritage tape wants to survive the loudness wars. Cut it pure, or invent a hybrid path that still sounds like a room?",
    options: {
      pathA: {
        label: "The Golden Reel: pure analog master",
        flavorText: "Refuse the squash. Keep the dynamics.",
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: "Radio complains; the vinyl presses sell out."
        }
      },
      pathB: {
        label: "The Sonic Alchemist: hybrid innovation",
        flavorText: "Gate where it helps, leave space where it matters.",
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: "Your hybrid chain becomes a quiet industry standard."
        }
      }
    }
  },
  internet2000s: {
    kicker: "HERITAGE SPLIT // THE MASTERING DUEL",
    context: "A classic album is being remastered for a new century. Preserve the original intent, or prove digital can still feel human?",
    options: {
      pathA: {
        label: "The Golden Reel: archival purity",
        flavorText: "Transfer once, touch little, document everything.",
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: "Collectors call it the definitive edition."
        }
      },
      pathB: {
        label: "The Sonic Alchemist: modern hybrid",
        flavorText: "Restore with tools, finish with ears.",
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: "The remaster wins awards without sounding sterile."
        }
      }
    }
  },
  streaming2020s: {
    kicker: "HERITAGE SPLIT // THE MASTERING DUEL",
    context: "A historic master needs a definitive philosophy before it hits high-res streaming and vinyl at once.",
    options: {
      pathA: {
        label: "The Golden Reel Legend: pure analog master",
        flavorText: "Live lacquer cut without digital compression.",
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: "Audiophiles hail the release as a benchmark of fidelity."
        }
      },
      pathB: {
        label: "The Sonic Alchemist: hybrid acoustic innovation",
        flavorText: "Fuse vacuum tubes with modular DSP enhancement.",
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: "Engineering journals feature your custom acoustic circuit."
        }
      }
    }
  }
};
var ACT2_COMMERCIAL_BY_ERA = {
  analog60s: {
    kicker: "INDUSTRY FORK // DISTRIBUTION",
    context: "A national distributor and a co-op of independent shops both want your next release. Sign the big deal, or keep the stems with the scene?",
    options: {
      pathA: {
        label: "The Billboard Monopoly: sign the conglomerate",
        flavorText: "Nationwide racks, radio favour, thicker advances.",
        consequences: {
          moneyDelta: 5e3,
          repDelta: -5,
          narrativeOutcome: "Commercial reach arrives; some purists stop calling."
        }
      },
      pathB: {
        label: "The Rogue Hit Factory: open-stem grassroots",
        flavorText: "Share multitracks with remixers while keeping publishing.",
        consequences: {
          moneyDelta: 2e3,
          repDelta: 20,
          narrativeOutcome: "College DJs and pirate stations crown your room."
        }
      }
    }
  },
  digital80s: {
    kicker: "INDUSTRY FORK // GLOBAL DISTRIBUTION",
    context: "A major wants exclusivity for the video era; an indie network wants open stems for club remixes.",
    options: {
      pathA: {
        label: "The Billboard Monopoly: conglomerate buy-in",
        flavorText: "Dominate the charts and the video slots.",
        consequences: {
          moneyDelta: 5e3,
          repDelta: -5,
          narrativeOutcome: "Unprecedented commercial reach at the cost of purist credibility."
        }
      },
      pathB: {
        label: "The Rogue Hit Factory: open-stem wave",
        flavorText: "Publish stems for remixers; keep the publishing.",
        consequences: {
          moneyDelta: 2e3,
          repDelta: 20,
          narrativeOutcome: "Club remixes turn your B-sides into a movement."
        }
      }
    }
  },
  internet2000s: {
    kicker: "INDUSTRY FORK // GLOBAL DISTRIBUTION",
    context: "A mega-label wants the download exclusives; a blog network wants Creative Commons stems.",
    options: {
      pathA: {
        label: "The Billboard Monopoly: sign the mega-deal",
        flavorText: "Own the storefronts and the ringtone rights.",
        consequences: {
          moneyDelta: 5e3,
          repDelta: -5,
          narrativeOutcome: "The numbers look incredible; the forums look sceptical."
        }
      },
      pathB: {
        label: "The Rogue Hit Factory: open-stem grassroots",
        flavorText: "Let the blogs remix you into relevance.",
        consequences: {
          moneyDelta: 2e3,
          repDelta: 20,
          narrativeOutcome: "A thousand remixes later, your name is a scene password."
        }
      }
    }
  },
  streaming2020s: {
    kicker: "INDUSTRY FORK // GLOBAL DISTRIBUTION",
    context: "Major distribution bids land on your desk \u2014 playlist empires on one side, open-stem scenes on the other.",
    options: {
      pathA: {
        label: "The Billboard Monopoly: conglomerate buy-in",
        flavorText: "Dominate playlist algorithms and take global royalty shares.",
        consequences: {
          moneyDelta: 5e3,
          repDelta: -5,
          narrativeOutcome: "Unprecedented commercial reach at the cost of purist credibility."
        }
      },
      pathB: {
        label: "The Rogue Hit Factory: open-stem grassroots wave",
        flavorText: "Publish open stems for remixers while keeping full publishing.",
        consequences: {
          moneyDelta: 2e3,
          repDelta: 20,
          narrativeOutcome: "Viral short-form remixes crown your room."
        }
      }
    }
  }
};
var fallbackEra = (eraId) => {
  const id = toGameEraId(eraId);
  return ACT1_BY_ERA[id] ? id : "streaming2020s";
};
var getAct1DilemmaCopy = (eraId) => ACT1_BY_ERA[fallbackEra(eraId)];
var getAct2PuristDilemmaCopy = (eraId) => ACT2_PURIST_BY_ERA[fallbackEra(eraId)];
var getAct2CommercialDilemmaCopy = (eraId) => ACT2_COMMERCIAL_BY_ERA[fallbackEra(eraId)];

// src/narrative/subplotCatalog.ts
var staffCount = (n2) => (state) => (state.hiredStaff?.length ?? 0) >= n2;
var ERA_SUBPLOTS = [
  // ───────────── 1960s ─────────────
  {
    id: "subplot_session_union",
    title: "The Session Union Walkout",
    kicker: "LABOUR // THE MUSICIANS\u2019 UNION",
    eras: ["analog60s"],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 10,
    stages: [
      {
        stageNumber: 1,
        title: "A Delegate at the Control-Room Door",
        context: "The local musicians\u2019 union has noticed your busy schedule. A delegate wants a scale rate for every horn and rhythm player who walks through your door.",
        options: [
          {
            id: "union_sign",
            label: "Sign the scale agreement",
            flavorText: "Session players get paid properly \u2014 and show up prepared.",
            storyFlag: "signed_union_scale",
            consequences: { moneyDelta: -600, repDelta: 8, narrativeOutcome: "Word spreads: your studio treats players right." }
          },
          {
            id: "union_stall",
            label: "Stall until a bigger session pays for it",
            flavorText: "Every dollar counts this year.",
            storyFlag: "stalled_union",
            consequences: { moneyDelta: 0, repDelta: -3, narrativeOutcome: "The delegate leaves a card and a warning." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Picket Line",
        context: "Whatever you chose, the union\u2019s answer arrives on a Saturday: a handful of players with signs outside \u2014 or a thank-you note.",
        options: [
          {
            id: "union_host_benefit",
            label: "Host a benefit session",
            flavorText: "Open the room, let the whole crew jam on the house.",
            storyFlag: "hosted_union_benefit",
            consequences: { moneyDelta: -250, repDelta: 12, narrativeOutcome: "The benefit night becomes a legend in the local scene." }
          },
          {
            id: "union_quiet_deal",
            label: "Cut a quiet side-deal",
            flavorText: "Pay the delegate\u2019s favourites a little extra, off the books.",
            storyFlag: "quiet_union_deal",
            consequences: { moneyDelta: 400, repDelta: 0, narrativeOutcome: "No pickets, no headlines \u2014 and a dependable horn section." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_stereo_panic",
    title: "The Stereo Question",
    kicker: "TECHNOLOGY // MONO VS STEREO",
    eras: ["analog60s"],
    minDay: 18,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.money >= 800,
    stages: [
      {
        stageNumber: 1,
        title: "The Label Wants Two Speakers",
        context: "A regional label is releasing its first stereo LPs. Mix in stereo, or defend the punch of a great mono mix?",
        options: [
          {
            id: "stereo_invest",
            label: "Rewire for stereo",
            flavorText: "A second monitor and a panning matrix. Costly, but the future.",
            storyFlag: "went_stereo",
            consequences: { moneyDelta: -1100, repDelta: 7, narrativeOutcome: "Hard-panned drums delight the label." }
          },
          {
            id: "stereo_defend_mono",
            label: "Defend the mono mix",
            flavorText: "One speaker, one truth. The radio is mono anyway.",
            storyFlag: "defended_mono",
            consequences: { moneyDelta: 300, repDelta: 3, narrativeOutcome: "Purists cheer; the label shrugs." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "What the Radio Said",
        context: "The first release goes out. Program directors weigh in.",
        contextByFlag: {
          went_stereo: "The stereo LP is on the radio with hard-panned drums. Program directors argue about whether two speakers are a gimmick or the future.",
          defended_mono: "Your mono mix is still punching through AM radios. A few stereo converts write angry letters; the rest just dance."
        },
        options: [
          {
            id: "stereo_press_release",
            label: "Boast about the mix in the trades",
            flavorText: "Sell the story of your room\u2019s sound.",
            storyFlag: "boasted_mix",
            whenFlag: {
              went_stereo: {
                label: "Sell the stereo story to the trades",
                flavorText: "Tell them you rewired the room for the future.",
                narrativeOutcome: "The trades run a photo of your new monitors; bookings rise."
              },
              defended_mono: {
                label: "Sell the mono punch to the trades",
                flavorText: "Remind them radio is still one speaker.",
                narrativeOutcome: "A charmingly stubborn profile runs. Purists book you for months."
              }
            },
            consequences: { moneyDelta: 500, repDelta: 6, narrativeOutcome: "The trades pick up the story; bookings rise." }
          },
          {
            id: "stereo_stay_humble",
            label: "Let the record speak for itself",
            flavorText: "No press. Just great records.",
            storyFlag: "stayed_humble",
            whenFlag: {
              went_stereo: {
                flavorText: "Let the hard-panned drums do the talking."
              },
              defended_mono: {
                flavorText: "One speaker, one truth \u2014 no press release needed."
              }
            },
            consequences: { moneyDelta: 0, repDelta: 10, narrativeOutcome: "Musicians whisper that yours is the room that \u201Cjust sounds right\u201D." }
          }
        ]
      }
    ]
  },
  // ───────────── 1980s ─────────────
  {
    id: "subplot_mtv_budget",
    title: "The Video Budget",
    kicker: "MEDIA // MTV IS WATCHING",
    eras: ["digital80s"],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 15,
    stages: [
      {
        stageNumber: 1,
        title: "Make It Look Like It Sounds",
        context: "A band on your books has a video shoot in three weeks. Their manager wants the single to \u201Cpop off the screen\u201D.",
        options: [
          {
            id: "mtv_gated_reverb",
            label: "Go all-in on gated reverb and synth stabs",
            flavorText: "Big drums, bigger hair. Pure 1985.",
            storyFlag: "went_big_eighties",
            consequences: { moneyDelta: -700, repDelta: 9, narrativeOutcome: "The snare alone gets a fan letter." }
          },
          {
            id: "mtv_keep_it_raw",
            label: "Keep it raw and let the video carry it",
            flavorText: "Less gloss, more grit.",
            storyFlag: "kept_it_raw",
            consequences: { moneyDelta: 200, repDelta: 3, narrativeOutcome: "The band shrugs \u2014 and the video turns out fine." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Heavy Rotation",
        context: "The video is on air. The phones start ringing.",
        options: [
          {
            id: "mtv_licence_sync",
            label: "License the track to a movie trailer",
            flavorText: "A quick payday and a wider audience.",
            storyFlag: "licensed_the_hit",
            consequences: { moneyDelta: 1400, repDelta: -2, narrativeOutcome: "The cheque clears; purist friends raise an eyebrow." }
          },
          {
            id: "mtv_album_pitch",
            label: "Pitch the band a full album deal in your room",
            flavorText: "Bet on longevity over a quick win.",
            storyFlag: "pitched_album_deal",
            consequences: { moneyDelta: 300, repDelta: 12, narrativeOutcome: "The album is booked \u2014 and everyone knows whose room made the single." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_sampler_lawsuit",
    title: "The Uncleared Sample",
    kicker: "LEGAL // SAMPLE CLEARANCE",
    eras: ["digital80s", "internet2000s"],
    minDay: 16,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 20 && state.money >= 1200,
    stages: [
      {
        stageNumber: 1,
        title: "A Letter From a Lawyer",
        context: "A record you produced borrowed four seconds of an old soul record. The original artist\u2019s lawyers want to talk.",
        options: [
          {
            id: "sample_settle",
            label: "Settle and credit the original artist",
            flavorText: "Make it right \u2014 and tell everyone.",
            storyFlag: "settled_sample_claim",
            consequences: { moneyDelta: -1200, repDelta: 10, narrativeOutcome: "The original artist appears on the remix. Classy." }
          },
          {
            id: "sample_fight",
            label: "Fight it in court",
            flavorText: "It was transformative. Probably.",
            storyFlag: "fought_sample_claim",
            consequences: { moneyDelta: -300, repDelta: -4, narrativeOutcome: "Legal fees mount. The clock ticks." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Verdict",
        context: "A judge \u2014 or a mediator \u2014 weighs in.",
        options: [
          {
            id: "sample_replay",
            label: "Replace the sample with a live-played replay",
            flavorText: "Hire players; re-record the part clean.",
            storyFlag: "replayed_the_sample",
            consequences: { moneyDelta: -500, repDelta: 8, narrativeOutcome: "The record is cleaner than ever \u2014 and legally airtight." }
          },
          {
            id: "sample_publicity",
            label: "Turn the dispute into publicity",
            flavorText: "Every headline is a headline.",
            storyFlag: "weaponised_the_lawsuit",
            consequences: { moneyDelta: 900, repDelta: -3, narrativeOutcome: "Notoriety sells. So does controversy." }
          }
        ]
      }
    ]
  },
  // ───────────── 2000s ─────────────
  {
    id: "subplot_napster_leak",
    title: "The Album That Leaked",
    kicker: "INTERNET // THE LEAK",
    eras: ["internet2000s"],
    minDay: 14,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 25,
    stages: [
      {
        stageNumber: 1,
        title: "Uploaded at 3 A.M.",
        context: "A client\u2019s unreleased album is on every file-sharing network. Somebody at the studio has a lot of explaining to do.",
        options: [
          {
            id: "leak_lawyers",
            label: "Send takedown notices to everyone",
            flavorText: "Fight fire with paperwork.",
            storyFlag: "chased_the_leak",
            consequences: { moneyDelta: -400, repDelta: 6, narrativeOutcome: "Most copies vanish. The band is relieved." }
          },
          {
            id: "leak_embrace",
            label: "Embrace it: release the album free for a week",
            flavorText: "If they\u2019re listening anyway, let them pay with attention.",
            storyFlag: "embraced_the_leak",
            consequences: { moneyDelta: 0, repDelta: 11, narrativeOutcome: "The download counter spins and the tour sells out." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Who Held the Hard Drive?",
        context: "Your security is in question. So is your trust in the interns.",
        contextByFlag: {
          chased_the_leak: "The takedown notices worked \u2014 mostly. Now the question is whether the studio becomes a fortress or stays a workplace.",
          embraced_the_leak: "The free week worked: the tour is sold out. Fans still want access, and labels still want locks."
        },
        options: [
          {
            id: "leak_lock_down",
            label: "Lock down the studio: badges, logs, NDAs",
            flavorText: "Professional. A little paranoid.",
            storyFlag: "locked_down_studio",
            whenFlag: {
              chased_the_leak: {
                label: "Finish the lockdown you started",
                flavorText: "Badges, logs, NDAs \u2014 make the paperwork permanent."
              },
              embraced_the_leak: {
                label: "Lock the vaults even if the album was free",
                flavorText: "Attention is one thing; the next unreleased master is another."
              }
            },
            consequences: { moneyDelta: -350, repDelta: 7, narrativeOutcome: "Labels notice your tight ship." }
          },
          {
            id: "leak_trust_crew",
            label: "Keep it human: trust the crew",
            flavorText: "Nobody here would do this on purpose.",
            storyFlag: "trusted_the_crew",
            whenFlag: {
              embraced_the_leak: {
                label: "Keep the open-door culture that made the free week work",
                flavorText: "Trust made the tour sell out; keep trusting.",
                narrativeOutcome: "Morale climbs; the scene calls your room a sanctuary again."
              }
            },
            consequences: { moneyDelta: 200, repDelta: 3, narrativeOutcome: "Morale climbs; the culprit quietly apologises." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_myspace_scene",
    title: "The Profile Page Scene",
    kicker: "SCENE // ONLINE BUZZ",
    eras: ["internet2000s"],
    minDay: 10,
    daysBetweenStages: 3,
    triggerCondition: () => true,
    stages: [
      {
        stageNumber: 1,
        title: "A Thousand Friends, Zero Money",
        context: "Half a dozen bedroom bands have found you online and want a record \u2014 for exposure. You can\u2019t pay the rent in exposure.",
        options: [
          {
            id: "scene_comp_album",
            label: "Produce a local-scene compilation",
            flavorText: "One weekend, twelve bands, one CD.",
            storyFlag: "made_scene_comp",
            consequences: { moneyDelta: -300, repDelta: 10, narrativeOutcome: "The comp gets local radio play and a lot of goodwill." }
          },
          {
            id: "scene_paid_only",
            label: "Paid sessions only",
            flavorText: "Business is business.",
            storyFlag: "paid_sessions_only",
            consequences: { moneyDelta: 300, repDelta: 0, narrativeOutcome: "A few bands walk; the rest pay up." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Breakout Band",
        context: "One of those bedroom bands is suddenly on a big blog.",
        options: [
          {
            id: "scene_claim_credit",
            label: "Put your studio name on the record",
            flavorText: "Be the room they remember.",
            storyFlag: "claimed_scene_credit",
            consequences: { moneyDelta: 0, repDelta: 9, narrativeOutcome: "Producers ask who made that record. You did." }
          },
          {
            id: "scene_offer_deal",
            label: "Offer them a production deal",
            flavorText: "Lock in the future before somebody else does.",
            storyFlag: "signed_breakout_band",
            consequences: { moneyDelta: -400, repDelta: 5, narrativeOutcome: "They sign \u2014 and you\u2019ve got first refusal on the follow-up." }
          }
        ]
      }
    ]
  },
  // ───────────── 2020s ─────────────
  {
    id: "subplot_playlist_payola",
    title: "The Playlist Curator\u2019s Offer",
    kicker: "STREAMING // PAY-TO-PLAY",
    eras: ["streaming2020s"],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 15,
    stages: [
      {
        stageNumber: 1,
        title: "A DM From a Curator",
        context: "A playlist curator with a million followers offers to feature your client \u2014 for a \u201Cpromotional fee\u201D.",
        options: [
          {
            id: "payola_pay",
            label: "Pay the fee",
            flavorText: "Streams are streams.",
            storyFlag: "paid_the_curator",
            consequences: { moneyDelta: -900, repDelta: -2, narrativeOutcome: "The track spikes; the algorithm loves it." }
          },
          {
            id: "payola_decline",
            label: "Decline and pitch organically",
            flavorText: "You don\u2019t buy love.",
            storyFlag: "declined_payola",
            consequences: { moneyDelta: 0, repDelta: 7, narrativeOutcome: "Slower, but your client trusts you more." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Algorithm\u2019s Verdict",
        context: "A week later, the numbers are in.",
        options: [
          {
            id: "payola_case_study",
            label: "Publish a transparent case study",
            flavorText: "Show the receipts, whatever they say.",
            storyFlag: "published_case_study",
            consequences: { moneyDelta: 400, repDelta: 8, narrativeOutcome: "Industry blogs cite your honesty." }
          },
          {
            id: "payola_double_down",
            label: "Book the curator\u2019s other clients",
            flavorText: "Volume beats principles, occasionally.",
            storyFlag: "doubled_down_payola",
            consequences: { moneyDelta: 1100, repDelta: -4, narrativeOutcome: "A busy week and a mild ethical hangover." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_ai_voice_clone",
    title: "The Voice Clone Request",
    kicker: "TECHNOLOGY // SYNTHETIC VOCALS",
    eras: ["streaming2020s"],
    minDay: 16,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 20,
    stages: [
      {
        stageNumber: 1,
        title: "A Perfect Fake",
        context: "A client wants a demo sung in a famous vocalist\u2019s cloned voice. The cheque is generous; the ethics are murky.",
        options: [
          {
            id: "clone_accept",
            label: "Take the job",
            flavorText: "It\u2019s a demo. Nobody will ever hear it.",
            storyFlag: "made_voice_clone",
            consequences: { moneyDelta: 1600, repDelta: -6, narrativeOutcome: "The cheque clears. The demo escapes." }
          },
          {
            id: "clone_refuse",
            label: "Refuse and offer a real session singer",
            flavorText: "Hire a person instead.",
            storyFlag: "refused_voice_clone",
            consequences: { moneyDelta: -200, repDelta: 9, narrativeOutcome: "A working singer gets the gig \u2014 and you get the story." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Demo That Got Out",
        context: "Somewhere on the internet, a fake is trending \u2014 or a hero story is.",
        options: [
          {
            id: "clone_public_stance",
            label: "Publish your studio\u2019s policy on synthetic voices",
            flavorText: "Draw a line, sign it, post it.",
            storyFlag: "published_voice_policy",
            consequences: { moneyDelta: 0, repDelta: 12, narrativeOutcome: "Artists cite your policy in their own contracts." }
          },
          {
            id: "clone_no_comment",
            label: "No comment",
            flavorText: "Let the news cycle move on.",
            storyFlag: "no_comment_voice_clone",
            consequences: { moneyDelta: 500, repDelta: -2, narrativeOutcome: "The story fades. So does some trust." }
          }
        ]
      }
    ]
  },
  // ───────────── Any era ─────────────
  {
    id: "subplot_hometown_hero",
    title: "The Hometown Hero Returns",
    kicker: "LEGACY // A FAMILIAR FACE",
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 35,
    stages: [
      {
        stageNumber: 1,
        title: "Someone From the Old Days",
        context: "An artist from your first sessions turns up, famous now, asking for a favour: a secret rehearsal record, off the schedule.",
        options: [
          {
            id: "hero_secret_session",
            label: "Clear the calendar for a secret session",
            flavorText: "Loyalty is a two-way street.",
            storyFlag: "gave_hero_secret_session",
            consequences: { moneyDelta: -350, repDelta: 9, narrativeOutcome: "The star never forgets who kept the secret." }
          },
          {
            id: "hero_standard_rate",
            label: "Book them at your normal rate",
            flavorText: "Business first. They can afford it.",
            storyFlag: "charged_hero_full_rate",
            consequences: { moneyDelta: 900, repDelta: 0, narrativeOutcome: "A smile, a signature, a handsome invoice." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Thank-You",
        context: "The record comes out. The credits are read carefully.",
        options: [
          {
            id: "hero_shoutout",
            label: "Accept the on-stage shout-out",
            flavorText: "A packed arena hears your name.",
            storyFlag: "took_hero_shoutout",
            consequences: { moneyDelta: 0, repDelta: 14, narrativeOutcome: "Thousands of people now know your room exists." }
          },
          {
            id: "hero_gold_plaque",
            label: "Ask for a gold plaque for the wall",
            flavorText: "Something to hang above the console.",
            storyFlag: "hung_hero_plaque",
            consequences: { moneyDelta: 200, repDelta: 8, narrativeOutcome: "A brass plaque glows above the desk. Clients notice." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_burnt_out_engineer",
    title: "The Burnt-Out Engineer",
    kicker: "CREW // ONE BAD WEEK",
    minDay: 14,
    daysBetweenStages: 4,
    triggerCondition: staffCount(1),
    stages: [
      {
        stageNumber: 1,
        title: "A Knock at 2 A.M.",
        context: "One of your crew hasn\u2019t slept in days and sits in the live room, staring at the tape machine. They need something to change.",
        options: [
          {
            id: "crew_time_off",
            label: "Send them home for a week, paid",
            flavorText: "Health beats deadlines.",
            storyFlag: "gave_crew_time_off",
            consequences: { moneyDelta: -450, repDelta: 6, narrativeOutcome: "They return rested, focused, and loyal." }
          },
          {
            id: "crew_push_through",
            label: "Ask them to push through the deadline",
            flavorText: "One last push, then a break.",
            storyFlag: "pushed_the_crew",
            consequences: { moneyDelta: 500, repDelta: -3, narrativeOutcome: "The session ships. Morale does not." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Second Thoughts",
        context: "The crew have opinions about how the studio treats people. They\u2019re sharing them.",
        options: [
          {
            id: "crew_profit_share",
            label: "Offer a profit-share on weekend sessions",
            flavorText: "A stake makes people care.",
            storyFlag: "offered_profit_share",
            consequences: { moneyDelta: -300, repDelta: 10, narrativeOutcome: "The whole crew is suddenly invested in the studio\u2019s success." }
          },
          {
            id: "crew_status_quo",
            label: "Keep things as they are",
            flavorText: "Nobody\u2019s quit yet.",
            storyFlag: "kept_status_quo",
            consequences: { moneyDelta: 0, repDelta: 0, narrativeOutcome: "Nothing changes. Nothing breaks. Yet." }
          }
        ]
      }
    ]
  }
];

// src/narrative/callbackSubplots.ts
var hasFlag = (...flags) => (state) => flags.some((f) => Boolean(state.storylineState?.storyFlags?.[f]));
var CALLBACK_SUBPLOTS = [
  // ───────────── Labour & crew ─────────────
  {
    id: "subplot_union_reckoning",
    title: "The Union Remembers",
    kicker: "LABOUR // SCALE OR STALL",
    eras: ["analog60s"],
    minDay: 28,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("signed_union_scale", "stalled_union")(state) && state.reputation >= 15,
    becauseOf: {
      signed_union_scale: "signed the union scale",
      stalled_union: "stalled the union"
    },
    stages: [
      {
        stageNumber: 1,
        title: "The Delegate Returns",
        context: "The union delegate is back with a clipboard. Studios that signed scale are being asked to vouch for the agreement; studios that stalled are being asked to explain themselves in front of the local.",
        options: [
          {
            id: "reckoning_vouch",
            label: "Stand up at the local and vouch for scale",
            flavorText: "Put your name on the record, whichever way you went before.",
            storyFlag: "vouched_for_scale",
            consequences: { moneyDelta: -200, repDelta: 9, narrativeOutcome: "The room applauds. Players start asking for your studio by name." }
          },
          {
            id: "reckoning_keep_head_down",
            label: "Send your apologies and stay out of it",
            flavorText: "Politics is bad for bookings.",
            storyFlag: "skipped_union_meeting",
            consequences: { moneyDelta: 150, repDelta: -2, narrativeOutcome: "Nobody notices your absence \u2014 until they do." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Who Plays on Friday",
        context: "Friday night is your biggest session of the month. Whether the horn section shows up depends on how the union feels about you.",
        options: [
          {
            id: "reckoning_pay_premium",
            label: "Pay a premium to guarantee the band",
            flavorText: "Buy the goodwill back if you have to.",
            storyFlag: "paid_union_premium",
            consequences: { moneyDelta: -400, repDelta: 6, narrativeOutcome: "The session runs like clockwork. The premium is forgotten; the take is not." }
          },
          {
            id: "reckoning_use_juniors",
            label: "Fill the chairs with eager juniors",
            flavorText: "Everybody starts somewhere.",
            storyFlag: "used_junior_players",
            consequences: { moneyDelta: 300, repDelta: 3, narrativeOutcome: "Rough edges, real energy. A couple of the juniors become regulars." }
          }
        ]
      },
      {
        stageNumber: 3,
        title: "Ten Years On",
        context: "A young horn player you once hired at scale wants to start a session-players\u2019 co-op, and asks whether the studio will be its first home.",
        options: [
          {
            id: "coop_host",
            label: "Host the co-op\u2019s first sessions",
            flavorText: "Give the next generation a room.",
            storyFlag: "hosted_players_coop",
            consequences: { moneyDelta: -350, repDelta: 10, narrativeOutcome: "The co-op\u2019s first record is recorded in your live room, and its name is on the label." }
          },
          {
            id: "coop_advice",
            label: "Offer advice and a reference, nothing more",
            flavorText: "Wish them well from a distance.",
            storyFlag: "advised_players_coop",
            consequences: { moneyDelta: 0, repDelta: 4, narrativeOutcome: "A warm letter, a small thank-you, and a co-op that finds its own feet elsewhere." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_crew_exodus",
    title: "The Crew Gets an Offer",
    kicker: "CREW // LOYALTY IS EARNED",
    minDay: 30,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("pushed_the_crew", "kept_status_quo", "gave_crew_time_off", "offered_profit_share")(state) && (state.hiredStaff?.length ?? 0) >= 1,
    becauseOf: {
      pushed_the_crew: "pushed the crew through a deadline",
      kept_status_quo: "kept things as they were for the crew",
      gave_crew_time_off: "sent a burnt-out engineer home",
      offered_profit_share: "offered the crew a profit-share"
    },
    stages: [
      {
        stageNumber: 1,
        title: "A Rival\u2019s Business Card",
        context: "A rival studio has been sniffing around your crew with better hours and a signing bonus. How your staff answers depends on how you have treated them so far.",
        options: [
          {
            id: "exodus_counter_offer",
            label: "Counter-offer before they decide",
            flavorText: "A raise, a title, and a proper thank-you.",
            storyFlag: "countered_poach_offer",
            consequences: { moneyDelta: -700, repDelta: 7, narrativeOutcome: "They stay, and they tell everyone why." }
          },
          {
            id: "exodus_let_them_choose",
            label: "Let them choose for themselves",
            flavorText: "You trust the room you built.",
            storyFlag: "trusted_crew_choice",
            consequences: { moneyDelta: 0, repDelta: 4, narrativeOutcome: "Some stay. One leaves on good terms and promises to send work your way." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Morning After",
        context: "The dust settles. The studio feels different, in a way only the people who work here can explain.",
        options: [
          {
            id: "exodus_team_dinner",
            label: "Close the studio for a team dinner",
            flavorText: "A night off, on the house.",
            storyFlag: "held_team_dinner",
            consequences: { moneyDelta: -250, repDelta: 8, narrativeOutcome: "The best ideas for next month\u2019s sessions come from that dinner table." }
          },
          {
            id: "exodus_back_to_work",
            label: "Get straight back to work",
            flavorText: "Bookings do not wait.",
            storyFlag: "skipped_team_dinner",
            consequences: { moneyDelta: 400, repDelta: 0, narrativeOutcome: "The diary stays full. The mood stays careful." }
          }
        ]
      },
      {
        stageNumber: 3,
        title: "The Reunion Dinner",
        context: "A former crew member turns up, now running a studio of their own, and asks whether the two rooms could share a project.",
        options: [
          {
            id: "reunion_joint_project",
            label: "Take on the joint project",
            flavorText: "Two rooms, one record.",
            storyFlag: "took_joint_project",
            consequences: { moneyDelta: -400, repDelta: 11, narrativeOutcome: "The shared record sounds like both studios and neither, which is the point." }
          },
          {
            id: "reunion_friendly_rivals",
            label: "Stay friendly rivals",
            flavorText: "Better to compete than to merge.",
            storyFlag: "stayed_friendly_rivals",
            consequences: { moneyDelta: 200, repDelta: 4, narrativeOutcome: "Drinks, handshakes, and a fierce rivalry that helps both diaries." }
          }
        ]
      }
    ]
  },
  // ───────────── Technology & craft ─────────────
  {
    id: "subplot_format_war_payoff",
    title: "The Format Comes Due",
    kicker: "TECHNOLOGY // THE BILL ARRIVES",
    eras: ["analog60s", "digital80s"],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("went_stereo", "defended_mono", "went_big_eighties", "kept_it_raw")(state),
    becauseOf: {
      went_stereo: "rewired for stereo",
      defended_mono: "defended the mono mix",
      went_big_eighties: "went big on eighties production",
      kept_it_raw: "kept the sound raw"
    },
    stages: [
      {
        stageNumber: 1,
        title: "A Client Notices Your Signature Sound",
        context: "A producer you have never met says your records sound like nobody else\u2019s \u2014 and wants to know whether that was a choice or an accident.",
        contextByFlag: {
          went_stereo: "A producer you have never met says your stereo records have a signature width \u2014 and asks whether the panning was philosophy or panic.",
          defended_mono: "A producer you have never met says your mono records still hit harder than most stereo charts \u2014 and asks if you will ever \u201Cupgrade\u201D.",
          went_big_eighties: "A producer you have never met says your gated, glossy records are unmistakable \u2014 and wants to know if that sound is for sale.",
          kept_it_raw: "A producer you have never met says your raw takes sound like a live room with the safety rails off \u2014 and asks if you will polish anything."
        },
        options: [
          {
            id: "format_own_it",
            label: "Own it: \u201CThat is the room.\u201D",
            flavorText: "Sell the signature, not the gear list.",
            storyFlag: "owned_signature_sound",
            whenFlag: {
              defended_mono: {
                label: "Own it: \u201COne speaker, one truth.\u201D",
                flavorText: "Sell the mono punch as the house philosophy."
              },
              went_big_eighties: {
                label: "Own it: \u201CThat is the spectacle.\u201D",
                flavorText: "Sell the gloss as intentional theatre."
              },
              kept_it_raw: {
                label: "Own it: \u201CWe leave the edges on.\u201D",
                flavorText: "Sell the grit as the point."
              }
            },
            consequences: { moneyDelta: 0, repDelta: 10, narrativeOutcome: "A reputation for a sound is worth more than a reputation for a price." }
          },
          {
            id: "format_offer_both",
            label: "Offer both the vintage and the modern mix",
            flavorText: "Let the client pick their poison.",
            storyFlag: "offered_both_mixes",
            consequences: { moneyDelta: 450, repDelta: 3, narrativeOutcome: "Double the mixing work, and double the invoice." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Retrospective",
        context: "A magazine wants to write about the studio\u2019s approach. How you answer will be quoted for years.",
        options: [
          {
            id: "format_honest_interview",
            label: "Give them the honest, messy version",
            flavorText: "Mistakes included.",
            storyFlag: "honest_retrospective",
            consequences: { moneyDelta: 0, repDelta: 12, narrativeOutcome: "Readers trust the studio that admits what it got wrong." }
          },
          {
            id: "format_polished_interview",
            label: "Give them the polished legend",
            flavorText: "Every studio needs a good origin story.",
            storyFlag: "polished_retrospective",
            consequences: { moneyDelta: 350, repDelta: 5, narrativeOutcome: "The origin story sells itself, and so do you." }
          }
        ]
      }
    ]
  },
  // ───────────── Money & legal ─────────────
  {
    id: "subplot_sample_aftershock",
    title: "The Sample Comes Back",
    kicker: "LEGAL // THE PAPER TRAIL",
    eras: ["digital80s", "internet2000s"],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("settled_sample_claim", "fought_sample_claim", "replayed_the_sample", "weaponised_the_lawsuit")(state),
    becauseOf: {
      settled_sample_claim: "settled a sample claim",
      fought_sample_claim: "fought a sample claim",
      replayed_the_sample: "replayed the sample",
      weaponised_the_lawsuit: "weaponised a lawsuit"
    },
    stages: [
      {
        stageNumber: 1,
        title: "A Letter With Your Name On It",
        context: "Clearing house paperwork lands on your desk. Depending on how you handled the last claim, the studio is either a model citizen, a known quantity, or a cautionary tale.",
        options: [
          {
            id: "aftershock_clearance_desk",
            label: "Set up an in-house clearance desk",
            flavorText: "Turn a legal headache into a service.",
            storyFlag: "built_clearance_desk",
            consequences: { moneyDelta: -500, repDelta: 8, narrativeOutcome: "Labels start routing their sample-heavy records to you." }
          },
          {
            id: "aftershock_hire_lawyer",
            label: "Keep a lawyer on retainer and move on",
            flavorText: "Insurance, basically.",
            storyFlag: "retained_lawyer",
            consequences: { moneyDelta: -150, repDelta: 3, narrativeOutcome: "Quiet peace of mind, at a small monthly price." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "A Clean Room",
        context: "An artist asks whether your studio can guarantee a record is legally clean before it ships.",
        options: [
          {
            id: "aftershock_guarantee",
            label: "Put the guarantee in writing",
            flavorText: "Stake the studio\u2019s name on it.",
            storyFlag: "guaranteed_clean_master",
            consequences: { moneyDelta: 300, repDelta: 11, narrativeOutcome: "Your studio becomes the safe pair of hands for risky records." }
          },
          {
            id: "aftershock_no_promises",
            label: "Refuse to promise anything",
            flavorText: "You make records, not legal guarantees.",
            storyFlag: "refused_guarantee",
            consequences: { moneyDelta: 0, repDelta: 2, narrativeOutcome: "The artist shrugs and finds someone bolder." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_leak_dividend",
    title: "The Leak Has a Legacy",
    kicker: "INDUSTRY // GIVEN AWAY, PAID BACK",
    eras: ["internet2000s", "streaming2020s"],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("embraced_the_leak", "chased_the_leak", "locked_down_studio")(state),
    becauseOf: {
      embraced_the_leak: "embraced the leak",
      chased_the_leak: "chased the leak",
      locked_down_studio: "locked down the studio"
    },
    stages: [
      {
        stageNumber: 1,
        title: "The Fans Kept the File",
        context: "Years on, an old leaked session is still circulating. Fans have built a forum around it, and some of them want to finance an \u201Cofficial\u201D deluxe edition.",
        options: [
          {
            id: "leak_fan_edition",
            label: "Co-release a fan-funded deluxe edition",
            flavorText: "Let the people who kept it alive pay for it.",
            storyFlag: "released_fan_edition",
            consequences: { moneyDelta: 600, repDelta: 8, narrativeOutcome: "The pre-orders cover the pressing in a weekend." }
          },
          {
            id: "leak_take_down",
            label: "Issue a polite take-down",
            flavorText: "Some things stay in the vault.",
            storyFlag: "took_down_old_leak",
            consequences: { moneyDelta: 0, repDelta: -1, narrativeOutcome: "The forum grumbles, then quietly moves on." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Reunion Request",
        context: "The band from the leaked session wants a reunion recording \u2014 provided the studio is willing to make it a proper event.",
        options: [
          {
            id: "leak_livestream_reunion",
            label: "Livestream the reunion session",
            flavorText: "Open the doors and the cameras.",
            storyFlag: "livestreamed_reunion",
            consequences: { moneyDelta: -300, repDelta: 13, narrativeOutcome: "Half a million people watch a band remember why they started." }
          },
          {
            id: "leak_private_reunion",
            label: "Keep it private and tape-only",
            flavorText: "Some moments belong to the room.",
            storyFlag: "private_reunion",
            consequences: { moneyDelta: 200, repDelta: 6, narrativeOutcome: "The tapes become the most talked-about record nobody has heard." }
          }
        ]
      }
    ]
  },
  // ───────────── Integrity & industry ─────────────
  {
    id: "subplot_clean_record",
    title: "The Clean Record",
    kicker: "REPUTATION // WHAT YOU REFUSED",
    eras: ["internet2000s", "streaming2020s"],
    minDay: 36,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("declined_payola", "refused_voice_clone", "published_voice_policy", "published_case_study")(state),
    becauseOf: {
      declined_payola: "declined payola",
      refused_voice_clone: "refused a voice clone",
      published_voice_policy: "published a voice policy",
      published_case_study: "published a case study"
    },
    stages: [
      {
        stageNumber: 1,
        title: "The Trade Body Calls",
        context: "An independent-studio trade body noticed that you turned down shortcuts others took. They want you on a panel, and on the record.",
        options: [
          {
            id: "clean_join_panel",
            label: "Join the panel and name names\u2026 carefully",
            flavorText: "Stand for something in public.",
            storyFlag: "joined_ethics_panel",
            consequences: { moneyDelta: -150, repDelta: 11, narrativeOutcome: "The panel goes viral in all the right circles." }
          },
          {
            id: "clean_decline_panel",
            label: "Decline and let the work speak",
            flavorText: "Less talking, more tape.",
            storyFlag: "declined_ethics_panel",
            consequences: { moneyDelta: 250, repDelta: 4, narrativeOutcome: "More hours in the studio, fewer in meetings." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Temptation, Reprised",
        context: "The shortcut you turned down is offered again \u2014 bigger this time, and with a name attached that is hard to refuse.",
        options: [
          {
            id: "clean_hold_the_line",
            label: "Hold the line",
            flavorText: "You already know what kind of studio this is.",
            storyFlag: "held_the_line",
            consequences: { moneyDelta: 0, repDelta: 14, narrativeOutcome: "Word gets around: this studio cannot be bought." }
          },
          {
            id: "clean_take_the_deal",
            label: "Take the deal, this once",
            flavorText: "Nobody has to know.",
            storyFlag: "took_the_second_offer",
            consequences: { moneyDelta: 1800, repDelta: -6, narrativeOutcome: "The money is real. So is the crack in the story you used to tell." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_compromise_tab",
    title: "The Favours Come Due",
    kicker: "INDUSTRY // NOTHING IS FREE",
    minDay: 36,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("major_label_syndicate", "ghost_producer_contract", "partnered_with_bootlegger", "paid_the_curator", "doubled_down_payola", "made_voice_clone")(
      state
    ),
    becauseOf: {
      major_label_syndicate: "joined a major-label syndicate",
      ghost_producer_contract: "signed a ghost-producer contract",
      partnered_with_bootlegger: "partnered with a bootlegger",
      paid_the_curator: "paid a playlist curator",
      doubled_down_payola: "doubled down on payola",
      made_voice_clone: "made a voice clone"
    },
    stages: [
      {
        stageNumber: 1,
        title: "A Friendly Reminder",
        context: "Someone you did a deal with has a favour to call in: nothing illegal, just awkward. A credit that is not yours to give, a quiet word in the right ear.",
        options: [
          {
            id: "tab_pay_it",
            label: "Pay the favour in full",
            flavorText: "Clear the debt and move on.",
            storyFlag: "paid_the_favour",
            consequences: { moneyDelta: -800, repDelta: 2, narrativeOutcome: "The slate is clean. Your bank account is not." }
          },
          {
            id: "tab_renegotiate",
            label: "Renegotiate on your own terms",
            flavorText: "You are not the same studio you were.",
            storyFlag: "renegotiated_favour",
            consequences: { moneyDelta: -200, repDelta: 5, narrativeOutcome: "A tense meeting, a handshake, and a smaller bill." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Coming Clean",
        context: "A journalist has been asking questions about the old deal. You can get ahead of the story, or hope it stays buried.",
        options: [
          {
            id: "tab_confess",
            label: "Get ahead of the story and own it",
            flavorText: "A mistake confessed is half forgiven.",
            storyFlag: "confessed_old_deal",
            consequences: { moneyDelta: -100, repDelta: 9, narrativeOutcome: "The apology lands. The studio is trusted a little more than before." }
          },
          {
            id: "tab_stonewall",
            label: "Say nothing and hope it fades",
            flavorText: "News cycles are short.",
            storyFlag: "stonewalled_journalist",
            consequences: { moneyDelta: 300, repDelta: -5, narrativeOutcome: "It fades \u2014 but not entirely, and not for everybody." }
          }
        ]
      },
      {
        stageNumber: 3,
        title: "The Audit",
        context: "An old deal has finally been dragged into the light by a tidy accountant. You can pay the bill openly or find a way around it.",
        options: [
          {
            id: "audit_pay_openly",
            label: "Pay it openly and publish the accounts",
            flavorText: "Let the whole story be told.",
            storyFlag: "paid_the_audit_openly",
            consequences: { moneyDelta: -700, repDelta: 10, narrativeOutcome: "The accounts are published. Nobody finds anything new, and everybody notices the gesture." }
          },
          {
            id: "audit_find_loophole",
            label: "Find a clever loophole",
            flavorText: "Lawyers exist for a reason.",
            storyFlag: "used_audit_loophole",
            consequences: { moneyDelta: 400, repDelta: -6, narrativeOutcome: "The bill shrinks. So does the trust of anyone who reads the footnotes." }
          }
        ]
      }
    ]
  },
  // ───────────── Legacy ─────────────
  {
    id: "subplot_hero_legacy",
    title: "The Star Looks Back",
    kicker: "LEGACY // FULL CIRCLE",
    minDay: 38,
    daysBetweenStages: 6,
    triggerCondition: (state) => hasFlag("gave_hero_secret_session", "took_hero_shoutout", "hung_hero_plaque", "charged_hero_full_rate")(state) && state.reputation >= 45,
    becauseOf: {
      gave_hero_secret_session: "kept the star\u2019s secret session",
      took_hero_shoutout: "took the star\u2019s shout-out",
      hung_hero_plaque: "hung the star\u2019s plaque",
      charged_hero_full_rate: "charged the star full rate"
    },
    stages: [
      {
        stageNumber: 1,
        title: "The Documentary Crew",
        context: "A documentary about the star\u2019s early days wants to film in your control room. What they find there depends on how the two of you left things.",
        options: [
          {
            id: "legacy_open_doors",
            label: "Open the doors and the archives",
            flavorText: "Every demo tape, every scribbled track sheet.",
            storyFlag: "opened_archives",
            consequences: { moneyDelta: -200, repDelta: 12, narrativeOutcome: "Your control room becomes a location in somebody else\u2019s legend." }
          },
          {
            id: "legacy_licence_footage",
            label: "Licence the footage for a fee",
            flavorText: "History has a price.",
            storyFlag: "licensed_footage",
            consequences: { moneyDelta: 900, repDelta: 3, narrativeOutcome: "The cheque clears; the film gets made without your fingerprints." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Premiere",
        context: "There is a seat with your name on it in the front row \u2014 and a question afterwards from a room full of cameras.",
        options: [
          {
            id: "legacy_credit_crew",
            label: "Credit the whole crew by name",
            flavorText: "Nobody makes a record alone.",
            storyFlag: "credited_the_crew",
            consequences: { moneyDelta: 0, repDelta: 13, narrativeOutcome: "Your crew watch the credits roll with new pride." }
          },
          {
            id: "legacy_take_the_credit",
            label: "Take the spotlight yourself",
            flavorText: "You earned this moment.",
            storyFlag: "took_the_spotlight",
            consequences: { moneyDelta: 400, repDelta: 7, narrativeOutcome: "Bigger bookings, and a few whispers in the control room." }
          }
        ]
      },
      {
        stageNumber: 3,
        title: "The Wall of Plaques",
        context: "Years later the star comes back one last time and offers the studio a quiet honour: a permanent place in their official story.",
        options: [
          {
            id: "legacy_accept_place",
            label: "Accept a place in their official story",
            flavorText: "Become part of the legend.",
            storyFlag: "accepted_legacy_place",
            consequences: { moneyDelta: 0, repDelta: 12, narrativeOutcome: "The studio appears in the star\u2019s biography, in a paragraph you were allowed to edit." }
          },
          {
            id: "legacy_decline_place",
            label: "Decline and let the work speak",
            flavorText: "The records are the credit.",
            storyFlag: "declined_legacy_place",
            consequences: { moneyDelta: 300, repDelta: 6, narrativeOutcome: "You decline gracefully. The star sends a bottle and does not argue." }
          }
        ]
      }
    ]
  },
  // ───────────── Campaign titles ─────────────
  {
    id: "subplot_title_reputation",
    title: "The Title Gets Noticed",
    kicker: "CAMPAIGN // A NAME THAT TRAVELS",
    minDay: 30,
    daysBetweenStages: 5,
    triggerCondition: hasFlag("Studio Trailblazer", "Tone Connoisseur", "Commercial Machine"),
    becauseOf: {
      "Studio Trailblazer": "earned the title Studio Trailblazer",
      "Tone Connoisseur": "earned the title Tone Connoisseur",
      "Commercial Machine": "earned the title Commercial Machine"
    },
    stages: [
      {
        stageNumber: 1,
        title: "The Title on the Door",
        context: "A trade paper has picked up the title your studio earned on the campaign trail and wants a profile. The angle they choose will follow you.",
        options: [
          {
            id: "title_lean_in",
            label: "Lean into the title for the profile",
            flavorText: "Let the label do some of the talking.",
            storyFlag: "leaned_into_title",
            consequences: { moneyDelta: 0, repDelta: 9, narrativeOutcome: "The profile runs with your name and your title above it." }
          },
          {
            id: "title_play_down",
            label: "Play it down and talk about the people instead",
            flavorText: "Titles fade. Crews last.",
            storyFlag: "played_down_title",
            consequences: { moneyDelta: 0, repDelta: 6, narrativeOutcome: "The piece is warmer than expected, and your crew are mentioned by name." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Living Up to It",
        context: "A big client books the studio because of the title. They expect the title to show up in the room, not just in print.",
        options: [
          {
            id: "title_overdeliver",
            label: "Clear the diary and over-deliver",
            flavorText: "Earn it again, this time in front of a client.",
            storyFlag: "lived_up_to_title",
            consequences: { moneyDelta: -300, repDelta: 12, narrativeOutcome: "The client leaves a testimonial that quotes the title back at you." }
          },
          {
            id: "title_standard_job",
            label: "Deliver a solid, standard job",
            flavorText: "A good record is a good record.",
            storyFlag: "coasted_on_title",
            consequences: { moneyDelta: 500, repDelta: 2, narrativeOutcome: "Paid, pleased, and quietly unimpressed." }
          }
        ]
      }
    ]
  },
  // ───────────── Creed & campaign branch callbacks ─────────────
  {
    id: "subplot_creed_tested",
    title: "The Creed Gets Tested",
    kicker: "CREED // A FAMILIAR VISITOR",
    minDay: 22,
    daysBetweenStages: 4,
    triggerCondition: (state) => hasFlag("creed_protect_the_take", "creed_master_the_moment")(state) && state.reputation >= 20,
    becauseOf: {
      creed_protect_the_take: "swore to protect the honest take",
      creed_master_the_moment: "swore to master every limitation"
    },
    stages: [
      {
        stageNumber: 1,
        title: "Silas Leaves Another Reel",
        context: "Silas Vance is back with a second hand-labelled reel and a question: will the creed you set still hold when a label offers to rewrite the arrangement overnight?",
        contextByFlag: {
          creed_protect_the_take: "Silas Vance leaves a reel marked SAFE PLACE and asks whether the red light is still a sanctuary when a label wants twenty punch-ins before lunch.",
          creed_master_the_moment: "Silas Vance leaves a reel marked LIMITATION IS ARRANGEMENT and asks whether you still turn constraints into features when the budget forbids another take."
        },
        options: [
          {
            id: "creed_hold",
            label: "Hold the creed in front of the client",
            flavorText: "Say it out loud where the band can hear.",
            storyFlag: "held_the_creed",
            whenFlag: {
              creed_protect_the_take: {
                label: "Protect the take \u2014 refuse the rewrite rush",
                flavorText: "One honest performance beats twenty nervous fixes.",
                narrativeOutcome: "The band exhales. Silas almost smiles."
              },
              creed_master_the_moment: {
                label: "Turn the limitation into the arrangement",
                flavorText: "Make the constraint the hook.",
                narrativeOutcome: "The take becomes stranger and better. Silas nods once."
              }
            },
            consequences: { moneyDelta: -150, repDelta: 10, narrativeOutcome: "The creed holds. Word travels." }
          },
          {
            id: "creed_bend",
            label: "Bend for the booking",
            flavorText: "Principles are expensive this week.",
            storyFlag: "bent_the_creed",
            consequences: { moneyDelta: 700, repDelta: -3, narrativeOutcome: "The session ships. The creed feels a little thinner." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Band Remembers",
        context: "Months later, the same band is choosing rooms for a follow-up. They remember how you answered Silas.",
        contextByFlag: {
          held_the_creed: "The band asks to book you again \u2014 specifically because of what you said when Silas was in the room.",
          bent_the_creed: "The band books you again, but they bring their own producer \u201Cjust in case the creed flexes\u201D."
        },
        options: [
          {
            id: "creed_double_down",
            label: "Write the creed on the studio door",
            flavorText: "Make it public, make it stick.",
            storyFlag: "published_studio_creed",
            consequences: { moneyDelta: 0, repDelta: 11, narrativeOutcome: "Artists photograph the door. Interns recite it." }
          },
          {
            id: "creed_quiet",
            label: "Keep it as a private rule",
            flavorText: "Actions, not posters.",
            storyFlag: "kept_creed_private",
            consequences: { moneyDelta: 250, repDelta: 4, narrativeOutcome: "No plaque, no fuss \u2014 just a reputation that sticks anyway." }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_heritage_dividend",
    title: "The Heritage Dividend",
    kicker: "CAMPAIGN // PATH REMEMBERED",
    eras: ["analog60s", "digital80s"],
    minDay: 36,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag("chose_acoustic_heritage", "chose_commercial_scale")(state) && state.reputation >= 30,
    becauseOf: {
      chose_acoustic_heritage: "chose the acoustic heritage path",
      chose_commercial_scale: "chose the commercial scale path"
    },
    stages: [
      {
        stageNumber: 1,
        title: "A Festival Asks What You Are",
        context: "A festival programmer wants to bill your studio as either a craft temple or a hit factory. Your Act I choice is about to become public language.",
        contextByFlag: {
          chose_acoustic_heritage: "A festival wants to bill you as a craft temple. They have heard you refused the commercial fork after Act I.",
          chose_commercial_scale: "A festival wants to bill you as a hit factory. They have heard you scaled the diary after Act I."
        },
        options: [
          {
            id: "heritage_accept_label",
            label: "Accept the billing and lean into it",
            flavorText: "Let the path name the room.",
            storyFlag: "accepted_path_billing",
            whenFlag: {
              chose_acoustic_heritage: {
                label: "Accept \u201Ccraft temple\u201D billing",
                flavorText: "Hang the heritage flag where the queue can see it."
              },
              chose_commercial_scale: {
                label: "Accept \u201Chit factory\u201D billing",
                flavorText: "Own the throughput reputation."
              }
            },
            consequences: { moneyDelta: 400, repDelta: 6, narrativeOutcome: "The festival programme prints your path in bold." }
          },
          {
            id: "heritage_refuse_box",
            label: "Refuse the box: \u201CWe are a studio, not a slogan\u201D",
            flavorText: "Keep the option to surprise people.",
            storyFlag: "refused_path_billing",
            consequences: { moneyDelta: 0, repDelta: 8, narrativeOutcome: "They bill you simply as the room that shows up. Artists notice." }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Follow-Up Booking",
        context: "After the festival, a band books you specifically because of how you were billed \u2014 or because you refused the billing.",
        options: [
          {
            id: "heritage_deliver_promise",
            label: "Deliver exactly what the story promised",
            flavorText: "Consistency is a kind of honesty.",
            storyFlag: "delivered_path_promise",
            consequences: { moneyDelta: -200, repDelta: 10, narrativeOutcome: "The band leaves saying the room matched the rumour." }
          },
          {
            id: "heritage_surprise",
            label: "Surprise them with the other side of the craft",
            flavorText: "Show the path they did not expect.",
            storyFlag: "surprised_with_other_path",
            consequences: { moneyDelta: 300, repDelta: 5, narrativeOutcome: "A few fans are confused. The smart ones book return sessions." }
          }
        ]
      }
    ]
  }
];

// src/narrative/industrySubplots.ts
var beat = (n2, title, context, options) => ({
  stageNumber: n2,
  title,
  context,
  options: options.map(([id, label, flavorText, storyFlag, moneyDelta, repDelta, narrativeOutcome]) => ({
    id,
    label,
    flavorText,
    storyFlag,
    consequences: { moneyDelta, repDelta, narrativeOutcome }
  }))
});
var sub = (s) => {
  const { s1, s2, ...rest } = s;
  return { ...rest, stages: [beat(1, ...s1), beat(2, ...s2)] };
};
var INDUSTRY_SUBPLOTS = [
  // ───────────── 1960s ─────────────
  sub({
    id: "subplot_dj_envelope",
    title: "The Disc Jockey\u2019s Envelope",
    kicker: "RADIO // A FRIENDLY ENVELOPE",
    eras: ["analog60s"],
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 12,
    s1: ["A Favour for the Airwaves", "A local disc jockey hints that a record plays more often when the studio\u2019s thank-you comes in a plain envelope. Everybody does it. Nobody says so.", [
      ["dj_pay", "Slip him the envelope", "It is only a few dollars and a great deal of airtime.", "paid_the_dj", -400, 9, "The record spins all week and climbs the regional chart. Somebody writes your name down."],
      ["dj_refuse", "Politely decline", "Let the record make its own way.", "refused_the_dj", 0, 5, "The record dies quietly at number 40. The engineers hear about the refusal anyway."]
    ]],
    s2: ["A Congressional Letter", "A hearing into \u201Cpromotional practices\u201D is on the radio. Your name is not on any list, but someone has started making one.", [
      ["dj_testify", "Offer to speak to the inquiry", "Tell them how it really works.", "testified_on_payola", -450, 10, "The room goes silent, then applauds. Half the dial stops returning your calls."],
      ["dj_lawyer_up", "Say nothing and hire a lawyer", "Nobody ever won a hearing by talking.", "lawyered_up_payola", -100, 0, "The letter is filed and forgotten. So, slightly, are you."]
    ]]
  }),
  sub({
    id: "subplot_echo_chamber",
    title: "The Echo Chamber",
    kicker: "CRAFT // A WALL OF SOUND",
    eras: ["analog60s"],
    minDay: 24,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1200,
    s1: ["More Reverb, Obviously", "A young producer with an enormous ego and an enormous idea wants every instrument on the same take, through a single basement echo chamber, at a volume the landlord will hear.", [
      ["echo_go_huge", "Let him build the wall", "Twelve guitars, three pianos, one headache.", "built_the_wall", -700, 9, "The take is overwhelming. It is either a masterpiece or a mistake."],
      ["echo_keep_room", "Keep the arrangement clean", "Let the room breathe.", "kept_room_breathing", 0, 4, "The producer storms out. The record sounds like a room, which is the point."]
    ]],
    s2: ["The Test Pressing", "The test pressing arrives. On a small radio, it sounds like a storm in a shoebox.", [
      ["echo_embrace_storm", "Release it exactly as mixed", "Some records are meant to overwhelm.", "released_the_storm", 0, 11, "The record is talked about in the way only strange records are."],
      ["echo_rebalance", "Pull it back for small speakers", "Radio is what pays the rent.", "rebalanced_for_radio", 250, 5, "The compromise plays everywhere, and thrills nobody in particular."]
    ]]
  }),
  sub({
    id: "subplot_open_ended_session",
    title: "The Record With No Singles",
    kicker: "CRAFT // THE STUDIO AS AN INSTRUMENT",
    eras: ["analog60s"],
    minDay: 30,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 20,
    s1: ["\u201CWe\u2019ll Know When It\u2019s Done\u201D", "A four-piece band has been on the road for three years and is sick of recording a song an hour. They want your room for as long as it takes, with no singles, no deadline, and a string quartet they cannot yet afford.", [
      ["open_book_weeks", "Block out six weeks of the diary", "Let them treat the studio like an instrument.", "booked_open_ended_weeks", -800, 10, "Every day brings a new idea. Some of them are even good."],
      ["open_cap_at_two", "Offer two weeks and a firm end date", "Art expands to fill the budget.", "capped_the_open_session", 0, 4, "The band grumbles, then delivers the tightest thing they have ever made."]
    ]],
    s2: ["The Label Wants a Single", "The record is finished and does not contain a hit. The label would like to know what they are supposed to sell.", [
      ["open_defend_album", "Defend it as one piece of work", "Some records only make sense start to finish.", "defended_the_album", -150, 12, "Critics call it a turning point. The label calls it a headache."],
      ["open_cut_single", "Cut a radio edit from the best section", "Give the label its three minutes.", "cut_a_radio_edit", 450, 2, "The edit is a hit. The album version is what people quietly prefer."]
    ]]
  }),
  // ───────────── 1980s ─────────────
  sub({
    id: "subplot_gated_drum",
    title: "The Happy Accident",
    kicker: "CRAFT // A TALKBACK MIC LEFT ON",
    eras: ["digital80s"],
    minDay: 18,
    daysBetweenStages: 4,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ["Someone Left the Talkback On", "A drummer is warming up in a stone corridor while the talkback mic is open. Through the compressor, the drum sounds like a slammed door in a cathedral. Your engineer\u2019s eyebrows have left the building.", [
      ["gate_steal", "Build the whole session around it", "A sound nobody has heard yet.", "built_gated_sound", -300, 8, "The drum sound spreads. Everyone else spends six months working out how."],
      ["gate_shelve", "Note it and keep recording", "One happy accident is not a sound.", "shelved_the_accident", 0, 2, "You record a solid album. Another studio sells the trick to the world."]
    ]],
    s2: ["Everyone Wants That Snare", "Every A&R man in town wants \u201Cthat drum sound\u201D on their next record. A rival claims it was theirs first.", [
      ["gate_tell_story", "Tell the true story in the trades", "Honesty makes a good legend.", "told_gated_story", 0, 9, "The story is repeated at parties for decades."],
      ["gate_license", "Sell sessions by the day", "The trick is billable.", "sold_the_sound", 700, 3, "Your diary fills. Your signature gets thinner."]
    ]]
  }),
  sub({
    id: "subplot_drum_machine_panic",
    title: "The Machine in the Corner",
    kicker: "LABOUR // THE DRUMMERS ARE WORRIED",
    eras: ["digital80s"],
    minDay: 26,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1500,
    s1: ["It Never Misses a Beat", "A salesman delivers a programmable drum computer and a demo reel. Your regular session drummer watches the demonstration in silence, then asks what happens to him.", [
      ["machine_buy", "Buy the machine and keep the drummer", "Use both. Pay both.", "used_both_drum_sources", -900, 6, "The hybrid sound is unmistakable, and the drummer is very smug about it."],
      ["machine_pass", "Pass on the machine", "Some things need a human wobble.", "passed_on_machine", 0, 3, "You are the last analog-drum room in town. Purists pay a premium."]
    ]],
    s2: ["The First Number One", "One of your rivals scores a chart-topper built entirely on the machine. The drummers\u2019 union sends a politely furious telegram.", [
      ["machine_union_talks", "Meet the drummers half way", "A fee for every programmed track.", "paid_drummers_fee", -300, 10, "A precedent nobody expected a studio to set."],
      ["machine_full_steam", "Go fully electronic", "The future does not wait.", "went_fully_electronic", 500, 2, "You are early to a sound the next decade will live inside."]
    ]]
  }),
  sub({
    id: "subplot_global_jukebox",
    title: "The Global Jukebox",
    kicker: "EVENT // EVERYONE ON ONE STAGE",
    eras: ["digital80s"],
    minDay: 32,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 30,
    s1: ["A Charity Record, Fast", "A famous promoter wants every big name in the country on one charity single, recorded in a single night. Yours is the only room available. Egos are assembling in the car park.", [
      ["jukebox_donate_room", "Donate the room and the crew", "The cause is bigger than the invoice.", "donated_the_room", -600, 12, "Forty famous people argue about a chorus for six hours. The record is magic."],
      ["jukebox_charge_cost", "Charge at cost", "A charity can still pay the electricity.", "charged_cost_for_charity", 0, 6, "Nobody complains. Nobody remembers who made the tea."]
    ]],
    s2: ["The Credits Argument", "The record is a worldwide hit. A row breaks out over whose name goes where on the sleeve.", [
      ["jukebox_credit_all", "List the whole crew, tea-maker included", "Everyone in the room gets a line.", "credited_everyone_charity", 0, 11, "The sleeve is seven inches of tiny type, and the crew have it framed."],
      ["jukebox_credit_stars", "Put the famous names up front", "The record is for the stars.", "credited_only_stars", 300, 2, "The record sells. The crew mutter into their tea."]
    ]]
  }),
  // ───────────── 2000s ─────────────
  sub({
    id: "subplot_loudness_war",
    title: "The Loudness War",
    kicker: "CRAFT // TURN IT UP",
    eras: ["internet2000s"],
    minDay: 18,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ["\u201CCan You Make It Louder?\u201D", "A label head holds up a rival\u2019s record and asks why yours sounds quieter. The waveform on your monitor looks like a brick.", [
      ["loud_crush", "Crush it to match", "Loud is the only thing the radio hears.", "crushed_the_master", 300, 4, "The record wins the radio comparison. The dynamic range quietly files a complaint."],
      ["loud_hold", "Hold your ground", "Dynamics are the music.", "held_the_dynamics", 0, 6, "The label sighs. The record sounds alive on good speakers."]
    ]],
    s2: ["The Listener Fatigue Letter", "A reviewer notes that the record is exhausting to hear all the way through, or that it is the best-sounding record of the year. It depends on what you did.", [
      ["loud_remaster_reissue", "Offer a dynamic \u201Creference\u201D edition", "Give listeners the choice.", "released_dynamic_edition", -350, 11, "The dynamic edition becomes the one audiophiles pass around."],
      ["loud_double_down", "Stay the course", "The numbers are the numbers.", "doubled_down_loudness", 250, 0, "The record keeps selling, and nobody writes about it fondly."]
    ]]
  }),
  sub({
    id: "subplot_pitch_correction",
    title: "The Perfect Voice",
    kicker: "TECHNOLOGY // A ROBOT IN THE CHORUS",
    eras: ["internet2000s"],
    minDay: 26,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1500,
    s1: ["Tuned to the Nines", "A plug-in can snap any vocal dead on pitch. Set the speed to zero and it stops sounding like a singer and starts sounding like a synthesiser. A client is asking for exactly that.", [
      ["pitch_effect", "Use it as a deliberate effect", "The robot is the hook.", "used_tuning_as_effect", -250, 6, "The record has a sound nobody is sure they like, which is how hits start."],
      ["pitch_natural", "Use it only invisibly", "Fix the notes, keep the human.", "used_tuning_invisibly", 0, 4, "Nobody notices, which is the point and the problem."]
    ]],
    s2: ["The Live Show", "The track is a hit. Now the singer has to perform it live, on pitch, without the plug-in.", [
      ["pitch_rehearse", "Book extra rehearsals", "Let the singer earn the song.", "rehearsed_the_singer", -300, 10, "The live version is wobbly, human and oddly better."],
      ["pitch_backing_track", "Run the tuned vocal as a backing track", "Audiences mostly want the record.", "used_backing_vocal", 350, 0, "The show is flawless. Somebody posts a video of the mouth not moving."]
    ]]
  }),
  sub({
    id: "subplot_talent_show",
    title: "The Talent Show Winner",
    kicker: "MEDIA // FIFTEEN MILLION VOTES",
    eras: ["internet2000s"],
    minDay: 34,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 25,
    s1: ["The Winner Needs a Record by Friday", "A televised talent contest has a new winner, a contract, and a release date in nine days. The label wants a producer who will say yes to everything.", [
      ["show_yes", "Say yes and deliver on the deadline", "Nine days is plenty if you never sleep.", "rushed_the_winner_record", 800, 2, "The record ships on time and sounds exactly like nine days."],
      ["show_push_back", "Insist on another two weeks", "A rushed debut is a forgotten debut.", "pushed_back_on_winner", -200, 8, "The label huffs, then sees the pre-orders and relents."]
    ]],
    s2: ["After the Confetti", "Six months later the winner is off the charts and back in your control room, asking for a song they wrote themselves.", [
      ["show_back_them", "Back the songwriter", "Give them the room and the time.", "backed_the_songwriter", -400, 12, "The record is raw and real, and the critics who ignored the first one take notice."],
      ["show_steer_safe", "Steer them towards a safe follow-up", "Safe sells.", "steered_to_safe_follow_up", 450, 0, "It sells. It sounds like the first record with the serial numbers filed off."]
    ]]
  }),
  // ───────────── 2020s ─────────────
  sub({
    id: "subplot_lofi_stream",
    title: "The Girl Who Studies Forever",
    kicker: "STREAMING // BEATS TO RELAX TO",
    eras: ["streaming2020s"],
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ["An Endless Stream", "An anonymous channel has been looping a cartoon student at a desk for years. A hundred thousand people are listening at any hour, and the tracks are coming from bedrooms around the world. Someone has asked whether your studio would like to send some.", [
      ["lofi_submit", "Submit a batch of calm instrumentals", "Let the quiet tracks do the work.", "submitted_lofi_tracks", -150, 7, "The streams arrive slowly and never stop."],
      ["lofi_own_label", "Start your own calm-beats channel", "Own the stream, not the slot.", "started_own_lofi_channel", -500, 12, "A small, strange business with no overheads and endless patience."]
    ]],
    s2: ["Nobody Knows Who You Are", "The tracks are everywhere. Nobody connects them to the studio. Some artists are fine with that; some are not.", [
      ["lofi_credit_out", "Put the studio name in every description", "Build a brand in the small print.", "branded_the_lofi_streams", 0, 10, "A small, stubborn audience follows the name back to you."],
      ["lofi_stay_anonymous", "Stay anonymous and collect royalties", "Quiet money is still money.", "stayed_anonymous_lofi", 400, 0, "The royalties arrive, and so does a slightly eerie peace."]
    ]]
  }),
  sub({
    id: "subplot_fifteen_second_hook",
    title: "The Fifteen-Second Hook",
    kicker: "VIRAL // A SONG FROM 1985 IS TRENDING",
    eras: ["streaming2020s"],
    minDay: 28,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 20,
    s1: ["The Old Record Wakes Up", "A short-video trend has resurrected a forgotten album from your back catalogue. Teenagers are dancing to a bridge you cut for time. The original artist has just discovered they are famous again.", [
      ["hook_reissue", "Rush out an official reissue", "Strike while the algorithm is hot.", "rushed_viral_reissue", -450, 8, "The reissue ships before the trend dies. The bridge is finally long enough."],
      ["hook_contact_artist", "Call the artist first and plan it properly", "Nobody should learn about their own hit from a comment section.", "called_artist_first", -700, 10, "Slower, kinder, and the artist is on the record sleeve this time."]
    ]],
    s2: ["The Trend Moves On", "Three weeks later the internet moves on. What is left is an audience, a catalogue and a choice.", [
      ["hook_tour", "Help the artist mount a comeback tour", "The second act might be the real one.", "backed_comeback_tour", -500, 13, "The shows sell out in their hometown and a few places they never expected."],
      ["hook_licence_sync", "License the track to every advertiser that calls", "Milk it while it lasts.", "licensed_viral_track", 900, -2, "The cheques are huge. The track is now in a car advert."]
    ]]
  }),
  sub({
    id: "subplot_vinyl_revival",
    title: "The Pressing Plant Waiting List",
    kicker: "CRAFT // BACK TO WAX",
    eras: ["streaming2020s"],
    minDay: 34,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.money >= 2500,
    s1: ["Vinyl Is Back, and So Is the Queue", "Collectors want wax, and there are only a handful of pressing plants left. The wait is over a year. Somebody suggests the studio cut its own lacquers.", [
      ["wax_buy_lathe", "Buy a used lathe and cut in-house", "Own the whole chain, tape to groove.", "bought_a_lathe", -1400, 9, "The first cut is terrible. The fiftieth is beautiful."],
      ["wax_partner_plant", "Partner with a small plant", "Share the queue, split the margin.", "partnered_with_plant", -300, 5, "Slower, cheaper, and someone else\u2019s problem when it jams."]
    ]],
    s2: ["The Test Pressing", "The first run arrives. Every pop and crackle is exactly where it should not be.", [
      ["wax_redo", "Scrap the run and redo it properly", "A bad record is a public record.", "scrapped_bad_pressing", -600, 10, "The second run is gorgeous. Collectors notice, and talk."],
      ["wax_sell_flawed", "Sell the flawed run as \u201Crare\u201D", "A crackle is character.", "sold_flawed_pressing", 500, -4, "Sold out, and a forum thread about the \u201Cmistake\u201D begins immediately."]
    ]]
  })
];

// src/narrative/branchingStorylineEngine.ts
var deriveStorylineRunSeed = (ctx) => {
  return hashSeed(`${ctx.saveSeed}:${ctx.selectedEra}:${ctx.originId}:${ctx.playstyle}`);
};
var RIVAL_NAMES = [
  "Silas Vance",
  "Chad Sterling",
  "Roxy Riot",
  "Dr. Vance Thorne",
  "Felix Belmont",
  "Victoria Chase"
];
var RIVAL_STUDIOS2 = [
  "Black Wax Vault",
  "Apex Velocity",
  "The Anarchy Soundboard",
  "Neon Synthworks",
  "Velvet Static Collective"
];
var GEAR_MOTIFS = [
  "discrete analog desk",
  "custom tube preamp",
  "vintage 2-inch tape reel",
  "analog plate reverb",
  "mastering limiter"
];
var VENUES = [
  "The Marquee Cellar",
  "Warehouse 9",
  "The Electric Ballroom",
  "The Gold Coast Pavilion"
];
var renderProceduralTemplate = (template, seed) => {
  const rng = createSeededRandom(seed);
  return template.replace(/\{rivalName\}/g, () => pickWithRandom(rng, RIVAL_NAMES)).replace(/\{rivalStudio\}/g, () => pickWithRandom(rng, RIVAL_STUDIOS2)).replace(/\{gearMotif\}/g, () => pickWithRandom(rng, GEAR_MOTIFS)).replace(/\{legendaryVenue\}/g, () => pickWithRandom(rng, VENUES));
};
var ACT1_MIN_QUALITY = 60;
var normalizeGenreKey = (genre) => genre.toLowerCase().replace(/[^a-z0-9]/g, "");
var getAct1GenreFocus = (originId, eraId) => {
  const gameEra = toGameEraId(eraId);
  const era = ERA_DEFINITIONS.find((e) => e.id === gameEra) ?? ERA_DEFINITIONS[0];
  const bookable = /* @__PURE__ */ new Map();
  for (const { template } of getEraGigPool(gameEra, "starter", era.availableGenres)) {
    bookable.set(normalizeGenreKey(template.genre), template.genre);
  }
  const signature = PRODUCER_ORIGINS.find((o2) => o2.id === originId)?.signatureGenres ?? [];
  const focus = [];
  for (const genre of signature) {
    const bookableName = bookable.get(normalizeGenreKey(genre));
    if (bookableName && !focus.includes(bookableName)) focus.push(bookableName);
    if (focus.length >= 4) break;
  }
  for (const genre of era.availableGenres) {
    if (focus.length >= 3) break;
    if (!focus.includes(genre)) focus.push(genre);
  }
  return focus;
};
var rankLabel = (quality) => {
  const { rank } = gradeQuality(quality);
  return rank === "D" || rank === "C" ? `${rank}-rank` : `${rank}-rank or better`;
};
var describeRequirements = (req) => {
  const parts = [];
  if (req.sessionCount && req.genre?.length && req.minQuality) {
    parts.push(
      `Complete ${req.sessionCount} sessions in ${req.genre.join("/")} at Quality ${req.minQuality}+ (${rankLabel(req.minQuality)})`
    );
  } else if (req.minQuality) {
    parts.push(`Land a session at Quality ${req.minQuality}+ (${rankLabel(req.minQuality)})`);
  }
  if (req.unlockedRooms) parts.push(`own ${req.unlockedRooms} studio rooms`);
  if (req.minLevel) parts.push(`reach Producer Level ${req.minLevel}`);
  if (req.minStaff) parts.push(`keep ${req.minStaff} staff on the payroll`);
  if (req.moneyTarget) parts.push(`hold $${req.moneyTarget.toLocaleString()} in cash`);
  if (req.reputationTarget) parts.push(`reach Reputation ${req.reputationTarget}`);
  const [first, ...rest] = parts;
  if (!first) return "Keep recording \u2014 the story is listening.";
  const sentence = rest.length === 0 ? first : `${first}, ${rest.slice(0, -1).join(", ")}${rest.length > 1 ? " and " : ""}${rest[rest.length - 1]}`;
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};
var generateCampaignTree = (ctx) => {
  const { runSeed, originId, playstyle } = ctx;
  const genreFocus = getAct1GenreFocus(originId, ctx.selectedEra);
  const eraId = toGameEraId(ctx.selectedEra);
  const act1Copy = getAct1DilemmaCopy(eraId);
  const act2PuristCopy = getAct2PuristDilemmaCopy(eraId);
  const act2CommercialCopy = getAct2CommercialDilemmaCopy(eraId);
  const rivalFor = (nodeId) => getRivalForNode(nodeId, playstyle);
  const nodeRival = (nodeId) => {
    const rival = rivalFor(nodeId);
    return { rival, lines: getRivalLines(rival.id) };
  };
  const act1Rival = nodeRival("act1_genesis");
  const act1Req = {
    genre: genreFocus,
    minQuality: ACT1_MIN_QUALITY,
    sessionCount: 3
  };
  const act1 = {
    id: "act1_genesis",
    act: 1,
    branchPath: "root",
    title: `Act I: The Sound of ${act1Rival.rival.name}`,
    loreBrief: `${act1Rival.rival.headProducer} \u2014 ${act1Rival.rival.epithet} \u2014 has heard your first sessions and is not impressed. \u201C${act1Rival.rival.catchphrase}\u201D Establish your sonic footprint.`,
    objectiveDescription: describeRequirements(act1Req),
    rivalStudioId: act1Rival.rival.id,
    rivalName: act1Rival.rival.headProducer,
    rivalDialogue: act1Rival.lines.taunt,
    requiredTarget: act1Req,
    completionReward: {
      money: 1800,
      reputation: 15,
      xp: 400,
      titleOrPerk: "Studio Trailblazer"
    },
    branchDilemma: {
      id: "dilemma_act1",
      kicker: act1Copy.kicker,
      context: act1Copy.context,
      options: [
        {
          id: "opt_path_purist",
          label: act1Copy.options.pathA.label,
          flavorText: act1Copy.options.pathA.flavorText,
          targetNodeId: "act2_purist",
          playstyleTag: "purist",
          storyFlag: "chose_acoustic_heritage",
          consequences: act1Copy.options.pathA.consequences
        },
        {
          id: "opt_path_commercial",
          label: act1Copy.options.pathB.label,
          flavorText: act1Copy.options.pathB.flavorText,
          targetNodeId: "act2_commercial",
          playstyleTag: "hit-maker",
          storyFlag: "chose_commercial_scale",
          consequences: act1Copy.options.pathB.consequences
        }
      ]
    }
  };
  const purist = nodeRival("act2_purist");
  const act2PuristReq = { unlockedRooms: 2, minLevel: 4 };
  const act2Purist = {
    id: "act2_purist",
    act: 2,
    branchPath: "act2_purist",
    title: "Act II: The Acoustic Sanctuary",
    loreBrief: renderProceduralTemplate(
      `${purist.rival.headProducer} challenges your acoustic isolation at {legendaryVenue}.`,
      runSeed + 10
    ),
    objectiveDescription: describeRequirements(act2PuristReq),
    rivalStudioId: purist.rival.id,
    rivalName: purist.rival.headProducer,
    rivalDialogue: purist.lines.challenge,
    requiredTarget: act2PuristReq,
    completionReward: {
      money: 3200,
      reputation: 25,
      xp: 750,
      titleOrPerk: "Tone Connoisseur"
    },
    branchDilemma: {
      id: "dilemma_act2_purist",
      kicker: act2PuristCopy.kicker,
      context: act2PuristCopy.context,
      options: [
        {
          id: "opt_purist_legend",
          label: act2PuristCopy.options.pathA.label,
          flavorText: act2PuristCopy.options.pathA.flavorText,
          targetNodeId: "act3_golden_legend",
          playstyleTag: "purist",
          storyFlag: "golden_reel_purity",
          consequences: act2PuristCopy.options.pathA.consequences
        },
        {
          id: "opt_purist_alchemy",
          label: act2PuristCopy.options.pathB.label,
          flavorText: act2PuristCopy.options.pathB.flavorText,
          targetNodeId: "act3_sonic_alchemy",
          playstyleTag: "sound-lab",
          storyFlag: "hybrid_acoustic_patent",
          consequences: act2PuristCopy.options.pathB.consequences
        }
      ]
    }
  };
  const commercial = nodeRival("act2_commercial");
  const act2CommercialReq = { moneyTarget: 12e3, minStaff: 2 };
  const act2Commercial = {
    id: "act2_commercial",
    act: 2,
    branchPath: "act2_commercial",
    title: "Act II: The Billboard Syndicate",
    loreBrief: `${commercial.rival.name} tries to poach your top regular artists. \u201C${commercial.rival.catchphrase}\u201D`,
    objectiveDescription: describeRequirements(act2CommercialReq),
    rivalStudioId: commercial.rival.id,
    rivalName: commercial.rival.headProducer,
    rivalDialogue: commercial.lines.challenge,
    requiredTarget: act2CommercialReq,
    completionReward: {
      money: 4500,
      reputation: 20,
      xp: 800,
      titleOrPerk: "Commercial Machine"
    },
    branchDilemma: {
      id: "dilemma_act2_commercial",
      kicker: act2CommercialCopy.kicker,
      context: act2CommercialCopy.context,
      options: [
        {
          id: "opt_commercial_monopoly",
          label: act2CommercialCopy.options.pathA.label,
          flavorText: act2CommercialCopy.options.pathA.flavorText,
          targetNodeId: "act3_billboard_monopoly",
          playstyleTag: "hit-maker",
          storyFlag: "major_label_syndicate",
          consequences: {
            ...act2CommercialCopy.options.pathA.consequences
          }
        },
        {
          id: "opt_commercial_rebel",
          label: act2CommercialCopy.options.pathB.label,
          flavorText: act2CommercialCopy.options.pathB.flavorText,
          targetNodeId: "act3_rogue_factory",
          playstyleTag: "underground",
          storyFlag: "open_stem_revolution",
          consequences: act2CommercialCopy.options.pathB.consequences
        }
      ]
    }
  };
  const makeAct3Finale = (id, title, perk, targetQual) => {
    const { rival, lines } = nodeRival(id);
    const req = { minQuality: targetQual, reputationTarget: 50 };
    return {
      id,
      act: 3,
      branchPath: id,
      title,
      loreBrief: renderProceduralTemplate(
        `The final showdown with ${rival.headProducer} at {legendaryVenue}. All eyes are on your master.`,
        runSeed + 30
      ),
      objectiveDescription: describeRequirements(req),
      rivalStudioId: rival.id,
      rivalName: rival.headProducer,
      rivalDialogue: lines.showdown,
      requiredTarget: req,
      completionReward: {
        money: 1e4,
        reputation: 60,
        xp: 2500,
        titleOrPerk: perk
      }
    };
  };
  const act3GoldenLegend = makeAct3Finale(
    "act3_golden_legend",
    "Act III: The Golden Reel Legend",
    "Master of the Vacuum Tube",
    90
  );
  const act3SonicAlchemy = makeAct3Finale(
    "act3_sonic_alchemy",
    "Act III: The Sonic Alchemist Finale",
    "Acoustic Architect",
    88
  );
  const act3Billboard = makeAct3Finale(
    "act3_billboard_monopoly",
    "Act III: The Billboard Monopoly",
    "Platinum Cartel Head",
    85
  );
  const act3Rogue = makeAct3Finale(
    "act3_rogue_factory",
    "Act III: The Rogue Hit Factory",
    "Rebel Audio Kingpin",
    86
  );
  return {
    runSeed,
    nodes: [act1, act2Purist, act2Commercial, act3GoldenLegend, act3SonicAlchemy, act3Billboard, act3Rogue]
  };
};
var LEGACY_SUBPLOTS = [
  {
    id: "subplot_vinyl_bootleg",
    title: "The Bootleg Wax Pressing",
    minDay: 8,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 20,
    stages: [
      {
        stageNumber: 1,
        title: "Bootleg Vinyl in Record Stores",
        context: "Uncredited white-label test pressings of your studio sessions are circulating in indie record shops.",
        options: [
          {
            id: "bootleg_seize",
            label: "Issue Cease & Desist: Seize Remaining Copies",
            flavorText: "Protect your clients intellectual property legally.",
            storyFlag: "seized_bootleg_wax",
            consequences: {
              moneyDelta: -200,
              repDelta: 8,
              narrativeOutcome: "Artists thank you for guarding their masters."
            }
          },
          {
            id: "bootleg_embrace",
            label: "Partner with the Pirate Distributor",
            flavorText: "Cut a clandestine deal for a cut of the underground pressing royalties.",
            storyFlag: "partnered_with_bootlegger",
            consequences: {
              moneyDelta: 1500,
              repDelta: -4,
              narrativeOutcome: "A steady stream of cash flows in from grey market wax."
            }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Bootleg Fallout: The Radio Exposure",
        context: "Colleges and pirate radio stations begin playing the vinyl rip on heavy rotation.",
        options: [
          {
            id: "bootleg_broadcast_license",
            label: "Issue Official Master License",
            flavorText: "Turn the pirate momentum into an official remastered vinyl release.",
            storyFlag: "official_remaster_drop",
            consequences: {
              moneyDelta: 800,
              repDelta: 12,
              narrativeOutcome: "The remaster becomes an underground collector staple."
            }
          },
          {
            id: "bootleg_radio_interview",
            label: "Give Mystery Producer Interview",
            flavorText: "Fuel the mythos without revealing full studio financials.",
            storyFlag: "mystery_producer_lore",
            consequences: {
              moneyDelta: 0,
              repDelta: 15,
              narrativeOutcome: "Your studio becomes a legendary word-of-mouth haven."
            }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_ghost_producer",
    title: "The Ghost Producer Ultimatum",
    minDay: 14,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.money <= 6e3,
    stages: [
      {
        stageNumber: 1,
        title: "A Discreet Briefcase on the Console",
        context: "A corporate scout offers $6,000 cash to produce a chart single with zero credits.",
        options: [
          {
            id: "ghost_accept",
            label: "Take the Cash Runway ($6,000)",
            flavorText: "Fund your equipment overhead with secret corporate royalties.",
            storyFlag: "ghost_producer_contract",
            consequences: {
              moneyDelta: 6e3,
              repDelta: -5,
              narrativeOutcome: "Your bank account swells, but your name is erased."
            }
          },
          {
            id: "ghost_decline",
            label: 'Reject the Buyout: "Credits or No Deal"',
            flavorText: "Kick the scout out of the control room.",
            storyFlag: "refused_ghost_contract",
            consequences: {
              moneyDelta: 0,
              repDelta: 10,
              narrativeOutcome: "Your reputation for dignity spreads across local bands."
            }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "The Ghost Credit Leak",
        context: "A sound engineer spots your signature EQ curve on the charting track.",
        options: [
          {
            id: "ghost_confirm_whispers",
            label: "Leak Audio Stems Anonymously",
            flavorText: "Let the forums deduce the real producer behind the hit.",
            storyFlag: "unmasked_ghost_hit",
            consequences: {
              moneyDelta: 500,
              repDelta: 15,
              narrativeOutcome: "Online sleuths verify your work, sparking major buzz."
            }
          },
          {
            id: "ghost_honor_nda",
            label: "Honor the NDA Professionally",
            flavorText: "Major labels appreciate a partner who never breaks silence.",
            storyFlag: "trusted_corporate_partner",
            consequences: {
              moneyDelta: 2e3,
              repDelta: 5,
              narrativeOutcome: "More confidential high-paying work arrives."
            }
          }
        ]
      }
    ]
  },
  {
    id: "subplot_demolition_salvage",
    title: "The Demolition Salvage Bid",
    minDay: 10,
    daysBetweenStages: 3,
    triggerCondition: (state) => (state.studioRooms?.filter((r) => r.unlocked).length ?? 0) >= 1,
    stages: [
      {
        stageNumber: 1,
        title: "Wrecking Crew Next Door",
        context: "A neighbouring vintage studio is being demolished. Salvage rights go to the highest bidder.",
        options: [
          {
            id: "salvage_bid_high",
            label: "Outbid Everyone for the Isolation Booth",
            flavorText: "Spend cash to rescue a legendary vocal booth before the wrecking ball.",
            storyFlag: "salvaged_isolation_booth",
            consequences: {
              moneyDelta: -1800,
              repDelta: 6,
              narrativeOutcome: "Your booth now carries decades of vocal ghosts."
            }
          },
          {
            id: "salvage_pass",
            label: "Pass \u2014 Protect the Operating Budget",
            flavorText: "Let the wreckers take the wood; keep payroll solvent.",
            storyFlag: "passed_salvage_bid",
            consequences: {
              moneyDelta: 0,
              repDelta: 0,
              narrativeOutcome: "Purists mutter, but your books stay clean."
            }
          }
        ]
      },
      {
        stageNumber: 2,
        title: "Salvage Aftermath",
        context: "Either the booth arrives on a flatbed, or scavengers flip leftover gear on the grey market.",
        options: [
          {
            id: "salvage_install",
            label: "Install & Commission the Booth",
            flavorText: "Spend a weekend wiring the rescued room into your floor plan.",
            storyFlag: "commissioned_salvage_booth",
            consequences: {
              moneyDelta: -400,
              repDelta: 10,
              narrativeOutcome: "Session singers book you just to stand in that booth."
            }
          },
          {
            id: "salvage_flip",
            label: "Flip Residual Parts for Cash",
            flavorText: "Sell leftover panels and patchbays to boutique builders.",
            storyFlag: "flipped_salvage_parts",
            consequences: {
              moneyDelta: 900,
              repDelta: 2,
              narrativeOutcome: "A tidy profit and a story for the lobby."
            }
          }
        ]
      }
    ]
  }
];
var EMERGENT_SUBPLOTS = [...LEGACY_SUBPLOTS, ...ERA_SUBPLOTS, ...INDUSTRY_SUBPLOTS, ...CALLBACK_SUBPLOTS];
var resolveStorylineContext = (state) => ({
  saveSeed: state.saveSeed ?? 4242,
  selectedEra: state.selectedEra || "vintage-warmth",
  originId: state.playerData?.originId || "tape-purist",
  playstyle: state.playerData?.playstyle || "purist"
});
var initializeStorylineState = (state) => {
  if (state.storylineState) return state;
  const ctx = resolveStorylineContext(state);
  const runSeed = deriveStorylineRunSeed(ctx);
  const tree = generateCampaignTree({
    runSeed,
    originId: ctx.originId,
    selectedEra: ctx.selectedEra,
    playstyle: ctx.playstyle
  });
  return {
    ...state,
    saveSeed: state.saveSeed ?? ctx.saveSeed,
    storylineState: {
      runSeed,
      activeCampaignNodeId: tree.nodes[0]?.id ?? "act1_genesis",
      campaignCompleted: false,
      branchHistory: [],
      activeSubplots: [],
      resolvedSubplotIds: [],
      storyFlags: {}
    }
  };
};

// src/features/sprites/producerAppearance.ts
var PRODUCER_SKIN_TONES = SKIN_TONES;
var PRODUCER_SHIRTS = ["flannel_shirt", "band_tee", "turtleneck", "leather_jacket", "tracksuit_jacket", "oversized_hoodie", "denim_vest", "vintage_cardigan"];
var PRODUCER_PANTS = ["denim_jeans", "corduroy_trousers", "bell_bottoms", "cargo_pants", "joggers", "ripped_jeans"];
var PRODUCER_SHOES = ["vintage_sneakers", "leather_boots", "creepers", "hi_tops", "loafers", "canvas_skaters"];
var PRODUCER_HAIR_SHAPES = [
  "pompadour",
  "slicked",
  "bob",
  "messy_curly",
  "long_wavy",
  "afro",
  "dreads",
  "topknot",
  "buzzcut",
  "bald"
];
var PRODUCER_HAIR_COLOURS = [
  "jet_black",
  "dark_brown",
  "chestnut",
  "auburn",
  "bleached_blonde",
  "silver_grey",
  "neon_pink",
  "electric_blue"
];
var PRODUCER_CLOTHES_COLOURS = [
  { id: "ruby", label: "Ruby", palette: 0 },
  { id: "amber", label: "Amber", palette: 2 },
  { id: "mustard", label: "Mustard", palette: 9 },
  { id: "forest", label: "Forest", palette: 3 },
  { id: "teal", label: "Teal", palette: 4 },
  { id: "cobalt", label: "Cobalt", palette: 5 },
  { id: "plum", label: "Plum", palette: 6 },
  { id: "oxford", label: "Oxford", palette: 8 }
];
var PRODUCER_ACCESSORIES = [
  "none",
  "headphones",
  "round_glasses",
  "wayfarers",
  "flat_cap",
  "beanie",
  "gold_chain",
  "aviators",
  "horn_rims",
  "visor",
  "bucket_hat",
  "bandana",
  "headband",
  "hoops",
  "choker",
  "cassette_pendant"
];
var PRODUCER_BUILDS = ["slim", "average", "stocky"];
var DEFAULT_PRODUCER_APPEARANCE = {
  seed: 1960,
  skinTone: "tan",
  shirt: "band_tee",
  pants: "denim_jeans",
  shoes: "vintage_sneakers",
  build: "average",
  hair: "pompadour",
  hairColour: "dark_brown",
  clothesColour: "amber",
  accessory: "headphones"
};
var oneOf = (list, value, fallback) => list.includes(value) ? value : fallback;
var sanitizeProducerAppearance = (value) => {
  const v = value && typeof value === "object" ? value : {};
  const d = DEFAULT_PRODUCER_APPEARANCE;
  return {
    seed: typeof v.seed === "number" && Number.isFinite(v.seed) ? Math.trunc(v.seed) : d.seed,
    skinTone: oneOf(PRODUCER_SKIN_TONES, v.skinTone, d.skinTone),
    shirt: oneOf(PRODUCER_SHIRTS, v.shirt, d.shirt),
    pants: oneOf(PRODUCER_PANTS, v.pants, d.pants),
    shoes: oneOf(PRODUCER_SHOES, v.shoes, d.shoes),
    build: oneOf(PRODUCER_BUILDS, v.build, d.build),
    hair: oneOf(PRODUCER_HAIR_SHAPES, v.hair, d.hair),
    hairColour: oneOf(PRODUCER_HAIR_COLOURS, v.hairColour, d.hairColour),
    clothesColour: oneOf(PRODUCER_CLOTHES_COLOURS.map((c) => c.id), v.clothesColour, d.clothesColour),
    accessory: oneOf(PRODUCER_ACCESSORIES, v.accessory, d.accessory)
  };
};

// src/utils/producerCustomization.ts
var DEFAULT_PRODUCER_NAME = "The Architect";
var MAX_NAME = 24;
var isOriginId = (id) => typeof id === "string" && PRODUCER_ORIGINS.some((o2) => o2.id === id);
var cleanName = (name) => (typeof name === "string" ? name.trim().slice(0, MAX_NAME) : "") || DEFAULT_PRODUCER_NAME;
var createProducerCustomization = (input = {}) => {
  const origin = getProducerOrigin(isOriginId(input.originId) ? input.originId : PRODUCER_ORIGINS[0].id);
  const name = cleanName(input.name);
  return {
    name,
    moniker: name,
    backgroundId: origin.id,
    playstyle: origin.primaryPlaystyle,
    visualTheme: origin.preferredTheme,
    signatureMotto: "In Sound We Trust",
    avatarIcon: "\u{1F39B}\uFE0F",
    unlockedThemes: [origin.preferredTheme],
    storyFlags: {},
    appearance: sanitizeProducerAppearance(input.appearance)
  };
};

// src/narrative/originPerks.ts
var isProducerOriginId = (id) => typeof id === "string" && PRODUCER_ORIGINS.some((o2) => o2.id === id);
var startingAttributesFor = (base2, originId) => applyOriginAttributes(base2, originId);

// src/utils/newGameState.ts
var createDefaultGameState = (options) => {
  const originId = isProducerOriginId(options?.originId) ? options.originId : void 0;
  const legacyAppearance = parseNpcVisualIdentity(options?.producer?.appearance);
  const producerName = options?.producerName?.trim().slice(0, 24) || options?.producer?.name?.trim().slice(0, 24) || "The Architect";
  const baseAttributes = { focusMastery: 1, creativeIntuition: 1, technicalAptitude: 1, businessAcumen: 1 };
  return {
    money: options?.startingMoney || 3500,
    influence: 0,
    // Initialize Influence
    creativeCapital: 0,
    // Initialize Creative Capital
    activeMinigame: null,
    // No minigame active by default
    reputation: 10,
    currentDay: 2,
    currentYear: options?.currentYear || 1960,
    // Start in 1960s era
    currentEra: visualEraId(options?.selectedEra || "analog60s"),
    selectedEra: options?.selectedEra || "analog60s",
    eraStartYear: options?.eraStartYear || 1960,
    equipmentMultiplier: options?.equipmentMultiplier || 0.3,
    // Lower prices in 1960s
    producerCustomization: createProducerCustomization({
      name: producerName,
      originId,
      appearance: options?.producerAppearance
    }),
    playerData: {
      name: producerName,
      ...legacyAppearance ? { appearance: { ...legacyAppearance, role: "producer" } } : {},
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 3,
      dailyWorkCapacity: 5,
      reputation: 10,
      // Add reputation to PlayerData
      attributes: originId ? startingAttributesFor(baseAttributes, originId) : baseAttributes,
      // Origin + playstyle feed the campaign seed, rival and perks. Legacy saves leave both unset.
      ...originId ? { originId, playstyle: getProducerOrigin(originId).primaryPlaystyle } : {},
      skills: initializeSkillsPlayer()
      // Initialize player skills
    },
    studioSkills: {
      // This seems to be old/genre-specific skills, distinct from new player skills
      Rock: { name: "Rock", level: 1, xp: 0, xpToNext: 20 },
      Pop: { name: "Pop", level: 1, xp: 0, xpToNext: 20 },
      Electronic: { name: "Electronic", level: 1, xp: 0, xpToNext: 20 },
      Hiphop: { name: "Hip-hop", level: 1, xp: 0, xpToNext: 20 },
      Acoustic: { name: "Acoustic", level: 1, xp: 0, xpToNext: 20 }
    },
    ownedUpgrades: [],
    ownedEquipment: [
      {
        id: "basic_mic",
        name: "Basic USB Mic",
        category: "microphone",
        price: 0,
        description: "Standard starter microphone",
        bonuses: { qualityBonus: 0 },
        icon: "\u{1F3A4}",
        condition: 100
        // Add default condition for starting equipment
      },
      {
        id: "basic_monitors",
        name: "Basic Speakers",
        category: "monitor",
        price: 0,
        description: "Standard studio monitors",
        bonuses: { qualityBonus: 0 },
        icon: "\u{1F50A}",
        condition: 100
        // Add default condition for starting equipment
      }
    ],
    availableProjects: [],
    studioRooms: createDefaultStudioRooms(),
    discoveredSynergies: [],
    studioKnowHow: createInitialKnowHow(),
    studioExpertise: createInitialExpertise(),
    premisesTier: 0,
    cityId: isCityId(options?.cityId) ? options.cityId : DEFAULT_CITY_ID,
    activeProject: null,
    // Keep for backward compatibility
    // Multi-project system
    activeProjects: [],
    // New multi-project array
    maxConcurrentProjects: 1,
    // Derived from the starter Studio A room
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0,
    notifications: [],
    bands: [],
    playerBands: [],
    availableSessionMusicians: [],
    activeOriginalTrack: null,
    chartsData: {
      charts: [],
      contactedArtists: [],
      marketTrends: [],
      discoveredArtists: [],
      lastChartUpdate: 0
    },
    researchedMods: [],
    // Automation system
    automation: {
      enabled: false,
      mode: "off",
      settings: {
        priorityMode: "balanced",
        minStaffPerProject: 1,
        maxStaffPerProject: 3,
        workloadDistribution: "adaptive",
        pauseOnIssues: true,
        notifyOnMilestones: true
      },
      efficiency: {}
    },
    // Animation state tracking
    animations: {
      projects: {},
      staff: {},
      globalEffects: {
        studioActivity: 0,
        projectTransitions: {},
        automationPulse: false,
        lastGlobalUpdate: Date.now()
      }
    },
    financials: {
      // Initialize financials
      income: 0,
      expenses: 0,
      profit: 0,
      reports: []
    },
    dailyTracking: {
      // Daily challenge counters (bead ifx.3)
      day: 2,
      earnedToday: 0,
      minigamesPlayedToday: 0,
      maxComboToday: 0,
      projectsCompletedToday: 0,
      sessionsWorkedToday: 0,
      challengeDoneId: null
    },
    choreState: createInitialChoreState(),
    pendingCrates: []
  };
};
var createNewGameState = (options) => {
  let newGameState = createDefaultGameState(options);
  const currentEra = newGameState.currentEra;
  const cityId = newGameState.cityId;
  newGameState = applyCityEdge(newGameState, isCityId(options?.cityId) ? options.cityId : void 0);
  const initialProjects = generateNewProjects(3, 1, currentEra, [], 1.1, 0, cityId);
  const initialCandidates = generateCandidates({ count: 3, cityId });
  const initialSessionMusicians = generateSessionMusicians(5, cityId);
  newGameState = resolvePlayerLevelUps(newGameState);
  const maxConcurrentProjects = ProgressionSystem.getMaxConcurrentProjects(newGameState);
  newGameState = initializeStorylineState({
    ...newGameState,
    availableProjects: initialProjects,
    availableCandidates: initialCandidates,
    availableSessionMusicians: initialSessionMusicians,
    maxConcurrentProjects,
    saveSeed: newGameState.saveSeed ?? options?.saveSeed ?? Date.now()
  });
  return newGameState;
};

// tests/label-accounts.check.ts
var n = 0;
var ok = (c, m) => {
  if (!c) throw new Error(`FAIL: ${m}`);
  n++;
  console.log(`PASS: ${m}`);
};
var base = { ...createNewGameState(), saveSeed: "lbl", currentDay: 21, currentEra: "streaming2020s", labelInterest: void 0, claimedOffers: [] };
ok(labelOffersFor(base).length === 0, "no interest, no label offers");
ok(labelOffersFor({ ...base, labelInterest: { indie_label_001: 24 } }).length === 0, "just under the indie line sends nothing");
var indie = labelOffersFor({ ...base, labelInterest: { indie_label_001: TIER_UNLOCK.indie } });
ok(indie.length === 1 && indie[0].labelTerms?.tier === "indie", "the indie label sends one package at its line");
ok(labelOffersFor({ ...base, labelInterest: { electronic_label_001: 49 } }).length === 0, "regional needs more interest");
var both = labelOffersFor({ ...base, labelInterest: { indie_label_001: 30, electronic_label_001: 50 } });
ok(both.length === 2 && both.map((p) => p.labelTerms.tier).sort().join() === "indie,regional", "indie and regional accounts both work");
ok(labelOffersFor({ ...base, labelInterest: { hiphop_label_001: 99, major_label_001: 99 } }).length === 0, "national and global are not in this slice");
var o = indie[0];
ok(o.stages.length === 3 && o.clientType === "Record Label", "a package is three sessions from a label");
ok(JSON.stringify(labelOffersFor({ ...base, labelInterest: { indie_label_001: 25 } })) === JSON.stringify(indie), "the same save and week give the same offer");
ok(labelOffersFor({ ...base, currentDay: 28, labelInterest: { indie_label_001: 25 } })[0].id !== o.id, "a new week brings a new offer");
ok(labelOffersFor({ ...base, labelInterest: { indie_label_001: 25 }, claimedOffers: [o.id] }).length === 0, "a booked offer does not return");
ok(o.labelTerms.baseRevisions === 1 && o.durationDaysTotal === o.labelTerms.deadlineDays, "booking length follows the deadline");
var t = o.labelTerms;
var rush = withChoices(o, { ...NO_CHOICES, rush: true });
ok(rush.payoutBase > o.payoutBase && rush.durationDaysTotal === o.durationDaysTotal - RUSH_DAYS, "rush pays more and shortens the deadline");
var rev = withChoices(o, { ...NO_CHOICES, extraRevision: true });
ok(rev.payoutBase < o.payoutBase && rev.labelTerms.revisions === 2, "an extra revision costs fee");
var free = withChoices(o, { ...NO_CHOICES, openFreedom: true });
ok(free.payoutBase < o.payoutBase && free.labelTerms.qualityTarget < t.qualityTarget, "open freedom costs fee and lowers the target");
ok(withChoices(withChoices(o, { rush: true, extraRevision: true, openFreedom: true }), NO_CHOICES).payoutBase === o.payoutBase, "choices always resolve from the base terms");
ok(resolveTerms(t, { rush: true, extraRevision: false, openFreedom: false }).deadlineDays >= 3, "deadline never collapses");
var good = labelOutcome(t, t.deadlineDays, t.qualityTarget + 5, 1e3);
ok(good.money === Math.round(1e3 * ON_TIME_BONUS) && good.interest > 0, "on time and on target earns a bonus and interest");
var late = labelOutcome(t, t.deadlineDays + 2, 90, 1e3);
ok(late.money === -200 && late.interest < 0, "two days late costs 20% and some interest");
ok(labelOutcome(t, t.deadlineDays + 40, 90, 1e3).money === -Math.round(1e3 * LATE_FEE_CAP), "lateness is capped");
var short = labelOutcome(t, 3, t.qualityTarget - 5, 1e3);
ok(short.money === -100 && short.interest === 0, "under target trims the fee but costs no interest");
var absorbed = labelOutcome({ ...t, revisions: 2 }, 3, t.qualityTarget - 5, 1e3);
ok(absorbed.money === 0, "an extra revision round absorbs a small quality miss");
var project = { ...o, bookedDay: 10 };
var st = { ...base, currentDay: 10 + t.deadlineDays + 3, money: 5e3, labelInterest: { indie_label_001: 12 }, notifications: [] };
var after = applyLabelOutcome(st, project, 90, 1e3);
ok(after.money < 5e3 && after.labelInterest.indie_label_001 >= INTEREST_FLOOR, "a late delivery trims money and never drops interest below the floor");
ok(after.notifications.length === 1 && /knocked/.test(after.notifications[0].message), "the outcome is explained");
var onTimeState = { ...st, currentDay: 10 + 3, labelInterest: { indie_label_001: 30 } };
ok(applyLabelOutcome(onTimeState, project, 95, 1e3).labelInterest.indie_label_001 === 35, "a clean delivery raises interest");
ok(applyLabelOutcome(st, { ...o, labelTerms: void 0 }, 90, 1e3) === st, "non-label projects are untouched");
var frozen = JSON.stringify(st);
applyLabelOutcome(st, project, 90, 1e3);
ok(JSON.stringify(st) === frozen, "applying an outcome never mutates state");
console.log(`label-accounts: ${n} checks passed`);
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
