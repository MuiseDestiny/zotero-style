import { Addon, addonName } from "./addon";
import AddonModule from "./module";

class AddonEvents extends AddonModule {
  public Zotero: any;
  public window: any;
  public document: any;
  public tagSize: .8;
  public mode = "normal";
  constructor(parent: Addon) {
    super(parent);
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
    let callback = function (e: Event) {
      var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
        Components.interfaces.nsISupports
      ).wrappedJSObject;
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
      #zotero-items-tree .cell.primary .tag-swatch {
        height: ${this.tagSize}em;
        width: ${this.tagSize}em;
        border-radius: 100%;
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
          let PrimaryCell = zotero_renderPrimaryCell.call(this.window.ZoteroPane.itemsView, index, data, column)
          // move all tagNode to a new parent, tagBox
          var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
            Components.interfaces.nsISupports
          ).wrappedJSObject;
          let document = _Zotero.getMainWindow().document
          let tagBoxNode = document.createElementNS("http://www.w3.org/1999/xhtml", "span")
          tagBoxNode.setAttribute("class", "tag-box")
          PrimaryCell.appendChild(tagBoxNode)
          PrimaryCell.querySelectorAll(".tag-swatch").forEach(tagNode => {
            tagBoxNode.appendChild(tagNode)
          })
          PrimaryCell.style.display = "flex"
          tagBoxNode.style = `
            width: 5em;
            line-height: 1em;
            margin-left: auto;
          `
          return PrimaryCell
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

  public onUnInit(): void {
    console.log(`${addonName}: uninit called`);
    this.Zotero.debug(`${addonName}: uninit called`);
    // Remove addon object
    this.Zotero.ZoteroStyle = undefined;
  }
}

export default AddonEvents;