import { config } from "../../package.json";
import AddonItem from "./item";
import LocalStorage from "./localStorage";


export function registerPrefs() {
  const prefOptions = {
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: "Style",
    image: `chrome://${config.addonRef}/content/icons/favicon@32x32.png`,
    extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
    defaultXUL: true,
  };
  ztoolkit.PreferencePane.register(prefOptions);
}

export function registerPrefsScripts(_window: Window) {
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
    };
  } else {
    addon.data.prefs.window = _window;
  }
  const doc = addon.data.prefs!.window.document
  const fileKey = `${config.addonRef}.storage.filename`
  const filename = Zotero.Prefs.get(fileKey) as string
  const fileRadio = doc.querySelector("#storage-file") as XUL.Radio
  if (filename && filename.length) {
    fileRadio.setAttribute("disabled", "false")
  }
  doc.querySelector("#choose-path")?.addEventListener("command", async () => {
    const filename = await new ztoolkit.FilePicker(
      "Select File",
      "open",
      [
        ["JSON File(*.json)", "*.json"],
        ["Any", "*.*"],
      ],
      "zoterostyle.json"
    ).open();
    if (filename) {
      Zotero.Prefs.set(fileKey, filename)
      fileRadio.setAttribute("disabled", "false")
      // 用本地笔记更新
      // 检查key
      let addonItem = new AddonItem()
      await addonItem.init()
      console.log(addonItem)
      let ids = addonItem.item.getNotes()
      const storage = new LocalStorage(filename)
      await storage.lock.promise;
      ids.forEach(async (id: number) => {
        try {
          let noteItem = Zotero.Items.get(id)
          const item = Zotero.Items.getByLibraryAndKey(1, noteItem._displayTitle)
          const data = addonItem.getNoteData(noteItem)
          if (!storage.get(item, "readingTime") && data["readingTime"]) {
            console.log("Write ...", data["readingTime"])
            await storage.set(item, "readingTime", data["readingTime"])
          }
        } catch(e) {console.log(e)}
      })
      Object.keys(storage.cache).forEach((_id: string) => {
        let id = Number(_id)
        let key = Zotero.Items.get(id).key
        let data = storage.cache[key]
        if (!data.readingTime?.data) {
          storage.cache[key] = storage.cache[id]
        }
      })
      window.setTimeout(async () => {
        await Zotero.File.putContentsAsync(storage.filename, JSON.stringify(storage.cache));
        ztoolkit.getGlobal("alert")("Please restart Zotero.")
      })
    }
  })
}
