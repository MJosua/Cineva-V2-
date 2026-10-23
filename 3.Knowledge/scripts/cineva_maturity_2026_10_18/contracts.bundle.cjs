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
        var ReactElement = function(type, key, ref, self, source, owner2, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner2
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
          var owner2 = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner2 = ReactCurrentOwner.current;
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
          return ReactElement(element.type, key, ref, self, source, owner2, props);
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
              var owner2 = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner2 ? owner2.type : null);
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
              var owner2 = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner2 ? owner2.type : null);
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
              var owner2 = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner2 ? owner2.type : null);
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
        var ReactElement = function(type, key, ref, self, source, owner2, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner2
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
              var owner2 = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner2 ? owner2.type : null);
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

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/workflow.test.ts
var import_node_test = __toESM(require("node:test"));
var import_strict = __toESM(require("node:assert/strict"));

// 1.Frontend/HOTS/src/features/cineva-services/catalog.ts
var services = {
  Campaign: { description: "Campaign berperiode dengan lingkup kerja dan deliverable.", base: 3e6, fields: [
    { name: "objective", label: "Tujuan campaign", type: "textarea", required: true },
    { name: "periodEnd", label: "Akhir periode campaign", type: "date", required: true },
    { name: "scopeOfWork", label: "SOW dan batas lingkup campaign (opsional)", type: "textarea" },
    { name: "deliverablePlan", label: "Rencana deliverable per periode (opsional)", type: "textarea" },
    { name: "reportingCadence", label: "Frekuensi laporan campaign (opsional)", type: "text" }
  ] },
  Production: { description: "Video graduation, iklan atau photoshoot birthday.", base: 75e5, fields: [
    { name: "occasion", label: "Kebutuhan produksi", type: "select", required: true, options: ["Graduation", "Iklan", "Birthday", "Lainnya"] },
    { name: "concept", label: "Konsep produksi", type: "textarea", required: true },
    { name: "preProduction", label: "Persiapan: script, storyboard, lokasi (opsional)", type: "textarea" },
    { name: "productionPlan", label: "Rencana shooting dan kebutuhan produksi (opsional)", type: "textarea" },
    { name: "postProduction", label: "Editing, format final dan revisi (opsional)", type: "textarea" }
  ] },
  "Content Shoot": { description: "Sesi pembuatan konten dengan fotografer atau videografer.", base: 15e5, fields: [
    { name: "platform", label: "Platform konten", type: "select", required: true, options: ["Instagram", "TikTok", "YouTube", "Multi-platform"] },
    { name: "sessionCount", label: "Jumlah sesi (opsional)", type: "number", minnumber: 1, maxnumber: 365 },
    { name: "sessionPlan", label: "Rincian sesi, shot list dan output (opsional)", type: "textarea" },
    { name: "sessionNotes", label: "Ketentuan lokasi dan persiapan sesi (opsional)", type: "textarea" }
  ] }
};
var serviceTypes = Object.keys(services);
function briefSchema(type) {
  return { title: "Brief layanan", fields: [
    { name: "title", label: "Judul permintaan", type: "text", required: true },
    { name: "brand", label: "Brand / client", type: "text", required: true },
    { name: "contact", label: "Kontak PIC", type: "text", required: true },
    { name: "location", label: "Lokasi", type: "text", required: true },
    { name: "scheduledAt", label: "Jadwal layanan (WIB)", type: "datetime", required: true },
    { name: "durationHours", label: "Durasi layanan (jam)", type: "number", required: true, minnumber: 1, maxnumber: 24 },
    { name: "deliverables", label: "Deliverable yang diminta", type: "textarea", required: true },
    { name: "specialist", label: "Jasa tenaga", type: "select", required: true, options: ["Videografer", "Fotografer", "Keduanya"] },
    { name: "days", label: "Jumlah hari produksi", type: "number", required: true, minnumber: 1, maxnumber: 365 },
    { name: "crew", label: "Jumlah crew", type: "number", required: true, minnumber: 1, maxnumber: 100 },
    { name: "gear", label: "Jumlah unit gear", type: "number", required: true, minnumber: 0, maxnumber: 100 },
    { name: "budget", label: "Budget indikatif (Rp)", type: "number", required: true, minnumber: 0 },
    ...services[type].fields
  ] };
}

// 1.Frontend/HOTS/src/features/cineva-services/workflow.ts
var serviceStages = {
  Campaign: [
    { id: "scope", label: "SOW & periode", description: "Sepakati lingkup, periode dan rencana deliverable." },
    { id: "execution", label: "Pelaksanaan campaign", description: "Jalankan deliverable sesuai rencana periode." },
    { id: "reporting", label: "Review & laporan", description: "Periksa hasil dan laporan campaign dengan client." },
    { id: "completed", label: "Campaign selesai", description: "Lingkup campaign selesai; pembayaran dicatat terpisah." }
  ],
  Production: [
    { id: "preproduction", label: "Pra-produksi", description: "Siapkan konsep, script, storyboard dan lokasi." },
    { id: "production", label: "Produksi", description: "Laksanakan shooting sesuai brief dan resource yang disepakati." },
    { id: "postproduction", label: "Pascaproduksi", description: "Editing, revisi dan pemeriksaan format output." },
    { id: "delivery", label: "Penyerahan hasil", description: "Konfirmasi hasil final telah diserahkan kepada client." },
    { id: "completed", label: "Produksi selesai", description: "Tahapan produksi selesai; pembayaran dicatat terpisah." }
  ],
  "Content Shoot": [
    { id: "preparation", label: "Persiapan sesi", description: "Konfirmasi shot list, lokasi dan kebutuhan setiap sesi." },
    { id: "session", label: "Pelaksanaan sesi", description: "Jalankan sesi foto/video sesuai jadwal dan durasi." },
    { id: "selection", label: "Seleksi & editing", description: "Seleksi hasil dan siapkan output konten." },
    { id: "completed", label: "Sesi selesai", description: "Hasil sesi selesai; pembayaran dicatat terpisah." }
  ]
};
function stagesFor(type) {
  const stages = serviceStages[type];
  if (!stages) throw new Error("Jenis layanan workflow tidak valid.");
  return stages;
}
function getServiceWorkflow(type, state) {
  const stages = stagesFor(type);
  if (!state) return { stage: stages[0].id, history: [stages[0].id] };
  const index = stages.findIndex((stage) => stage.id === state.stage);
  if (index < 0 || !Array.isArray(state.history) || state.history.length !== index + 1 || !state.history.every((id, i) => stages[i]?.id === id))
    throw new Error("Riwayat workflow layanan tidak valid; periksa data project.");
  return { stage: state.stage, history: [...state.history] };
}
function transitionServiceWorkflow(type, state, next) {
  const stages = stagesFor(type), current = getServiceWorkflow(type, state);
  const index = stages.findIndex((stage) => stage.id === current.stage);
  if (stages[index + 1]?.id !== next) throw new Error("Tahapan layanan harus berurutan dan belum selesai.");
  return { stage: next, history: [...current.history, next] };
}
function advanceServiceWorkflow(type, state) {
  const stages = stagesFor(type), current = getServiceWorkflow(type, state);
  const next = stages[stages.findIndex((stage) => stage.id === current.stage) + 1];
  if (!next) throw new Error("Seluruh tahapan layanan sudah selesai.");
  return transitionServiceWorkflow(type, current, next.id);
}
function validateServiceDetails(type, brief) {
  stagesFor(type);
  const count = brief.sessionCount;
  if (type === "Content Shoot" && count !== void 0 && count !== null && String(count).trim() !== "" && (!["number", "string"].includes(typeof count) || !Number.isSafeInteger(Number(count)) || Number(count) < 1 || Number(count) > 365))
    throw new Error("Jumlah sesi harus bilangan bulat antara 1 dan 365.");
}

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/workflow.test.ts
(0, import_node_test.default)("Legacy briefs remain valid with optional service details, scoped by service type", () => {
  for (const type of ["Campaign", "Production", "Content Shoot"]) {
    validateServiceDetails(type, {});
    const fields = briefSchema(type).fields;
    import_strict.default.equal(new Set(fields.map((field) => field.name)).size, fields.length);
    const added = ["scopeOfWork", "deliverablePlan", "reportingCadence", "preProduction", "productionPlan", "postProduction", "sessionCount", "sessionPlan", "sessionNotes"];
    import_strict.default.ok(fields.filter((field) => added.includes(field.name)).every((field) => !field.required));
  }
  import_strict.default.ok(briefSchema("Campaign").fields.some((field) => field.name === "scopeOfWork"));
  import_strict.default.ok(!briefSchema("Production").fields.some((field) => field.name === "sessionCount"));
  import_strict.default.ok(!briefSchema("Content Shoot").fields.some((field) => field.name === "postProduction"));
});
(0, import_node_test.default)("Session count rejects invalid quantities and keeps absent legacy values valid", () => {
  for (const count of [void 0, null, "", 1, "2", 365]) validateServiceDetails("Content Shoot", { sessionCount: count });
  for (const count of [0, -1, 1.5, 366, "many", Infinity, true])
    import_strict.default.throws(() => validateServiceDetails("Content Shoot", { sessionCount: count }));
});
(0, import_node_test.default)("Each service follows its own sequence and rejects skipping, repeating, reverse and terminal updates", () => {
  for (const type of ["Campaign", "Production", "Content Shoot"]) {
    let state = getServiceWorkflow(type);
    import_strict.default.throws(() => transitionServiceWorkflow(type, state, serviceStages[type][2].id));
    import_strict.default.throws(() => transitionServiceWorkflow(type, state, state.stage));
    while (state.stage !== "completed") {
      const before = structuredClone(state), next = advanceServiceWorkflow(type, state);
      import_strict.default.deepEqual(state, before);
      import_strict.default.equal(next.history.length, state.history.length + 1);
      state = next;
    }
    import_strict.default.throws(() => advanceServiceWorkflow(type, state));
    import_strict.default.throws(() => transitionServiceWorkflow(type, state, serviceStages[type][0].id));
  }
});
(0, import_node_test.default)("Workflow rejects foreign service stages and corrupted history; reads return independent copies", () => {
  const campaign = advanceServiceWorkflow("Campaign");
  import_strict.default.throws(() => getServiceWorkflow("Production", campaign));
  import_strict.default.throws(() => getServiceWorkflow("Campaign", { stage: "completed", history: ["completed"] }));
  const copy2 = getServiceWorkflow("Campaign", campaign);
  copy2.history.push("bad");
  import_strict.default.equal(campaign.history.length, 2);
  import_strict.default.equal(getServiceWorkflow("Production").stage, "preproduction");
  import_strict.default.equal(getServiceWorkflow("Content Shoot").stage, "preparation");
});

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/quotes.test.ts
var import_node_test2 = __toESM(require("node:test"));
var import_strict2 = __toESM(require("node:assert/strict"));

// 1.Frontend/HOTS/src/features/cineva-services/pricing.ts
var defaultRates = {
  version: "DUMMY-1",
  crew: 35e4,
  gear: 25e4,
  base: { Campaign: services.Campaign.base, Production: services.Production.base, "Content Shoot": services["Content Shoot"].base }
};
function estimate(type, days, crew, gear, rates, revision = 1) {
  if (!services[type] || ![days, crew, gear].every(Number.isSafeInteger) || days < 1 || days > 365 || crew < 1 || crew > 100 || gear < 0 || gear > 100)
    throw new Error("Jumlah hari/crew/gear tidak valid.");
  if (!rates.version.trim() || ![rates.base[type], rates.crew, rates.gear].every((n) => Number.isSafeInteger(n) && n >= 0))
    throw new Error("Tarif dummy harus rupiah bulat non-negatif dan memiliki versi.");
  const items = [
    { label: type, quantity: 1, rate: rates.base[type] },
    { label: "Crew \xD7 hari", quantity: crew * days, rate: rates.crew },
    { label: "Gear \xD7 hari", quantity: gear * days, rate: rates.gear }
  ].map((i) => ({ ...i, subtotal: i.quantity * i.rate }));
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  if (!Number.isSafeInteger(total)) throw new Error("Total quote di luar batas nominal.");
  return { revision, rateVersion: rates.version, scope: { days, crew, gear }, items, total };
}

// 1.Frontend/HOTS/src/features/cineva-inquiries/quotes.ts
var copy = (quote) => ({ ...quote, ...quote.scope ? { scope: { ...quote.scope } } : {}, items: quote.items.map((item) => ({ ...item })) });
function snapshotQuoteHistory(row) {
  const history = (row.quoteHistory ?? []).map(copy);
  const saved = history.find((quote) => quote.revision === row.quote.revision);
  if (saved && JSON.stringify(saved) !== JSON.stringify(row.quote)) throw new Error("Snapshot penawaran tidak boleh berubah.");
  if (!saved) history.push(copy(row.quote));
  return history;
}
function requestQuoteChanges(row, actor, reason, revision) {
  if (row.owner !== actor.id || row.status !== "quoted") throw new Error("Hanya pemilik dapat meminta perubahan penawaran aktif.");
  if (revision !== row.quote.revision) throw new Error("Penawaran telah berubah. Baca revisi terbaru.");
  const text = reason.trim();
  if (!text || text.length > 2e3) throw new Error("Jelaskan perubahan yang diminta (maksimal 2.000 karakter).");
  return {
    ...row,
    status: "changes_requested",
    quoteHistory: snapshotQuoteHistory(row),
    quoteChangeRequests: [...row.quoteChangeRequests ?? [], { revision, owner: actor.id, reason: text }]
  };
}
function reviseQuote(row, actor, rates, scope = row.quote.scope ?? { days: Number(row.brief.days), crew: Number(row.brief.crew), gear: Number(row.brief.gear) }) {
  if (actor.product !== "hq" || actor.id !== row.destination || !["reviewing", "changes_requested"].includes(row.status))
    throw new Error("Hanya HQ tujuan dapat merevisi penawaran yang sedang direview.");
  if (row.acceptedQuoteRevision !== void 0) throw new Error("Penawaran yang disetujui terkunci.");
  const quote = estimate(row.type, scope.days, scope.crew, scope.gear, rates, row.quote.revision + 1);
  return { ...row, status: "reviewing", quoteHistory: snapshotQuoteHistory(row), quote };
}
function acceptQuoteRevision(row, actor, revision) {
  if (row.owner !== actor.id || row.status !== "quoted") throw new Error("Pemilik permintaan yang menyetujui quote.");
  if (revision !== row.quote.revision) throw new Error("Penawaran telah berubah. Baca revisi terbaru sebelum menyetujui.");
  return { ...row, status: "accepted", quoteHistory: snapshotQuoteHistory(row), acceptedQuoteRevision: revision };
}
function acceptedQuoteSnapshot(row) {
  if (row.status !== "accepted") throw new Error("Quote harus disetujui sebelum menjadi project.");
  const revision = row.acceptedQuoteRevision ?? row.quote.revision;
  const accepted = row.quoteHistory?.find((quote) => quote.revision === revision);
  if (revision !== row.quote.revision || row.acceptedQuoteRevision !== void 0 && !accepted)
    throw new Error("Revisi penawaran yang disetujui tidak konsisten.");
  if (accepted && JSON.stringify(accepted) !== JSON.stringify(row.quote)) throw new Error("Penawaran yang disetujui tidak boleh berubah.");
  return copy(accepted ?? row.quote);
}

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/quotes.test.ts
var owner = { id: "creator-1", product: "creator" };
var hq = { id: "hq-1", product: "hq" };
function fixture() {
  return {
    id: "quote-1",
    owner: owner.id,
    destination: hq.id,
    type: "Production",
    brief: { days: 2, crew: 3, gear: 1 },
    status: "quoted",
    quote: estimate("Production", 2, 3, 1, defaultRates),
    support: "ai",
    messages: []
  };
}
(0, import_node_test2.default)("Quote change request is owner-scoped, reason-required and pinned to displayed revision", () => {
  const row = fixture();
  import_strict2.default.throws(() => requestQuoteChanges(row, hq, "Lower gear", 1));
  import_strict2.default.throws(() => requestQuoteChanges(row, owner, " ", 1));
  import_strict2.default.throws(() => requestQuoteChanges(row, owner, "Lower gear", 0));
  const next = requestQuoteChanges(row, owner, "  Lower gear  ", 1);
  import_strict2.default.equal(next.status, "changes_requested");
  import_strict2.default.deepEqual(next.quoteChangeRequests, [{ revision: 1, owner: owner.id, reason: "Lower gear" }]);
  import_strict2.default.equal(row.status, "quoted");
});
(0, import_node_test2.default)("HQ revisions retain immutable snapshots and require explicit resending", () => {
  const row = requestQuoteChanges(fixture(), owner, "Lower fee", 1);
  const next = reviseQuote(row, hq, { ...defaultRates, version: "DUMMY-2", gear: 0 });
  import_strict2.default.equal(next.status, "reviewing");
  import_strict2.default.equal(next.quote.revision, 2);
  import_strict2.default.equal(next.quoteHistory?.[0].total, row.quote.total);
  import_strict2.default.equal(next.quote.total, next.quote.items.reduce((sum, item) => sum + item.subtotal, 0));
  next.quoteHistory[0].items[0].rate = 0;
  import_strict2.default.notEqual(row.quote.items[0].rate, 0);
  import_strict2.default.throws(() => reviseQuote(row, { ...hq, id: "hq-2" }, defaultRates));
  import_strict2.default.throws(() => reviseQuote(fixture(), hq, defaultRates));
});
(0, import_node_test2.default)("Acceptance rejects stale revisions and locks the exact snapshot used for project conversion", () => {
  const revised = reviseQuote(requestQuoteChanges(fixture(), owner, "Lower fee", 1), hq, { ...defaultRates, version: "DUMMY-2", gear: 0 });
  const sent = { ...revised, status: "quoted" };
  import_strict2.default.throws(() => acceptQuoteRevision(sent, owner, 1));
  const accepted = acceptQuoteRevision(sent, owner, 2);
  import_strict2.default.equal(accepted.acceptedQuoteRevision, 2);
  import_strict2.default.equal(acceptedQuoteSnapshot(accepted).total, sent.quote.total);
  import_strict2.default.throws(() => reviseQuote(accepted, hq, defaultRates));
  import_strict2.default.throws(() => acceptedQuoteSnapshot({ ...accepted, quote: { ...accepted.quote, total: 1 } }));
  import_strict2.default.throws(() => acceptedQuoteSnapshot({ ...accepted, quoteHistory: [] }));
  import_strict2.default.throws(() => acceptedQuoteSnapshot({ ...accepted, acceptedQuoteRevision: 99 }));
});
(0, import_node_test2.default)("Legacy accepted records remain readable, snapshot tampering and duplicate revision mutation fail", () => {
  const old = { ...fixture(), status: "accepted" };
  import_strict2.default.deepEqual(acceptedQuoteSnapshot(old), old.quote);
  const saved = { ...fixture(), quoteHistory: [fixture().quote] };
  saved.quote = { ...saved.quote, total: 1 };
  import_strict2.default.throws(() => snapshotQuoteHistory(saved));
});

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/operations.test.ts
var import_node_test3 = __toESM(require("node:test"));
var import_strict3 = __toESM(require("node:assert/strict"));

// 1.Frontend/HOTS/src/features/cineva-shared/model.ts
var jobDate = (value) => /* @__PURE__ */ new Date(value + "+07:00");
function validateDraft(draft, workspace2, excludeId) {
  if (!draft.title.trim() || !workspace2.clients.some((c) => c.id === draft.clientId))
    throw new Error("Judul dan client wajib diisi.");
  if (!["Campaign", "Production", "Content Shoot"].includes(draft.type))
    throw new Error("Jenis project tidak valid.");
  if (!draft.platform.trim() || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.scheduledAt) || !Number.isFinite(jobDate(draft.scheduledAt).getTime()) || jobDate(draft.scheduledAt).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) !== draft.scheduledAt.slice(0, 10))
    throw new Error("Platform dan jadwal wajib valid.");
  if (![draft.fee, draft.barter].every((n) => Number.isSafeInteger(n) && n >= 0) || !Number.isFinite(draft.durationHours) || draft.durationHours <= 0 || draft.durationHours > 24)
    throw new Error("Nominal harus rupiah bulat positif dan durasi 1\u201324 jam.");
  if (draft.resourceIds.some((id) => !workspace2.resources.some((r) => r.id === id)))
    throw new Error("Resource tidak ditemukan di workspace ini.");
  const start = jobDate(draft.scheduledAt).getTime(), end = start + draft.durationHours * 36e5;
  const clash = workspace2.jobs.find((job) => !job.archived && job.id !== excludeId && job.resourceIds.some((id) => draft.resourceIds.includes(id)) && start < jobDate(job.scheduledAt).getTime() + job.durationHours * 36e5 && end > jobDate(job.scheduledAt).getTime());
  if (clash)
    throw new Error(`Jadwal resource bertabrakan dengan ${clash.title}.`);
}
function createJob(draft, workspace2, id) {
  validateDraft(draft, workspace2);
  if (workspace2.product === "creator" && workspace2.plan === "starter" && workspace2.jobs.filter((j) => !j.archived && j.status !== "done").length >= 3)
    throw new Error("Batas Starter: 3 job aktif. Coba simulasi Pro di halaman Paket.");
  return { ...draft, title: draft.title.trim(), id, ticketId: `DUMMY-${id}`, status: "running", paid: 0, archived: false, deliverables: [] };
}

// 1.Frontend/HOTS/src/features/cineva-inquiries/domain.ts
function canRead(row, actor) {
  return actor.product === "hq" ? row.destination === actor.id : row.owner === actor.id;
}
function validateBrief(type, brief) {
  for (const field of briefSchema(type).fields) {
    if (field.required && !String(brief[field.name] ?? "").trim()) throw new Error(`Lengkapi ${field.label}.`);
    if (field.type === "select" && (field.required || String(brief[field.name] ?? "").trim()) && !field.options?.some((option) => String(typeof option === "object" ? option.value : option) === String(brief[field.name])))
      throw new Error(`Pilihan ${field.label} tidak valid.`);
  }
  const date = String(brief.scheduledAt), parsed = /* @__PURE__ */ new Date(date + "+07:00");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) !== date.slice(0, 10))
    throw new Error("Jadwal layanan tidak valid.");
  if (!Number.isSafeInteger(Number(brief.budget)) || Number(brief.budget) < 0 || !Number.isFinite(Number(brief.durationHours)) || Number(brief.durationHours) < 1 || Number(brief.durationHours) > 24)
    throw new Error("Budget/durasi tidak valid.");
  const periodEnd = String(brief.periodEnd), endDate = /* @__PURE__ */ new Date(periodEnd + "T00:00:00+07:00");
  if (type === "Campaign" && (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) || !Number.isFinite(endDate.getTime()) || endDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) !== periodEnd || periodEnd < date.slice(0, 10)))
    throw new Error("Akhir periode campaign harus sesudah tanggal mulai.");
  validateServiceDetails(type, brief);
}
var allowed = {
  submitted: ["reviewing", "rejected", "cancelled"],
  reviewing: ["quoted", "rejected", "cancelled"],
  quoted: ["accepted", "rejected", "cancelled"],
  changes_requested: ["reviewing", "rejected", "cancelled"],
  accepted: [],
  rejected: [],
  cancelled: []
};
function transition(row, next, actor) {
  if (!canRead(row, actor) || !allowed[row.status].includes(next)) throw new Error("Transisi inquiry tidak diizinkan.");
  if (["reviewing", "quoted", "rejected"].includes(next) && actor.product !== "hq") throw new Error("Hanya HQ tujuan dapat mereview.");
  if (next === "accepted" && row.owner !== actor.id) throw new Error("Pemilik permintaan yang menyetujui quote.");
  return next === "accepted" ? acceptQuoteRevision(row, actor, row.quote.revision) : { ...row, status: next };
}
function convertInquiry(row, workspace2) {
  if (row.status !== "accepted" || workspace2.product !== "hq") throw new Error("Quote harus disetujui sebelum menjadi project.");
  const quote = acceptedQuoteSnapshot(row);
  const agreedBrief = { ...row.brief, ...quote.scope };
  const id = `inquiry-${row.id}`;
  if (workspace2.jobs.some((job2) => job2.id === id)) return workspace2;
  const clientId = `inquiry-client-${row.id}`;
  const current = { ...workspace2, clients: [...workspace2.clients, { id: clientId, name: String(row.brief.brand), contact: String(row.brief.contact), email: "" }] };
  const job = {
    ...createJob({
      title: String(row.brief.title),
      clientId,
      type: row.type,
      platform: String(row.brief.platform || "Multi-platform"),
      scheduledAt: String(row.brief.scheduledAt),
      durationHours: Number(row.brief.durationHours),
      fee: quote.total,
      barter: 0,
      brief: briefSchema(row.type).fields.map((field) => `${field.label}: ${String(agreedBrief[field.name] ?? "")}`).join("\n"),
      resourceIds: []
    }, current, id),
    sourceInquiryId: row.id,
    sourceQuote: quote,
    requiredRoles: row.brief.specialist === "Fotografer" ? ["photographer"] : row.brief.specialist === "Keduanya" ? ["photographer", "videographer"] : ["videographer"]
  };
  return { ...current, jobs: [...current.jobs, job] };
}

// 1.Frontend/HOTS/src/features/cineva-support/assignment.ts
function changeSupport(row, actor, next, options = {}) {
  if (!canRead(row, actor)) throw new Error("Percakapan tidak tersedia di workspace ini.");
  const agent = next === "human" ? options.agent?.trim() : void 0;
  if (next === "human" && (actor.product !== "hq" || !agent || agent.length > 100))
    throw new Error("Penugasan memerlukan agen HQ yang valid.");
  if (next === "resolved" && (actor.product !== "hq" || row.support !== "human"))
    throw new Error("Agen HQ menyelesaikan percakapan manusia terlebih dahulu.");
  if (next === "human" && !["waiting", "human"].includes(row.support))
    throw new Error("Minta bantuan manusia sebelum mengambil percakapan.");
  if (next === "waiting" && row.support === "resolved")
    throw new Error("Buka kembali percakapan ke AI sebelum handover.");
  if (row.support === next && row.agent === agent) return row;
  const id = options.eventId ?? crypto.randomUUID();
  const existing = row.supportEvents?.find((event) => event.id === id);
  if (existing) throw new Error("ID perubahan CS sudah digunakan.");
  const at = options.at ?? (/* @__PURE__ */ new Date()).toISOString();
  if (!Number.isFinite(Date.parse(at))) throw new Error("Waktu perubahan CS tidak valid.");
  return { ...row, support: next, agent, supportEvents: [
    ...row.supportEvents ?? [],
    { id, at, actor: actor.id, from: row.support, to: next, previousAgent: row.agent, agent }
  ] };
}
function filterSupportQueue(rows, actor, filter) {
  const search = filter.search.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) => canRead(row, actor) && (filter.mode === "all" || row.support === filter.mode) && (!filter.agent || row.agent === filter.agent) && (!search || [row.id, row.brief.title, row.brief.brand, row.agent, ...row.messages.map((message) => message.text)].some((value) => String(value ?? "").toLocaleLowerCase("id-ID").includes(search))));
}
function supportQueueCounts(rows, actor) {
  return rows.filter((row) => canRead(row, actor)).reduce((counts, row) => {
    counts[row.support] += 1;
    return counts;
  }, { ai: 0, waiting: 0, human: 0, resolved: 0 });
}

// 1.Frontend/HOTS/src/features/cineva-hq/booking.ts
var roleLabels = { photographer: "Fotografer", videographer: "Videografer" };
function allocationFingerprint(job) {
  return JSON.stringify([job.scheduledAt, job.durationHours, [...job.resourceIds].sort(), [...job.requiredRoles ?? []].sort()]);
}
function isBookingCurrent(job) {
  return Boolean(job.booking && job.booking.fingerprint === allocationFingerprint(job));
}
function invalidateBooking(job) {
  return job.booking && !isBookingCurrent(job) ? { ...job, booking: void 0 } : job;
}
function validateBooking(workspace2, jobId) {
  if (workspace2.product !== "hq") throw new Error("Booking resource hanya tersedia di HQ.");
  const job = workspace2.jobs.find((row) => row.id === jobId);
  if (!job || job.archived || job.status === "done") throw new Error("Pilih project aktif untuk booking.");
  validateDraft(job, workspace2, job.id);
  if (!job.resourceIds.length) throw new Error("Alokasikan crew dan resource sebelum konfirmasi booking.");
  if (new Set(job.resourceIds).size !== job.resourceIds.length) throw new Error("Resource yang sama tidak boleh dialokasikan dua kali.");
  const resources = workspace2.resources;
  for (const role of job.requiredRoles ?? []) {
    if (!Object.prototype.hasOwnProperty.call(roleLabels, role)) throw new Error("Kebutuhan spesialis tidak valid.");
    if (!resources.some((resource) => job.resourceIds.includes(resource.id) && resource.kind === "crew" && resource.role === role))
      throw new Error(`Alokasikan ${roleLabels[role]} yang tersedia sebelum konfirmasi booking.`);
  }
  return job;
}
function confirmBooking(workspace2, jobId, actorId, expectedFingerprint, at = (/* @__PURE__ */ new Date()).toISOString()) {
  const job = validateBooking(workspace2, jobId);
  if (!actorId.trim() || !Number.isFinite(Date.parse(at))) throw new Error("Agen dan waktu konfirmasi wajib valid.");
  if (allocationFingerprint(job) !== expectedFingerprint) throw new Error("Jadwal atau resource berubah. Periksa alokasi terbaru sebelum konfirmasi.");
  if (isBookingCurrent(job)) return workspace2;
  const confirmed = { ...job, booking: { fingerprint: expectedFingerprint, confirmedAt: at, confirmedBy: actorId } };
  return { ...workspace2, jobs: workspace2.jobs.map((row) => row.id === jobId ? confirmed : row) };
}

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/operations.test.ts
var hq2 = { id: "hq-1", product: "hq" };
var creator = { id: "creator-1", product: "creator" };
function inquiry() {
  return {
    id: "request",
    owner: creator.id,
    destination: hq2.id,
    type: "Production",
    brief: { title: "Graduation", brand: "Dummy" },
    status: "submitted",
    quote: { revision: 1, rateVersion: "DUMMY-1", items: [], total: 0 },
    support: "ai",
    messages: []
  };
}
function workspace() {
  const resources = [{ id: "photo", name: "Foto dummy", kind: "crew", role: "photographer" }, { id: "video", name: "Video dummy", kind: "crew", role: "videographer" }];
  const job = {
    id: "job",
    ticketId: "DUMMY-job",
    clientId: "client",
    title: "Shoot dummy",
    brief: "",
    type: "Production",
    status: "running",
    platform: "Instagram",
    scheduledAt: "2026-10-22T10:00",
    durationHours: 2,
    fee: 0,
    paid: 0,
    barter: 0,
    archived: false,
    deliverables: [],
    resourceIds: ["photo"],
    requiredRoles: ["photographer"]
  };
  return { product: "hq", plan: "starter", clients: [{ id: "client", name: "Dummy", contact: "", email: "" }], resources, jobs: [job] };
}
(0, import_node_test3.default)("CS queues scope workspace before searching/filtering and count waiting independently", () => {
  const waiting = changeSupport(inquiry(), creator, "waiting", { eventId: "handover" });
  const rows = [waiting, { ...waiting, id: "other", destination: "hq-2", owner: "creator-2" }];
  import_strict3.default.equal(supportQueueCounts(rows, hq2).waiting, 1);
  import_strict3.default.equal(filterSupportQueue(rows, hq2, { search: "GRADUATION", mode: "waiting", agent: "" }).length, 1);
  import_strict3.default.equal(filterSupportQueue(rows, hq2, { search: "", mode: "human", agent: "" }).length, 0);
});
(0, import_node_test3.default)("CS assignment records handover, reassignment, resolve and explicit return to AI", () => {
  let row = changeSupport(inquiry(), creator, "waiting", { eventId: "one" });
  row = changeSupport(row, hq2, "human", { agent: "Agent A", eventId: "two" });
  row = changeSupport(row, hq2, "human", { agent: "Agent B", eventId: "three" });
  import_strict3.default.equal(row.supportEvents?.at(-1)?.previousAgent, "Agent A");
  import_strict3.default.equal(filterSupportQueue([row], hq2, { search: "", mode: "all", agent: "Agent B" }).length, 1);
  import_strict3.default.throws(() => changeSupport(row, creator, "human", { agent: "Fake" }));
  import_strict3.default.throws(() => changeSupport(row, { ...hq2, id: "hq-2" }, "resolved"));
  row = changeSupport(row, hq2, "resolved", { eventId: "four" });
  row = changeSupport(row, creator, "ai", { eventId: "five" });
  import_strict3.default.equal(row.agent, void 0);
  import_strict3.default.equal(row.supportEvents?.length, 5);
  import_strict3.default.equal(changeSupport(row, creator, "ai"), row);
});
(0, import_node_test3.default)("Booking explicitly confirms and preserves legacy allocations without role requirements", () => {
  const data = workspace(), job = data.jobs[0];
  import_strict3.default.equal(isBookingCurrent(job), false);
  const result = confirmBooking(data, job.id, "HQ Agent", allocationFingerprint(job));
  import_strict3.default.equal(isBookingCurrent(result.jobs[0]), true);
  import_strict3.default.equal(confirmBooking(result, job.id, "HQ Agent", allocationFingerprint(job)), result);
  import_strict3.default.equal(isBookingCurrent(data.jobs[0]), false);
});
(0, import_node_test3.default)("Booking rejects missing specialist, overlaps and stale schedule acknowledgement", () => {
  const data = workspace(), job = data.jobs[0];
  import_strict3.default.throws(() => confirmBooking({ ...data, jobs: [{ ...job, resourceIds: ["video"] }] }, job.id, "HQ", allocationFingerprint(job)), /Fotografer/);
  import_strict3.default.throws(() => confirmBooking({ ...data, jobs: [{ ...job, resourceIds: [] }] }, job.id, "HQ", allocationFingerprint(job)), /Alokasikan/);
  const overlap = { ...job, id: "other", title: "Other job" };
  import_strict3.default.throws(() => confirmBooking({ ...data, jobs: [job, overlap] }, job.id, "HQ", allocationFingerprint(job)), /bertabrakan/);
  const changed = { ...job, scheduledAt: "2026-10-22T15:00" };
  import_strict3.default.throws(() => confirmBooking({ ...data, jobs: [changed] }, job.id, "HQ", allocationFingerprint(job)), /berubah/);
});
(0, import_node_test3.default)("Reallocation invalidates confirmation; contiguous resource sessions remain available", () => {
  const data = workspace(), job = data.jobs[0];
  const confirmed = confirmBooking(data, job.id, "HQ", allocationFingerprint(job)).jobs[0];
  import_strict3.default.equal(invalidateBooking({ ...confirmed, durationHours: 3 }).booking, void 0);
  import_strict3.default.equal(invalidateBooking(confirmed), confirmed);
  const next = { ...job, id: "next", scheduledAt: "2026-10-22T12:00" };
  import_strict3.default.equal(isBookingCurrent(confirmBooking({ ...data, jobs: [job, next] }, job.id, "HQ", allocationFingerprint(job)).jobs[0]), true);
  import_strict3.default.throws(() => confirmBooking({ ...data, product: "creator" }, job.id, "HQ", allocationFingerprint(job)));
});

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/contracts.test.ts
var import_node_test4 = __toESM(require("node:test"));
var import_strict4 = __toESM(require("node:assert/strict"));

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

// 1.Frontend/HOTS/src/features/cineva-inquiries/repository.ts
var demoIdentities = { creator: ["creator-1", "creator-2"], hq: ["hq-1", "hq-2"] };
var clone = (v) => JSON.parse(JSON.stringify(v));
function createInquiryRepository(storage) {
  const listeners = /* @__PURE__ */ new Set();
  const read = () => storage.get("shared-requests") ?? { requests: [], rates: {} };
  const write = (data, notify = true) => {
    const previous = read();
    storage.set("shared-requests", data);
    if (JSON.stringify(storage.get("shared-requests")) !== JSON.stringify(data)) {
      storage.set("shared-requests", previous);
      throw new Error("Penyimpanan inquiry dummy gagal.");
    }
    if (notify) listeners.forEach((fn) => fn());
  };
  const assertActor = (actor) => {
    if (!demoIdentities[actor.product].includes(actor.id)) throw new Error("Identitas dummy tidak dikenal.");
  };
  const get = (id, actor) => {
    assertActor(actor);
    const row = read().requests.find((r) => r.id === id);
    if (!row || !canRead(row, actor)) throw new Error("Inquiry tidak tersedia untuk workspace ini.");
    return clone(row);
  };
  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    list(actor) {
      assertActor(actor);
      return clone(read().requests.filter((r) => canRead(r, actor)));
    },
    get,
    draft(actor, destination) {
      assertActor(actor);
      return clone(read().drafts?.[`${actor.id}:${destination}`] ?? null);
    },
    saveDraft(actor, destination, draft) {
      assertActor(actor);
      const state = read(), drafts = { ...state.drafts }, key = `${actor.id}:${destination}`;
      if (draft) drafts[key] = clone(draft);
      else delete drafts[key];
      write({ ...state, drafts }, false);
    },
    rates(actor, destination = actor.id) {
      assertActor(actor);
      return clone(read().rates[destination] ?? defaultRates);
    },
    saveRates(actor, rates) {
      assertActor(actor);
      if (actor.product !== "hq") throw new Error("Hanya HQ dapat mengubah tarif sendiri.");
      for (const type of Object.keys(rates.base)) estimate(type, 1, 1, 0, rates);
      const state = read(), previous = state.rates[actor.id] ?? defaultRates;
      if (rates.version === previous.version && JSON.stringify(rates) !== JSON.stringify(previous)) throw new Error("Gunakan versi tarif baru saat mengubah harga.");
      write({ ...state, rates: { ...state.rates, [actor.id]: clone(rates) } });
    },
    create(id, actor, destination, type, values) {
      assertActor(actor);
      if (!demoIdentities.hq.includes(destination) || actor.product === "hq" && actor.id !== destination) throw new Error("HQ tujuan tidak valid.");
      const state = read(), existing = state.requests.find((r) => r.id === id);
      const brief = Object.fromEntries(briefSchema(type).fields.map((field) => [field.name, values[field.name] ?? ""]));
      if (existing) {
        if (existing.owner !== actor.id || existing.destination !== destination || existing.type !== type || JSON.stringify(existing.brief) !== JSON.stringify(brief)) throw new Error("ID request sudah digunakan. Buka permintaan tersimpan atau mulai brief baru.");
        return clone(existing);
      }
      validateBrief(type, brief);
      const quote = estimate(type, Number(brief.days), Number(brief.crew), Number(brief.gear), state.rates[destination] ?? defaultRates);
      const row = { id, owner: actor.id, destination, type, brief, quote, status: "submitted", support: "ai", messages: [] };
      write({ ...state, requests: [...state.requests, row] });
      return clone(row);
    },
    update(id, actor, change) {
      const row = get(id, actor), next = change(clone(row));
      if (next.id !== row.id || next.owner !== row.owner || next.destination !== row.destination) throw new Error("Ownership inquiry tidak boleh berubah.");
      if (row.status === "accepted") {
        if (next.status !== "accepted" || next.acceptedQuoteRevision !== row.acceptedQuoteRevision || JSON.stringify(acceptedQuoteSnapshot(row)) !== JSON.stringify(acceptedQuoteSnapshot(next)))
          throw new Error("Penawaran yang disetujui terkunci.");
      }
      for (const snapshot of row.quoteHistory ?? []) if (JSON.stringify(next.quoteHistory?.find((quote) => quote.revision === snapshot.revision)) !== JSON.stringify(snapshot))
        throw new Error("Riwayat versi penawaran tidak boleh diubah.");
      if (next.status === "accepted") acceptedQuoteSnapshot(next);
      const state = read();
      write({ ...state, requests: state.requests.map((r) => r.id === id ? next : r) });
      return clone(next);
    }
  };
}
var inquiryRepository = createInquiryRepository(createAppStorage("cineva_services_dummy_v1"));

// 1.Frontend/HOTS/src/features/cineva-shared/dummyRepository.ts
var clone2 = (value) => JSON.parse(JSON.stringify(value));
var specialists = [
  { id: "hq-photographer", name: "Fotografer dummy", kind: "crew", role: "photographer" },
  { id: "hq-videographer", name: "Videografer dummy", kind: "crew", role: "videographer" }
];
function upgrade(workspace2) {
  if (workspace2.product !== "hq") return workspace2;
  const resources = workspace2.resources ?? [];
  return { ...workspace2, resources: [...resources, ...specialists.filter((candidate) => !resources.some((resource) => resource.id === candidate.id))] };
}
function seed(product) {
  const prefix = product === "hq" ? "hq" : "creator";
  const clients = [{ id: `${prefix}-navi`, name: "Navi Cafe (Dummy)", contact: "Tim Navi", email: "navi@example.test" }, { id: `${prefix}-brand`, name: "Luma Studio (Dummy)", contact: "Tim Luma", email: "luma@example.test" }];
  const resources = product === "hq" ? [{ id: "hq-camera", name: "Kamera A", kind: "gear" }, { id: "hq-light", name: "Lighting kit", kind: "gear" }, { id: "hq-director", name: "Crew Director", kind: "crew" }, { id: "hq-editor", name: "Crew Editor", kind: "crew" }] : [];
  const shared = { archived: false, platform: "Instagram", brief: "Konten sintetis untuk preview Cineva.", durationHours: 2, deliverables: ["Draft brief dummy", "Preview deliverable CMS \u2014 belum terhubung"], resourceIds: [] };
  const jobs = [
    { ...shared, id: `${prefix}-1`, ticketId: `DUMMY-${prefix}-1`, clientId: clients[0].id, title: product === "hq" ? "Campaign Navi Oktober" : "Visit Navi Cafe", type: "Campaign", status: "running", scheduledAt: "2026-10-19T10:00", fee: product === "hq" ? 6e6 : 3e5, paid: 0, barter: 15e4, resourceIds: product === "hq" ? ["hq-camera", "hq-director"] : [] },
    { ...shared, id: `${prefix}-2`, ticketId: `DUMMY-${prefix}-2`, clientId: clients[1].id, title: product === "hq" ? "Production Luma DVC" : "Reels Luma Studio", type: "Production", status: "wait_pay", scheduledAt: "2026-10-20T09:00", fee: product === "hq" ? 12e6 : 5e5, paid: product === "hq" ? 4e6 : 2e5, barter: 0 },
    { ...shared, id: `${prefix}-3`, ticketId: `DUMMY-${prefix}-3`, clientId: clients[0].id, title: product === "hq" ? "Content Shoot Navi" : "Konten Navi selesai", type: "Content Shoot", status: "done", scheduledAt: "2026-10-16T14:00", fee: product === "hq" ? 2e6 : 2e5, paid: product === "hq" ? 2e6 : 2e5, barter: 1e5 }
  ];
  return upgrade({ product, clients, resources, jobs, plan: "starter" });
}
function createDummyRepository(namespace = "cineva_dummy_v1") {
  const storage = createAppStorage(namespace);
  return {
    async load(product) {
      const stored = storage.get(product);
      return clone2(upgrade(stored?.product === product && Array.isArray(stored.jobs) && Array.isArray(stored.clients) ? stored : seed(product)));
    },
    async save(workspace2) {
      const next = clone2(workspace2);
      storage.set(workspace2.product, next);
      if (JSON.stringify(storage.get(workspace2.product)) !== JSON.stringify(next))
        throw new Error("Penyimpanan dummy browser gagal. Data sebelumnya dipertahankan.");
    },
    async reset(product) {
      const data = seed(product);
      await this.save(data);
      return clone2(data);
    }
  };
}

// 1.Frontend/HOTS/src/features/cineva-support/support.ts
var dummySupportProvider = {
  async reply(brief) {
    return `Simulasi AI: brief ${String(brief.title)} diterima. Pastikan lokasi, jadwal dan deliverable sudah lengkap. Quote merupakan estimasi; pilih Bantuan manusia untuk berbicara dengan CS.`;
  }
};
function handover(row, actor = { id: row.owner, product: row.owner === row.destination ? "hq" : "creator" }) {
  return changeSupport(row, actor, "waiting");
}
async function sendSupport(repo, id, actor, text, provider = dummySupportProvider, messageId = crypto.randomUUID()) {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length > 2e3) throw new Error("Pesan wajib 1\u20132.000 karakter.");
  const row = repo.update(id, actor, (current) => {
    const previous = current.messages.find((message) => message.id === messageId);
    if (previous) {
      if (previous.actor !== actor.id || previous.text !== cleaned) throw new Error("ID pesan sudah digunakan untuk isi lain.");
      return current;
    }
    if (current.support === "resolved") throw new Error("Buka kembali percakapan terlebih dahulu.");
    if (actor.product === "hq" && current.support !== "human") throw new Error("Ambil percakapan sebagai agen terlebih dahulu.");
    return { ...current, messages: [...current.messages, { id: messageId, actor: actor.id, text: cleaned }] };
  });
  if (actor.product === "hq" || row.support !== "ai" || row.messages.some((message) => message.id === `${messageId}-ai`)) return;
  const reply = await provider.reply(row.brief, cleaned);
  repo.update(id, actor, (current) => {
    if (current.support !== "ai" || current.messages.at(-1)?.id !== messageId || (current.supportEvents?.length ?? 0) !== (row.supportEvents?.length ?? 0)) return current;
    if (!reply.trim() || reply.length > 4e3) throw new Error("Respons provider tidak valid.");
    return { ...current, messages: [...current.messages, { id: `${messageId}-ai`, actor: "AI dummy", text: reply }] };
  });
}

// 3.Knowledge/scripts/cineva_maturity_2026_10_18/contracts.test.ts
var creator2 = { product: "creator", id: "creator-1" };
var hq3 = { product: "hq", id: "hq-1" };
function fixture2() {
  let data;
  const repo = createInquiryRepository({ get: () => structuredClone(data), set: (_key, value) => {
    data = structuredClone(value);
  } });
  repo.create("maturity", creator2, hq3.id, "Content Shoot", { title: "Mature request", brand: "Dummy brand", contact: "PIC", location: "Studio", scheduledAt: "2026-10-23T10:00", durationHours: 2, deliverables: "Foto dan video", specialist: "Keduanya", days: 1, crew: 2, gear: 1, budget: 3e6, platform: "Instagram" });
  return repo;
}
(0, import_node_test4.default)("Repository guards accepted quote history and conversion retains approved version and role needs", async () => {
  const repo = fixture2();
  repo.update("maturity", hq3, (row2) => transition(row2, "reviewing", hq3));
  repo.update("maturity", hq3, (row2) => transition(row2, "quoted", hq3));
  repo.update("maturity", creator2, (row2) => transition(row2, "accepted", creator2));
  import_strict4.default.throws(() => repo.update("maturity", hq3, (row2) => ({ ...row2, quote: { ...row2.quote, total: 1 } })));
  import_strict4.default.throws(() => repo.update("maturity", hq3, (row2) => ({ ...row2, acceptedQuoteRevision: void 0 })));
  import_strict4.default.throws(() => repo.update("maturity", hq3, (row2) => {
    row2.quote.total += 1;
    row2.quoteHistory.find((quote) => quote.revision === row2.acceptedQuoteRevision).total += 1;
    return row2;
  }));
  const row = repo.get("maturity", creator2), workspace2 = await createDummyRepository().load("hq");
  const job = convertInquiry(row, workspace2).jobs.at(-1);
  import_strict4.default.equal(job.sourceQuote?.revision, row.acceptedQuoteRevision);
  import_strict4.default.equal(job.fee, row.quote.total);
  import_strict4.default.deepEqual(job.requiredRoles, ["photographer", "videographer"]);
  import_strict4.default.deepEqual(convertInquiry(row, { ...workspace2, jobs: [...workspace2.jobs, job] }).jobs.at(-1), job);
});
(0, import_node_test4.default)("Late AI cannot reappear even after human handover returns to AI", async () => {
  const repo = fixture2();
  let resolve;
  const pending = sendSupport(repo, "maturity", creator2, "Help me", { reply: () => new Promise((r) => {
    resolve = r;
  }) });
  repo.update("maturity", creator2, (row) => handover(row, creator2));
  repo.update("maturity", creator2, (row) => changeSupport(row, creator2, "ai"));
  resolve("Old inference");
  await pending;
  import_strict4.default.equal(repo.get("maturity", creator2).messages.length, 1);
  import_strict4.default.equal(repo.get("maturity", creator2).supportEvents?.length, 2);
});
(0, import_node_test4.default)("Negotiated quantities are snapshotted separately from initial brief and conversion uses agreed scope", async () => {
  const repo = fixture2();
  repo.update("maturity", hq3, (row) => transition(row, "reviewing", hq3));
  repo.update("maturity", hq3, (row) => transition(row, "quoted", hq3));
  repo.update("maturity", creator2, (row) => requestQuoteChanges(row, creator2, "One crew for two days", 1));
  repo.update("maturity", hq3, (row) => reviseQuote(row, hq3, defaultRates, { days: 2, crew: 1, gear: 0 }));
  repo.update("maturity", hq3, (row) => transition(row, "quoted", hq3));
  const accepted = repo.update("maturity", creator2, (row) => acceptQuoteRevision(row, creator2, 2));
  import_strict4.default.equal(accepted.brief.crew, 2);
  import_strict4.default.equal(accepted.quote.scope?.crew, 1);
  const extracted = acceptedQuoteSnapshot(accepted);
  extracted.scope.crew = 99;
  import_strict4.default.equal(accepted.quote.scope?.crew, 1);
  const job = convertInquiry(accepted, await createDummyRepository().load("hq")).jobs.at(-1);
  import_strict4.default.match(job.brief, /Jumlah crew: 1/);
  import_strict4.default.equal(job.fee, 22e5);
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
