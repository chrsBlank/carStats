import Sqrl from "squirrelly";
import moment from "moment";
import numeral from "@elastic/numeral";
import validator from "validator";
import { store } from "./store";

import { toast } from "react-toastify";

const util = {};
const http = {};
const track = {
  debugUrl: "https://build.allcancode.com/debug",
  projectUuid: "64c3c4e0741911eeb806cd10bf528e7b",
};

RegExp.escapePattern = /[-/\\^$*+?.()|[\]{}]/g;
RegExp.escape = function (s) {
  return s.replace(RegExp.escapePattern, "\\$&");
};

util.lastUid = Math.round(Math.random() * 10000);
util.generateUid = function () {
  return "" + util.lastUid++;
};

util.removeUnits = function (value) {
  let bare = value;
  try {
    if (typeof value == "string") {
      if (
        !value.startsWith("#") &&
        !value.startsWith("rgb") &&
        (value.endsWith("px") || value.endsWith("em"))
      ) {
        bare = parseFloat(value);
      }
    }
  } catch (e) {}
  return bare;
};

util.print = function (message, type) {
  if (!type) {
    type = "info";
  }

  if (type === "error") {
    track.logError(new Error(message));
  } else {
    track.logInfo(message);
  }
};

util.prompt = function (msg) {
  window.alert(msg);
};

util.cloneObject = function (obj) {
  return obj ? Object.assign({}, obj) : null;
};

util.fromJson = function (json) {
  try {
    if (json && typeof json === "string") {
      json = JSON.parse(json);
    }
  } catch (e) {
    e.message = e.message + " `" + json + "`";
    track.logError(e);
  }
  return json;
};

util.toJson = function (obj) {
  let json = null;
  try {
    if (obj) {
      json = JSON.stringify(obj);
    }
  } catch (e) {
    track.logError(e);
  }
  return json;
};

util.objectToArray = function (json) {
  const array = json
    ? Object.keys(json).map((x) => {
        const obj = {};
        obj[x] = json[x];
        return json[x];
      })
    : [];
  return array;
};

util.spliceArray = function (a, start, deleteCount, item) {
  if (Array.isArray(a)) {
    if (item !== undefined) {
      return a.splice(start, deleteCount, item);
    } else {
      return a.splice(start, deleteCount);
    }
  } else {
    return null;
  }
};

util.valueInObjectArray = function (a, key) {
  a = a.map((y) => {
    if (key.indexOf(".") !== -1) {
      return store.getJsonPath(y, key);
    }
    return y[key];
  });

  return a;
};

util.keyInObjectArray = function (a, key) {
  const index = a.findIndex((y) => y[key]);
  return index !== -1 ? true : false;
};

util.findInObjectArray = function (a, key, value) {
  return a.find((y) => y[key] === value);
};

util.sortBy = function (json, property, way, format = null) {
  let newList;
  if (json && json.sort) {
    if (!format) {
      if (Array.isArray(property)) {
        newList = json.sort((e1, e2) => {
          for (let p of property) {
            let e1v = e1[p];
            let e2v = e2[p];
            if (e1v > e2v) {
              return way === "desc" ? -1 : 1;
            } else if (e1v < e2v) {
              return way === "desc" ? 1 : -1;
            }
          }
          return 0;
        });
      } else {
        newList = json.sort((e1, e2) => {
          const e1v = e1[property];
          const e2v = e2[property];
          if (e1v > e2v) {
            return way === "desc" ? -1 : 1;
          } else if (e1v < e2v) {
            return way === "desc" ? 1 : -1;
          } else {
            return 0;
          }
        });
      }
    } else if (format === "date") {
      if (Array.isArray(property)) {
        property = property[0];
      }
      newList = json.sort((a, b) => {
        if (way === "asc") {
          return (
            new Date(a[property]).getTime() - new Date(b[property]).getTime()
          );
        } else {
          return (
            new Date(b[property]).getTime() - new Date(a[property]).getTime()
          );
        }
      });
    }
  } else {
    newList = json;
  }

  return newList;
};

util.filterBy = function (json, property, pattern, type) {
  let filtered = json;

  if (json && json.filter && pattern) {
    if (type !== "regexp") {
      pattern = pattern.replace(/\*/g, ".*");
    }
    const regex = new RegExp(pattern);
    filtered = json.filter((element) => {
      const value =
        property !== null && property !== undefined
          ? element[property]
          : element;
      return value !== null && value.match ? !!value.match(regex) : false;
    });
  }

  return filtered;
};

util.applyTemplate = async function (template, data) {
  let result = null;

  try {
    result = Sqrl.Render(template, data);
  } catch (e) {
    track.logError(e);
  }

  return result;
};

util.arrayFromText = function (text) {
  const values = text.split(",");
  for (let i = 0; i < values.length; i++) {
    values[i] = values[i].trim();
  }

  return values;
};

util.exitApp = function () {
  const app = window["navigator"]["app"];
  if (app && app["exitApp"]) {
    app["exitApp"]();
  }
};

util.objectEntries = function (json) {
  if (json) {
    const array = Object.entries(json);
    return array;
  } else {
    return null;
  }
};

util.objectKeys = function (json) {
  if (json) {
    const array = Object.keys(json);
    return array;
  } else {
    return null;
  }
};

util.timeFromNow = async function (ms) {
  if (!ms) {
    return "";
  } else {
    return moment(ms).fromNow();
  }
};

util.objectGetExact = function (json, path) {
  const value = json[path];
  return value;
};

util.objectGetFormated = async function (json, path, format) {
  let value = store.getJsonPath(json, path);

  format = format || "";
  if (format.indexOf("date|") === 0) {
    const m = moment(value);
    if (format === "date|fromNow") {
      value = m.fromNow();
    } else if (format === "date|toNow") {
      value = m.toNow();
    } else {
      value = m.format(format.substring("date|".length));
    }
  } else if (format.indexOf("number|") === 0) {
    value = numeral(value).format(format.substring("number|".length));
  }

  return value;
};

util.objectSetExact = function (json, path, value) {
  if (!json) {
    json = {};
  }
  value = typeof value === "boolean" ? value : value ? value : {};
  json[path] = value;
  return json;
};

util.objectDelete = function (json, path) {
  if (!json) {
    json = {};
  }
  delete json[path];
  return json;
};

util.objectSetFromText = function (json, value) {
  try {
    if (value && typeof value === "string") {
      value = JSON.parse(value);
    }
  } catch (e) {
    value = {};
    e.message = e.message + " `" + value + "`";
    track.logError(e);
  }
  return value;
};

util.getQueryParameters = function (str) {
  let location = window ? window["location"] : null;
  if (location) {
    return (str || document.location.search)
      .replace(/(^\?)/, "")
      .split("&")
      .map(
        function (n) {
          n = n.split("=");
          this[n[0]] = n[1];
          return this;
        }.bind({}),
      )[0];
  } else {
    return {};
  }
};

util.booleanToString = function (value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  } else if (typeof value === "string") {
    if (value.startsWith("{")) {
      return value;
    } else {
      return value === "true" ? "true" : "false";
    }
  } else {
    return "false";
  }
};

util.getLocation = function () {
  const locationData = window["location"];

  const path = locationData.pathname.split("/");
  if (!path[0] && path[1] === "go") {
    path.shift();
    path.shift();
    path.shift();
  } else if (path[0] === "go") {
    path.shift();
    path.shift();
  } else if (!path[0]) {
    path.shift();
  }

  return {
    href: locationData.href,
    host: locationData.host,
    hostname: locationData.hostname,
    pathname: locationData.pathname,
    path: path,
    search: util.getQueryParameters(locationData.search),
    hash: locationData.hash,
    origin: locationData.origin,
  };
};

util.getCookies = function () {
  const map = {};

  const docCookie = document.cookie;
  const cookies = docCookie ? docCookie.split(";") : [];
  let parts;
  for (const cookie of cookies) {
    parts = cookie.trim().split("=");
    map[parts[0].trim()] = parts[1].trim();
  }

  return map;
};

util.setCookie = function (key, value) {
  document.cookie = key + "=" + value;
};

util.localization = {
  messages: null,
  language: "en",
};

util.configureLocalization = function (propertyName, value) {
  if (propertyName === "messages") {
    util.localization.messages = value;
  } else if (propertyName === "language") {
    util.localization.language = value;
  }
};

util.getLocalizedMessage = function (value) {
  const orgValue = value;

  const lang = util.localization.language;
  const messages = util.localization.messages;
  if (messages && typeof value === "string") {
    if (value.startsWith("$=") || value.startsWith("&#x24;=")) {
      const key = value.startsWith("$=")
        ? value.substring(2)
        : value.substring(7);
      if (messages[lang]) {
        value = store.getJsonPath(messages[lang], key);
      } else {
        const localized = store.getJsonPath(messages, key);
        if (localized) {
          value = localized[lang];
        }
      }

      if (!value || value.startsWith("$=") || value.startsWith("&#x24;=")) {
        console.log("Cannot find", orgValue);
        value = "";
      }
    } else if (value.indexOf("{{") >= 0 && messages[lang]) {
      try {
        value = Sqrl.Render(value, messages[lang]);
      } catch (e) {
        console.log(e);
      }
    }
  }

  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" &&
      (value.startsWith("$=") || value.startsWith("&#x24;=")))
  ) {
    value = "";
  }
  return value;
};

util.toasts = [];

util.showBusy = function (message, blocking, duration) {
  if (blocking) {
    let id = toast.info(message, {
      position: "top-center",
      hideProgressBar: true,
    });
    util.toasts.push(id);
  } else {
    toast.info(message, {
      position: "top-center",
      hideProgressBar: true,
      autoClose: duration || 3000,
    });
  }
};

util.hideBusy = function () {
  let id = util.toasts.pop();
  if (id) {
    toast.dismiss(id);
  }
};

util.showError = function (message, duration) {
  toast.error(message, {
    position: "bottom-left",
    hideProgressBar: true,
    autoClose: duration || 3000,
  });
};

util.showToast = function (message, buttons) {
  util.print("showToast");
};

util.hideToast = function (parentUid) {
  util.print("hideToast");
};

track.upload = false;

track.getStacktrace = function (error) {
  let stackTrace = error ? error.stack || Error().stack : Error().stack;

  stackTrace = stackTrace.replace("Error", "");
  stackTrace = stackTrace.replace(/s.*track.getStacktrace (.+)s/, "");
  stackTrace = stackTrace.replace(/s.*track.logError (.+)s/, "");
  stackTrace = stackTrace.replace(/s.*track.logInfo (.+)s/, "");

  return stackTrace;
};

track.codeTraceCounter = 0;
track.sessionUuid = null;
track.sessionUuidPromise = null;
track.getSessionUuid = async function (cb) {
  if (track.sessionUuid) {
    cb(track.sessionUuid);
  } else if (track.sessionUuidPromise) {
    track.sessionUuidPromise.then(cb);
  } else {
    track.sessionUuidPromise = new Promise((resolve) => {
      httpImpl
        .get(track.debugUrl + "/" + track.projectUuid + "/init")
        .then((result) => {
          track.sessionUuid = result.data.sessionUuid;
          resolve(track.sessionUuid);
        })
        .catch(() => {
          resolve(null);
        });
    });
    track.sessionUuidPromise.then(cb);
  }
};

track.logError = function (error, message) {
  let stack = track.getStacktrace(error);

  message = message || "";
  message = error.message ? error.message + message : message;
  console.log(message + "\n" + stack);
};

track.logInfo = function (message) {
  let stack = track.getStacktrace();

  message = JSON.stringify(message, null, 2);
  console.log(message);
};

track.logCodeTrace = function (codetrace) {};

const httpImpl = {};
["get", "post", "put", "delete"].forEach((val) => {
  httpImpl[val] = async function (url, data, options) {
    if (val === "get" || val === "delete") {
      options = data;
    }

    let headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    let credentials = "omit";
    if (options) {
      Object.assign(headers, options.headers || {});
      if (options.withCredentials) {
        credentials = "include";
      }
    }

    let body;
    if (val === "put" || val === "post") {
      body = data;
      if (data instanceof FormData) {
        delete headers["Content-Type"];
      } else {
        body = data ? JSON.stringify(data) : "{}";
      }
    }

    let response = await fetch(url, {
      headers,
      method: val,
      credentials,
      body,
    });

    let json = {};
    try {
      json = await response.json();
    } catch (e) {}

    if (response.ok) {
      return { status: response.status, data: json };
    } else {
      let message =
        response.status > 0
          ? response.status + ": " + response.statusText
          : "Lost connection with server";
      let e = new Error(message);
      e.response = {
        status: response.status,
        statusText: response.statusText,
        data: json,
      };
      throw e;
    }
  };
});

http.serverUrl = function (path, full = false, isWs = false) {
  if (!path || (path && path.length === 0)) {
    return "";
  }

  if (
    (!isWs && (path.indexOf("http") === 0 || path.indexOf("data") === 0)) ||
    (isWs && path.indexOf("ws") === 0)
  ) {
    return path;
  } else {
    let location = window ? window["location"] : null;

    let host = "https://app.allcancode.com";
    if (location) {
      if (location.host.indexOf("localhost") >= 0) {
        host = "http://localhost:3000";
      } else if (
        location.host.indexOf("allcancode.com") >= 0 ||
        location.host.indexOf("gonow.link") >= 0
      ) {
        host = location.protocol + "//" + location.host;
      }
    }
    return host + path;
  }
};

http.logHttp = function (
  method,
  url,
  headers,
  data,
  response,
  isError,
  decodedBody,
  errorMessage,
) {
  let message = "";
  message += "=======================================\n";
  message += new Date().toISOString();
  if (isError) {
    message += "HTTP ERROR\n";
  } else {
    message += "HTTP INFO\n";
  }
  message += "--- Request ---------------------------\n";
  message += "METHOD: " + method + "\n";
  message += "URL: " + url + "\n";
  if (response != null) {
    message += "Headers:\n";
    message += JSON.stringify(headers) + "\n";
    message += "Body:\n";
    message += data + "\n";
    message += "--- Response ---------------------------\n";
    message += "Status: " + response.status + "\n";
    message += "Reason: " + response.statusText + "\n";
    message += "Headers:\n";
    message += response.headers + "\n";
    message += "Body:\n";
    message += decodedBody;
  }
  if (errorMessage != null) {
    message += "Error Message:\n";
    message += errorMessage + "\n";
  }
  message += "=======================================\n";

  track.logInfo(message);
};

http.login_async = async function (service, credentials, options) {
  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    let url = service["url"];
    let response = await httpImpl.post(url, credentials);
    let sentData = response.data;

    result = {};
    if (service["fields"]) {
      for (let key in service["fields"]) {
        let value = service["fields"][key];
        result[key] = sentData[value];
      }
    }

    if (result["bearer"] != null) {
      var bearer = "Bearer " + result["bearer"];
      store.setSession("http.authorization", bearer);
      await store.setPersistent("http.authorization", bearer);
    }
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.headers = {};

http.getHeaders = async function (withCredentials) {
  let headers = Object.assign({}, http.headers);

  if (withCredentials) {
    let authorization = store.getSession("http.authorization");
    if (authorization === null) {
      authorization = await store.getPersistent("http.authorization");
    }
    if (authorization != null) {
      headers["Authorization"] = authorization;
    }
  }

  return headers;
};

http.set_headers = async function (headers) {
  http.headers = Object.assign({}, headers);
};

http.get_async = async function (url, timeout, responseType, withCredentials) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    result = (
      await httpImpl.get(encodeURI(url), {
        withCredentials,
        headers: await http.getHeaders(withCredentials),
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.post_async = async function (
  url,
  data,
  timeout,
  responseType,
  withCredentials,
) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    result = (
      await httpImpl.post(encodeURI(url), data, {
        withCredentials,
        headers: await http.getHeaders(withCredentials),
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.put_async = async function (
  url,
  data,
  timeout,
  responseType,
  withCredentials,
) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    result = (
      await httpImpl.put(encodeURI(url), data, {
        withCredentials,
        headers: await http.getHeaders(withCredentials),
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.post_form_async = async function (url, data, timeout, withCredentials) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    let headers = await http.getHeaders(withCredentials);
    headers["Content-Type"] = "multipart/form-data";

    let formData = new FormData();
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, JSON.stringify(data[key]));
      }
    }

    result = (
      await httpImpl.post(encodeURI(url), formData, {
        withCredentials,
        headers,
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.post_file_async = async function (
  url,
  name,
  data,
  type,
  filename,
  timeout,
  withCredentials,
) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    let headers = await http.getHeaders(withCredentials);
    headers["Content-Type"] = "multipart/form-data";

    let fd = new FormData();
    if (typeof data === "string") {
      if (data.startsWith("file://")) {
        fd.append("file", {
          name: filename,
          uri: data,
          type,
        });
      } else {
        data = JSON.stringify(data);
        const blob = new Blob([data], { type: type });
        fd.append(name, blob, filename);
      }
    } else {
      fd.append(name, data, filename);
    }

    result = (
      await httpImpl.post(encodeURI(url), fd, {
        withCredentials,
        headers,
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

http.delete_async = async function (url, data, timeout, withCredentials) {
  if (withCredentials === null) {
    withCredentials = true;
  }

  store.setSession("last_error_code", null);
  store.setSession("last_error_message", null);
  store.setSession("last_headers", null);

  let result = null;
  try {
    result = (
      await httpImpl.delete(encodeURI(url), {
        withCredentials,
        headers: await http.getHeaders(withCredentials),
      })
    ).data;
  } catch (e) {
    let status = store.getJsonPath(e, "response.status") || "0";
    store.setSession("last_error_code", status);
    store.setSession("last_error_message", e.message || "Connection lost.");
  }
  return result;
};

class Moment {
  moment = null;

  constructor() {
    this.moment = moment();
  }

  updateLocale(locale, options) {
    moment.updateLocale(locale, options);
  }

  parse(text, format) {
    this.moment = moment(text, format);
  }

  set(unit, value) {
    this.moment = this.moment.set(unit, value);
  }

  get(unit) {
    return this.moment.get(unit);
  }

  add(value, unit) {
    this.moment = this.moment.add(value, unit);
  }

  subtract(value, unit) {
    this.moment = this.moment.subtract(value, unit);
  }

  format(format) {
    return this.moment.format(format);
  }

  from_now(without_suffix) {
    return this.moment.fromNow(without_suffix);
  }

  to_now(without_prefix) {
    return this.moment.toNow(without_prefix);
  }

  timestamp() {
    return this.moment.valueOf();
  }

  date() {
    return this.moment.toDate();
  }

  diff(timestamp, unit) {
    return this.moment.diff(timestamp, unit);
  }

  duration(timestamp1, timestamp2) {
    const duration = moment.duration(timestamp2 - timestamp1);
    return {
      years: duration.years(),
      months: duration.months(),
      days: duration.days(),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
    };
  }
}

class Validator {
  is_email(value) {
    return validator.isEmail(value);
  }

  is_mobile_phone(value, locale, isStrict) {
    return validator.isMobilePhone(value, locale, {
      strictMode: isStrict,
    });
  }

  is_empty(value, ignoreWhiteSpace) {
    return validator.isEmpty(value, {
      ignore_whitespace: ignoreWhiteSpace,
    });
  }

  is_float(value, min, max, locale) {
    return validator.isFloat(value, {
      min: min,
      max: max,
      locale: locale,
    });
  }

  is_int(value, min, max) {
    return validator.isInt(value, {
      min: min,
      max: max,
    });
  }

  is_alpha(value, locale) {
    return validator.isAlpha(value, locale);
  }

  is_iso_date(value) {
    return validator.isISO8601(value);
  }

  is_postal_code(value, locale) {
    return validator.isPostalCode(value, locale);
  }

  matches(value, pattern) {
    if (pattern && value && typeof value === "string") {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } else {
      return false;
    }
  }
}

export { util, track, http, Moment, Validator };
