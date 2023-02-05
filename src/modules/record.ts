import ReadingHistory from "../../../record/zotero-plugin-toolkit"

const Record = () => {
  const history = new ReadingHistory(undefined, { pageTotal: true, timestamp: true});
  console.log(history)
  Zotero._history = history;
}

export default Record;