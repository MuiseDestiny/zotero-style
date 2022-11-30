import CryptoJS from 'crypto-js'


class Gitee {
  public Zotero: _ZoteroConstructable;
  public access_token: string;
  public owner: string;
  public repo: string;
  public path: string;

  constructor() {
    console.log("Gitee constructor is called")
  }

  public init(Zotero: _ZoteroConstructable, access_token: string, owner: string, repo: string, path: string) {
    this.Zotero = Zotero;
    this.access_token = access_token;
    this.owner = owner;
    this.repo = repo;
    this.path = path;
    console.log(this.access_token,this.owner, this.repo, this.path)
  }

  public async updateFile(text: string, message: string = "update") {
    console.log("gitee update...")
    let data = {
        access_token: this.access_token,
        content: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)),
        sha: (await this.getContent()).sha,
        message: message
    }
    let res = await this.Zotero.HTTP.request(
      "PUT",
      `https://gitee.com/api/v5/repos/${this.owner}/${this.repo}/contents/${this.path}`, 
      {
        responseType: "json",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify(data)
      }
    )
    return res.response
  }

  public async getContent() {
    let res = await this.Zotero.HTTP.request(
      "GET",
      `https://gitee.com/api/v5/repos/${this.owner}/${this.repo}/contents/${this.path}?access_token=${this.access_token}`, 
      {
        responseType: "json"
      }
    )
    let response = res.response
    response.content = CryptoJS.enc.Base64.parse(response.content).toString(CryptoJS.enc.Utf8)
    return res.response
  }
}


export default Gitee;