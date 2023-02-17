import ReadingHistory from "E:/Github/zotero-reading-history"

export default class Record {
  private readingHistory: ReadingHistory;
  constructor() {
    this.readingHistory = new ReadingHistory({
      pageTotal: true,
      numPages: true
    })
  }
  /**
   * 读取记录，并与Addon Item条目记录的记录合并（如果有）
   * @param item 
   */
  public async getByItem(item: Zotero.Item) {
    const record =  this.readingHistory.getByAttachment(await item.getBestAttachment())?.record
  }
}