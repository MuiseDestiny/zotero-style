import { Addon, addonName } from "./addon";
import AddonModule from "./module";

class AddonEvents extends AddonModule {
  public Zotero: any;
  public window: any;
  public document: any;
  public notifierCallback : any;
  public intervalID: number;
  public recordInterval = 5;  // s
  public maxHangTime = 60;  // s
  public tagSize = .8;  // em
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
    this.modifyRenderPrimaryCell()
    this.modifyRenderCell()
    
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

  private addSwitchButton(): void {
    const normalSvg = `
      <svg t="1669171122131" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3737" width="16" height="16"><path d="M761.055557 532.128047c0.512619-0.992555 1.343475-1.823411 1.792447-2.848649 8.800538-18.304636 5.919204-40.703346-9.664077-55.424808L399.935923 139.743798c-19.264507-18.208305-49.631179-17.344765-67.872168 1.888778-18.208305 19.264507-17.375729 49.631179 1.888778 67.872168l316.960409 299.839269L335.199677 813.631716c-19.071845 18.399247-19.648112 48.767639-1.247144 67.872168 9.407768 9.791372 21.984142 14.688778 34.560516 14.688778 12.000108 0 24.000215-4.479398 33.311652-13.439914l350.048434-337.375729c0.672598-0.672598 0.927187-1.599785 1.599785-2.303346 0.512619-0.479935 1.056202-0.832576 1.567101-1.343475C757.759656 538.879828 759.199462 535.391265 761.055557 532.128047z" p-id="3738" fill="#7e7e7e"></path></svg>
    `
    const maxSvg = `
      <svg t="1669171254064" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4645" width="16" height="16"><path d="M671.968176 911.99957c-12.287381 0-24.576482-4.67206-33.951566-14.047144L286.048434 545.984249c-18.751888-18.719204-18.751888-49.12028 0-67.872168L638.016611 126.111222c18.751888-18.751888 49.12028-18.751888 67.872168 0 18.751888 18.719204 18.751888 49.12028 0 67.872168l-318.016611 318.047574L705.888778 830.047574c18.751888 18.751888 18.751888 49.12028 0 67.872168C696.544658 907.32751 684.255557 911.99957 671.968176 911.99957z" p-id="4646" fill="#7e7e7e"></path></svg>
    `
    let switchDisplay = (_Zotero: any) => {
      const skipClassNames = ["hasAttachment", "title"]
      let document = _Zotero.ZoteroStyle.events.document
      let switchNodeDisplay = (node: HTMLElement) => {
        if (
          skipClassNames.filter(
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
    toolbarbutton.setAttribute("tooltiptext", "switch itemtree")
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
    let style = this.createElement("style")
    style.setAttribute('type', 'text/css')
    style.setAttribute('id', 'pageStyle')
    style.textContent = `
      #zotero-items-tree .cell.primary .zotero-tag {
        height: ${this.tagSize}em;
        width: ${this.tagSize}em;
        margin: auto;
        border-radius: 100%;
      }
      .zotero-style-progress[visible=false] {
        opacity: 0 !important;
        animation: opacity 1s linear !important;
      }
    `
    mainWindow.appendChild(style)
  }

  private createElement(nodeName: string): HTMLElement {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", nodeName)
  }

  private modifyRenderPrimaryCell(): void {
    // https://github.com/zotero/zotero/blob/1c8554d527390ab0cda0352e885d461a13af767c/chrome/content/zotero/itemTree.jsx
    // 2693     _renderPrimaryCell(index, data, column)
    let id = this.window.setInterval(
      (() => {
        if (this.window.ZoteroPane.itemsView._renderPrimaryCell === undefined) return
        let zotero_renderPrimaryCell = this.window.ZoteroPane.itemsView._renderPrimaryCell
        this.window.ZoteroPane.itemsView._renderPrimaryCell = function (index, data, column) {
          
          let primaryCell = zotero_renderPrimaryCell.call(this.window.ZoteroPane.itemsView, index, data, column)
          // move all tagNode to a new parent, tagBox
          var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
            Components.interfaces.nsISupports
          ).wrappedJSObject;
          let document = _Zotero.getMainWindow().document
          let createElement = (name) => document.createElementNS("http://www.w3.org/1999/xhtml", name)
          let tagBoxNode = createElement("span")
          tagBoxNode.setAttribute("class", "tag-box")
          primaryCell.appendChild(tagBoxNode)
          primaryCell.querySelectorAll(".tag-swatch").forEach(tagNode => {
            if (tagNode.style.backgroundColor.includes("rgb")) {
              tagNode.classList.add("zotero-tag")
            }
            tagBoxNode.appendChild(tagNode)
          })
          primaryCell.style.display = "flex"
          tagBoxNode.style = `
            width: 5em;
            line-height: 1em;
            margin-left: auto;
          `
          // render the read progress
          primaryCell.style = `
            position: relative;
            box-sizing: border-box;
          `
          let progressNode = createElement("span")
          progressNode.setAttribute("class", "zotero-style-progress")
          progressNode.setAttribute("visible", String(_Zotero.ZoteroStyle.events.progress))
          progressNode.style = `
            position: absolute;
            left: 3.2em;
            top: 0;
            width: calc(100% - 3.7em - 5em);
            height: 100%;
            opacity: .8;
            animation: opacity 1s linear;
          `
          primaryCell.appendChild(progressNode)
          primaryCell.querySelector(".cell-text").style.zIndex = 999
          // create sub span in this progress node
          const recordKey = `Zotero.ZoteroStyle.record`;
          let record = JSON.parse(_Zotero.Prefs.get(recordKey) || "{}");
          console.log(record)
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
          const title = data
          console.log(title)
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
            for (let i=0; i<total; i++) {
              // pageSpan represent a page, color represent the length of read time
              let pageSpan = createElement("span")
              let alpha = (recordTimeObj[i] || 0) / (maxSec > minSec ? maxSec : minSec)
              pageSpan.style = `
                width: ${pct}%;
                height: 100%;
                background-color: rgba(90, 193, 189, ${alpha < 1 ? alpha : 1});
                display: inline-block;
              `
              progressNode.appendChild(pageSpan)
            }   
          } 
          return primaryCell
        }
        this.window.clearInterval(id)
      }).bind(this),
      1e3
    )

  }

  private modifyRenderCell(): void {
    // https://github.com/zotero/zotero/blob/1c8554d527390ab0cda0352e885d461a13af767c/chrome/content/zotero/itemTree.jsx
    // 2693     _renderCell(index, data, column)
    let id = this.window.setInterval(
      (() => {
        if (this.window.ZoteroPane.itemsView._renderCell === undefined) return
        let zotero_renderCell = this.window.ZoteroPane.itemsView._renderCell
        this.window.ZoteroPane.itemsView._renderCell = function (index, data, column) {
          let cell = zotero_renderCell.call(this.window.ZoteroPane.itemsView, index, data, column)
          if (
            // these classnames is visible
            ["hasAttachment", "title"].filter(
              classname => cell.classList.contains(classname)
            ).length == 0
          ) {
            var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
              Components.interfaces.nsISupports
            ).wrappedJSObject;
            if (_Zotero.ZoteroStyle.events.mode === "max") {
              cell.style.display = "none"
            }
          }
          return cell
        }
        this.window.clearInterval(id)
      }).bind(this),
      1e3
    )

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
    console.log(record)
  }

  private isNumber(arg: any): boolean {
    return (typeof(arg) == "number" && String(arg) != "NaN")
  }

  public onUnInit(): void {
    console.log(`${addonName}: uninit called`);
    this.Zotero.debug(`${addonName}: uninit called`);
    this.Zotero.ZoteroStyle = undefined;
  }
}

export default AddonEvents;