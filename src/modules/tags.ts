import { config } from "../../package.json";

/**
 * 用于创建高于Zotero本身的标签UI
 * Zotero本身的tagSelector只是本类的其中一个视图
 * TODO 右键标签：重命名，复制完整标签，复制此层级标签，删除标签
 */
export class Tags {
  private props = {
    icon: {
      size: 10,
      right: 3,
      svg: ""
    },
    item: {
      padding: 6
    },
    tree: {
      size: 2
    },
    color: {
      hover: "#e4e4e4",
      select: "#ffff99"
    },
    sorted: [
      "Tag (A-Z)",
      "Tag (Z-A)",
      "Frequency (0-9)",
      "Frequency (9-0)",
    ]
  }
  private searchText?: string;
  private plainTags: string[] = [];
  private nestedTags!: NestedTags["children"];
  /**
   * 这是Zotero界面存在的Container，用于存放标签
   */
  private container!: HTMLDivElement;
  /**
   * 这是本类创建的可折叠标签视图的container，是所有元素的起点
   * 相对应Zotero视图的节点叫tagSelector，但不需要储存
   */
  private nestedTagsContainer!: HTMLDivElement;
  /**
   * 用于记录层级标签的选择状态和折叠状态，使得刷新时候保持
   */
  public state: { [id: string]: { collapse?: boolean;  select?: boolean} } = {};
  constructor() {
    this.props.icon.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.props.icon.size}" height="${this.props.icon.size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>`
    this.prepare()
  }

  /**
   * 用于执行只需要执行一次的逻辑
   */
  private prepare() {
    document.querySelector("#nested-tags-style")?.remove();
    const styles = ztoolkit.UI.createElement(document, "style", {
      id: "nested-tags-style",
      properties: {
        innerHTML: `
          .nested-tags-control-icon {
            width: 30px;
            height: 25px;
            color: #5a5a5a;
            opacity: 0.85;
            background-color: ;
            border-radius: 4px;
            transition: opacity .1s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nested-tags-control-icon:hover {
            background-color: rgba(0, 0, 0, 0.075)
          }
          .nested-tags-control-icon:active {
            opacity: 1;
          }
          .tag-selector, .nested-tags-box {
            border-top: 1px solid #cecece;
          }
          .menu-item:hover {
            background-color: #e4e4e4;
          }
          .item:hover {
            background-color: ${this.props.color.hover}
          }
          #zotero-tag-selector {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #ffffff;
          }
          window[theme="dark"] #zotero-tag-selector {
            background-color: #2c323e !important;
          }
          window[theme="dark"] .nested-tags-control-icon:hover, window[theme="dark"] .item:hover, window[theme="dark"] .menu-box .menu-item:hover{
            background-color: #4c566a !important;
          }
          window[theme="dark"] .menu-box {
            background-color: #3b4252 !important;
            color: #fff;
          }
          window[theme="dark"] #zotero-tag-selector svg {
            color: #eee !important;
          }
          #zotero-tag-selector .tag-selector-list  {
            height: auto !important;
          }
          .nested-search-box .icon {
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0.8;
          }
          .nested-search-box .icon:hover {
            opacity: 1
          }
        `
      },
    });
    document.documentElement.appendChild(styles);

    // 左侧边到条目面板中间的splitter
    const splitter = document.querySelector("#zotero-collections-splitter")
    let isMouseDown = false
    splitter?.addEventListener("mousedown", () => {
      isMouseDown = true
    })
    splitter?.addEventListener("mousemove", () => {
      if (isMouseDown && this.nestedTagsContainer) {
        this.nestedTagsContainer.style.width = `${ZoteroPane.tagSelector.getContainerDimensions().width}px`
      }
    })
    splitter?.addEventListener("mouseup", () => {
      isMouseDown = false
    })
  }

  /**
   * 确保container已初始化
   * @param force 不经任何条件判断
   * @returns 
   */
  public async init(force: boolean = false) {
    this.container ??= document.querySelector("#zotero-tag-selector") as HTMLDivElement;
    // 获取标签，可能是文库所有也可能是当前分类
    let plainTags = await this.getPlainTags()
    // 若不是强制刷新，则需要判断是否和上次获取plainTags相同
    if (!force) {
      if (
        // 与上次相同
        JSON.stringify(plainTags) == JSON.stringify(this.plainTags) ||
        // 未处于当前视图
        this.nestedTagsContainer?.style.display == "none"
      ) { return }
    }
    this.plainTags = plainTags
    // 隐藏Zotero标签视图，它将继续作为一种非嵌套视图存在，并由插件安排
    this.container.childNodes.forEach((e: any) => e.style.display = "none");
    // 以一种嵌套的数据结构分析存储plainTags
    this.nestedTags = await this.getNestedTags()
    // 渲染嵌套标签
    await this.refresh()
  }

  public async getPlainTags(): Promise<string[]> {
    let func: Function | undefined 
    if (this.searchText && this.searchText.trim().length) {
      let regex: RegExp;
      const res = this.searchText.match(/\/(.+)\/(\w*)/)
      if (res) {
        regex = new RegExp(res[1], res[2])
        func = (s: string) => regex.test(s)
      } else {
        func = (s: string) => s.indexOf(this.searchText!) != -1
      }
    }
    let plainTags: string[] = [];
    (
      Zotero.Prefs.get("tagSelector.displayAllTags")
        ?
        await Zotero.Items.getAll(1)
        :
        ZoteroPane.getSortedItems()
    )
      // @ts-ignore
      .forEach((item: Zotero.Item) => {
        plainTags = plainTags.concat(item.getTags().map(i => i.tag))
      })
    // TODO: 提供设置，可以不以#开头
    plainTags = plainTags
      .filter((tag: string) => {
        return Tags.getTagMatch(tag)
      })
    if (func) {
      plainTags = plainTags.filter((tag: string) => {
        return tag.split("/").find(s=>func!(s))
      })
    }
    return plainTags
  }

  public getNestedTags(): NestedTags["children"] {
    let nestedTags = {}
    for (let i = 0; i < this.plainTags.length; i++) {
      // tag是Zotero原始标签，比如`#数学/微积分`
      let plainTag = this.plainTags[i]
      let splitTags = plainTag.replace(/^#\s*/, "").split("/")
      // _nestedTags用于逐层获取数据引用
      let _nestedTags: any = nestedTags
      for (let j = 0; j < splitTags.length; j++) {
        let temp = _nestedTags[splitTags[j]] ??= {
          number: 0,
          children: {},
          // 用于区分当前分级标签，也用于和filter通信
          id: JSON.stringify([plainTag, j]),
        }
        temp.number += 1
        _nestedTags = temp.children
      }
    }
    return nestedTags
  }

  /**
   * 用于获取标签的开头
   * 从[plainTag, index]解析，记录在this.state里
   * @returns 
   */
  public getTagStart = () => {
    const key = Object.keys(this.state).find((key: any) => this.state[key].select) as string
    if (!key) { return }
    let [plainTag, index] = JSON.parse(key)
    const tagStart = plainTag.split("/").slice(0, index + 1).join("/")
    return tagStart
  }

  /**
   * 用于#标签获取映射后的标签名，也用于嵌套标签视图的标签验证
   * @param tag 要匹配的标签名称
   * @returns 如果和正则匹配，返回括号里的内容，不匹配则返回空
   */
  static getTagMatch(tag: string) {
    try {
      const rawString = Zotero.Prefs.get(`${config.addonRef}.textTagsColumn.match`) as string
      const res = rawString.match(/\/(.+)\/(\w*)/)
      let regex: RegExp;
      // 是正则表达式
      if (res) {
        regex = new RegExp(res[1], res[2])
      }
      // 不以xxx开头
      else if (rawString.startsWith("~~")) {
        regex = new RegExp(`^([^${rawString.slice(2)}].+)`)
      }
      // 以xxx开头
      else {
        regex = new RegExp(`^${rawString}(.+)`)
      }
      const arr = tag.match(regex)
      return (arr && arr.slice(1).join("")) || ""
    } catch {
      return tag
    }
  }

  /**
   * 刷新
   */
  public async refresh() {
    // 移除原本创建的元素
    this.container.querySelector(".nested-tags-container")?.remove()
    // 存在this，用于splitter变化调整时使用
    const nestedTagsContainer = this.nestedTagsContainer = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["nested-tags-container"],
      styles: {
        height: "100px",
        overflowY: "hidden",
        flex: "1 1 auto",
        display: "flex",
        width: `${ZoteroPane.tagSelector.getContainerDimensions().width}px`,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, this.container) as HTMLDivElement
    // 左侧边到条目面板中间的splitter
    const box = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["nested-tags-box"],
      styles: {
        width: "calc(100% - 10px)",
        padding: "5px",
        height: "100%",
        overflowX: "",
        overflowY: "auto"
      }
    }, this.nestedTagsContainer) as HTMLDivElement;
    // 搜索框
    const searchBoxHeight = 15
    const searchBox = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["nested-search-box"],
      styles: {
        width: "calc(100% - 35px)",
        height: `${searchBoxHeight}px`,
        padding: "5px",
        borderRadius: "5px",
        border: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: "3px",
        marginTop: "3px",
        opacity: "0.6"
      },
      children: [
        {
          tag: "div",
          styles: {
            width: `${searchBoxHeight}px`,
            height: `${searchBoxHeight}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          },
          properties: {
            innerHTML: `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="${searchBoxHeight}" height="${searchBoxHeight}"><path d="M1005.312 914.752l-198.528-198.464A448 448 0 1 0 0 448a448 448 0 0 0 716.288 358.784l198.4 198.4a64 64 0 1 0 90.624-90.432zM448 767.936A320 320 0 1 1 448 128a320 320 0 0 1 0 640z" fill="#5a5a5a"></path></svg>`
          }
        },
        {
          tag: "input",
          id: "nested-tags-search-input",
          styles: {
            outline: "none",
            border: "none",
            width: "100%",
            margin: "0 5px"
          },
          properties: {
            value: this.searchText
          },
          listeners: [
            {
              type: "focus",
              listener: () => {
                searchBox.style.opacity = "1"
              }
            },
            {
              type: "blur",
              listener: () => {
                searchBox.style.opacity = "0.6"
              }
            },
            {
              type: "keyup",
              listener: async () => {
                const inputNode = searchBox.querySelector("input") as HTMLInputElement
                const clearNode = searchBox.querySelector(".clear") as HTMLInputElement
                const searchText = inputNode.value as string
                if (searchText.length) {
                  clearNode.style.display = ""
                }
                // 搜索
                console.log("search...", searchText)
                this.searchText = searchText
                // 复制一份
                this.plainTags = await this.getPlainTags()
                this.nestedTags = await this.getNestedTags()
                box.innerHTML = ""
                await this.render(box, this.nestedTags)
              }
            }
          ]
        },
        {
          tag: "div",
          classList: ["icon", "clear"],
          styles: {
            width: `${searchBoxHeight}px`,
            height: `${searchBoxHeight}px`,
            display: "none"
          },
          properties: {
            innerHTML: `<svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="${searchBoxHeight}" height="${searchBoxHeight}"><path d="M512.288 1009.984c-274.912 0-497.76-222.848-497.76-497.76s222.848-497.76 497.76-497.76c274.912 0 497.76 222.848 497.76 497.76s-222.848 497.76-497.76 497.76zM700.288 368.768c12.16-12.16 12.16-31.872 0-44s-31.872-12.16-44.032 0l-154.08 154.08-154.08-154.08c-12.16-12.16-31.872-12.16-44.032 0s-12.16 31.84 0 44l154.08 154.08-154.08 154.08c-12.16 12.16-12.16 31.84 0 44s31.872 12.16 44.032 0l154.08-154.08 154.08 154.08c12.16 12.16 31.872 12.16 44.032 0s12.16-31.872 0-44l-154.08-154.08 154.08-154.08z" fill="#5a5a5a" p-id="5698"></path></svg>`
          },
          listeners: [
            {
              type: "click",
              listener: async () => {
                const inputNode = searchBox.querySelector("input") as HTMLInputElement
                const clearNode = searchBox.querySelector(".clear") as HTMLInputElement
                inputNode.value = ""
                clearNode.style.display = "none"
                this.searchText = ""
                // 复制一份
                this.plainTags = await this.getPlainTags()
                this.nestedTags = await this.getNestedTags()
                box.innerHTML = ""
                await this.render(box, this.nestedTags)
              }
            }
          ]
        },
      ]
    }, this.nestedTagsContainer) as HTMLDivElement;

    // 这是Zotero原本标签视图的父节点，在Zotero中这么命名
    const tagSelector = this.container.querySelector(".tag-selector")! as HTMLDivElement
    this.render(box, this.nestedTags)
    let icons = {
      sort: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-sort-asc"><path d="M11 11h4"></path><path d="M11 15h7"></path><path d="M11 19h10"></path><path d="M9 7 6 4 3 7"></path><path d="M6 6v14"></path></svg>`,
      nest: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-folder-tree"><path d="M13 10h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path><path d="M13 21h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.88a1 1 0 0 1-.9-.55l-.44-.9a1 1 0 0 0-.9-.55H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path><path d="M3 3v2c0 1.1.9 2 2 2h3"></path><path d="M3 3v13c0 1.1.9 2 2 2h3"></path></svg>`,
      collapse: {
        true: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevrons-up-down"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>`,
        false: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevrons-down-up"><path d="m7 20 5-5 5 5"></path><path d="m7 4 5 5 5-5"></path></svg>`,
      }
    }
    const that = this
    let isAllCollapse = true
    let controlNode = ztoolkit.UI.insertElementBefore({
      tag: "div",
      styles: {
        margin: "5px auto",
        height: "30px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100px",
      },
      children: [
        {
          tag: "div",
          classList: ["nested-tags-control-icon"],
          properties: {
            innerHTML: icons.sort
          },
          listeners: [
            {
              type: "click",
              listener: (event: any) => {
                const x = event.clientX, y = event.clientY
                // 创建菜单
                const menuItems = [];
                const selectedIndex = Number(Zotero.Prefs.get(`${config.addonRef}.nestedTags.sorted`));
                for (let i = 0; i < this.props.sorted.length; i++) {
                  let menuItem = {
                    name: this.props.sorted[i],
                    listener: async () => {
                      Zotero.Prefs.set(`${config.addonRef}.nestedTags.sorted`, String(i))
                      await this.init(true)
                    }
                  }
                  menuItems.push(menuItem)
                }
                const menuNode = this.createMenuNode(
                  { x, y, width: 130, height: 130 },
                  menuItems, [1]
                )
                menuNode.querySelectorAll(".menu-item-name").forEach((e: any, i: number) => {
                  e.style.borderLeft = `3px solid ${selectedIndex == i ? "#16a085" : "transparent"}`
                })
              }
            }
          ]
        },
        {
          tag: "div",
          classList: ["nested-tags-control-icon"],
          properties: {
            innerHTML: icons.nest
          },
          listeners: [
            {
              type: "click",
              listener: async function () {
                // @ts-ignore
                const node = this as HTMLDivElement
                if (nestedTagsContainer.style.display == "none") {
                  // 显示
                  nestedTagsContainer.style.display = "flex";
                  that.init()
                  tagSelector.style!.display = "none"
                  node.parentNode?.childNodes.forEach((e: any) => {
                    if (e != node) {
                      e.timer && window.clearTimeout(e.timer)
                      e.style.display = ""
                      window.setTimeout(() => {
                        e.style.opacity = "0.85"
                      }, 1)
                    }
                  }
                  )
                  node.style.backgroundColor = ""
                  node.style.opacity = "0.85"
                  node.style.color = "#5a5a5a"
                } else {
                  // 隐藏
                  nestedTagsContainer.style.display = "none";
                  tagSelector.style!.display = "";
                  node.parentNode?.childNodes.forEach((e: any) => {
                    if (e != node) {
                      e.style.opacity = "0"
                      e.timer = window.setTimeout(() => {
                        e.style.display = "none"
                      }, 100)
                    }
                  })
                  node.style.display = ""
                  node.style.backgroundColor = "hsla(201, 17%, 68%, 0.15)"
                  node.style.color = "hsl(201, 17%, 68%)"
                }
              }
            }
          ]
        },
        {
          tag: "div",
          classList: ["nested-tags-control-icon"],
          properties: {
            innerHTML: icons.collapse.true
          },
          listeners: [
            {
              type: "click",
              listener: function () {
                let _isAllCollapse = isAllCollapse
                let toggle = async (node: HTMLElement) => {
                  let nodes = [...node.querySelectorAll(".item .collapse")]
                  if (!_isAllCollapse) {
                    nodes = nodes.reverse()
                  }
                  for (let i = 0; i < nodes.length; i++) {
                    const e = nodes[i] as any
                    if ((that.state[e.key] ??= {}).collapse == _isAllCollapse) {
                      e.click()
                      await Zotero.Promise.delay(10)
                      if (_isAllCollapse) {
                        window.setTimeout(() => {
                          toggle(e.tree)
                        }, 10)
                      }
                    }
                  }
                }
                toggle(box)
                isAllCollapse = !isAllCollapse
                // @ts-ignore
                this.innerHTML = icons.collapse[String(isAllCollapse)]
              }
            }
          ]
        },
      ]
    }, this.container.childNodes[0] as HTMLElement) as HTMLDivElement;
  }

  /**
   * 
   * @param rect 
   * @param items "---" 表示分割
   */
  public createMenuNode(
    rect: { x: number, y: number, width: number, height: number },
    // items: { styles: { [key: string]: string }, listeners: { type: string; listener: Function }, properties: any}[],
    items: {name: string, listener: Function}[],
    separators: number[]
  ) {
    const removeNode = () => {
      document.removeEventListener("mousedown", removeNode)
      window.setTimeout(() => {
        menuNode.remove()
      }, 0)
    }
    document.addEventListener("mousedown", removeNode)
    let menuNode = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["menu-box"],
      styles: {
        position: "fixed",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        display: "flex",
        height: `${rect.height}px`,
        justifyContent: "space-around",
        flexDirection: "column",
        padding: "6px",
        border: "1px solid #d4d4d4",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: `0px 1px 2px rgba(0, 0, 0, 0.028),
                                0px 3.4px 6.7px rgba(0, 0, 0, .042),
                                0px 15px 30px rgba(0, 0, 0, .07)`,
        overflow: "hidden",
        userSelect: "none",
      },
      children: (() => {
        let arr = [];
        for (let i = 0; i < items.length; i++) {
          arr.push({
            tag: "div",
            classList: ["menu-item"],
            styles: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px",
              cursor: "default",
              fontSize: "13px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            },
            listeners: [
              {
                type: "mousedown",
                listener: async (event: any) => {
                  await items[i].listener()
                }
              }
            ],
            children: [
              {
                tag: "div",
                classList: ["menu-item-name"],
                styles: {
                  paddingLeft: "0.5em",
                },
                properties: {
                  innerText: items[i].name
                }
              }
            ]
          })
          if (separators.indexOf(i) != -1) {
            arr.push({
              tag: "div",
              styles: {
                height: "0",
                margin: "6px -6px",
                borderTop: ".5px solid #e0e0e0",
                borderBottom: ".5px solid #e0e0e0",
              }
            })
          }
          
        }
        console.log(arr)
        return arr
      })() as any
    }, document.documentElement)
    const winRect = document.documentElement.getBoundingClientRect()
    const nodeRect = menuNode.getBoundingClientRect()
    // 避免溢出
    if (nodeRect.bottom > winRect.bottom) {
      menuNode.style.top = ""
      menuNode.style.bottom = "0px"
    }
    return menuNode
  }

  /**
   * 用于渲染一个父节点下的一个层级的标签
   * nestedTags本身可看作一个children
   * @param parent 
   * @param children 
   * @param margin 
   */
  public async render(parent: HTMLElement, children: any, margin: number = 0) {
    // 标签排序
    let sortedTags: string[] = this.getSortedTags(children)
    for (let tag of sortedTags) {
      // 默认折叠
      const key = children[tag].id;
      (this.state[key] ??= {}).collapse ??= true
      const itemNode = ztoolkit.UI.appendElement({
        tag: "div",
        classList: ["item"],
        styles: {
          borderRadius: "3px",
          height: "1.8em",
          lineHeight: "1.8em",
          padding: `0 ${this.props.item.padding}px`,
          backgroundColor: this.state[key].select ? this.props.color.select : "",
        },
        listeners: [],
        children: [{
          tag: "div",
          styles: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between"
          },
          children: [
            {
              tag: "div",
              styles: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "80%"
              },
              children: [
                {
                  tag: "div",
                  id: "tag",
                  styles: {
                    width: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },
                  properties: {
                    innerText: tag,
                  },
                  listeners: [
                    {
                      type: "click",
                      listener: async () => {
                        // 点击标签名筛选逻辑
                        if (this.state[key].select) {
                          // 取消点击
                          this.state[key].select = false
                          itemNode.style.backgroundColor = ""
                        } else {
                          // 点击匹配
                          Object.values(this.state).forEach((i: any) => i.select = false)
                          // @ts-ignore
                          this.nestedTagsContainer.querySelectorAll(".item").forEach(e => e.style.backgroundColor = "")
                          this.state[key].select = true
                          itemNode.style.backgroundColor = this.props.color.select
                        }
                        await ZoteroPane.itemsView.refreshAndMaintainSelection()
                      }
                    },
                    {
                      type: "mouseup",
                      listener: async (event: any) => {
                        if (event.button == 2) {
                          const menuItems: any = [];
                          const selectedIndex = Number(Zotero.Prefs.get(`${config.addonRef}.nestedTags.sorted`));
                          for (let i = 0; i < this.props.sorted.length; i++) {
                            let menuItem: any = { styles: { marginLeft: "" }, listeners: [], properties: {} }
                            menuItem.styles.borderLeft = `3px solid ${selectedIndex == i ? "#16a085" : "transparent"}`
                            menuItem.properties.innerText = this.props.sorted[i]
                            menuItem.listeners.push({
                              type: "mousedown",
                              listener: async () => {
                                Zotero.Prefs.set(`${config.addonRef}.nestedTags.sorted`, String(i))
                                await this.init(true)
                              }
                            })
                            menuItems.push(menuItem)
                          }
                          const x = event.clientX, y = event.clientY
                          let [plainTag, index] = JSON.parse(children[tag].id)
                          const orignalTagName = plainTag[0] + plainTag.slice(1).split("/").slice(0, index + 1).join("/")
                          const orignalEndTagName = orignalTagName.split("/").slice(-1)[0];
                          const matchedTags = (await Zotero.Tags.getAll())
                            .map((tag: { tag: string }) => tag.tag)
                            .filter((tag: string) => tag.startsWith(orignalTagName))
                          const menuNode = this.createMenuNode(
                            { x, y, width: 130, height: 130 },
                            [
                              {
                                name: "Rename",
                                listener: async () => {
                                  const io = { tagName: orignalTagName }
                                  const win = new ztoolkit.Dialog(2, 1)
                                    .addCell(0, 0, {
                                      tag: "input",
                                      namespace: "html",
                                      id: "tag-name",
                                      attributes: {
                                        "data-prop": "value",
                                        "data-bind": "tagName",
                                        type: "text",
                                      },
                                      styles: {
                                        height: "20px"
                                      },
                                    })
                                    .addButton("Rename", "tag-rename")
                                    .addButton("Cancel", "tag-cancel")
                                    .setDialogData(io)
                                    .open("Tag");
                                  // @ts-ignore
                                  await io.unloadLock.promise;
                                  const newTagName = io.tagName
                                  if (orignalTagName != newTagName) {
                                    matchedTags
                                      .forEach((tag: string) => {
                                        Zotero.Tags.rename(1, tag,
                                          tag.replace(
                                            new RegExp(`^${orignalTagName}`),
                                            newTagName
                                          )
                                        );
                                      })
                                    await this.init()
                                  }
                                },
                              },
                              {
                                name: "Copy Tag",
                                listener: () => {
                                  new ztoolkit.Clipboard().addText(orignalEndTagName, "text/unicode").copy();
                                },
                              },
                              {
                                name: "Copy Full Tag",
                                listener: () => {
                                  console.log(orignalTagName);
                                  new ztoolkit.Clipboard().addText(orignalTagName, "text/unicode").copy()
                                },
                              },
                              {
                                name: "Delete",
                                listener: async () => {
                                  var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                    .getService(Components.interfaces.nsIPromptService);

                                  var out = {};
                                  var index = promptService.confirmEx(
                                    window,
                                    "Tag",
                                    matchedTags.length > 1 ?
                                      `${orignalTagName} matches ${matchedTags.length} tags. Remove them?`
                                      :
                                      `Remove ${orignalTagName}?`
                                    ,
                                    promptService.STD_OK_CANCEL_BUTTONS + promptService.BUTTON_POS_1_DEFAULT,
                                    null, null, null, null, out
                                  );
                                  if (index == 0) { 
                                    matchedTags
                                      .forEach(async (tag: string) => {
                                        await Zotero.Tags.removeFromLibrary(1, [Zotero.Tags.getID(tag)]);
                                      })
                                    await this.init()
                                   }
                                },
                              }
                            ], [0, 2]
                          )
                        }
                      } 
                    }
                  ]
                },
              ]
            },
            {
              tag: "span",
              id: "number",
              styles: {
                borderRaduis: "3px",
              },
              properties: {
                innerText: children[tag].number,
              }
            }
          ]
        }
        ]
      }, parent) as HTMLElement
      // 有子节点
      if (Object.keys(children[tag].children).length) {
        // tree, 侧边线容器
        let tree = ztoolkit.UI.appendElement({
          tag: "div",
          classList: ["tree"],
          styles: {
            borderLeft: `${this.props.tree.size}px solid #eee`,
            marginLeft: `${this.props.item.padding + this.props.icon.size / 2 - this.props.tree.size / 2}px`,
            paddingLeft: `${this.props.icon.size / 2 + this.props.icon.right}px`,
          }
        }, parent) as HTMLDivElement
        // 在标签名前插入折叠图标
        let collapseNode = ztoolkit.UI.insertElementBefore({
          tag: "div",
          classList: ["collapse"],
          styles: {
            marginRight: `${this.props.icon.right}px`,
            transform: this.state[key].collapse ? "rotate(-90deg)" : "",
            transition: "transform 100ms ease-in-out"
          },
          properties: {
            innerHTML: this.props.icon.svg,
            key,
            tree
          },
          listeners: [
            {
              type: "click",
              listener: () => {
                // 从obsidian源码找到的过度
                const duration = 100
                const transition = `height ${duration}ms cubic-bezier(0.02, 0.01, 0.47, 1) 0s`
                this.state[key].collapse = !this.state[key].collapse
                collapseNode!.style!.transform = this.state[key].collapse ? "rotate(-90deg)" : ""
                tree.style.overflow = "hidden";
                tree.style.transition = "none"
                if (this.state[key].collapse) {
                  // 折叠
                  tree.style.height = window.getComputedStyle(tree).height;
                  // console.log("from", tree.style.height)
                  tree.style.transition = transition;
                  window.setTimeout(() => {
                    tree.style.height = "0px"
                    // console.log("to", tree.style.height)
                  })
                  window.setTimeout(() => {
                    tree.querySelectorAll("*").forEach(e => e.remove())
                  }, duration)
                } else {
                  // 展开
                  tree.style.height = ""
                  // @ts-ignore
                  this.render(...args)
                  const height = window.getComputedStyle(tree).height
                  tree.style.height = "0px"
                  // console.log("from", tree.style.height)
                  tree.style.transition = transition;
                  window.setTimeout(() => {
                    tree.style.height = height
                    // console.log("to", tree.style.height)
                  })
                }
                window.setTimeout(() => {
                  tree.style.height = ""
                  tree.style.overflow = "";
                  tree.style.transition = "";
                }, duration)
              }
            }
          ]
        }, itemNode.querySelector("#tag") as HTMLDivElement)
        const args = [tree, children[tag].children, margin + this.props.item.padding + this.props.icon.size + this.props.icon.right]
        if (!this.state[key].collapse) {
          // @ts-ignore
          this.render(...args)
        }
      }
  }
  }

  private getSortedTags(children: NestedTags["children"]) {
    let sortedTags: string[]
    switch (Number(Zotero.Prefs.get(`${config.addonRef}.nestedTags.sorted`) as string)) {
      case 0:
        sortedTags = Object.keys(children).sort()
        break
      case 1:
        sortedTags = Object.keys(children).sort().reverse()
        break
      case 2:
          sortedTags = Object.keys(children).sort((tag1, tag2) => children[tag1].number - children[tag2].number)
          break
      case 3:
        sortedTags = Object.keys(children).sort((tag1, tag2) => children[tag2].number - children[tag1].number)
        break
      default:
        sortedTags = Object.keys(children)
    }
    return sortedTags
  }
}


interface NestedTags {
  number: number;
  children: {
    [tag: string]: NestedTags;
  };
  id: string
}