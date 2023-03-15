import { config } from "../../package.json";

import Views from "./views";
import Bubble from "./bubble";
const d3 = require("./d3")

export default class GraphView {
  private renderer: any;
  private container!: HTMLDivElement;
  private cache: any ={};
  private mode = "default"
  private modeFunction: {[mode: string]: Function}
  constructor() {
    this.modeFunction = {
      default: this.getGraphByDefaultLink.bind(this),
      related: this.getGraphByRelatedLink.bind(this),
      author: this.getGraphByAuthorLink.bind(this),
      tag: this.getGraphByTagLink.bind(this),
    };
  }

  public async init() {
    await this.createContainer()
    this.registerButton()
  }

  private registerButton() {
    console.log("registerButton is called")
    const node = document.querySelector("#zotero-tb-advanced-search")
    console.log(node)
    let newNode = node?.cloneNode(true) as XUL.ToolBarButton
    newNode.setAttribute("id", "zotero-style-show-hide-graph-view")
    newNode.setAttribute("tooltiptext", "Hi, I am your Style.")
    newNode.setAttribute("command", "")
    newNode.setAttribute("oncommand", "")
    newNode.addEventListener("click", () => {
      let node = this.container
      if (!node) { return }
      if (node.style.display == "none") {
        node.style.display = ""
        this.setData(this.getGraph(true))
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, true)
      } else {
        node.style.display = "none"
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, false)
      }
    })
    newNode.style.listStyleImage = `url(chrome://${config.addonRef}/content/icons/favicon-small.png)`
    document.querySelector("#zotero-items-toolbar")?.insertBefore(newNode, node?.nextElementSibling!)
    console.log(document.querySelector("#zotero-items-toolbar"))
  }

  /**
   * 这里学习connected papers只显示一个姓氏
   * 比较简洁，当前版本使用item.id作为id，无需担心重复问题
   * @param item 
   * @returns 
   */
  private getItemDisplayText(item: _ZoteroItem) {
    let authors = item.getCreators()
    if (authors.length == 0) { return item.getField("title") }
    const author = authors[0].lastName
    const year = item.getField("year")
    return `${author}, ${year}`
  }

  private getGraph(cache: boolean=false) {
    const items = ZoteroPane.getSortedItems()
    const collection = ZoteroPane.getSelectedCollection()
    const collectionKey = collection ? collection.key : "My Library"
    if (cache && (this.cache[this.mode] ??= {})[collectionKey]) { return this.cache[this.mode][collectionKey]} 
    const graph = this.modeFunction[this.mode](items);
    (this.cache[this.mode] ??= {})[collectionKey] = graph
    return graph
  }

  private getGraphByDefaultLink(items: Zotero.Item[]) {
    const graph = {
      nodes: {
        Sun: { links: { Earth: true, Moon: true } },
        Earth: { links: { Sun: true, Moon: true, Zotero: true } },
        Moon: { links: { Earth: true, Moon: true } },
        Zotero: { links: { You: true } },
        You: { links: {} },
        "Hi, I'm Style.": { links: {} }
      }
    }
    return graph
  }

  private getGraphByRelatedLink(items: Zotero.Item[]) {
    let nodes: { [key: string]: any } = {}
    let graph: { [key: string]: any } = { nodes }
    items.forEach((item, i) => {
      let id = item.id 
      nodes[id] = { links: {}, type: "item"}
      const relatedKeys = item.relatedItems
      items
        .forEach((_item, _i) => {
          if (_i == i) { return }
          if (relatedKeys.indexOf(_item.key) != -1) {
            nodes[id].links[_item.id] = true
          }
        })
    })
    return graph
  }

  private getGraphByItemArrLink(items: Zotero.Item[], getArr: Function) {
    let nodes: { [key: string]: any } = {}
    let graph: { [key: string]: any } = { nodes }
    items.forEach((item) => {
      let id = item.id
      nodes[id] = { links: {}, type: "item" }
      const values = getArr(item)
      const otherItems = items.filter(i => i != item)
      otherItems.forEach(otherItem => {
        const hasCommonValue = getArr(otherItem).find((value: string) => {
          return values.indexOf(value) != -1
        })
        if (hasCommonValue) {
          nodes[id].links[otherItem.id] = true
        }
      })
    })
    return graph
  }
  
  private getGraphByAuthorLink(items: Zotero.Item[]) {
    let getAuthors = (item: Zotero.Item) => {
      return item.getCreators().map(a => {
        return `${a.firstName} ${a.lastName}`
      })
    }
    return this.getGraphByItemArrLink(items, getAuthors)
  }

  private getGraphByTagLink(items: Zotero.Item[]) {
    let getTags = (item: Zotero.Item) => {
      const allTags =  item.getTags().map(tag => tag.tag).filter(i=>!i.startsWith("/"))
      let tags: string[] = []
      allTags.forEach(tag => {
        tag.split("/").forEach(i => tags.push(i))
      })
      return tags
    }
    return this.getGraphByItemArrLink(items, getTags)
  }

  private async createContainer() {
    document.querySelectorAll("#graph").forEach(e => e.remove());
    document.querySelectorAll(".resizer").forEach(e => e.remove())
    while (!document.querySelector("#item-tree-main-default")) {
      await Zotero.Promise.delay(100)
    }
    const mainNode = document.querySelector("#item-tree-main-default")! as HTMLDivElement
    // 图形容器
    const container = ztoolkit.UI.createElement(document, "div", {
      styles: {
        width: "100%",
        minHeight: "400px",
        borderTop: "2px solid #cecece",
        position: "relative"
        // display: Zotero.Prefs.get(`${config.addonRef}.graphView.enable`) ? "" : "none"
        // display: ""
      }
    })
    // 选项
    const optionContainer = ztoolkit.UI.appendElement({
      tag: "div",
      styles: {
        position: "absolute",
        left: "0",
        bottom: "0",
        height: "2em",
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        opacity: "0",
        transition: "opacity .23s linear"
      },
      listeners: [
        {
          type: "mouseenter",
          listener: () => {
            optionContainer.style.opacity = "1"
          }
        },
        {
          type: "mouseleave",
          listener: () => {
            optionContainer.style.opacity = "0"
          }
        }
      ]
    }, container)
    const size = .7
    const color = {
      active: "#FF597B",
      default: "#F9B5D0"
    }
    for (let mode in this.modeFunction) {
      let b: Bubble;
      const optionNode = ztoolkit.UI.appendElement({
        tag: "div",
        classList: ["option"],
        styles: {
          width: `${size}em`,
          height: `${size}em`,
          borderRadius: "50%",
          backgroundColor: mode == this.mode ? color.active : color.default,
          transition: "background-color .23s linear",
          opacity: "0.7",
          cursor: "pointer",
          margin: " 0 .3em"
        },
        listeners: [
          {
            type: "click",
            listener: () => {
              this.mode = mode
              this.setData(this.getGraph(true))
              optionContainer.querySelectorAll(".option").forEach((e: any)=>e.style.backgroundColor = color.default)
              optionNode.style.backgroundColor = color.active
            }
          },
          {
            type: "mouseenter",
            listener: () => {
              b = new Bubble(optionNode, "bubble-option-name", mode[0].toUpperCase() + mode.slice(1), "top")
            }
          },
          {
            type: "mouseleave",
            listener: () => {
              const t = 230
              let c = window.setTimeout(() => {
                b.ele.style.opacity = "0"
                window.setTimeout(() => {
                  b.ele.remove()
                }, t)
              }, t)
              b.ele.setAttribute("closeTimer", String(c))
            }
          }
        ]
      }, optionContainer) as HTMLDivElement
    }
    const frame = ztoolkit.UI.createElement(document, "iframe", { namespace: "html" }) as HTMLIFrameElement
    frame.setAttribute("src", `chrome://${config.addonRef}/content/dist/index.html`)
    // frame.setAttribute("src", ``)

    frame.style.height = "500px"
    frame.style.border = "none"
    frame.style.outline = "none"
    frame.style.width = "100%"
    frame.style.height = "100%"
    frame.style.overflow = "hidden"
    frame.style.backgroundColor = "#ffffff"
    container.append(frame)
    mainNode.append(container)
    this.container = container
    await this.initIFrame(frame)
  }


  private async initIFrame(frame: HTMLIFrameElement) {
    // 等待js执行结束
    // @ts-ignore
    while (!frame.contentWindow!.renderer) {
      await Zotero.Promise.delay(100)
    }
    // @ts-ignore
    const renderer = this.renderer = frame.contentWindow!.renderer
    //@ts-ignore
    this.renderer.containerEl.style.height = window.getComputedStyle(this.container).height
    /**
     * 点击文献直接定位
     */
    let userSelect = true
    ZoteroPane.itemsView.onSelect.addListener(() => {
      if (!userSelect) { userSelect = true;  return }
      let items = ZoteroPane.getSelectedItems()
      if (items.length == 1) {
        const item = items[0]
        const itemID = item.id
        const node = renderer.nodes.find((node: any) => Number(node.id) == itemID)
        renderer.highlightNode = node
        if (!node) { return }
        const f = window.devicePixelRatio
        const scale = 2
        const canvas = renderer.interactiveEl
        const X = (f * canvas.width / 2 - node.x * scale);
        const Y = (f * canvas.height / 2 - node.y * scale);
        renderer.zoomTo(scale / 2);
        renderer.setPan(X, Y);
        renderer.setScale(scale);
        renderer.changed()
      }
    })
    /**
     * 点击节点定位文献
     */
    renderer.onNodeClick = (e: any, id: string, type: number) => {
      userSelect = false
      ZoteroPane.itemsView.selectItem(Number(id))
    }
    /**
     * 双击关系图谱空白分析当前图谱
     */
    frame.addEventListener("dblclick", () => {
      // 分析链接
      this.setData(this.getGraph(ZoteroPane.getSortedItems()))
    })

    /**
     * 窗口调整canvas调整
     */
    frame.addEventListener("resize", () => {
      // renderer.interactiveEl.style.height = window.getComputedStyle(container).height
      renderer.onResize()
    })

    /**
     * 加载一个默认图谱
     */
    
    this.setData(this.getGraph())
  }

  private setData(graph: any) {
    this.renderer.setData(graph)
    const that = this
    this.renderer.nodes.forEach((node: any) => {
      if (node._getDisplayText) { return }
      node._getDisplayText = node.getDisplayText
      node.getDisplayText = function () {
        if (this.type == "item") {
          return that.getItemDisplayText(Zotero.Items.get(Number(this.id))) 
        }
        return this.id
      }
    })
    this.renderer.changed()
    this.renderer.onResize()
  }
}