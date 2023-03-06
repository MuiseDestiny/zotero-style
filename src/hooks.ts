import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Views from "./modules/views"; 
import Events from "./modules/events";
import AddonItem from "./modules/item";
import { registerPrefsScripts, registerPrefs } from "./modules/prefs";


Zotero._AddonItemGlobal = Zotero._AddonItemGlobal || new AddonItem()
const addonItem = Zotero._AddonItemGlobal


async function onStartup() {
  registerPrefs();
  // Register the callback in Zotero as an item observer
  const notifierID = Zotero.Notifier.registerObserver(
    { notify: onNotify },
    ["tab"]
  );
  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`
  );
  // Unregister callback when the window closes (important to avoid a memory leak)
  window.addEventListener(
    "unload",
    (e: Event) => {
      Zotero.Notifier.unregisterObserver(notifierID);
    },
    false
  );
  
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  ztoolkit.UI.basicOptions.ui.enableElementRecord = false
  ztoolkit.UI.basicOptions.ui.enableElementJSONLog = false
  if (!addonItem.item) { await addonItem.init() }

  const events = new Events(addonItem)
  events.onInit()
  
  const views = new Views(addonItem)
  Zotero.ZoteroStyle.data.views = views
  
  const tasks = [
    views.initTags(),
    views.createGraphView(),
    views.renderTitleProgress(),
    views.createTagsColumn(),
    views.createTextTagsColumn(),
    views.createProgressColumn(),
    views.createIFColumn(),
    views.createPublicationTagsColumn(),
    views.createRatingColumn(),
    views.initItemSelectListener(),
    views.addNumberToCollectionTree(),
  ]
  try {
    await Promise.all(tasks);
  } catch (e) {
    console.log("ERROR", e)
  }
  await views.registerSwitchColumnsViewUI();
  try {
    ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
    ztoolkit.ItemTree.refresh()
  } catch { }
  await views.registerCommands()
}

function onShutdown(): void {
  ztoolkit.log("zotero style onShutdown")
  ztoolkit.unregisterAll()
  ztoolkit.UI.unregisterAll()
  ztoolkit.ItemTree.unregisterAll()
  addon.data.alive = false;
  delete Zotero.ZoteroStyle;
}

async function onNotify(
  event: string,
  type: string,
  ids: Array<string>,
  extraData: { [key: string]: any }
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    ztoolkit.log("select reader tab")
    let reader = await ztoolkit.Reader.getReader();
    // 重置等待更新
    addonItem.set(
      (Zotero.Items.get(reader.itemID) as _ZoteroItem).parentItem as _ZoteroItem,
      "annotationNumber",
      ""
    )
    Zotero.ZoteroStyle.data.views.modifyAnnotationColors(reader);
  } else if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "library"
  ) {
    ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
  } else {
    return;
  }
}

async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

export default {
  onStartup,
  onShutdown,
  onNotify,
  onPrefsEvent
};
