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

  public maxlineNodeNum = 10 // because the scroll in Zotero is too ugly
  public tipText = "Enter your command here..."
  public History = {
    k: "Zotero.ZoteroStyle.settingHistory",
    permanentSettingHistory: [
      "Zotero.ZoteroStyle.progressOpacity=.7",
      "Zotero.ZoteroStyle.tagSize=5",
      "Zotero.ZoteroStyle.tagPosition=3",
      "Zotero.ZoteroStyle.progressColor=#5AC1BD",
      "Zotero.ZoteroStyle.constantFields=['hasAttachment', 'title']"
    ],
    render() {
      let allText = this.readAll()
      this.historyNode.querySelectorAll(".line").forEach(e=>{
        let innerText = e.innerText
        if (allText.includes(innerText)) {
          allText = allText.filter(text=>text!=innerText)
        } else {
          e.remove()
        }
      })
      // console.log("History not in HTML", allText)
      allText.forEach(text=>{
        let lineNode = this.createElement("li")
        lineNode.setAttribute("class", "line")
        lineNode.innerText = text
        this.historyNode.appendChild(lineNode)
      })
      let lineNodes = this.historyNode.childNodes
      let lineNodeNum = lineNodes.length
      if (lineNodeNum > this.maxlineNodeNum) {
        for (let i=0;i<lineNodeNum-this.maxlineNodeNum;i++) {
          lineNodes[i].style.display = "none"
        }
      }
    },
    push(text) {
      console.log(`push - ${text}`)
      let arr = this.readAll()
      console.log('before', arr)
      arr.push(text)
      this.setValue(this.k, arr) 
      console.log('after', this.readAll())
    },
    readAll() {
      return this.getValue(this.k, this.permanentSettingHistory)
    },
    remove(text) {
      console.log(`remove - ${text}`)
      let arr = this.readAll().filter(_text=>_text!=text)
      this.setValue(this.k, arr)
      console.log(arr)
    },
    removeStartsWidth(text) {
      console.log(`removeStartsWidth - ${text} `)
      console.log('before', this.readAll())
      this.setValue(this.k, this.readAll().filter(_text=>!_text.startsWith(text)))
      console.log('after', this.readAll())

    }
  }

  constructor(parent) {
    super(parent)
  }

  public init(Zotero) {
      this.Zotero = Zotero;
      this.window = this.Zotero.getMainWindow();
      this.document = this.window.document;
      console.log(this.History)
      Object.assign(this.History, this, {getValue: this.getValue, setValue: this.setValue, createElement: this.createElement})
      this.createStyle()
      this.createHTML()
      this.setEvent()
  }

  public createStyle() {
    console.log("add style for setting")
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
          max-height: 500px;
          overflow-y: hidden;
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

  public createHTML() {
    console.log("create element for setting")
    // root node
    let settingNode = this.createElement("div")
    settingNode.style.zIndex = 999
    settingNode.setAttribute("id", "Zotero-Style-Setting")
    // for viewing history or results
    let historyNode = this.createElement("ul")
    historyNode.classList.add("history")
    historyNode.classList.add("view")
    historyNode.style.display = "none"
    settingNode.appendChild(historyNode)
    // for entering text or accepting keycode
    let inputbox = this.createElement("div")
    inputbox.setAttribute("class", "input-box")
    let span = this.createElement("span")
    span.innerText = "</>"
    inputbox.appendChild(span)
    let inputNode = this.createElement("input")
    inputNode.setAttribute("placeholder", this.tipText)
    inputbox.appendChild(inputNode)
    // append
    settingNode.appendChild(inputbox)
    this.document.querySelector('#main-window').appendChild(settingNode)
    this.settingNode = settingNode
    this.inputNode = inputNode
    this.historyNode = historyNode
    Object.assign(this.History, {inputNode, historyNode})
    this.History.render()
  }

  public appendLine(text: string) {
    if (!this.execLine(text)) { return false }
    if (text.includes("=")) {
      this.History.removeStartsWidth(text.split("=")[0].trim())
    } else {
      this.History.remove(text)
    }
    this.History.push(text)
    console.log("----", this.History.readAll())
    this.History.render()
    this.selectLastLineNode()
    return true
    
  }

  public execLine(text: string) {
    console.log(`try to execute - ${text}`)
    if (text.includes("=")) {
      let [key, value] = text.split("=")
      this.setValue(key.trim(), value.trim())
      console.log(`execute - setValue(${key}, ${value})`)
      this.Zotero.ZoteroStyle.events.refresh()
      this.inputNode.value = ""
      this.inputMessage("Refresh", 2)
      this.inputMessage("Finished", 1, 1)
      return true
    } else if (text.startsWith("/")) {
      // some advanced command here, TODO
    } else if (this.getValue(text)) {
      let v = this.getValue(text)
      console.log(`Prefs return - ${v}`)
      this.inputNode.value = v
      return true
    } else {
      this.inputNode.value = ""
      this.inputMessage(`Not Support: ${text}`)
      return false
    }
  }
  
  public setEvent() {
    this.settingNode.addEventListener("keyup", (event)=>{
        if (event.key=="ArrowUp") {
            // 如果没显示history
            if (this.historyNode.style.display=="none") {
              let lastLine = this.historyNode.querySelector(".line:last-child")
              if (lastLine) {
                // 让他显示，并默认选择第一个
                this.historyNode.style.display = ""
                this.historyNode.querySelectorAll(".line").forEach(line=>line.removeAttribute("selected"))
                lastLine.setAttribute("selected", "")
                return 
              } else {
                this.inputMessage("settingHistory is empty")
              }
            }
        } else if (event.key=="Enter") {
            // 回车则获取当前selected，填入input
            if (this.historyNode.style.display != "none" && this.inputNode.value.trim() == "") {
              // line -> input
              this.inputNode.value = this.historyNode.querySelector(".line[selected]").innerText
              // 并且收起historyNode
              this.historyNode.style.display = "none"
            } else {
              // input -> line
              if (this.appendLine(this.inputNode.value)) {
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
                this.History.remove(lines[i].innerText)
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
        // arrow up down, select 
        if (["ArrowUp", "ArrowDown"].indexOf(event.key) != -1) {
            let lineNodes = this.historyNode.childNodes
            let lineNodeNum = lineNodes.length
            for (let i=0;i<lineNodes.length;i++){
                if (lineNodes[i].hasAttribute("selected")) {
                  lineNodes[i].removeAttribute("selected")
                    if (event.key=="ArrowUp") {
                        i -= 1
                    } else if (event.key=="ArrowDown") {
                        i += 1
                    }
                    if (i==-1) {
                        i = lineNodes.length - 1
                    }
                    if (i==lineNodes.length) {
                        i = 0
                    }
                    lineNodes[i].setAttribute("selected", "")
                    if (lineNodes[i].style.display == "none") {
                      lineNodes[i].style.display = "";
                      lineNodes[lineNodeNum - (i+1)].style.display = "none"
                    }
                    break
                }
            }
        }
    })
  }

  public selectLastLineNode() {
    this.historyNode.querySelectorAll(".line").forEach(e=>e.removeAttribute("selected"))
    this.historyNode.querySelector(".line:last-child").setAttribute("selected", "")
  }

  public inputMessage(msg, persist: number = 1, latency = 0) {
    this.window.setTimeout(() => {
      if (this.settingNode.style.display == "none") {
        this.settingNode.style.display = ""
      }
      this.inputNode.setAttribute("placeholder", msg)
      this.window.setTimeout(()=>{
        this.inputNode.setAttribute("placeholder", this.tipText)
      }, persist * 1e3)
    }, latency * 1e3)
  }

  public createElement(name) {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", name)
  }
}

export default Setting;