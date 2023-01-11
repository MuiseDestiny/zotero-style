const log = console.log
export default class AddonItem {
	public item!: _ZoteroItem;
	public prefKey = "Zotero.AddonItem.key";
	constructor() {
	}

	/**
	 * 初始化插件所依赖条目
	 * @returns 
	 */
	public async init() {
		log("******\n\n")
		log("AddonItem init is called")
		let item: _ZoteroItem;
		let addonItemKey = Zotero.Prefs.get(this.prefKey)
		if (addonItemKey) {
			item = await Zotero.Items.getByLibraryAndKeyAsync(1, addonItemKey)
			if (item) {
				this.item = item
				log("From prefKey")
				log("\n\n******")
				this.hiddenNotes()
				return
			}
		}
		let s = new Zotero.Search();
		s.addCondition("title", "contains", "AddonItem");
		var ids = await s.search();
		let items = await Zotero.Items.getAsync(ids);
		if (ids.length) {
			// exist
			item = items[0]
			log("From local")
		} else {
			// @ts-ignore
			item = new Zotero.Item('computerProgram');
			item.setField('title', 'Addon Item');
			await item.saveTx()
			log("From new")
		}
		Zotero.Prefs.set(this.prefKey, item.key)
		this.item = item
		this.hiddenNotes()
		log("\n\n******")
	}

	/**
	 * @param item 哪个item的数据
	 * @param key 数据key 
	 * @param data 数据
	 */
	public async set(item: _ZoteroItem, key: string, data: object | string) {
		log("set", key, data)
		let noteItem = this.getNoteItem(item) || await this.createoteItem()
		let noteData = this.getNoteData(noteItem)
		noteData[key] = data
		noteItem.setNote(`${item.key}\n${JSON.stringify(noteData)}`)
		await noteItem.saveTx()
	}

	/**
	 * @param item 
	 * @param key 
	 */
	public get(item: _ZoteroItem, key: string) {
		if (!item) { return }
		// 搜索本地
		let noteItem
		try {
			noteItem = this.getNoteItem(item)
		} catch { }
		if (noteItem) {
			return (this.getNoteData(noteItem))[key];
		}
	}

	/**
	 * 获取笔记记录的数据
	 * @param noteItem 
	 * @returns 
	 */
	public getNoteData(noteItem: _ZoteroItem) {
		try {
			return JSON.parse(noteItem.note.replace(/<.+?>/g, "").replace(/[^\n\{]+/, ""))
		} catch {
			return {}
		}
	}

	/**
	 * 创建一个空白笔记
	 * @returns 
	 */
	public async createoteItem() {
		//@ts-ignore
		let noteItem = new Zotero.Item('note')
		noteItem.parentID = this.item.id;
		await noteItem.saveTx()
		return noteItem
	}

	/**
	 * item对应的笔记，根据item.key == noteItem._displayTitle寻找
	 * @param item 
	 * @returns 
	 */
	public getNoteItem(item: _ZoteroItem) {
		const ids = this.item.getNotes()
		const key = item.key
		let noteItem
		for (let id of ids) {
			let idInfo = Zotero.Items.getLibraryAndKeyFromID(id)
			let _noteItem = Zotero.Items.getByLibraryAndKey(idInfo.libraryID, idInfo.key)
			if (_noteItem._displayTitle == key) {
				noteItem = _noteItem
				break
			}
		}
		return noteItem
	}

	public hiddenNotes() {
		const excludeKey = this.item.key
		const search = Zotero.Search.prototype.search;
		Zotero.Search.prototype.search = async function () {
			let ids = await search.apply(this, arguments);
			log("hook ids", ids)
			return ids.filter((id: number) => {
				return Zotero.Items.get(id).parentKey != excludeKey
			})
		}
	}
}