import { log } from "../../node_modules/zotero-plugin-toolkit/dist/utils"
import { config } from "../../package.json";
import AddonItem from "./item";
import Progress from "./progress";
import Requests from "./requests";

export default class Views {
  private progress: Progress;
  private requests: Requests
  private progressWindow: any;
  private progressWindowIcon: any;
  private addonItem: AddonItem;
  private cache: {[key: string]: any} = {};
  constructor(addonItem: AddonItem) {
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: `chrome://${config.addonRef}/content/icons/favicon.png`,
    };
    this.addonItem = addonItem;
    this.progress = new Progress()
    this.requests = new Requests()
    this.addStyle()
  }

  public addStyle() {
    const style = ztoolkit.UI.creatElementsFromJSON(document, {
      tag: "link",
      directAttributes: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/style.css`,
      },
    }) as HTMLLinkElement;
    document.documentElement.appendChild(style);
  }

  /**
   * 渲染标题进度条
   */
  public async renderTitleProgress() {
    await ztoolkit.ItemTree.addRenderCellHook(
      "title",
      (index: number, data: string, column: any, original: Function) => {
        const cellSpan = original(index, data, column) as HTMLSpanElement;
        cellSpan.querySelectorAll(".tag-swatch").forEach(e => e.remove())
        const item = ZoteroPane.getSortedItems()[index]
        let record: Record = this.addonItem.get(item, "readingTime") as Record
        if(!record) { return cellSpan }
        let values = []
        for (let i = 0; i < record.page; i++) {
          values.push(parseFloat(record.data[i] as string) || 0)
        }
        if (values.length == 0) { return cellSpan }
        log("renderTitleProgress", values)
        let titleSpan = cellSpan.querySelector(".cell-text") as HTMLSpanElement;
        titleSpan.style.position = "relative";
        titleSpan.style.width = "100%";
        titleSpan.style.zIndex = "1"
        let progressNode = this.progress.opacity(
          values,
          Zotero.Prefs.get(
            `${config.addonRef}.titleColumn.color`
          ) as string,
          Zotero.Prefs.get(
            `${config.addonRef}.titleColumn.opacity`
          ) as string,
        )
        progressNode.style.top = "0"
        progressNode.style.zIndex = "-1"
        progressNode.style.opacity = ".6"

        progressNode.style.position = "absolute"

        titleSpan.appendChild(progressNode)
        return cellSpan;
      }
    );
    // @ts-ignore
    // This is a private method. Make it public in toolkit.
    await ztoolkit.ItemTree.refresh();
  }

  /**
   * 把标签从标题分离为单独的列
   */
  public async createTagColumn() {
    // 用于分离多emoj，很魔鬼的bug
    const runes = require('runes')
    // 新增加的标签列，在调用Zotero.Tags，setColor时不会刷新
    ztoolkit.Tool.patch(Zotero.Tags, "setColor", "CalledRefresh", (original) => {
      return (id: number, name: string, color: string, pos: number) => {
        original.call(Zotero.Tags, id, name, color, pos)
        window.setTimeout(async () => {
          // @ts-ignore
          await ztoolkit.ItemTree.refresh();
        }, 0)
      }
    })
    await ztoolkit.ItemTree.register(
      "Tags",
      "标签",
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        let coloredTags = item.getColoredTags()
        return coloredTags.length > 0 ? JSON.stringify(coloredTags) : "";
      },
      {
        renderCellHook(index, data, column) {
          let getTagSpan = (tag: string, color: string) => {
            let tagSpan = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
            tagSpan.className = "tag-swatch"
            if (Zotero.Utilities.Internal.isOnlyEmoji(tag)) {
              tagSpan.textContent = tag;
            } else {
              tagSpan.style.backgroundColor = color;
            }
            return tagSpan
          }
          const tagSpans = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
          tagSpans.style.width = "100%"
          tagSpans.className = "tag-box"
          if (!data) { return tagSpans }
          let tags: { tag: string, color: string }[] = JSON.parse(data)
          const align = Zotero.Prefs.get(
            `${config.addonRef}.tagsColumn.align`
          ) as any
          let offset = 0
          const margin = parseFloat(
            Zotero.Prefs.get(
              `${config.addonRef}.tagsColumn.margin`
            ) as string
          )
          tags.forEach(tagObj => {
            let tag = tagObj.tag, color = tagObj.color
            if (Zotero.Utilities.Internal.isOnlyEmoji(tag)) {
              runes(tag).forEach((tag: string) => {
                let tagSpan = getTagSpan(tag, color)
                tagSpan.style[align] = `${offset}em`
                tagSpans.appendChild(tagSpan)
                offset += margin + 1
              })
            } else {
              let tagSpan = getTagSpan(tag, color)
              tagSpan.style.top = ".1em"
              tagSpan.style[align] = `${offset + 0.25 * Number(align == "left" ? 1 : -1)}em`
              tagSpans.appendChild(tagSpan)
              offset += margin + 1

            }
          })
          return tagSpans;
        },
      }
    );
  }

  /**
   * 创建进度列，用于展示标注分布
   */
  public async createProgressColumn() {
    await ztoolkit.ItemTree.register(
      "Progress",
      "进度",
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        window.setTimeout(async () => {
          const cacheKey = `${item.key}-getBestAttachment`
          this.cache[cacheKey] = await item.getBestAttachment()
        })
        return this.addonItem.get(item, "readingTime")?.page
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          const span = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
          let item = ZoteroPane.getSortedItems()[index]
          let page: number
          try {
            page = Number(this.addonItem.get(item, "readingTime").page)
          } catch { return span }
          let record: Record = { page, data: {} }
          let pdfItem
          const cacheKey = `${item.key}-getBestAttachment`
          pdfItem = this.cache[cacheKey]
          if (!pdfItem) { return span }
          const annoArray = pdfItem.getAnnotations()
          annoArray.forEach((anno: any) => {
            try {
              let pageIndex = Number(JSON.parse(anno._annotationPosition).pageIndex)
              if (pageIndex in record.data == false) {
                record.data[pageIndex] = 1
              } else {
                // @ts-ignore
                record.data[pageIndex] += 1
              }
            } catch { }
          })
          let values = []
          for (let i = 0; i < record.page; i++) {
            values.push(parseFloat(record.data[i] as string) || 0)
          }
          if (values.length == 0) { return span }
          log("createProgressColumn", values)
          let progressNode = (new Progress()).line(
            values,
            Zotero.Prefs.get(
              `${config.addonRef}.progressColumn.color`
            ) as string,
            Zotero.Prefs.get(
              `${config.addonRef}.progressColumn.opacity`
            ) as string
          )
          span.appendChild(progressNode)
          return span;
        },
      }
    );
  }

  /**
   * 创建分区影响因子列
   * 不同分区用不同颜色表示，不同影响因子用长度表示，默认是当前collection最大影响因子
   */
  public async createIFColumn() {
    const key = "IF"
    await ztoolkit.ItemTree.register(
      key,
      "影响因子",
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        const publicationTitle = item.getField("publicationTitle")
        if (!(publicationTitle && publicationTitle != "")) { return "-1:publicationTitle" }
        let sciif = ztoolkit.Tool.getExtraField(item, "sciif")
        log("sciif", sciif)
        if (sciif) {
          return sciif
        }
        try {
          // 开启一个异步更新影响因子
          window.setTimeout(async () => {
            const response = await this.requests.post(
              "https://easyscholar.cc/homeController/getQueryTable.ajax",
              {
                page: "1",
                limit: "1",
                sourceName: publicationTitle
              }
            )
            if (response) {
              let data = response.data[0]
              if (data && data.sciif && data.sci) {
                ztoolkit.Tool.setExtraField(item, "sciif", data.sciif)
                ztoolkit.Tool.setExtraField(item, "sci", data.sci)
              }
            }
          }, 0)
        } catch { }
        return "0"
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          const span = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
          let value = data ? Number(data) : 0
          let sortedValues = ZoteroPane.getSortedItems().map(item => {
            try {
              // return Number(JSON.parse(ztoolkit.Tool.getExtraField(item, key) as string).if)
              return Number(ztoolkit.Tool.getExtraField(item, "sciif") || "0")
            } catch {
              return 0
            }
          })
            .filter(e => e > 0)
            .concat([value])
            .sort((a, b) => b - a)
          let maxValue
          if (sortedValues.length > 1) {
            let meanValue = sortedValues.reduce((a, b) => a + b) / sortedValues.length
            let s = 0
            for (let i = 0; i < sortedValues.length; i++) {
              s += (sortedValues[i] - meanValue) ** 2
            }
            s = (s / sortedValues.length) ** .5
            maxValue = meanValue + 3 * s
            maxValue = maxValue > sortedValues[0] ? sortedValues[0] * 1.1 : maxValue
          } else {
            maxValue = sortedValues[0]
          }
          let progressNode = (new Progress()).linePercent(
            value, maxValue > 10 ? maxValue : 10,
            Zotero.Prefs.get(
              `${config.addonRef}.IFColumn.color`
            ) as string,
            Zotero.Prefs.get(
              `${config.addonRef}.IFColumn.opacity`
            ) as string
          )
          span.appendChild(progressNode)
          return span;
        },
      }
    );
  }

  /**
   * 顶栏显示视图切换圆点按钮
   */
  public registerSwitchColumnsViewUI() {
    type ColumnsView = {
      name: string;
      content: string;
      dataKeys: string[];
    }
    const prefKey = `${config.addonRef}.columnsViews`
    // function
    let switchColumnsView = (columnView: ColumnsView) => {
      log("switchColumnsView", columnView.dataKeys)
      ZoteroPane.itemsView._getColumns().forEach((column: any, i: number) => {
        const needHidden = columnView.dataKeys.indexOf(column.dataKey) == -1
        if (needHidden != !!column.hidden) {
          ZoteroPane.itemsView.tree._columns.toggleHidden(i)
        }
      })
      ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
    }
    let getCurrentDataKeys = () => {
      const dataKeys = (
        (ZoteroPane.itemsView._getColumns() as { hidden: boolean, dataKey: string }[])
          .filter(i => !i.hidden)
        .map(i => i.dataKey)
      )
      return dataKeys
    }
    let isCurrent = (columnView: ColumnsView) => {
      return JSON.stringify(getCurrentDataKeys().sort()) == JSON.stringify(columnView.dataKeys.sort())
    }
    let updateOptionNode = (timeout: number) => {
      switchContainer.querySelectorAll("span").forEach(e => e.remove())
      const columnsViews = JSON.parse(Zotero.Prefs.get(prefKey) as string) as ColumnsView[]
      for (let i = 0; i < columnsViews.length; i++) {
        let columnsView = columnsViews[i]
        const r: number = 0.7
        const color = {
          active: "#EB455F",
          default: "#BAD7E9"
        }
        let optionNode = switchContainer.appendChild(
          ztoolkit.UI.creatElementsFromJSON(
            document,
            {
              tag: "span",
              styles: {
                display: "inline-block",
                borderRadius: "1em",
                width: `${r}em`,
                height: `${r}em`,
                backgroundColor: isCurrent(columnsView) ? color.active : color.default,
                opacity: "0.7",
                cursor: "pointer",
                margin: " 0 .25em"
              },
              listeners: [
                {
                  type: "mouseenter",
                  listener: () => {
                    optionNode.style.opacity = "1"
                    this.showProgressWindow(columnsView.name, columnsView.content, "default", -1)
                  }
                },
                {
                  type: "mouseleave",
                  listener: () => {
                    optionNode.style.opacity = "0.7"
                    this.progressWindow.close()
                  }
                },
                {
                  type: "click",
                  listener: () => {
                    switchColumnsView(columnsView)
                    optionNode.parentNode?.childNodes.forEach((e: any) => e.style.backgroundColor = color.default)
                    optionNode.style.backgroundColor = color.active
                  }
                }
              ]
            }
          ) as HTMLSpanElement
        )
      }
      switchContainer.style.opacity = "1"
      if (timeout > 0) {        
        window.setTimeout(() => {
          switchContainer.style.opacity = "0"
        }, timeout)
      }
    }
    // toolbar UI
    const toolbar = document.querySelector("#zotero-items-toolbar") as XUL.Element
    toolbar.onmouseenter = () => {
      updateOptionNode(-1)
    }
    toolbar.onmouseleave = () => {
      switchContainer.style.opacity = "0"
    }
    const switchContainer = toolbar.insertBefore(
      ztoolkit.UI.creatElementsFromJSON(
        document,
        {
          tag: "div",
          styles: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            opacity: "0",
            transition: "opacity .23s linear"
          }
        }
      ) as HTMLElement,
      toolbar.querySelector("#zotero-tb-search-spinner")
    )
    toolbar.insertBefore(
      ztoolkit.UI.creatElementsFromJSON(
        document,
        {
          tag: "spacer",
          namespace: "xul",
          attributes: {
            flex: "1"
          }
        }
      ) as XUL.Spacer,
      toolbar.querySelector("#zotero-tb-search-spinner")
    )
    // menu UI
    ztoolkit.Tool.patch(
      ZoteroPane.itemsView,
      "_displayColumnPickerMenu",
      "zoterostyle",
      (original) =>
        function () {
          let addSaveButton = () => {
            if (document.querySelector("#add-save-item")) { return }
            let saveMenuItem = document.createElementNS(ns, 'menuitem') as XUL.MenuItem
            saveMenuItem.setAttribute('label', "保存当前视图");
            saveMenuItem.setAttribute("id", "add-save-item")
            saveMenuItem.addEventListener('command', async () => {
              // 打开窗口
              // 弹窗获取名字和内容
              var io = {
                name: "",
                content: ""
              };
              // @ts-ignore
              window.openDialog(
                `chrome://${config.addonRef}/content/addView.xul`,
                'add-view',
                'chrome,modal,centerscreen',
                io
              );
              log(io)
              if (!io.name) { return }
              // 获取到用户输入后
              columnsViews.push({
                name: io.name,
                content: io.content || "好懒啊，备注都没有",
                dataKeys: getCurrentDataKeys()
              })
              Zotero.Prefs.set(prefKey, JSON.stringify(columnsViews))
              updateOptionNode(1000)
            })
            colViewPopup.appendChild(saveMenuItem)
          }
          const ns = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
          // @ts-ignore
          original.apply(ZoteroPane.itemsView, arguments);
          const menupopup = document.querySelector("#zotero-column-picker")
          // 分割线
          let sep = document.createElementNS(ns, 'menuseparator');
          menupopup.appendChild(sep);
          // 保存列视图菜单
          let colViewPrimaryMenu = document.createElementNS(ns, 'menu') as XUL.Menu
          colViewPrimaryMenu.setAttribute("label", "视图组")
          let colViewPopup = document.createElementNS(ns, 'menupopup') as XUL.MenuItem
          colViewPrimaryMenu.appendChild(colViewPopup)

          // 获取已保存列视图
          const columnsViews = JSON.parse(Zotero.Prefs.get(prefKey) as string) as ColumnsView[]

          let isSaved = false
          for (let columnsView of columnsViews) {
            let colViewItem = document.createElementNS(ns, 'menuitem') as XUL.MenuItem
            colViewItem.setAttribute('colViewName', columnsView.name);
            colViewItem.setAttribute('label', columnsView.name);
            colViewItem.setAttribute('type', 'checkbox');

            if (isCurrent(columnsView)) {
              colViewItem.setAttribute("checked", "true")
              isSaved = true
            }

            colViewItem.addEventListener('click', (event) => {
              if (event.button == 2) {
                // 鼠标右键删除
                Zotero.Prefs.set(prefKey, JSON.stringify(columnsViews.filter(e => e != columnsView)))
                colViewItem.remove()
                if (!colViewPopup.querySelector("menuitem[checked=true]")) {
                  addSaveButton()
                }
              } else if (event.button == 0) {
                // 鼠标左键选中
                if (colViewItem.getAttribute("checked") != "true") {
                  switchColumnsView(columnsView)
                }
              }
            })
            colViewPopup.appendChild(colViewItem);
          }
          if (!isSaved) {
            addSaveButton()
          }
          menupopup.appendChild(colViewPrimaryMenu)
        }
    )
  }

  public showProgressWindow(
    header: string,
    context: string,
    type: string = "default",
    t: number = 5000,
    maxLength: number = 100
  ) {
    if (this.progressWindow) {
      this.progressWindow.close();
    }
    let progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    this.progressWindow = progressWindow
    progressWindow.changeHeadline(header);
    progressWindow.progress = new progressWindow.ItemProgress(
      this.progressWindowIcon[type],
      (maxLength > 0 && context.length > maxLength) ? context.slice(0, maxLength) + "..." : context
    );
    progressWindow.show();
    if (t > 0) {
      progressWindow.startCloseTimer(t);
    }
    return progressWindow
  }
}


interface Record {
  page: number,
  data: {
    [key: string]: string | number
  }
}