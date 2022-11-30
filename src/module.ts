class AddonModule {
  protected _Addon: any;
  public Zotero: _ZoteroConstructable;
  public window: any;
  public document: any;

  constructor(parent: any) {
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject as _ZoteroConstructable
    this.Zotero = Zotero
    this.window = this.Zotero.getMainWindow()
    this.document = this.window.document
    this._Addon = parent;
  }
  
  public setValue(k: string, v: string | boolean) {
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject as _ZoteroConstructable;
    if (typeof(v) != "boolean" && typeof(v) != "string") {
      v = JSON.stringify(v)
    }
    Zotero.Prefs.set(k, v)
  }

  public getValue(k: string, v: any = undefined) {
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject as _ZoteroConstructable;;
    let _v = Zotero.Prefs.get(k) as string
    // not stored or stored empty string, return
    if (_v == undefined || _v == "") { return v }
    // stored, maybe we needn't later processing or need string, return
    if (v == undefined || typeof(_v) == typeof(v)) { return _v }
    // json or number, but Number("") = 0, eval("") = undefined, so we use latter
    // try json
    try {
      _v = JSON.parse(_v)
    } catch (e) {
      // console.log(`Error in JSON.parse function - JSON.parse(${_v})`)
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

  public createElement(nodeName: string): HTMLElement {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", nodeName)
  }

}

export default AddonModule;
