import { Addon } from "./addon";
import AddonBase from "./module";

class TransView extends AddonBase {
  popupTextBox: XUL.Textbox;
  tab: XUL.Element;
  tabPanel: XUL.Element;
  standaloneWindow: Window;
  progressWindowIcon: object;
  translateIcon: string;

  constructor(parent: Addon) {
    super(parent);
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: "chrome://zoteropdftranslate/skin/favicon.png",
    };
  }

  async updateTranslatePanel(currentReader: _ZoteroReaderInstance) {
    await Zotero.uiReadyPromise;

    if (!currentReader) {
      return false;
    }
    Zotero.debug("ZoteroPDFTranslate: Update Translate Panels");
    const item = Zotero.Items.get(currentReader.itemID) as Zotero.Item;
    Zotero.debug(
      `${item.getField("title")}, ${currentReader._translateSelectInit}`
    );
    await currentReader._waitForReader();

    await this.buildSideBarPanel();

    this.updateAllTranslatePanelData();

    let disable = this._Addon.translate.getLanguageDisable(undefined);

    // For tab window, pass a undefined currentReader
    // Let the translate code decide which tab is selected
    if (!currentReader._translateSelectInit) {
      currentReader._translateSelectInit = true;
      currentReader._iframeWindow.addEventListener(
        "pointerup",
        ((currentReader, disable) => {
          return (event) => {
            this._Addon.events.onSelect(event, currentReader, disable);
          };
        })(undefined, disable)
      );
    }
  }

  async updateWindowTranslatePanel(currentReader: _ZoteroReaderInstance) {
    await Zotero.uiReadyPromise;

    if (!currentReader) {
      return false;
    }
    Zotero.debug("ZoteroPDFTranslate: Update Window Translate Panels");
    await currentReader._waitForReader();

    const item = Zotero.Items.get(currentReader.itemID) as Zotero.Item;
    Zotero.debug(
      `${item.getField("title")}, ${currentReader._translateSelectInit}`
    );

    let disable = this._Addon.translate.getLanguageDisable(undefined);

    // For standalone window, pass current currentReader
    // Translate code doesn't know which reader is selected
    if (!currentReader._translateSelectInit) {
      currentReader._translateSelectInit = true;
      currentReader._window.addEventListener(
        "pointerup",
        ((currentReader, disable) => {
          return (event) => {
            this._Addon.events.onSelect(event, currentReader, disable);
          };
        })(currentReader, disable)
      );
    }
  }

  async updateTranslateAnnotationButton(reader: _ZoteroReaderInstance) {
    if (!reader) {
      return false;
    }
    await reader._initPromise;
    let updateCount = 0;
    const _document = reader._iframeWindow.document;
    for (const moreButton of _document.getElementsByClassName("more")) {
      if (moreButton.getAttribute("translateinit") === "true") {
        updateCount += 1;
        continue;
      }
      moreButton.setAttribute("translateinit", "true");
      const translateAnnotationButton = _document.createElement("div");
      translateAnnotationButton.setAttribute("style", "margin: 5px;");
      translateAnnotationButton.innerHTML = this.translateIcon;

      let annotationWrapper = moreButton;
      while (!annotationWrapper.getAttribute("data-sidebar-annotation-id")) {
        annotationWrapper = annotationWrapper.parentElement;
      }
      const itemKey = annotationWrapper.getAttribute(
        "data-sidebar-annotation-id"
      );
      const libraryID = (Zotero.Items.get(reader.itemID) as Zotero.Item)
        .libraryID;
      const annotationItem = await Zotero.Items.getByLibraryAndKeyAsync(
        libraryID,
        itemKey
      );

      translateAnnotationButton.addEventListener("click", (e) => {
        this._Addon.translate.callTranslateAnnotation(annotationItem, true);
        e.preventDefault();
      });
      translateAnnotationButton.addEventListener(
        "mouseover",
        (e: XUL.XULEvent) => {
          translateAnnotationButton.setAttribute(
            "style",
            "background: #F0F0F0; margin: 5px;"
          );
        }
      );
      translateAnnotationButton.addEventListener(
        "mouseout",
        (e: XUL.XULEvent) => {
          translateAnnotationButton.setAttribute("style", "margin: 5px;");
        }
      );
      moreButton.before(translateAnnotationButton);
      updateCount += 1;
    }
    return reader.annotationItemIDs.length === updateCount;
  }

  getSideBarOpen(): boolean {
    let _contextPaneSplitterStacked = document.getElementById(
      "zotero-context-splitter-stacked"
    );

    let _contextPaneSplitter = document.getElementById(
      "zotero-context-splitter"
    );

    let splitter =
      Zotero.Prefs.get("layout") == "stacked"
        ? _contextPaneSplitterStacked
        : _contextPaneSplitter;

    return splitter.getAttribute("state") != "collapsed";
  }

  async buildSideBarPanel() {
    Zotero.debug("ZoteroPDFTranslate: buildSideBarPanel");
    let tab = this.tab;
    if (!tab) {
      tab = document.createElement("tab");
      tab.setAttribute("id", "pdf-translate-tab");
      tab.setAttribute(
        "label",
        this._Addon.locale.getString("view", "sidebar_tab_translate_label")
      );
      this.tab = tab;
    }

    // The first tabbox is zotero main pane tabbox
    let n = 0;
    let tabContainer = this._Addon.reader.getReaderTabContainer();
    while (!tabContainer || !tabContainer.querySelector("tabbox")) {
      if (n >= 500) {
        Zotero.debug("ZoteroPDFTranslate: Waiting for reader failed");
        return;
      }
      // For attachments without parent item
      if (tabContainer.querySelector("description")) {
        tabContainer.innerHTML = "";
        const tabbox = window.document.createElement("tabbox");
        tabbox.className = "zotero-view-tabbox";
        tabbox.setAttribute("flex", "1");

        const tabs = window.document.createElement("tabs");
        tabs.className = "zotero-editpane-tabs";
        tabs.setAttribute("orient", "horizontal");
        tabbox.append(tabs);

        const tabpanels = window.document.createElement("tabpanels");
        tabpanels.className = "zotero-view-item";
        tabpanels.setAttribute("flex", "1");

        tabbox.append(tabpanels);
        tabContainer.append(tabbox);
        break;
      }
      await Zotero.Promise.delay(10);
      n++;
    }
    tabContainer = this._Addon.reader.getReaderTabContainer();
    const tabbox = tabContainer.querySelector("tabbox") as HTMLElement;
    tabbox.querySelector("tabs").appendChild(tab);

    let panelInfo = this.tabPanel;
    if (!panelInfo) {
      panelInfo = document.createElement("tabpanel");
      panelInfo.setAttribute("id", "pdf-translate-tabpanel");
      panelInfo.setAttribute("flex", "1");

      let vbox = this.buildTranslatePanel(window);

      let hboxOpenWindow: XUL.Box = document.createElement("hbox");
      hboxOpenWindow.setAttribute(
        "id",
        "pdf-translate-tabpanel-openwindow-hbox"
      );
      hboxOpenWindow.setAttribute("flex", "1");
      hboxOpenWindow.setAttribute("align", "center");
      hboxOpenWindow.maxHeight = 50;
      hboxOpenWindow.minHeight = 50;
      hboxOpenWindow.style.height = "80px";

      let buttonOpenWindow = document.createElement("button");
      buttonOpenWindow.setAttribute(
        "label",
        this._Addon.locale.getString("view", "button_open_window_label")
      );
      buttonOpenWindow.setAttribute("flex", "1");
      buttonOpenWindow.addEventListener("click", (e: XUL.XULEvent) => {
        this._Addon.events.onOpenStandaloneWindow();
      });

      hboxOpenWindow.append(buttonOpenWindow);
      vbox.append(hboxOpenWindow);

      panelInfo.append(vbox);
      this.tabPanel = panelInfo;
    }
    tabbox.querySelector("tabpanels").appendChild(panelInfo);
    // this.sideBarTextboxSource = document.getElementById(
    //   "pdf-translate-tabpanel-source"
    // );
    // this.sideBarTextboxTranslated = document.getElementById(
    //   "pdf-translate-tabpanel-translated"
    // );
    if (Zotero.Prefs.get("ZoteroPDFTranslate.autoFocus")) {
      // @ts-ignore
      tabbox.selectedIndex = Array.prototype.indexOf.call(
        tabbox.querySelector("tabs").childNodes,
        tabbox.querySelector("#pdf-translate-tab")
      );
    } else {
      // @ts-ignore
      tabbox.selectedIndex = tabbox.selectedIndex;
    }
  }

  buildTranslatePanel(_window: Window): XUL.Box {
    let vbox = _window.document.createElement("vbox");
    vbox.setAttribute("id", "pdf-translate-vbox");
    vbox.setAttribute("flex", "1");
    vbox.setAttribute("align", "stretch");
    vbox.style.padding = "0px 10px 10px 10px";

    let hboxTranslate: XUL.Box = _window.document.createElement("hbox");
    hboxTranslate.setAttribute("id", "pdf-translate-tabpanel-engine-hbox");
    hboxTranslate.setAttribute("flex", "1");
    hboxTranslate.setAttribute("align", "center");
    hboxTranslate.maxHeight = 50;
    hboxTranslate.minHeight = 50;
    hboxTranslate.style.height = "80px";

    let hboxLanguage: XUL.Box = _window.document.createElement("hbox");
    hboxLanguage.setAttribute("id", "pdf-translate-tabpanel-language-hbox");
    hboxLanguage.setAttribute("flex", "1");
    hboxLanguage.setAttribute("align", "center");
    hboxLanguage.maxHeight = 50;
    hboxLanguage.minHeight = 50;
    hboxLanguage.style.height = "80px";

    let hboxAnnotation: XUL.Box = _window.document.createElement("hbox");
    hboxAnnotation.setAttribute("id", "pdf-translate-tabpanel-annotation-hbox");
    hboxAnnotation.setAttribute("flex", "1");
    hboxAnnotation.setAttribute("align", "center");
    hboxAnnotation.maxHeight = 50;
    hboxAnnotation.minHeight = 50;
    hboxAnnotation.hidden = true;
    hboxAnnotation.style.height = "80px";

    let hboxCopy: XUL.Box = _window.document.createElement("hbox");
    hboxCopy.setAttribute("id", "pdf-translate-tabpanel-copy-hbox");
    hboxCopy.setAttribute("flex", "1");
    hboxCopy.setAttribute("align", "center");
    hboxCopy.maxHeight = 50;
    hboxCopy.minHeight = 50;
    hboxCopy.style.height = "80px";

    let hboxConcat: XUL.Box = _window.document.createElement("hbox");
    hboxConcat.setAttribute("id", "pdf-translate-tabpanel-concat-hbox");
    hboxConcat.setAttribute("flex", "1");
    hboxConcat.setAttribute("align", "center");
    hboxConcat.maxHeight = 30;
    hboxConcat.minHeight = 30;
    hboxConcat.style.height = "30px";

    let hboxSettings: XUL.Box = _window.document.createElement("hbox");
    hboxSettings.setAttribute("id", "pdf-translate-tabpanel-settings-hbox");
    hboxSettings.setAttribute("flex", "1");
    hboxSettings.setAttribute("align", "center");
    hboxSettings.maxHeight = 30;
    hboxSettings.minHeight = 30;
    hboxSettings.style.height = "30px";

    let SLMenuList = _window.document.createElement("menulist");
    SLMenuList.setAttribute("id", "pdf-translate-sl");
    SLMenuList.style.width = "145px";
    SLMenuList.setAttribute(
      "value",
      Zotero.Prefs.get("ZoteroPDFTranslate.sourceLanguage") as string
    );
    let SLMenuPopup = _window.document.createElement("menupopup");
    SLMenuList.appendChild(SLMenuPopup);
    for (let lang of this._Addon.translate.LangCultureNames) {
      let menuitem = _window.document.createElement("menuitem");
      menuitem.setAttribute("label", lang.DisplayName);
      menuitem.setAttribute("value", lang.LangCultureName);
      menuitem.addEventListener("command", (e: XUL.XULEvent) => {
        let newSL = e.target.value;
        Zotero.Prefs.set("ZoteroPDFTranslate.sourceLanguage", newSL);
      });
      SLMenuPopup.appendChild(menuitem);
    }

    let languageLabel = _window.document.createElement("label");
    languageLabel.setAttribute("id", "pdf-translate-switch");
    languageLabel.setAttribute("flex", "1");
    languageLabel.style["text-align"] = "center";
    languageLabel.style["font-size"] = "14px";
    languageLabel.setAttribute("value", "➡️");
    languageLabel.addEventListener("mouseover", (e: XUL.XULEvent) => {
      e.target.setAttribute("value", "🔃");
    });
    languageLabel.addEventListener("mouseleave", (e: XUL.XULEvent) => {
      e.target.setAttribute("value", "➡️");
    });
    languageLabel.addEventListener("click", (e) => {
      let SLMenu: XUL.Menulist =
        _window.document.getElementById("pdf-translate-sl");
      let TLMenu: XUL.Menulist =
        _window.document.getElementById("pdf-translate-tl");
      let sl = SLMenu.value;
      let tl = TLMenu.value;
      Zotero.Prefs.set("ZoteroPDFTranslate.sourceLanguage", tl);
      Zotero.Prefs.set("ZoteroPDFTranslate.targetLanguage", sl);
      SLMenu.value = tl;
      TLMenu.value = sl;
    });

    let TLMenuList = _window.document.createElement("menulist");
    TLMenuList.setAttribute("id", "pdf-translate-tl");
    TLMenuList.style.width = "145px";
    TLMenuList.setAttribute(
      "value",
      Zotero.Prefs.get("ZoteroPDFTranslate.targetLanguage") as string
    );
    let TLMenuPopup = _window.document.createElement("menupopup");
    TLMenuList.appendChild(TLMenuPopup);
    for (let lang of this._Addon.translate.LangCultureNames) {
      let menuitem = _window.document.createElement("menuitem");
      menuitem.setAttribute("label", lang.DisplayName);
      menuitem.setAttribute("value", lang.LangCultureName);
      menuitem.addEventListener("command", (e: XUL.XULEvent) => {
        let newTL = e.target.value;
        Zotero.Prefs.set("ZoteroPDFTranslate.targetLanguage", newTL);
      });
      TLMenuPopup.appendChild(menuitem);
    }
    hboxLanguage.append(SLMenuList, languageLabel, TLMenuList);

    let menuLabel = _window.document.createElement("label");
    menuLabel.setAttribute(
      "value",
      this._Addon.locale.getString("view", "menu_translate_engine_label")
    );
    let menulist = _window.document.createElement("menulist");
    menulist.setAttribute("id", "pdf-translate-engine");
    menulist.setAttribute("flex", "1");
    menulist.setAttribute(
      "value",
      Zotero.Prefs.get("ZoteroPDFTranslate.translateSource") as string
    );
    let menupopup = _window.document.createElement("menupopup");
    menulist.appendChild(menupopup);
    for (let source of this._Addon.translate.sources) {
      // Skip dict engines
      if (source.indexOf("dict") > -1) {
        continue;
      }
      let menuitem = _window.document.createElement("menuitem");
      menuitem.setAttribute(
        "label",
        this._Addon.locale.getString("translate_engine", source)
      );
      menuitem.setAttribute("value", source);
      menuitem.addEventListener("command", (e: XUL.XULEvent) => {
        let newSource = e.target.value;
        Zotero.Prefs.set("ZoteroPDFTranslate.translateSource", newSource);
        let userSecrets = JSON.parse(
          Zotero.Prefs.get("ZoteroPDFTranslate.secretObj") as string
        );
        this._Addon.events.onTranslateButtonClick(e);
        this._Addon.translate.checkSecret(
          _window,
          newSource,
          userSecrets[newSource]
        );
      });
      menupopup.appendChild(menuitem);
    }

    let buttonTranslate = _window.document.createElement("button");
    buttonTranslate.setAttribute("id", "pdf-translate-call-button");
    buttonTranslate.setAttribute(
      "label",
      this._Addon.locale.getString("view", "button_translate_label")
    );
    buttonTranslate.setAttribute("flex", "1");
    buttonTranslate.addEventListener("click", (e: XUL.XULEvent) => {
      this._Addon.events.onTranslateButtonClick(e);
    });

    hboxTranslate.append(menuLabel, menulist, buttonTranslate);

    let buttonUpdateAnnotation = _window.document.createElement("button");
    buttonUpdateAnnotation.setAttribute(
      "label",
      this._Addon.locale.getString("view", "button_update_annotation_label")
    );
    buttonUpdateAnnotation.setAttribute("flex", "1");
    buttonUpdateAnnotation.addEventListener("click", (e: XUL.XULEvent) => {
      this._Addon.events.onAnnotationUpdateButtonClick(e);
    });

    hboxAnnotation.append(buttonUpdateAnnotation);

    let buttonCopySource = _window.document.createElement("button");
    buttonCopySource.setAttribute(
      "label",
      this._Addon.locale.getString("view", "button_copy_source_label")
    );
    buttonCopySource.setAttribute("flex", "1");
    buttonCopySource.addEventListener("click", (e: XUL.XULEvent) => {
      this._Addon.events.onCopyToClipBoard(this._Addon._sourceText);
    });

    let buttonCopyTranslated = _window.document.createElement("button");
    buttonCopyTranslated.setAttribute(
      "label",
      this._Addon.locale.getString("view", "button_copy_translated_label")
    );
    buttonCopyTranslated.setAttribute("flex", "1");
    buttonCopyTranslated.addEventListener("click", (e: XUL.XULEvent) => {
      this._Addon.events.onCopyToClipBoard(this._Addon._translatedText);
    });

    let buttonCopyBoth = _window.document.createElement("button");
    buttonCopyBoth.setAttribute(
      "label",
      this._Addon.locale.getString("view", "button_copy_both_label")
    );
    buttonCopyBoth.setAttribute("flex", "1");
    buttonCopyBoth.addEventListener("click", (e: XUL.XULEvent) => {
      this._Addon.events.onCopyToClipBoard(
        `${this._Addon._sourceText}\n----\n${this._Addon._translatedText}`
      );
    });

    hboxCopy.append(buttonCopySource, buttonCopyTranslated, buttonCopyBoth);

    let textboxSource: XUL.Textbox = _window.document.createElement("textbox");
    textboxSource.setAttribute("id", "pdf-translate-tabpanel-source");
    textboxSource.setAttribute("flex", "1");
    textboxSource.setAttribute("multiline", true);
    textboxSource.addEventListener("input", (event: XUL.XULEvent) => {
      Zotero.debug(
        `ZoteroPDFTranslate: source text modified to ${event.target.value}`
      );
      this._Addon._sourceText = event.target.value;
      this._Addon.translate._useModified = true;
      if (this._Addon.translate._lastAnnotationID >= 0) {
        this.hideSideBarAnnotationBox(false);
      }
    });
    textboxSource.style["font-size"] = `${Zotero.Prefs.get(
      "ZoteroPDFTranslate.fontSize"
    )}px`;
    textboxSource.style.lineHeight = Zotero.Prefs.get(
      "ZoteroPDFTranslate.lineHeight"
    ) as string;

    let rawResultOrder = Zotero.Prefs.get("ZoteroPDFTranslate.rawResultOrder");
    let splitter = _window.document.createElement("splitter");
    splitter.setAttribute("id", "pdf-translate-tabpanel-splitter");
    splitter.setAttribute("collapse", rawResultOrder ? "after" : "before");
    let grippy = _window.document.createElement("grippy");
    splitter.append(grippy);

    let textboxTranslated: XUL.Textbox =
      _window.document.createElement("textbox");
    textboxTranslated.setAttribute("id", "pdf-translate-tabpanel-translated");
    textboxTranslated.setAttribute("flex", "1");
    textboxTranslated.setAttribute("multiline", true);
    textboxTranslated.addEventListener("input", (event: XUL.XULEvent) => {
      this._Addon._translatedText = event.target.value;
      this._Addon.translate._useModified = true;
      if (this._Addon.translate._lastAnnotationID >= 0) {
        this.hideSideBarAnnotationBox(false);
      }
    });
    textboxTranslated.style["font-size"] = `${Zotero.Prefs.get(
      "ZoteroPDFTranslate.fontSize"
    )}px`;
    textboxTranslated.style.lineHeight = Zotero.Prefs.get(
      "ZoteroPDFTranslate.lineHeight"
    ) as string;

    const cbConcat = _window.document.createElement("checkbox");
    cbConcat.setAttribute("id", "pdf-translate-cbConcat");
    cbConcat.setAttribute(
      "label",
      this._Addon.locale.getString("view", "checkbox_concat_text_label")
    );

    cbConcat.setAttribute(
      "tooltiptext",
      this._Addon.locale.getString("view", "checkbox_concat_text_tip")
    );

    cbConcat.addEventListener("command", (e: XUL.XULEvent) => {
      [
        document.getElementById("pdf-translate-cbConcat"),
        this.standaloneWindow?.document.getElementById(
          "pdf-translate-cbConcat"
        ),
      ]
        .filter((ele) => ele && ele !== e.target)
        .forEach((ele) =>
          ele.setAttribute("checked", e.target.getAttribute("checked"))
        );
    });

    const clearConcat = _window.document.createElement("label");
    clearConcat.setAttribute("id", "pdf-translate-clearconcat");
    clearConcat.setAttribute("flex", "0");
    clearConcat.style["text-align"] = "center";
    clearConcat.setAttribute(
      "value",
      `✕${this._Addon.locale.getString("view", "concatClear")}`
    );
    clearConcat.addEventListener("mouseover", (e: XUL.XULEvent) => {
      e.target.style.backgroundColor = "#ccc";
    });
    clearConcat.addEventListener("mouseleave", (e: XUL.XULEvent) => {
      e.target.style.removeProperty("background-color");
    });
    clearConcat.addEventListener("click", (e) => {
      this._Addon._selectedText = "";
      this.showProgressWindow(
        "PDF Translate",
        this._Addon.locale.getString("view", "concatClearPWText")
      );
    });

    hboxConcat.append(cbConcat, clearConcat);

    const autoTranslate: XUL.Checkbox =
      _window.document.createElement("checkbox");
    autoTranslate.id = "pdf-translate-auto-translate-text";
    autoTranslate.setAttribute(
      "label",
      this._Addon.locale.getString("view", "checkbox_auto_translate_text_label")
    );
    autoTranslate.addEventListener("command", (e) => {
      Zotero.Prefs.set("ZoteroPDFTranslate.enableAuto", autoTranslate.checked);
    });

    const autoTranslateAnnotation: XUL.Checkbox =
      _window.document.createElement("checkbox");
    autoTranslateAnnotation.id = "pdf-translate-auto-translate-annotation";
    autoTranslateAnnotation.setAttribute(
      "label",
      this._Addon.locale.getString(
        "view",
        "checkbox_auto_translate_annotation_label"
      )
    );

    autoTranslateAnnotation.addEventListener("command", (e) => {
      Zotero.Prefs.set(
        "ZoteroPDFTranslate.enableComment",
        autoTranslateAnnotation.checked
      );
    });

    hboxSettings.append(autoTranslate, autoTranslateAnnotation);

    vbox.append(
      hboxTranslate,
      hboxLanguage,
      hboxSettings,
      hboxConcat,
      rawResultOrder ? textboxTranslated : textboxSource,
      splitter,
      rawResultOrder ? textboxSource : textboxTranslated,
      hboxAnnotation,
      hboxCopy
    );
    return vbox;
  }

  checkSideBarPanel() {
    let panel = document.getElementById("pdf-translate-tabpanel");
    if (!panel) {
      this.buildSideBarPanel();
    }
  }


}

export default TransView;
