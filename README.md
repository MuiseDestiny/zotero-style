# Zotero Style
> Zotero can look great.

<img src="addon/chrome/content/icons/favicon.png" width="50px" height="50px">

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-style?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-style/latest/total?color=yellow)

You can upload your screenshots [here](https://github.com/MuiseDestiny/zotero-style/issues/48).

---

This video below will take you quickly through the rest of this readme.

<https://www.bilibili.com/video/BV1as4y1a7Gf>

## Usage

> This plugin modifies some of Zotero's existing fields and adds some interesting ones, and I'll introduce them one by one.

![bandicam-2023-02-23-21-34-45-536](https://user-images.githubusercontent.com/51939531/220922783-b7d78b5f-6cc3-4aff-8581-2e6ca341aec5.gif)

### Title

> Reading progress can visually reflect the distribution of your reading time of each page for the PDF under this item, the darker the color the longer the reading time.

### Tags

> The tags that were originally displayed before the title are separated into this separate `Tags` column.

### Progress

> It can visually represent the annotation of each page of the PDF corresponding to the item.

### #Tags

> It differs from Tags in that it renders the text directly. You can create a tag that starts with `#` to try it out.


## 字段

新增了一些可视化字段，style最初只可视化了标题进度条，新版本将赋予style更广泛的含义

在此感谢[@windingwind](https://github.com/MuiseDestiny/zotero-plugin-toolkit)开发的工具箱，有了工具箱style的一些奇思妙想才得以实现

![image](https://user-images.githubusercontent.com/51939531/211244957-cc6f293f-ba83-4325-bca0-47b10f461ee3.png)

![image](https://user-images.githubusercontent.com/51939531/212248506-5d89dabb-1f48-4bd7-8c95-32b0d25aab46.png)

![image](https://user-images.githubusercontent.com/51939531/212546513-161c554f-64da-4aa7-a66a-0e84cde26dd5.png)

![f51e6220a859e8fd6a42d0b1878c4ae](https://user-images.githubusercontent.com/51939531/212248788-643e086a-a5b3-427d-abd2-7dd7fdfd4646.png)

![image](https://user-images.githubusercontent.com/51939531/213071592-5657c470-f663-42ed-be31-235302ac1709.png)

![image](https://user-images.githubusercontent.com/51939531/217996561-0bb705b2-252f-4dff-b91f-2ed7a1702c2a.png)


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

经常在`其它/Extra`做一些标注的同学可以试试这个#标签，以后`其它/Extra`会被各种插件使用，用于存储数据，所以在#标签下做备注相对安全。
![image](https://user-images.githubusercontent.com/51939531/216234246-f60a2f8b-4134-4144-a7bf-95436c253d39.png)

你可以设置`Prefix`来满足不同需求，输入示例：
|Prefix|含义|
|--|--|
|#|显示所有以#开头的标签，但会去掉#前缀|
|~~/|除了以/开头的标签外，其他所有标签都显示|
| | 显示所有标签 |

### 期刊标签
> easyscholar API，easyscholar风格，当然你也可以自定义颜色

设置见https://github.com/MuiseDestiny/zotero-style/releases/tag/2.1.3

<details>

<summary>支持字段</summary>
  
 > 摘自easyscholar扩展源码

```ts
ajg
fms
ccf
zju
utd24
sciUp
sciif
sjtu
xju
eii
hhu
zhongguokejihexin
sciwarn
nju
uibe
scu
ahci
cssci
swufe
Custom
cju
xmu
enintro
jci
xdu
ft50
cscd
ssci
cnki
ruc
sci
cufe
sdufe
pku
sciBase
fdu
sciif5
cqu
swjtu
zhintro
cug
```

</details>



<details>

<summary>字段释义</summary>

> 摘自[这里](https://easyscholar.cc/document/detail#%E6%95%B0%E6%8D%AE%E6%9D%A5%E6%BA%90)，下述和它不一致，以它为准
  
|字段|释义|
  |---|---|
|CCF| 《中国计算机学会推荐国际学术会议和期刊、中文科技期刊目录-2019、计算领域高质量科技期刊分级目录》，数据集从高到低分为：A(T1), B(T2), C(T3)。|
|SWUFE|:《西南财经大学学术期刊目录2018》，数据集从高到低分为：A+, A, B, C。|
|CUFE|《中央财经大学期刊目录（2019版）》，数据集从高到低分为：AAA, AA, A。|
|SSCI|《JCR-分区-影响因子-2022(2022.6.28).pdf》，数据集从高到低分为：Q1, Q2, Q3, Q4。|
|SCI|《JCR-分区-影响因子-2022(2022.6.28).pdf》，数据集从高到低分为：Q1, Q2, Q3, Q4。|
|SCIIF|《JCR-分区-影响因子-2022(2022.6.28).pdf》，easyScholar将影响因子从10, 4, 2, 1, 0分为5个等级。|
|JCI|《JCR-分区-影响因子-2022(2022.6.28).pdf》，easyScholar将JCI指数从3, 1, 0.5, 0 分为4个等级。|
|SCIIF(5)|由于还未收集到最新5年影响因子数据，所以仍沿用2021年的数据。easyScholar将5年影响因子从10, 4, 2, 1, 0分为5个等级。|
|AHCI |《JCR-分区-影响因子-2022(2022.6.28).pdf》。该数据集只有一个等级。|
|FDU|《复旦大学学位与研究生教育国内期刊指导目录（2018年1月修订）》，数据集从高到低分为：A, B。|
|SJTU|《上海交通大学SCISCIE论文A档B档期刊分类目录及其他刊物等级参考(2018.5)》，数据集从高到低分为：A, B。|
|XMU|《厦门大学人文社科核心学术期刊目录（2017）》，该数据集只有一个等级：一类。|
|CSSCI|《CSSCI来源期刊、扩展版目录2021-2022》。数据集从高到低分为：CSSCI， CSSCI扩展版。|
|RUC|《中国人民大学核心期刊目录2017》，数据集从高到低分为：A+, A, A-, B。|
|CSCD|《中国科学引文数据库来源期刊列表（2021-2022 年度）》，数据集从高到低分为： 核心库，扩展库。|
|SWJTU|《西南交通大学学术期刊分级目录（2017年修订版）》，数据集从高到低分为：A++, A+, A, B+, B。|
|UIBE|《对外经济贸易大学科研奖励外文核心期刊专题分类目录》,数据集从高到低分为： A, A-, B。|
|PKU|《中文核心期刊要目总览》（2020年版）》，该数据集只有一个等级。|
| XDU|《关于发布《西安电子科技大学高水平期刊目录（2021年）》的通知》，数据集从高到低分为： 一类贡献度，二类贡献度。|
| SDUFE|《山东财经大学学术期刊分类目录》，数据集从高到低分为： 特类期刊, A1, A2, B, C。|
| EI|《CPXSourceList062022.xlsx》，该数据集只有一个等级。|
| NJU|《南京大学超一流、学科群一流、SCI A区和B区期刊目录.xlsx》，数据集从高到低分为： 超一流期刊（学科群一流期刊）, A, B。|
| 中国科技核心期刊目录|《2021年版中国科技核心期刊目录.pdf》, 该数据集只有一个等级。|
| CQU|《重庆大学人文社会科学类、自然科学类期刊分级目录》，数据集从高到低分为：A（权威期刊）， B（重要期刊）， C。|
| HHU|《河海大学高质量论文期刊及学术会议目录（自然科学类，不含计算机科学与技术、软件工程学科）》，数据集从高到低分为：A类，B类，C类。|
| AJG|《ABS-2021.pdf》英文约1700种。数据集从高到低分为：4*, 4, 3, 2, 1 |
| XJU|《新疆大学2020版自然科学、人文社科学术期刊目录，2021年人文社科学术期刊调整目录》。数据集从高到低分为：一区， 二区， 三区，四区， 五区。|
| CUG|《中国地质大学科技类、人文社科类期刊分区总汇》。数据集从高到低分为：T1, T2, T3, T4, T5。|
| FMS|FMS管理科学高质量期刊推荐列表(2022) 。数据集从高到低分为：A(T1), B(T2), C, D。|
| SCU|《四川大学-高质量科技期刊及学术会议分级参考方案（暂行）-2021年4月.xlsx》。数据集从高到低分为：A, A-, B, C, D, E。|
| UTD24|《互联网公开收集》， 该数据集只有一个等级。|
| FT50|《互联网公开收集》 ，该数据集只有一个等级。|
| 中科院升级版|微信小程序：《中科院文献情报分区中心表2022年12月最新》数据集从高到低分为1区，2区，3区，4区。|
| 中科院基础版|微信小程序：《中科院文献情报分区中心表2021年12月最新》数据集从高到低分为1区，2区，3区，4区。|
| 中科院预警|《国际期刊预警名单(试行)-2021.12.31》 ，该数据集只有一个等级。|
| Yangtze|《长江大学自然科学高质量期刊（中国期刊）分级目录（2021版）.pdf》数据集从高到低分为T1, T2, T3。|
| ZJU|《浙江大学国内学术期刊分级目录指南·2020版.pdf》数据集从高到低分为国内一级学术期刊，国内一级核心期刊。|
  
  
</details>




![image](https://user-images.githubusercontent.com/51939531/218376871-016f4810-87a1-45bd-83f5-672d88e8171f.png)


等级是自动匹配的，但我只从easyscholar迁移了一部分（我认为常用的），如你对某个字段有分区需求可以提issue。

### 评级
> 模仿Endnote，评级只需要一步！

![bandicam-2023-02-17-22-03-55-444](https://user-images.githubusercontent.com/51939531/219677090-a88a3d00-01cc-49f3-9d90-5dd1d92fe40f.gif)

### 标注

> PDF标注颜色无限定义

![image](https://user-images.githubusercontent.com/51939531/216866921-1dfff7ea-28c9-46ac-993a-334b3fe415f4.png)

![image](https://user-images.githubusercontent.com/51939531/216866821-acd1836e-53ac-4511-bf75-fa91286ea582.png)
![image](https://user-images.githubusercontent.com/51939531/216866990-63f1c72f-ac5c-4605-94bb-b821189ffeb0.png)
![image](https://user-images.githubusercontent.com/51939531/216867176-b1d19074-c47d-4a54-924d-b3f5dadfc61f.png)


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

已适配`Zotero Night`夜间模式
![image](https://user-images.githubusercontent.com/51939531/216801169-85a941f2-df40-4036-a436-7ef81748e75e.png)


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
- 本插件部分功能基于`Zotero PDF Translate`插件 - https://github.com/windingwind/zotero-pdf-translate
- 本插件感谢[科研通](https://www.ablesci.com/)，[easyscholar](https://easyscholar.cc/console/query)等免费网站
- 部分功能灵感来自[Endnote](https://buy.endnote.com/)
- 部分功能基于[Obsidian](https://help.obsidian.md/Obsidian/Index)
- 本插件感谢提出宝贵意见的同学们

