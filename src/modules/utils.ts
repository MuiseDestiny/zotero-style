import Requests from "E:/Github/zotero-reference/src/modules/requests";

import localStorage from "./localStorage";
import { config } from "../../package.json";

const utils = {
  requests: new Requests(),
  localStorage: new localStorage(config.addonRef),
  wait(item: Zotero.Item, key: string, local: boolean=true) {
    switch (key) {
      case "publication":
        const publicationTitle = item.getField("publicationTitle")
        if (publicationTitle == "") { return }
        let data
        if (local) {
          data = this.localStorage.get(item, key)
        }
        if (data) { return data }
        // 开启一个异步更新影响因子
        let secretKey = Zotero.Prefs.get(`${config.addonRef}.easyscholar.secretKey`) as string
        window.setTimeout(async () => {
          this.requests.cache = {}
          if (secretKey) {
            let response = await this.requests.get(
              `https://easyscholar.cc/open/getPublicationRank?secretKey=${secretKey}&publicationName=${escape(publicationTitle)}`,
            )
            if (response.code != 200) {
              response = await this.requests.get(
                `https://easyscholar.cc/open/getPublicationRank?secretKey=${secretKey}&publicationName=${publicationTitle}`,
              )
            }
            ztoolkit.log(response)
            if (response && response.data) {
              // 自定义数据集+官方数据集合并
              let officialAllData = response.data.officialRank.all
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
                  let info = customRankInfo.find((i:any) => i.uuid == uuid)
                  officialAllData[info.abbName] = info[rank]
                } catch {}
              })
              console.log(officialAllData)
              if (officialAllData) {
                await this.localStorage.set(item, key, officialAllData)
              }
            }
          } else {
            let response = await this.requests.get(
              `https://easyscholar.cc/homeController/getQueryTable.ajax?sourceName=${escape(publicationTitle)}`,
            ) || await this.requests.get(
              `https://easyscholar.cc/homeController/getQueryTable.ajax?sourceName=${publicationTitle}`,
            )
            console.log(response)
            if (response && response.data) {
              let data = response.data[0]
              if (data) {
                await this.localStorage.set(item, key, data)
              }
            }
          }
        })
        return 
      default:
        break
    }
  }
}

export default utils