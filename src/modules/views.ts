import { config } from "../../package.json";
import AddonItem from "./item";
import Progress from "./progress";
import Requests from "./requests";
import { getString, initLocale } from "./locale";

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
    ztoolkit.log("addStyle")
    const style = ztoolkit.UI.createElement(document, "link", {
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
    const key = "title"
    await ztoolkit.ItemTree.addRenderCellHook(
      key,
      (index: number, data: string, column: any, original: Function) => {
        const cellSpan = original(index, data, column) as HTMLSpanElement;
        let titleSpan = cellSpan.querySelector(".cell-text") as HTMLSpanElement;
        const title = titleSpan.innerText
        titleSpan.innerText = ""
        const span = ztoolkit.UI.createElement(
          document,
          "span",
          {
            id: "title",
            properties: {
              innerText: title
            }
          })
        titleSpan.appendChild(span)
        if (!Zotero.Prefs.get(
          `${config.addonRef}.titleColumn.tags`
        )) {
          cellSpan.querySelectorAll(".tag-swatch").forEach(e => {
            e.remove()
          })
        } else {
          cellSpan.querySelectorAll(".tag-swatch").forEach(e => {
            titleSpan.insertBefore(e, span)
            span.style.marginLeft = "0.3em"
          });
        }
        const item = ZoteroPane.getSortedItems()[index]
        let record: Record = this.addonItem.get(item, "readingTime") as Record
        if(!record) { return cellSpan }
        let values = []
        for (let i = 0; i < record.page; i++) {
          values.push(parseFloat(record.data[i] as string) || 0)
        }
        if (values.length == 0) { return cellSpan }
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

        progressNode.style.position = "absolute"

        titleSpan.appendChild(progressNode)
        return cellSpan;
      }
    );
    this.patchSetting(
      key,
      [
        {
          prefKey: "titleColumn.tags",
          name: "Tags",
          type: "boolean"
        },
        {
          prefKey: "titleColumn.color",
          name: "Color",
          type: "input",
        },
        {
          prefKey: "titleColumn.opacity",
          name: "Opacity",
          type: "range",
          range: [0, 1, 0.01],
        }
      ]
    )
  }

  /**
   * 把标签从标题分离为单独的列
   */
  public async createTagsColumn() {
    // 用于分离多emoj，很魔鬼的bug
    const runes = require("runes")
    // 新增加的标签列，在调用Zotero.Tags，setColor时不会刷新
    if (!Zotero.Tags.setColor.CalledRefresh) {
      ztoolkit.patch(Zotero.Tags, "setColor", "CalledRefresh", (original) => {
        return (id: number, name: string, color: string, pos: number) => {
          original.call(Zotero.Tags, id, name, color, pos)
          window.setTimeout(async () => {
            // @ts-ignore
            await ztoolkit.ItemTree.refresh();
          }, 0)
        }
      })
    }

    const key = "Tags"
    await ztoolkit.ItemTree.register(
      key,
      getString(`column.${key}`),
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
          ) as any || "left"
          let offset = 0
          const margin = parseFloat(
            Zotero.Prefs.get(
              `${config.addonRef}.tagsColumn.margin`
            ) as string
          )
          tags.forEach(tagObj => {
            let tag = tagObj.tag, color = tagObj.color
            if (tag.startsWith("#")) { return }
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

    this.patchSetting(
      key,
      [
        {
          prefKey: "tagsColumn.align",
          name: "Align",
          type: "select",
          values: ["left", "right"],
        },
        {
          prefKey: "tagsColumn.margin",
          name: "Margin",
          type: "range",
          range: [0, 1, 0.01],
        }
      ]
    )
  }

  /**
   * #标签，只显#标注的示文字标签
   */
  public async createTextTagsColumn() {
    const key = "Tags"
    await ztoolkit.ItemTree.register(
      "Text" + key,
      "#" + getString(`column.${key}`),
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        let coloredTags = item.getColoredTags()
        let tags = item.getTags().filter(tag => coloredTags.map((tag: any)=>tag.tag).indexOf(tag.tag) == -1)
        return coloredTags.length > 0 ? JSON.stringify([...coloredTags, ...tags]) : "";
      },
      {
        renderCellHook(index, data, column) {
          let getTagSpan = (tag: string, color: string) => {
            let tagSpan = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
            color = color || "#FF8787"
            // @ts-ignore
            tagSpan.style = `
              background-color: ${color || "#FF8787"};
              height: 1.5em;
              line-height: 1.5em;
              padding: 0 .5em;
              color: white;
              display: inline-block;
              border-radius: 3px;
              margin: 0 .2em;
            `
            tagSpan.innerText = tag;
            return tagSpan
          }
          const tagSpans = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
          // @ts-ignore
          tagSpans.style = `
            display: felx;
            flex-direction: row;
            justify-content: start;
            align-items: center;
          `
          if (!data) { return tagSpans }
          let tags: { tag: string, color: string }[] = JSON.parse(data)
          // const align = Zotero.Prefs.get(
          //   `${config.addonRef}.tagsColumn.align`
          // ) as any || "left"
          // let offset = 0
          // const margin = parseFloat(
          //   Zotero.Prefs.get(
          //     `${config.addonRef}.tagsColumn.margin`
          //   ) as string
          // )
          tags.forEach(tagObj => {
            let tag = tagObj.tag, color = tagObj.color
            if (!tag.startsWith("#")) { return }
            let tagSpan = getTagSpan(tag.slice(1), color)
            tagSpans.appendChild(tagSpan)
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
    const key = "Progress"
    await ztoolkit.ItemTree.register(
      key,
      getString(`column.${key}`),
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        window.setTimeout(async () => {
          const cacheKey = `${item.key}-getBestAttachment`
          this.cache[cacheKey] = item.isRegularItem() && await item.getBestAttachment()
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
          if (annoArray.length == 0) { return span }
          annoArray.forEach((anno: any) => {
            const charNum = (anno._annotationText || anno._annotationComment || "").length
            try {
              let pageIndex = Number(JSON.parse(anno._annotationPosition).pageIndex)
              if (pageIndex in record.data == false) {
                record.data[pageIndex] = charNum
              } else {
                // @ts-ignore
                record.data[pageIndex] += charNum
              }
            } catch { }
          })
          let values = []
          for (let i = 0; i < record.page; i++) {
            values.push(parseFloat(record.data[i] as string) || 0)
          }
          if ([...values].sort((a, b) => b -a )[0] == 0) { return span}
          ztoolkit.log("createProgressColumn", values)
          const style = Zotero.Prefs.get(
            `${config.addonRef}.progressColumn.style`
          ) as string || "bar"
          // @ts-ignore
          let progressNode = (new Progress())[style](
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
    this.patchSetting(
      key,
      [
        {
          prefKey: "progressColumn.style",
          name: "Style",
          type: "select",
          values: ["bar", "line"]
        },
        {
          prefKey: "progressColumn.color",
          name: "Color",
          type: "input",
        },
        {
          prefKey: "progressColumn.opacity",
          name: "Opacity",
          type: "range",
          range: [0, 1, 0.01],
        },
        {
          prefKey: "progressColumn.circle",
          name: "Circle",
          type: "boolean"
        }
      ]
    )
  }

  /**
   * 创建分区影响因子列
   * 不同分区用不同颜色表示，不同影响因子用长度表示，默认是当前collection最大影响因子
   */
  public async createIFColumn() {
    const key = "IF"
    await ztoolkit.ItemTree.register(
      key,
      getString(`column.${key}`),
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        const publicationTitle = item.getField("publicationTitle")
        if (!(publicationTitle && publicationTitle != "")) { return "-1" }
        let sciif = ztoolkit.ExtraField.getExtraField(item, "sciif")
        if (sciif) {
          return sciif
        }
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
              ztoolkit.ExtraField.setExtraField(item, "sciif", data.sciif)
              ztoolkit.ExtraField.setExtraField(item, "sci", data.sci)
            }
          }
        }, 0)
        return "0"
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          // const cacheKey = `IF-${data}-${index}`
          // if (this.cache[cacheKey]) {
          //   let span = this.cache[cacheKey].cloneNode(true)
          //   return span
          // }
          const span = ztoolkit.UI.createElement(document, "span", "html") as HTMLSpanElement
          let value = Number(data)
          if (value == -1) { return span }
          let progressNode = (new Progress()).linePercent(
            value, 
            parseFloat(Zotero.Prefs.get(
              `${config.addonRef}.IFColumn.max`
            ) as string),
            Zotero.Prefs.get(
              `${config.addonRef}.IFColumn.color`
            ) as string,
            Zotero.Prefs.get(
              `${config.addonRef}.IFColumn.opacity`
            ) as string
          )
          span.appendChild(progressNode)
          // this.cache[cacheKey] = span.cloneNode(true)
          return span;
        },
      }
    );
    this.patchSetting(
      key,
      [
        {
          prefKey: "IFColumn.color",
          name: "Color",
          type: "input",
        },
        {
          prefKey: "IFColumn.opacity",
          name: "Opacity",
          type: "range",
          range: [0, 1, 0.01],
        },
        {
          prefKey: "IFColumn.max",
          name: "Max",
          type: "input"
        }
      ]
    )
  }

  /**
   * 顶栏显示视图切换圆点按钮
   */
  public registerSwitchColumnsViewUI() {
    type ColumnsView = {
      name: string;
      position: string;
      content: string;
      dataKeys: string[];
    }
    const prefKey = `${config.addonRef}.columnsViews`

    // function
    let switchColumnsView = (columnView: ColumnsView) => {
      const allColumns = ZoteroPane.itemsView._getColumns()

      allColumns.forEach((column: any, index: number) => {
        const needHidden = columnView.dataKeys.indexOf(column.dataKey) == -1
        if (needHidden != !!column.hidden) {
          const column = ZoteroPane.itemsView.tree._columns._columns[index];
          column.hidden = !column.hidden;
          window.setTimeout(() => {
            let prefs = ZoteroPane.itemsView.tree._columns._getPrefs();
            if (prefs[column.dataKey]) {
              prefs[column.dataKey].hidden = column.hidden;
            }
            ZoteroPane.itemsView.tree._columns._storePrefs(prefs);
          })
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
      return isSame(getCurrentDataKeys(), columnView.dataKeys)
    }
    let isSame = (a: string[], b: string[]) => {
      return JSON.stringify(a.sort()) == JSON.stringify(b.sort())
    }
    let optionTimer: number | undefined = undefined
    let updateOptionNode = (timeout: number) => {
      switchContainer.querySelectorAll("span").forEach(e => e.remove())
      const columnsViews = JSON.parse(Zotero.Prefs.get(prefKey) as string) as ColumnsView[]
      for (let i = 0; i < columnsViews.length; i++) {
        let columnsView = columnsViews[i]
        const r: number = .7
        const color = {
          active: "#fd91a6",
          default: "#83c7c7"
        }
        let optionNode = switchContainer.appendChild(
          ztoolkit.UI.createElement(
            document,
            "span",
            {
              styles: {
                display: "inline-block",
                borderRadius: "1em",
                width: `${r}em`,
                height: `${r}em`,
                backgroundColor: isCurrent(columnsView) ? color.active : color.default,
                transition: "background-color .3s linear",
                // border: "1px solid rgba(0, 0, 0, 0.3)",
                opacity: "0.7",
                cursor: "pointer",
                margin: " 0 .3em"
              },
              listeners: [
                {
                  type: "mouseenter",
                  listener: () => {
                    window.clearTimeout(optionTimer)
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
        optionTimer = window.setTimeout(() => {
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
      ztoolkit.UI.createElement(
        document,
        "div",
        {
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
      ztoolkit.UI.createElement(
        document,
        "spacer",
        {
          namespace: "xul",
          attributes: {
            flex: "1"
          }
        }
      ) as XUL.Spacer,
      toolbar.querySelector("#zotero-tb-search-spinner")
    )
    
    // menu UI
    ztoolkit.patch(
      ZoteroPane.itemsView,
      "_displayColumnPickerMenu",
      "zoterostyle-registerSwitchColumnsViewUI",
      (original) =>
        function() {
          let sort = (columnsViews: ColumnsView[]) => {
            return columnsViews.sort((a: ColumnsView, b: ColumnsView) => Number(a.position) - Number(b.position))
          }
          let addView = (columnsView: ColumnsView) => {
            dialog({
              attributes: {buttonlabelaccept: "Add", title: "New View"}, 
              element: ztoolkit.UI.createElement(
                document,
                "vbox",
                {
                  id: "container",
                  namespace: "xul",
                  // attributes: {
                  //   flex: "1"
                  // },
                  children: [
                    {
                      tag: "label",
                      attributes: {
                        value: "Name"
                      }
                    },
                    {
                      tag: "textbox",
                      id: "view-name",
                      attributes: {
                        flex: "1",
                        value: columnsView.name
                      }
                    },
                    {
                      tag: "separator"
                    },
                    {
                      tag: "label",
                      attributes: {
                        value: "Position"
                      }
                    },
                    {
                      tag: "textbox",
                      id: "view-position",
                      attributes: {
                        flex: "1",
                        value: columnsView.position
                      }
                    },
                    {
                      tag: "separator"
                    },
                    {
                      tag: "label",
                      attributes: {
                        value: "Content"
                      }
                    },
                    {
                      tag: "textbox",
                      id: "view-content",
                      attributes: {
                        flex: "1",
                        multiline: "true",
                        rows: "4",
                        value: columnsView.content
                      }
                    }
                  ]
                }
              ),
              hooks: {
                accept: (_document: any) => {
                  let name = _document.querySelector("#view-name").value
                  let position = _document.querySelector("#view-position").value
                  let content = _document.querySelector("#view-content").value
                  if (name) { 
                    columnsViews.push({
                      name,
                      position,
                      content: content || name,
                      dataKeys: columnsView.dataKeys.length > 0 ? columnsView.dataKeys : getCurrentDataKeys()
                    })
                    columnsViews = sort(columnsViews)
                    Zotero.Prefs.set(prefKey, JSON.stringify(columnsViews))
                    updateOptionNode(1000)
                   }
                },
              }
            }, 350, 330)
            // // @ts-ignore
            // window.openDialog(
            //   `chrome://${config.addonRef}/content/addView.xul`,
            //   "add-view",
            //   "chrome,modal,centerscreen",
            //   io
            // );
            // if (!io.name) { return }
            // // 获取到用户输入后
            // columnsViews.push({
            //   name: io.name,
            //   position: io.position,
            //   content: io.content || io.name,
            //   dataKeys: io.dataKeys.length > 0 ? io.dataKeys : getCurrentDataKeys()
            // })
            // columnsViews = sort(columnsViews)
            // Zotero.Prefs.set(prefKey, JSON.stringify(columnsViews))
            // updateOptionNode(1000)
          }
          let addButton = () => {
            if (document.querySelector("#add-save-item")) { return }
            let saveMenuItem = document.createElementNS(ns, "menuitem") as XUL.MenuItem
            saveMenuItem.setAttribute("label", getString("column.view.add"));
            saveMenuItem.setAttribute("id", "add-save-item")
            saveMenuItem.addEventListener("command", async () => {
              addView({
                name: "",
                position: "",
                content: "",
                dataKeys: []
              })
            })
            colViewPopup.appendChild(saveMenuItem)
          }
          const ns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
          // @ts-ignore
          original.apply(ZoteroPane.itemsView, arguments);
          const menupopup = document.querySelector("#zotero-column-picker")
          // 分割线
          let sep = document.createElementNS(ns, "menuseparator");
          menupopup.appendChild(sep);
          // 保存列视图菜单
          let colViewPrimaryMenu = document.createElementNS(ns, "menu") as XUL.Menu
          colViewPrimaryMenu.setAttribute("label", getString("column.view.group"))
          let colViewPopup = document.createElementNS(ns, "menupopup") as XUL.MenuItem
          colViewPrimaryMenu.appendChild(colViewPopup)

          // 获取已保存列视图
          let columnsViews = JSON.parse(Zotero.Prefs.get(prefKey) as string) as ColumnsView[]
          columnsViews = sort(columnsViews)
          let isAdded = false
          for (let columnsView of columnsViews) {
            let colViewItem = document.createElementNS(ns, "menuitem") as XUL.MenuItem
            colViewItem.setAttribute("colViewName", columnsView.name);
            colViewItem.setAttribute("label", columnsView.name);
            colViewItem.setAttribute("type", "checkbox");

            if (isCurrent(columnsView)) {
              colViewItem.setAttribute("checked", "true")
              isAdded = true
            }
            colViewItem.addEventListener("click", (event) => {
              if (event.button == 2) {
                // 鼠标右键删除
                columnsViews = columnsViews.filter(e => {
                  return !isSame(e.dataKeys, columnsView.dataKeys)
                })
                Zotero.Prefs.set(prefKey, JSON.stringify(columnsViews))
                colViewItem.remove()
                if (!colViewPopup.querySelector("menuitem[checked=true]")) {
                  addButton()
                }
                updateOptionNode(1000)
              } else if (event.button == 0) {
                // 等待mouseup事件结束
                switchColumnsView(columnsView)
              }
            })
            let pressTimer: number | undefined
            colViewItem.addEventListener("mousedown", (event) => {
              pressTimer = window.setTimeout(() => {
                // 重新编辑columnsView
                columnsViews = columnsViews.filter(e => {
                  return !isSame(e.dataKeys, columnsView.dataKeys)
                })
                addView(columnsView)
              }, 1000)
            })
            colViewItem.addEventListener("mouseup", (event) => {
              ztoolkit.log("mouseup", pressTimer)
              window.clearTimeout(pressTimer)
              pressTimer = undefined
              ztoolkit.log("mouseup", pressTimer)
            })
            colViewPopup.appendChild(colViewItem);
          }
          if (!isAdded) {
            addButton()
          }
          menupopup.appendChild(colViewPrimaryMenu)
        }
    )
  }

  /**
   * 右键一列弹出列设置窗口
   * @param colKey 
   * @param args 
   */
  public patchSetting(
    colKey: string,
    args: { prefKey: string, name: string, type: string, range?: number[], values?: string[] }[]
  ) {
    ztoolkit.patch(
      ZoteroPane.itemsView,
      "_displayColumnPickerMenu",
      `zoterostyle-setting-${colKey}`,
      (original) =>
        function () {
          // @ts-ignore
          original.apply(ZoteroPane.itemsView, arguments);
          const menupopup = document.querySelector("#zotero-column-picker")
          let left = menupopup.getBoundingClientRect().left
          let rect
          try {
            rect = document.querySelector(`.${colKey}-item-tree-main-default`).getBoundingClientRect()
          } catch { return }
          if (!(left > rect.left && left < rect.right)) { return }
          // 保存列视图菜单
          const ns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
          let menuitem = document.createElementNS(ns, "menuitem") as XUL.Menu
          menuitem.setAttribute("label", getString("column.Setting"))
          menupopup.appendChild(menuitem)
          let prefs: { [key: string]: string | boolean } = {}
          let accept = (document: any) => {
            for (let key in prefs) {
              ztoolkit.log(`${config.addonRef}.${key}`, prefs[key])
              Zotero.Prefs.set(`${config.addonRef}.${key}`, prefs[key])
            }
            ZoteroPane.itemsView.tree._columns._updateVirtualizedTable()
            //@ts-ignore
            ztoolkit.ItemTree.refresh()
          }
          // 点击设置弹出对话框
          const eachHeight = 25
          menuitem.onclick = () => {
            // 根据args创建元素
            let element = ztoolkit.UI.createElement(
              document,
              "div",
              {
                namespace: "html",
                styles: {
                  dislay: "flex",
                  width: "100%",
                  height: "100%"
                },
                children: [
                  {
                    tag: "div",
                    id: "container",
                    namespace: "html",
                    styles: {
                      display: "flex",
                      flexDirection: "row",
                    },
                    children: [
                      {
                        tag: "div",
                        namespace: "html",
                        id: "name",
                        styles: {
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "end",
                          justifyContent: "space-between",
                          height: `${eachHeight * args.length}px`,
                        }
                      },
                      {
                        tag: "div",
                        namespace: "html",
                        id: "control",
                        styles: {
                          display: "flex",
                          width: "100%",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          height: `${eachHeight * args.length}px`,
                        }
                      }
                    ]
                  }
                ]
              }
            ) as XUL.Element
            for (let arg of args) {
              // 名称
              element.querySelector("#name")?.appendChild(
                ztoolkit.UI.createElement(
                  document,
                  "label",
                  {
                    namespace: "xul",
                    attributes: {
                      value: arg.name
                    }
                  }
                )
              )
              // 控制
              let prefValue = Zotero.Prefs.get(`${config.addonRef}.${arg.prefKey}`)
              let id = arg.prefKey.replace(/\./g, "-")
              let vbox = element.querySelector("#control") as XUL.Box
              const width = "10em"
              let control
              switch (arg.type) {
                case "boolean":
                  // 创建选框
                  control = ztoolkit.UI.createElement(
                    document,
                    "checkbox",
                    {
                      namespace: "xul",
                      id,
                      attributes: {
                        checked: prefValue as boolean,
                      },
                      listeners: [
                        {
                          type: "click",
                          listener: function () {
                            // 这个要快一点，所以如果当前是true点击后会变成false
                            //@ts-ignore
                            prefs[arg.prefKey] = this.getAttribute("checked") != "true"
                          }
                        }
                      ]
                    }
                  )
                  break
                case "select":
                  ztoolkit.log(arg.values!.indexOf(prefValue as string), arg.values, prefValue)
                  control = ztoolkit.UI.createElement(
                    document,
                    "select",
                    {
                      namespace: "html",
                      id,
                      styles: {
                        width: width
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: function () {
                            //@ts-ignore
                            prefs[arg.prefKey] = arg.values[this.selectedIndex]
                          }
                        }
                      ],
                      children: (() => {
                        let arr = []
                        for (let value of arg.values!) {
                          arr.push(
                            {
                              tag: "option",
                              attributs: {
                                value: value
                              },
                              directAttributes: {
                                innerText: value
                              },
                              listeners: [
                                {
                                  type: "click",
                                  listener: function () {
                                    //@ts-ignore
                                    this.parentNode.setAttribute("value", value)
                                  }
                                }
                              ]
                            }
                          )
                        }
                        return arr
                      })()
                    }
                  )
                  control.selectedIndex = arg.values!.indexOf(prefValue as string) 
                  break
                case "range":
                  control = ztoolkit.UI.createElement(
                    document,
                    "input",
                    {
                      namespace: "html",
                      id,
                      styles: {
                        width: width
                      },
                      attributes: {
                        label: arg.name,
                        type: "range",
                        min: arg.range![0],
                        max: arg.range![1],
                        step: arg.range![2],
                        value: prefValue as string
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: function () {
                            //@ts-ignore
                            prefs[arg.prefKey] = this.value
                          }
                        }
                      ],
                    }
                  )
                  break
                default:
                  control = ztoolkit.UI.createElement(
                    document,
                    "input",
                    {
                      tag: "input",
                      id,
                      styles: {
                        width: width
                      },
                      namespace: "html",
                      attributes: {
                        type: "text",
                        value: prefValue as string
                      },
                      listeners: [
                        {
                          type: "change",
                          listener: function () {
                            //@ts-ignore
                            prefs[arg.prefKey] = this.value
                          }
                        }
                      ]
                    }
                  )
              }
              vbox.appendChild(control)
            }
            // 对话框
            dialog({
              attributes: {
                buttonlabelaccept: "Set",
                title: colKey
              }, 
              element: element,
              hooks: { accept }
            }, 233, (args.length + 2.5) * eachHeight
            )
          }
        }
    )
  }

  /**
   * 显示右下角消息
   * @param header 
   * @param context 
   * @param type 
   * @param t 
   * @param maxLength 
   * @returns 
   */
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

function dialog(io: {
  attributes: {},
  element: XUL.Element,
  hooks: { accept?: Function, cancel?: Function }
}, width: number, height: number) {
  // @ts-ignore
  window.openDialog(
    `chrome://${config.addonRef}/content/dialog.xul`,
    "zotero-style",
    `chrome,centerscreen,width=${width},height=${height},alwaysRaised=yes`,
    io
  );
}

interface Record {
  page: number,
  data: {
    [key: string]: string | number
  }
}