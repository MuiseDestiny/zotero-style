import Requests from "./requests";
import localStorage from "./localStorage";
import { config } from "../../package.json";

const utils = {
  requests: new Requests(),
  localStorage: new localStorage(config.addonRef),
  wait(item: Zotero.Item, key: string) {
    switch (key) {
      case "publication":
        const publicationTitle = item.getField("publicationTitle")
        if (publicationTitle == "") { return  }
        const data = this.localStorage.get(item, key)
        if (data) { return data }
        // 开启一个异步更新影响因子
        window.setTimeout(async () => {
          const response = await this.requests.post(
            "https://easyscholar.cc/homeController/getQueryTable.ajax",
            {
              page: "1",
              limit: "1",
              sourceName: publicationTitle
            }
          )
          if (response && response.data) {
            let data = response.data[0]
            if (data) {
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