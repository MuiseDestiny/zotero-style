class AddonModule {
  protected _Addon: any;
  constructor(parent: any) {
    this._Addon = parent;
  }
  
  public setValue(k: string, v: string) {
    var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    if (typeof(v) != "string") {
      v = JSON.stringify(v)
    }
    _Zotero.Prefs.set(k, v)
  }

  public getValue(k: string, v: any = undefined) {
    var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    let _v = _Zotero.Prefs.get(k)
    if (_v == undefined) {
      return v
    }
    if (v == undefined || typeof(_v) == typeof(v)) {
      return _v
    }
    try {
      if (typeof(v) == "object") {
        _v = JSON.parse(_v)
      } else if (typeof(v) == "number") {
        if (_v == "") {
          return v
        }
        _v = Number(_v)
      }
    } catch (e) {
      console.log('Error in JSON.parse and Number function')
    }
    try {
      _v = (0, eval)(_v)
    } catch (e) {
      console.log("Error in eval function")
      return v
    }
    return (typeof(_v) == typeof(v) ? _v : v)
  }
}

export default AddonModule;
