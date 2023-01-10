const marker = 'StyleMonkeyPatched'

export function repatch(object, method, patcher) {
  var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
    Components.interfaces.nsISupports
  ).wrappedJSObject;
  object[method] = patcher(object[method], Zotero)
  object[method][marker] = true
}

export function patch(object, method, patcher) {
  if (object[method][marker]) throw new Error(`${method} re-patched`)
  repatch(object, method, patcher)
}

const Functions = {
  _renderPrimaryCell(primaryCell: any, args: any[], Zotero: any): any {
    // https://github.com/zotero/zotero/blob/1c8554d527390ab0cda0352e885d461a13af767c/chrome/content/zotero/itemTree.jsx
    // 2693     _renderPrimaryCell(index, data, column)
    let events = Zotero.ZoteroStyle.events 
    const itemKey = Zotero.getMainWindow().ZoteroPane.getSortedItems()[args[0]].key
    let document = Zotero.getMainWindow().document
    let createElement = (name) => document.createElementNS("http://www.w3.org/1999/xhtml", name)
    let getEmojLength = (emoj) => {
      let encodeEmoj = encodeURIComponent(emoj)
      let emojLength = emoj.length
      let encodeEmojSet = new Set()
      const step = encodeEmoj.length / emojLength
      for (let i=0;i<emojLength;i++) {
        encodeEmojSet.add(encodeEmoj.slice(i*step, i*step+step))
      }
      if ([...encodeEmojSet].length == 1) { return emojLength }
      emojLength = encodeEmoj.match(new RegExp([...encodeEmojSet].join(""), "g")).length
      return emojLength
    }
    // render the tag
    // let obj = Zotero.ZoteroStyle.events
    let tagPosition = events.getValue("Zotero.ZoteroStyle.tagPosition", events.tagPosition)
    if (tagPosition > 0) {
      let tagBoxNode = createElement("span")
      tagBoxNode.setAttribute("class", "tag-box")
      // special algin between font and span
      let tagAlign = events.getValue("Zotero.ZoteroStyle.tagAlign", events.tagAlign)
      let preTagNum = 0
      primaryCell.querySelectorAll(".tag-swatch").forEach((tagNode: any) => {
        let delta = 0
        if (tagNode.style.backgroundColor.includes("rgb")) {
          tagNode.classList.add("zotero-tag")
          delta = .25
          // change its color
        }
        // tagNode.style[tagAlign] = `${preTagNum*1.25+delta}em`
        tagNode.style[tagAlign] = `${preTagNum*1.375+delta}em`
        tagBoxNode.appendChild(tagNode)
        preTagNum += 1
        // length compute, because "🌸".length = 2
        let emojLength = getEmojLength(tagNode.innerText)
        if (emojLength > 1) {
          preTagNum += (emojLength - 1)
        }
      })
      
      switch (tagPosition) {
        case 4:
          primaryCell.appendChild(tagBoxNode)
          break
        case 3:
          primaryCell.insertBefore(tagBoxNode, primaryCell.childNodes[2])
          break
        case 2:
          primaryCell.insertBefore(tagBoxNode, primaryCell.childNodes[1])
          break
        case 1:
            primaryCell.insertBefore(tagBoxNode, primaryCell.childNodes[0])
            break
        default:
          console.log(`Not Support tagPosition=${tagPosition}`)
      }
    }
    if (primaryCell.querySelector(".zotero-style-progress")) {
      return primaryCell
    }
    // render the read progress
    let progressNode = createElement("span")
    progressNode.setAttribute("class", "zotero-style-progress")
    progressNode.setAttribute("visible", Zotero.ZoteroStyle.events.getValue("Zotero.ZoteroStyle.progressVisible", "true"))
    primaryCell.appendChild(progressNode)
    primaryCell.querySelector(".cell-text").style.zIndex = "999"
    // create sub span in this progress node
    const title = args[1]
    let recordTimeObj = Zotero.ZoteroStyle.events.record[itemKey] || Zotero.ZoteroStyle.events.record[title]
    if (Zotero.ZoteroStyle.events.record && recordTimeObj) {
      const pageNum = recordTimeObj.pageNum
      let maxSec = 0
      let s = 0
      let n = 0
      for (let i=0; i<pageNum; i++) {
        if (!(recordTimeObj.pageTime[i])) continue
        if (recordTimeObj.pageTime[i] > maxSec) {
          maxSec = recordTimeObj.pageTime[i]
        }
        s += recordTimeObj.pageTime[i]
        n += 1
      }
      const meanSec = s / n
      maxSec = meanSec + (maxSec - meanSec) * .5
      const minSec = 60
      const pct = 1 / pageNum * 100
      let progressColor = events.getValue("Zotero.ZoteroStyle.progressColor", events.progressColor)
      let [r, g, b] = events.toRGB(progressColor)
      for (let i=0; i<pageNum; i++) {
        // pageSpan represent a page, color represent the length of read time
        let pageSpan = createElement("span")
        let alpha = (recordTimeObj.pageTime[i] || 0) / (maxSec > minSec ? maxSec : minSec)
        pageSpan.style = `
          width: ${pct}%;
          height: 100%;
          background-color: rgba(${r}, ${g}, ${b}, ${alpha < 1 ? alpha : 1});
          display: inline-block;
        `
        progressNode.appendChild(pageSpan)
      }   
    }
    return primaryCell
  },
  _renderCell(cell: any, args: any[], Zotero: any): any {
    let events = Zotero.ZoteroStyle.events 
    const prefsKey = "Zotero.ZoteroStyle.constantFields"
    let constantFields = events.getValue(prefsKey, events.constantFields)
    if (
      constantFields.filter(
        fieldName => cell.classList.contains(fieldName)
      ).length == 0
    ) {
      if (events.mode === "max") {
        cell.style.display = "none"
      }
    }
    return cell
  }
}

export function stylePatch(object, method) {
  patch(
    object, method, 
    (original, Zotero) => function (...args) {
      let obj = original.apply(this, args)
      if (Zotero.ZoteroStyle) {
        return Functions[method](obj, args, Zotero)
      } else {
        return obj
      }
    }
  )
} 

