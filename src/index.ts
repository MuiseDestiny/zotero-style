import { ZoteroCompat } from "../node_modules/zotero-plugin-toolkit/dist/compat";
import Addon from "./addon";
import { config } from "../package.json";

const compat = new ZoteroCompat();

if (!compat.getGlobal("Zotero").ZoteroStyle) {
  // Set global variables
  _globalThis.Zotero = compat.getGlobal("Zotero");
  _globalThis.ZoteroPane = compat.getGlobal("ZoteroPane");
  _globalThis.Zotero_Tabs = compat.getGlobal("Zotero_Tabs");
  _globalThis.window = compat.getGlobal("window");
  _globalThis.document = compat.getGlobal("document"); 
  _globalThis.addon = new Addon();
  _globalThis.ztoolkit = addon.data.ztoolkit;
  ztoolkit.Tool.logOptionsGlobal.prefix = `[${config.addonName}]`;
  ztoolkit.Tool.logOptionsGlobal.disableConsole =
    addon.data.env === "production";
  Zotero.ZoteroStyle = addon;
  // Trigger addon hook for initialization
  addon.hooks.onStartup();
}
