import AddonModule from "./module";


class AddonItem extends AddonModule {
  public addonItem: _ZoteroItem
  public prefsKey = "Zotero.ZoteroStyle.prefsKey"

  constructor(parent) {
    super(parent)
  }

  public async init(Zotero) {
    // create a note in the zotero-style item
    this.Zotero = Zotero
    await this.initAddonItem()

  }

  public async initAddonItem() {
    let addonItem: _ZoteroItem
    let addonItemKey = this.Zotero.Prefs.get(this.prefsKey)
    if (addonItemKey) {
      addonItem = this.Zotero.Items.getByLibraryAndKey(1, addonItemKey)
      if (addonItem) {
        this.addonItem = addonItem
        return
      }
    }
    // check exist
    let s = new this.Zotero.Search;
    s.addCondition("title", "contains", "ZoteroStyle");
    var ids = await s.search();
    let items = await this.Zotero.Items.getAsync(ids);
    if (ids.length) {
      // have
      console.log("have addon item")
      addonItem = items[0]
    } else {
      // not have, create
      console.log("create addon item")
      addonItem = new this.Zotero.Item('computerProgram');
      addonItem.setField('title', 'ZoteroStyle');
      addonItem.setField('archive', 'ZoteroStyle');
      addonItem.setField('programmingLanguage', 'JSON');
      addonItem.setField('abstractNote', '这是Zotero Style插件生成的条目，用于记录阅读数据');
      addonItem.setField('url', 'https://github.com/MuiseDestiny/ZoteroStyle');
      await addonItem.saveTx()
    }
    // save
    console.log("save", addonItem.key)
    this.Zotero.Prefs.set(this.prefsKey, addonItem.key)
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
    let noteItem = await this.getNoteItem(data.noteKey)
    if (!noteItem) {
      noteItem = await this.createNoteItem()
    }
    await this.writeDataToNote(data, noteItem)
    return true
  }
  

  public async writeDataToNote(data, noteItem) {
    noteItem.setNote(`${(data.title || data.noteKey).replace(/[\{\}]/g, "")}\n${JSON.stringify(data, null, 2)}`)
    await noteItem.saveTx()
  }

  public readNoteAsData(noteItem) {
    try {
      return JSON.parse(noteItem.note.replace(/<.+?>/g, "").replace(/[^\n\{]+/, ""))
    } catch {
      console.log(noteItem.note, "cannot parse")
      return {noteKey: undefined}
    }
  }

  public async getNoteItem(noteKey: string) {
    const ids = await this.addonItem.getNotes()
    let noteItem = undefined
    for (let i=0;i<ids.length;i++) {
      let _noteItem = await this.Zotero.Items.getAsync(ids[i])
      let _data = this.readNoteAsData(_noteItem)
      let _noteKey = _data.noteKey || _data.noteTitle
      if (_noteKey == noteKey) {
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
      let _data = this.readNoteAsData(noteItem)
      data[_data.noteKey] = _data
    })
    return data
  }

  public async updateNoteItems(data) {
    console.log("updateNoteItems")
    Object.keys(data).forEach(key => {
      // for old data
      let _data = data[key]
      if (!_data.noteKey) {
        _data.noteKey = key
      }
      if (!_data.pageTime) {
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