
import { config } from "../../package.json";

class LocalStroge {
  private filename: string;
  private cache: any;
  private pending = false
  constructor(name: string) {
    const window = Zotero.getMainWindow();
    const temp = Zotero.getTempDirectory();
    // @ts-ignore
    this.filename = window.OS.Path.join(temp.path.replace(temp.leafName, ""), `${name}.json`);
    console.log(this.filename)
    window.setTimeout(async () => {
      await this.init()
    })
  }

  async init() {
    this.pending = true
    try {
      const rawString = await Zotero.File.getContentsAsync(this.filename) as string
      this.cache = JSON.parse(rawString)
    } catch {
      this.cache = {}
    }
    this.pending = false
  }

  get(item: Zotero.Item, key: string) {
    if (this.cache == undefined) { return }
    return (this.cache[item.id] ??= {})[key]
  }

  async set(item: Zotero.Item, key: string, value: any) {
    if (!this.cache && !this.pending) { await this.init() }
    (this.cache[item.id] ??= {})[key] = value
    window.setTimeout(async () => {
      await Zotero.File.putContentsAsync(this.filename, JSON.stringify(this.cache));
    })
  }
}

export default LocalStroge

