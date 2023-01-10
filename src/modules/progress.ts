import { log } from "zotero-plugin-toolkit/dist/utils";
import { config } from "../../package.json";


/**
 * 进度条类，用于渲染各种进度条
 * 构造时需要输入数据，例如[1, 2, 3, 4, 3, 2, 1]
 * 再给一个要显示的box就可以了
 * 
 * 计划实现两种进度条：
 * 1. 阅读高能进度条形式
 * 2. 波浪线形式
 * 3. 标准进度条形式
 */
export default class Progress {
  constructor() {
  }

  /**
   * 用透明度量化各个部分完成情况
   * 适用于 - 阅读高能进度条
   */
  public opacity(values: number[], color: string = "#62b6b7", opacity: string = "1"): HTMLSpanElement {
    const span = ztoolkit.UI.creatElementsFromJSON(
      document,
      {
        tag: "span",
        styles: {
          display: "flex",
          flexDirection: "row",
          height: "100%",
          width: "100%",
          justifyContent: "space-around",
          opacity
        },
        classList: ["opacity-progress"]
      }
    ) as HTMLSpanElement
    let sortedValues = [...values].sort((a, b) => b - a);
    let meanValue = [...values].reduce((a, b) => a + b) / values.length;
    let maxValue = meanValue + (sortedValues[0] - meanValue) * .5
    let [r, g, b] = this.getRGB(color)
    for (let value of values) {
      span.appendChild(
        ztoolkit.UI.creatElementsFromJSON(
          document,
          {
            tag: "span",
            styles: {
              height: "100%",
              width: `${100/values.length}%`,
              margin: "0",
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${value / maxValue})`,
            }
          }
        )
      )
    }
    return span
  }

  /**
   * 平滑曲线类型的进度条
   */
  public line(values: number[], color: string = "#FD8A8A", opacity: string = "1"): HTMLDivElement {
    let container = ztoolkit.UI.creatElementsFromJSON(
      document,
      {
        tag: "div",
        // id: "container-for-raphael",
        classList: ["container-for-raphael"],
        styles: {
          width: "100%",
          height: "100%",
          opacity
        }
      }
    ) as HTMLDivElement
    document.documentElement.appendChild(container);
    // 根据列标题计算列宽高
    let s1 = window.getComputedStyle(document.querySelector(".Progress-item-tree-main-default"))
    let s2 = window.getComputedStyle(document.querySelector(".Progress-item-tree-main-default div"))
    const w = Number(s1.width.replace("px", "")) - Number(s2.width.replace("px", "")) / 2
    const h = Number(s1.height.replace("px", ""))
    // 绘制部分
    let paddingY = 0.2
    let paddingX = 0.05
    let points = []
    const maxValue = [...values].sort((a, b)=>b-a)[0]
    const minValue = 0
    for (let i = 0; i < values.length; i++) {
      let x = i * w * (1 - 2 * paddingX) / (values.length - 1) + paddingX * w
      let y = h - ((values[i] - minValue) / (maxValue - minValue) * h * (1 - 2 * paddingY) + h * paddingY)
      points.push({ x, y })
    }
    // 线绘制
    var polygon = `M 0 ${h} L ${points[0].x}, ${points[0].y} R `
      + points.slice(1).map(p => `${p.x}, ${p.y}`).join(" ")
      + ` V ${h} H ${0}`
    var line = `M ${points[0].x}, ${points[0].y} R `
      + points.slice(1).map(p => `${p.x}, ${p.y}`).join(" ")
    var Raphael = require("./zotero-raphael")
    const paper = Raphael(container, w, h);
    const [red, green, blue] = this.getRGB(color)
    paper.path(polygon).attr({
      stroke: "transparent",
      fill: `90-rgba(255, 255, 255, 0)-rgba(${red}, ${green}, ${blue}, 0.8)`,
      opacity: 0
    })
    paper.path(line).attr({
      stroke: `rgba(${red}, ${green}, ${blue}, 1)`,
    })
    // 点绘制
    if (Zotero.Prefs.get(
      `${config.addonRef}.progressColumn.circle`
    ) as boolean) {
      let rx = w * paddingX
      let ry = h * paddingY
      let r = rx > ry ? ry : rx
      r = r * .5
      const pct = 0.015
      r = w * pct > r ? r : w * pct
      for (let point of points) {
        let circle = paper.circle(point.x, point.y, r).attr({
          stroke: `rgba(${red}, ${green}, ${blue}, 1)`,
          strokeWidth: r * .08,
          fill: "white",
          opacity: 0
        })
        circle.animate({
          opacity: 1
        }, 1000, "ease-out")
      }
    }
    // 绘制部分
    return container
  }

  /**
   * 线形进度
   * 显示百分比
   */
  public linePercent(value: number, maxValue: number, color: string = "#62B6B7", opacity: string = "1"): HTMLSpanElement {
    const [red, green, blue] = this.getRGB(color)
    const percent = value / maxValue * 100
    const span = ztoolkit.UI.creatElementsFromJSON(
      document,
      {
        tag: "span",
        styles: {
          position: "relative",
          height: "20px",
          width: "100%",
          margin: "auto 0",
          display: "inline-block",
          opacity
        },
        classList: ["if-progress"],
        subElementOptions: [
          {
            tag: "span",
            styles: {
              position: "absolute",
              left: "0",
              height: "30%",
              top: "calc(50% - 30%/2)",
              width: "100%",
              display: "inline-block",
              backgroundColor: `rgba(${red}, ${green}, ${blue}, .23)`,
              borderRadius: "1em"
            }
          },
          {
            tag: "span",
            styles: {
              position: "absolute",
              left: "0",
              height: "30%",
              top: "calc(50% - 30%/2)",
              width: `${percent > 100 ? 100 : percent}%`,
              display: "inline-block",
              backgroundColor: `rgba(${red}, ${green}, ${blue}, 1)`,
              borderRadius: "1em"
            }
          }
        ]
      }
    ) as HTMLSpanElement
    return span
  }

  /**
   * 圆形进度
   * 显示百分比
   */
  public circlePercent(value: number, maxValue: number) {

  }

  public getRGB(color: string) {
    var sColor = color.toLowerCase();
    //十六进制颜色值的正则表达式
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 如果是16进制颜色
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        var sColorNew = "#";
        for (var i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      //处理六位的颜色值
      var sColorChange = [];
      for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
      }
      return sColorChange;
    }
    return sColor;
  }

}

