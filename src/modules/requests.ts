
export default class Requests {
  /**
   * Record api response
   */
  public cache: { [key: string]: any } = {}

  async get(url: string, responseType: string = "json", headers: object = {}) {
    const k = JSON.stringify(arguments)
    if (this.cache[k]) {
      return this.cache[k]
    }
    let res = await Zotero.HTTP.request(
      "GET",
      url,
      {
        responseType: responseType,
        headers,
        credentials: "include"
      }
    )
    if (res.status == 200) {
      this.cache[k] = res.response
      return res.response
    } else {
      console.log(`get ${url} error`, res)
    }
  }

  async post(url: string, body: object = {}, responseType: string = "json") {
    const k = JSON.stringify(arguments)
    if (this.cache[k]) {
      return this.cache[k]
    }
    let res = await Zotero.HTTP.request(
      "POST",
      url,
      Object.assign({
        responseType: responseType,
      }, (Object.keys(body).length > 0 ? {
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        // credentials: "include"
      } : {}))
    )
    if (res.status == 200) {
      this.cache[k] = res.response
      return res.response
    } else {
      // window.alert("error" + res.status)
      console.log(`post ${url} error`, res)
    }
  }
}