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
    console.log(`_v='${_v}'`, v)
    if (v == undefined) {
      console.log(_v)
      return _v
    }
    console.log(typeof(v), _v, v)
    try {
      if (typeof(v) == "object") {
        _v = JSON.parse(_v)
      } else if (typeof(v) == "number") {
        _v = Number(_v)
      }
    } catch (e) {
      console.log(`_v='${_v}'`)
      console.log(e)
      return v
    }
    return (typeof(_v) == typeof(v) ? _v : v)
  }
}

export default AddonModule;
