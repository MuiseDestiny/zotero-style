import { Addon, addonName } from "./addon";
import AddonModule from "./module";
import { stylePatch as $patch$ } from './monkey-patch'
// import { register, unregister, TaskType } from "./prompt";

class AddonEvents extends AddonModule {
  public notifierCallback : any;
  public setting: any;
  public toolbarbutton: any;
  public style: any;
  public intervalID: number;
  public oriErase: any
  public idForBtn: number;
  public _hookFunction = {};
  public record = {};
  public tagSize = 5;  // em
  public tagPosition = 4; 
  public tagAlign = "left";  // em
  public progressOpacity = .7;
  public progressColor = "#5AC1BD";
  public constantFields = ["hasAttachment", "title"];
  public recordInterval = 5;  // s
  public updateInterval = 60;  // s
  public maxHangTime = 60;  // s
  public mode = "normal";  // default
  public state = {
    activate: true,
    pageIndex: null,
    left: null,
    top: null,
    hangCount: null
  }

  constructor(parent: Addon) {
    super(parent);
    this.notifierCallback  = {
      // use it later
      notify: async (
        event: string,
        type: string,
        ids: Array<number | string>,
        extraData: object
      ) => {
        if (event == "open") {
          console.log(ids, extraData)
        } 
        if (event == "close") {
        }
      }
    }
  }

  public async onInit() {
    console.log(`${addonName}: init called`);

    // add button
    this.addSwitchButton()
    this.idForBtn = this.window.setInterval(() => {
      if (!this.document.querySelector("#zotero-items-toolbar #zotero-tb-switch-itemtree")) {
        this.addSwitchButton()
      }
    }, 1e3)

    enum TaskType {
      Default = "Default",
      CreateView = "CreateView",
      SetValue = "SetValue",
      SelectValue = "SelectValue"
    }
    console.log(TaskType)
    await this._Addon.toolkit.Prompt.register([
      {
        name: "进度条",
        label: "Style",
        task: {
          Commands: [
            {
              name: "颜色",
              label: "进度条",
              task: {
                SetValue: {
                  values: [
                    { intro: "请输入颜色", check: (text) => /#\w+/.test(text) }
                  ],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressColor")
                  },
                  set: (values) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressColor", values[0])
                    this.refresh()
                  }
                }
              }
            },
            {
              name: "透明度",
              label: "进度条",
              task: {
                SetValue: {
                  values: [
                    { intro: "请输入透明度0~1", check: (text) => String(Number(text)) != "NaN" }
                  ],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressOpacity")
                  },
                  set: (values) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressOpacity", values[0])
                    this.refresh()
                  }
                }
              }
            },
            {
              name: "阅读时间",
              label: "进度条",
              task: {
                CreateView: () => {
                  const prompt = this.Zotero._Prompt
                  // get selected
                  let item = this.getReadingItem() || this.window.ZoteroPane.getSelectedItems()[0] as _ZoteroItem
                  const itemTitle = item.getField("title")
                  const itemKey = item.key
                  // get time
                  let itemRecord = this.record[itemKey] || this.record[itemTitle]
                  if (!itemRecord) {
                    return prompt.showEmpty("阅读后才有时间哦~")
                  }
                  const pageTime = itemRecord.pageTime
                  prompt.clear()
                  Object.keys(pageTime).forEach(page => {
                    let sec = pageTime[page]
                    let t
                    if (sec < 60) {
                      t = `${sec}秒`
                    } else if (sec / 60) {
                      t = `${(sec / 60).toFixed(1)}分`
                    } else {
                      t = `${(sec / 60 / 60).toFixed(1)}时`
                    }
                    prompt.commandsNode.appendChild(
                      prompt.createItem(`第${Number(page) + 1}页`, t)
                    )
                  })
                }
              }
            },
            {
              name: "显示/隐藏",
              label: "进度条",
              task: {
                Default: () => {
                  this.document.querySelectorAll(".zotero-style-progress").forEach(node => {
                    let flag = String(node.getAttribute("visible") == "false")
                    node.setAttribute("visible", flag)
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressVisible", flag)
                  })
                }
              }
            }
          ]
        }
      },
      {
        name: "标签",
        label: "Style",
        task: {
          Commands: [
            {
              name: "对齐",
              label: "标签",
              task: {
                SelectValue: {
                  values: ["left", "right"],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagAlign")
                  },
                  set: (value) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagAlign", value)
                    this.Zotero.ZoteroStyle.events.refresh()
                  }
                }
              }
            },
            {
              name: "宽度",
              label: "标签",
              task: {
                SetValue: {
                  values: [
                    { intro: "请输入宽度/em", check: (text) => String(Number(text)) != "NaN" }
                  ],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagSize")
                  },
                  set: (values) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagSize", values[0])
                    this.Zotero.ZoteroStyle.events.refresh()
                  }
                }

              }
            },
            {
              name: "位置",
              label: "标签",
              task: {
                SelectValue: {
                  values: ["0", "1", "2", "3", "4"],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagPosition")
                  },
                  set: (value) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagPosition", value)
                    this.Zotero.ZoteroStyle.events.refresh()
                  }
                }
              }
            }
          ]
        }
      },
      {
        name: "字段",
        label: "Style",
        task: {
          Commands: [
            {
              name: "最大/小化",
              label: "字段",
              task: {
                Default: () => {
                  let btn = this.document.querySelector("#zotero-tb-switch-itemtree") as HTMLButtonElement
                  btn.click()
                }
              }
            },
            {
              name: "保留字段",
              label: "字段",
              task: {
                SetValue: {
                  values: [
                    {
                      intro: "请输入要保留的字段，如['title', 'year']", check: (text) => {
                        try {
                          let arr = eval(text)
                          if (arr.length) {
                            return true
                          } else {
                            return false
                          }
                        } catch {
                          return false
                        }
                      }
                    }
                  ],
                  get: () => {
                    return this.Zotero.Prefs.get("Zotero.ZoteroStyle.constantFields")
                  },
                  set: (values) => {
                    this.Zotero.Prefs.set("Zotero.ZoteroStyle.constantFields", values[0])
                    this.Zotero.ZoteroStyle.events.refresh()
                  }
                }
              }
            }
          ]
        }
      },
      {
        name: "影响因子",
        label: "Ablesci",
        when: () => {
          let readingItem = this.getReadingItem()
          let selectedItems = this.window.ZoteroPane.getSelectedItems()
          return (readingItem || selectedItems[0]) as boolean
        },
        task: {
          CreateView: async () => {
            let addCSSLink = (url) => {
              let link = this.createElement("link")
              link.setAttribute("rel", "stylesheet")
              link.setAttribute("type", "text/css")
              link.setAttribute("href", url)
              this.document.querySelector('#main-window').appendChild(link)
            }
            const urls = [
              "https://www.ablesci.com/assets/css/global_local.css?v=20221123v1",
              "https://www.ablesci.com/assets/layui/css/layui.css"
            ]
            urls.forEach(url => {
              if (!this.document.querySelector(`link[href='${url}']`)) {
                addCSSLink(url)
              }
            })

            let readingItem = this.getReadingItem()
            let selectedItems = this.window.ZoteroPane.getSelectedItems()
            let item = readingItem || selectedItems[0]
            const publicationTitle = item.getField("publicationTitle")
            console.log(publicationTitle)
            let res = await this.Zotero.HTTP.request(
              "GET",
              `https://www.ablesci.com/journal/index?keywords=${publicationTitle.replace(/ /g, "+")}`,
              {
                responseType: "text",
                credentials: "include"
              }
            )
            let text = res.response
            let matchedArray = text.match(/<table[\s\S]+?<\/table>/g)
            let prompt = this.Zotero._Prompt
            if (matchedArray) {
              prompt.inputNode.setAttribute("placeholder", publicationTitle)
              const tableString = matchedArray[0].replace("36%", "20%")
              const parser = new this.window.DOMParser()
              const table = parser.parseFromString(`<div class="command">${tableString}</div>`, "text/html")
              prompt.commandsNode.querySelectorAll(".command").forEach(e => e.remove())
              prompt.commandsNode.appendChild(table.body.firstChild)
            }
          }
        }
      },
      {
        name: "指派标签颜色位置",
        label: "Zotero",
        task: {
          SetValue: {
            values: [
              { intro: "请输入要指派的标签", check: (text) => /.+/.test(text) },
              { intro: "请输入要指派的颜色", check: (text) => /#\w+/.test(text) },
              { intro: "请输入要指派的位置", check: (text) => /\d+/.test(text) }
            ],
            set: (values) => {
              this.Zotero.Tags.setColor(1, ...values)
            }
          }
        }
      },
    ])
    
    // event
    let notifierID = this.Zotero.Notifier.registerObserver(
      this.notifierCallback,
      ["file", "tab", "item"]
    );

    this.window.addEventListener(
      "unload",
      async (e) => {
        this.Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );
    
    // listen to Zotero's state if no Chartero
    this.window.addEventListener('activate', async () => {
      this.state.activate = true
      // once Zotero is activated again, it will continue to record read time
      this.intervalID = this.window.setInterval(this.recordReadTime.bind(this), this.recordInterval * 1e3)
    }, true);
    this.window.addEventListener('deactivate', async () => {
      this.state.activate = false
      this.state.hangCount = 0;
      // once Zotero is deactivate again, it will stop to record read time
      this.window.clearInterval(this.intervalID)
    }, true);

    await this.patchFunctions()

    this.addStyle()
 
    console.log("wait for collectionTreeRow")
    while (!this.window.ZoteroPane.itemsView.collectionTreeRow) {
      await this.Zotero.Promise.delay(10)
    }
    console.log("collectionTreeRow is ready")
    
    await this.initAddonItem()

    console.log("hookErase")
    this.modifyErase()

  }

  private addSwitchButton(): void {
    this.removeSwitchButton()
    const normalSvg = `
      <svg t="1669171122131" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3737" width="16" height="16"><path d="M761.055557 532.128047c0.512619-0.992555 1.343475-1.823411 1.792447-2.848649 8.800538-18.304636 5.919204-40.703346-9.664077-55.424808L399.935923 139.743798c-19.264507-18.208305-49.631179-17.344765-67.872168 1.888778-18.208305 19.264507-17.375729 49.631179 1.888778 67.872168l316.960409 299.839269L335.199677 813.631716c-19.071845 18.399247-19.648112 48.767639-1.247144 67.872168 9.407768 9.791372 21.984142 14.688778 34.560516 14.688778 12.000108 0 24.000215-4.479398 33.311652-13.439914l350.048434-337.375729c0.672598-0.672598 0.927187-1.599785 1.599785-2.303346 0.512619-0.479935 1.056202-0.832576 1.567101-1.343475C757.759656 538.879828 759.199462 535.391265 761.055557 532.128047z" p-id="3738" fill="#7e7e7e"></path></svg>
    `
    const maxSvg = `
      <svg t="1669171254064" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4645" width="16" height="16"><path d="M671.968176 911.99957c-12.287381 0-24.576482-4.67206-33.951566-14.047144L286.048434 545.984249c-18.751888-18.719204-18.751888-49.12028 0-67.872168L638.016611 126.111222c18.751888-18.751888 49.12028-18.751888 67.872168 0 18.751888 18.719204 18.751888 49.12028 0 67.872168l-318.016611 318.047574L705.888778 830.047574c18.751888 18.751888 18.751888 49.12028 0 67.872168C696.544658 907.32751 684.255557 911.99957 671.968176 911.99957z" p-id="4646" fill="#7e7e7e"></path></svg>
    `
    let switchDisplay = (_Zotero: any) => {
      let document = _Zotero.ZoteroStyle.events.document
      const k = "Zotero.ZoteroStyle.constantFields"
      let obj = _Zotero.ZoteroStyle.events
      let constantFields = obj.getValue(k, obj.constantFields)
      let switchNodeDisplay = (node: HTMLElement) => {
        if (
          constantFields.filter(
            classname => node.classList.contains(classname)
          ).length == 0
        ) {
          node.style.display = (node.style.display == "none" ? "" : "none")
        }
      }
      document.querySelector(".virtualized-table-header").childNodes.forEach(switchNodeDisplay)
      document.querySelectorAll("[id^=item-tree-main-default-row-]").forEach((itemNode) =>
        itemNode.childNodes.forEach(switchNodeDisplay)
      )
    }
    let callback = function (event) {
      var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
        Components.interfaces.nsISupports
      ).wrappedJSObject;
      if (event.button == 0) {
        if (this.classList.contains('max')) {
          _Zotero.ZoteroStyle.events.mode = "normal"
          this.classList.remove("max")
          switchDisplay(_Zotero)
          this.innerHTML = normalSvg
        } else {
          _Zotero.ZoteroStyle.events.mode = "max"
          this.classList.add("max")
          switchDisplay(_Zotero)
          this.innerHTML = maxSvg
        }
      } else if (event.button == 1) {
        // setting ui
        console.log("init Setting")
        let promptNode = _Zotero.getMainWindow().document.querySelector(".prompt")
        if (promptNode.style.display = "none") {
          promptNode.style.display = ""
          promptNode.querySelector("input").focus()
        } else {
          promptNode.style.display = "none"
        }
      } else if (event.button == 2) {
        _Zotero.getMainWindow().document.querySelectorAll(".zotero-style-progress").forEach(node=>{
          let flag = String(node.getAttribute("visible") == "false")
          node.setAttribute("visible", flag)
          _Zotero.Prefs.set("Zotero.ZoteroStyle.progressVisible", flag)
        })
      } 
    }
    let toolbar = this.document.querySelector("#zotero-items-toolbar")
    let toolbarbutton = toolbar.querySelector("toolbarbutton").cloneNode()
    toolbarbutton.setAttribute("id", "zotero-tb-switch-itemtree")
    toolbarbutton.setAttribute("tooltiptext", "Zotero Style For You")
    toolbarbutton.setAttribute("class", "zotero-tb-button")
    toolbarbutton.setAttribute("type", "")
    toolbarbutton.setAttribute("onmousedown", "")
    toolbarbutton.innerHTML = normalSvg
    toolbarbutton.addEventListener("click", callback)
    this.toolbarbutton = toolbarbutton
    this.document.querySelector("#zotero-items-toolbar").insertBefore(
      toolbarbutton,
      toolbar.querySelector("spacer")
    )
  }

  private removeSwitchButton(): void {
    if (this.toolbarbutton) this.toolbarbutton.remove()
  }

  private addStyle(): void {
    console.log("Start style")
    let mainWindow = this.document.querySelector('#main-window')
    this.removeStyle()
    let style = this.createElement("style")
    style.setAttribute('type', 'text/css')
    style.setAttribute('id', 'pageStyle')
    // some setting value
    let tagSize = this.getValue("Zotero.ZoteroStyle.tagSize", this.tagSize)
    let progressOpacity = this.getValue("Zotero.ZoteroStyle.progressOpacity", this.progressOpacity)
    let tagPosition = this.getValue("Zotero.ZoteroStyle.tagPosition", this.tagPosition)
    style.textContent = `
      .primary {
        display: flex;
        position: relative;
        box-sizing: border-box;
      }
      .tag-box {
        position: relative;
        width: ${tagSize}em;
        height: 1em;
        line-height: 1em;
        ${tagPosition == 4 ? 'margin-left: auto;' : ''}
      }
      #zotero-items-tree .cell.primary .zotero-tag {
        height: .9em;
        width: .9em;
        border-radius: 50%;
      }
      #zotero-items-tree .cell.primary .tag-swatch{
        ${tagPosition > 0 ? "position: absolute;" : ""}
        font-size: 1em;
        bottom: 0;
        z-index: 999;
      }
      .zotero-style-progress[visible=false] {
        opacity: 0 !important;
      }
      .zotero-style-progress {
        position: absolute;
        left: ${[0, 4].indexOf(tagPosition) != -1 ? 3.25 : 3.25 + tagSize}em !important;
        top: 0;
        width: calc(100% - 3.5em - ${tagSize}em) !important;
        height: 100%;
        opacity: ${progressOpacity};
      }
    `
    this.style = style
    mainWindow.appendChild(style)
  }

  private removeStyle(): void {
    if (this.style) this.style.remove()
  }

  public modifyErase() {
    let oriErase = this.Zotero.Items.erase
    this.oriErase = oriErase
    var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
    Zotero.Items.erase = async function (ids) {
      ids.forEach(async (id)=>{
        let item = await this.getAsync(id)
        console.log("this.Zotero.Items.erase", item)
        const regex = /(zoterostyle|protected)/i
        var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
          Components.interfaces.nsISupports
        ).wrappedJSObject;
        if (Zotero.ZoteroStyle && (regex.test(item.getField("archive")) || regex.test(item.getField("title")))) {
          console.log(`zoterostyle item [protected]- title: ${item.getField("title")}; archive: ${item.getField("archive")}`)
        } else {
          await oriErase.apply(this, [[id]])
        }
      })
    }
  }

  public async patchFunctions() {
    while (true) {
      if (!this.window.ZoteroPane.itemsView._renderPrimaryCell || !this.window.ZoteroPane.itemsView._renderCell) { await this.Zotero.Promise.delay(100); continue }
      $patch$(this.window.ZoteroPane.itemsView, "_renderPrimaryCell")
      $patch$(this.window.ZoteroPane.itemsView, "_renderCell")
      break
    }
  }

  private async initAddonItem() {
    let localRecord = this.getValue("Zotero.ZoteroStyle.record", {})
    let isUpdate = this.getValue("Zotero.ZoteroStyle.firstUpdate", false)
    if (!isUpdate) {
      await this.Zotero.Promise.delay(10000)
    }
    await this._Addon.item.init(this.Zotero)
    if (localRecord && !isUpdate) {
      await this._Addon.item.updateNoteItems(localRecord)
      this.setValue("Zotero.ZoteroStyle.firstUpdate", true)
      this.record = localRecord
    } else {
      this.record = await this._Addon.item.readNoteItemsAsData()
    }
    console.log("this.record", this.record)
    this.refresh()
  }

  private getReader() {
    return this.Zotero.Reader.getByTabID(((this.window as any).Zotero_Tabs as typeof Zotero_Tabs).selectedID);
  }

  private getReadingItem() {
    let reader = this.getReader()
    if (reader) {
      let item = this.Zotero.Items.get(reader.itemID).parentItem as any
      return item
    } else {
      return false
    }
  }

  public recordReadTime() {
    // is not reading
    // it return undefined if no reader selected, so we ignore it
    const reader = this.getReader();
    // Zotero deactivate is ignored too
    if (!(reader && reader.state && this.state.activate)) return;
    // console.log("is reading")
    // is reading
    // hang up ?
    const pageIndex = reader.state.pageIndex;
    if (pageIndex == this.state.pageIndex) {
        if (reader.state.left == this.state.left && reader.state.top == this.state.top)
            this.state.hangCount ++;
        else {
          this.state.left = reader.state.left;
            this.state.top = reader.state.top;
            this.state.hangCount = 0;
        }
    } else {
        this.state.pageIndex = pageIndex;
        this.state.hangCount = 0;
    }
    // yes, hang up
    if (this.state.hangCount * this.recordInterval > this.maxHangTime) return;

    // real read, record this recordInterval
    const PageNum = reader._iframeWindow.wrappedJSObject.PDFViewerApplication.pdfDocument.numPages;
    const item = this.getReadingItem()
    const title = item.getField("title")
    const itemKey = item.key

    // get local record
    if (!this.record[itemKey]) {
      if (this.record[title]) {
        this.record[itemKey] = this.record[title]
        this.record[itemKey].noteKey = itemKey
        this.record[itemKey].title = title
      } else {
        this.record[itemKey] = {
          pageTime: {},
          noteKey: itemKey,
          title: title,
          pageNum: 0
        } 
      }
    }
    this.record[itemKey].pageTime[this.state.pageIndex] = (
      this.isNumber(this.record[itemKey].pageTime[this.state.pageIndex]) 
      ? this.record[itemKey].pageTime[this.state.pageIndex]
      : 0
    ) + this.recordInterval;
    this.record[itemKey].pageNum = PageNum;
    this._Addon.item.updateNoteItem(this.record[itemKey])
  }

  private isNumber(arg: any): boolean {
    return (typeof(arg) == "number" && String(arg) != "NaN")
  }

  private toRGB(color: string) {
    var sColor = color.toLowerCase();
    //十六进制颜色值的正则表达式
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 如果是16进制颜色
    if (sColor && reg.test(sColor)) {
        if (sColor.length === 4) {
            var sColorNew = "#";
            for (var i=1; i<4; i+=1) {
                sColorNew += sColor.slice(i, i+1).concat(sColor.slice(i, i+1));    
            }
            sColor = sColorNew;
        }
        //处理六位的颜色值
        var sColorChange = [];
        for (var i=1; i<7; i+=2) {
            sColorChange.push(parseInt("0x"+sColor.slice(i, i+2)));    
        }
        return sColorChange;
    }
    return sColor;
  }

  public refresh() {
    this.addStyle()
    try {
      this.window.ZoteroPane.itemsView.refreshAndMaintainSelection()
    } catch (e) {
      console.log(e)
    }
  }

  public onUnInit(): void {
    console.log(`${addonName}: uninit called`);
    this.Zotero.debug(`${addonName}: uninit called`);
    // remove ZoteroStyle UI
    this.removeStyle()
    this.removeSwitchButton()
    this._Addon.prompt.removeKeys()
    this.window.clearInterval(this.idForBtn)
    this.Zotero.ZoteroStyle = undefined;
  }
}

export default AddonEvents;