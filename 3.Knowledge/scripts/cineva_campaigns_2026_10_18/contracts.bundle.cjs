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

// 1.Frontend/node_modules/react/cjs/react.production.min.js
var require_react_production_min = __commonJS({
  "1.Frontend/node_modules/react/cjs/react.production.min.js"(exports2) {
    "use strict";
    var l = Symbol.for("react.element");
    var n = Symbol.for("react.portal");
    var p = Symbol.for("react.fragment");
    var q = Symbol.for("react.strict_mode");
    var r = Symbol.for("react.profiler");
    var t = Symbol.for("react.provider");
    var u = Symbol.for("react.context");
    var v = Symbol.for("react.forward_ref");
    var w = Symbol.for("react.suspense");
    var x = Symbol.for("react.memo");
    var y = Symbol.for("react.lazy");
    var z = Symbol.iterator;
    function A(a) {
      if (null === a || "object" !== typeof a) return null;
      a = z && a[z] || a["@@iterator"];
      return "function" === typeof a ? a : null;
    }
    var B = { isMounted: function() {
      return false;
    }, enqueueForceUpdate: function() {
    }, enqueueReplaceState: function() {
    }, enqueueSetState: function() {
    } };
    var C = Object.assign;
    var D = {};
    function E(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    E.prototype.isReactComponent = {};
    E.prototype.setState = function(a, b) {
      if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
      this.updater.enqueueSetState(this, a, b, "setState");
    };
    E.prototype.forceUpdate = function(a) {
      this.updater.enqueueForceUpdate(this, a, "forceUpdate");
    };
    function F() {
    }
    F.prototype = E.prototype;
    function G(a, b, e) {
      this.props = a;
      this.context = b;
      this.refs = D;
      this.updater = e || B;
    }
    var H = G.prototype = new F();
    H.constructor = G;
    C(H, E.prototype);
    H.isPureReactComponent = true;
    var I = Array.isArray;
    var J = Object.prototype.hasOwnProperty;
    var K = { current: null };
    var L = { key: true, ref: true, __self: true, __source: true };
    function M(a, b, e) {
      var d, c = {}, k = null, h = null;
      if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
      var g = arguments.length - 2;
      if (1 === g) c.children = e;
      else if (1 < g) {
        for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
        c.children = f;
      }
      if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
      return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
    }
    function N(a, b) {
      return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
    }
    function O(a) {
      return "object" === typeof a && null !== a && a.$$typeof === l;
    }
    function escape(a) {
      var b = { "=": "=0", ":": "=2" };
      return "$" + a.replace(/[=:]/g, function(a2) {
        return b[a2];
      });
    }
    var P = /\/+/g;
    function Q(a, b) {
      return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
    }
    function R(a, b, e, d, c) {
      var k = typeof a;
      if ("undefined" === k || "boolean" === k) a = null;
      var h = false;
      if (null === a) h = true;
      else switch (k) {
        case "string":
        case "number":
          h = true;
          break;
        case "object":
          switch (a.$$typeof) {
            case l:
            case n:
              h = true;
          }
      }
      if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
        return a2;
      })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
      h = 0;
      d = "" === d ? "." : d + ":";
      if (I(a)) for (var g = 0; g < a.length; g++) {
        k = a[g];
        var f = d + Q(k, g);
        h += R(k, b, e, f, c);
      }
      else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
      else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
      return h;
    }
    function S(a, b, e) {
      if (null == a) return a;
      var d = [], c = 0;
      R(a, d, "", "", function(a2) {
        return b.call(e, a2, c++);
      });
      return d;
    }
    function T(a) {
      if (-1 === a._status) {
        var b = a._result;
        b = b();
        b.then(function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
        }, function(b2) {
          if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
        });
        -1 === a._status && (a._status = 0, a._result = b);
      }
      if (1 === a._status) return a._result.default;
      throw a._result;
    }
    var U = { current: null };
    var V = { transition: null };
    var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
    function X() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    exports2.Children = { map: S, forEach: function(a, b, e) {
      S(a, function() {
        b.apply(this, arguments);
      }, e);
    }, count: function(a) {
      var b = 0;
      S(a, function() {
        b++;
      });
      return b;
    }, toArray: function(a) {
      return S(a, function(a2) {
        return a2;
      }) || [];
    }, only: function(a) {
      if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
      return a;
    } };
    exports2.Component = E;
    exports2.Fragment = p;
    exports2.Profiler = r;
    exports2.PureComponent = G;
    exports2.StrictMode = q;
    exports2.Suspense = w;
    exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
    exports2.act = X;
    exports2.cloneElement = function(a, b, e) {
      if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
      var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
      if (null != b) {
        void 0 !== b.ref && (k = b.ref, h = K.current);
        void 0 !== b.key && (c = "" + b.key);
        if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
        for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
      }
      var f = arguments.length - 2;
      if (1 === f) d.children = e;
      else if (1 < f) {
        g = Array(f);
        for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
        d.children = g;
      }
      return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
    };
    exports2.createContext = function(a) {
      a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
      a.Provider = { $$typeof: t, _context: a };
      return a.Consumer = a;
    };
    exports2.createElement = M;
    exports2.createFactory = function(a) {
      var b = M.bind(null, a);
      b.type = a;
      return b;
    };
    exports2.createRef = function() {
      return { current: null };
    };
    exports2.forwardRef = function(a) {
      return { $$typeof: v, render: a };
    };
    exports2.isValidElement = O;
    exports2.lazy = function(a) {
      return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
    };
    exports2.memo = function(a, b) {
      return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
    };
    exports2.startTransition = function(a) {
      var b = V.transition;
      V.transition = {};
      try {
        a();
      } finally {
        V.transition = b;
      }
    };
    exports2.unstable_act = X;
    exports2.useCallback = function(a, b) {
      return U.current.useCallback(a, b);
    };
    exports2.useContext = function(a) {
      return U.current.useContext(a);
    };
    exports2.useDebugValue = function() {
    };
    exports2.useDeferredValue = function(a) {
      return U.current.useDeferredValue(a);
    };
    exports2.useEffect = function(a, b) {
      return U.current.useEffect(a, b);
    };
    exports2.useId = function() {
      return U.current.useId();
    };
    exports2.useImperativeHandle = function(a, b, e) {
      return U.current.useImperativeHandle(a, b, e);
    };
    exports2.useInsertionEffect = function(a, b) {
      return U.current.useInsertionEffect(a, b);
    };
    exports2.useLayoutEffect = function(a, b) {
      return U.current.useLayoutEffect(a, b);
    };
    exports2.useMemo = function(a, b) {
      return U.current.useMemo(a, b);
    };
    exports2.useReducer = function(a, b, e) {
      return U.current.useReducer(a, b, e);
    };
    exports2.useRef = function(a) {
      return U.current.useRef(a);
    };
    exports2.useState = function(a) {
      return U.current.useState(a);
    };
    exports2.useSyncExternalStore = function(a, b, e) {
      return U.current.useSyncExternalStore(a, b, e);
    };
    exports2.useTransition = function() {
      return U.current.useTransition();
    };
    exports2.version = "18.3.1";
  }
});

// 1.Frontend/node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "1.Frontend/node_modules/react/cjs/react.development.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var ReactVersion = "18.3.1";
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactCurrentDispatcher = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactCurrentBatchConfig = {
          transition: null
        };
        var ReactCurrentActQueue = {
          current: null,
          // Used to reproduce behavior of `batchedUpdates` in legacy mode.
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false
        };
        var ReactCurrentOwner = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactDebugCurrentFrame = {};
        var currentExtraStackFrame = null;
        function setExtraStackFrame(stack) {
          {
            currentExtraStackFrame = stack;
          }
        }
        {
          ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
            {
              currentExtraStackFrame = stack;
            }
          };
          ReactDebugCurrentFrame.getCurrentStack = null;
          ReactDebugCurrentFrame.getStackAddendum = function() {
            var stack = "";
            if (currentExtraStackFrame) {
              stack += currentExtraStackFrame;
            }
            var impl = ReactDebugCurrentFrame.getCurrentStack;
            if (impl) {
              stack += impl() || "";
            }
            return stack;
          };
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var ReactSharedInternals = {
          ReactCurrentDispatcher,
          ReactCurrentBatchConfig,
          ReactCurrentOwner
        };
        {
          ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
          ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
        }
        function warn(format) {
          {
            {
              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }
              printWarning("warn", format, args);
            }
          }
        }
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var didWarnStateUpdateForUnmountedComponent = {};
        function warnNoop(publicInstance, callerName) {
          {
            var _constructor = publicInstance.constructor;
            var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
            var warningKey = componentName + "." + callerName;
            if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
              return;
            }
            error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
            didWarnStateUpdateForUnmountedComponent[warningKey] = true;
          }
        }
        var ReactNoopUpdateQueue = {
          /**
           * Checks whether or not this composite component is mounted.
           * @param {ReactClass} publicInstance The instance we want to test.
           * @return {boolean} True if mounted, false otherwise.
           * @protected
           * @final
           */
          isMounted: function(publicInstance) {
            return false;
          },
          /**
           * Forces an update. This should only be invoked when it is known with
           * certainty that we are **not** in a DOM transaction.
           *
           * You may want to call this when you know that some deeper aspect of the
           * component's state has changed but `setState` was not called.
           *
           * This will not invoke `shouldComponentUpdate`, but it will invoke
           * `componentWillUpdate` and `componentDidUpdate`.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueForceUpdate: function(publicInstance, callback, callerName) {
            warnNoop(publicInstance, "forceUpdate");
          },
          /**
           * Replaces all of the state. Always use this or `setState` to mutate state.
           * You should treat `this.state` as immutable.
           *
           * There is no guarantee that `this.state` will be immediately updated, so
           * accessing `this.state` after calling this method may return the old value.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} completeState Next state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
            warnNoop(publicInstance, "replaceState");
          },
          /**
           * Sets a subset of the state. This only exists because _pendingState is
           * internal. This provides a merging strategy that is not available to deep
           * properties which is confusing. TODO: Expose pendingState or don't use it
           * during the merge.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} partialState Next partial state to be merged with state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} Name of the calling function in the public API.
           * @internal
           */
          enqueueSetState: function(publicInstance, partialState, callback, callerName) {
            warnNoop(publicInstance, "setState");
          }
        };
        var assign = Object.assign;
        var emptyObject = {};
        {
          Object.freeze(emptyObject);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
            throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
          }
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        {
          var deprecatedAPIs = {
            isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
            replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
          };
          var defineDeprecationWarning = function(methodName, info) {
            Object.defineProperty(Component.prototype, methodName, {
              get: function() {
                warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                return void 0;
              }
            });
          };
          for (var fnName in deprecatedAPIs) {
            if (deprecatedAPIs.hasOwnProperty(fnName)) {
              defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
            }
          }
        }
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
        function createRef() {
          var refObject = {
            current: null
          };
          {
            Object.seal(refObject);
          }
          return refObject;
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          var warnAboutAccessingKey = function() {
            {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function defineRefPropWarningGetter(props, displayName) {
          var warnAboutAccessingRef = function() {
            {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, "ref", {
            get: warnAboutAccessingRef,
            configurable: true
          });
        }
        function warnIfStringRefCannotBeAutoConverted(config) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function createElement(type, config, children) {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          var self = null;
          var source = null;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              {
                warnIfStringRefCannotBeAutoConverted(config);
              }
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            self = config.__self === void 0 ? null : config.__self;
            source = config.__source === void 0 ? null : config.__source;
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            {
              if (Object.freeze) {
                Object.freeze(childArray);
              }
            }
            props.children = childArray;
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === void 0) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          {
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
          }
          return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
          return newElement;
        }
        function cloneElement(element, config, children) {
          if (element === null || element === void 0) {
            throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
          }
          var propName;
          var props = assign({}, element.props);
          var key = element.key;
          var ref = element.ref;
          var self = element._self;
          var source = element._source;
          var owner = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner = ReactCurrentOwner.current;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            var defaultProps;
            if (element.type && element.type.defaultProps) {
              defaultProps = element.type.defaultProps;
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === void 0 && defaultProps !== void 0) {
                  props[propName] = defaultProps[propName];
                } else {
                  props[propName] = config[propName];
                }
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
          }
          return ReactElement(element.type, key, ref, self, source, owner, props);
        }
        function isValidElement(object) {
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var SEPARATOR = ".";
        var SUBSEPARATOR = ":";
        function escape(key) {
          var escapeRegex = /[=:]/g;
          var escaperLookup = {
            "=": "=0",
            ":": "=2"
          };
          var escapedString = key.replace(escapeRegex, function(match) {
            return escaperLookup[match];
          });
          return "$" + escapedString;
        }
        var didWarnAboutMaps = false;
        var userProvidedKeyEscapeRegex = /\/+/g;
        function escapeUserProvidedKey(text) {
          return text.replace(userProvidedKeyEscapeRegex, "$&/");
        }
        function getElementKey(element, index) {
          if (typeof element === "object" && element !== null && element.key != null) {
            {
              checkKeyStringCoercion(element.key);
            }
            return escape("" + element.key);
          }
          return index.toString(36);
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if (type === "undefined" || type === "boolean") {
            children = null;
          }
          var invokeCallback = false;
          if (children === null) {
            invokeCallback = true;
          } else {
            switch (type) {
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
            }
          }
          if (invokeCallback) {
            var _child = children;
            var mappedChild = callback(_child);
            var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
            if (isArray(mappedChild)) {
              var escapedChildKey = "";
              if (childKey != null) {
                escapedChildKey = escapeUserProvidedKey(childKey) + "/";
              }
              mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                return c;
              });
            } else if (mappedChild != null) {
              if (isValidElement(mappedChild)) {
                {
                  if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                    checkKeyStringCoercion(mappedChild.key);
                  }
                }
                mappedChild = cloneAndReplaceKey(
                  mappedChild,
                  // Keep both the (mapped) and old keys if they differ, just as
                  // traverseAllChildren used to do for objects as children
                  escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                  (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                    // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                    // eslint-disable-next-line react-internal/safe-string-coercion
                    escapeUserProvidedKey("" + mappedChild.key) + "/"
                  ) : "") + childKey
                );
              }
              array.push(mappedChild);
            }
            return 1;
          }
          var child;
          var nextName;
          var subtreeCount = 0;
          var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              child = children[i];
              nextName = nextNamePrefix + getElementKey(child, i);
              subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var iterableChildren = children;
              {
                if (iteratorFn === iterableChildren.entries) {
                  if (!didWarnAboutMaps) {
                    warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
              var iterator = iteratorFn.call(iterableChildren);
              var step;
              var ii = 0;
              while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getElementKey(child, ii++);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else if (type === "object") {
              var childrenString = String(children);
              throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
            }
          }
          return subtreeCount;
        }
        function mapChildren(children, func, context) {
          if (children == null) {
            return children;
          }
          var result = [];
          var count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function countChildren(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        }
        function forEachChildren(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        }
        function toArray(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        }
        function onlyChild(children) {
          if (!isValidElement(children)) {
            throw new Error("React.Children.only expected to receive a single React element child.");
          }
          return children;
        }
        function createContext2(defaultValue) {
          var context = {
            $$typeof: REACT_CONTEXT_TYPE,
            // As a workaround to support multiple concurrent renderers, we categorize
            // some renderers as primary and others as secondary. We only expect
            // there to be two concurrent renderers at most: React Native (primary) and
            // Fabric (secondary); React DOM (primary) and React ART (secondary).
            // Secondary renderers store their context values on separate fields.
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            // Used to track how many concurrent renderers this context currently
            // supports within in a single renderer. Such as parallel server rendering.
            _threadCount: 0,
            // These are circular
            Provider: null,
            Consumer: null,
            // Add these to use same hidden class in VM as ServerContext
            _defaultValue: null,
            _globalName: null
          };
          context.Provider = {
            $$typeof: REACT_PROVIDER_TYPE,
            _context: context
          };
          var hasWarnedAboutUsingNestedContextConsumers = false;
          var hasWarnedAboutUsingConsumerProvider = false;
          var hasWarnedAboutDisplayNameOnConsumer = false;
          {
            var Consumer = {
              $$typeof: REACT_CONTEXT_TYPE,
              _context: context
            };
            Object.defineProperties(Consumer, {
              Provider: {
                get: function() {
                  if (!hasWarnedAboutUsingConsumerProvider) {
                    hasWarnedAboutUsingConsumerProvider = true;
                    error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                  }
                  return context.Provider;
                },
                set: function(_Provider) {
                  context.Provider = _Provider;
                }
              },
              _currentValue: {
                get: function() {
                  return context._currentValue;
                },
                set: function(_currentValue) {
                  context._currentValue = _currentValue;
                }
              },
              _currentValue2: {
                get: function() {
                  return context._currentValue2;
                },
                set: function(_currentValue2) {
                  context._currentValue2 = _currentValue2;
                }
              },
              _threadCount: {
                get: function() {
                  return context._threadCount;
                },
                set: function(_threadCount) {
                  context._threadCount = _threadCount;
                }
              },
              Consumer: {
                get: function() {
                  if (!hasWarnedAboutUsingNestedContextConsumers) {
                    hasWarnedAboutUsingNestedContextConsumers = true;
                    error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                  }
                  return context.Consumer;
                }
              },
              displayName: {
                get: function() {
                  return context.displayName;
                },
                set: function(displayName) {
                  if (!hasWarnedAboutDisplayNameOnConsumer) {
                    warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                    hasWarnedAboutDisplayNameOnConsumer = true;
                  }
                }
              }
            });
            context.Consumer = Consumer;
          }
          {
            context._currentRenderer = null;
            context._currentRenderer2 = null;
          }
          return context;
        }
        var Uninitialized = -1;
        var Pending = 0;
        var Resolved = 1;
        var Rejected = 2;
        function lazyInitializer(payload) {
          if (payload._status === Uninitialized) {
            var ctor = payload._result;
            var thenable = ctor();
            thenable.then(function(moduleObject2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = moduleObject2;
              }
            }, function(error2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error2;
              }
            });
            if (payload._status === Uninitialized) {
              var pending = payload;
              pending._status = Pending;
              pending._result = thenable;
            }
          }
          if (payload._status === Resolved) {
            var moduleObject = payload._result;
            {
              if (moduleObject === void 0) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
              }
            }
            {
              if (!("default" in moduleObject)) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
              }
            }
            return moduleObject.default;
          } else {
            throw payload._result;
          }
        }
        function lazy(ctor) {
          var payload = {
            // We use these fields to store the result.
            _status: Uninitialized,
            _result: ctor
          };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: payload,
            _init: lazyInitializer
          };
          {
            var defaultProps;
            var propTypes;
            Object.defineProperties(lazyType, {
              defaultProps: {
                configurable: true,
                get: function() {
                  return defaultProps;
                },
                set: function(newDefaultProps) {
                  error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  defaultProps = newDefaultProps;
                  Object.defineProperty(lazyType, "defaultProps", {
                    enumerable: true
                  });
                }
              },
              propTypes: {
                configurable: true,
                get: function() {
                  return propTypes;
                },
                set: function(newPropTypes) {
                  error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  propTypes = newPropTypes;
                  Object.defineProperty(lazyType, "propTypes", {
                    enumerable: true
                  });
                }
              }
            });
          }
          return lazyType;
        }
        function forwardRef(render) {
          {
            if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
              error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
            } else if (typeof render !== "function") {
              error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
            } else {
              if (render.length !== 0 && render.length !== 2) {
                error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
              }
            }
            if (render != null) {
              if (render.defaultProps != null || render.propTypes != null) {
                error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
              }
            }
          }
          var elementType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!render.name && !render.displayName) {
                  render.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function memo(type, compare) {
          {
            if (!isValidElementType(type)) {
              error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
            }
          }
          var elementType = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: compare === void 0 ? null : compare
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!type.name && !type.displayName) {
                  type.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        function resolveDispatcher() {
          var dispatcher = ReactCurrentDispatcher.current;
          {
            if (dispatcher === null) {
              error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
            }
          }
          return dispatcher;
        }
        function useContext2(Context) {
          var dispatcher = resolveDispatcher();
          {
            if (Context._context !== void 0) {
              var realContext = Context._context;
              if (realContext.Consumer === Context) {
                error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
              } else if (realContext.Provider === Context) {
                error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
              }
            }
          }
          return dispatcher.useContext(Context);
        }
        function useState(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef2(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect2(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useEffect(create, deps);
        }
        function useInsertionEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useInsertionEffect(create, deps);
        }
        function useLayoutEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useLayoutEffect(create, deps);
        }
        function useCallback(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo2(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useMemo(create, deps);
        }
        function useImperativeHandle(ref, create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useImperativeHandle(ref, create, deps);
        }
        function useDebugValue(value, formatterFn) {
          {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDebugValue(value, formatterFn);
          }
        }
        function useTransition() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useTransition();
        }
        function useDeferredValue(value) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useDeferredValue(value);
        }
        function useId() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useId();
        }
        function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        }
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher$1.current;
            ReactCurrentDispatcher$1.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher$1.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component2) {
          var prototype = Component2.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              setExtraStackFrame(stack);
            } else {
              setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function getDeclarationErrorAddendum() {
          if (ReactCurrentOwner.current) {
            var name = getComponentNameFromType(ReactCurrentOwner.current.type);
            if (name) {
              return "\n\nCheck the render method of `" + name + "`.";
            }
          }
          return "";
        }
        function getSourceInfoErrorAddendum(source) {
          if (source !== void 0) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, "");
            var lineNumber = source.lineNumber;
            return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
          }
          return "";
        }
        function getSourceInfoErrorAddendumForProps(elementProps) {
          if (elementProps !== null && elementProps !== void 0) {
            return getSourceInfoErrorAddendum(elementProps.__source);
          }
          return "";
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
            if (parentName) {
              info = "\n\nCheck the top-level render call using <" + parentName + ">.";
            }
          }
          return info;
        }
        function validateExplicitKey(element, parentType) {
          if (!element._store || element._store.validated || element.key != null) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = "";
          if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
            childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
          }
          {
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          if (typeof node !== "object") {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === "function") {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        function createElementWithValidation(type, props, children) {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = "";
            if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
              info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendumForProps(props);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = "null";
            } else if (isArray(type)) {
              typeString = "array";
            } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
              typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
              info = " Did you accidentally export a JSX literal instead of a component?";
            } else {
              typeString = typeof type;
            }
            {
              error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
          }
          var element = createElement.apply(this, arguments);
          if (element == null) {
            return element;
          }
          if (validType) {
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], type);
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
        var didWarnAboutDeprecatedCreateFactory = false;
        function createFactoryWithValidation(type) {
          var validatedFactory = createElementWithValidation.bind(null, type);
          validatedFactory.type = type;
          {
            if (!didWarnAboutDeprecatedCreateFactory) {
              didWarnAboutDeprecatedCreateFactory = true;
              warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
            }
            Object.defineProperty(validatedFactory, "type", {
              enumerable: false,
              get: function() {
                warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                  value: type
                });
                return type;
              }
            });
          }
          return validatedFactory;
        }
        function cloneElementWithValidation(element, props, children) {
          var newElement = cloneElement.apply(this, arguments);
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], newElement.type);
          }
          validatePropTypes(newElement);
          return newElement;
        }
        function startTransition(scope, options) {
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = {};
          var currentTransition = ReactCurrentBatchConfig.transition;
          {
            ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
          }
          try {
            scope();
          } finally {
            ReactCurrentBatchConfig.transition = prevTransition;
            {
              if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                if (updatedFibersCount > 10) {
                  warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                }
                currentTransition._updatedFibers.clear();
              }
            }
          }
        }
        var didWarnAboutMessageChannel = false;
        var enqueueTaskImpl = null;
        function enqueueTask(task) {
          if (enqueueTaskImpl === null) {
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              var nodeRequire = module2 && module2[requireString];
              enqueueTaskImpl = nodeRequire.call(module2, "timers").setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                {
                  if (didWarnAboutMessageChannel === false) {
                    didWarnAboutMessageChannel = true;
                    if (typeof MessageChannel === "undefined") {
                      error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                    }
                  }
                }
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          }
          return enqueueTaskImpl(task);
        }
        var actScopeDepth = 0;
        var didWarnNoAwaitAct = false;
        function act(callback) {
          {
            var prevActScopeDepth = actScopeDepth;
            actScopeDepth++;
            if (ReactCurrentActQueue.current === null) {
              ReactCurrentActQueue.current = [];
            }
            var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
            var result;
            try {
              ReactCurrentActQueue.isBatchingLegacy = true;
              result = callback();
              if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                var queue = ReactCurrentActQueue.current;
                if (queue !== null) {
                  ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                  flushActQueue(queue);
                }
              }
            } catch (error2) {
              popActScope(prevActScopeDepth);
              throw error2;
            } finally {
              ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
            }
            if (result !== null && typeof result === "object" && typeof result.then === "function") {
              var thenableResult = result;
              var wasAwaited = false;
              var thenable = {
                then: function(resolve, reject) {
                  wasAwaited = true;
                  thenableResult.then(function(returnValue2) {
                    popActScope(prevActScopeDepth);
                    if (actScopeDepth === 0) {
                      recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                    } else {
                      resolve(returnValue2);
                    }
                  }, function(error2) {
                    popActScope(prevActScopeDepth);
                    reject(error2);
                  });
                }
              };
              {
                if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                  Promise.resolve().then(function() {
                  }).then(function() {
                    if (!wasAwaited) {
                      didWarnNoAwaitAct = true;
                      error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                    }
                  });
                }
              }
              return thenable;
            } else {
              var returnValue = result;
              popActScope(prevActScopeDepth);
              if (actScopeDepth === 0) {
                var _queue = ReactCurrentActQueue.current;
                if (_queue !== null) {
                  flushActQueue(_queue);
                  ReactCurrentActQueue.current = null;
                }
                var _thenable = {
                  then: function(resolve, reject) {
                    if (ReactCurrentActQueue.current === null) {
                      ReactCurrentActQueue.current = [];
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    } else {
                      resolve(returnValue);
                    }
                  }
                };
                return _thenable;
              } else {
                var _thenable2 = {
                  then: function(resolve, reject) {
                    resolve(returnValue);
                  }
                };
                return _thenable2;
              }
            }
          }
        }
        function popActScope(prevActScopeDepth) {
          {
            if (prevActScopeDepth !== actScopeDepth - 1) {
              error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
            }
            actScopeDepth = prevActScopeDepth;
          }
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          {
            var queue = ReactCurrentActQueue.current;
            if (queue !== null) {
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  if (queue.length === 0) {
                    ReactCurrentActQueue.current = null;
                    resolve(returnValue);
                  } else {
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  }
                });
              } catch (error2) {
                reject(error2);
              }
            } else {
              resolve(returnValue);
            }
          }
        }
        var isFlushing = false;
        function flushActQueue(queue) {
          {
            if (!isFlushing) {
              isFlushing = true;
              var i = 0;
              try {
                for (; i < queue.length; i++) {
                  var callback = queue[i];
                  do {
                    callback = callback(true);
                  } while (callback !== null);
                }
                queue.length = 0;
              } catch (error2) {
                queue = queue.slice(i + 1);
                throw error2;
              } finally {
                isFlushing = false;
              }
            }
          }
        }
        var createElement$1 = createElementWithValidation;
        var cloneElement$1 = cloneElementWithValidation;
        var createFactory = createFactoryWithValidation;
        var Children = {
          map: mapChildren,
          forEach: forEachChildren,
          count: countChildren,
          toArray,
          only: onlyChild
        };
        exports2.Children = Children;
        exports2.Component = Component;
        exports2.Fragment = REACT_FRAGMENT_TYPE;
        exports2.Profiler = REACT_PROFILER_TYPE;
        exports2.PureComponent = PureComponent;
        exports2.StrictMode = REACT_STRICT_MODE_TYPE;
        exports2.Suspense = REACT_SUSPENSE_TYPE;
        exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
        exports2.act = act;
        exports2.cloneElement = cloneElement$1;
        exports2.createContext = createContext2;
        exports2.createElement = createElement$1;
        exports2.createFactory = createFactory;
        exports2.createRef = createRef;
        exports2.forwardRef = forwardRef;
        exports2.isValidElement = isValidElement;
        exports2.lazy = lazy;
        exports2.memo = memo;
        exports2.startTransition = startTransition;
        exports2.unstable_act = act;
        exports2.useCallback = useCallback;
        exports2.useContext = useContext2;
        exports2.useDebugValue = useDebugValue;
        exports2.useDeferredValue = useDeferredValue;
        exports2.useEffect = useEffect2;
        exports2.useId = useId;
        exports2.useImperativeHandle = useImperativeHandle;
        exports2.useInsertionEffect = useInsertionEffect;
        exports2.useLayoutEffect = useLayoutEffect;
        exports2.useMemo = useMemo2;
        exports2.useReducer = useReducer;
        exports2.useRef = useRef2;
        exports2.useState = useState;
        exports2.useSyncExternalStore = useSyncExternalStore;
        exports2.useTransition = useTransition;
        exports2.version = ReactVersion;
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
  }
});

// 1.Frontend/node_modules/react/index.js
var require_react = __commonJS({
  "1.Frontend/node_modules/react/index.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_production_min();
    } else {
      module2.exports = require_react_development();
    }
  }
});

// 1.Frontend/node_modules/react/cjs/react-jsx-runtime.production.min.js
var require_react_jsx_runtime_production_min = __commonJS({
  "1.Frontend/node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports2) {
    "use strict";
    var f = require_react();
    var k = Symbol.for("react.element");
    var l = Symbol.for("react.fragment");
    var m = Object.prototype.hasOwnProperty;
    var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
    var p = { key: true, ref: true, __self: true, __source: true };
    function q(c, a, g) {
      var b, d = {}, e = null, h = null;
      void 0 !== g && (e = "" + g);
      void 0 !== a.key && (e = "" + a.key);
      void 0 !== a.ref && (h = a.ref);
      for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
      if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
      return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
    }
    exports2.Fragment = l;
    exports2.jsx = q;
    exports2.jsxs = q;
  }
});

// 1.Frontend/node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "1.Frontend/node_modules/react/cjs/react-jsx-runtime.development.js"(exports2) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      (function() {
        "use strict";
        var React2 = require_react();
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactSharedInternals = React2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var assign = Object.assign;
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component) {
          var prototype = Component.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown;
        var specialPropRefWarningShown;
        var didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function warnIfStringRefCannotBeAutoConverted(config, self) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        function defineKeyPropWarningGetter(props, displayName) {
          {
            var warnAboutAccessingKey = function() {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            };
            warnAboutAccessingKey.isReactWarning = true;
            Object.defineProperty(props, "key", {
              get: warnAboutAccessingKey,
              configurable: true
            });
          }
        }
        function defineRefPropWarningGetter(props, displayName) {
          {
            var warnAboutAccessingRef = function() {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            };
            warnAboutAccessingRef.isReactWarning = true;
            Object.defineProperty(props, "ref", {
              get: warnAboutAccessingRef,
              configurable: true
            });
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function jsxDEV(type, config, maybeKey, source, self) {
          {
            var propName;
            var props = {};
            var key = null;
            var ref = null;
            if (maybeKey !== void 0) {
              {
                checkKeyStringCoercion(maybeKey);
              }
              key = "" + maybeKey;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            if (hasValidRef(config)) {
              ref = config.ref;
              warnIfStringRefCannotBeAutoConverted(config, self);
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
            if (type && type.defaultProps) {
              var defaultProps = type.defaultProps;
              for (propName in defaultProps) {
                if (props[propName] === void 0) {
                  props[propName] = defaultProps[propName];
                }
              }
            }
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
            return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
          }
        }
        var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function isValidElement(object) {
          {
            return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
          }
        }
        function getDeclarationErrorAddendum() {
          {
            if (ReactCurrentOwner$1.current) {
              var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);
              if (name) {
                return "\n\nCheck the render method of `" + name + "`.";
              }
            }
            return "";
          }
        }
        function getSourceInfoErrorAddendum(source) {
          {
            if (source !== void 0) {
              var fileName = source.fileName.replace(/^.*[\\\/]/, "");
              var lineNumber = source.lineNumber;
              return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
            }
            return "";
          }
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          {
            var info = getDeclarationErrorAddendum();
            if (!info) {
              var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
              if (parentName) {
                info = "\n\nCheck the top-level render call using <" + parentName + ">.";
              }
            }
            return info;
          }
        }
        function validateExplicitKey(element, parentType) {
          {
            if (!element._store || element._store.validated || element.key != null) {
              return;
            }
            element._store.validated = true;
            var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
            if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
              return;
            }
            ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
            var childOwner = "";
            if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
              childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
            }
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          {
            if (typeof node !== "object") {
              return;
            }
            if (isArray(node)) {
              for (var i = 0; i < node.length; i++) {
                var child = node[i];
                if (isValidElement(child)) {
                  validateExplicitKey(child, parentType);
                }
              }
            } else if (isValidElement(node)) {
              if (node._store) {
                node._store.validated = true;
              }
            } else if (node) {
              var iteratorFn = getIteratorFn(node);
              if (typeof iteratorFn === "function") {
                if (iteratorFn !== node.entries) {
                  var iterator = iteratorFn.call(node);
                  var step;
                  while (!(step = iterator.next()).done) {
                    if (isValidElement(step.value)) {
                      validateExplicitKey(step.value, parentType);
                    }
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        var didWarnAboutKeySpread = {};
        function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
          {
            var validType = isValidElementType(type);
            if (!validType) {
              var info = "";
              if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
              }
              var sourceInfo = getSourceInfoErrorAddendum(source);
              if (sourceInfo) {
                info += sourceInfo;
              } else {
                info += getDeclarationErrorAddendum();
              }
              var typeString;
              if (type === null) {
                typeString = "null";
              } else if (isArray(type)) {
                typeString = "array";
              } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
                typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
                info = " Did you accidentally export a JSX literal instead of a component?";
              } else {
                typeString = typeof type;
              }
              error("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
            var element = jsxDEV(type, props, key, source, self);
            if (element == null) {
              return element;
            }
            if (validType) {
              var children = props.children;
              if (children !== void 0) {
                if (isStaticChildren) {
                  if (isArray(children)) {
                    for (var i = 0; i < children.length; i++) {
                      validateChildKeys(children[i], type);
                    }
                    if (Object.freeze) {
                      Object.freeze(children);
                    }
                  } else {
                    error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
                  }
                } else {
                  validateChildKeys(children, type);
                }
              }
            }
            {
              if (hasOwnProperty.call(props, "key")) {
                var componentName = getComponentNameFromType(type);
                var keys = Object.keys(props).filter(function(k) {
                  return k !== "key";
                });
                var beforeExample = keys.length > 0 ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
                if (!didWarnAboutKeySpread[componentName + beforeExample]) {
                  var afterExample = keys.length > 0 ? "{" + keys.join(": ..., ") + ": ...}" : "{}";
                  error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);
                  didWarnAboutKeySpread[componentName + beforeExample] = true;
                }
              }
            }
            if (type === REACT_FRAGMENT_TYPE) {
              validateFragmentProps(element);
            } else {
              validatePropTypes(element);
            }
            return element;
          }
        }
        function jsxWithValidationStatic(type, props, key) {
          {
            return jsxWithValidation(type, props, key, true);
          }
        }
        function jsxWithValidationDynamic(type, props, key) {
          {
            return jsxWithValidation(type, props, key, false);
          }
        }
        var jsx2 = jsxWithValidationDynamic;
        var jsxs = jsxWithValidationStatic;
        exports2.Fragment = REACT_FRAGMENT_TYPE;
        exports2.jsx = jsx2;
        exports2.jsxs = jsxs;
      })();
    }
  }
});

// 1.Frontend/node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "1.Frontend/node_modules/react/jsx-runtime.js"(exports2, module2) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_react_jsx_runtime_production_min();
    } else {
      module2.exports = require_react_jsx_runtime_development();
    }
  }
});

// 3.Knowledge/scripts/cineva_campaigns_2026_10_18/execution.test.ts
var import_node_test = __toESM(require("node:test"));
var import_strict = __toESM(require("node:assert/strict"));

// 1.Frontend/HOTS/src/features/cineva-campaigns/execution.ts
function readExecution(assignment) {
  return assignment.execution ?? { revision: 0, product: { choice: "unselected", fulfillment: "pending" }, deliverables: {} };
}
function getDeliveryExecution(assignment, deliverableId) {
  if (!assignment.deliverables.some((item) => item.id === deliverableId)) throw new Error("Deliverable tidak ditemukan pada assignment.");
  return readExecution(assignment).deliverables[deliverableId] ?? { status: "not_submitted", drafts: [], reviews: [] };
}
function validHttpUrl(value) {
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    return url.href;
  } catch {
    throw new Error("Gunakan URL http atau https yang valid tanpa username/password.");
  }
}
function timestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59)
    throw new Error("Waktu operasional tidak valid.");
  dateOnly(value.slice(0, 10));
  return new Date(value).toISOString();
}
function dateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + "T00:00:00Z")) || (/* @__PURE__ */ new Date(value + "T00:00:00Z")).toISOString().slice(0, 10) !== value) throw new Error("Tanggal posting tidak valid.");
  return value;
}
function assertOwner(assignment, actor, product) {
  if (actor.product !== product || product === "creator" && actor.id !== assignment.creatorId)
    throw new Error(product === "creator" ? "Tindakan ini milik Creator yang ditugaskan." : "QC dan proses produk ditangani HQ pemilik campaign.");
}
function currentExecution(assignment, expectedRevision) {
  const current = readExecution(assignment);
  if (!Number.isSafeInteger(current.revision) || current.revision < 0 || current.revision !== expectedRevision)
    throw new Error("Progress assignment berubah. Baca kondisi terbaru sebelum menyimpan.");
  return current;
}
function save(assignment, execution) {
  return { ...assignment, execution: { ...execution, revision: execution.revision + 1 } };
}
function saveDelivery(assignment, execution, id, delivery) {
  return save(assignment, { ...execution, deliverables: { ...execution.deliverables, [id]: delivery } });
}
function chooseProduct(assignment, actor, products2, productId, expectedRevision) {
  assertOwner(assignment, actor, "creator");
  const current = currentExecution(assignment, expectedRevision), product = products2.find((item) => item.id === productId);
  if (!product) throw new Error("Pilih produk dari katalog campaign ini.");
  if (current.product.fulfillment !== "pending") throw new Error("Pilihan produk terkunci setelah diproses HQ.");
  if (current.product.productId === productId) return assignment;
  return save(assignment, { ...current, product: { choice: "selected", productId, name: product.name, variant: product.variant, fulfillment: "pending" } });
}
function progressFulfillment(assignment, actor, next, expectedRevision) {
  if (actor.product === "creator") assertOwner(assignment, actor, "creator");
  else assertOwner(assignment, actor, "hq");
  const current = currentExecution(assignment, expectedRevision);
  if (current.product.choice !== "selected") throw new Error("Creator harus memilih produk terlebih dahulu.");
  if (next === "ordered" && (actor.product !== "hq" || current.product.fulfillment !== "pending")) throw new Error("HQ memproses produk terpilih satu kali.");
  if (next === "received" && current.product.fulfillment !== "ordered") throw new Error("Produk harus diproses sebelum diterima.");
  return save(assignment, { ...current, product: { ...current.product, fulfillment: next } });
}
function submitDraft(assignment, actor, deliverableId, input, expectedRevision, at2 = (/* @__PURE__ */ new Date()).toISOString()) {
  assertOwner(assignment, actor, "creator");
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId);
  if (!["not_submitted", "revision_requested"].includes(delivery.status) || delivery.posting) throw new Error("Tunggu QC atau permintaan revisi sebelum mengirim draft baru.");
  if (input.note.length > 2e3) throw new Error("Catatan draft maksimal 2.000 karakter.");
  const draft = { version: (delivery.drafts.at(-1)?.version ?? 0) + 1, url: validHttpUrl(input.url), note: input.note.trim(), submittedAt: timestamp(at2) };
  return saveDelivery(assignment, current, deliverableId, { ...delivery, status: "submitted", drafts: [...delivery.drafts, draft] });
}
function reviewDraft(assignment, actor, deliverableId, input, expectedRevision, at2 = (/* @__PURE__ */ new Date()).toISOString()) {
  assertOwner(assignment, actor, "hq");
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId), draft = delivery.drafts.at(-1);
  if (delivery.status !== "submitted" || !draft || draft.version !== input.draftVersion) throw new Error("Draft QC berubah atau sudah diputuskan. Muat draft terbaru.");
  if (!["revision_requested", "approved"].includes(input.decision) || input.note.length > 2e3 || input.decision === "revision_requested" && !input.note.trim())
    throw new Error("Keputusan QC valid dan alasan revisi wajib diisi (maksimal 2.000 karakter).");
  const reviewedAt = timestamp(at2);
  if (Date.parse(reviewedAt) < Date.parse(draft.submittedAt)) throw new Error("Waktu QC tidak boleh mendahului pengiriman draft.");
  return saveDelivery(assignment, current, deliverableId, { ...delivery, status: input.decision, reviews: [
    ...delivery.reviews,
    { draftVersion: draft.version, decision: input.decision, note: input.note.trim(), reviewedAt, actor: actor.id }
  ] });
}
function recordPosting(assignment, actor, deliverableId, input, expectedRevision) {
  assertOwner(assignment, actor, "creator");
  const current = currentExecution(assignment, expectedRevision), delivery = getDeliveryExecution(assignment, deliverableId);
  const target = assignment.deliverables.find((item) => item.id === deliverableId);
  if (!target.postingRequired || target.outputOwner === "brand") throw new Error("Output brand/non-posting tidak memerlukan publikasi akun Creator.");
  if (delivery.status !== "approved" || delivery.reviews.at(-1)?.decision !== "approved") throw new Error("Posting hanya setelah draft disetujui QC.");
  if (delivery.posting) throw new Error("URL posting sudah disimpan.");
  const postedAt = dateOnly(input.postedAt), approval = delivery.reviews.at(-1);
  const approvedDate = new Date(approval.reviewedAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  if (postedAt < approvedDate) throw new Error("Tanggal posting tidak boleh mendahului persetujuan QC.");
  return saveDelivery(assignment, current, deliverableId, { ...delivery, posting: { url: validHttpUrl(input.url), postedAt } });
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== void 0).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
var same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
function assertExecutionMutation(previous, next, actor, products2) {
  if (same(previous.execution, next.execution)) return;
  const before = readExecution(previous), after = next.execution;
  if (!after || after.revision !== before.revision + 1) throw new Error("Revisi progress assignment tidak valid.");
  const changed = [.../* @__PURE__ */ new Set([...Object.keys(before.deliverables), ...Object.keys(after.deliverables)])].filter((id) => !same(before.deliverables[id], after.deliverables[id]));
  let replay;
  if (!same(before.product, after.product) && changed.length === 0) {
    if (before.product.productId !== after.product.productId)
      replay = chooseProduct(previous, actor, products2, after.product.productId ?? "", before.revision);
    else if (after.product.fulfillment === "ordered" || after.product.fulfillment === "received")
      replay = progressFulfillment(previous, actor, after.product.fulfillment, before.revision);
  } else if (same(before.product, after.product) && changed.length === 1) {
    const id = changed[0], old = getDeliveryExecution(previous, id), delivery = after.deliverables[id];
    if (!delivery) throw new Error("Riwayat deliverable tidak boleh dihapus.");
    if (delivery.drafts.length === old.drafts.length + 1) {
      const draft = delivery.drafts.at(-1);
      replay = submitDraft(previous, actor, id, { url: draft.url, note: draft.note }, before.revision, draft.submittedAt);
    } else if (delivery.reviews.length === old.reviews.length + 1) {
      const review = delivery.reviews.at(-1);
      replay = reviewDraft(previous, actor, id, { decision: review.decision, note: review.note, draftVersion: review.draftVersion }, before.revision, review.reviewedAt);
    } else if (!old.posting && delivery.posting) replay = recordPosting(previous, actor, id, delivery.posting, before.revision);
  }
  if (!replay || !same(replay.execution, after)) throw new Error("Perubahan execution melewati alur produk, draft, QC atau posting yang diizinkan.");
}

// 3.Knowledge/scripts/cineva_campaigns_2026_10_18/execution.test.ts
var creator = { id: "creator-1", product: "creator" };
var hq = { id: "hq-1", product: "hq" };
var products = [{ id: "sku-one", name: "Produk sintetis", variant: "Varian A", referenceValue: 1e5 }];
var at = "2026-10-18T03:00:00.000Z";
var reviewAt = "2026-10-18T04:00:00.000Z";
function fixture() {
  return { id: "assignment-one", creatorId: creator.id, creatorName: "Creator dummy", batchId: "batch-one", socialProfiles: [], deliverables: [
    { id: "post", title: "Reels dummy", platform: "Instagram", deadline: "2026-10-22", postingRequired: true, outputOwner: "creator" },
    { id: "brand", title: "Raw video dummy", platform: "Brand", deadline: "2026-10-22", postingRequired: false, outputOwner: "brand" }
  ] };
}
function submitted(id = "post") {
  return submitDraft(fixture(), creator, id, { url: "https://example.test/draft", note: "Draft dummy" }, 0, at);
}
function approved(id = "post") {
  return reviewDraft(submitted(id), hq, id, { decision: "approved", note: "QC dummy", draftVersion: 1 }, 1, reviewAt);
}
(0, import_node_test.default)("Choice and fulfillment remain independent of deliverable and payout state", () => {
  const empty = fixture(), selected = chooseProduct(empty, creator, products, "sku-one", 0);
  import_strict.default.equal(readExecution(empty).product.choice, "unselected");
  import_strict.default.equal(readExecution(selected).product.fulfillment, "pending");
  import_strict.default.equal(getDeliveryExecution(selected, "post").status, "not_submitted");
  import_strict.default.throws(() => progressFulfillment(selected, creator, "ordered", 1));
  const ordered = progressFulfillment(selected, hq, "ordered", 1);
  import_strict.default.throws(() => chooseProduct(ordered, creator, products, "sku-one", 2));
  const received = progressFulfillment(ordered, creator, "received", 2);
  import_strict.default.equal(readExecution(received).product.fulfillment, "received");
  import_strict.default.equal(received.finance, void 0);
  import_strict.default.throws(() => progressFulfillment(received, hq, "received", 3));
});
(0, import_node_test.default)("Creator draft -> HQ revision -> newer draft -> QC approval preserves version history", () => {
  const first = submitted();
  const revised = reviewDraft(first, hq, "post", { decision: "revision_requested", note: "Perbaiki outro", draftVersion: 1 }, 1, reviewAt);
  const second = submitDraft(revised, creator, "post", { url: "https://example.test/draft-v2", note: "Outro diperbaiki" }, 2, "2026-10-18T05:00:00Z");
  import_strict.default.throws(() => reviewDraft(second, hq, "post", { decision: "approved", note: "", draftVersion: 1 }, 3));
  const approvedRow = reviewDraft(second, hq, "post", { decision: "approved", note: "", draftVersion: 2 }, 3, "2026-10-18T06:00:00Z");
  const delivery = getDeliveryExecution(approvedRow, "post");
  import_strict.default.equal(delivery.status, "approved");
  import_strict.default.equal(delivery.drafts.length, 2);
  import_strict.default.equal(delivery.reviews.length, 2);
  import_strict.default.equal(getDeliveryExecution(first, "post").reviews.length, 0);
});
(0, import_node_test.default)("Posting requires QC approved creator output, valid URL/date and is stored separately", () => {
  import_strict.default.throws(() => recordPosting(submitted(), creator, "post", { url: "https://example.test/post", postedAt: "2026-10-18" }, 1));
  const ready = approved();
  import_strict.default.throws(() => recordPosting(ready, creator, "post", { url: "javascript:alert(1)", postedAt: "2026-10-18" }, 2));
  import_strict.default.throws(() => recordPosting(ready, creator, "post", { url: "https://example.test/post", postedAt: "2026-02-31" }, 2));
  import_strict.default.throws(() => recordPosting(ready, creator, "post", { url: "https://example.test/post", postedAt: "2026-10-17" }, 2));
  const posted = recordPosting(ready, creator, "post", { url: "https://example.test/post", postedAt: "2026-10-19" }, 2);
  import_strict.default.equal(getDeliveryExecution(posted, "post").status, "approved");
  import_strict.default.equal(getDeliveryExecution(posted, "post").posting?.postedAt, "2026-10-19");
  import_strict.default.throws(() => recordPosting(posted, creator, "post", { url: "https://example.test/new", postedAt: "2026-10-19" }, 3));
  import_strict.default.throws(() => recordPosting(approved("brand"), creator, "brand", { url: "https://example.test/post", postedAt: "2026-10-19" }, 2));
});
(0, import_node_test.default)("Creator identity, HQ QC role and stale execution revisions are enforced", () => {
  import_strict.default.throws(() => submitDraft(fixture(), { ...creator, id: "creator-2" }, "post", { url: "https://example.test/draft", note: "" }, 0));
  import_strict.default.throws(() => submitDraft(fixture(), hq, "post", { url: "https://example.test/draft", note: "" }, 0));
  import_strict.default.throws(() => reviewDraft(submitted(), creator, "post", { decision: "approved", note: "", draftVersion: 1 }, 1));
  import_strict.default.throws(() => reviewDraft(submitted(), hq, "post", { decision: "revision_requested", note: "", draftVersion: 1 }, 1));
  import_strict.default.throws(() => reviewDraft(submitted(), hq, "post", { decision: "approved", note: "", draftVersion: 1 }, 0), /berubah/);
  import_strict.default.throws(() => reviewDraft(submitted(), hq, "post", { decision: "approved", note: "", draftVersion: 1 }, 1, "2026-10-17T00:00:00Z"));
  import_strict.default.throws(() => submitDraft(fixture(), creator, "post", { url: "https://example.test/draft", note: "" }, 0, "2026-02-31T03:00:00Z"));
  import_strict.default.throws(() => getDeliveryExecution(fixture(), "unknown"));
});
(0, import_node_test.default)("HTTP(S) URLs reject executable/file schemes, credentials and malformed values", () => {
  for (const value of ["javascript:alert(1)", "file:///tmp/a", "/relative/path", "not a url", "https://user:pass@example.test"]) import_strict.default.throws(() => validHttpUrl(value));
  import_strict.default.equal(validHttpUrl(" https://example.test/path "), "https://example.test/path");
});
(0, import_node_test.default)("Repository execution guard replays legal actions and rejects forged QC/history or fulfillment", () => {
  const row = fixture(), selected = chooseProduct(row, creator, products, "sku-one", 0);
  import_strict.default.doesNotThrow(() => assertExecutionMutation(row, selected, creator, products));
  const ordered = progressFulfillment(selected, hq, "ordered", 1);
  import_strict.default.throws(() => assertExecutionMutation(selected, ordered, creator, products));
  import_strict.default.doesNotThrow(() => assertExecutionMutation(selected, ordered, hq, products));
  const first = submitted(), review = approved();
  import_strict.default.doesNotThrow(() => assertExecutionMutation(row, first, creator, products));
  import_strict.default.throws(() => assertExecutionMutation(first, review, creator, products));
  import_strict.default.doesNotThrow(() => assertExecutionMutation(first, review, hq, products));
  const forged = structuredClone(review);
  forged.execution.revision++;
  forged.execution.deliverables.post.drafts[0].url = "https://example.test/rewrite";
  import_strict.default.throws(() => assertExecutionMutation(review, forged, creator, products));
  const deleted = { ...review, execution: void 0 };
  import_strict.default.throws(() => assertExecutionMutation(review, deleted, creator, products));
});

// 3.Knowledge/scripts/cineva_campaigns_2026_10_18/finance.test.ts
var import_node_test2 = __toESM(require("node:test"));
var import_strict2 = __toESM(require("node:assert/strict"));

// 1.Frontend/packages/app-core/src/sse.ts
var import_react = __toESM(require_react(), 1);

// 1.Frontend/packages/app-core/src/storage.ts
var FORBIDDEN = /(token|tokek|password|secret|jwt)/i;
function createAppStorage(appKey) {
  const prefix = `${appKey}_`;
  const key = (name) => {
    if (FORBIDDEN.test(name)) throw new Error(`[app-core/storage] "${name}" looks like a secret; secrets must not go to localStorage`);
    return prefix + name;
  };
  return {
    get(name, fallback = null) {
      try {
        const raw = localStorage.getItem(key(name));
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(name, value) {
      try {
        localStorage.setItem(key(name), JSON.stringify(value));
      } catch {
      }
    },
    remove(name) {
      try {
        localStorage.removeItem(key(name));
      } catch {
      }
    }
  };
}

// 1.Frontend/packages/app-core/src/HotsCoreProvider.tsx
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var HotsCoreContext = (0, import_react2.createContext)(null);

// 1.Frontend/HOTS/src/features/cineva-campaigns/model.ts
var isHQOwner = (actor, campaign) => actor.product === "hq" && actor.id === campaign.ownerId;
function validDate(value) {
  const date = /* @__PURE__ */ new Date(value + "T00:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validateCampaign(row) {
  if (![row.id, row.ownerId, row.title, row.brand, row.brief, row.objective, row.audience, row.messaging].every((value) => typeof value === "string" && value.trim()))
    throw new Error("Lengkapi identitas dan brief campaign.");
  const unique = (ids) => ids.every(Boolean) && new Set(ids).size === ids.length;
  if (!unique(row.batches.map((batch) => batch.id)) || !unique(row.assignments.map((item) => item.id)) || !unique(row.milestones.map((item) => item.id)))
    throw new Error("ID batch, assignment dan milestone harus unik.");
  if (row.batches.some((batch) => !batch.name.trim()) || row.milestones.some((item) => !item.title.trim() || !validDate(item.deadline)))
    throw new Error("Nama batch dan deadline milestone harus valid.");
  for (const assignment of row.assignments) {
    if (!row.batches.some((batch) => batch.id === assignment.batchId) || !["creator-1", "creator-2"].includes(assignment.creatorId) || !assignment.creatorName.trim())
      throw new Error("Batch dan identitas assignment tidak valid.");
    if (!unique(assignment.deliverables.map((item) => item.id)) || assignment.deliverables.some((item) => !item.title.trim() || !item.platform.trim() || !validDate(item.deadline)))
      throw new Error("Deliverable dan deadline harus valid.");
    if (assignment.socialProfiles.some((profile) => !profile.platform.trim() || !profile.handle.trim() || !validDate(profile.capturedAt) || profile.followers !== null && (!Number.isSafeInteger(profile.followers) || profile.followers < 0)))
      throw new Error("Snapshot akun sosial tidak valid.");
  }
  if (!unique(row.products.map((item) => item.id)) || row.products.some((item) => !item.name.trim() || !Number.isSafeInteger(item.referenceValue) || item.referenceValue < 0))
    throw new Error("Produk campaign tidak valid.");
}

// 1.Frontend/HOTS/src/features/cineva-campaigns/seed.ts
function campaignSeed() {
  return ["hq-1", "hq-2"].map((ownerId, index) => ({
    id: `campaign-demo-${index + 1}`,
    ownerId,
    title: `Campaign Studio Dummy ${index + 1}`,
    brand: `Brand Simulasi ${index + 1}`,
    objective: "Mengenalkan produk simulasi",
    audience: "Audiens konten kreatif",
    messaging: "Cerita sederhana dari pengalaman kreator",
    brief: "Semua nama, akun dan transaksi merupakan fixture sintetis.",
    milestones: [{ id: "listing", title: "Listing talent", deadline: "2026-10-20" }, { id: "draft", title: "Draft konten", deadline: "2026-10-24" }, { id: "posting", title: "Posting / ACC", deadline: "2026-10-27" }],
    batches: [{ id: "batch-1", name: "Batch pembuka" }],
    products: [{ id: "sku-demo", name: "Produk Studio Dummy", variant: "Demo", referenceValue: 125e3 }],
    assignments: ["creator-1", "creator-2"].map((creatorId, i) => ({
      id: `assignment-${index + 1}-${i + 1}`,
      batchId: "batch-1",
      creatorId,
      creatorName: `Kreator Dummy ${i + 1}`,
      socialProfiles: [{ platform: "Instagram", handle: `@creator_dummy_${i + 1}`, followers: i ? null : 1200, capturedAt: "2026-10-18" }],
      deliverables: [{ id: "output-1", title: "Video ulasan dummy", platform: "Instagram", postingRequired: true, deadline: "2026-10-27" }, { id: "output-2", title: "Konten untuk brand", platform: "Brand asset", postingRequired: false, deadline: "2026-10-27" }]
    }))
  }));
}

// 1.Frontend/HOTS/src/features/cineva-campaigns/finance.ts
var metricNames = ["likes", "comments", "shares", "saves", "reposts", "views"];
var readFinance = (assignment) => assignment.finance ?? {
  feeAmount: 0,
  marketingAmount: 0,
  productBenefitAmount: 0,
  processing: false,
  payments: [],
  insights: []
};
var amountValid = (amount) => Number.isSafeInteger(amount) && amount >= 0;
function financeDate(value) {
  const stamp = /* @__PURE__ */ new Date(value + "T00:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp.getTime()) && stamp.toISOString().slice(0, 10) === value;
}
function assertHQ(actor) {
  if (actor.product !== "hq") throw new Error("Hanya HQ tujuan dapat mencatat keuangan campaign.");
}
var update = (assignment, finance) => ({ ...assignment, finance });
var totalPaid = (finance) => finance.payments.reduce((sum, payment) => sum + payment.amount, 0);
function payoutStatus(finance) {
  const paid = totalPaid(finance);
  if (finance.feeAmount > 0 && paid === finance.feeAmount) return "paid";
  if (paid > 0) return "partial";
  return finance.processing ? "processing" : finance.requested ? "requested" : "not_requested";
}
function configureFinance(assignment, actor, amounts) {
  assertHQ(actor);
  if (![amounts.feeAmount, amounts.marketingAmount, amounts.productBenefitAmount].every(amountValid)) throw new Error("Nominal harus rupiah bulat non-negatif.");
  const finance = readFinance(assignment);
  if (amounts.feeAmount < totalPaid(finance)) throw new Error("Fee tidak boleh kurang dari payout yang sudah dibayar.");
  return update(assignment, { ...finance, ...amounts });
}
function requestPayout(assignment, actor, id) {
  if (actor.product !== "creator" || actor.id !== assignment.creatorId) throw new Error("Hanya Creator pemilik assignment dapat mengajukan payout.");
  const finance = readFinance(assignment);
  if (!id.trim() || finance.feeAmount <= totalPaid(finance)) throw new Error("Tidak ada sisa fee untuk diajukan.");
  if (finance.requested) return assignment;
  return update(assignment, { ...finance, requested: { id, requestedBy: actor.id } });
}
function processPayout(assignment, actor) {
  assertHQ(actor);
  const finance = readFinance(assignment);
  if (!finance.requested || finance.feeAmount <= totalPaid(finance)) throw new Error("Payout belum diajukan atau sudah lunas.");
  return update(assignment, { ...finance, processing: true });
}
function recordPayout(assignment, actor, payment) {
  assertHQ(actor);
  const finance = readFinance(assignment), existing = finance.payments.find((item) => item.id === payment.id);
  const nextPayment = { ...payment, evidence: payment.evidence.trim() };
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(nextPayment)) throw new Error("ID payout sudah digunakan dengan rincian berbeda.");
    return assignment;
  }
  if (!payment.id.trim() || !finance.requested || !amountValid(payment.amount) || payment.amount <= 0 || !financeDate(payment.paidAt) || !nextPayment.evidence)
    throw new Error("Payout memerlukan pengajuan, nominal positif, tanggal dan referensi bukti.");
  const paid = totalPaid(finance) + payment.amount;
  if (!Number.isSafeInteger(paid) || paid > finance.feeAmount) throw new Error("Payout melebihi sisa fee Creator.");
  return update(assignment, { ...finance, processing: paid < finance.feeAmount, payments: [...finance.payments, nextPayment] });
}
function engagementRate(metrics2) {
  if (!metricNames.every((key) => metrics2[key] !== null && Number.isSafeInteger(metrics2[key]) && metrics2[key] >= 0) || !metrics2.views) return null;
  const numerator = metricNames.filter((key) => key !== "views").reduce((sum, key) => sum + metrics2[key], 0);
  return Number.isSafeInteger(numerator) ? numerator / metrics2.views * 100 : null;
}
function recordInsight(assignment, actor, snapshot) {
  if (actor.product !== "hq" && actor.id !== assignment.creatorId) throw new Error("Insight hanya milik assignment ini.");
  const deliverable = assignment.deliverables.find((item) => item.id === snapshot.deliverableId);
  const postedAt = getDeliveryExecution(assignment, snapshot.deliverableId).posting?.postedAt;
  if (!deliverable?.postingRequired || !postedAt || !financeDate(postedAt) || !financeDate(snapshot.capturedAt) || snapshot.capturedAt < postedAt)
    throw new Error("Insight memerlukan post dan tanggal pengambilan sesudah publikasi.");
  if (!snapshot.id.trim() || !metricNames.every((key) => snapshot.metrics[key] === null || amountValid(snapshot.metrics[key])))
    throw new Error("Metrik insight harus bilangan bulat non-negatif atau belum tersedia.");
  const finance = readFinance(assignment), existing = finance.insights.find((item) => item.id === snapshot.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(snapshot)) throw new Error("Snapshot insight tidak dapat diubah. Buat snapshot baru.");
    return assignment;
  }
  return update(assignment, { ...finance, insights: [...finance.insights, { ...snapshot, metrics: { ...snapshot.metrics } }] });
}
function insightReminder(postedAt, today, snapshots, deliverableId) {
  if (!postedAt || !financeDate(postedAt) || !financeDate(today)) return { dueAt: null, due: false };
  const date = /* @__PURE__ */ new Date(postedAt + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + 7);
  const dueAt = date.toISOString().slice(0, 10);
  return { dueAt, due: today >= dueAt && !snapshots.some((item) => item.deliverableId === deliverableId && item.capturedAt >= dueAt) };
}
function assertFinanceMutation(previous, next, actor) {
  const before = readFinance(previous), after = readFinance(next);
  const same2 = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  if (same2(before, after)) return;
  if (actor.product !== "hq" && actor.id !== previous.creatorId) throw new Error("Keuangan assignment tidak tersedia.");
  const prefix = (oldItems, newItems) => newItems.length >= oldItems.length && oldItems.every((item, index) => same2(item, newItems[index]));
  if (!prefix(before.payments, after.payments) || !prefix(before.insights, after.insights)) throw new Error("Riwayat payout dan insight tidak boleh diubah atau dihapus.");
  if (actor.product === "creator") {
    if (!same2([before.feeAmount, before.marketingAmount, before.productBenefitAmount, before.processing, before.payments], [after.feeAmount, after.marketingAmount, after.productBenefitAmount, after.processing, after.payments]))
      throw new Error("Creator tidak dapat mengubah nominal atau pembayaran HQ.");
    if (!same2(before.requested, after.requested)) {
      if (before.requested || !after.requested || !same2(readFinance(requestPayout(previous, actor, after.requested.id)).requested, after.requested))
        throw new Error("Pengajuan payout tidak valid.");
    }
  } else {
    if (!same2(before.requested, after.requested)) throw new Error("HQ tidak dapat mengubah pengajuan payout Creator.");
    configureFinance(previous, actor, { feeAmount: after.feeAmount, marketingAmount: after.marketingAmount, productBenefitAmount: after.productBenefitAmount });
    let checked = { ...previous, finance: { ...before, feeAmount: after.feeAmount, marketingAmount: after.marketingAmount, productBenefitAmount: after.productBenefitAmount } };
    for (const payment of after.payments.slice(before.payments.length)) checked = recordPayout(checked, actor, payment);
    if (!same2(readFinance(checked).payments, after.payments)) throw new Error("ID payout harus unik dan rincian harus valid.");
    if (after.processing !== before.processing && after.payments.length === before.payments.length) {
      if (!after.processing) throw new Error("Status diproses tidak dapat dihapus tanpa pembayaran.");
      processPayout(previous, actor);
    }
    if (after.payments.length > before.payments.length && after.processing !== readFinance(checked).processing) throw new Error("Status payout tidak sesuai ledger.");
  }
  let checkedInsights = previous;
  for (const snapshot of after.insights.slice(before.insights.length)) checkedInsights = recordInsight(checkedInsights, actor, snapshot);
  if (readFinance(checkedInsights).insights.length !== after.insights.length) throw new Error("ID snapshot insight harus unik.");
}

// 1.Frontend/HOTS/src/features/cineva-campaigns/repository.ts
var clone = (value) => JSON.parse(JSON.stringify(value));
function createCampaignRepository(storage) {
  const key = "campaigns", listeners = /* @__PURE__ */ new Set();
  const assertActor = (actor) => {
    if (!["hq", "creator"].includes(actor.product) || ![`${actor.product}-1`, `${actor.product}-2`].includes(actor.id)) throw new Error("Identitas dummy tidak dikenal.");
  };
  const read = () => {
    const saved = storage.get(key), rows = saved === null || saved === void 0 ? campaignSeed() : saved;
    try {
      if (!Array.isArray(rows)) throw new Error();
      rows.forEach(validateCampaign);
    } catch {
      throw new Error("Data campaign dummy tidak valid. Jangan menimpa data; periksa penyimpanan browser.");
    }
    return clone(rows);
  };
  const write = (rows) => {
    rows.forEach(validateCampaign);
    const previous = read();
    storage.set(key, rows);
    if (JSON.stringify(storage.get(key)) !== JSON.stringify(rows)) {
      storage.set(key, previous);
      throw new Error("Campaign dummy belum tersimpan.");
    }
    listeners.forEach((listener) => listener());
  };
  const visible = (row, actor) => isHQOwner(actor, row) || actor.product === "creator" && row.assignments.some((item) => item.creatorId === actor.id);
  const assertNewAssignments = (assignments) => {
    if (assignments.some((item) => item.execution !== void 0 || item.finance !== void 0))
      throw new Error("Assignment baru harus tanpa progress atau ledger; gunakan tindakan operasional setelah dibuat.");
  };
  const project = (row, actor) => {
    const copy = clone(row);
    if (actor.product === "creator") {
      copy.assignments = copy.assignments.filter((item) => item.creatorId === actor.id).map((item) => {
        if (item.finance) delete item.finance.marketingAmount;
        return item;
      });
      const ownBatches = new Set(copy.assignments.map((item) => item.batchId));
      copy.batches = copy.batches.filter((batch) => ownBatches.has(batch.id));
    }
    return copy;
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getCampaigns(actor) {
      assertActor(actor);
      return read().filter((row) => visible(row, actor)).map((row) => project(row, actor));
    },
    get(id, actor) {
      assertActor(actor);
      const row = read().find((item) => item.id === id);
      if (!row || !visible(row, actor)) throw new Error("Campaign tidak tersedia.");
      return project(row, actor);
    },
    create(actor, row) {
      assertActor(actor);
      if (!isHQOwner(actor, row)) throw new Error("Hanya HQ pemilik dapat membuat campaign.");
      assertNewAssignments(row.assignments);
      const rows = read();
      if (rows.some((item) => item.id === row.id)) throw new Error("ID campaign sudah ada.");
      write([...rows, clone(row)]);
    },
    mutate(actor, id, update2, expectedRevision) {
      assertActor(actor);
      const rows = read(), row = rows.find((item) => item.id === id);
      if (!row || !isHQOwner(actor, row)) throw new Error("Hanya HQ pemilik dapat mengubah campaign.");
      if (expectedRevision !== void 0 && (row.revision ?? 0) !== expectedRevision) throw new Error("Campaign berubah. Muat kondisi terbaru.");
      const next = update2(clone(row));
      if (next.id !== row.id || next.ownerId !== row.ownerId) throw new Error("Identitas campaign tidak boleh berubah.");
      if (row.assignments.some((assignment) => JSON.stringify(next.assignments.find((item) => item.id === assignment.id)) !== JSON.stringify(assignment)))
        throw new Error("Assignment existing hanya diubah melalui tindakan assignment.");
      assertNewAssignments(next.assignments.filter((item) => !row.assignments.some((previous) => previous.id === item.id)));
      write(rows.map((item) => item.id === id ? { ...clone(next), revision: (row.revision ?? 0) + 1 } : item));
    },
    updateAssignment(actor, id, assignmentId, update2, expectedRevision) {
      assertActor(actor);
      const rows = read(), campaign = rows.find((item) => item.id === id), assignment = campaign?.assignments.find((item) => item.id === assignmentId);
      if (!campaign || !assignment || !(isHQOwner(actor, campaign) || actor.product === "creator" && assignment.creatorId === actor.id)) throw new Error("Assignment tidak tersedia.");
      if (expectedRevision !== void 0 && (campaign.revision ?? 0) !== expectedRevision) throw new Error("Campaign berubah. Muat kondisi terbaru.");
      const next = update2(clone(assignment));
      if (next.id !== assignment.id || next.creatorId !== assignment.creatorId || next.batchId !== assignment.batchId) throw new Error("Identitas assignment tidak boleh berubah.");
      if (assignment.execution || assignment.finance) {
        if (assignment.deliverables.some((deliverable) => JSON.stringify(next.deliverables.find((item) => item.id === deliverable.id)) !== JSON.stringify(deliverable)))
          throw new Error("Output yang memiliki progress atau ledger harus dipertahankan; tambahkan output baru.");
      }
      if (actor.product === "creator") {
        const stable = (value) => {
          const copy = clone(value);
          delete copy.execution;
          delete copy.finance;
          return copy;
        };
        if (JSON.stringify(stable(next)) !== JSON.stringify(stable(assignment))) throw new Error("Creator hanya dapat memperbarui pelaksanaan assignment sendiri.");
      }
      assertExecutionMutation(assignment, next, actor, campaign.products);
      assertFinanceMutation(assignment, next, actor);
      write(rows.map((item) => item.id === id ? { ...item, revision: (item.revision ?? 0) + 1, assignments: item.assignments.map((current) => current.id === assignmentId ? clone(next) : current) } : item));
    }
  };
}
var campaignRepository = createCampaignRepository(createAppStorage("cineva_campaigns_dummy_v1"));

// 3.Knowledge/scripts/cineva_campaigns_2026_10_18/finance.test.ts
var hq2 = { id: "hq-1", product: "hq" };
var creator2 = { id: "creator-1", product: "creator" };
var metrics = { likes: 10, comments: 2, shares: 3, saves: 4, reposts: 1, views: 200 };
function fixture2() {
  return {
    id: "talent-dummy",
    batchId: "batch-dummy",
    creatorId: creator2.id,
    creatorName: "Creator dummy",
    socialProfiles: [],
    deliverables: [{ id: "post-dummy", title: "Dummy post", platform: "Instagram", postingRequired: true, deadline: "2026-10-10" }],
    execution: { revision: 1, product: { choice: "unselected", fulfillment: "pending" }, deliverables: {
      "post-dummy": { status: "approved", drafts: [], reviews: [], posting: { url: "https://example.test/dummy-post", postedAt: "2026-10-10" } }
    } }
  };
}
(0, import_node_test2.default)("Creator cash fee, marketing and non-cash benefit remain separate from paid ledger", () => {
  let assignment = configureFinance(fixture2(), hq2, { feeAmount: 3e5, marketingAmount: 9e4, productBenefitAmount: 45e4 });
  assignment = requestPayout(assignment, creator2, "request-dummy");
  import_strict2.default.equal(payoutStatus(readFinance(assignment)), "requested");
  import_strict2.default.equal(totalPaid(readFinance(assignment)), 0);
  assignment = processPayout(assignment, hq2);
  import_strict2.default.equal(payoutStatus(readFinance(assignment)), "processing");
  import_strict2.default.equal(totalPaid(readFinance(assignment)), 0);
  assignment = recordPayout(assignment, hq2, { id: "payment-dummy", amount: 1e5, paidAt: "2026-10-12", evidence: "Dummy proof A" });
  import_strict2.default.equal(payoutStatus(readFinance(assignment)), "partial");
  import_strict2.default.equal(totalPaid(readFinance(assignment)), 1e5);
  assignment = recordPayout(assignment, hq2, { id: "payment-dummy-2", amount: 2e5, paidAt: "2026-10-13", evidence: "Dummy proof B" });
  import_strict2.default.equal(payoutStatus(readFinance(assignment)), "paid");
  import_strict2.default.equal(readFinance(assignment).productBenefitAmount, 45e4);
});
(0, import_node_test2.default)("Payout validates owner, HQ permissions, proof, date, exact retry and remaining fee", () => {
  const configured = configureFinance(fixture2(), hq2, { feeAmount: 3e5, marketingAmount: 0, productBenefitAmount: 0 });
  import_strict2.default.throws(() => requestPayout(configured, { ...creator2, id: "creator-2" }, "request"));
  import_strict2.default.throws(() => configureFinance(configured, creator2, { feeAmount: 1, marketingAmount: 0, productBenefitAmount: 0 }));
  const assignment = requestPayout(configured, creator2, "request-dummy");
  const payment = { id: "payment", amount: 1e5, paidAt: "2026-10-12", evidence: "Dummy proof" };
  for (const invalid of [{ ...payment, amount: Infinity }, { ...payment, amount: -1 }, { ...payment, amount: 300001 }, { ...payment, evidence: " " }, { ...payment, paidAt: "2026-02-31" }])
    import_strict2.default.throws(() => recordPayout(assignment, hq2, invalid));
  import_strict2.default.throws(() => recordPayout(assignment, creator2, payment));
  const paid = recordPayout(assignment, hq2, payment);
  import_strict2.default.equal(readFinance(recordPayout(paid, hq2, payment)).payments.length, 1);
  import_strict2.default.throws(() => recordPayout(paid, hq2, { ...payment, amount: 1 }));
  import_strict2.default.throws(() => configureFinance(paid, hq2, { feeAmount: 1, marketingAmount: 0, productBenefitAmount: 0 }));
  import_strict2.default.equal(readFinance(assignment).payments.length, 0);
});
(0, import_node_test2.default)("Engagement uses views percentage points and does not invent values for missing metrics", () => {
  import_strict2.default.equal(engagementRate(metrics), 10);
  import_strict2.default.equal(engagementRate({ ...metrics, views: 0 }), null);
  import_strict2.default.equal(engagementRate({ ...metrics, views: null }), null);
  import_strict2.default.equal(engagementRate({ ...metrics, shares: null }), null);
  import_strict2.default.equal(engagementRate({ ...metrics, likes: NaN }), null);
});
(0, import_node_test2.default)("Insight stores independent immutable snapshots, validates own post and rejects rewritten IDs", () => {
  const assignment = fixture2(), input = { id: "insight-dummy", deliverableId: "post-dummy", capturedAt: "2026-10-17", metrics: { ...metrics } };
  const next = recordInsight(assignment, creator2, input);
  input.metrics.likes = 999;
  import_strict2.default.equal(readFinance(next).insights[0].metrics.likes, 10);
  import_strict2.default.equal(readFinance(assignment).insights.length, 0);
  import_strict2.default.throws(() => recordInsight(next, creator2, input));
  import_strict2.default.throws(() => recordInsight(assignment, { ...creator2, id: "creator-2" }, input));
  import_strict2.default.throws(() => recordInsight(assignment, creator2, { ...input, capturedAt: "2026-10-09" }));
  import_strict2.default.throws(() => recordInsight({ ...assignment, execution: void 0 }, creator2, input));
  import_strict2.default.throws(() => recordInsight(assignment, creator2, { ...input, metrics: { ...metrics, views: Infinity } }));
});
(0, import_node_test2.default)("Insight H+7 is date-stable and requires a snapshot on or after the due date", () => {
  import_strict2.default.equal(financeDate("2026-02-31"), false);
  import_strict2.default.equal(financeDate("nonsense"), false);
  import_strict2.default.deepEqual(insightReminder("2026-10-10", "2026-10-16", [], "post"), { dueAt: "2026-10-17", due: false });
  import_strict2.default.equal(insightReminder("2026-10-10", "2026-10-17", [], "post").due, true);
  import_strict2.default.equal(insightReminder(void 0, "2026-10-17", [], "post").due, false);
  const snapshots = [{ id: "insight", deliverableId: "post", capturedAt: "2026-10-16", metrics }];
  import_strict2.default.equal(insightReminder("2026-10-10", "2026-10-17", snapshots, "post").due, true);
  import_strict2.default.equal(insightReminder("2026-10-10", "2026-10-17", [{ ...snapshots[0], capturedAt: "2026-10-17" }], "post").due, false);
  import_strict2.default.equal(insightReminder("2026-12-28", "2027-01-04", [], "post").dueAt, "2027-01-04");
});
(0, import_node_test2.default)("Repository mutation guard rejects financial bypass and rewritten/deleted/duplicated history", () => {
  const base = configureFinance(fixture2(), hq2, { feeAmount: 1e5, marketingAmount: 100, productBenefitAmount: 300 });
  const requested = requestPayout(base, creator2, "request");
  import_strict2.default.doesNotThrow(() => assertFinanceMutation(base, requested, creator2));
  import_strict2.default.throws(() => assertFinanceMutation(base, { ...base, finance: { ...readFinance(base), feeAmount: 1 } }, creator2));
  import_strict2.default.throws(() => assertFinanceMutation(base, requested, hq2));
  const paid = recordPayout(requested, hq2, { id: "paid", amount: 1e5, paidAt: "2026-10-12", evidence: "Dummy proof" });
  import_strict2.default.doesNotThrow(() => assertFinanceMutation(requested, paid, hq2));
  import_strict2.default.throws(() => assertFinanceMutation(paid, requested, hq2));
  import_strict2.default.throws(() => assertFinanceMutation(requested, paid, creator2));
  import_strict2.default.throws(() => assertFinanceMutation(paid, { ...paid, finance: { ...readFinance(paid), payments: [...readFinance(paid).payments, readFinance(paid).payments[0]] } }, hq2));
  const insight = recordInsight(base, creator2, { id: "snap", deliverableId: "post-dummy", capturedAt: "2026-10-17", metrics });
  import_strict2.default.doesNotThrow(() => assertFinanceMutation(base, insight, creator2));
  import_strict2.default.throws(() => assertFinanceMutation(insight, base, hq2));
});
(0, import_node_test2.default)("Repository persists HQ amounts, Creator request and partial payout while keeping projection private", () => {
  let data;
  const repo = createCampaignRepository({ get() {
    return structuredClone(data);
  }, set(_key, next) {
    data = structuredClone(next);
  } });
  const campaign = repo.getCampaigns(hq2)[0], assignment = campaign.assignments[0];
  const readHQ = () => repo.get(campaign.id, hq2).assignments.find((item) => item.id === assignment.id);
  repo.updateAssignment(hq2, campaign.id, assignment.id, (current) => configureFinance(current, hq2, { feeAmount: 3e5, marketingAmount: 9e4, productBenefitAmount: 45e4 }));
  import_strict2.default.equal(readFinance(readHQ()).feeAmount, 3e5);
  import_strict2.default.equal(readFinance(readHQ()).marketingAmount, 9e4);
  const projected = repo.get(campaign.id, creator2);
  import_strict2.default.equal(projected.assignments.length, 1);
  import_strict2.default.equal(Object.hasOwn(readFinance(projected.assignments[0]), "marketingAmount"), false);
  repo.updateAssignment(creator2, campaign.id, assignment.id, (current) => requestPayout(current, creator2, "request-integration"));
  import_strict2.default.equal(totalPaid(readFinance(readHQ())), 0);
  import_strict2.default.equal(payoutStatus(readFinance(readHQ())), "requested");
  repo.updateAssignment(hq2, campaign.id, assignment.id, (current) => processPayout(current, hq2));
  import_strict2.default.equal(totalPaid(readFinance(readHQ())), 0);
  const payment = { id: "payment-integration", amount: 1e5, paidAt: "2026-10-12", evidence: "Dummy reference" };
  repo.updateAssignment(hq2, campaign.id, assignment.id, (current) => recordPayout(current, hq2, payment));
  import_strict2.default.equal(totalPaid(readFinance(readHQ())), 1e5);
  import_strict2.default.equal(payoutStatus(readFinance(readHQ())), "partial");
  import_strict2.default.equal(readFinance(readHQ()).marketingAmount, 9e4);
  import_strict2.default.equal(readFinance(readHQ()).productBenefitAmount, 45e4);
  import_strict2.default.equal(Object.hasOwn(readFinance(repo.get(campaign.id, creator2).assignments[0]), "marketingAmount"), false);
  import_strict2.default.throws(() => repo.updateAssignment(hq2, campaign.id, assignment.id, (current) => ({ ...current, finance: { ...readFinance(current), payments: [] } })));
  import_strict2.default.throws(() => repo.updateAssignment(creator2, campaign.id, assignment.id, (current) => ({ ...current, finance: { ...readFinance(current), feeAmount: 999 } })));
});

// 3.Knowledge/scripts/cineva_campaigns_2026_10_18/foundation.test.ts
var import_node_test3 = __toESM(require("node:test"));
var import_strict3 = __toESM(require("node:assert/strict"));
var hq3 = { id: "hq-1", product: "hq" };
var creator3 = { id: "creator-1", product: "creator" };
function fixture3() {
  let saved, fail = false;
  const storage = { get: () => structuredClone(saved), set: (_key, value) => {
    if (!fail) saved = structuredClone(value);
  } };
  return { repo: createCampaignRepository(storage), storage, fail: () => {
    fail = true;
  } };
}
(0, import_node_test3.default)("Campaign HQ ownership and Creator assignment projection isolate both actors", () => {
  const { repo } = fixture3();
  import_strict3.default.equal(repo.getCampaigns(hq3).length, 1);
  import_strict3.default.equal(repo.getCampaigns({ id: "hq-2", product: "hq" }).length, 1);
  const campaigns = repo.getCampaigns(creator3);
  import_strict3.default.equal(campaigns.length, 2);
  import_strict3.default.ok(campaigns.every((row) => row.assignments.length === 1 && row.assignments[0].creatorId === creator3.id));
  import_strict3.default.throws(() => repo.get("campaign-demo-1", { id: "hq-2", product: "hq" }));
  import_strict3.default.throws(() => repo.mutate(creator3, "campaign-demo-1", (row) => row));
  import_strict3.default.throws(() => repo.updateAssignment(creator3, "campaign-demo-1", "assignment-1-2", (row) => row));
});
(0, import_node_test3.default)("Persistence reload, stale campaign revisions, identity changes and rejected storage writes", () => {
  const { repo, storage, fail } = fixture3();
  repo.mutate(hq3, "campaign-demo-1", (row) => ({ ...row, title: "Campaign revised" }), 0);
  import_strict3.default.equal(createCampaignRepository(storage).get("campaign-demo-1", hq3).title, "Campaign revised");
  import_strict3.default.throws(() => repo.mutate(hq3, "campaign-demo-1", (row) => ({ ...row, title: "Stale overwrite" }), 0));
  import_strict3.default.throws(() => repo.mutate(hq3, "campaign-demo-1", (row) => ({ ...row, ownerId: "hq-2" }), 1));
  fail();
  import_strict3.default.throws(() => repo.mutate(hq3, "campaign-demo-1", (row) => ({ ...row, title: "Not stored" }), 1));
  import_strict3.default.equal(repo.get("campaign-demo-1", hq3).title, "Campaign revised");
});
(0, import_node_test3.default)("Campaign validation preserves unknown followers and rejects invalid references/date/quantity", () => {
  const campaign = campaignSeed()[0];
  validateCampaign(campaign);
  import_strict3.default.equal(campaign.assignments[1].socialProfiles[0].followers, null);
  import_strict3.default.equal(validDate("2026-02-31"), false);
  import_strict3.default.equal(validDate("2026-99-01"), false);
  const bad = structuredClone(campaign);
  bad.assignments[0].batchId = "foreign";
  import_strict3.default.throws(() => validateCampaign(bad));
  const count = structuredClone(campaign);
  count.assignments[0].socialProfiles[0].followers = -1;
  import_strict3.default.throws(() => validateCampaign(count));
});
(0, import_node_test3.default)("Malformed saved campaign state produces actionable error and is never replaced with seed", () => {
  let writes = 0;
  const repo = createCampaignRepository({ get: () => ({ invalid: true }), set: () => {
    writes++;
  } });
  import_strict3.default.throws(() => repo.getCampaigns(hq3), /Data campaign dummy tidak valid/);
  import_strict3.default.equal(writes, 0);
});
(0, import_node_test3.default)("New campaign or assignment cannot smuggle progress or paid ledger into master writes", () => {
  const { repo } = fixture3(), campaign = campaignSeed()[0];
  const assignment = configureFinance(campaign.assignments[0], hq3, { feeAmount: 500, marketingAmount: 0, productBenefitAmount: 0 });
  import_strict3.default.throws(() => repo.create(hq3, { ...campaign, id: "new-campaign", assignments: [assignment] }), /Assignment baru/);
  import_strict3.default.throws(() => repo.mutate(hq3, campaign.id, (row) => ({ ...row, assignments: [...row.assignments, { ...assignment, id: "smuggled" }] }), 0), /Assignment baru/);
  import_strict3.default.equal(repo.get(campaign.id, hq3).assignments.length, 2);
});
(0, import_node_test3.default)("Assignment outputs become immutable once operations start; new output remains additive", () => {
  const { repo } = fixture3();
  repo.updateAssignment(hq3, "campaign-demo-1", "assignment-1-1", (row) => configureFinance(row, hq3, { feeAmount: 500, marketingAmount: 0, productBenefitAmount: 0 }), 0);
  import_strict3.default.throws(() => repo.updateAssignment(hq3, "campaign-demo-1", "assignment-1-1", (row) => ({ ...row, deliverables: row.deliverables.slice(1) }), 1), /Output/);
  import_strict3.default.throws(() => repo.updateAssignment(hq3, "campaign-demo-1", "assignment-1-1", (row) => ({ ...row, deliverables: row.deliverables.map((item) => ({ ...item, postingRequired: false })) }), 1), /Output/);
  repo.updateAssignment(hq3, "campaign-demo-1", "assignment-1-1", (row) => ({ ...row, deliverables: [...row.deliverables, { id: "extra", title: "Asset tambahan", platform: "Brand", postingRequired: false, deadline: "2026-10-28" }] }), 1);
  import_strict3.default.equal(repo.get("campaign-demo-1", hq3).assignments[0].deliverables.length, 3);
});
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
