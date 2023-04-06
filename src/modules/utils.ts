import Requests from "E:/Github/zotero-reference/src/modules/requests";

import localStorage from "./localStorage";
import { config } from "../../package.json";

let lock: undefined | _ZoteroPromiseObject = undefined
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
        if (data !== undefined) { return data }
        // 开启一个异步更新影响因子
        let secretKey = Zotero.Prefs.get(`${config.addonRef}.easyscholar.secretKey`) as string
        window.setTimeout(async () => {
          this.requests.cache = {}
          if (secretKey) {
            await lock;
            lock = Zotero.Promise.defer()
            let response
            try {
              response = await this.requests.get(
                `https://easyscholar.cc/open/getPublicationRank?secretKey=${secretKey}&publicationName=${encodeURIComponent(publicationTitle)}`,
              )
            } catch { console.log(response) }
            // 延迟
            await Zotero.Promise.delay(1000)
            lock!.resolve()
            if (response && response.data) {
              // 自定义数据集+官方数据集合并
              let officialAllData = response.data.officialRank.all
              if (!officialAllData) {
                return await this.localStorage.set(item, key, "")
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
                  let info = customRankInfo.find((i:any) => i.uuid == uuid)
                  officialAllData[info.abbName] = info[rank]
                } catch {}
              })
              if (officialAllData) {
                await this.localStorage.set(item, key, officialAllData)
                ztoolkit.ItemTree.refresh()
              }
            }
          } else {
            window.alert("温馨提示：请配置easyscholar密钥，配置方法页面已在浏览器打开。\n\nWarm tip: Please configure the easyscholar key, the configuration method page has been opened in your browser.")
            Zotero.launchURL("https://github.com/MuiseDestiny/zotero-style/releases/tag/2.5.1");
            Zotero.launchURL("https://ghproxy.com/https://github.com/MuiseDestiny/zotero-style/releases/tag/2.5.1")
            Zotero.launchURL("https://easyscholar.cc/console/user/open")
          }
        })
        return 
      default:
        break
    }
  }
}

export default utils