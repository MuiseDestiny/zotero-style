import AddonEvents from "./events";
import AddonModule from "./module";
import AddonPrefs from "./prefs";
import AddonSetting from "./setting";
import AddonViews from "./views";
import AddonItem from "./item";
import AddonPrompt from "./prompt";


const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;
  public prompt: AddonModule;
  public item: AddonModule;
  public DOIData = {}
  public DOIRefData = {}

  constructor() {
    // this.setting = new AddonSetting(this);
    this.prompt = new AddonPrompt(this)
    this.item = new AddonItem(this);
    this.prefs = new AddonPrefs(this);
    this.events = new AddonEvents(this);
    // this.views = new AddonViews(this);
  }
}

export { addonName, Addon };
