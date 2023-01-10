import { log } from "zotero-plugin-toolkit/dist/utils"

export default class Requests {
  /**
 * Record api response
 */
  public cache: any = {}

  async get(url: string, responseType: string = "json") {
    const k = JSON.stringify(arguments)
    if (this.cache[k]) {
      return this.cache[k]
    }
    let res = await Zotero.HTTP.request(
      "GET",
      url,
      {
        responseType: responseType
      }
    )
    if (res.status == 200) {
      this.cache[k] = res.response
      return res.response
    } else {
      log(`get ${url} error`, res)
    }
  }

  async post(url: string, data: object, responseType: string = "json") {
    const k = JSON.stringify(arguments)
    if (this.cache[k]) {
      return this.cache[k]
    }
    let res = await Zotero.HTTP.request(
      "POST",
      url,
      Object.assign({
        responseType: responseType,
      }, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new window.URLSearchParams(Object.entries(data)).toString()
      })
    )
    if (res.status == 200) {
      this.cache[k] = res.response
      return res.response
    } else {
      log(`post ${url} error`, res)
    }
  }
}