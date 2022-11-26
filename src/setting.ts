import AddonModule from "./module";

class Setting extends AddonModule {
  public Zotero: any
  public window: any
  public document: any
  public settingNode: any
  public inputNode: any
  public historyNode: any
  public setValue: any
  public getValue: any
  public tip = "Enter your command here..."
  public _settingHistory = [
    "Zotero.ZoteroStyle.progressOpacity=.7", 
    "Zotero.ZoteroStyle.tagSize=5",
    "Zotero.ZoteroStyle.progressColor=#5AC1BD",
    "Zotero.ZoteroStyle.constantFields=['hasAttachment', 'title']"
  ]
  constructor(parent) {
    super(parent)
  }

  public init(Zotero) {
      this.Zotero = Zotero;
      this.window = this.Zotero.getMainWindow();
      this.document = this.window.document;
      this.createStyle()
      this.createHTML()
      this.setEvent()
  }

  public execLine(text: string) {
    console.log(`exec ${text}`)
    if (text.includes("=")) {
      let [key, value] = text.split("=")
      this.setValue(key.trim(), value.trim())
      console.log(`setValue(${key}, ${value})`)
      this.Zotero.ZoteroStyle.events.addStyle()
      this.Zotero.getMainWindow().ZoteroPane.itemsView.refreshAndMaintainSelection()
      this.inputNode.value = ""
      this.inputMessage("Success")
      return true
    } else if (this.getValue(text)) {
      let v = this.getValue(text)
      console.log("->", v)
      this.inputNode.value = v
      return true
    } else {
      this.inputNode.value = ""
      this.inputMessage("Not Support")
      let lastLine = this.historyNode.querySelector(".line:last-child")
      if (lastLine) {
        lastLine.setAttribute("selected", "")
      }
      return false
    }
  }

  public appendLine(text: string, selected: boolean = false, skipExec: boolean = false) {
    // 页面变化
    let li = this.createElement("li")
    li.setAttribute("class", "line")
    li.innerText = text
    // let inHistory = false
    if (selected) {
      this.settingNode.querySelectorAll(".line").forEach(line=>{
        line.removeAttribute("selected")
        if (line.innerText==text) {
          // inHistory = true
          line.remove()
        }
      })
      li.setAttribute("selected", "")
    }
    // if (!inHistory && this.execLine(text)) {
    if (skipExec || this.execLine(text)) {
      this.historyNode.appendChild(li)
      // push to settingHistory
      const k = "Zotero.ZoteroStyle.settingHistory"
      let settingHistory = this.getValue(k, this._settingHistory)
      if (text.includes("=")) {
        let varname = text.split("=")[0].trim()
        settingHistory = settingHistory.filter(line=>!line.includes(varname))
      }
      settingHistory.push(text)
      this.setValue(k, settingHistory)
      return true
    }
    return false
  }

  public createHTML() {
    console.log("create HTML")
    let settingNode = this.createElement("div")
    settingNode.style.zIndex = 999
    settingNode.setAttribute("id", "Zotero-Style-Setting")

    let historyNode = this.createElement("ul")
    historyNode.setAttribute("class", "history")
    historyNode.style.display = "none"
    settingNode.appendChild(historyNode)

    let inputbox = this.createElement("div")
    inputbox.setAttribute("class", "input-box")
    let span = this.createElement("span")
    span.innerText = ">"
    inputbox.appendChild(span)
    let inputNode = this.createElement("input")
    inputNode.setAttribute("placeholder", this.tip)
    inputbox.appendChild(inputNode)
    settingNode.appendChild(inputbox)
    this.document.querySelector('#main-window').appendChild(settingNode)
    this.settingNode = settingNode
    this.inputNode = inputNode
    this.historyNode = historyNode
    const k = "Zotero.ZoteroStyle.settingHistory"
    let textArray = Array()
    this.getValue(k, []).forEach(text=>{
      if (textArray.indexOf(text)==-1) {
        this.appendLine(text, false, true)
        textArray.push(text)
      }
    })
    console.log(settingNode)
  }

  public createStyle() {
    console.log("add Style")
    let styleText = `
      #Zotero-Style-Setting {
        ---radius---: 10px;
        position: fixed;
        left: 30%;
        bottom: 10%;
        width: 40%;
        border-radius: var(---radius---);
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: white;
        font-size: 18px;
        box-shadow: 0.3em 0.3em 1em rgba(0, 0, 0, 0.3);
      }
      #Zotero-Style-Setting .input-box {
        width: 100%;
        padding-left: 20px;
      }
      #Zotero-Style-Setting input {
          width: 90%;
          height: 45px;
          border: 1px solid red;
          border: none;
          outline: none;
          border-radius: 5px;
          font-size: 20px;
          margin-left: .3em;
      }
      #Zotero-Style-Setting .history {
          width: 100%;
          margin-top: 0;
          padding: 0;
          background-color: rgba(248, 240, 240, .4);
      }
      #Zotero-Style-Setting .history .line {
          list-style-type: none;
          width: calc(100% - 40px);
          line-height: 2.5em;
          padding: auto 10px;
          display: inline-block;
          padding-left: 20px;
          padding-right: 20px;

      }
      #Zotero-Style-Setting .history .line:active {
          background-color: rgba(220, 240, 240, 1);;
      }
      #Zotero-Style-Setting .history .line[selected] {
          background-color: rgba(220, 240, 240, 1);
      }
      #Zotero-Style-Setting .history .line:first-child {
          border-radius: var(---radius---) var(---radius---) 0 0;
      }
    `
    let style = this.createElement("style")
    style.setAttribute('type', 'text/css')
    style.setAttribute('id', 'settingStyle')
    style.innerHTML = styleText
    this.document.querySelector('#main-window').appendChild(style)
  }

  public setEvent() {
    // let settingNode = this.document.querySelector("#Zotero-Style-Setting")
    // let inputNode = this.document.querySelector("input")
    // let historyNode = settingNode.querySelector(".history")
    this.settingNode.addEventListener("keyup", (event)=>{
        let isInit = false
        if (event.key=="ArrowUp") {
            // 如果没显示history
            if (this.historyNode.style.display=="none") {
              let lastLine = this.historyNode.querySelector(".line:last-child")
              if (lastLine) {
                // 让他显示，并默认选择第一个
                this.historyNode.style.display = ""
                this.historyNode.querySelectorAll(".line").forEach(line=>line.removeAttribute("selected"))
                lastLine.setAttribute("selected", "")
                isInit = true
              } else {
                this.inputMessage("settingHistory is empty")
              }
            }
        } else if (event.key=="Enter") {
            // 回车则获取当前selected，填入input
            if (this.historyNode.style.display != "none" && this.inputNode.value.trim() == "") {
              this.inputNode.value = this.historyNode.querySelector(".line[selected]").innerText
              // 并且收起historyNode
              this.historyNode.style.display = "none"
            } else {
              if (this.appendLine(this.inputNode.value, true)) {
                this.historyNode.style.display = ""
              }
            }
        } else if (event.key=="Escape") {
          if (this.historyNode.style.display != "none") {
            this.historyNode.style.display = "none"
          } else {
            this.settingNode.style.display = "none"
          }
        } else if (event.key=="Delete") {
          if (this.historyNode.style.display != "none") {
            // 删除选中
            let lines = this.historyNode.querySelectorAll(".line")
            for (let i=0;i<lines.length;i++) {
              if (lines[i].hasAttribute("selected")) {
                lines[i].remove()
                // 并且移除本地记录settingHistory
                const k = "Zotero.ZoteroStyle.settingHistory"
                let settingHistory = this.getValue(k, this._settingHistory).filter(text=>text!=lines[i].innerText)
                this.setValue(k, settingHistory)
                lines[i+1<lines.length ? i+1 : (lines.length-1 == i ? 0 : lines.length-1)].setAttribute("selected", "")
                // 删除后没有line
                if (this.historyNode.childNodes.length == 0) {
                  this.settingNode.style.display = "none"
                }
                break
              }
            }
          }
        }
        // 选择逻辑
        if ((event.key=="ArrowUp" || event.key=="ArrowDown") && !isInit) {
            let lines = this.historyNode.querySelectorAll(".line")
            for (let i=0;i<lines.length;i++){
                if (lines[i].hasAttribute("selected")) {
                    lines[i].removeAttribute("selected")
                    // 得到当前被选择索引，选择下一个/上一个
                    if (event.key=="ArrowUp") {
                        i -= 1
                    } else if (event.key=="ArrowDown") {
                        i += 1
                    }
                    if (i==-1) {
                        i = lines.length - 1
                    }
                    if (i==lines.length) {
                        i = 0
                    }
                    lines[i].setAttribute("selected", "")
                    break
                }
            }
        }
    })
  }

  public inputMessage(msg, t: number = 1) {
    this.inputNode.setAttribute("placeholder", msg)
    this.window.setTimeout(()=>{
      this.inputNode.setAttribute("placeholder", this.tip)
    }, t * 1e3)
  }

  public createElement(name) {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", name)
  }
}

export default Setting;