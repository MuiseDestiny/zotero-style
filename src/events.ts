import { Addon, addonName } from "./addon";
import AddonModule from "./module";
import Setting from "./setting";

class AddonEvents extends AddonModule {
  public Zotero: any;
  public window: any;
  public document: any;
  public notifierCallback : any;
  public setting: any;
  public intervalID: number;
  public tagSize = 5;  // em
  public progressOpacity = .7;
  public progressColor = "#5AC1BD";
  public constantFields = ["hasAttachment", "title"];
  public recordInterval = 5;  // s
  public maxHangTime = 60;  // s
  public mode = "normal";  // default
  public progress = true;
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
      notify: async (
        event: string,
        type: string,
        ids: Array<number | string>,
        extraData: object
      ) => {
        if (event == "open" && type == "file") {
          // open a pdf
          
        } 
        if (event == "close" && type == "file") {
          // close a pdf
        }
      }
    }
  }

  public async onInit(_Zotero: any) {
    this.Zotero = _Zotero
    this.window = this.Zotero.getMainWindow()
    this.document = this.window.document
    console.log(`${addonName}: init called`);

    // add style about tag
    this.addStyle();

    // add button
    this.addSwitchButton()
  
    // modify Zotero render function
    this.hookZoteroFunction(
      "getMainWindow().ZoteroPane.itemsView._renderPrimaryCell", 
      this.modifyRenderPrimaryCell
    )
    this.hookZoteroFunction(
      "getMainWindow().ZoteroPane.itemsView._renderCell", 
      this.modifyRenderCell
    )
    
    // setting 
    this.setting = new Setting(AddonModule)
    this.setting.init(this.Zotero)
    this.setting.settingNode.style.display = "none"
    this.initKeys()
    // event
    let notifierID = this.Zotero.Notifier.registerObserver(
      this.notifierCallback,
      ["file"]
    );

    this.window.addEventListener(
      "unload",
      function (e) {
        this.Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );

    // listen to Zotero's state
    if (!this.Zotero.Chartero) {
      this.window.addEventListener('activate', () => {
        console.log('activate')
        this.state.activate = true
        // once Zotero is activated again, it will continue to record read time
        this.intervalID = this.window.setInterval(this.recordReadTime.bind(this), this.recordInterval * 1e3)
      }, true);
      this.window.addEventListener('deactivate', () => {
        console.log('deactivate')
        this.state.activate = false
        this.state.hangCount = 0;
        // once Zotero is deactivate again, it will stop to record read time
        this.window.clearInterval(this.intervalID)
      }, true);
    }
  }

  private addSwitchButton(): void {
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
      console.log(constantFields)
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
        console.log("left click")
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
        let settingNode = _Zotero.getMainWindow().document.querySelector("#Zotero-Style-Setting")
        if (settingNode.style.display = "none") {
          settingNode.style.display = ""
          settingNode.querySelector("input").focus()
        } else {
          settingNode.style.display = "none"
        }
      } else if (event.button == 2) {
        console.log("right click")
        _Zotero.ZoteroStyle.events.progress  = !_Zotero.ZoteroStyle.events.progress
        _Zotero.getMainWindow().document.querySelectorAll(".zotero-style-progress").forEach(node=>{
          node.setAttribute("visible", String(node.getAttribute("visible") == "false"))
        })
      } 
    }
    let toolbar = this.document.querySelector("#zotero-items-toolbar")
    let toolbarbutton = toolbar.querySelector("toolbarbutton").cloneNode()
    toolbarbutton.setAttribute("id", "zotero-tb-switch-itemtree")
    toolbarbutton.setAttribute("tooltiptext", "Zotero Style For You")
    toolbarbutton.setAttribute("type", "")
    toolbarbutton.setAttribute("class", "")
    toolbarbutton.setAttribute("onmousedown", "")
    toolbarbutton.innerHTML = normalSvg
    toolbarbutton.addEventListener("click", callback)

    this.document.querySelector("#zotero-items-toolbar").insertBefore(
      toolbarbutton,
      toolbar.querySelector("spacer")
    )
  }

  private addStyle(): void {
    console.log("Start style")
    let mainWindow = this.document.querySelector('#main-window')
    let oldStyle = mainWindow.querySelector("#pageStyle")
    if (oldStyle) oldStyle.remove()
    let style = this.createElement("style")
    style.setAttribute('type', 'text/css')
    style.setAttribute('id', 'pageStyle')
    // some setting value
    let tagSize = this.getValue("Zotero.ZoteroStyle.tagSize", this.tagSize)
    let progressOpacity = this.getValue("Zotero.ZoteroStyle.progressOpacity", this.progressOpacity)
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
        margin-left: auto;
      }
      #zotero-items-tree .cell.primary .zotero-tag {
        height: .9em;
        width: .9em;
        border-radius: 50%;
      }
      #zotero-items-tree .cell.primary .tag-swatch{
        position: absolute;
        font-size: 1em;
        bottom: 0;
      }
      .zotero-style-progress[visible=false] {
        opacity: 0 !important;
      }
      .zotero-style-progress {
        position: absolute;
        left: 3.25em;
        top: 0;
        width: calc(100% - 3.5em - ${tagSize}em) !important;
        height: 100%;
        opacity: ${progressOpacity};
      }
    `
    mainWindow.appendChild(style)
  }

  private createElement(nodeName: string): HTMLElement {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", nodeName)
  }

  private hookZoteroFunction(path: string, func: Function) {
    // path: getMainWindow().ZoteroPane.itemsView._renderCell
    let id = this.window.setInterval(
      (() => {
        let zoteroFunc = eval(`this.Zotero.${path}`)
        let zoteroFuncThis = eval(`this.Zotero.${path.match(/(.+)\.\w/)[1]}`)
        if (zoteroFunc === undefined) return
        // zoteroFunc is the function that needs to be modified
        let modifyFunc = function (...args: any[]) {
          let zoteroFunctionReturn = zoteroFunc.apply(zoteroFuncThis, args)
          var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
            Components.interfaces.nsISupports
          ).wrappedJSObject;
          return func(zoteroFunctionReturn, args, Zotero)
        }
        eval(`this.Zotero.${path} = ${modifyFunc.toString()}`)
        this.window.clearInterval(id)
      }).bind(this),
      1e3
    )
  }

  private modifyRenderPrimaryCell(primaryCell: any, args: any[], Zotero: any): any {
    // https://github.com/zotero/zotero/blob/1c8554d527390ab0cda0352e885d461a13af767c/chrome/content/zotero/itemTree.jsx
    // 2693     _renderPrimaryCell(index, data, column)
    let document = Zotero.getMainWindow().document
    let createElement = (name) => document.createElementNS("http://www.w3.org/1999/xhtml", name)

    // render the tag
    let tagBoxNode = createElement("span")
    tagBoxNode.setAttribute("class", "tag-box")
    primaryCell.appendChild(tagBoxNode)
    // special algin between font and span
    primaryCell.querySelectorAll(".tag-swatch").forEach((tagNode: any, i: number) => {
      let delta = 0
      if (tagNode.style.backgroundColor.includes("rgb")) {
        tagNode.classList.add("zotero-tag")
        delta = .25
      }
      tagNode.style.left = `${i*1.25+delta}em`
      tagBoxNode.appendChild(tagNode)
    })
    if (Zotero.Chartero) {
      return primaryCell
    }
    // render the read progress
    let progressNode = createElement("span")
    progressNode.setAttribute("class", "zotero-style-progress")
    progressNode.setAttribute("visible", String(Zotero.ZoteroStyle.events.progress))
    primaryCell.appendChild(progressNode)
    primaryCell.querySelector(".cell-text").style.zIndex = 999
    // create sub span in this progress node
    const recordKey = `Zotero.ZoteroStyle.record`;
    let record = JSON.parse(Zotero.Prefs.get(recordKey) || "{}");
    // i.e.
    const testTitle = "Satellite remote sensing of aerosol optical depth: advances, challenges, and perspectives"
    record[testTitle] = {
        0: 60 * 3,
        1: 60 * 6,
        2: 5,
        3: 60 * 3,
        4: 60 * 7,
        5: 60 * 2,
        "total": 12
    }
    const title = args[1]
    if (record && record[title]) {
      let recordTimeObj = record[title]
      const total = recordTimeObj["total"]
      let maxSec = 0
      let s = 0
      let n = 0
      for (let i=0; i<total; i++) {
        if (!(recordTimeObj[i])) continue
        if (recordTimeObj[i] > maxSec) {
          maxSec = recordTimeObj[i]
        }
        s += recordTimeObj[i]
        n += 1
      }
      const meanSec = s / n
      maxSec = meanSec + (maxSec - meanSec) * .5
      const minSec = 60
      const pct = 1 / total * 100
      let obj = Zotero.ZoteroStyle.events
      let progressColor = obj.getValue("Zotero.ZoteroStyle.progressColor", obj.progressColor)
      let [r, g, b] = obj.toRGB(progressColor)
      for (let i=0; i<total; i++) {
        // pageSpan represent a page, color represent the length of read time
        let pageSpan = createElement("span")
        let alpha = (recordTimeObj[i] || 0) / (maxSec > minSec ? maxSec : minSec)
        pageSpan.style = `
          width: ${pct}%;
          height: 100%;
          background-color: rgba(${r}, ${g}, ${b}, ${alpha < 1 ? alpha : 1});
          display: inline-block;
        `
        progressNode.appendChild(pageSpan)
      }   
    } 
    return primaryCell
  }

  private modifyRenderCell(cell: any, args: any[], Zotero: any): any {
    const k = "Zotero.ZoteroStyle.constantFields"
    let obj = Zotero.ZoteroStyle.events
    let constantFields = obj.getValue(k, obj.constantFields)
    if (
      // these classnames is visible
      constantFields.filter(
        fieldname => cell.classList.contains(fieldname)
      ).length == 0
    ) {
      if (Zotero.ZoteroStyle.events.mode === "max") {
        cell.style.display = "none"
      }
    }
    return cell
  }

  private getReader(): any {
    return this.Zotero.Reader.getByTabID(this.window.Zotero_Tabs.selectedID);
  }

  public recordReadTime(): void {
    // is not reading
    // it return undefined if no reader selected, so we ignore it
    const reader = this.getReader();
    // Zotero deactivate is ignored too
    if (!(reader && reader.state && this.state.activate)) return;
    console.log("is reading")
    // is reading
    // hang up ? reference to Chartero.js
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
    const totalPageNum = reader._iframeWindow.wrappedJSObject.PDFViewerApplication.pdfDocument.numPages;
    const title = this.Zotero.Items.get(this.Zotero.Items.get(reader.itemID)._parentID)._displayTitle;

    // get local record
    console.log("saving");
    const recordKey = `Zotero.ZoteroStyle.record`;
    let record = JSON.parse(this.Zotero.Prefs.get(recordKey) || "{}");
    if (!record[title]) record[title] = {}
    record[title][this.state.pageIndex] = (
      this.isNumber(record[title][this.state.pageIndex]) 
      ? record[title][this.state.pageIndex]
      : 0
    ) + this.recordInterval;
    record[title]["total"] = totalPageNum;
    this.Zotero.Prefs.set(
      recordKey, 
      JSON.stringify(record)
    );
  }

  private isNumber(arg: any): boolean {
    return (typeof(arg) == "number" && String(arg) != "NaN")
  }

  private initKeys() {
    let keyset = this.document.createElement("keyset");
    keyset.setAttribute("id", "zoterostyle-keyset");

    let key = this.document.createElement("key");
    key.setAttribute("id", "zoterostyle-key");
    key.setAttribute("oncommand", "console.log(111)");
    key.addEventListener("command", function () {
      var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
        Components.interfaces.nsISupports
      ).wrappedJSObject;
      let document = _Zotero.getMainWindow().document
      let settingNode = document.querySelector("#Zotero-Style-Setting")
      if (settingNode.style.display == "none") {
        settingNode.style.display = ""
        settingNode.querySelector("input").focus()
      } else {
        settingNode.style.display = "none"
      }
    })
    key.setAttribute("key", "p")
    key.setAttribute("modifiers", "shift")
    keyset.appendChild(key)
    this.document.getElementById("mainKeyset").parentNode.appendChild(keyset);
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
  };

  public onUnInit(): void {
    console.log(`${addonName}: uninit called`);
    this.Zotero.debug(`${addonName}: uninit called`);
    this.Zotero.ZoteroStyle = undefined;
  }
}


export default AddonEvents;