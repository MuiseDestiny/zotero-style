export default class AddonItem {
	public item!: _ZoteroItem;
	public title = "Addon Item"
	public prefKey = "Zotero.AddonItem.key";
	public cache: {[key: string]: any} = {};
	constructor() {
	}

	/**
	 * 初始化插件所依赖条目
	 * @returns 
	 */
	public async init() {
		ztoolkit.log("******\n\n")
		ztoolkit.log("AddonItem init is called")
		let item: _ZoteroItem;
		let addonItemKey = Zotero.Prefs.get(this.prefKey)
		if (addonItemKey) {
			item = await Zotero.Items.getByLibraryAndKeyAsync(1, addonItemKey)
			if (item) {
				this.item = item
				ztoolkit.log("From prefKey")
				ztoolkit.log("\n\n******")
				this.hiddenNotes()
				return
			}
		}
		let s = new Zotero.Search();
		s.addCondition("title", "contains", this.title);
		var ids = await s.search();
		let items = await Zotero.Items.getAsync(ids);
		ztoolkit.log(items)
		if (ids.length) {
			// exist
			item = items[0]
			ztoolkit.log("From local")
		} else {
			// @ts-ignore
			item = new Zotero.Item('computerProgram');
			item.setField('title', this.title);
			await item.saveTx({ skipSelect : true})
			ztoolkit.log("From new")
		}
		Zotero.Prefs.set(this.prefKey, item.key)
		this.item = item
		this.hiddenNotes()
		ztoolkit.log("\n\n******")
	}

	/**
	 * @param item 哪个item的数据
	 * @param key 数据key 
	 * @param data 数据
	 */
	public async set(item: _ZoteroItem, key: string, data: object | string) {
		let noteItem = this.getNoteItem(item) || await this.createNoteItem()
		let noteData = this.getNoteData(noteItem)
		noteData[key] = data
		noteItem.setNote(`${item.key}\n${JSON.stringify(noteData)}`)
		await noteItem.saveTx({ skipSelect: true })
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
	public async createNoteItem() {
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
		if (!item) { return }
		const key = item.key
		const cacheKey = `getNoteItem-${key}`
		if (this.cache[cacheKey]) { this.cache[cacheKey] }
		const ids = this.item.getNotes()
		let noteItem
		for (let id of ids) {
			let idInfo = Zotero.Items.getLibraryAndKeyFromID(id)
			let _noteItem = Zotero.Items.getByLibraryAndKey(idInfo.libraryID, idInfo.key)
			if (_noteItem._displayTitle.includes(key)) {
				noteItem = _noteItem
				this.cache[cacheKey] = noteItem
				break
			}
		}
		return noteItem
	}

	public hiddenNotes() {
		const excludeKey = this.item.key
		const search = Zotero.Search.prototype.search;
		const itemTitle = this.title
		Zotero.Search.prototype.search = async function () {
			let ids = await search.apply(this, arguments);
			// 只有在搜索结果是笔记时才过滤
			if (
				Zotero.Items.get(ids[0]).itemTypeID == 26 &&
				Zotero.Items.get(ids.slice(-1)[0]).itemTypeID == 26
			) {
				ztoolkit.log("hook ids", ids.length)
				return ids.filter((id: number) => {
					const parentID = Zotero.Items.get(id).parentID
					if (!parentID) { return true }
					const parentItem = Zotero.Items.get(parentID)
					if (!parentItem) { return true }
					return parentItem.key != excludeKey && parentItem.getField("title") != itemTitle
				})
			} else {
				return ids
			}
		}
	}
}