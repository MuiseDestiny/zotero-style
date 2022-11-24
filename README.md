# Zotero Style

## 起因
Zotero标签可以显示在标题左侧，有时候条目有不同数量标签，排版特别不美观不利于阅读（强迫症，痛点）。
而且在根据标题查找论文的时候，标题在面板中往往被其它属性挤得只能看清前面几个单词或字，于是增加一个仅`显示标题切换按钮`。

如果你也有类似痛点欢迎提出，我们共同解决。

## 功能预览
原始Zotero
![](https://spr1ng.live/file/d38124d3529d6dd682dd3.png)
开启插件之后
![](https://spr1ng.live/file/28d1ca9d77abb310db2e2.png)
点击按钮之后
![](https://spr1ng.live/file/6bacc5490a52029ff35f6.png)

新特性 - 阅读进度记录（逐页阅读时间记录渲染在标题上）
![](https://spr1ng.live/file/ed09ed3b676eef4d09bd2.png)
![](https://spr1ng.live/file/447b7d8912422770731a5.png)
> 颜色越深阅读时间越久，同时可显示整体阅读进度，这个部分参考<https://github.com/volatile-static/Chartero>，`Chartero`对于这方面实现的更为彻底，本插件相当于实现了一个初级，简化的版本。

按钮详解
![](https://spr1ng.live/file/15deb6f9b3da8f5d6c7de.png)

## 主要功能

1. 标签右对齐，标签由`圆角正方形`->`圆形`🔴🟤🔵
2. 增加`只显示标题`按钮🌸
3. 显示阅读进度，是否划水，一看便知👋

🙌建议配合Zotero Tag使用，本插件无个性化设置界面（其实是我还不会）

## TODO
- [ ] 阅读PDF时，悬停参考文献点击即可快速添加到Zotero
- [ ] 分区影响因子更美观的展示，现有插件是将这些信息写入条目的某些字段下
- [ ] 为插件添加设置界面，比如`颜色设置`，`最大化标题保留字段设置`...
- [ ] 标签指派颜色替换为更好看的颜色或者自定义
- [ ] pdf标注颜色替换或自定义
- [ ] 期待你提出的建议🌸

## 致谢
本插件基于@windingwind的模板<https://github.com/windingwind/zotero-addon-template>，
本插件参考了他的大量代码和教程

感谢@volatile-static的插件`Chartore`<https://github.com/volatile-static/Chartero>