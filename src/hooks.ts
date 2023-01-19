import { BasicExampleFactory, UIExampleFactory } from "./modules/examples";
import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import Views from "./modules/views"; 
import Events from "./modules/events";
import AddonItem from "./modules/item";
Zotero._AddonItemGlobal = Zotero._AddonItemGlobal || new AddonItem()
const addonItem = Zotero._AddonItemGlobal

import { ZoteroToolkit } from "E:/Github/zotero-plugin-toolkit/dist"
import { Command, Prompt } from "../../zotero-plugin-toolkit/dist/managers/prompt";

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
  if (!addonItem.item) { await addonItem.init() }

  const views = new Views(addonItem)
  await views.renderTitleProgress()
  await views.createTagsColumn()
  await views.createTextTagsColumn()
  await views.createProgressColumn()
  await views.createIFColumn()
  views.registerSwitchColumnsViewUI()
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

  // Prompt
  const tool = new ZoteroToolkit()
  // 旧版数据迁移
  let getItem = () => {
    let readingItem = Zotero.Items.get(
      Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)?.itemID
    ).parentItem
    let selectedItems = ZoteroPane.getSelectedItems()
    if (!(readingItem || (selectedItems.length == 1))) { return }
    let item = readingItem || selectedItems[0]
    return item
  }
  let getAllTags = (item: _ZoteroItem) => {
    let coloredTags = item.getColoredTags()
    let tags = item.getTags().filter((tag: any) => coloredTags.map((tag: any) => tag.tag).indexOf(tag.tag) == -1)
    return [...coloredTags, ...tags]
  }
  tool.Prompt.register([
    {
      name: "迁移旧版数据",
      label: "Style",
      when: () => {
        let items = ZoteroPane.getSelectedItems()
        return items.length == 1 && items[0].getField("title") == "ZoteroStyle"
      },
      callback: async () => {
        // 迁移数据逻辑
        const tipNode = Zotero._Prompt.showTip("感谢您长时间对Style的支持，数据正在迁移中，请耐心等待！")
        tipNode.style.position = "relative"
        let progress = ztoolkit.UI.createElement(
          document,
          "span",
          {
            styles: {
              position: "absolute",
              height: "100%",
              left: "0",
              top: "0",
              backgroundColor: "#FF8E9E",
              zIndex: "-1",
              opacity: "0.5",
              transition: "width .1 linear"
            }
          }
        )
        tipNode.appendChild(progress)

        progress.style.width = "0%"
        // 迁移逻辑
        let ids = ZoteroPane.getSelectedItems()[0].getNotes()
        let totalTime = 0
        for (let i = 0; i < ids.length; i++) {
          let noteItem = Zotero.Items.get(ids[i])
          try {
            let data = JSON.parse((noteItem.note.replace(/<.+?>/g, "").replace(/[^\n\{]+/, "")))
            // 没有itemKey，搜索本地
            if (!data.itemKey) {
              let s = new Zotero.Search();
              s.addCondition("title", "contains", data.title);
              data.itemKey = Zotero.Items.get((await s.search())[0]).key
              ztoolkit.log(data.itemKey)
            }
            totalTime += (Object.values(data.pageTime) as Array<number>).reduce((a, b)=>a+b)
            let record = {
              page: data.pageNum,
              data: data.pageTime,
            }
            // 写入笔记逻辑
            if (data.itemKey) {
              addonItem.set(
                Zotero.Items.getByLibraryAndKey(1, data.itemKey),
                "readingTime",
                record
              )
            }
          } catch {}
          progress.style.width = `${i/ids.length*100}%`
          Zotero._Prompt.inputNode.value = `[Pending] ${i}/${ids.length}`
          await Zotero.Promise.delay(10)
        }
        Zotero._Prompt.inputNode.value = ""
        Zotero._Prompt.exit()
        Zotero._Prompt.showTip(
          `数据迁移完成，新的一年和Style一起出发吧！\n\n` +
          `从安装Style开始，它与您共同阅读了${ids.length}篇文献，总用时${(totalTime / 60 / 60).toFixed(2)}小时。\n\n` +
          `你走过的路，每一步都算数。`
        )
      }
    },
    {
      name: "影响因子",
      label: "Style",
      when: () => {
        let item = getItem()
        return (item && item.getField("publicationTitle")) as boolean
      },
      callback: async (prompt: Prompt) => {
        let hrefs = [
          "https://www.ablesci.com/assets/css/global_local.css?v=20221123v1",
          "https://www.ablesci.com/assets/layui/css/layui.css"
        ]
        let styles: HTMLElement[] = []
        hrefs.forEach(href => {        
          if (document.querySelector(`[href="${href}"]`)) { return }
          const style = ztoolkit.UI.createElement(
            document, "link",
            {
              properties: {
                type: "text/css",
                rel: "stylesheet",
                href: href,
              },
            }
          );
          styles.push(style)
          document.documentElement.appendChild(style);
        })

        let item = getItem() as _ZoteroItem
        const publicationTitle = item.getField("publicationTitle")
        console.log(publicationTitle)
        let res = await Zotero.HTTP.request(
          "GET",
          `https://www.ablesci.com/journal/index?keywords=${publicationTitle.replace(/\s+/g, "+")}`,
          {
            responseType: "text",
            credentials: "include"
          }
        )
        let text = res.response
        let matchedArray = text.match(/<table[\s\S]+?<\/table>/g)
        if (matchedArray) {
          prompt.inputNode.setAttribute("placeholder", publicationTitle)
          const tableString = matchedArray[0].replace("36%", "20%")
          const parser = new window.DOMParser()
          const table = parser.parseFromString(`<div class="command">${tableString}</div>`, "text/html")
          const container = prompt.createCommandsContainer()
          container.appendChild(table.body.firstChild)
        }
        prompt.promptNode.addEventListener("keyup", (event) => {
          if (event.key == "Escape") {
            styles.forEach(e=>e.remove())
          }
        })
      }
    },
    {
      name: "标签",
      label: "Style",
      when: () => {
        let item = getItem() as _ZoteroItem
        if (item) {
          if (getAllTags(item).length > 0) {
            return true
          }
        }
        return false
      },
      callback: (prompt: Prompt) => {
        const libraryID = 1
        // 重命名标签
        // Zotero.Tags.rename(libraryID, oldName, newName);
        // 指派颜色位置
        // Zotero.Tags.setColor()

        const container = prompt.createCommandsContainer()
        const tags = getAllTags(getItem() as _ZoteroItem)
        const inputStyles = {
          height: "2em",
          border: "1px solid #eee",
          borderRadius: ".1em",
          paddingLeft: "0.5em"
        }
        tags.forEach((tag: { tag: string, color?: string }) => {
          let position = Zotero.Tags.getColor(libraryID, tag.tag)?.position
          position = position == undefined ? undefined : position + 1
          let set = (line: HTMLElement) => {
            const name = (line.querySelector("#name") as HTMLInputElement).value
            const color = (line.querySelector("#color") as HTMLInputElement).value
            const position = (line.querySelector("#position") as HTMLInputElement).value
            if (/^#(\w{3}|\w{6})$/i.test(color) && /^\d+$/.test(position) && name.length)
            Zotero.Tags.setColor(libraryID, name, color, position)
          }
          const line = ztoolkit.UI.createElement(
            document,
            "div",
            {
              classList: ["command"],
              styles: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                width: "100%",
              },
              children: [
                {
                  tag: "span",
                  id: "circle",
                  styles: {
                    display: "inline-block",
                    height: ".7em",
                    width: ".7em",
                    borderRadius: tag.tag.startsWith("#") ? ".1em" : ".7em",
                    backgroundColor: tag.color as string,
                  }
                },
                {
                  tag: "div",
                  children: [
                    {
                      tag: "input",
                      id: "name",
                      styles: inputStyles,
                      properties: {
                        value: tag.tag,
                        placeholder: "名称"
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: () => {
                            Zotero.Tags.rename(libraryID, tag.tag,
                              (line.querySelector("#name") as HTMLInputElement).value as string
                            );
                          }
                        }
                      ]
                    }
                  ]
                },
                {
                  tag: "div",
                  styles: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                  },
                  children: [
                    {
                      tag: "input",
                      id: "color",
                      styles: inputStyles,
                      properties: {
                        value: tag.color || "",
                        placeholder: "颜色"
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: () => {
                            ztoolkit.log((line.querySelector("#circle")! as HTMLElement)
                              .style.backgroundColor);
                            (line.querySelector("#circle")! as HTMLElement)
                              .style.backgroundColor = (line.querySelector("#color")! as HTMLInputElement).value
                            ztoolkit.log((line.querySelector("#circle")! as HTMLElement)
                              .style.backgroundColor);
                            if (!/^\d+$/.test((line.querySelector("#position") as HTMLInputElement).value)) {
                              (line.querySelector("#position") as HTMLInputElement).value = "1"
                            }
                            set(line)
                          }
                        }
                      ]
                    }
                  ]
                },
                {
                  tag: "div",
                  children: [
                    {
                      tag: "input",
                      id: "position",
                      styles: inputStyles,
                      properties: {
                        value: position,
                        placeholder: "位置"
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: () => {
                            set(line)
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          )
          container.appendChild(line)
        })
      }
    },
    {
      name: "查看阅读进度",
      label: "Style",
      when: () => {
        // 有条目，且条目有阅读时间
        let item = getItem()
        if (!item) { return false}
        let record = addonItem.get(item, "readingTime")
        ztoolkit.log(record)
        return record?.data && Object.keys(record.data).length > 0
      },
      callback: (prompt: Prompt) => {
        let item = getItem() as _ZoteroItem
        
        prompt.inputNode.placeholder = item.getField("title")
        const record = addonItem.get(item, "readingTime")
        if (!record || !record.data || Object.keys(record.data).length == 0) {
          prompt.showTip("这里一片荒芜~")
          return
        }
        let commands: Command[] = []
        Object.keys(record.data).forEach(page => {
          let sec = record.data[page]
          let t
          if (sec < 60) {
            t = `${sec} 秒`
          } else if (sec / 60) {
            t = `${(sec / 60).toFixed(1)} 分`
          } else {
            t = `${(sec / 60 / 60).toFixed(1)} 时`
          }
          let openToPage = async (page: number) => {
            let pdfItem = await item.getBestAttachment();
            if (!pdfItem) { return }
            await Zotero.OpenPDF.openToPage(pdfItem, page)
          }
          commands.push({
            name: `第${Number(page) + 1}页`,
            label: t,
            callback: async () => { await openToPage(Number(page) + 1) }
          })
        })
        prompt.showCommands(commands)
      }
    },
    {
      name: "重置阅读进度",
      label: "Style",
      when: () => {
        // 有条目，且条目有阅读时间
        let item = getItem()
        if (!item) { return false }
        let record = addonItem.get(item, "readingTime")
        return record?.data && Object.keys(record.data).length > 0
      },
      callback: () => {
        let item = getItem() as _ZoteroItem
        Zotero._Prompt.inputNode.placeholder = item.getField("title")
        try {          
          let record = addonItem.get(item, "readingTime")
          record.data = {}
          addonItem.set(item, "readingTime", record)
        } catch {}
        Zotero._Prompt.showTip("重置成功")
      }
    },
    {
      name: "设置为插件储存条目",
      when: () => {
        let item = getItem()
        return item?.getField("title").includes("Addon") as boolean
      },
      callback: (prompt: Prompt) => {
        let item = getItem() as _ZoteroItem
        Zotero.Prefs.set(addonItem.prefKey, item.key)
        addonItem.item = item
        prompt.showTip(`设置成功，该条目下有${item.getNotes().length}条记录。`)
      }
    }
  ])
  // 所有快捷键
  let commands: Command[] = []
  let getLable = (keyOptions: any) => {
    let modifiers = keyOptions.modifiers && keyOptions.modifiers.replace("accel", Zotero.isMac ? "⌘" : "ctrl")
    return [...(modifiers?.split(",") || []), keyOptions.key]
      .filter(e => e)
      .map(s => s[0].toUpperCase() + s.slice(1)).join(" + ")
  }
  const en2zh = {
    key_close: "关闭Zotero",
    key_import: "导入",
    key_importFromClipboard: "从剪贴板导入",
    key_copyCitation: "复制引文",
    key_copyBibliography: "复制参考书目",
    key_advancedSearch: "高级搜索",
    key_back: "后退",
    key_forward: "前进",
    key_new_betternotes: "新建Better Notes",
    key_open_betternotes: "打开Better Notes",
    key_export_betternotes: "导出Better Notes",
    key_sync_betternotes: "同步Better Notes",
    key_undo: "撤销",
    key_redo: "重做",
    key_cut: "剪切",
    key_copy: "复制",
    key_paste: "粘贴",
    key_delete: "删除",
    key_selectAll: "全选",
    key_find: "查找",
    key_findAgain: "查找下一个",
    key_findPrevious: "查找上一个",



  }
  for (let keyOptions of ztoolkit.Shortcut.getAll()) {
    if (keyOptions.type != "element") { continue }
    commands.push({
      // @ts-ignore
      name: en2zh[keyOptions.id] || keyOptions.id,
      label: getLable(keyOptions),
      callback: async () => {
        await keyOptions.callback(keyOptions)
      }
    })
  }
  tool.Prompt.register(commands)
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
