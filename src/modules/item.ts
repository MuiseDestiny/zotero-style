import { log } from "zotero-plugin-toolkit/dist/utils"

class AddonItem  {
	public item!: _ZoteroItem;
	public prefsKey = "Zotero.AddonItem.key";

	constructor() {
	}

	/**
	 * 初始化插件所依赖条目
	 * @returns 
	 */
	public async init() {
		let item: _ZoteroItem
		let addonItemKey = Zotero.Prefs.get(this.prefsKey)
		if (addonItemKey) {
			item = Zotero.Items.getByLibraryAndKey(1, addonItemKey)
			if (item) {
				this.item = item
				return
			}
		}
		// check exist
		let s = new Zotero.Search();
		s.addCondition("title", "contains", "AddonItem");
		var ids = await s.search();
		let items = await Zotero.Items.getAsync(ids);
		if (ids.length) {
			// exist
			log("exist addon item")
			item = items[0]
		} else {
			// create
			console.log("create addon item")
			// @ts-ignore
			item = new Zotero.Item('computerProgram');
			item.setField('title', 'Addon Item');
			await item.saveTx()
		}
		// save
		console.log("save", item.key)
		Zotero.Prefs.set(this.prefsKey, item.key)
		this.item = item
	}

	/**
	 * @param item 哪个item的数据
	 * @param key 数据key 
	 * @param data 数据
	 */
	public async save(item: _ZoteroItem, key: string, data: object) {
		// 搜索本地
		let noteItem
		const ids = item.getNotes()
		for (let id of ids) {
			let _noteItem = await Zotero.Items.getAsync(id)
			if (_noteItem._displayTitle == item.key) {
				noteItem = _noteItem
				break
			}
		}
		// 本地没有创建
		if (!noteItem) {
			//@ts-ignore
			let noteItem = new Zotero.Item('note')
			//@ts-ignore
			noteItem.parentID = this.item.getID();
		}
		// 读取笔记内容
		let allData: {[key: string]: any} = {}
		try {
			allData = JSON.parse(noteItem.note.replace(/<.+?>/g, "").replace(/[^\n\{]+/, ""))
		} catch { }
		allData[key] = data
		noteItem.setNote(`${item.key}\n${JSON.stringify(allData, null, 2)}`)
	}
	
}

export default AddonItem 