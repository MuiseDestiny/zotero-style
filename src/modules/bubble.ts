export default class Bubble {
  private node: HTMLElement;
  public ele!: HTMLElement;
  private className: string;
  private text: string;
  private pos: "bottom" | "top";
  constructor(node: HTMLElement, className: string, text: string, pos: "bottom" | "top") {
    this.node = node;
    this.className = className;
    this.text = text;
    this.pos = pos

    this.initBubble()
    this.place()
  }

  /**
   * 摆放气泡元素
   */
  public place() {
    const nodeRect: Rect = this.node.getBoundingClientRect();
    const eleRect: Rect = this.ele.getBoundingClientRect();

    const x: number = nodeRect.x + nodeRect.width;
    this.ele.style.left = `${x - nodeRect.width/2 - eleRect.width/2}px`;

    const padding = 5
    let y: number
    switch (this.pos) {
      case "bottom":
        y = nodeRect.y + nodeRect.height
        this.ele.style.top = `${y+padding}px`;
        break
      case "top":
        y = nodeRect.y - eleRect.height
        this.ele.style.top = `${y-padding}px`;
        break
    }

  }

  public initBubble() {
    let ele = document.querySelector(`.${this.className}`) as HTMLElement
    const t = .1, func = "linear" 
    if (ele) {
      // 清除关闭倒计时
      let closeTimer = ele.getAttribute("closeTimer")
      if (closeTimer) {
        window.clearTimeout(Number(closeTimer))
      }
      // 透明度
      ele.style.opacity = "1"
    } else {
      ele = ztoolkit.UI.createElement(document, "div", {
        classList: [this.className],
        styles: {
          position: "fixed",
          border: "1px solid #eee",
          textAlign: "center",
          borderRadius: "1em",
          transition: `bottom ${t}s ${func}, left ${t}s ${func}, width ${t}s ${func}, height ${t}s ${func}, opacity ${t}s ${func}`,
          backgroundColor: "#eee",
          padding: ".1em .8em"
        }
      }) as HTMLElement
      document.documentElement.appendChild(ele)
    }
    this.ele = ele;
    this.ele.innerText = this.text;
  }
}

interface Rect {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}