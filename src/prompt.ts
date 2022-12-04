class AddonPrompt {
  public Zotero: _ZoteroConstructable
  public window: Window
  public document: Document

  public promptNode: any
  public inputNode: any
  public resultNode: any
  public keyset: XUL.Element  

  public config = {
    "高能进度条": {
      "颜色": {
        get() {
          this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressColor")
        },
        set(value) {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressColor", value)
        },
        check(value) {
          return /#\w+/.test(value)
        }
      },
      "透明度": {
        get() {
          this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressOpacity")
        },
        set(value) {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressOpacity", value)
        },
        check(value) {
          let flag = true
          try {
            flag = flag && Number(value) >= 0 && Number(value) <= 1
          } catch {
            return false
          }
          return flag
        }
      },

    },
    // "标签": {
    //   "指派颜色和位置": {

    //   },
    //   "对齐": {

    //   },
    //   "宽度": {

    //   },
    //   "位置": {

    //   }
    // },
    // "字段最大化": {

    // },
    // "参考文献": {

    // }
  }

  constructor () {
    console.log("AddonPrompt is called")
  }

  public init(Zotero: _ZoteroConstructable) {
    console.log("AddonPrompt init is called")

    this.Zotero = Zotero
    this.window = this.Zotero.getMainWindow()
    this.document = this.window.document

    Object.assign(this.config, {Zotero: this.Zotero})
    this.createHTML()
    this.addStyle()
  }

  public createHTML() {
    console.log("create element for prompt")
    // root node
    let promptNode = this.createElement("div")
    promptNode.style.zIndex = "999"
    promptNode.setAttribute("id", "zotero-prompt")
    // for viewing result or results
    let resultNode = this.createElement("ul")
    resultNode.classList.add("result")
    // resultNode.style.display = "none"
    promptNode.appendChild(resultNode)
    // tip 
    let tipNode = this.createElement("div")
    tipNode.setAttribute("class", "zotero-prompt-tip")
    let box1 = this.createElement("div")
    box1.setAttribute("class", "box 1")
    box1.innerHTML = `
      <span>↑↓</span>
      <span>导航</span>
    `
    tipNode.appendChild(box1)

    let box2 = this.createElement("div")
    box2.setAttribute("class", "box 2")
    box2.innerHTML = `
      <span>↵</span>
      <span>使用</span>
    `
    tipNode.appendChild(box2)

    let box3 = this.createElement("div")
    box3.setAttribute("class", "box 3")
    box3.innerHTML = `
      <span >esc</span>
      <span>退出</span>
    `
    tipNode.appendChild(box3)

    // for entering text or accepting keycode
    let inputbox = this.createElement("div")
    inputbox.setAttribute("class", "input-box")
    let span = this.createElement("span")
    span.innerText = "</>"
    inputbox.appendChild(span)
    let inputNode = this.createElement("input")
    inputNode.setAttribute("placeholder", "输入命令...")
    inputbox.appendChild(inputNode)
    // append
    promptNode.appendChild(inputbox)
    promptNode.appendChild(tipNode)
    this.document.querySelector('#main-window').appendChild(promptNode)
    this.promptNode = promptNode
    this.inputNode = inputNode
    this.resultNode = resultNode;

    for (let i=0; i<100; i++) {

    }

  }

  public createItem() {
    let item = this.createElement("div")
    let span 
  }

  public addStyle() {
    console.log("add style for prompt")
    let styleText = `
      #zotero-prompt * {
        box-sizing: border-box;
      }
      #zotero-prompt {
        ---radius---: 10px;
        position: fixed;
        left: 30%;
        bottom: 10%;
        width: 40%;
        border-radius: var(---radius---);
        border: 1px solid #dcdcdc;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: white;
        font-size: 18px;
        box-shadow: 0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2);
      }
      #zotero-prompt .input-box {
        width: 100%;
        padding-left: 20px;
      }
      #zotero-prompt input {
          width: 90%;
          height: 45px;
          border: none;
          outline: none;
          border-radius: 5px;
          font-size: 20px;
          margin-left: .3em;
          background-color: #ffffff;
      }
      #zotero-prompt .result {
          width: 100%;
          margin-top: 0;
          margin-bottom: 0;
          padding: 0;
          max-height: 600px;
          overflow-y: auto;
          list-style: none;
      }
      #zotero-prompt *::-webkit-scrollbar-thumb {
        background-color: yellow;
        -webkit-border-radius: red;
        background-clip: padding-box;
        border: 2px solid transparent;
        border-width: 3px 3px 3px 2px;
        min-height: 45px;
      }
      #zotero-prompt .result .item {
          list-style-type: none;
          width: calc(100% - 40px);
          line-height: 2.5em;
          padding: auto 10px;
          display: inline-block;
          padding-left: 20px;
          padding-right: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
      }
      #zotero-prompt input {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #zotero-prompt .result .item:active {
          background-color: rgba(220, 240, 240, 1);
      }
      #zotero-prompt .result .item[selected] {
          background-color: rgba(220, 240, 240, 1);
      }
      #zotero-prompt .result .item:first-child {
          border-radius: var(---radius---) var(---radius---) 0 0;
      }

      .zotero-prompt-tip {
          display: flex;
          flex-direction: row;
          width: 100%;
          align-items: center;
          justify-content: center;
          margin: auto;
          opacity: .5;
          font-size: 12px;
          margin-top: 0;
          margin-bottom: 10px;
      }
      .zotero-prompt-tip .box {
          display: flex;
          align-items: center;
          margin-left: 10px;
          margin-right: 10px;
          font-size: 12px;
          color: #5a5a5a;
          justify-content: space-between;
      }
      .zotero-prompt-tip .box span:first-child {
        font-weight: 600; 
        filter: contrast(6.89);
        margin-right: 4px;
      }
    `
    let style = this.createElement("style")
    style.setAttribute('type', 'text/css')
    style.setAttribute('id', 'prompt-style')
    style.innerHTML = styleText
    this.document.querySelector('#main-window').appendChild(style)
  }

  public createElement(nodeName: string): HTMLElement {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", nodeName)

  }

}

export default AddonPrompt