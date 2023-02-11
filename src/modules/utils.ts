import Requests from "./requests";

const utils = {
  requests: new Requests(),
  wait(item: Zotero.Item, key: string) {
    switch (key) {
      case "publication":
        const publicationTitle = item.getField("publicationTitle")
        if (publicationTitle == "") { return  }
        const data = ztoolkit.ExtraField.getExtraField(item, key)
        if (data) { return JSON.parse(data) }
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
              ztoolkit.ExtraField.setExtraField(item, key, JSON.stringify(data))
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