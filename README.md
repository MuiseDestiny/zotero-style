# Zotero Style
> 让Zotero更有趣


[介绍视频](https://www.bilibili.com/video/BV1PK411o7JN/?share_source=copy_web&vd_source=7b57a26bb78f6cbbfdf8bff111682fa3)


![](https://spr1ng.live/file/aeaa38f1a339537397333.png)

<center><font color="deeppink"><b>效果预览</b></font></center>

![](https://spr1ng.live/file/390f08bb91ebff15bb0d1.png)

![](https://spr1ng.live/file/dd11d8b19009575c7f608.png)

## 起因
Zotero标签可以显示在标题左侧，有时候条目有不同数量标签，排版特别不美观不利于阅读（强迫症，痛点）。
而且在根据标题查找论文的时候，标题在面板中往往被其它属性挤得只能看清前面几个单词或字，于是增加一个仅`显示标题切换按钮`。

如果你也有类似痛点欢迎提出，我们共同解决。


<details>
<summary>功能预览</summary>
<center><font color="#27ae60"><b>原始Zotero</b></font></center>

![](https://spr1ng.live/file/d38124d3529d6dd682dd3.png)

<center><font color="#e74c3c"><b>开启插件</b></font></center>

![](https://spr1ng.live/file/28d1ca9d77abb310db2e2.png)

<center><font color="#8e44ad"><b>点击按钮</b></font></center>

> 全局搜索旁边

![](https://spr1ng.live/file/6bacc5490a52029ff35f6.png)

<center><font color="#16a085"><b>新特性</b></font></center>

> 阅读进度记录（逐页阅读时间记录渲染在标题上）

![](https://spr1ng.live/file/ed09ed3b676eef4d09bd2.png)
![](https://spr1ng.live/file/447b7d8912422770731a5.png)
> 颜色越深阅读时间越久，同时可显示整体阅读进度，这个部分参考<https://github.com/volatile-static/Chartero>，`Chartero`对于这方面实现的更为彻底，本插件相当于实现了一个初级，简化的版本。
</details>

<details>
<summary>按钮详解</summary>

![](https://spr1ng.live/file/87ac5698538744a03d424.png)

</details>

## 设置界面
> 鼠标中键
Mac用户可以设置Zotero.ZoteroStyle.progressOpacity=0来隐藏进度条=window用户鼠标右键
Mac用户同时鼠标中键可能也用不了,可以用`Shift+P`来唤醒设置界面

| 命令 | 默认值 | 描述 | 是否需要重启（默认否） |
| ----------- | ----------- | ----------- | ----------- |
| Zotero.ZoteroStyle.progressColor | '#F06292' | 设置进度条颜色,注意引号,配色网站<https://colorhunt.co/> |  |
| Zotero.ZoteroStyle.progressOpacity | 0.5 | 设置进度条透明度,0~1 |  |
| Zotero.ZoteroStyle.tagSize | 8 | 设置标签宽度,单位em |  |
| Zotero.ZoteroStyle.tagPosition | 4 | 0,1,2,3,4（0就是Zotero不安装插件时候标签在的位置） |  |
| Zotero.ZoteroStyle.tagAlign | left | left,right |  |
| Zotero.ZoteroStyle.constantFields | ['title', 'year'] | 要可以被js的eval函数执行(全英文字符) |  |
| /reference | 无 | 在阅读PDF界面使用，不离开Zotero软件就能导入参考文献 |  | 
| /Zotero.Tags.setColor(1, "tagName", '#AAAAAA', 1) | 在命令中 | 用于指派标签颜色和位置（随心所欲） |  |
| Zotero.ZoteroStyle.gitee=URL#Token | URL#Token | 用于同步阅读进度数据（安装Chartero用户无需同步请忽略此条） | 是 |


> URL是用户的Gitee仓库的一个json文件如`https://gitee.com/MuiseDestiny/BiliBili/blob/master/ZoteroStyle.json`,Token在`https://gitee.com/profile/personal_access_tokens`创建

<details>
<summary>关于同步</summary>

首先，当Zotero被打开，插件初始化过程中会检测是否配置Gitee，若配置，检测是否有本地数据，若有则同步到Gitee（本地记录使命结束，以后都会同步到Gitee的数据）

然后，从Gitee获取记录数据作为一个`record`变量（在打开Zotero时诞生，关闭Zotero时毁灭），变量会记录阅读数据。

以下几种行为会触发将`record`变量更新到Gitee：1.打开一些东西（如file，tab，item）；2.关闭一些东西；3.切换应用；4.关闭Zotero；

除此之外，每一分钟自动更新一次。

当你频繁在A/B电脑切换，需要在AB上分别配置一次Zotero.ZoteroStyle.gitee变量，且两次的URL#Token应相同。
这样AB每次打开都会从Gitee同一文件获取阅读数据，且不断更新。

如果担心数据隐私，可以设置仓库不公开。

</details>


<details>
<summary>部分命令参数图解</summary>

> Zotero.Tags.setColor(1, "tagName", '#AAAAAA', 1)对应下图，第一个1固定，第二个"tagName"是你要改变的标签， '#AAAAAA'对应下图颜色，1对应下图位置，如，假设有标签”a、b、c、d，abcd中a的位置为1，b为2...
![](https://spr1ng.live/file/734085f010b319cb867f4.png)


![](https://spr1ng.live/file/39bbe98fe67f8efd508b7.png)

![](https://spr1ng.live/file/e351445318a956ac10a7a.png)

> Tips:
<https://github.com/zotero/zotero/blob/26847c672f62de30bd63d9434a00d6c9f8a5e76c/chrome/locale/zh-CN/zotero/zotero.properties>
搜索`itemFields`查看所有字段英文名
或者
<https://github.com/zotero/zotero/blob/2271913e491035e200e0ec82f8ace2f45f025588/chrome/content/zotero/itemTreeColumns.jsx>
搜多`dataKey`

如:
| English | Chinese |
| ----------- | ----------- |
| title | 标题 |
| publisher | 出版社 |
| libraryCatalog | 馆藏目录 |
| year | 年 |
| hasAttachment | `回形针` |

按照源码的中英对照应该能正确过滤掉大多数列,但是如果有的过滤不掉可以提issue,我将补充特殊字段表格

如果你想在展开后保留`标题`和`出版社`,
输入命令`Zotero.ZoteroStyle.constantFields=['title', 'publisher']`回车即可
注意`[]`内字段名要用引号引起来,`=`右边应该可以被js的eval函数执行返回一个Array
相关问题<https://github.com/MuiseDestiny/ZoteroStyle/issues/2>

</details>

## 主要功能

1. 标签右对齐，标签由`圆角正方形`->`圆形`
2. 增加`只显示标题`按钮🌸
3. 显示阅读进度，是否划水，一看便知👋
4. 本插件可与`Chartero`共存，若安装`Chartero`本插件将不再渲染进度条，因为这一功能我已合并到`Chartero`，而且`Chartero`支持同步数据（仅安装Style可通过Gitee同步，配置相对繁琐）
5. 阅读界面快速检索参考文献，一键导入并关联至当前文献 （目前实验性功能）
6. 自定义指派标签颜色位置

🙌建议配合`Zotero Tag`&`Chartero`使用
<details>
<summary>部分功能图示</summary>

> 5的图示
![](https://spr1ng.live/file/6c034034afb3f51309a76.png)
![](https://spr1ng.live/file/2c468b2d30abb704b8bf0.png)
![](https://spr1ng.live/file/f64a442981bcb66754feb.png)
![](http://tva1.sinaimg.cn/large/c5826cc9ly1h8k444nnclj20nk03m0w4.jpg)

> 6的图示
![](https://spr1ng.live/file/b7eaf4c526d5109558a9b.png)

</details>


## 安装方法
如果第一次安装，请直接在release界面下载xpi，拖入Zotero的插件界面内，然后重启即可
如果已有ZoteroStyle更新最新版本，请卸载旧版本，重启Zotero后安装新版本

## 修复BUG

1.3.2 - "🌸🌸🌸🌸"类似这种标签会与其他标签重叠，"🌸".length=2

1.2.2 - tagSize返回0或者NaN导致宽度为0，所以不显示标签

## TODO
- [x] 阅读PDF时，悬停参考文献点击即可快速添加到Zotero
- [ ] 分区影响因子更美观的展示，现有插件是将这些信息写入条目的某些字段下
- [x] 为插件添加设置界面，比如`颜色设置`，`最大化标题保留字段设置`...
- [x] 标签指派颜色替换为更好看的颜色或者自定义
- [ ] pdf标注颜色替换或自定义
- [x] 阅读进度数据同步至Notion，与Notion联动，我特别喜欢它的Timeline（过于复杂且网络不稳定，目前已实现基于gitee的同步）
- [ ] 期待你提出的建议🌸

## 致谢
感谢@windingwind
><https://github.com/windingwind/zotero-addon-template>，
本插件参考了他的大量代码和教程,使用他的框架

感谢@volatile-static的插件`Chartore`
> <https://github.com/volatile-static/Chartero>
