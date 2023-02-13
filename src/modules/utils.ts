import Requests from "./requests";
import localSorage from "./localSorage";
import { config } from "../../package.json";

const utils = {
  requests: new Requests(),
  localSorage: new localSorage(config.addonRef),
  wait(item: Zotero.Item, key: string) {
    switch (key) {
      case "publication":
        const publicationTitle = item.getField("publicationTitle")
        if (publicationTitle == "") { return  }
        // const data = ztoolkit.ExtraField.getExtraField(item, key)
        const data = this.localSorage.get(item, key)
        console.log(data)
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
              // ztoolkit.ExtraField.setExtraField(item, key, JSON.stringify(data))
              await this.localSorage.set(item, key, data)
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