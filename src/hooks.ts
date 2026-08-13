import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Views from "./modules/views"; 
import Events from "./modules/events";
import AddonItem from "./modules/item";
import { registerPrefsScripts, registerPrefs } from "./modules/prefs";
import LocalStorage from "./modules/localStorage";

type ItemTreeColumnPrefs = Record<string, Record<string, any>>;

async function snapshotStyleColumnPrefs(): Promise<ItemTreeColumnPrefs> {
  const saved: ItemTreeColumnPrefs = {};
  try {
    const treePrefsPath = `${Zotero.Profile.dir}${Zotero.isWin ? "\\\\" : "/"}treePrefs.json`;
    const raw = await Zotero.File.getContentsAsync(treePrefsPath);
    const treePrefs = JSON.parse(raw || "{}");
    for (const [treeID, prefs] of Object.entries(treePrefs)) {
      const stylePrefs: Record<string, any> = {};
      for (const [key, value] of Object.entries((prefs || {}) as Record<string, any>)) {
        if (key.startsWith(`${config.addonRef}-`)) {
          stylePrefs[key] = value;
        }
      }
      if (Object.keys(stylePrefs).length) {
        saved[treeID] = stylePrefs;
      }
    }
  } catch (e) {
    ztoolkit.log("snapshot Style column prefs failed", e);
  }
  return saved;
}

async function restoreStyleColumnPrefs(saved: ItemTreeColumnPrefs) {
  try {
    const mainWindow = Zotero.getMainWindow?.();
    const itemTree = mainWindow?.ZoteroPane?.itemsView as any;
    const savedPrefs = itemTree && saved[itemTree.id];
    if (!itemTree || !savedPrefs) { return; }

    const availableKeys = new Set(
      (itemTree.getColumns?.() || []).map((column: any) => column.dataKey)
    );
    const currentPrefs = Object.assign(
      {},
      itemTree._getColumnPrefs?.() || itemTree._columnPrefs || {}
    );
    let changed = false;

    for (const [key, value] of Object.entries(savedPrefs)) {
      if (!availableKeys.has(key)) { continue; }
      currentPrefs[key] = Object.assign({}, currentPrefs[key] || {}, value);
      changed = true;
    }
    if (!changed) { return; }

    itemTree._columnPrefs = currentPrefs;
    itemTree._columnsId = null;
    if (typeof itemTree._resetColumns == "function") {
      await itemTree._resetColumns();
    }
    if (typeof itemTree._writeColumnPrefsToFile == "function") {
      await itemTree._writeColumnPrefsToFile(true);
    }
  } catch (e) {
    ztoolkit.log("restore Style column prefs failed", e);
  }
}

async function onStartup() {
  // Zotero can persist an incomplete column set before Style finishes registering
  // its custom columns. Preserve the previous Style column layout and merge it
  // back after startup so order/width/visibility survive restarts.
  const savedStyleColumnPrefs = await snapshotStyleColumnPrefs();

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
  // 初始化储存位置
  let storage
  const storageIn = Zotero.Prefs.get(`${config.addonRef}.storage.in`) as string
  if (storageIn == "note") {
    Zotero._AddonItemGlobal = Zotero._AddonItemGlobal || new AddonItem()
    const addonItem = Zotero._AddonItemGlobal
    if (!addonItem.item) { await addonItem.init() }
    storage = addonItem
  } else if (storageIn == "file"){
    storage = new LocalStorage(
      Zotero.Prefs.get(`${config.addonRef}.storage.filename`) as string
    )
    await storage.lock;
  } else {
    return 
  }
  ztoolkit.log(storage)

  const events = new Events(storage)
  events.onInit()
  
  const views = new Views(storage)
  // 为用户默认打开显示所有标签，若要显示分类下，需要手动关闭
  const tasks = [
    views.createGraphView(),
    views.renderTitleColumn(),
    views.createTagsColumn(),
    views.createTextTagsColumn(),
    views.createProgressColumn(),
    views.createIFColumn(),
    views.createPublicationTagsColumn(),
    views.createRatingColumn(),
    views.initItemSelectListener(),
    views.addNumberToCollectionTree(),
    views.renderCreatorColumn(),
    views.renderPublicationColumn()
  ]
  try {
    await Promise.all(tasks);
  } catch (e) {
    ztoolkit.log("ERROR", e)
  }
  await views.registerSwitchColumnsViewUI();
  await views.initTags();
  try {
    ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
    ztoolkit.ItemTree.refresh()
  } catch { }
  await views.registerCommands()

  await restoreStyleColumnPrefs(savedStyleColumnPrefs)
}

function onShutdown(): void {
  try {
    ztoolkit.log("zotero style onShutdown")
    ztoolkit.unregisterAll()
    ztoolkit.UI.unregisterAll()
    ztoolkit.ItemTree.unregisterAll()
    
    // 移除创建的按钮
    document.querySelector("#zotero-style-show-hide-graph-view")?.remove();
    // 恢复嵌套标签
    (document.querySelector(".tag-selector") as HTMLDivElement).style.display = ""
  } catch (e) {
    console.log("ERROR onShutdown", e)
  } finally {
    addon.data.alive = false;
    delete Zotero.ZoteroStyle;
  }
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
    window.setTimeout(async () => {
      ztoolkit.log("select reader tab")
      let reader = await ztoolkit.Reader.getReader();
      Zotero.ZoteroStyle.data.views.modifyAnnotationColors(reader);
    })
  } else if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "library"
  ) {
    // ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
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
