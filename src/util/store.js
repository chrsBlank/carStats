import { useState, useRef, useEffect, useSyncExternalStore } from "react";

// Store

const store = {
  state: {
    session: {
      assets: {},
    },
  },
};

// util

store.lastUid = Math.round(Math.random() * 10000);
store.generateUid = function () {
  return "" + store.lastUid++;
};

store.getJsonPath = function (json, path) {
  if (json === null || json === undefined || !path) {
    return null;
  }

  let parts = [];
  if (path) {
    if (typeof path !== "string") {
      path = "" + path;
    }
    parts = path.split(".");
  }

  let part;
  for (let i = 0; i < parts.length; i++) {
    part = parts[i];
    json = json[part];
    if (json === null || json === undefined) {
      return null;
    }
  }

  return json;
};

store.setJsonPath = function (json, path, value) {
  if (!json) {
    json = {};
  }

  let parts = [];
  if (path) {
    if (typeof path !== "string") {
      path = "" + path;
    }
    parts = path.split(".");
  } else {
    json = value;
  }

  let property = json;
  let part;
  for (let i = 0; i < parts.length; i++) {
    part = parts[i];
    if (part) {
      if (i < parts.length - 1) {
        if (property[part] === null || property[part] === undefined) {
          property = property[part] = {};
        } else {
          property = property[part];
        }
      } else {
        property = property[part] = value;
      }
    }
  }

  return json;
};

// clone

function copyBuffer(cur) {
  if (cur instanceof Buffer) {
    return Buffer.from(cur);
  }

  return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
}

function cloneArray(a, fn) {
  var keys = Object.keys(a);
  var a2 = new Array(keys.length);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var cur = a[k];
    if (typeof cur !== "object" || cur === null) {
      a2[k] = cur;
    } else if (cur instanceof Date) {
      a2[k] = new Date(cur);
    } else if (ArrayBuffer.isView(cur)) {
      a2[k] = copyBuffer(cur);
    } else {
      a2[k] = fn(cur);
    }
  }
  return a2;
}

function clone(o) {
  if (typeof o !== "object" || o === null) return o;
  if (o instanceof Date) return new Date(o);
  if (Array.isArray(o)) return cloneArray(o, clone);
  if (o instanceof Map) return new Map(cloneArray(Array.from(o), clone));
  if (o instanceof Set) return new Set(cloneArray(Array.from(o), clone));
  var o2 = {};
  for (var k in o) {
    if (Object.hasOwnProperty.call(o, k) === false) continue;
    var cur = o[k];
    if (typeof cur !== "object" || cur === null) {
      o2[k] = cur;
    } else if (cur instanceof Date) {
      o2[k] = new Date(cur);
    } else if (cur instanceof Map) {
      o2[k] = new Map(cloneArray(Array.from(cur), clone));
    } else if (cur instanceof Set) {
      o2[k] = new Set(cloneArray(Array.from(cur), clone));
    } else if (ArrayBuffer.isView(cur)) {
      o2[k] = copyBuffer(cur);
    } else {
      o2[k] = clone(cur);
    }
  }
  return o2;
}

store.clone = clone;

// Session store

store.getSession = (path, getClone) => {
  if (path) {
    path = path.replace(/'/g, "");
    path = path.replace(/"/g, "");
  }
  let value = path ? store.getJsonPath(store.state.session, path) : null;
  if (getClone) {
    value = store.clone(value);
  }
  return value;
};

let subscriptions = {};
store.subscribeSession = (path, callback) => {
  let id = store.generateUid();
  subscriptions[id] = { path, callback };

  return () => {
    delete subscriptions[id];
  };
};

store.setSession = (path, value) => {
  if (!path) {
    return;
  }

  store.setJsonPath(store.state.session, path, value);

  // setTimeout(() => {
  for (let id in subscriptions) {
    let subscription = subscriptions[id];
    if (subscription.path) {
      if (path.startsWith(subscription.path)) {
        subscription.callback(value, path);
      }
    }
  }
  // });
};

const useSessionValue = (path) => {
  function subscribe(listener) {
    return store.subscribeSession(path, listener);
  }

  return useSyncExternalStore(
    subscribe,
    () => store.getSession(path),
    () => null,
  );
};

const useSessionState = (path) => {
  return [useSessionValue(path), (value) => store.setSession(path, value)];
};

// Dynamic assets

store.dynamicAsset = (name) => {
  if (typeof name == "string") {
    if (
      name &&
      (name.startsWith("http") ||
        name.startsWith("http") ||
        name.startsWith("data:") ||
        name.startsWith("blob:") ||
        name.startsWith("/"))
    ) {
      return name;
    } else if (name) {
      let asset = store.getSession("assets." + name);
      if (asset) {
        return asset.file || asset.url;
      }
    }
  }
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
};

// Persistent store

store.setPersistent = async function (name, value) {
  localStorage.setItem(name, value);
};

store.getPersistent = async function (name) {
  return localStorage.getItem(name);
};

store.deletePersistent = async function (name) {
  localStorage.removeItem(name);
};

const useStateRef = (initialValue) => {
  const [currentValue, _setCurrentValue] = useState(initialValue);

  const currentValueRef = useRef(currentValue);

  const setCurrentValue = (val) => {
    currentValueRef.current = val;
    _setCurrentValue(val);
  };

  return [currentValue, setCurrentValue, currentValueRef];
};

const useSessionStateRef = (path) => {
  const [currentValue, _setCurrentValue] = useSessionState(path);
  const currentValueRef = useRef(currentValue);
  const setCurrentValue = (val) => {
    currentValueRef.current = val;
    _setCurrentValue(val);
  };

  useEffect(() => {
    setCurrentValue(currentValue);
  }, [currentValue]);

  return [currentValue, setCurrentValue, currentValueRef];
};

export {
  store,
  useStateRef,
  useSessionValue,
  useSessionState,
  useSessionStateRef,
};
