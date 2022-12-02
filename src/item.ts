import AddonModule from "./module";


class AddonItem extends AddonModule {
  public addonItem: _ZoteroItem

  constructor(parent) {
    super(parent)
  }

  public async init(Zotero) {
    console.log("AddonItem init is called")
    // create a note in the zotero-style item
    this.Zotero = Zotero
    await this.initAddonItem()
    console.log("AddonItem init is done")

  }

  public async initAddonItem() {
    // check exist
    let s = new this.Zotero.Search;
    s.addCondition("title", "contains", "ZoteroStyle");
    var ids = await s.search();
    let items = await this.Zotero.Items.getAsync(ids);
    let addonItem: _ZoteroItem
    if (ids.length) {
      // have
      console.log("have addon item")
      addonItem = items[0]
    } else {
      // not have, create
      console.log("create addon item")
      addonItem = new this.Zotero.Item('computerProgram');
      addonItem.setField('title', 'ZoteroStyle');
      addonItem.setField('programmingLanguage', 'JSON');
      addonItem.setField('abstractNote', '不要动我，除非你想重置ZoteroStlye的阅读记录');
      addonItem.setField('url', 'https://github.com/MuiseDestiny/ZoteroStyle');
      await addonItem.saveTx()
    }
    this.addonItem = addonItem
  }

  public async createNoteItem() {
    let noteItem = new this.Zotero.Item('note')
    noteItem.parentID = this.addonItem.getID();
    return noteItem
  }

  public async updateNoteItem(data) {
    console.log("update", data)
    // Object.keys(data) includes "title" and "key"
    // get key notitem
    let noteItem = await this.getNoteItem(data.noteTitle)
    if (!noteItem) {
      noteItem = await this.createNoteItem()
    }
    await this.writeDataToNote(data, noteItem)
    return true
  }

  public async writeDataToNote(data, noteItem) { 
    noteItem.setNote(`${data.noteTitle}\n${JSON.stringify(data, null, 2)}`)
    await noteItem.saveTx()
  }

  public readNoteAsData(noteItem) {
    return JSON.parse(noteItem.note.replace(/^.+\n/, ""))
  }

  public async getNoteItem(noteTitle: string) {
    const ids = await this.addonItem.getNotes()
    let noteItem = undefined
    for (let i=0;i<ids.length;i++) {
      let _noteItem = await this.Zotero.Items.getAsync(ids[i])
      if (this.readNoteAsData(_noteItem).noteTitle == noteTitle) {
        noteItem = _noteItem
        break
      }
    }
    return noteItem
  }

  public async readNoteItemsAsData() {
    console.log("readNoteItemsAsData")
    const ids = await this.addonItem.getNotes()
    let data = {}
    ids.forEach(async (id: number)=> {
      let noteItem = await this.Zotero.Items.getAsync(id)
      let noteTitle = this.readNoteAsData(noteItem).noteTitle
      let _data = this.readNoteAsData(noteItem)
      data[noteTitle] = _data
    })
    return data
  }

  public async updateNoteItems(data) {
    console.log("updateNoteItems")
    Object.keys(data).forEach(key => {
      // for old data
      let _data = data[key]
      if (Object.keys(_data).indexOf("noteTitle") == -1) {
        _data.noteTitle = key
      }
      if (Object.keys(_data).indexOf("pageTime") == -1) {
        _data.pageTime = {}
        for (let i=0;i<_data.total;i++) {
          _data.pageTime[i] = _data[i] || 0
        }
      }
      _data.pageNum =  _data.total
      delete _data.total
      this.updateNoteItem(_data)
    })
  }
}

export  default AddonItem 