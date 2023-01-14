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
  await views.createTagColumn()
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
  tool.Prompt.register([
    {
      name: "迁移旧版数据",
      label: "Style",
      when: () => {
        let items = ZoteroPane.getSelectedItems()
        return items.length == 1 && items[0].getField("title") == "ZoteroStyle"
      },
      task: {
        Default: async () => {
          // 迁移数据逻辑
          Zotero._Prompt.showTip("感谢您长时间对Style的支持，数据正在迁移中，请耐心等待！")
          let node = document.querySelector(".prompt-commands .command-Tip")
          node.style.position = "relative"
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
          node.appendChild(progress)

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
          Zotero._Prompt.showTip(
            `数据迁移完成，新的一年和Style一起出发吧！\n\n` +
            `从安装Style开始，它与您共同阅读了${ids.length}篇文献，总用时${(totalTime / 60 / 60).toFixed(2)}小时。\n\n` +
            `你走过的路，每一步都算数。`
          )
        }
      }
    },
    {
      name: "影响因子",
      label: "Style",
      task: {
        CreateView: async () => {
          let hrefs = [
            "https://www.ablesci.com/assets/css/global_local.css?v=20221123v1",
            "https://www.ablesci.com/assets/layui/css/layui.css"
          ]
          hrefs.forEach(href => {        
            if (document.querySelector(`[href="${href}"]`)) { return }
            const styles = ztoolkit.UI.createElement(
              document, "link",
              {
                properties: {
                  type: "text/css",
                  rel: "stylesheet",
                  href: href,
                },
              }
            );
            document.documentElement.appendChild(styles);
          })

          let readingItem = Zotero.Items.get(
            Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)?.itemID
          ).parentItem
          ztoolkit.log(readingItem)
          let selectedItems = ZoteroPane.getSelectedItems()
          if (!(readingItem || selectedItems)) { return }
          let item = readingItem || selectedItems[0]
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
          const prompt = Zotero._Prompt
          if (matchedArray) {
            prompt.inputNode.setAttribute("placeholder", publicationTitle)
            const tableString = matchedArray[0].replace("36%", "20%")
            const parser = new window.DOMParser()
            const table = parser.parseFromString(`<div class="command">${tableString}</div>`, "text/html")
            prompt.commandsNode.querySelectorAll(".command").forEach((e: HTMLElement) => e.remove())
            prompt.commandsNode.appendChild(table.body.firstChild)
          }
        }
      }
    },
    {
      name: "指派任意颜色位置标签",
      label: "Style",
      task: {
        SetValue: {
          values: [
            { intro: "请输入要指派的标签", check: (arg) => { return /.+/.test(arg) } },
            { intro: "请输入要指派的颜色", check: (arg) => { return /#\w+/.test(arg) } },
            { intro: "请输入要指派的位置", check: (arg) => { return /\d+/.test(arg) } }
          ],
          set: (args) => {
            Zotero.Tags.setColor(1, args[0], args[1], args[2])
          },
        }
      }
    },
    {
      name: "阅读时间",
      label: "Style",
      when: () => ZoteroPane.getSelectedItems().length == 1,
      task: {
        Commands: [
          {
            name: "重置",
            label: "阅读进度",
            task: {
              Default: () => {
                let record = addonItem.get(ZoteroPane.getSelectedItems()[0], "readingTime")
                record.data = {}
                addonItem.set(ZoteroPane.getSelectedItems()[0], "readingTime", record)
              }
            }
          },
          {
            name: "查看",
            label: "阅读进度",
            task: {
              CreateView: () => {
                const record = addonItem.get(ZoteroPane.getSelectedItems()[0], "readingTime")
                const prompt = Zotero._Prompt as Prompt
                prompt.commandsNode.querySelectorAll(".command").forEach((e: any) => e.remove())
                
                Object.keys(record.data).forEach(page => {
                  let sec = record.data[page]
                  let t
                  if (sec < 60) {
                    t = `${sec}秒`
                  } else if (sec / 60) {
                    t = `${(sec / 60).toFixed(1)}分`
                  } else {
                    t = `${(sec / 60 / 60).toFixed(1)}时`
                  }
                  prompt.commandsNode.appendChild(
                    prompt.createCommandNode(`第${Number(page) + 1}页`, t)
                  )
                })
              }
            }
          }
        ]
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
  for (let keyOptions of ztoolkit.Shortcut.getAll()) {
    if (keyOptions.type != "element") { continue }
    commands.push({
      name: keyOptions.id,
      label: getLable(keyOptions),
      task: {
        Default: () => {
          Zotero._Prompt.showTip("正在开发，敬请期待！")
        }
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
