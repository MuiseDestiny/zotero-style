import { sync } from "replace-in-file";
import AddonModule from "./module";

class AddonSetting extends AddonModule {
  public settingNode: HTMLDivElement
  public inputNode: HTMLInputElement
  public historyNode: any
  public keyset: XUL.Element  

  public DOIRegex = /10\.\d{4,9}\/[-\._;\(\)\/:A-z0-9]+/
  public maxTotalLineNum = 12 // because the scroll in Zotero is too ugly
  public tipText = "Enter your command here..."
  public DOIData = {}  // doi's detail info
  public DOIRefData = {}  // doi's all references
  public History = {
    k: "Zotero.ZoteroStyle.settingHistory",
    permanentSettingHistory: [
      "Zotero.ZoteroStyle.gitee=URL#Token",
      "Zotero.ZoteroStyle.progressOpacity=.7",
      "Zotero.ZoteroStyle.tagSize=5",
      "Zotero.ZoteroStyle.tagPosition=4",
      "Zotero.ZoteroStyle.tagAlign=left",
      "Zotero.ZoteroStyle.progressColor=#5AC1BD",
      "Zotero.ZoteroStyle.constantFields=['hasAttachment', 'title']",
      `/Zotero.Tags.setColor(1, "tagName", '#AAAAAA', 1)`,
      `/reference`
    ],
    render() {
      let allText = this.readAll(true)
      this.historyNode.querySelectorAll(".line").forEach(e=>{
        let innerText = e.innerText
        if (allText.includes(innerText)) {
          allText = allText.filter(text=>text!=innerText)
          e.removeAttribute("selected")
        } else {
          e.remove()
        }
      })
      this.renderArray(allText)
    },
    push(text) {
      console.log(`push - ${text}`)
      let arr = this.readAll()
      console.log('before', arr)
      arr.push(text)
      this.setValue(this.k, arr) 
      console.log('after', this.readAll())
    },
    readAll(supplement: boolean = false) {
      let textArray =  this.getValue(this.k, this.permanentSettingHistory)
      if (supplement) {
        let supplementArray = this.permanentSettingHistory.filter(text=>{
          return textArray.filter(_text=>_text.includes(text.split("=")[0])).length == 0
        })
        textArray = [...textArray, ...supplementArray]
      }
      return textArray
    },
    remove(text) {
      console.log(`remove - ${text}`)
      let arr = this.readAll().filter(_text=>_text!=text)
      this.setValue(this.k, arr)
      console.log(arr)
    },
    removeStartsWith(text) {
      console.log(`removeStartsWith - ${text} `)
      console.log(JSON.stringify(this.readAll()))
      this.setValue(this.k, this.readAll().filter(_text=>!_text.startsWith(text)))
      console.log(JSON.stringify(this.readAll()))
    }
  }

  constructor(parent) {
    super(parent)
  }

  public init() {
      console.log(this.History)
      Object.assign(this.History, this, 
        {
          getValue: this.getValue, 
          setValue: this.setValue, 
          createElement: this.createElement, 
          renderArray: this.renderArray
        }
      )
      this.createStyle()
      this.createHTML()
      this.setEvent()
      this.initKeys()
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
        border: 1px solid #dcdcdc;
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
          border: none;
          outline: none;
          border-radius: 5px;
          font-size: 20px;
          margin-left: .3em;
          background-color: #ffffff;
      }
      #Zotero-Style-Setting .history {
          width: 100%;
          margin-top: 0;
          margin-bottom: 0;
          padding: 0;
          max-height: 600px;
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
      }
      #Zotero-Style-Setting input {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #Zotero-Style-Setting .history .line:active {
          background-color: rgba(220, 240, 240, 1);
      }
      #Zotero-Style-Setting .history .line[selected] {
          background-color: rgba(220, 240, 240, 1);
      }
      #Zotero-Style-Setting .history .line:first-child {
          border-radius: var(---radius---) var(---radius---) 0 0;
      }

      .zotero-style-setting-tip {
          display: flex;
          flex-direction: row;
          width: 100%;
          align-items: center;
          justify-content: center;
          margin: auto;
          opacity: .5;
          background-color: rgba(248, 240, 240, .4);
          font-size: 12px;
          margin-top: 0;
          margin-bottom: 10px;
      }
      .zotero-style-setting-tip .box {
          display: flex;
          align-items: center;
          margin-left: 10px;
          margin-right: 10px;
          width: 50px;
          justify-content: space-between;
      }
      .zotero-style-setting-tip .box:last-child {
        width: 60px;
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
    settingNode.style.zIndex = "999"
    settingNode.setAttribute("id", "Zotero-Style-Setting")
    // for viewing history or results
    let historyNode = this.createElement("ul")
    historyNode.classList.add("history")
    // historyNode.style.display = "none"
    settingNode.appendChild(historyNode)
    // tip 
    let tipNode = this.createElement("div")
    tipNode.setAttribute("class", "zotero-style-setting-tip")
    let box1 = this.createElement("div")
    box1.setAttribute("class", "box 1")
    box1.innerHTML = `
      <svg t="1669890200032" class="icon" viewBox="0 0 1275 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2730" width="15" height="15"><path d="M434.01678069 96.35177165a94.289884 94.289884 0 0 0-133.25765214 0L123.48607034 273.6248307A40.38110706 40.38110706 0 0 0 180.5243836 331.26886006l146.48246438-146.98722794v683.24832532a40.38110706 40.38110706 0 0 0 80.76221328 0V184.28163212L554.25152647 331.26886006c0.60571692 0.70666946 1.31238556 1.31238556 2.01905503 2.01905585a40.38110706 40.38110706 0 0 0 55.01925824-59.15832165zM1151.48809462 650.58246162a40.38110706 40.38110706 0 0 0-57.03831326-2.01905503 19.08007305 19.08007305 0 0 0-2.01905503 2.01905503l-146.28055929 146.38151184V113.71564814a40.38110706 40.38110706 0 0 0-80.76221329 0v683.24832532l-146.38151184-146.38151184a40.38110706 40.38110706 0 0 0-59.15832166 55.01925824l2.01905502 2.01905503 177.37401161 177.27305822a93.98702554 93.98702554 0 0 0 133.15669958 0l177.27305823-177.27305822a40.38110706 40.38110706 0 0 0 1.81714993-57.03831327z" p-id="2731"></path></svg>
      <span>导航</span>
    `
    tipNode.appendChild(box1)

    let box2 = this.createElement("div")
    box2.setAttribute("class", "box 2")
    box2.innerHTML = `
      <svg t="1669891408569" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11255" width="15" height="15"><path d="M832 256v384H269.248l105.408-105.344-45.248-45.312-160 160a32 32 0 0 0 0 45.312l160 160 45.248-45.312L269.248 704H832a64 64 0 0 0 64-64V256h-64z" fill="#000000" fill-opacity=".9" p-id="11256"></path></svg>
      <span>使用</span>
    `
    tipNode.appendChild(box2)

    let box3 = this.createElement("div")
    box3.setAttribute("class", "box 3")
    box3.innerHTML = `
      <span style="font-size: 15px;">esc</span>
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
    inputNode.setAttribute("placeholder", this.tipText)
    inputbox.appendChild(inputNode)
    // append
    settingNode.appendChild(inputbox)
    settingNode.appendChild(tipNode)
    this.document.querySelector('#main-window').appendChild(settingNode)
    this.settingNode = settingNode
    this.inputNode = inputNode
    this.historyNode = historyNode
    Object.assign(this.History, {inputNode, historyNode})
    this.History.render()
  }

  public searchLine(text: string) {
    console.log(`try to search - ${text}`)
    // search some 
    let keywords = text.split(/[ ,-]/).filter(e=>e)
    if (keywords.length == 0) { return }
    console.log(keywords)
    this.historyNode.classList.add("search-result")
    let totalNum = 0
    this.historyNode.querySelectorAll(".line").forEach(line=>{
      let isAllIn = true
      for (let i=0;i<keywords.length;i++) {
        isAllIn = isAllIn && line.innerText.includes(keywords[i].trim()) 
      }
      if (isAllIn) {
        line.style.display = ""
        this.historyNode.insertBefore(line, this.historyNode.childNodes[0])
        totalNum ++
      } else {
        line.style.display = "none"
        line.removeAttribute("selected")
      }
    })
    this.inputMessage(`Get ${totalNum} resluts`)
    this.inputMessage(`Press ESC key to exit the search result`, 1)
    return true 
  }

  public async appendLine(text: string) {
    // search
    console.log(this.historyNode.classList)
    // high level command
    // if (text.startsWith("/search")) {
    //   return this.searchLine(text.replace("/search", ""))
    // }

    // other command
    if (!(await this.execLine(text))) { return false }
    
    if (text.includes("=")) {
      this.History.removeStartsWith(text.split("=")[0].trim())
    } else {
      this.History.remove(text)
    }
    this.History.push(text)
    console.log("----", this.History.readAll())
    this.History.render()
    // select the last node
    this.historyNode.querySelector(".line:last-child").setAttribute("selected", "")
    return true
  }

  public async execLine(text: string) {
    // the return value is used to determine whether to add the command to history
    console.log(`try to execute - ${text}`)
    if (text.includes("=")) {
      let [key, value] = text.split("=")
      this.setValue(key.trim(), value.trim())
      console.log(`execute - setValue(${key}, ${value})`)
      this._Addon.events.refresh()
      this.inputNode.value = ""
      this.inputMessage("Refresh", 0, 1)
      this.inputMessage("Finished", 1, 1)
      return true
    } else if (text.startsWith("/")) {
      console.log("command")
      // some advanced command here, TODO
      text = text.slice(1)
      if (text == "reference") {
        let reader = this._Addon.events.getReader()
        if (!reader) {
          console.log("no reader")
          this.inputMessage(`Please select your reader: /${text}`)
          return false
        }
        // reading paper DOI
        let item = this._Addon.events.getReadingItem()
        let DOI = item.getField("DOI")
        if (!this.DOIRegex.test(DOI)) {
          // DOI is unvalid, get it from unpaywall
          this.inputMessage("Get DOI from Unpaywall Api...")
          let title = item.getField("title")
          DOI = await this.getDOIInfo(title)
        }
        this.inputMessage("Request references from Crossref Api...")
        // clear historyNode
        let refData = await this.getRefData(DOI)
        console.log(refData)
        this.historyNode.classList.add("/reference")
        this.historyNode.style.display = ""
        this.historyNode.querySelectorAll(".line").forEach(e=>e.remove())
        this.inputMessage(`Get ${refData.length} references`)
        // add line
        refData.forEach(async (data: any, i: number) => {
          let lineNode = this.createElement("li")
          lineNode.setAttribute("class", "line")
          
          let titleName = "article-title"
          let title = data[titleName]
          let year = data.year
          let author = data.author

          // DOI is needed
          const DOI = data.DOI
          lineNode.setAttribute("data", DOI)
          if (!DOI) { lineNode.setAttribute("data", title) }
          lineNode.innerText = `[${i+1}]`
          this.historyNode.appendChild(lineNode)
          if (!(author && year && title)) {
            if (data.unstructured) {
              lineNode.innerText = `[${i+1}] ${data.unstructured}`
            } else if (DOI) {
              lineNode.innerText = `[${i+1}] Update from unpaywall...`
              // update DOIInfo by unpaywall
              let _data = await this.getDOIInfo(DOI)
              author = _data.z_authors[0]["family"]
              year = _data.year
              title = _data.title
              lineNode.innerText = `[${i+1}] ${author} et al., ${year}. ${title}`
            } 
          } else {
            lineNode.innerText = `[${i+1}] ${author} et al., ${year}. ${title}`
          }
          lineNode.style.display = refData.length - i > this.maxTotalLineNum ? "none" : ""
        })
        this.inputMessage("Please enter the search text, i.e., Polygon 2022")
        return false
      } else {
        let res = eval(`
          var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
            Components.interfaces.nsISupports
          ).wrappedJSObject;
          ${text};
        `)
        this.inputMessage("Success", 1)
        return false
      }
    } else if (this.DOIRegex.test(text)) {
      let DOI = text
      this.inputMessage(`Start - ${DOI}`, .1)
      var translate = new this.Zotero.Translate.Search();
      translate.setIdentifier({"DOI": DOI});

      let translators = await translate.getTranslators();
      translate.setTranslator(translators);
      try {
        let libraryID = this.window.ZoteroPane.getSelectedLibraryID();
        let collection = this.window.ZoteroPane.getSelectedCollection();
        let collections = collection ? [collection.id] : false;
        let refItem = (await translate.translate({
          libraryID,
          collections,
          saveAttachments: true
        }))[0];
        this.inputMessage(`Pending - ${refItem.getField("title")}`, .1)
        console.log(refItem)
        // addRelatedItem
        let reader = this._Addon.events.getReader()
        let item = this.Zotero.Items.get(reader.itemID).parentItem as _ZoteroItem
        console.log("item.addRelatedItem(refItem)")
        item.addRelatedItem(refItem)
        console.log("refItem.addRelatedItem(item)")
        refItem.addRelatedItem(item)
        await item.saveTx()
        await refItem.saveTx()
        this.inputMessage(`Done - ${refItem.getField("title")}`)
      } catch (e) {
        console.log(e);
      }
      return false
    } else if (this.getValue(text)) {
      let v = this.getValue(text)
      console.log(`Prefs return - ${v}`)
      this.inputNode.value = v
      return true
    } else {
      this.inputMessage(`Not Support: ${text}`, 0, 1)
      return false
    }
  }

  public setEvent() {
    let clearMatch = () => {
      this.historyNode.querySelectorAll(".line").forEach(line=>{
        line.innerText = line.innerText.replace(/<\/?b>/g, "")
        if (line.classList.contains("match")) {
          line.classList.remove("match")
        }
      })
    }

    let arrowEvent = (key) => {
      let lineNodes = [...this.historyNode.querySelectorAll(".line")]
      if (this.inputNode.value.length && this.historyNode.querySelector(".match")) {
        // select in the search results
        console.log("select in the search results")
        lineNodes = lineNodes.filter(e=>e.classList.contains("match"))
        console.log(lineNodes)
      }
      if (!this.historyNode.querySelector(".line[selected]")) {
        // select the first
        console.log("select the first, return")
        lineNodes.slice(-1)[0].setAttribute("selected", "")
        return
      }
      let totalLineNum = lineNodes.length
      for (let i=0;i<lineNodes.length;i++) {
        if (lineNodes[i].hasAttribute("selected")) {
          lineNodes[i].removeAttribute("selected")
          if (key=="ArrowUp") {
              i -= 1
          } else if (key=="ArrowDown") {
              i += 1
          }
          if (i==-1) {
              i = lineNodes.length - 1
          }
          if (i==lineNodes.length) {
              i = 0
          }
          lineNodes[i].setAttribute("selected", "")
          // if (this.inputNode.value.length) { break }
          const half = parseInt(String(this.maxTotalLineNum / 2))
          console.log(half)
          // i - selected index; j - other index
          let range
          if (totalLineNum - half <= i && i <= totalLineNum) {
            // bottom
            range = [totalLineNum - this.maxTotalLineNum, totalLineNum]
          } else if (0 <= i && i <= half) {
            // top
            range = [0, this.maxTotalLineNum]
          } else {
            // middle
            range = [i - half, i + half]
          }
          for (let j=0;j<totalLineNum;j++) {
            if (range[0] <= j && j <= range[1]) {
              lineNodes[j].style.display = ""
            } else {
              lineNodes[j].style.display = "none"
            }
          }
          break
        }
      }
      return
    }
    
    this.settingNode.addEventListener("keyup", async (event) => {
      let key = event.key
      console.log("keyup", key)
      console.log(key)
      // event.preventDefault()
      if (key=="Enter") {
        // 回车则获取当前selected，填入input
        if (
          (this.historyNode.style.display != "none")
        ) {
          // line -> input
          let selectedLine = this.historyNode.querySelector(".line[selected]")
          let text
          if (selectedLine.hasAttribute("data")) {
            text = selectedLine.getAttribute("data")
          } else {
            text = selectedLine.innerText
          }
          this.inputNode.value = text
          // 并且收起historyNode
          this.historyNode.style.display = "none"
          // this.historyNode.querySelectorAll(".match").forEach(e=>e.classList.remove("match"))
        } else {
          // input -> line
          if ((await this.appendLine(this.inputNode.value))) {
            this.historyNode.style.display = ""
          }
        }
      } else if (key=="Escape") {
        clearMatch()
        let classList = [...this.historyNode.classList]
        let lastClassName = [...classList].slice(-1)[0]
        if (classList.length > 1) {
          this.historyNode.classList.remove(lastClassName)
          this.inputNode.focus()
          if (classList.length == 2) { this.History.render() }
          this.inputMessage(`Exit ${lastClassName}...`, 0, 1)
          arrowEvent("ArrowUp")
        } else {
          this.History.render()
          if (this.historyNode.style.display != "none") {
            this.historyNode.style.display = "none"
            this.inputNode.focus()
          } else {
            this.settingNode.style.display = "none"
            this.inputNode.blur()
          }
        }
      } else if (key=="Delete") {
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
      } else if (key=="ArrowRight") {
        let inputText = this.inputNode.value
        if (inputText.endsWith(".")) { return }
        // generate keywords
        let keywordSet = new Set();
        this.History.readAll(true).forEach(text=>{
          text.split(/[(=]/)[0].split(/[\/\.]/)
            .filter(e=>e)
            .forEach(keyword=>{
              if (keyword == "/") { return }
              keywordSet.add(keyword)
            })
        });
        let keywordArray = [...keywordSet]
        let bestKeywords = keywordArray.filter((keyword: string)=>{
          return keyword.startsWith(this.inputNode.value.split(/[\/\.]/).slice(-1)[0])
        })
        if (bestKeywords.length == 0) { return } 
        let suggestion = bestKeywords[0] as string 
        this.inputNode.value = inputText.replace(/(\w+)$/, suggestion)
      }
      if (["ArrowUp", "ArrowDown"].indexOf(key) != -1) { return }
      // if historyNode has childNodes, search
      console.log(key)
      clearMatch()
      if (this.inputNode.value) {
        if (this.historyNode.querySelector(".line")) {
          let inputText = this.inputNode.value.replace(/ /g, "")
          let matchLineNodes = []
          this.historyNode.querySelectorAll(".line").forEach(line=>{
            let lineHTML = line.innerHTML
            let matchNum = 0
            let innerHTML = ""
            let tightness = 0
            let lasti = undefined
            for (let i=0;i<lineHTML.length;i++) {
              if (inputText[matchNum].toLowerCase() == lineHTML[i].toLowerCase()) {
                if (lasti == undefined) {
                  lasti = i
                }
                tightness += (i - lasti)
                matchNum ++
                innerHTML += `<b>${lineHTML[i]}</b>`
              } else {
                innerHTML += lineHTML[i]
              }
              if (matchNum == inputText.length) {
                innerHTML += lineHTML.slice(i+1)
                try {
                  line.innerHTML = innerHTML
                } catch {
                  line.innerHTML = lineHTML
                }
                matchLineNodes.push([tightness, line, line.innerText])
                break
              }
            }
            line.style.display = "none"
            line.removeAttribute("selected")
          })
          // select 3
          matchLineNodes = matchLineNodes.sort((x, y)=>(y[0]-x[0])).slice(-3)
          // compute rmse
          let tightnessArray = matchLineNodes.map(e=>e[0])
          // mean
          let s = 0
          for (let i=0;i<tightnessArray.length;i++) {
            s += tightnessArray[i]
          }
          let mean = s / tightnessArray.length
          // variance
          let v = 0
          for (let i=0;i<tightnessArray.length;i++) {
            v += (mean - tightnessArray[i]) ** 2
          }
          v = v / tightnessArray.length
          console.log("variance", v)
          if (v > 200) {
            matchLineNodes = matchLineNodes.slice(-1)
          }
          matchLineNodes.forEach((arr, i)=>{
            let line = arr[1]
            line.classList.add("match")
            if (matchLineNodes.length - i < this.maxTotalLineNum) {
              line.style.display = ""
            }
          })
        }
      } else {
        [...this.historyNode.querySelectorAll(".line")].slice(-this.maxTotalLineNum).forEach(e=>{
          e.style.display = ""
        })
      }
    })

    this.settingNode.addEventListener("keydown", async (event) => {
      let key = event.key
      console.log("keydown", key)
      if (["ArrowUp", "ArrowDown"].indexOf(key) != -1) {
        event.preventDefault();
      }
      if (key=="ArrowUp") {
        // 如果没显示history
        if (this.historyNode.style.display == "none") {
          this.historyNode.style.display = ""
          return
        }
      }
      // arrow up down, select 
      if (["ArrowUp", "ArrowDown"].indexOf(key) != -1) {
        arrowEvent(key)
      }
    })
  }

  public renderArray(arr) {
    arr.forEach(text=>{
      let lineNode = this.createElement("li")
      lineNode.setAttribute("class", "line")
      lineNode.innerText = text
      this.historyNode.appendChild(lineNode)
    })
    let lineNodes = this.historyNode.childNodes
    let totalLineNum = lineNodes.length
    if (totalLineNum > this.maxTotalLineNum) {
      for (let i=0;i<totalLineNum-this.maxTotalLineNum;i++) {
        lineNodes[i].style.display = "none"
      }
    }
  }

  public inputMessage(msg, latency: number = 0, persist: number = NaN) {
    console.log(msg, persist, latency)
    this.window.setTimeout(() => {
      if (this.settingNode.style.display == "none") {
        this.settingNode.style.display = ""
      }
      this.inputNode.value = ""
      this.inputNode.setAttribute("placeholder", msg)
      if (isNaN(persist)) { return }
      this.window.setTimeout(()=>{
        this.inputNode.setAttribute("placeholder", this.tipText)
      }, persist * 1e3)
    }, latency * 1e3)
  }

  private removeKeys() {
    if (this.keyset) {
      this.keyset.remove()
    }
  }

  private initKeys() {
    this.removeKeys()
    let keyset = this.document.createElement("keyset");
    keyset.setAttribute("id", "zoterostyle-keyset");

    let key = this.document.createElement("key");
    key.setAttribute("id", "zoterostyle-key");
    key.setAttribute("oncommand", "console.log(111)");
    key.addEventListener("command", function () {
      var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
        Components.interfaces.nsISupports
      ).wrappedJSObject;
      let document = _Zotero.getMainWindow().document
      let settingNode = document.querySelector("#Zotero-Style-Setting")
      if (settingNode.style.display == "none") {
        settingNode.style.display = ""
        settingNode.querySelector("input").focus()
      } else {
        settingNode.style.display = "none"
      }
    })
    key.setAttribute("key", "p")
    key.setAttribute("modifiers", "shift")
    keyset.appendChild(key)
    this.keyset = keyset
    this.document.getElementById("mainKeyset").parentNode.appendChild(keyset);
  }

  public async getRefData(DOI) {
    // request or read data
    let refData
    if (Object.keys(this.DOIData).indexOf(DOI) != -1) { 
      refData = this.DOIRefData[DOI]
    } else {
      try {
        const crossrefApi = `https://api.crossref.org/works/${DOI}/transform/application/vnd.citationstyles.csl+json`
        let res = await this.Zotero.HTTP.request(
          "GET",
          crossrefApi,
          {
            responseType: "json"
          }
        )
        refData = res.response
      } catch {
        return false
      }
    }
    // analysis refData
    return refData.reference
  }

  public async getDOIByTitle(title: string) {
    const unpaywall = `https://api.unpaywall.org/v2/search?query=${title}&email=unpaywall_01@example.com`
    let res = await this.Zotero.HTTP.request(
      "GET",
      unpaywall,
      {
        responseType: "json"
      }
    )
    return res.response.resluts[0].response.doi
  }

  public async getDOIInfo(DOI: string) {
    let data
    if (Object.keys(this.DOIData).indexOf(DOI) != -1) { 
      data = this.DOIData[DOI]
    } else {
      try {
        const unpaywall = `https://api.unpaywall.org/v2/${DOI}?email=zoterostyle@polygon.org`
        let res = await this.Zotero.HTTP.request(
          "GET",
          unpaywall,
          {
            responseType: "json"
          }
        )
        data = res.response
        this.DOIData[DOI] = data
      } catch {
        return false
      }
    }
    return data
  }

}

export default AddonSetting;