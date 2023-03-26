import { config } from "../../package.json";

import Views from "./views";
import Bubble from "./bubble";
const d3 = require("./d3")

export default class GraphView {
  private renderer: any;
  private container!: HTMLDivElement;
  private resizer!: HTMLDivElement;
  private graph!: Graph;
  private urls: any = {
    Zotero: "https://www.zotero.org/",
    Style: "https://github.com/MuiseDestiny/zotero-style",
    Help: "https://github.com/MuiseDestiny/zotero-style#zotero-style",
    Share: "https://github.com/MuiseDestiny/zotero-style/issues/48",
    Issue: "https://github.com/MuiseDestiny/zotero-style/issues/new/choose",
    Plugins: "https://zotero-chinese.gitee.io/zotero-plugins/#/"
  }
  private functions: any = {
    light: () => {this.setTheme("light")},
    dark: () => { this.setTheme("dark") },
  }
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

  public setTheme(theme?: "light" | "dark" | undefined) {
    ztoolkit.log("set theme", theme)
    if (!theme) {
      theme = Zotero.Prefs.get(`${config.addonRef}.graphView.theme`) as ("light" | "dark")
      if (["light", "dark"].indexOf(theme) == -1) {
        theme = "light"
      }
    }
    Zotero.Prefs.set(`${config.addonRef}.graphView.theme`, theme)
    const fillTag = 7583672
    const themeColor = {
      light: {
        backgroundColor: "#ffffff",
        resizerColor: "#cccccc",
        colors: {
          "fill": {
            "a": 1,
            "rgb": 5921370
          },
          "fillFocused": {
            "a": 1,
            "rgb": 9137391
          },
          "fillTag": {
            "a": .5,
            "rgb": fillTag
          },
          "fillUnresolved": {
            "a": 0.5,
            "rgb": 11250603
          },
          "fillAttachment": {
            "a": 1,
            "rgb": 14724096
          },
          "arrow": {
            "a": 0.5,
            "rgb": 2236962
          },
          "circle": {
            "a": 1,
            "rgb": 9137391
          },
          "line": {
            "a": 1,
            "rgb": 13948116
          },
          "text": {
            "a": 1,
            "rgb": 2236962
          },
          "fillHighlight": {
            "a": 1,
            "rgb": 9730288
          },
          "lineHighlight": {
            "a": 1,
            "rgb": 9730288
          }
        }
      },
      dark: {
        backgroundColor: "#2e3441",
        resizerColor: "#3b4252",
        colors: {
          "fill": {
            "a": 1,
            "rgb": 12237498
          },
          "fillFocused": {
            "a": 1,
            "rgb": 9137391
          },
          "fillTag": {
            "a": .5,
            "rgb": fillTag
          },
          "fillUnresolved": {
            "a": 0.5,
            "rgb": 6710886
          },
          "fillAttachment": {
            "a": 1,
            "rgb": 14737009
          },
          "arrow": {
            "a": 0.5,
            "rgb": 14342874
          },
          "circle": {
            "a": 1,
            "rgb": 9137391
          },
          "line": {
            "a": .23,
            "rgb": 13948116
          },
          "text": {
            "a": 1,
            "rgb": 14342874
          },
          "fillHighlight": {
            "a": 1,
            "rgb": 8215533
          },
          "lineHighlight": {
            "a": 1,
            "rgb": 8215533
          }
        }
      }
    }
    this.renderer.colors = themeColor[theme].colors
    this.renderer.testCSS();

    this.container.style.backgroundColor = themeColor[theme].backgroundColor;
    this.resizer.style.backgroundColor = themeColor[theme].resizerColor;
    this.renderer.containerEl.style.backgroundColor = themeColor[theme].backgroundColor;
  }

  private registerButton() {
    console.log("registerButton is called")
    const node = document.querySelector("#zotero-tb-advanced-search")!
    console.log(node)
    let newNode = node?.cloneNode(true) as XUL.ToolBarButton
    newNode.setAttribute("id", "zotero-style-show-hide-graph-view")
    newNode.setAttribute("tooltiptext", "show/hide graph view")
    newNode.setAttribute("command", "")
    newNode.setAttribute("oncommand", "")
    newNode.addEventListener("click", async () => {
      let node = this.container
      if (!node) { return }
      if (node.style.display == "none") {
        node.style.display = ""
        this.setData(await this.getGraph(true))
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, true)
      } else {
        node.style.display = "none"
        Zotero.Prefs.set(`${config.addonRef}.graphView.enable`, false)
      }
    })
    newNode.style.listStyleImage = `url(chrome://${config.addonRef}/content/icons/favicon@32x32.png)`
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

  private async getGraph(cache: boolean=false) {
    const items = ZoteroPane.getSortedItems()
    const collection = ZoteroPane.getSelectedCollection()
    const collectionKey = collection ? collection.key : "My Library"
    if (cache && (this.cache[this.mode] ??= {})[collectionKey]) { return this.cache[this.mode][collectionKey]} 
    const graph = await this.modeFunction[this.mode](items);
    (this.cache[this.mode] ??= {})[collectionKey] = graph
    this.graph = graph
    return graph
  }

  private getGraphByDefaultLink() {
    return {
      nodes: {
        // url
        Zotero: { links: { Style: true }, type: "url"},
        Style: { links: { Zotero: true }, type: "url" },
        Help: { links: { Style: true }, type: "url" },
        Share: { links: { Style: true }, type: "url" },
        Issue: { links: { Style: true }, type: "url" },
        Plugins: { links: { Zotero: true, Style: true }, type: "url" },
        // function
        Theme: { links: { Style: true }, type: "tag" },
        light: { links: { Theme: true }, type: "function" },
        dark: { links: { Theme: true }, type: "function" }
      }
    }
  }

  /**
   * 计划分析日，周，月阅读的文献
   * @param items 
   * @returns 
   */
  private async _getGraphByDefaultLink(items: Zotero.Item[]) {
    const recentDay = "Recent Day"
    const recentWeek = "Recent Week"
    const recentMonth = "Recent Month"
    function getTimeRange(date: Date) {
      var today = new window.Date(); // 当前日期和时间
      // @ts-ignore
      var deltaInMs = today - date; // 计算与当前日期之间的时间差，单位为毫秒

      var oneDayMs = 24 * 60 * 60 * 1000; // 一天的毫秒数
      var oneWeekMs = 7 * oneDayMs; // 一周的毫秒数
      var oneMonthMs = 30 * oneDayMs; // 一个月的毫秒数

      if (deltaInMs < oneDayMs) {
        return { type: recentDay, delta: deltaInMs };
      } else if (deltaInMs < oneWeekMs) {
        return { type: recentWeek, delta: deltaInMs };
      } else if (deltaInMs < oneMonthMs) {
        return { type: recentMonth, delta: deltaInMs };
      } else {
        return
      }
    }
    items = ZoteroPane.getSortedItems() as Zotero.Item[]
    let deltaItems: any = {
      recentDay: [],
      recentWeek: [],
      recentMonth: []
    }
    items.filter(i => i.isRegularItem()).forEach(item => {
      let date = new window.Date(item.dateModified) as Date
      let info = getTimeRange(date)
      if (info) {
        deltaItems[info.type].push({ item, delta: info.delta})
      }
    })
    const graph: any = {
      nodes: {}
    }
    
    for (let deltaType in deltaItems) {
      graph.nodes[deltaType] ??= { links: {} }
      const items = deltaItems[deltaType]
      items.forEach((item: any) => {
        graph.nodes[item.item.id] = { links: { deltaType: true }, type: "item" }
        graph.nodes[deltaType].links[item.item.id] = true
      })
    }
    return graph
  }

  private getGraphByRelatedLink(items: Zotero.Item[]) {
    let nodes: Graph["nodes"] = {}
    let graph: Graph = { nodes: {} }
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

  private async getGraphByItemArrLink(items: Zotero.Item[], getArr: Function) {
    const nodes: { [key: string]: any } = {}
    const graph: { [key: string]: any } = { nodes }
    const sharedValues: { [key: string]: { items: Set<Zotero.Item> } } = {}

    // 找出所有共享值
    items.forEach((item) => {
      const values = getArr(item)
      if (values.length == 0) {
        nodes[item.id] = { links: {}, type: "item" }
      }
      values.forEach((value: string) => {
        if (!sharedValues.hasOwnProperty(value)) {
          sharedValues[value] = { items: new Set() }
        }
        sharedValues[value].items.add(item)
      })
    })
    // 根据分位点，计算临界值
    const pct = 0.9
    console.log(sharedValues)
    const countArr = Object.values(sharedValues).map(i => i.items.size).filter(i=>i>1).sort()
    const limit = countArr[parseInt((countArr.length * pct).toFixed(0))]
    // 创建节点对象
    Object.keys(sharedValues).forEach((value: string) => {
      const items = [...sharedValues[value].items]
      items.forEach(item => {
        nodes[item.id] ??= { links: {}, type: "item" }
        console.log(items.length)
        if (items.length >= limit) {
          nodes[item.id].links[value] = true;
          (nodes[value] ??= {links: {}, type: "tag"}).links[item.id] = true
        }
        items.filter(i => i != item).forEach(_item => {
          nodes[item.id].links[_item.id] = true
        })
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
        tags.push(tag)
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
    const minHeight = 200
    const container = ztoolkit.UI.createElement(document, "div", {
      styles: {
        width: "100%",
        minHeight: `${minHeight}px`,
        height: Zotero.Prefs.get(`${config.addonRef}.graphView.height`) as string,
        display: Zotero.Prefs.get(`${config.addonRef}.graphView.enable`) ? "" : "none",
        backgroundColor: "transparent"
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
            listener: async () => {
              this.mode = mode
              this.setData(await this.getGraph(true))
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
    frame.style.border = "none"
    frame.style.outline = "none"
    frame.style.width = "100%"
    frame.style.height = "100%"
    frame.style.overflow = "hidden"
    frame.style.backgroundColor = "transparent"
    container.append(frame)
    mainNode.append(container)
    this.container = container

    // 调节高度
    const resizer = this.resizer = ztoolkit.UI.createElement(document, "div", {
      styles: {
        height: `1px`,
        width: "100%",
        backgroundColor: "transparent",
        cursor: "ns-resize",
      },
    })
    container.insertBefore(resizer, frame)
    let y = 0, x = 0;
    let h = 0, w = 0;
    const mouseDownHandler = function (e: MouseEvent) {
      frame.style.display = "none"
      y = e.clientY;
      x = e.clientX;
      const rect = container.getBoundingClientRect()
      h = rect.height;
      w = rect.width;
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };
    const mouseMoveHandler = (e: MouseEvent) => {
      const dy = e.clientY - y;
      let hh = h - dy
      const height = `${hh <= minHeight ? minHeight : hh}px`
      container.style.height = height;
      window.setTimeout(() => {
        frame.style.height = height;
        // @ts-ignore
        frame.contentDocument!.querySelector("#graph-view").style.height = height;
        this.renderer.onResize()
        Zotero.Prefs.set(`${config.addonRef}.graphView.height`, height)
      })
    };
    const mouseUpHandler = () => {
      frame.style.display = ""
      this.renderer.onResize()
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    resizer.addEventListener('mousedown', mouseDownHandler);
    await this.initIFrame(frame)
    this.setTheme()
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
    renderer.onNodeClick = (e: any, id: string, type: string) => {
      console.log(id, type)
      if (type == "item") {
        userSelect = false
        ZoteroPane.itemsView.selectItem(Number(id))
      } else if (type == "url") {
        Zotero.launchURL(this.urls[id]);
      } else if (type == "function"){
        this.functions[id]()
      } else if (type == "tag") {
        // 查找tag对应的链接的条目，进行过滤
        let ids = Object.keys(this.graph.nodes[id].links).filter(id => {
          return this.graph.nodes[id].type == "item"
        })
        ZoteroPane.selectItems(ids.map(Number))
      }
    }
    /**
     * 双击关系图谱空白分析当前图谱
     */
    frame.addEventListener("dblclick", () => {
      // 分析链接
      window.setTimeout(async () => {
        this.setData(await this.getGraph())
      })
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
    
    this.setData(await this.getGraph())
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

interface Graph {
  nodes: {
    [id: string]: {
      links: { [id: string]: boolean },
      type: string;
    };
  };
}