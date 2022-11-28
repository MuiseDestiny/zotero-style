import { Addon } from "./addon";

var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
  Components.interfaces.nsISupports
).wrappedJSObject as _ZoteroConstructable;
if (!_Zotero.ZoteroStyle) {
  _Zotero.ZoteroStyle = new Addon();
  _Zotero.ZoteroStyle.events.onInit(_Zotero);
}