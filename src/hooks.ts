import { BasicExampleFactory, UIExampleFactory } from "./modules/examples";
import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import Views from "./modules/views"; 
import Events from "./modules/events";
import AddonItem from "./modules/item";
Zotero._AddonItemGlobal = Zotero._AddonItemGlobal || new AddonItem()
const addonItem = Zotero._AddonItemGlobal



async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  // const popupWin = ztoolkit.Tool.createProgressWindow(config.addonName, {
  //   closeOnClick: true,
  //   closeTime: -1,
  // })
  //   .createLine({
  //     text: getString("startup.begin"),
  //     type: "default",
  //     progress: 0,
  //   })
  //   .show();

  // BasicExampleFactory.registerPrefs();

  // BasicExampleFactory.registerNotifier();

  // await Zotero.Promise.delay(1000);
  // popupWin.changeLine({
  //   progress: 30,
  //   text: `[30%] ${getString("startup.begin")}`,
  // });

  // UIExampleFactory.registerStyleSheet();

  // UIExampleFactory.registerRightClickMenuItem();

  // UIExampleFactory.registerRightClickMenuPopup();

  // UIExampleFactory.registerWindowMenuWithSeprator();

  // await UIExampleFactory.registerExtraColumn();

  // await UIExampleFactory.registerExtraColumnWithCustomCell();

  // await UIExampleFactory.registerCustomCellRenderer();

  // UIExampleFactory.registerLibraryTabPanel();

  // await UIExampleFactory.registerReaderTabPanel();

  // await Zotero.Promise.delay(1000);

  // popupWin.changeLine({
  //   progress: 100,
  //   text: `[100%] ${getString("startup.finish")}`,
  // });
  // popupWin.startCloseTimer(5000);
  
  // return
  ztoolkit.UI.basicOptions.ui.enableElementRecord = false
  ztoolkit.UI.basicOptions.ui.enableElementJSONLog = false

  if (!addonItem.item) { await addonItem.init() }

  const views = new Views(addonItem)
  await views.renderTitleProgress()
  await views.createTagsColumn()
  await views.createTextTagsColumn()
  await views.createProgressColumn()
  await views.createIFColumn()
  let createForceGraph = views.createForceGraph()
  views.registerSwitchColumnsViewUI()
  await views.registerCommands()


  try {
    ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
    //@ts-ignore
    ztoolkit.ItemTree.refresh()
  } catch {}

  const events = new Events(addonItem)
  events.onInit()

  // Register the callback in Zotero as an item observer
  const notifierID = Zotero.Notifier.registerObserver(
    { notify: onNotify },
    [ "tab" ]
  );

  // Unregister callback when the window closes (important to avoid a memory leak)
  window.addEventListener(
    "unload",
    (e: Event) => {
      Zotero.Notifier.unregisterObserver(notifierID);
    },
    false
  );


  await createForceGraph

}

function onShutdown(): void {
  ztoolkit.log("zotero style onShutdown")
  ztoolkit.unregisterAll()
  ztoolkit.UI.unregisterAll()
  ztoolkit.ItemTree.unregisterAll()

  // Remove addon object
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
    let reader = Zotero.Reader.getByTabID(ids[0]);
    // 重置等待更新
    addonItem.set(
      (Zotero.Items.get(reader.itemID) as _ZoteroItem).parentItem as _ZoteroItem,
      "annotationNumber",
      ""
    )
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

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onNotify,
  onPrefsEvent,
};
