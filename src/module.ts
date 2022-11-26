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

  public getValue(k: string, v: any = {}) {
    var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    let _v = _Zotero.Prefs.get(k)
    if (v != undefined) {
      try {
        if (typeof(v) == "object") {
          _v = JSON.parse(_v)
        } else if (typeof(v) == "number") {
          _v = Number(_v)
        }
      } catch {
        return v
      }
    }
    return typeof(_v)==typeof(v) ? _v : v
  }
}

export default AddonModule;
