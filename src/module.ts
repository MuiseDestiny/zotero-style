class AddonModule {
  protected _Addon: any;
  constructor(parent: any) {
    this._Addon = parent;
  }
  
  public setValue(k: string, v: string) {
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    if (typeof(v) != "string") {
      v = JSON.stringify(v)
    }
    Zotero.Prefs.set(k, v)
  }

  public getValue(k: string, v: any = undefined) {
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    let _v = Zotero.Prefs.get(k)
    // not stored or stored empty string, return
    if (_v == undefined || _v == "") { return v }
    // stored, maybe we needn't later processing or need string, return
    if (v == undefined || typeof(_v) == typeof(v)) { return _v }
    // json or number, but Number("") = 0, eval("") = undefined, so we use latter
    // try json
    try {
      _v = JSON.parse(_v)
    } catch (e) {
      console.log(`Error in JSON.parse function - JSON.parse(${_v})`)
      // i.e., JSON.parse("['1']") can not work, but eval can
    }
    // last try
    try {
      _v = eval(_v)
    } catch (e) {
      console.log(`Error in eval function - eval(${_v})`)
    }
    return (typeof(_v) == typeof(v) ? _v : v)
  }
}

export default AddonModule;
