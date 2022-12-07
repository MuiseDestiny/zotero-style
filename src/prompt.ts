import AddonModule from "./module"

class AddonPrompt extends AddonModule{
  public Zotero: _ZoteroConstructable
  public window: Window
  public document: Document

  public promptNode: any
  public inputNode: any
  public resultsNode: any
  public keyset: XUL.Element

  public maxLineNum = 12
  public lastInputText = ""
  public placeholder = "输入命令..."
  public emptyText = "你来到了荒芜~"
  public errorInputText = "输入不合法，请重新输入"
  public args = null
  public path = []

  public config = {
    "进度条": {
      hotKey: "Style",  // test
      "颜色": {
        type: "set value",
        args: [
          {intro: "请输入颜色", check: (arg)=>{return /#\w+/.test(arg)}}
        ],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressColor")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressColor", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      },
      "透明度": {
        type: "set value",
        args: [
          {intro: "请输入透明度（0到1之间的小数）", check: (arg)=>{return String(Number(arg)) != "NaN"}}
        ],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.progressOpacity")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.progressOpacity", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      },
      "阅读时间": {
        main: () => {
          // get selected
          let item = this.window.ZoteroPane.getSelectedItems()[0] as _ZoteroItem
          const itemTitle = item.getField("title")
          const itemKey = item.key
          const configKey = `${itemTitle} - ${itemKey}`
          if (this._Addon.prompt.config[configKey]) {
            this._Addon.prompt.path = [configKey]
            this._Addon.prompt.render()
          }
          // get time
          let itemRecord = this._Addon.events.record[itemKey] || this._Addon.events.record[itemTitle]
          if (!itemRecord) {
            return this._Addon.prompt.insertEmpty()
          }
          const pageTime = itemRecord.pageTime
          let timeObj = {}
          Object.keys(pageTime).forEach(page=>{
            let sec = pageTime[page]
            let t
            if (sec < 60) {
              t = `${sec}秒`
            } else if (sec / 60){
              t = `${(sec/60).toFixed(1)}分`
            } else {
              t = `${(sec/60/60).toFixed(1)}时`
            }
            timeObj[`第${Number(page)+1}页`] = {hotKey: t}
          })
          
          timeObj["hotKey"] = "阅读时间"
          this._Addon.prompt.config[configKey] = timeObj
          this._Addon.prompt.path = [configKey]
          this._Addon.prompt.render()
        }
      },
      "显示/隐藏": {
        main: () => {
          this.document.querySelectorAll(".zotero-style-progress").forEach(node=>{
            node.setAttribute("visible", String(node.getAttribute("visible") == "false"))
          })
        }
      }
    },
    "标签": {
      hotKey: "Style",
      "对齐": {
        type: "select list",
        list: ["left", "right"],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagAlign")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagAlign", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      },
      "宽度": {
        type: "set value",
        args: [
          {intro: "请输入宽度（单位em）", check: (arg)=>{return String(Number(arg)) != "NaN"}}
        ],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagSize")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagSize", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      },
      "位置": {
        type: "select list",
        list: ["0", "1", "2", "3", "4"],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.tagPosition")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.tagPosition", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      }
    },
    "字段": {
      hotKey: "Style",
      "最大/小化": {
        main: () => {
          let btn = this.document.querySelector("#zotero-tb-switch-itemtree") as HTMLButtonElement
          btn.click()
        }
      },
      "设置最大化时要保留的字段": {
        type: "set value",
        args: [
          {
            intro: "请输入要保留字段列表（输入方式请参考Github介绍）", 
            check: (arg)=>{
              try {
                let arr = eval(arg)
                if (arr.length) {
                  return true
                } else {
                  return false
                }
              } catch {
                return false
              }
            }
          }
        ],
        get: () => {
          return this.Zotero.Prefs.get("Zotero.ZoteroStyle.constantFields")
        },
        set: (args) => {
          this.Zotero.Prefs.set("Zotero.ZoteroStyle.constantFields", args[0])
          this.Zotero.ZoteroStyle.events.refresh()
        }
      }
    },
    "参考文献": {
      hotKey: "Style",
      main: async () => {
        console.log("获取参考文献中...")
        
        let getRefData = async (DOI: string)=> {
          // request or read data
          let refData
          if (Object.keys(this._Addon.DOIData).indexOf(DOI) != -1) { 
            refData = this._Addon.DOIRefData[DOI]
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

        let getDOIInfo = async (DOI: string) => {
          let data
          if (Object.keys(this._Addon.DOIData).indexOf(DOI) != -1) { 
            data = this._Addon.DOIData[DOI]
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
              this._Addon.DOIData[DOI] = data
            } catch {
              return false
            }
          }
          return data
        }

        let inputMessage = (msg: string) => {
          inputNode.value = ""
          inputNode.setAttribute("placeholder", msg)
        }

        const DOIRegex = /10\.\d{4,9}\/[-\._;\(\)\/:A-z0-9]+/
        let resultsNode = this.document.querySelector(".prompt-results") as any
        let inputNode = this.document.querySelector(".prompt input") as any
        
        let reader = this._Addon.events.getReader()
        if (!reader) {
          inputMessage("该功能仅支持在阅读状态下使用")
          return false
        }
        // clear
        resultsNode.querySelectorAll(".suggestion-item").forEach(e=>e.remove())
        // reading paper DOI
        let item = this._Addon.events.getReadingItem()
        let DOI = item.getField("DOI")
        let itemTitle = item.getField("title")
        let itemKey = item.key

        const configKey = `${itemTitle} - ${itemKey}`
        // check local
        if (this._Addon.prompt.config[configKey]) {
          this._Addon.prompt.path = [configKey]
          return this._Addon.prompt.render()
        }
        
        if (!DOIRegex.test(DOI)) {
          // DOI is unvalid, get it from unpaywall
          inputMessage("Get DOI from Unpaywall Api...")
          
          DOI = await getDOIInfo(itemTitle)
        }
        inputMessage("正在获取参考文献列表...")
        // clear historyNode
        let refData = await getRefData(DOI)
        console.log(refData)
        inputMessage(`共得到${refData.length}篇参考文献`)
        // add line
        let reference = {}
        refData.forEach(async (data: any, i: number) => {
          let titleName = "article-title"
          let title = data[titleName]
          let year = data.year
          let author = data.author

          // DOI is needed
          const DOI = data.DOI
          let value = DOI, key = ""
          if (!DOI) { value = title }
          if (!(author && year && title)) {
            if (data.unstructured) {
              data.unstructured = data.unstructured.replace(/<\/?br>/g, "").replace(/\n/g, " ")
              key = `[${i+1}] ${data.unstructured}`
            } else if (DOI) {
              key = `[${i+1}] 从unpaywall更新条目中...`
              // update DOIInfo by unpaywall
              let _data = await getDOIInfo(DOI)
              author = _data.z_authors[0]["family"]
              year = _data.year
              title = _data.title
              key = `[${i+1}] ${author} et al., ${year}. ${title}`
            } 
          } else {
            key = `[${i+1}] ${author} et al., ${year}. ${title}`
          }
          reference[key] = {
            main: async () => {
              if (DOIRegex.test(value)) {
                let DOI = value
                inputMessage(`Start - ${DOI}`)
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
                  inputMessage(`Pending - ${refItem.getField("title")}`)
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
                  inputMessage(`Done - ${refItem.getField("title")}`)
                } catch (e) {
                  inputMessage(`Error - ${e}`)
                }
              } else {
                inputNode.value = value
              }
            }
          }
        })
        inputMessage("Please enter the search text, i.e., Polygon 2022")
        reference["hotKey"] = "参考文献"
        this._Addon.prompt.config[configKey] = reference
        this._Addon.prompt.path = [configKey]
        this._Addon.prompt.render()
      }
    },
    "影响因子": {
      hotKey: "Style",
      next: true,
      main: async () => {
        const publicationTitle = this.window.ZoteroPane.getSelectedItems()[0].getField("publicationTitle")
        console.log(publicationTitle)
        let res = await this.Zotero.HTTP.request(
          "GET",
          `https://www.ablesci.com/journal/index?keywords=${publicationTitle.replace(/ /g, "+")}`,
          {
            responseType: "text",
            credentials: "include"
          }
        )
        let text = res.response
        let matchedArray = text.match(/<table[\s\S]+?<\/table>/g)
        if (matchedArray) {
          this._Addon.prompt.inputNode.setAttribute("placeholder", publicationTitle)
          const tableString = matchedArray[0].replace("36%", "20%")
          const parser = new this.window.DOMParser()
          const table = parser.parseFromString(`<div class="suggestion-item">${tableString}</div>`, "text/html")
          this._Addon.prompt.resultsNode.querySelectorAll(".suggestion-item").forEach(e=>e.remove())
          this._Addon.prompt.resultsNode.appendChild(table.body.firstChild)
        }
      }
    },
    "指派任意颜色位置标签": {
      type: "set value",
      args: [
        {intro: "请输入要指派的标签", check: (arg)=>{return /.+/.test(arg)}},
        {intro: "请输入要指派的颜色", check: (arg)=>{return /#\w+/.test(arg)}}, 
        {intro: "请输入要指派的位置", check: (arg)=>{return /\d+/.test(arg)}}
      ],
      set: (args) => {
        this.Zotero.Tags.setColor(1, args[0], args[1], args[2])
      },
    },
    "横向分割": {
      main: async () => {
        let reader = this._Addon.events.getReader()
        if (!reader) { return }
        await reader.menuCmd("splitHorizontally")
      }
    },
    "竖向分割": {
      main: async () => {
        let reader = this._Addon.events.getReader()
        if (!reader) { return }
        await reader.menuCmd("splitVertically")
      }
    },
  }

  constructor (parent) {
    super(parent)
    console.log("AddonPrompt is called")
  }

  public init(Zotero: _ZoteroConstructable) {
    console.log("AddonPrompt init is called")

    this.Zotero = Zotero
    this.window = this.Zotero.getMainWindow()
    this.document = this.window.document

    Object.assign(this.config, {Zotero: this.Zotero, window: this.window, document: this.document, _Addon: this._Addon})
    this.addStyle()
    this.createHTML()
    this.initInputEvents()
    this.initKeys()
  }

  public getTask() {
    let task = this.config
    this.path.forEach(e=>{
        task = task[e]
      })
    return task
  }

  public async executeTask() {
    let task = this.getTask() as any
    if (task.main && typeof task.main == "function") {
      if ((task.main) instanceof Object.getPrototypeOf(async function(){}).constructor) {
        await task.main()
      } else {
        task.main()
      }
      return true
    } else if (task.type) {
      console.log("return 1")
      switch (task.type) {
        case "set value":
          // hide other items
          this.resultsNode.querySelectorAll(".suggestion-item").forEach(e=>{
            if (!e.classList.contains("is-selected")) {
              e.style.display = "none"
            }
          })
          let setCurrent = () => {
            let oldEle = this.resultsNode.querySelector(".is-selected .suggestion-title .current-value")
            if (oldEle) { oldEle.remove() }
            let value = task.get()
            let isColor = /#\w+/.test(value)
            this.resultsNode.querySelector(".is-selected .suggestion-title")
              .innerHTML += `<span class="current-value" style="${isColor ? `background-color: ${value};` : ""}">${value}</span>`
          }
          // get current value if have
          if (task.get) { setCurrent() }
          // get value from user
          if (this.args == null) {
            // first init
            this.inputNode.value = ""
            this.inputNode.setAttribute("placeholder", task.args[0].intro)
            // prepare for accepting arg
            this.args = []
          } else {
            console.log(this.inputNode.value)
            if (
              this.inputNode.value && 
              task.args[this.args.length].check(this.inputNode.value)
            ) {
              this.args.push(this.inputNode.value)
              this.inputNode.value = ""
            } else {
              this.inputNode.value = ""
              this.inputNode.setAttribute("placeholder", this.errorInputText)
              break
            }
            if (this.args.length < task.args.length) {
              this.inputNode.setAttribute("placeholder", task.args[this.args.length].intro)
            } else {
              task.set(this.args)
              this.args = null
              if (task.get) { setCurrent() }
              this.inputNode.setAttribute("placeholder", this.placeholder)
            }
          }
          break
        case "select list":
          // clear all
          let insertList = () => {
            this.resultsNode.querySelectorAll(".suggestion-item").forEach(e=>e.remove())
            task.list.forEach(text => {
              let item = this.createItem(text)
              if (task.get() == text) {
                item.querySelector(".suggestion-title")
                  .innerHTML += `<span class="current-value">正在使用</span>`
                item.classList.add("is-selected")
              }
              this.resultsNode.appendChild(item)
            })
          }
          if (this.args == null) {
            // first init
            insertList()
            this.args = []
            this.inputNode.setAttribute("placeholder", "请选择")
            break
          }
          this.args.push(
            this.resultsNode.querySelector(".is-selected .suggestion-title span:first-child").innerText
          )
          task.set(this.args)
          this.args = []
          insertList()
          break
      }
      return true
    } else {
      return false
    }
  }

  public render() {
    this.resultsNode.querySelectorAll(".suggestion-item").forEach(e=>e.remove())
    let task = this.getTask()
    const skipKeys = ["Zotero", "document", "window", "hotKey", "_Addon", "enter"]
    const keys = Object.keys(task).filter(e=>skipKeys.indexOf(e)==-1) as string[]
    if (keys.length == 0) {
      // here
      this.insertEmpty()
      return
    }
    console.log(keys)
    keys.forEach(k=>{
      this.resultsNode.appendChild(
        this.createItem(
          k, 
          task[k] && task[k].hotKey
        ), 
      )
    })
    this.resultsNode.querySelector(".suggestion-item:first-child").classList.add("is-selected")
    this.inputNode.setAttribute("placeholder", this.placeholder)
    this.inputNode.focus()
  }

  public createHTML() {
    console.log("create element for prompt")
    let promptNode = this.createElement("div")
    promptNode.setAttribute("class", "prompt")
    promptNode.style.display = "none"

    // prompt-input-container
    let inputContainerNode = this.createElement("div")
    inputContainerNode.setAttribute("class", "prompt-input-container")
    // sub
    let inputNode = this.createElement("input")
    inputNode.setAttribute("class", "prompt-input")
    inputNode.setAttribute("type", "text")
    inputNode.setAttribute("placeholder", this.placeholder)
    inputNode.focus()
    this.inputNode = inputNode
    //sub
    let cta = this.createElement("div")
    cta.setAttribute("class", "prompt-input-cta")
    inputContainerNode.append(inputNode, cta)

    // prompt-results
    let resultsNode = this.createElement("div")
    resultsNode.setAttribute("class", "prompt-results")
    this.resultsNode = resultsNode
    this.render()

    // tip
    let instructionsNode = this.createElement("div")
    instructionsNode.setAttribute("class", "prompt-instructions")
    let ins1 = this.createElement("div")
    ins1.setAttribute("class", "prompt-instruction")
    ins1.innerHTML = `
      <span class="prompt-instruction-command">↑↓</span>
      <span>导航</span>
    `
    instructionsNode.appendChild(ins1)

    let ins2 = this.createElement("div")
    ins2.setAttribute("class", "prompt-instruction")
    ins2.innerHTML = `
      <span class="prompt-instruction-command">enter</span>
      <span>使用</span>
    `
    instructionsNode.appendChild(ins2)

    let ins3 = this.createElement("div")
    ins3.setAttribute("class", "prompt-instruction")
    ins3.innerHTML = `
      <span class="prompt-instruction-command">esc</span>
      <span>返回</span>
    `
    instructionsNode.appendChild(ins3)

    promptNode.append(inputContainerNode, resultsNode, instructionsNode)


    this.document.querySelector('#main-window').appendChild(promptNode)
    this.promptNode = promptNode
  }

  public createItem(content: string, aux: string = "") {
    let itemNode = this.createElement("div")
    itemNode.setAttribute("class", "suggestion-item")

    let contentNode = this.createElement("div")
    contentNode.setAttribute("class", "suggestion-content")
    let titleNode = this.createElement("div")
    titleNode.setAttribute("class", "suggestion-title")
    let span = this.createElement("span")
    span.innerText = content
    titleNode.appendChild(span)
    contentNode.appendChild(titleNode)
    itemNode.appendChild(contentNode)

    let auxNode = this.createElement("div")
    auxNode.setAttribute("class", "suggestion-aux")
    itemNode.appendChild(auxNode)
    
    if (aux) {
      let kbdNode = this.createElement("span")
      kbdNode.setAttribute("class", "suggestion-hotkey")
      kbdNode.innerText = aux
      auxNode.appendChild(kbdNode)
    }
    itemNode.onmousemove = () => {
      this.selectItem(itemNode)
    }
    itemNode.onclick = async () => {
      await this.enter()
    }
    return itemNode
  }

  public async enter() {
    const selectedKey = this.resultsNode.querySelector(".is-selected .suggestion-title span:first-child").innerText
    this.path.push(selectedKey)
    console.log(`this.path.push(${selectedKey})`, this.path)
    if (await this.executeTask()) { 
      let task = this.getTask() as any
      if (task.main && !task.next) {
        let v = this.path.pop()
        console.log(`this.path.pop(${v})`, this.path)
      }
      return 
    }
    this.render()
  }

  public initInputEvents() {
    this.promptNode.addEventListener("keydown", (event)  => {
      if (["ArrowUp", "ArrowDown"].indexOf(event.key) != -1) {
        event.preventDefault();
        // get selected item and index
        let selectedIndex
        let allItems = [...this.resultsNode.querySelectorAll(".suggestion-item")]
          .filter(e=>e.style.display!="none")
        for (let i=0;i<allItems.length;i++) {
          if (allItems[i].classList.contains("is-selected")) {
            selectedIndex = i
            break
          }
        }
        allItems[selectedIndex].classList.remove("is-selected")
        selectedIndex += (event.key == "ArrowUp" ? -1 : 1)
        if (selectedIndex == -1) {
          selectedIndex = allItems.length - 1
        } else if (selectedIndex == allItems.length) {
          selectedIndex = 0
        }
        allItems[selectedIndex].classList.add("is-selected")
        let exceedNum = selectedIndex - this.maxLineNum + 2
        const h = this.resultsNode.scrollHeight / allItems.length
        if (exceedNum > 0) {
          this.resultsNode.scrollTop = exceedNum * h
        } else {
          this.resultsNode.scrollTop = 0
        }
        allItems[selectedIndex].classList.add("is-selected")
      } 
    })

    this.promptNode.addEventListener("keyup", async (event) => {
      if (event.key == "Enter") {
        await this.enter()
        return 
      } else if (event.key == "Escape") {
        console.log(this.path)
        // clear inputNode
        if (this.inputNode.value) {
          this.inputNode.value = ""
        } else {
          // empty node
          let emptyNode = this.resultsNode.querySelector(".suggestion-empty")
          if (emptyNode) { 
            emptyNode.remove() 
            return this.render()
          }
          if (this.path.length) {
            // last arg
            if (this.args) {
              if (this.args.length) {
                this.args.pop()
                await this.executeTask()
                return
              } else {
                this.args = null
              }
            }
            this.path.pop()
            this.render()
          } else {
            this.promptNode.style.display = "none"
          }
        }
      }
      if (
        this.inputNode.value == this.lastInputText || 
        this.args != null
      ) { return }
      let emptyNode = this.resultsNode.querySelector(".suggestion-empty")
      if (emptyNode) { 
        emptyNode.remove()
        return this.render()
      }
      this.resultsNode.querySelectorAll(".suggestion-item .suggestion-title span").forEach(spanNode=>{
        spanNode.innerText = spanNode.innerText
      })
      if (this.inputNode.value.trim().length == 0) {
        [...this.resultsNode.querySelectorAll(".suggestion-item")].forEach(e=>{
          e.style.display = "flex"
        })
      }
      this.lastInputText = this.inputNode.value
      this.render()

      let inputText = this.inputNode.value.replace(/ /g, "")
      let matchedArray = []
      this.resultsNode.querySelectorAll(".suggestion-item").forEach(itemNode=>{
        let spanNode = itemNode.querySelector(".suggestion-title span")
        let spanHTML = spanNode.innerText
        let matchedNum = 0
        let innerHTML = ""
        let tightness = 0
        let lasti = undefined
        for (let i=0;i<spanHTML.length;i++) {
          if (inputText[matchedNum].toLowerCase() == spanHTML[i].toLowerCase()) {
            if (lasti == undefined) {
              lasti = i
            }
            tightness += (i - lasti)
            matchedNum ++
            innerHTML += `<span class="suggestion-highlight">${spanHTML[i]}</span>`
          } else {
            innerHTML += spanHTML[i]
          }
          if (matchedNum == inputText.length) {
            innerHTML += spanHTML.slice(i+1)
            try {
              spanNode.innerHTML = innerHTML
            } catch {
              spanNode.innerHTML = spanHTML
            }
            matchedArray.push([tightness, itemNode, itemNode.innerText])
            break
          }
        }
        itemNode.style.display = "none"
        itemNode.classList.remove("is-selected")
      })
      // select the first 3
      matchedArray = matchedArray.sort((x, y)=>(y[0]-x[0])).slice(-3)
      // compute rmse
      let tightnessArray = matchedArray.map(e=>e[0])
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
      if (v > 200) {
        matchedArray = matchedArray.slice(-1)
      }
      matchedArray.forEach(arr=>arr[1].style.display = "flex")
      console.log(matchedArray)
      if (matchedArray.length > 0) {
        matchedArray[0][1].classList.add("is-selected")
      } else {
        this.insertEmpty()
      }
    })
  }

  public insertEmpty() {
    this.resultsNode.querySelectorAll(".suggestion-item").forEach(e=>e.remove())
    let emptyNode = this.createElement("div")
    emptyNode.setAttribute("class", "suggestion-empty")
    emptyNode.innerText = this.emptyText
    this.resultsNode.appendChild(emptyNode)
  }

  public selectItem(item) {
    this.resultsNode.querySelectorAll(".suggestion-item")
      .forEach(e=>e.classList.remove("is-selected"))
    item.classList.add("is-selected")
  }

  public addStyle() {
    let addCSSLink = (url) => {
      let link = this.createElement("link")
      link.setAttribute("rel", "stylesheet")
      link.setAttribute("type", "text/css")
      link.setAttribute("href", url)
      this.document.querySelector('#main-window').appendChild(link)
    }
    let style = this.createElement("style")
    style.setAttribute('id', 'prompt-style')
    style.innerText = `
      .prompt * {
        box-sizing: border-box;
      }
      .prompt {
        ---radius---: 10px;
        position: fixed;
        left: 25%;
        top: 10%;
        width: 50%;
        border-radius: var(---radius---);
        border: 1px solid #bdbdbd;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: white;
        font-size: 18px;
        box-shadow: 0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
      }
      
      /* 输入区域 */
      .prompt .prompt-input-container  {
        width: 100%;
        margin-top: 2%
      }
      
      .prompt .prompt-input-container .prompt-input {
        width: 94%;
        border: none;
        outline: none;
        margin-left: 3%;
        font-size: 18px;
      }
      
      .prompt-input-cta {
        border-bottom: 1px solid #f6f6f6;  
        margin: 5px auto;
      }
      
      /* 结果区域 */
      .prompt .prompt-results {
        max-height: calc(${this.maxLineNum} * 35.5px);
        width: calc(100% - 12px);
        margin-left: 12px;
        margin-right: 0%;
        overflow-y: auto;
        overflow-x: hidden;
        
      }
      
      .suggestion-item {
        display: flex;
        align-content: baseline;
        justify-content: space-between;
        border-radius: 5px;
        padding: 6px 12px;
        margin-right: 12px;
        margin-top: 2px;
        margin-bottom: 2px;
      }
      .suggestion-item .suggestion-content {
        flex-direction: column;
        overflow: hidden;
        margin-right: auto;
      }
      .suggestion-item .suggestion-content .suggestion-title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .suggestion-item .suggestion-aux {
        display: flex;
        align-items: center;
        align-self: center;
        flex-shrink: 0;
      }
      
      .suggestion-item .suggestion-hotkey {
        font-size: 15px;
        color: #5a5a5a;
        padding: 2px 6px;
        background-color: #fafafa;
        border-radius: 5px;
      }
      
      .suggestion-item.is-selected {
          background-color: rgba(0, 0, 0, 0.075);
      }

      .suggestion-item .suggestion-highlight {
        font-weight: bold;
      }

      .suggestion-empty {
        color: #5a5a5a;
        text-align: center;
        padding: 12px 12px;
        font-size: 18px;
      }
      
      .current-value {
        background-color: #a7b8c1;
        color: white;
        border-radius: 5px;
        padding: 0 5px;
        margin-left: 10px;
        font-size: 14px;
        vertical-align: middle;
        letter-spacing: 0.05em;
      }

      /* 快捷键提示区域 */
      .prompt-instructions {
        display: flex;
        align-content: center;
        justify-content: center;
        font-size: 15px;
        color: rgba(0, 0, 0, 0.4);
        height: 2.5em;
        width: 100%;
        border-top: 1px solid #f6f6f6;
        margin-top: 5px;
      }
      
      .prompt-instruction {
        margin: auto .5em;  
      }
      
      .prompt-instruction-command {
        margin-right: .1em;
        font-weight: 600;
      }
    `
    this.document.querySelector('#main-window').appendChild(style)

    addCSSLink("https://www.ablesci.com/assets/css/global_local.css?v=20221123v1")
    addCSSLink("https://www.ablesci.com/assets/layui/css/layui.css")    
  }

  public createElement(nodeName: string): HTMLElement {
    return this.document.createElementNS("http://www.w3.org/1999/xhtml", nodeName)

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
      let promptNode = document.querySelector(".prompt")
      if (promptNode.style.display == "none") {
        promptNode.style.display = "flex"
        promptNode.querySelector("input").focus()
      } else {
        promptNode.style.display = "none"
      }
    })
    key.setAttribute("key", "p")
    key.setAttribute("modifiers", "shift")
    keyset.appendChild(key)
    this.keyset = keyset
    this.document.getElementById("mainKeyset").parentNode.appendChild(keyset);
  }
}

export default AddonPrompt