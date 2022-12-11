import AddonEvents from "./events";
import AddonModule from "./module";
import AddonItem from "./item";
import AddonPrompt from "./prompt";


const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public prompt: AddonModule;
  public item: AddonModule;
  public DOIData = {}
  public DOIRefData = {}

  constructor() {
    this.prompt = new AddonPrompt(this)
    this.item = new AddonItem(this);
    this.events = new AddonEvents(this);
  }
}

export { addonName, Addon };
