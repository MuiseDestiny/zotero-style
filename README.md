# Zotero Style

[介绍视频](https://www.bilibili.com/video/BV1PK411o7JN/?share_source=copy_web&vd_source=7b57a26bb78f6cbbfdf8bff111682fa3)

![](https://spr1ng.live/file/8880fce2ffe1b5ead0cd1.png)

<center><font color="deeppink"><b>效果预览</b></font></center>

![](https://spr1ng.live/file/390f08bb91ebff15bb0d1.png)


## 起因
Zotero标签可以显示在标题左侧，有时候条目有不同数量标签，排版特别不美观不利于阅读（强迫症，痛点）。
而且在根据标题查找论文的时候，标题在面板中往往被其它属性挤得只能看清前面几个单词或字，于是增加一个仅`显示标题切换按钮`。

如果你也有类似痛点欢迎提出，我们共同解决。

## 功能预览

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

<center><font color="#2c3e50"><b>按钮详解</b></font></center>

![](https://spr1ng.live/file/87ac5698538744a03d424.png)

#### 设置界面
> 鼠标中键
Mac用户可以设置Zotero.ZoteroStyle.progressOpacity=0来隐藏进度条=window用户鼠标右键
Mac用户同时鼠标中键可能也用不了,可以用`Shift+P`来唤醒设置界面

| 命令 | 示例值 | 描述 |
| ----------- | ----------- | ----------- |
| Zotero.ZoteroStyle.progressColor | '#F06292' | 设置进度条颜色,注意引号,配色网站<https://colorhunt.co/> |
| Zotero.ZoteroStyle.progressOpacity | 0.5 | 设置进度条透明度,0~1 |
| Zotero.ZoteroStyle.tagSize | 8 | 设置标签宽度,单位em | 
| Zotero.ZoteroStyle.constantFields | ['title', 'year'] | 要可以被js的eval函数执行(全英文字符) |

![](https://spr1ng.live/file/7a36a8cf795e1746ddf01.png)

> Tips:
<https://github.com/zotero/zotero/blob/26847c672f62de30bd63d9434a00d6c9f8a5e76c/chrome/locale/zh-CN/zotero/zotero.properties>
搜索itemFields查看所有字段英文名

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

## 主要功能

1. 标签右对齐，标签由`圆角正方形`->`圆形`
2. 增加`只显示标题`按钮🌸
3. 显示阅读进度，是否划水，一看便知👋
4. 本插件可与`Chartero`共存，若安装`Chartero`本插件将不再渲染进度条，因为这一功能我已合并到`Chartero`，而且`Chartero`支持同步数据

🙌建议配合`Zotero Tag`&`Chartero`使用

## TODO
- [ ] 阅读PDF时，悬停参考文献点击即可快速添加到Zotero
- [ ] 分区影响因子更美观的展示，现有插件是将这些信息写入条目的某些字段下
- [x] 为插件添加设置界面，比如`颜色设置`，`最大化标题保留字段设置`...
- [ ] 标签指派颜色替换为更好看的颜色或者自定义
- [ ] pdf标注颜色替换或自定义
- [ ] 阅读进度数据同步至Notion，与Notion联动，我特别喜欢它的Timeline
- [ ] 期待你提出的建议🌸

## 致谢
感谢@windingwind
><https://github.com/windingwind/zotero-addon-template>，
本插件参考了他的大量代码和教程,使用他的框架

感谢@volatile-static的插件`Chartore`
> <https://github.com/volatile-static/Chartero>
