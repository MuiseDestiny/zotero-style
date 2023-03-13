import AddonItem from "./item";
import LocalStorage from "./localStorage";

export default class Events {
	public recordInterval = 10;  // s
	public updateInterval = 60;  // s
	public maxHangTime = 60;  // s
	public state = {
		activate: true,
		pageIndex: -1,
		left: -1,
		top: -1,
		hangCount: -1
	}
	public intervalID: number | undefined;
	private storage: AddonItem | LocalStorage;
	private cache: {[key: string]: any} = {};
	constructor(storage: AddonItem) {
		this.storage = storage;
	}

	public onInit() {
		window.addEventListener('activate', async () => {
			this.state.activate = true
			// once Zotero is activated again, it will continue to record read time
			this.intervalID = window.setInterval(async () => {
				await this.listeningReader()
			}, this.recordInterval * 1e3)
		}, true);
		window.addEventListener('deactivate', async () => {
			this.state.activate = false
			this.state.hangCount = 0;
			// once Zotero is deactivate again, it will stop to record read time
			window.clearInterval(this.intervalID)
		}, true);
	}

	public async listeningReader() {
		const reader = this.getReader()
		const item = this.getItem()
		// Zotero is bulr
		if (!(reader && reader.state && this.state.activate && item)) { return }
		ztoolkit.log("listeningReader is running")
		const pageIndex = reader.state.pageIndex;
		if (pageIndex == this.state.pageIndex) {
			if (reader.state.left == this.state.left && reader.state.top == this.state.top)
				this.state.hangCount++;
			else {
				this.state.left = reader.state.left;
				this.state.top = reader.state.top;
				this.state.hangCount = 0;
			}
		} else {
			this.state.pageIndex = pageIndex;
			this.state.hangCount = 0;
		}
		// hang up
		if (this.state.hangCount * this.recordInterval > this.maxHangTime) return;

		// reading, record this recordInterval
		const page = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication.pdfDocument.numPages;

		// 数据挂载
		const cacheKey = `readingTime-${item.key}`
		this.cache[cacheKey] = this.cache[cacheKey] || this.storage.get(item, "readingTime")
		if (!this.cache[cacheKey]) {
			this.cache[cacheKey] = {
				page: page,
				data: {}
			}
		}
		if (this.cache[cacheKey].data[pageIndex]) {
			this.cache[cacheKey].data[pageIndex] += this.recordInterval
		} else {
			this.cache[cacheKey].data[pageIndex] = this.recordInterval
		}
		await this.storage.set(item, "readingTime", this.cache[cacheKey])
	}

	public getReader() {
		return Zotero.Reader.getByTabID(Zotero_Tabs.selectedID) as _ZoteroReaderInstance
	}

	public getItem() {
		let reader = this.getReader()
		if (reader) {
			return (Zotero.Items.get(reader.itemID) as _ZoteroItem).parentItem as _ZoteroItem
		}
	}
}