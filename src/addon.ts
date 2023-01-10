import AddonEvents from "./events";
import AddonModule from "./module";
import AddonItem from "./item";
// import ZoteroToolkit from "zotero-plugin-toolkit";
import ZoteroToolkit from "E:/Github/zotero-plugin-toolkit"


const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public item: AddonModule;
  public toolkit: ZoteroToolkit;
  public DOIData = {}
  public DOIRefData = {}

  constructor() {
    this.toolkit = new ZoteroToolkit();
    this.item = new AddonItem(this);
    this.events = new AddonEvents(this);
  }
}

export { addonName, Addon };
