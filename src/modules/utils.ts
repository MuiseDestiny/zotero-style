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
        window.setTimeout(async () => {
          const username = Zotero.Prefs.get(`${config.addonRef}.easyscholar.username`) as string
          const password = Zotero.Prefs.get(`${config.addonRef}.easyscholar.password`) as string
          if (username.length && password.length) {
            await this.requests.get(
              `https://easyscholar.cc/login?userName=${username}&password=${password}`
            )
          }
          const response = await this.requests.post(
            "https://easyscholar.cc/extension/listPublicationRank4",
            {
              publicationName: { "0": publicationTitle }
            }
          )
          console.log(response)
          if (response && response.data) {
            let data = response.data.publicationRankList[0]
            if (data) {
              delete data.tempID
              await this.localStorage.set(item, key, data)
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