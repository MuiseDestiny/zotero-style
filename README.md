# Zotero Style
> Zotero can look great.

<img src="addon/chrome/content/icons/favicon.png" width="36px" height="36px">

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-style?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-style)](https://github.com/MuiseDestiny/zotero-style/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-style/latest/total?color=yellow)

You can upload your screenshots [here](https://github.com/MuiseDestiny/zotero-style/issues/48).

---

## Columns

> This plugin modifies some of Zotero's existing columns and adds some interesting ones, and I'll introduce them one by one.

![bandicam-2023-02-23-21-34-45-536](https://user-images.githubusercontent.com/51939531/220922783-b7d78b5f-6cc3-4aff-8581-2e6ca341aec5.gif)

### Title

> As the background of title, reading progress visually reflect the distribution of your reading time of each page for the PDF under a item, the darker the color the longer the reading time.

### Progress

> It can visually represent the annotation word count of each page of the PDF corresponding to a item.

### Tags

> The tags that were originally displayed before the title are separated into this separate `Tags` column.

### #Tags

> It differs from tags column in that it renders the text directly. You can create a tag that starts with `#` to try it out.

<details>
  
<summary>Column Settings</summary>

 
 **Prefix**
  
|Prefix|Meaning|
|--|--|
| # | Show all tags that start with `#`, but will remove the `#` prefix. |
|~~/ | All tags except those beginning with `/` are displayed |
| /^#(.+)/ | Use the entered regular expression to match the tag, and `(.+)` is the actual displayed tag content. Multiple `(.+)` will be automatically joined. |
  
</details>


### Publication Tags

> It is similar to #Tags, but its tags can generate automatically, which represent the rank of a publication.

<details>
  
<summary>Column Settings</summary>

 
 **Fileds**
  
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

### Rating

> When you select a item, item's rating convert to a wating state, such as five points. Then you can click one point to finish your rating quickly.

## View Group

> This addon and other addons may expand Zotero's columns, but the screen size is limit. We often need to show/hide columns frequently, and View Group makes it easier and quicker.

<details>
  
<summary>Usage</summary>
  
![View Group](https://user-images.githubusercontent.com/51939531/221079177-0d73beed-d63f-4935-a380-f09667d0800c.png)

| Operation | Target | Do |
| --- | --- | --- |
| left click | a view | switch to this view |
| Long press | a view | update its data |
| right click | a view | delete it | 
| left clcik | `Add View` button | save current view |

</details> 
  
## Nested Tags

> Nested tags can recategorize your Zotero items. It could replace Zotero's collection to some extent.

<details> 

You can switch between the nested tags view provided by the plugin and the tags view provided by Zotero itself with ease. 

<summary>Demonstration</summary>

| Nested Tags | Zotero Tags |
|--|--|
|![image](https://user-images.githubusercontent.com/51939531/221401675-fa062110-ab03-4ce8-b528-81f054edf2d1.png)| ![image](https://user-images.githubusercontent.com/51939531/221401658-058cd270-9d7c-4046-adbf-c936f6e7458a.png)|

| Operation | Target | Do |
| -- | -- | -- |
| left click | control icon | ![image](https://user-images.githubusercontent.com/51939531/221461592-72200db4-099c-474f-9364-f73c7499a294.png) |
| left click | tag item | ![image](https://user-images.githubusercontent.com/51939531/221461934-2e309e92-9ad8-4a57-9df9-cdfcf898c3cb.png) |
| right click | tag item | ![image](https://user-images.githubusercontent.com/51939531/221461489-7bfdfd39-1663-4898-8619-c0f1a304dcf7.png) |


**Delete Tag**

> The deletion has prompt, is irreversible, and should be cautious.

![image](https://user-images.githubusercontent.com/51939531/221781981-8faa86f9-2985-459c-a944-c03a1561113c.png)

  
</details> 

## Quick Filtering

> By clicking on the icon representing the item type, you can complete the quick filtering of item types. And repeat the process above to exit filtering. Note this filtering is valid for all collections. But it will exit automatically when you switch to the category filtered item is empty.

## Graph View

> An Obsidian's `inreractive graph` rendered by Obsidian's source code. It can show item's related items visually. And you can locate the Zotero item from the graph node (`click`), and locate the graph node from Zotero item (`ctrl+click`).

 <details>
  
<summary>Demonstration</summary>
   
![Graph View](https://user-images.githubusercontent.com/51939531/221080186-05187a08-c237-43ec-8728-9bc603f0eb4f.gif)
  
</details>


## Frequently Asked Questions

<details>
 
<summary>Where is my tags?</summary>

Two ways display your tags after assigning color and position: (1) you can open the column settings of title and click `Tags` and (2) you can show Tags column that is created by this addon.
  
</details>

## Recommended Links

- <https://www.bilibili.com/video/BV1as4y1a7Gf>
- <https://www.bilibili.com/video/BV1BA411R7hb>
- <https://www.bilibili.com/video/BV1PK411o7JN>
- <https://www.bilibili.com/video/BV1Z44y1D7nP>
- <http://xhslink.com/PnHlCn>
- <http://xhslink.com/iUJlCn>
- <http://xhslink.com/TPJlCn>
- <http://xhslink.com/QSKlCn>
- <http://xhslink.com/yoMlCn>

## Acknowledgements

- This addon thanks to the users who made valuable [comments](https://github.com/MuiseDestiny/zotero-style/issues?q=label:enhancement)
- [zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)
- [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- [chartero](https://github.com/volatile-static/Chartero)
- [zotero-tag](https://github.com/windingwind/zotero-tag)
- [zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate)
- [ablesci](https://www.ablesci.com/)
- [easyscholar](https://easyscholar.cc/console/query)
- [endnote](https://buy.endnote.com/)
- [obsidian](https://help.obsidian.md/Obsidian/Index)
- [tag-wrangler](https://github.com/pjeby/tag-wrangler)

