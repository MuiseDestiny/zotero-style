import AddonEvents from "./events";
import AddonModule from "./module";
import AddonPrefs from "./prefs";
import AddonSetting from "./setting";
import AddonViews from "./views";


const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;
  public setting: AddonModule;

  constructor() {
    this.events = new AddonEvents(this);
    this.setting = new AddonSetting(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
  }
}

export { addonName, Addon };
