import { Addon } from "./addon";

var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
  Components.interfaces.nsISupports
).wrappedJSObject as _ZoteroConstructable

if (!Zotero.ZoteroStyle) {
  Zotero.ZoteroStyle = new Addon();
  Zotero.ZoteroStyle.events.onInit();
}