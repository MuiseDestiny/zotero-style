import { config } from "../../package.json";

import Views from "./views";
const d3 = require("./d3")

export default class GraphView {
  private popupWin: any;
  private frame!: HTMLIFrameElement;
  private container?: HTMLDivElement;
  constructor() {
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
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, true)
      } else {
        node.style.display = "none"
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, false)
      }
    })
    newNode.style.listStyleImage = `url(chrome://${config.addonRef}/content/icons/favicon.png)`
    document.querySelector("#zotero-items-toolbar")?.insertBefore(newNode, node?.nextElementSibling!)
    console.log(document.querySelector("#zotero-items-toolbar"))
  }

  public async buildGraphData(item: Zotero.Item) {
  }

  private async createContainer() {
    document.querySelectorAll("#graph").forEach(e => e.remove());
    document.querySelectorAll(".resizer").forEach(e => e.remove())
    while (!document.querySelector("#item-tree-main-default")) {
      await Zotero.Promise.delay(100)
    }
    const mainNode = document.querySelector("#item-tree-main-default")!
    // 图形容器
    const container = ztoolkit.UI.createElement(document, "div", {
      id: "graph-view",
      styles: {
        width: "100%",
        // height: "50%",
        minHeight: "400px",
        borderTop: "2px solid #cecece",
        // display: Zotero.Prefs.get(`${config.addonRef}.graphView.enable`) ? "" : "none"
        // display: ""
      }
    })
    ztoolkit.UI.appendElement({
      tag: "div", 
      id: "app",
      children: [
        {
          tag: "div",
          id: "graph-view"
        }
      ]
    }, container)
    const frame = this.frame = ztoolkit.UI.createElement(document, "iframe", { namespace: "html" }) as HTMLIFrameElement
    frame.setAttribute("src", `chrome://${config.addonRef}/content/dist/index.html`)
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

  private getItemDisplayText(item: _ZoteroItem) {
    let authors = item.getCreators()
    if (authors.length == 0) { return item.getField("title") }
    let author
    if (/[A-Za-z]/.test(authors[0].lastName)) {
      author = item.firstCreator.replace("和", "and").replace("等", "et al.")
    } else {
      author = item.firstCreator.replace("and", "和").replace("et al.", "等")
    }
    const year = item.getField("year")
    return `${author}, ${year}`
  }

  private getGraph(items: _ZoteroItem[]) {
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

  private async initIFrame(frame: HTMLIFrameElement) {
    // 等待js执行结束
    // @ts-ignore
    while (!frame.contentWindow!.renderer) {
      await Zotero.Promise.delay(100)
    }
    // @ts-ignore
    const renderer = frame.contentWindow!.renderer
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
        console.log(itemID, renderer.nodes)
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
      this.setData(renderer, this.getGraph(ZoteroPane.getSortedItems()))
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
    const graph = {
      nodes: {
        Sun: { links: { Earth: true, Moon: true } },
        Earth: { links: { Sun: true, Moon: true, Zotero: true } },
        Moon: { links: { Earth: true, Moon: true } },
        Zotero: { links: { You: true } },
        You: { links: {} },
        "我一直在等你": { links: {} }
      }
    }
    this.setData(renderer, graph)
  }

  private setData(renderer: any, graph: any) {
    renderer.setData(graph)
    const that = this
    renderer.nodes.forEach((node: any) => {
      if (node._getDisplayText) { return }
      node._getDisplayText = node.getDisplayText
      node.getDisplayText = function () {
        if (this.type == "item") {
          return that.getItemDisplayText(Zotero.Items.get(Number(this.id))) 
        }
        return this.id
      }
    })
    renderer.changed()
    renderer.onResize()
  }
}