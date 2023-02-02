# Zotero Style
> 做一些简单的可视化，让你的Zotero面板看起来更有趣

[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-style?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-style/latest/total?color=yellow)

诚恳地邀请你，在[这里](https://github.com/MuiseDestiny/zotero-style/issues/48)贴上你的配色，这对以后的主题切换很有帮助！

**这是一个重写的版本，与以往版本有较大差异，安装之前还请阅读本文，再决定是否安装**

如您需要数据迁移（使得新版本能够加载以前的进度），[见此](https://github.com/MuiseDestiny/zotero-style/issues/55)，新版本将不再监督您的清空回收站行为。

安装插件后会产生一个`Addon Item`条目用于数据储存，不要将其删除，如您有更好的数据储存策略（可同步），可反馈[至此](https://github.com/MuiseDestiny/zotero-reference/issues/43)

---

新版本去除了`Shift+P`的设置，取而代之的是更直观的设置弹窗；没有了`>`按钮，取而代之的是`视图组`，视图组的功能包含`>`的全部功能。

新的一年跟着`Zotero Style`从新出发吧。

TODO
- [x] 数据迁移，老版本数据通过shift+p调出命令面板执行迁移

## 字段
新增了一些可视化字段，style最初只可视化了标题进度条，新版本将赋予style更广泛的含义

在此感谢[@windingwind](https://github.com/MuiseDestiny/zotero-plugin-toolkit)开发的工具箱，有了工具箱style的一些奇思妙想才得以实现

![image](https://user-images.githubusercontent.com/51939531/211244957-cc6f293f-ba83-4325-bca0-47b10f461ee3.png)

![image](https://user-images.githubusercontent.com/51939531/212248506-5d89dabb-1f48-4bd7-8c95-32b0d25aab46.png)

![image](https://user-images.githubusercontent.com/51939531/212546513-161c554f-64da-4aa7-a66a-0e84cde26dd5.png)

![f51e6220a859e8fd6a42d0b1878c4ae](https://user-images.githubusercontent.com/51939531/212248788-643e086a-a5b3-427d-abd2-7dd7fdfd4646.png)

![image](https://user-images.githubusercontent.com/51939531/213071592-5657c470-f663-42ed-be31-235302ac1709.png)



### 标题-阅读进度条

PDF每一页阅读时间，颜色越深代表时间越久

支持设置`颜色`和`透明度`，下面是默认值
```ts
zoterostyle.titleColumn.color = "#FFC6D3"
zoterostyle.titleColumn.opacity = "0.7"
```

### 标签

安装插件后，默认将`标题`前面的标签分离为新的一列。这里的标签经过优化，使得emoj（字符）和圆形（html span）对齐。

支持设置`对齐方式`和`标签间距`，下面是默认值
```ts
zoterostyle.tagsColumn.align: "left" | "right" = "left"
zoterostyle.tagsColumn.margin = "0.35"
```

### #标签

标签里以`#`开头的标签，会以文字标签形式展现到这一列。
经常在`其它/Extra`做一些标注的同学可以试试这个#标签，以后`其它/Extra`会被各种插件使用，用于存储数据，所以在#标签下做备注相对安全。
![image](https://user-images.githubusercontent.com/51939531/216234246-f60a2f8b-4134-4144-a7bf-95436c253d39.png)

### 标注
> PDF标注颜色无限定义
![image](https://user-images.githubusercontent.com/51939531/216233926-78fea15c-adbc-47ea-80b0-7d5474051510.png)
![image](https://user-images.githubusercontent.com/51939531/216233948-1cc994cc-1657-41e0-bb28-78eb932c2d91.png)

吐槽一下：这个功能Zotero应该自己实现的。

### 影响因子

从`easyscholar API`获取影响因子，只显示影响因子（中文还没做），并做可视化

TODO
- [ ] 优化中文期刊显示
- [ ] 显示影响因子数值和分区

支持设置`颜色`和`透明度`，下面是默认值
```ts
zoterostyle.IFColumn.color = "#A8D1D1"
zoterostyle.IFColumn.opacity = "0.7"
```

### 进度

`进度`当前记录的是阅读PDF各页面标注分布，2.0.0体现每一页标注的文字数量，比如黄色高亮。

进度有两种样式/风格（style），一种是平滑曲线（line），一种是柱状图（bar）
| line | bar |
|  ----  | ----  |
| ![image](https://user-images.githubusercontent.com/51939531/212294042-cec93a51-94fb-444c-b919-90ecdad90818.png) | ![image](https://user-images.githubusercontent.com/51939531/212294194-0cb93185-94d6-4252-8fa7-b79829b6c77f.png) |

line有一种柔和的美感，bar有一种凌乱的美感

当页数过多，平滑曲线一般也就不平滑了，线看起来不是很美观，所以引入柱状图。

你可以右键单击`进度`，点击`列设置`进行设置


支持设置`渲染图样式`、`颜色`、`透明度`和是否显示曲线转折处`圆圈`，下面是默认值
```ts
zoterostyle.progressColumn.style: "line" | "bar" = "bar"
zoterostyle.progressColumn.color = "#86C8BC"
zoterostyle.progressColumn.opacity = "0.7"
zoterostyle.progressColumn.circle = true
```

## 关系图谱
> 完全借助Obsidian源代码进行渲染，它为你的Zotero面板提供一个全新的视图，并与Zotero本身表格视图产生互动

在[这里](https://forum.obsidian.md/tag/graph-view)，很多用户对Obsidian的关系图谱功能提了许多意见，这是一个强大的功能。
现在以及未来一段时间，这个功能不会向着`炫酷`的方面开发，而是实用。以我个人之力，无法1:1完全复原你在Obsidian上的使用体验，它只是一个**辅助**。

Zotero有`关联文献`功能，那么可视化是必然的，也是刚需的，它可以帮助我们文献库有一个整体的把握，也在促进你多多对文献进行关联。

我先后试过好几种方案，目前绘制关系图谱的工具分两种，一种渲染在canvas上（pixi库，Obsidian目前方案），一种是svg（d3库，Obsidian早期方案）。在性能上canvas是最好的，svg面对大量数据会很卡。

![关系图谱](https://user-images.githubusercontent.com/51939531/215948838-ed88f7b4-dab7-4ae4-8d80-b1ed1f8e3c74.gif)

在`关系图谱`中点击一个节点，会快速定位到该文献。点击任意文献，按住`Ctrl`，会快速定位到`关系图谱`中的节点。

为什么用`ctrl`触发？ctrl本身就是`Zotero`的快捷键，用于展示当前选中文献在哪个文件夹/collection下，会黄色高亮显示，所以这个交互逻辑，ctrl是十分合理的。

当然，你不喜欢这个功能可以`Shift+P`将其关闭。

建议配合[zotero-pdf-preview](https://github.com/windingwind/zotero-pdf-preview)

![image](https://user-images.githubusercontent.com/51939531/214523710-80967ec7-6ef5-45e0-85c8-1f5c6a1536aa.png)


## 视图组功能 

![视图组](https://user-images.githubusercontent.com/51939531/215951572-d30c030d-1376-45fd-adbf-fbb3d7426469.gif)

借助这个功能，你可以从`Zotero`众多字段中任意组合出你经常浏览的视图。

**增删改**
> 如果你当前视图没被保存，不在视图组中，就会出现`新增视图`按钮

![image](https://user-images.githubusercontent.com/51939531/212250960-6771679a-5cc0-430d-96c1-dbf8f24b255b.png)

| 操作 | 对象 | 执行 |
| --- | --- | --- |
| 左击 | 视图组下某一视图 | 切换到该视图 |
| 长按 | 视图组下某一视图 | 更新该视图信息 |
| 右击 | 视图组下某一视图 | 删除该视图 | 
| 左击 | 视图组下`新增视图`按钮 | 保存当前渲染视图 |


## 设置
`Style`插件为你新增的所有列，都可以右键列名（点击不同列对应不同列设置），点击`列设置/column settings`进行更改`颜色/color`、`透明度/opacity`等style，我觉得这样比去首选项快，所以本插件无首选项设置界面。

![image](https://user-images.githubusercontent.com/51939531/212301913-302ceb00-56ec-4d5c-b17e-0f31a81881ef.png)

![image](https://user-images.githubusercontent.com/51939531/212302668-1d8cdb5d-b2b3-4100-873e-18724cbd6041.png)

## 数据存储
![image](https://user-images.githubusercontent.com/51939531/212578908-59d5c850-f321-401e-b97b-2e252e87a609.png)
这个条目下的一个笔记对应Zotero一篇文献的阅读进度数据。

## 致谢
- 本插件基于插件模板开发 - https://github.com/windingwind/zotero-plugin-template
- 本插件基于Zotero工具箱开发 - https://github.com/windingwind/zotero-plugin-toolkit
- 本插件部分代码参考`Chartero` - https://github.com/volatile-static/Chartero
- 本插件参考`Zotero Tag`插件 - https://github.com/windingwind/zotero-tag
