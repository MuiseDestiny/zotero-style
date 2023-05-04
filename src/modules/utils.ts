import Requests from "./requests";

import { config } from "../../package.json";
import LocalStorage from "./localStorage";

const requests = new Requests()

export function getPublicationTitle(item: Zotero.Item) {
  return [item.getField("publicationTitle"), item.getField("proceedingsTitle")].find(i => i.trim().length > 0) || ""
}

/**
 * @param localStorage 
 * @param item 
 * @param tip 
 * @returns -1 失败 0 数据库无信息 1 成功
 */
export async function updatePublicationTags(localStorage: LocalStorage, item: Zotero.Item, tip: boolean = false) {
  const publicationTitle = getPublicationTitle(item)
  let secretKey = Zotero.Prefs.get(`${config.addonRef}.easyscholar.secretKey`) as string
  if (!secretKey) { return -1}
  let response
  try {
    response = await requests.get(
      `https://easyscholar.cc/open/getPublicationRank?secretKey=${secretKey}&publicationName=${encodeURIComponent(publicationTitle)}`,
    )
  } catch { console.log(response) }
  if (response && response.data) {
    // 自定义数据集 + 官方数据集合并
    let officialAllData = {...response.data.officialRank.all}
    if (Object.keys(officialAllData).length === 0) {
      if (tip) {
        new ztoolkit.ProgressWindow("Publication Tags", { closeTime: 3000, closeOtherProgressWindows: true })
          .createLine({ text: "Not Found", type: "default" }).show()
      }
      await localStorage.set(item, "publication", "")
    }
    let customRankInfo = response.data.customRank.rankInfo
    response.data.customRank.rank.forEach((rankString: string) => {
      try {
        // 1613160542602600448&&&2
        let uuid: string, rank: string;
        [uuid, rank] = rankString.split("&&&")
        rank = {
          "1": "oneRankText",
          "2": "twoRankText",
          "3": "threeRankText",
          "4": "fourRankText",
          "5": "fiveRankText"
        }[rank] as string
        let info = customRankInfo.find((i: any) => i.uuid == uuid)
        officialAllData[info.abbName] = info[rank]
      } catch { }
    })
    if (Object.keys(officialAllData).length === 0){
      return 0;
    }
    else{
      await localStorage.set(item, "publication", officialAllData)
      // 显示它支持的所有字段
      if (tip) {
        let popupWin = new ztoolkit.ProgressWindow("Publication Tags", { closeTime: 3000, closeOtherProgressWindows: true }).show()
        popupWin.createLine({ text: publicationTitle, type: "default" })
        Object.keys(officialAllData).forEach(k => {
         popupWin.createLine({ text: `${k}: ${officialAllData[k]}`, type: "success" })
       })
       ztoolkit.ItemTree.refresh()
      }
      return 1
    }
  }
}