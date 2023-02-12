import { config } from "../../package.json";
import AddonItem from "./item";
import Progress from "./progress";
import { getString, initLocale } from "./locale";
import { Command, Prompt } from "E:/Github/zotero-plugin-toolkit/dist/managers/prompt";
import field2Info from "./easyscholar";
import utils from "./utils";

export default class Views {
  private progress: Progress;
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
        const titleHTML = titleSpan.innerHTML
        titleSpan.innerHTML = ""
        const span = ztoolkit.UI.createElement(
          document,
          "span",
          {
            id: "title",
            properties: {
              innerHTML: titleHTML
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
        // @ts-ignore
        titleSpan.firstChild.style.marginLeft = ".3em"
        const color = Zotero.Prefs.get(
          `${config.addonRef}.titleColumn.color`
        ) as string;
        const opacity = Zotero.Prefs.get(
            `${config.addonRef}.titleColumn.opacity`
          ) as string
        if (Number(opacity) == 0) { return cellSpan }
        const item = ZoteroPane.itemsView.getRow(index).ref
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
          color,
          opacity,
          60
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
            let tagSpan = ztoolkit.UI.createElement(document, "span") as HTMLSpanElement
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
        let tags = item.getTags().filter(tag => coloredTags.map((tag: any) => tag.tag).indexOf(tag.tag) == -1)
        tags = [...coloredTags, ...tags]
        return tags.length > 0 ? JSON.stringify(tags) : "";
      },
      {
        renderCellHook(index, data, column) {
          const margin = Zotero.Prefs.get(`${config.addonRef}.text${key}Column.margin`) as string
          const padding = Zotero.Prefs.get(`${config.addonRef}.text${key}Column.padding`) as string
          let getTagSpan = (tag: string, backgroundColor?: string) => {
            const _backgroundColor = Zotero.Prefs.get(
              `${config.addonRef}.text${key}Column.backgroundColor`
            ) as string
            const textColor = Zotero.Prefs.get(
              `${config.addonRef}.text${key}Column.textColor`
            ) as string
            backgroundColor = backgroundColor || _backgroundColor || "#fadec9"
            let [red, green, blue] = Progress.getRGB(backgroundColor)
            let opacity = parseFloat(
              Zotero.Prefs.get(
                `${config.addonRef}.text${key}Column.opacity`
              ) as string
            )

            let tagSpan = ztoolkit.UI.createElement(document, "span", {
              namespace: "html",
              styles: {
                backgroundColor: `rgba(${red}, ${green}, ${blue}, ${opacity})`,
                height: "1.5em",
                lineHeight: "1.5em",
                padding: `0 ${padding}em`,
                color: textColor,
                display: "inline-block",
                borderRadius: "3px",
                margin: `${margin}em`
              },
              properties: {
                innerText: tag
              }
            }) as HTMLSpanElement
            return tagSpan
          }
          const tagSpans = ztoolkit.UI.createElement(document, "span", {
            namespace: "html",
            styles: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "start",
              alignItems: "center",
              height: "20px"
            }
          }) as HTMLSpanElement
          if (!data) { return tagSpans }
          let tags: { tag: string, color: string }[] = JSON.parse(data)
          const prefix = Zotero.Prefs.get(`${config.addonRef}.text${key}Column.prefix`) as string
          tags.forEach(tagObj => {
            let startIndex: number
            let tag = tagObj.tag, color = tagObj.color
            if (prefix.startsWith("~~")) {
              if (tag.startsWith(prefix.slice(2))) { return }
              startIndex = 0
            } else {
              if (prefix != "" && !tag.startsWith(prefix)) { return }
              startIndex = prefix.length
            }
            let tagSpan = getTagSpan(tag.slice(startIndex), color)
            tagSpans.appendChild(tagSpan)
          })
          return tagSpans;
        },
      }
    );
    this.patchSetting(
      "Text" + key,
      [
        {
          prefKey: `textTagsColumn.prefix`,
          name: "Prefix",
          type: "input"
        },
        {
          prefKey: "textTagsColumn.textColor",
          name: "Text",
          type: "input"
        },
        {
          prefKey: "textTagsColumn.backgroundColor",
          name: "Background",
          type: "input"
        },
        {
          prefKey: "textTagsColumn.opacity",
          name: "Opacity",
          type: "range",
          range: [0, 1, 0.01]
        },
        {
          prefKey: "textTagsColumn.margin",
          name: "Margin",
          type: "range",
          range: [0, 0.5, 0.001]
        },
        {
          prefKey: "textTagsColumn.padding",
          name: "Padding",
          type: "range",
          range: [0, 1, 0.001]
        },
        
      ]
    )
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
          const span = ztoolkit.UI.createElement(document, "span", {
            styles: {
              display: "inline-block",
              width: "100%",
              height: "20px"
            }
          }) as HTMLSpanElement
          
          let item = ZoteroPane.itemsView.getRow(index).ref
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
          values: ["bar", "line", "opacity"]
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
        const data = utils.wait(item, "publication")
        if (!data) { return "-1" }
        let value = data[Zotero.Prefs.get(`${config.addonRef}.${key}Column.field`) as string] || data.sciif || data.sciif5
        if (value) {
          return value
        }
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          const span = ztoolkit.UI.createElement(document, "span", {
            styles: {
              display: "flex",
              flexDirection: "row",
              paddingRight: ".5em"
            }
          }) as HTMLSpanElement
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
          if (Zotero.Prefs.get(
            `${config.addonRef}.IFColumn.info`
          ) as boolean) {
            span.appendChild(ztoolkit.UI.createElement(document, "span", {
              styles: {
                display: "inline-block",
                width: "4em",
                marginLeft: "0.5em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"

              },
              properties: {
                innerText: value
              }
            }))
          }
          return span;
        },
      }
    );

    this.patchSetting(
      key,
      [
        {
          prefKey: "IFColumn.field",
          name: "Field",
          type: "input"
        },
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
        },
        {
          prefKey: "IFColumn.info",
          name: "Info",
          type: "boolean"
        }
      ]
    )
  }

  /**
   * 创建分区影响因子列
   * 不同分区用不同颜色表示，不同影响因子用长度表示，默认是当前collection最大影响因子
   */
  public async createPublicationTagsColumn() {
    const key = "PublicationTags"
    await ztoolkit.ItemTree.register(
      key,
      getString(`column.${key}`),
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        try {
          const data = utils.wait(item, "publication")
          if (!data) { return "" }
          // 排序
          let sortBy: any = Zotero.Prefs.get(`${config.addonRef}.${key}Column.sortBy`) as string
          sortBy = sortBy.split(/,\s*/g)
          let s = sortBy.map((k: string) => {
            let value
            if (k.startsWith("-")) {
              k = k.slice(1)
              if (!data[k]) {
                value = 1e5
              } else {
                value = (1e5 - parseInt(String(Number(data[k].replace(/[^0-9\.]/g, "")) * 1e3)))
              }
            } else {
              if (!data[k]) {
                value = 1e5
              } else {
                value = parseInt(String(Number(data[k].replace(/[^0-9\.]/g, "")) * 1e3))
              }
            }
            value = String(value)
            value = value.slice(0, 6)
            while (value.length < 6) {
              value = "0" + value
            }
            return value
          }).join(".")
          return s + " \n" + JSON.stringify(data)
        } catch (e) {
          return ""
        }
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          const span = ztoolkit.UI.createElement(document, "span", {
            styles: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "start",
              alignItems: "center",
              height: "20px"
            }
          }) as HTMLSpanElement
          if (data == "") { return span }
          try {
            try {
              data = JSON.parse(data.split("\n")[1])
            } catch {
              return span
            }
            if (Object.keys(data).length == 0) { return span }
            // 渲染逻辑
            let rankColors = (Zotero.Prefs.get(`${config.addonRef}.${key}Column.rankColors`) as string).split(/,\s*/g)
            const defaultColor = Zotero.Prefs.get(`${config.addonRef}.${key}Column.defaultColor`) as string
            const textColor = Zotero.Prefs.get(`${config.addonRef}.${key}Column.textColor`) as string
            const opacity = Zotero.Prefs.get(`${config.addonRef}.${key}Column.opacity`) as string
            const margin = Zotero.Prefs.get(`${config.addonRef}.${key}Column.margin`) as string
            const padding = Zotero.Prefs.get(`${config.addonRef}.${key}Column.padding`) as string
            let fields: any = Zotero.Prefs.get(`${config.addonRef}.${key}Column.fields`) as string
            fields = fields.split(/,\s*/g).filter((i: string) => data[i])
            let mapString: any = Zotero.Prefs.get(`${config.addonRef}.${key}Column.map`) as string
            const textMap = new Map()
            mapString.split(/,\s*/g).filter((s: string) => s.indexOf("=") != -1).forEach((s: string) => {
              let [k, v] = s.split("=").map((s: string) => s.trim())
              k && v && textMap.set(k, v)
            })
            let getMapString = (k: string) => {
              return textMap.get(k) || k
            }
            for (let i = 0; i < fields.length; i++) {
              let field = fields[i]
              let fieldValue = data[field]
              let text, color
              if (field in field2Info) {
                let info = field2Info[field](fieldValue)
                let rankIndex = info.rank - 1
                color = rankIndex >= rankColors.length ? rankColors.slice(-1)[0] : rankColors[rankIndex]
                text = [getMapString(info.key), getMapString(info.value) ].filter(i=>i.length>0).join(" ")
              } else {
                if (field.toUpperCase() == fieldValue.toUpperCase()) {
                  text = getMapString(fieldValue.toUpperCase())
                } else {
                  text = `${getMapString(field.toUpperCase())} ${getMapString(fieldValue)}`
                }
                color = defaultColor
              }
              let [red, green, blue] = Progress.getRGB(color)
              span.appendChild(ztoolkit.UI.createElement(document, "span", {
                styles: {
                  backgroundColor: `rgba(${red}, ${green}, ${blue}, ${opacity})`,
                  color: textColor,
                  height: "1.5em",
                  lineHeight: "1.5em",
                  padding: `0 ${padding}em`,
                  display: "inline-block",
                  borderRadius: "3px",
                  margin: `${margin}em`
                },
                properties: {
                  innerText: text
                }
              })) 
            }
            //   styles: {
            //     backgroundColor: "none",
            //     color: "black",
            //     height: "1.5em",
            //     lineHeight: "1.5em",
            //     padding: "0 .5em",
            //     display: "inline-block",
            //     borderRadius: "3px",
            //     margin: "0.2em"
            //   },
            //   properties: {
            //     innerText: _text
            //   }
            // })) 
            return span;
          } catch (e) {
            ztoolkit.log(e)
            return span
          }
        },
      }
    );

    this.patchSetting(
      key,
      [
        {
          prefKey: `${key}Column.fields`,
          name: "Fields",
          type: "input",
        },
        {
          prefKey: `${key}Column.map`,
          name: "Map",
          type: "input",
        },
        {
          prefKey: `${key}Column.rankColors`,
          name: "Rank Colors",
          type: "input"
        },
        {
          prefKey: `${key}Column.defaultColor`,
          name: "Default Color",
          type: "input"
        },
        {
          prefKey: `${key}Column.textColor`,
          name: "Text Color",
          type: "input"
        },
        {
          prefKey: `${key}Column.sortBy`,
          name: "Sort By",
          type: "input"
        },
        {
          prefKey: `${key}Column.opacity`,
          name: "Opacity",
          type: "range",
          range: [0, 1, 0.01],
        },
        {
          prefKey: `${key}Column.margin`,
          name: "Margin",
          type: "range",
          range: [0, 0.5, 0.001]
        },
        {
          prefKey: `${key}Column.padding`,
          name: "Padding",
          type: "range",
          range: [0, 1, 0.001]
        },
      ],
      500
    )
  }

  /**
   * 模仿Endnote评级
   */
  public async createRatingColumn() {
    const key = "Rating"
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
        const rating = ztoolkit.ExtraField.getExtraField(item, "Rating")
        return rating ? rating : "0"
      },
      {
        renderCellHook: (index: any, data: any, column: any) => {
          const rating = Number(data)
          const span = ztoolkit.UI.createElement(document, "button", {
            namespace: "html",
            styles: {
              display: "inline-block",
              height: "20px",
              width: "100%",
              zIndex: "999"
            }
          }) as HTMLSpanElement
          span.addEventListener('mousedown', event => event.stopPropagation());
          span.addEventListener('mouseup', event => console.log("OKKK"));
          return span
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
          active: "#FF597B",
          default: "#97DECE"
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
    const sign = "zoterostyle-registerSwitchColumnsViewUI"
    if (ZoteroPane.itemsView[sign]) { return }
    ztoolkit.patch(
      ZoteroPane.itemsView,
      "_displayColumnPickerMenu",
      sign,
      (original) =>
        function () {
          original.apply(ZoteroPane.itemsView, arguments);
          if (!Zotero.ZoteroStyle) { return }
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
          const menupopup = [...document.querySelectorAll("#zotero-column-picker")].slice(-1)[0]
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
    ZoteroPane.itemsView[sign] = true
  }

  /**
   * 右键一列弹出列设置窗口
   * @param colKey 
   * @param args 
   */
  public patchSetting(
    colKey: string,
    args: { prefKey: string, name: string, type: string, range?: number[], values?: string[]}[],
    width: number = 233
  ) {
    const sign = `zoterostyle-setting-${colKey}`
    if (ZoteroPane.itemsView[sign]) { return }
    ztoolkit.patch(
      ZoteroPane.itemsView,
      "_displayColumnPickerMenu",
      sign,
      (original) =>
        function () {
          // @ts-ignore
          original.apply(ZoteroPane.itemsView, arguments);
          if (!Zotero.ZoteroStyle) { return }
          const menupopup = [...document.querySelectorAll("#zotero-column-picker")].slice(-1)[0]
          let left = menupopup.getBoundingClientRect().left
          let rect
          try {
            rect = document.querySelector(`.${colKey}-item-tree-main-default`)!.getBoundingClientRect()
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
              console.log(`${config.addonRef}.${arg.prefKey}`, prefValue )
              let id = arg.prefKey.replace(/\./g, "-")
              let vbox = element.querySelector("#control") as XUL.Box
              const width = "90%"
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
                          type: "keyup",
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
            }, width, (args.length + 2.5) * eachHeight
            )
          }
        }
    )
    ZoteroPane.itemsView[sign] = true
  }

  /**
   * 关系图谱
   * d3
   * 很卡，文字容易和节点重合
   */
  // public async _createForceGraph() {
  //   ztoolkit.log("createForceGraph")
  //   document.querySelectorAll("#viz").forEach(e => e.remove());
  //   document.querySelectorAll(".resizer").forEach(e => e.remove())
  //   while (!document.querySelector("#item-tree-main-default")) {
  //     await Zotero.Promise.delay(100)
  //   } 
  //   const mainNode = document.querySelector("#item-tree-main-default")!
  //   const resizer = ztoolkit.UI.createElement(document, "div", {
  //     classList: ["resizer"],
  //     styles: {
  //       width: "100%",
  //       height: "2px",
  //       backgroundColor: "#cecece",
  //       cursor: "ns-resize"
  //     }
  //   })
  //   // 图形容器
  //   const container = ztoolkit.UI.createElement(document, "div", {
  //     namespace: "html",
  //     id: "viz",
  //     styles: {
  //       width: "100%",
  //       height: "300px",
  //     },
  //     children: [
  //       {
  //         namespace: "svg",
  //         tag: "svg",
  //         id: "graph",
  //         styles: {
  //           width: "100%",
  //           height: "100%"
  //         }
  //       }
  //     ]
  //   }) as HTMLDivElement
  //   mainNode.append(resizer, container)
  //   // 可调
  //   let y = 0;
  //   let bottomHeight = 0;
  //   const mouseDownHandler = function (e) {
  //     // Get the current mouse position
  //     y = e.clientY;
  //     bottomHeight = container.getBoundingClientRect().height;

  //     document.addEventListener('mousemove', mouseMoveHandler);
  //     document.addEventListener('mouseup', mouseUpHandler);
  //   };
  //   const mouseMoveHandler = function (e) {
  //     const dy = e.clientY - y;
  //     container.style.height = `${bottomHeight - dy}px`;
  //   };
  //   const mouseUpHandler = function () {
  //     document.removeEventListener('mousemove', mouseMoveHandler);
  //     document.removeEventListener('mouseup', mouseUpHandler);
  //   };
  //   // Attach the handler
  //   resizer.addEventListener('mousedown', mouseDownHandler);

  //   const d3 = require('./d3');
  //   const Math = require("math")
  //   interface Graph { nodes: any[], links: any[] }
    
  //   const key = ZoteroPane.getSelectedCollection()?.key
  //   container.querySelector("#graph g")?.remove()
  //   const items = ZoteroPane.getSortedItems()
  //   let graph: Graph = {
  //     nodes: [],
  //     links: []
  //   }
  //   items.forEach((item, id) => {
  //     if (!item.firstCreator) { return }
  //     graph.nodes.push({
  //       id,
  //       name: `${item.firstCreator}, ${item.getField("year")}`,
  //       item
  //     })
  //     const relatedKeys = item.relatedItems
  //     items
  //       .forEach((_item, _id) => {
  //         if (_id == id) { return }
  //         if (relatedKeys.indexOf(_item.key) != -1) {
  //           graph.links.push({
  //             source: id,
  //             target: _id
  //           })
  //         }
  //       })
  //   })
  //   var width = 1000;
  //   var height = 1000;
  //   var label: Graph = {
  //     nodes: [],
  //     links: []
  //   };

  //   graph.nodes.forEach(function (d, i) {
  //     label.nodes.push({ node: d });
  //     label.nodes.push({ node: d });
  //     label.links.push({
  //       source: i * 2,
  //       target: i * 2 + 1
  //     });
  //   });

  //   var labelLayout = d3.forceSimulation(label.nodes)
  //     .force("charge", d3.forceManyBody().strength(-50))
  //     .force("link", d3.forceLink(label.links).distance(0).strength(2));

  //   var graphLayout = d3.forceSimulation(graph.nodes)
  //     .force("charge", d3.forceManyBody().strength(-3000))
  //     .force("center", d3.forceCenter(width / 2, height / 2))
  //     .force("x", d3.forceX(width / 2).strength(1))
  //     .force("y", d3.forceY(height / 2).strength(1))
  //     .force("link", d3.forceLink(graph.links).id(d => d.id).distance(50).strength(1))
  //     .on("tick", ticked);

  //   var adjlist: any = [];

  //   graph.links.forEach(function (d) {
  //     adjlist[d.source.index + "-" + d.target.index] = true;
  //     adjlist[d.target.index + "-" + d.source.index] = true;
  //   });

  //   function neigh(a: any, b: any) {
  //     return a == b || adjlist[a + "-" + b];
  //   }


  //   var svg = d3.select("#viz svg#graph").attr("width", width).attr("height", height);
  //   var group = svg.append("g");

  //   let zoom = d3.zoom()
  //     .scaleExtent([0.25, 10])
  //     .on('zoom', handleZoom);
  //   svg.call(zoom);
  //   function handleZoom() {
  //     let t = 233
  //     const oriTr = group.attr("transform")
  //     if (!oriTr || !oriTr.includes("scale") ||
  //       parseFloat(
  //         oriTr.match(/scale\(([\.\d]+),/)[1]
  //       ).toFixed(3) == d3.event.transform.k.toFixed(3)
  //     ) {
  //       t = 0
  //     }
  //     group
  //       .transition()
  //       .duration(t)
  //       .attr("transform", d3.event.transform)
  //   }
  //   const color = {
  //     node: {
  //       default: "#5a5a5a",
  //       active: "#7b6cd0"
  //     },
  //     link: {
  //       default: "#aaa",
  //       active: "#7b6cd0"
  //     }
  //   }

  //   var link = group.append("g")
  //     .attr("class", "links")
  //     .selectAll("line")
  //     .data(graph.links)
  //     .enter()
  //     .append("line")
  //     .attr("stroke", color.link.default)
  //     .attr("stroke-width", "1px")
  //     .attr("opacity", 1)
    
  //   var node = group.append("g")
  //     .attr("class", "nodes")
  //     .selectAll("g")
  //     .data(graph.nodes)
  //     .enter()
  //     .append("circle")
  //     .attr("r", 8)
  //     .attr("fill", color.node.default)
  //     .attr("opacity", 1)
  //     .attr("cursor", "pointer")

  //   node.call(
  //     d3.drag()
  //       .on("start", dragstarted)
  //       .on("drag", dragged)
  //       .on("end", dragended)
  //   );

  //   var labelNode = group.append("g")
  //     .attr("class", "labelNodes")
  //     .selectAll("text")
  //     .data(label.nodes)
  //     .enter()
  //     .append("text")
  //     .text(function (d, i) {
  //       return i % 2 == 0 ? "" : d.node.name;
  //     })
  //     .style("fill", "#555")
  //     .style("font-family", "Arial")
  //     .style("font-size", 12)
  //     .style("pointer-events", "none");

  //   // 事件
  //   const t = 300
  //   node
  //     .on("mouseover", () => {
  //       var index = d3.select(d3.event.target).datum().index;
  //       labelNode
  //         .transition()
  //         .duration(t)
  //         .style(
  //           "opacity", function (o: any) {
  //             return neigh(index, o.node.index) ? 1 : 0.4;
  //           })
  //       node
  //         .transition()
  //         .duration(t)
  //         .style(
  //           "opacity", function (o: any) {
  //             return neigh(index, o.index) ? 1 : 0.4;
  //           })
  //         .style("fill", function (o: any) {
  //           return index == o.index ? color.node.active : color.node.default;
  //         })
  //       link
  //         .transition()
  //         .duration(t)
  //         .style(
  //           "opacity", function (o: any) {
  //             return o.source.index == index || o.target.index == index ? 1 : 0.4;
  //           })
  //         .style("stroke", function (o: any) {
  //           return o.source.index == index || o.target.index == index ? color.link.active : color.link.default;
  //         })
  //     })
  //     .on("mouseout", () => {
  //       labelNode
  //         .transition()
  //         .duration(t)
  //         .style("opacity", 1)
  //       node
  //         .transition()
  //         .duration(t)
  //         .style("opacity", 1)
  //         .style("fill", color.node.default)
  //       link
  //         .transition()
  //         .duration(t)
  //         .style("opacity", 1)
  //         .style("stroke", color.link.default)
  //     })
  //     .on("click", async (node: any) => {
  //       await ZoteroPane.selectItem(node.item.getID())
  //     })

  //   function ticked() {

  //     node.call(updateNode);
  //     link.call(updateLink);

  //     labelLayout.alphaTarget(0.3).restart();
  //     labelNode.each(function (d, i) {
  //       if (i % 2 == 0) {
  //         d.x = d.node.x;
  //         d.y = d.node.y;
  //       } else {
  //         // this.style("diaplay", "block")
  //         //   .style("opacity", 1)
  //         var b
  //         try {
  //           b = this.getBBox();
  //         } catch {return}
  //         var diffX = d.x - d.node.x;
  //         var diffY = d.y - d.node.y;

  //         var dist = Math.sqrt(diffX * diffX + diffY * diffY);

  //         var shiftX = b.width * (diffX - dist) / (dist * 2);
  //         shiftX = Math.max(-b.width, Math.min(0, shiftX));
  //         var shiftY = 16;
  //         this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
  //       }
  //     });
  //     labelNode.call(updateNode);

  //   }

  //   function fixna(x) {
  //     if (isFinite(x)) return x;
  //     return 0;
  //   }
    

  //   function updateLink(link: any) {
  //     link
  //       .attr("x1", function (d) { return fixna(d.source.x); })
  //       .attr("y1", function (d) { return fixna(d.source.y); })
  //       .attr("x2", function (d) { return fixna(d.target.x); })
  //       .attr("y2", function (d) { return fixna(d.target.y); });
  //   }

  //   function updateNode(node: any) {
  //     node.attr("transform", function (d) {
  //       return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
  //     });
  //   }

  //   function dragstarted(d) {
  //     d3.event.sourceEvent.stopPropagation();
  //     if (!d3.event.active) {
  //       graphLayout.alphaTarget(0.3).restart();
  //     }
  //     d.fx = d.x;
  //     d.fy = d.y;
  //   }

  //   function dragged(d) {
  //     d.fx = d3.event.x;
  //     d.fy = d3.event.y;
  //   }

  //   function dragended(d) {
  //     if (!d3.event.active) graphLayout.alphaTarget(0);
  //     d.fx = null;
  //     d.fy = null;
  //   }

  //   const id = window.setInterval(async () => {
  //     if (ZoteroPane.getSelectedCollection()?.key == key) { return }
  //     window.clearInterval(id)
  //     return await this.createForceGraph()
  //   }, 1000)

  // }

  /**
   * 关系图谱
   * Obsidian
   */
  public async createForceGraph() {
    while (!document.querySelector("#item-tree-main-default")) {
      await Zotero.Promise.delay(100)
    }
    const mainNode = document.querySelector("#item-tree-main-default")!
    const enable = Zotero.Prefs.get(`${config.addonRef}.graphView.enable`)
    const resizer = ztoolkit.UI.createElement(document, "div", {
      id: "graph-view-resizer",
      styles: {
        width: "100%",
        height: "0px",
        cursor: "ns-resize",
      }
    })
    // 图形容器
    const container = ztoolkit.UI.createElement(document, "div", {
      namespace: "html",
      id: "graph-view",
      styles: {
        width: "100%",
        height: "0px",
        position: "relative",
      }
    }) as HTMLDivElement
    const frame = ztoolkit.UI.createElement(document, "iframe", "html") as HTMLIFrameElement
    frame.style.border = "none"
    frame.style.height = "100%"
    frame.style.width = "100%"
    frame.style.opacity = "0"
    frame.style.transition = "opacity 1 linear"
    container.appendChild(frame)
    mainNode.append(resizer, container)

    frame.setAttribute("src", "https://help.obsidian.md/Plugins/Core+plugins")
    // 可调
    let y = 0;
    let h = 0;
    const mouseDownHandler = function (e: any) {
      frame.style.display = "none"

      // Get the current mouse position
      y = e.clientY;
      h = container.getBoundingClientRect().height;

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };
    const mouseMoveHandler = function (e: any) {
      const dy = e.clientY - y;
      const height = `${h - dy}px`;
      container.style.height = height;
      Zotero.Prefs.set(`${config.addonRef}.graphView.height`, height)
    };
    const mouseUpHandler = function () {
      frame.style.display = ""

      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    resizer.addEventListener('mousedown', mouseDownHandler);

    let getItemGraphID = (item: _ZoteroItem) => {
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
    let getGraph = (items: _ZoteroItem[]) => {
      let nodes: { [key: string]: any } = {}
      let graph: { [key: string]: any } = { nodes }
      items.forEach((item, i) => {
        let id = getItemGraphID(item)
        nodes[id] = { links: {}, type: item.id }
        const relatedKeys = item.relatedItems
        items
          .forEach((_item, _i) => {
            if (_i == i) { return }
            if (relatedKeys.indexOf(_item.key) != -1) {
              let _id = getItemGraphID(_item)
              nodes[id].links[_id] = true
            }
          })
      })
      return graph
    }
    while (true) {
      if (!frame.contentDocument!.querySelector(".graph-view-container")) {
        await Zotero.Promise.delay(100)
        continue
      }
      const doc = frame.contentDocument!
      
      let script = ztoolkit.UI.createElement(document, "script", {
        namespace: "html",
        properties: {
          innerHTML: `
            app.graph.onExpand()
            app.graph.onNavigated = () => {}
            window.addEventListener('message', function (event) {
              switch (typeof event.data) {
                case "string":
                  let id = event.data
                  canvas = document.querySelector("canvas")
                  node = app.graph.renderer.nodes.find(e=>e.id==id)
                  f = window.devicePixelRatio
                  scale = 3
                  let X = (f * canvas.width/2 - node.x*scale), Y = (f * canvas.height/2 - node.y*scale)
                  app.graph.renderer.zoomTo(scale/2);
                  app.graph.renderer.setPan(X, Y);
                  app.graph.renderer.setScale(scale);
                  app.graph.renderer.changed()
                  break
                case "object":
                  let graph = event.data
                  if (!(app && app.graph && app.graph.renderer)) { return }
                  app.graph.renderer.setData(graph)
                  app.graph.renderer.onNodeClick = (e, name, key) => {
                    console.log(name, key)
                    window.postMessage(key, "*")
                  }
                  break
                default:
                  break
              }      
            });
          `
        }
      })
      
      doc.querySelector("head")?.appendChild(script)
      doc.querySelector(".graph-view-container.mod-expanded")!.style = `
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        border: none;
        padding: 0 !important;
      `
      window.addEventListener("message", (event) => {
        let key = event.data
        ZoteroPane.selectItem(key)
      })
      frame.contentWindow!.addEventListener("message", (event) => {
        console.log(event.data)
        let key = event.data
        if (typeof key == "number") {
          ZoteroPane.selectItem(key)
        }
      })
      break
    }
    let itemKeys: string[] = []
    const themeColor = {
      light: {
        backgroundColor: "#ffffff",
        resizerColor: "#cccccc"
      },
      dark: {
        backgroundColor: "#2e3441",
        resizerColor: "#3b4252"
      }
    }
    let theme = ""
    window.setInterval(async () => {
      if (!Zotero.Prefs.get(`${config.addonRef}.graphView.enable`)) {
        resizer.style.height = "0px";
        container.style.height = "0";
        return
      }
      resizer.style.height = "1px";
      if (container.style.height == "0px") {
        container.style.height = Zotero.Prefs.get(`${config.addonRef}.graphView.height`) as string || "50%";
      }
      // 主题
      if (document.querySelector("#main-window[theme=dark]")) {
        if (theme != "dark") {
          container.style.backgroundColor = themeColor.dark.backgroundColor;
          resizer.style.backgroundColor = themeColor.dark.resizerColor;
          (frame.contentWindow as any).eval(`
          app.graph.renderer.containerEl.style.backgroundColor = "";
          app.graph.renderer.containerEl.style.backgroundColor = "${themeColor.dark.backgroundColor}";
            app.themeInEffect == "light" && document.querySelector(".checkbox-container").click();
            app.graph.renderer.colors.line.rgb = 10066329;
          `)
          theme = "dark"
        }
      } else {       
        if (theme != "light") {
          container.style.backgroundColor = themeColor.light.backgroundColor;
          resizer.style.backgroundColor = themeColor.light.resizerColor;
          (frame.contentWindow as any).eval(`
            app.graph.renderer.containerEl.style.backgroundColor = "${themeColor.light.backgroundColor}";
            app.themeInEffect == "dark" && document.querySelector(".checkbox-container").click();
          `)
          theme = "light"
        }
      }
      const items = ZoteroPane.getSortedItems()
      let _itemKeys = items.map(i => i.key)
      if (
        itemKeys.length == itemKeys.length &&
        JSON.stringify(itemKeys.sort()) == JSON.stringify(_itemKeys.sort())
      ) { return }
      itemKeys = _itemKeys
      for (let i = 0; i < 3; i++) {
        frame.contentWindow!.postMessage(getGraph(items), "*")
        await Zotero.Promise.delay(1000)
      }
      container.querySelector("#loading")?.remove()
      frame.style.opacity = "1"
    }, 10)

    let isFocus = true
    mainNode.addEventListener("blur", () => {
      isFocus = false
    })
    mainNode.addEventListener("focus", () => {
      isFocus = true
    })
    document.addEventListener("keyup", (event: any) => {
      if (Zotero_Tabs.selectedIndex == 0 && event.key == "Control" && isFocus) {	
        let items = ZoteroPane.getSelectedItems()
        if (!(items && items.length == 1)) { return }
        let item = items[0]
        let id = getItemGraphID(item)
        frame.contentWindow!.postMessage(id, frame.contentWindow!.origin)
      }
    })
  }

  /**
   * 注册Prompt命令
   */
  public async registerCommands() {
    // Prompt
    // 旧版数据迁移
    let getItem = () => {
      let readingItem = Zotero.Items.get(
        Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)?.itemID
      ).parentItem
      let selectedItems = ZoteroPane.getSelectedItems()
      if (!(readingItem || (selectedItems.length == 1))) { return }
      let item = readingItem || selectedItems[0]
      return item
    }
    let getAllTags = (item: _ZoteroItem) => {
      let coloredTags = item.getColoredTags()
      let tags = item.getTags().filter((tag: any) => coloredTags.map((tag: any) => tag.tag).indexOf(tag.tag) == -1)
      return [...coloredTags, ...tags]
    }
    ztoolkit.Prompt.register([
      {
        name: "关系图谱",
        label: "Style",
        callback: async () => {
          const key = `${config.addonRef}.graphView.enable`
          if (Zotero.Prefs.get(key)) {
            Zotero.Prefs.set(key, false)
          } else {
            Zotero.Prefs.set(key, true)
          }
        }
      },
      {
        name: "迁移旧版数据",
        label: "Style",
        when: () => {
          let items = ZoteroPane.getSelectedItems()
          return items.length == 1 && items[0].getField("title") == "ZoteroStyle"
        },
        callback: async (prompt) => {
          // 迁移数据逻辑
          const tipNode = prompt.showTip("感谢您长时间对Style的支持，数据正在迁移中，请耐心等待！")
          tipNode.style.position = "relative"
          let progress = ztoolkit.UI.createElement(
            document,
            "span",
            {
              styles: {
                position: "absolute",
                height: "100%",
                left: "0",
                top: "0",
                backgroundColor: "#FF8E9E",
                zIndex: "-1",
                opacity: "0.5",
                transition: "width .1 linear"
              }
            }
          )
          tipNode.appendChild(progress)

          progress.style.width = "0%"
          // 迁移逻辑
          let ids = ZoteroPane.getSelectedItems()[0].getNotes()
          let totalTime = 0
          for (let i = 0; i < ids.length; i++) {
            let noteItem = Zotero.Items.get(ids[i])
            try {
              let data = JSON.parse((noteItem.note.replace(/<.+?>/g, "").replace(/[^\n\{]+/, "")))
              // 没有itemKey，搜索本地
              if (!data.itemKey) {
                let s = new Zotero.Search();
                s.addCondition("title", "contains", data.title);
                data.itemKey = Zotero.Items.get((await s.search())[0]).key
                ztoolkit.log(data.itemKey)
              }
              totalTime += (Object.values(data.pageTime) as Array<number>).reduce((a, b) => a + b)
              let record = {
                page: data.pageNum,
                data: data.pageTime,
              }
              // 写入笔记逻辑
              if (data.itemKey) {
                this.addonItem.set(
                  Zotero.Items.getByLibraryAndKey(1, data.itemKey),
                  "readingTime",
                  record
                )
              }
            } catch { }
            progress.style.width = `${i / ids.length * 100}%`
            prompt.inputNode.value = `[Pending] ${i}/${ids.length}`
            await Zotero.Promise.delay(10)
          }
          prompt.inputNode.value = ""
          // @ts-ignore
          prompt.exit()
          prompt.showTip(
            `数据迁移完成!\n\n` +
            `从安装Style开始，它与您共同阅读了${ids.length}篇文献，总用时${(totalTime / 60 / 60).toFixed(2)}小时。\n\n` +
            `你走过的路，每一步都算数。`
          )
        }
      },
      {
        name: "影响因子",
        label: "Style",
        when: () => {
          let item = getItem()
          return (item && item.getField("publicationTitle")) as boolean
        },
        callback: async (prompt: Prompt) => {
          let hrefs = [
            "https://www.ablesci.com/assets/css/global_local.css?v=20221123v1",
            "https://www.ablesci.com/assets/layui/css/layui.css"
          ]
          let styles: HTMLElement[] = []
          hrefs.forEach(href => {
            if (document.querySelector(`[href="${href}"]`)) { return }
            const style = ztoolkit.UI.createElement(
              document, "link",
              {
                properties: {
                  type: "text/css",
                  rel: "stylesheet",
                  href: href,
                },
              }
            );
            styles.push(style)
            document.documentElement.appendChild(style);
          })

          let item = getItem() as _ZoteroItem
          const publicationTitle = item.getField("publicationTitle")
          console.log(publicationTitle)
          let res = await Zotero.HTTP.request(
            "GET",
            `https://www.ablesci.com/journal/index?keywords=${publicationTitle.replace(/\s+/g, "+")}`,
            {
              responseType: "text",
              credentials: "include"
            }
          )
          let text = res.response
          let matchedArray = text.match(/<table[\s\S]+?<\/table>/g)
          if (matchedArray) {
            prompt.inputNode.setAttribute("placeholder", publicationTitle)
            const tableString = matchedArray[0].replace("36%", "20%")
            const parser = new window.DOMParser()
            const table = parser.parseFromString(`<div class="command">${tableString}</div>`, "text/html")
            const container = prompt.createCommandsContainer()
            container.appendChild(table.body.firstChild!)
          }
          // @ts-ignore
          prompt.promptNode.addEventListener("keyup", (event) => {
            if (event.key == "Escape") {
              styles.forEach(e => e.remove())
            }
          })
        }
      },
      {
        name: "标签",
        label: "Style",
        when: () => {
          let item = getItem() as _ZoteroItem
          if (item) {
            if (getAllTags(item).length > 0) {
              return true
            }
          }
          return false
        },
        callback: (prompt: Prompt) => {
          const libraryID = 1
          // 重命名标签
          // Zotero.Tags.rename(libraryID, oldName, newName);
          // 指派颜色位置
          // Zotero.Tags.setColor()

          const container = prompt.createCommandsContainer()
          const tags = getAllTags(getItem() as _ZoteroItem)
          const inputStyles = {
            height: "2em",
            border: "1px solid #eee",
            borderRadius: ".1em",
            padding: "0 0.5em"
          }
          tags.forEach((tag: { tag: string, color?: string }) => {
            let position = Zotero.Tags.getColor(libraryID, tag.tag)?.position
            position = position == undefined ? undefined : position + 1
            let set = (line: HTMLElement) => {
              const name = (line.querySelector("#name") as HTMLInputElement).value
              const color = (line.querySelector("#color") as HTMLInputElement).value
              const position = (line.querySelector("#position") as HTMLInputElement).value
              if (/^#(\w{3}|\w{6})$/i.test(color) && /^\d+$/.test(position) && name.length)
                Zotero.Tags.setColor(libraryID, name, color, position)
            }
            const line = ztoolkit.UI.createElement(
              document,
              "div",
              {
                classList: ["command"],
                styles: {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                  alignItems: "center",
                  width: "100%",
                },
                children: [
                  {
                    tag: "span",
                    id: "circle",
                    styles: {
                      display: "inline-block",
                      height: ".7em",
                      width: ".7em",
                      borderRadius: tag.tag.startsWith("#") ? ".1em" : ".7em",
                      backgroundColor: tag.color as string,
                    }
                  },
                  {
                    tag: "div",
                    children: [
                      {
                        tag: "input",
                        id: "name",
                        styles: inputStyles,
                        properties: {
                          value: tag.tag,
                          placeholder: "Name"
                        },
                        listeners: [
                          {
                            type: "change",
                            listener: () => {
                              Zotero.Tags.rename(libraryID, tag.tag,
                                (line.querySelector("#name") as HTMLInputElement).value as string
                              );
                            }
                          }
                        ]
                      }
                    ]
                  },
                  {
                    tag: "div",
                    styles: {
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center"
                    },
                    children: [
                      {
                        tag: "input",
                        id: "color",
                        styles: inputStyles,
                        properties: {
                          value: tag.color || "",
                          placeholder: "Color"
                        },
                        listeners: [
                          {
                            type: "change",
                            listener: () => {
                              ztoolkit.log((line.querySelector("#circle")! as HTMLElement)
                                .style.backgroundColor);
                              (line.querySelector("#circle")! as HTMLElement)
                                .style.backgroundColor = (line.querySelector("#color")! as HTMLInputElement).value
                              ztoolkit.log((line.querySelector("#circle")! as HTMLElement)
                                .style.backgroundColor);
                              if (!/^\d+$/.test((line.querySelector("#position") as HTMLInputElement).value)) {
                                (line.querySelector("#position") as HTMLInputElement).value = "1"
                              }
                              set(line)
                            }
                          }
                        ]
                      }
                    ]
                  },
                  {
                    tag: "div",
                    children: [
                      {
                        tag: "input",
                        id: "position",
                        styles: inputStyles,
                        properties: {
                          value: position,
                          placeholder: "Position"
                        },
                        listeners: [
                          {
                            type: "change",
                            listener: () => {
                              set(line)
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            )
            container.appendChild(line)
          })
        }
      },
      {
        /**
         * 实现标注颜色组，可以新创建新组，组内可以新建新的标注颜色
         */
        name: "标注",
        label: "Style",
        callback: (prompt: Prompt) => {
          const container = prompt.createCommandsContainer()
          type Name = string;
          type Color = string;
          type Annotation = [Name, Color];
          type Group = [string, Annotation[]];

          // 从prefs初始化
          // [标注组名称，[[颜色名称, 颜色], [颜色名称, 颜色]]]
          let groups: Group[]= JSON.parse(Zotero.Prefs.get(`${config.addonRef}.annotationColorsGroups`) as string)
          // [[颜色名称, 颜色], [颜色名称, 颜色]]
          // let defaultAnno: Annotation[] = JSON.parse(Zotero.Prefs.get(`${config.addonRef}.annotationColors`) as string)
          let defaultAnno: Annotation[] = [
            ['general.yellow', '#ffd400'],
            ['general.red', '#ff6666'],
            ['general.green', '#5fb236'],
            ['general.blue', '#2ea8e5'],
            ['general.purple', '#a28ae5'],
            ['general.magenta', '#e56eee'],
            ['general.orange', '#f19837'],
            ['general.gray', '#aaaaaa']
          ];

          const svg = `<svg t="1675648090111" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2675" width="20" height="20" style="height: 100%;"><path d="M863.328262 481.340895l-317.344013 0.099772L545.984249 162.816826c0-17.664722-14.336138-32.00086-32.00086-32.00086s-31.99914 14.336138-31.99914 32.00086l0 318.400215-322.368714-0.17718c-0.032684 0-0.063647 0-0.096331 0-17.632039 0-31.935493 14.239806-32.00086 31.904529-0.096331 17.664722 14.208843 32.031824 31.871845 32.095471l322.59234 0.17718 0 319.167424c0 17.695686 14.336138 32.00086 31.99914 32.00086s32.00086-14.303454 32.00086-32.00086L545.982529 545.440667l317.087703-0.099772c0.063647 0 0.096331 0 0.127295 0 17.632039 0 31.935493-14.239806 32.00086-31.904529S880.960301 481.404542 863.328262 481.340895z" fill="#575B66" p-id="2676"></path></svg>`
          console.log(groups, defaultAnno)
          const inputStyles = {
            height: "22.4px",
            border: "1px solid #eee",
            borderRadius: ".1em",
            padding: "0 0.5em"
          }
          let copy = (obj: any) => {
            return JSON.parse(JSON.stringify(obj))
          }
          let saveGroups = (groups: Group[]) => {
            Zotero.Prefs.set(`${config.addonRef}.annotationColorsGroups`, JSON.stringify(groups))
          }
          let saveAnnotations = (anno: Annotation[]) => {
            Zotero.Prefs.set(`${config.addonRef}.annotationColors`, JSON.stringify(anno))
            window.setTimeout(async () => {
              const reader = await ztoolkit.Reader.getReader()
              reader && this.modifyAnnotationColors(reader)
            })
          }
          /**
           * 将colorsGroup渲染到groupContainer
           * @param colorsGroup 
           */
          let timer: Number | undefined
          let updateGroups = () => {
            saveGroups(groups)
            container.querySelectorAll(".command").forEach(e => e.remove())
            // 已创建的标注颜色
            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
              const group = groups[groupIndex]
              container.appendChild(ztoolkit.UI.createElement(document, "div", {
                classList: ["command"],
                styles: {
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                },
                listeners: [
                  {
                    type: "mousemove",
                    listener: function () {
                      // @ts-ignore
                      prompt.selectItem(this);
                    },
                  },
                ],
                children: [
                  {
                    tag: "span",
                    id: "group-name",
                    properties: {
                      innerText: group[0],
                    },
                    listeners: [
                      {
                        type: "click",
                        listener: function (event) {
                          event.stopPropagation()
                          event.preventDefault()
                          // 单击名称变为可输入状态更改名称
                          // @ts-ignore
                          const spanNode = this as HTMLSpanElement;
                          const inputNode = spanNode.nextSibling as HTMLInputElement;
                          spanNode.style.display = "none"
                          inputNode.style.display = ""
                        }
                      }
                    ],
                    styles: {
                      borderRadius: "5px",
                      backgroundColor: JSON.stringify(group[1]) == Zotero.Prefs.get(`${config.addonRef}.annotationColors`)
                        ? "rgba(244, 132, 132, 0.3)" : "none",
                      padding: "0 .5em",
                      fontSize: ".9em"
                    }
                  },
                  {
                    tag: "input",
                    listeners: [
                      {
                        type: "keyup",
                        listener: function () {
                          // @ts-ignore
                          const inputNode = this as HTMLInputElement;
                          group[0] = inputNode.value;
                          save()
                        }
                      },
                      {
                        type: "blur",
                        listener: function () {
                          // @ts-ignore
                          const inputNode = this as HTMLInputElement;
                          group[0] = inputNode.value;
                          const spanNode = inputNode.previousSibling as HTMLSpanElement;
                          spanNode.style.display = ""
                          spanNode.innerText = inputNode.value
                          inputNode.style.display = "none"
                          save()
                        }
                      }
                    ],
                    styles: {
                      display: "none",
                      width: "20%",
                      ...inputStyles,
                    },
                    attributes: {
                      value: group[0],
                      placeholder: "Name"
                    },
                  },
                  {
                    tag: "div",
                    listeners: [
                      {
                        type: "mousedown",
                        listener: async (event: any) => {
                          if (event.button == 0) {
                            // 长按进入编辑，短按使用
                            timer = window.setTimeout(() => {
                              timer = undefined
                              editAnnotations(group)
                            }, 1000)
                          } else if (event.button == 2) {
                            // 单击右键删除
                            groups.splice(groupIndex, 1)
                            updateGroups()
                          }
                        },
                      },
                      {
                        type: "mouseup",
                        listener: async (event: any) => {
                          if (event.button == 0) {
                            if (timer) {
                              // 长按事件未达到，执行选中
                              window.clearTimeout(timer as number)
                              saveAnnotations(group[1])
                              
                              updateGroups()
                            }
                          }
                        },
                      }
                    ],
                    styles: {
                      display: "flex",
                      flexDirection: "row",
                      aliginItems: "center",
                      justifyContent: "space-around",
                      width: "80%",
                    },
                    children: (() => {
                      let children: any[] = []
                      for (let anno of group[1]) {
                        children.push({
                        tag: "span",
                        id: "circle",
                        attributes: {
                          title: anno[0]
                        },
                        styles: {
                          display: "inline-block",
                          height: ".7em",
                          width: ".7em",
                          borderRadius: ".1em",
                          backgroundColor: anno[1],
                          margin: "0 auto"
                        }
                      })
                      }
                      return children
                    })()
                  }
                ]
              }))
            }
            // 新增按钮
            container.appendChild(ztoolkit.UI.createElement(document, "div", {
              classList: ["command"],
              styles: {
                color: "rgba(0, 0, 0, 0.4)"
              },
              listeners: [
                {
                  type: "mousemove",
                  listener: function () {
                    // @ts-ignore
                    prompt.selectItem(this);
                  },
                },
                {
                  type: "click",
                  listener: async () => {
                    // 新建标注颜色
                    groups.push(["Untitled", copy(defaultAnno)])
                    updateGroups()
                    let node = [...container.querySelectorAll(".command")].slice(-2)[0];
                    (node.querySelector("#group-name") as HTMLSpanElement).click()
                  },
                },
              ],
              children: [
                {
                  tag: "div",
                  styles: {
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    textAlign: "center"
                  },
                  properties: {
                    innerHTML: svg,
                  }
                }
              ]
            }))
          }
          updateGroups()

          /**
           * 编辑长按选中的标注颜色
           * 可以删除，但最少要保留两个颜色，只剩下两个颜色删除是无效的
           * @param annotationColors 
           */
          let editAnnotations = (group: Group) => {
            let annotations: Annotation[] = group[1]
            const container = prompt.createCommandsContainer()
            const isUsed = JSON.stringify(annotations) == Zotero.Prefs.get(`${config.addonRef}.annotationColors`)
            console.log(isUsed)
            /**
             * 根据anno创建ele
             * @param anno [标注名称, 标注颜色]
             * @param index 用于删除
             * @returns 
             */
            let create = (anno: string[], index: number) => {
              const ele = ztoolkit.UI.createElement(
                document,
                "div",
                {
                  classList: ["command"],
                  listeners: [
                    {
                      type: "mousemove",
                      listener: function () {
                        // @ts-ignore
                        prompt.selectItem(this);
                      },
                    },
                    {
                      type: "mouseup",
                      listener: async (event: any) => {
                        if (event.button == 2) {
                          // 单击右键删除
                          if (annotations.length > 2) {
                            annotations.splice(index, 1)
                            ele.remove()
                            isUsed && saveAnnotations(annotations)
                            updateGroups()
                          }
                        }
                      },
                    }
                  ],
                  styles: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                    width: "100%",
                  },
                  children: [
                    {
                      tag: "span",
                      id: "circle",
                      styles: {
                        display: "inline-block",
                        height: ".7em",
                        width: ".7em",
                        borderRadius: ".1em",
                        backgroundColor: anno[1] as string,
                      }
                    },
                    {
                      tag: "div",
                      children: [
                        {
                          tag: "input",
                          id: "name",
                          styles: inputStyles,
                          properties: {
                            value: anno[0],
                            placeholder: "Name"
                          },
                          listeners: [
                            {
                              type: "change",
                              listener: () => {
                                let name = anno[0] = (ele.querySelector("#name") as HTMLInputElement).value
                                isUsed && saveAnnotations(annotations)
                                updateGroups()
                                console.log(name)
                              }
                            }
                          ]
                        }
                      ]
                    },
                    {
                      tag: "div",
                      styles: {
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center"
                      },
                      children: [
                        {
                          tag: "input",
                          id: "color",
                          styles: inputStyles,
                          properties: {
                            value: anno[1],
                            placeholder: "Color"
                          },
                          listeners: [
                            {
                              type: "change",
                              listener: () => {
                                let color = anno[1] = (ele.querySelector("#color") as HTMLInputElement).value
                                console.log(color)
                                isUsed && saveAnnotations(annotations)
                                ele.querySelector("#circle")!.style.backgroundColor = color
                                updateGroups()
                              }
                            }
                          ]
                        }
                      ]
                    },
                  ]
                }
              )
              return ele
            }
            annotations.forEach((anno, index) => {
              container.appendChild(create(anno, index))
            })
            // 增加一个创建按钮
            const ele = ztoolkit.UI.createElement(document, "div", {
              classList: ["command"],
              styles: {
                color: "rgba(0, 0, 0, 0.4)"
              },
              listeners: [
                {
                  type: "mousemove",
                  listener: function () {
                    // @ts-ignore
                    prompt.selectItem(this);
                  },
                },
                {
                  type: "click",
                  listener: async () => {
                    const anno: Annotation = copy(defaultAnno[0]);
                    annotations.push(anno)
                    container.insertBefore(create(anno, annotations.length), ele)
                    isUsed && saveAnnotations(annotations)
                    updateGroups()
                  },
                },
              ],
              children: [
                {
                  tag: "div",
                  styles: {
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    textAlign: "center"
                  },
                  properties: {
                    innerHTML: svg,
                  }
                }
              ]
            })
            container.appendChild(ele)
          } 

        }
      },
      {
        name: "查看阅读进度",
        label: "Style",
        when: () => {
          // 有条目，且条目有阅读时间
          let item = getItem()
          if (!item) { return false }
          let record = this.addonItem.get(item, "readingTime")
          ztoolkit.log(record)
          return record?.data && Object.keys(record.data).length > 0
        },
        callback: (prompt: Prompt) => {
          let item = getItem() as _ZoteroItem

          prompt.inputNode.placeholder = item.getField("title")
          const record = this.addonItem.get(item, "readingTime")
          if (!record || !record.data || Object.keys(record.data).length == 0) {
            prompt.showTip("这里一片荒芜~")
            return
          }
          let commands: Command[] = []
          Object.keys(record.data).forEach(page => {
            let sec = record.data[page]
            let t
            if (sec < 60) {
              t = `${sec} 秒`
            } else if (sec / 60) {
              t = `${(sec / 60).toFixed(1)} 分`
            } else {
              t = `${(sec / 60 / 60).toFixed(1)} 时`
            }
            let openToPage = async (page: number) => {
              let pdfItem = await item.getBestAttachment();
              if (!pdfItem) { return }
              await Zotero.OpenPDF.openToPage(pdfItem, page)
            }
            commands.push({
              name: `第${Number(page) + 1}页`,
              label: t,
              callback: async () => { await openToPage(Number(page) + 1) }
            })
          })
          prompt.showCommands(commands)
        }
      },
      {
        name: "重置阅读进度",
        label: "Style",
        when: () => {
          // 有条目，且条目有阅读时间
          let item = getItem()
          if (!item) { return false }
          let record = this.addonItem.get(item, "readingTime")
          return record?.data && Object.keys(record.data).length > 0
        },
        callback: (prompt) => {
          let item = getItem() as _ZoteroItem
          prompt.inputNode.placeholder = item.getField("title")
          try {
            let record = this.addonItem.get(item, "readingTime")
            record.data = {}
            this.addonItem.set(item, "readingTime", record)
          } catch { }
          prompt.showTip("重置成功")
        }
      },
      {
        name: "设置为插件储存条目",
        when: () => {
          let item = getItem()
          return item?.getField("title").includes("Addon") as boolean
        },
        callback: (prompt: Prompt) => {
          let item = getItem() as _ZoteroItem
          Zotero.Prefs.set(this.addonItem.prefKey, item.key)
          this.addonItem.item = item
          prompt.showTip(`设置成功，该条目下有${item.getNotes().length}条记录。`)
        }
      }
    ])
    // 所有快捷键
    let commands: Command[] = []
    let getLable = (keyOptions: any) => {
      let modifiers = keyOptions.modifiers && keyOptions.modifiers.replace("accel", Zotero.isMac ? "⌘" : "ctrl")
      return [...(modifiers?.split(",") || []), keyOptions.key]
        .filter(e => e)
        .map(s => s[0].toUpperCase() + s.slice(1)).join(" + ")
    }
    const en2zh = {
      key_close: "关闭Zotero",
      key_import: "导入",
      key_importFromClipboard: "从剪贴板导入",
      key_copyCitation: "复制引文",
      key_copyBibliography: "复制参考书目",
      key_advancedSearch: "高级搜索",
      key_back: "后退",
      key_forward: "前进",
      key_new_betternotes: "新建Better Notes",
      key_open_betternotes: "打开Better Notes",
      key_export_betternotes: "导出Better Notes",
      key_sync_betternotes: "同步Better Notes",
      key_undo: "撤销",
      key_redo: "重做",
      key_cut: "剪切",
      key_copy: "复制",
      key_paste: "粘贴",
      key_delete: "删除",
      key_selectAll: "全选",
      key_find: "查找",
      key_findAgain: "查找下一个",
      key_findPrevious: "查找上一个",
      key_pdf_preview: "开启/关闭PDF预览",
      "zoteropdftranslate-translateKey": "翻译标题"
    }
    for (let keyOptions of ztoolkit.Shortcut.getAll()) {
      if (keyOptions.type != "element") { continue }
      if (keyOptions.id in en2zh) {
        commands.push({
          // @ts-ignore
          name: en2zh[keyOptions.id] || keyOptions.id,
          label: getLable(keyOptions),
          callback: async () => {
            await keyOptions.callback()
          }
        })
      }
    }
    // ztoolkit.Prompt.register(commands)

    // 注册Prefs
    const branch = "extensions.zotero"
    const prefKeys = Services.prefs.getBranch(branch).getChildList("")
    commands = []
    for (let prefKey of prefKeys) {
      prefKey = branch + prefKey
      commands.push({
        name: prefKey,
        label: "Preference",
        callback: () => {

        }
      })
    }
    // ztoolkit.Prompt.register(commands)

    // 注册搜索文库
    ztoolkit.Prompt.register([{
      id: "search",
      callback: async (prompt: Prompt) => {
        // https://github.com/zotero/zotero/blob/7262465109c21919b56a7ab214f7c7a8e1e63909/chrome/content/zotero/integration/quickFormat.js#L589
        function getItemDescription(item: Zotero.Item) {
          var nodes = [];
          var str = "";
          var author, authorDate = "";
          if (item.firstCreator) { author = authorDate = item.firstCreator; }
          var date = item.getField("date", true, true);
          if (date && (date = date.substr(0, 4)) !== "0000") {
            authorDate += " (" + parseInt(date) + ")";
          }
          authorDate = authorDate.trim();
          if (authorDate) nodes.push(authorDate);

          var publicationTitle = item.getField("publicationTitle", false, true);
          if (publicationTitle) {
            nodes.push(`<i>${publicationTitle}</i>`);
          }
          var volumeIssue = item.getField("volume");
          var issue = item.getField("issue");
          if (issue) volumeIssue += "(" + issue + ")";
          if (volumeIssue) nodes.push(volumeIssue);

          var publisherPlace = [], field;
          if ((field = item.getField("publisher"))) publisherPlace.push(field);
          if ((field = item.getField("place"))) publisherPlace.push(field);
          if (publisherPlace.length) nodes.push(publisherPlace.join(": "));

          var pages = item.getField("pages");
          if (pages) nodes.push(pages);

          if (!nodes.length) {
            var url = item.getField("url");
            if (url) nodes.push(url);
          }

          // compile everything together
          for (var i = 0, n = nodes.length; i < n; i++) {
            var node = nodes[i];

            if (i != 0) str += ", ";

            if (typeof node === "object") {
              var label = document.createElement("label");
              label.setAttribute("value", str);
              label.setAttribute("crop", "end");
              str = "";
            } else {
              str += node;
            }
          }
          str.length && (str += ".")
          return str
        }
        prompt.showTip("Searching...")
        const text = prompt.inputNode.value;
        console.log("text", text)
        const s = new Zotero.Search();
        s.addCondition("quicksearch-titleCreatorYear", "contains", text)
        s.addCondition("itemType", "isNot", "attachment");
        let ids = await s.search();
        console.log(ids)
        // @ts-ignore
        prompt.exit()
        const container = prompt.createCommandsContainer();
        container.classList.add("suggestions")
        if (!ids.length) {
          // 尝试增改变条件
          const s = new Zotero.Search();
          const operators = ['is', 'isNot', 'true',  'false', 'isInTheLast', 'isBefore', 'isAfter', 'contains', 'doesNotContain', 'beginsWith']
          text.split(/\s*&&\s*/g).forEach(conditinString => {            
            let conditions = conditinString.split(/\s+/g)
            if (conditions.length == 3 && operators.indexOf(conditions[1]) != -1) {
              s.addCondition(...conditions)
            }
          })
          ids = await s.search();
        } 
        if (ids.length) {
          ids.forEach((id: number) => {
            const item = Zotero.Items.get(id)
            if (!item.isRegularItem()) { return }
            const title = item.getField("title")
            const ele = ztoolkit.UI.createElement(document, "div", {
              namespace: "html",
              classList: ["command"],
              listeners: [
                {
                  type: "mousemove",
                  listener: function () {
                    // @ts-ignore
                    prompt.selectItem(this)
                  }
                },
                {
                  type: "click",
                  listener: () => {
                    prompt.promptNode.style.display = "none"
                    Zotero_Tabs.select('zotero-pane');
                    ZoteroPane.selectItem(item.id);
                  }
                }
              ],
              styles: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
              },
              children: [
                {
                  tag: "span",
                  styles: {
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"

                  },
                  properties: {
                    innerText: title
                  }
                },
                {
                  tag: "span",
                  styles: {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  },
                  properties: {
                    innerHTML: getItemDescription(item)
                  }
                }
              ]
            })
            container.appendChild(ele)
          })
        } else {
          // @ts-ignore
          prompt.exit()
          prompt.showTip("Not Found.")
        }
      }
    }])
  }

  public modifyAnnotationColors(reader: _ZoteroReaderInstance) {
    // @ts-ignore
    let win = reader._iframeWindow.wrappedJSObject;
    var Zotero = ztoolkit.getGlobal("Zotero")
    if (!win.document.querySelector(`script#${config.addonRef}`)) {
      let script = ztoolkit.UI.createElement(win.document, "script", {
        namespace: "html",
        id: config.addonRef,
        properties: {
          innerHTML: `
            let map = window.map ? window.map : Array.prototype.map
            Array.prototype.map = function (func) {
              try {
                let annotationColors = this
                if (
                  annotationColors.length > 0 &&
                  annotationColors.every(e=>e.length==2 && e[1].startsWith("#"))
                ) {
                  annotationColors.length = window._annotationColors.length;
                  console.log(window._annotationColors, annotationColors);
                  for (let i = 0; i < window._annotationColors.length;i++) {
                    annotationColors[i] = [window._annotationColors[i][0], window._annotationColors[i][1].toLowerCase()]
                  }
                }
              } catch (e) {console.log(e)}
              return map.call(this, func);
            }
          `
        }
      })
      win.document.querySelector("head")?.appendChild(script)
    }
    const annotationColors = Zotero.Prefs.get(`${config.addonRef}.annotationColors`)
    win.eval(`window._annotationColors = ${annotationColors}`)
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
    `chrome,centerscreen,width=${width},height=${height},alwaysRaised=yes,resizable=yes`,
    io
  );
}

interface Record {
  page: number,
  data: {
    [key: string]: string | number
  }
}