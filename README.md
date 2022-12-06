# Zotero Style
> 阅读高能进度条，标签左右对齐，五个自定义位置，标签无限制颜色指派，参考文献快捷导入到文库，感兴趣列一键展开收缩，仿Obsidian命令面板，更多玩法等你探索... 

[介绍视频](https://www.bilibili.com/video/BV1PK411o7JN/?share_source=copy_web&vd_source=7b57a26bb78f6cbbfdf8bff111682fa3)


![image](https://spr1ng.live/file/a7ab76ea6dd691066c9a6.png)

![image](https://spr1ng.live/file/9ff441b61d43753500f64.png)


## 👋起因
Zotero标签可以显示在标题左侧，有时候条目有不同数量标签，排版特别不美观不利于阅读（强迫症，痛点）。
而且在根据标题查找论文的时候，标题在面板中往往被其它属性挤得只能看清前面几个单词或字，于是增加一个仅`显示标题切换按钮`。

```如果你也有类似痛点欢迎提出，我们共同解决。```

## 🕊️使用方法
1. 在本页面右侧点击[Release Page](https://github.com/MuiseDestiny/ZoteroStyle/releases/latest) ，下载最新版xpi后缀文件
2. 打开Zotero，点击顶部`工具`->`插件`，将xpi文件拖入到插件窗口，提示安装窗口，点击安装即可
3. 点击搜索按钮右侧按钮，像是一个`>`或`<`

<details>
<summary>按钮详解</summary>

![](https://spr1ng.live/file/56ee3aa178fa09309d65e.png)

</details>

4. 进行个性化配置，点击任意一个条目，按`Shift+P`唤醒命令行面板，这个面板命令深度仿照Obsidian面板，使用方法与它类似。

<details>
<summary>进度条颜色设置示例</summary>
比如设置进度条颜色，上下键导航到`进度条`选项，

![进度条颜色](https://spr1ng.live/file/e887a728fa9a4ecc05862.png)

回车键进入下一层，因为要调整颜色，所以这里导航到`颜色`，

![颜色](https://spr1ng.live/file/78a823050fc91081c77e8.png)

然后回车，这里会显示，你当前使用的颜色，也就是下图的粉色，这时，你可以在<https://colorhunt.co/>挑选一个你喜欢的颜色，

![设置颜色](https://spr1ng.live/file/e7a7c8dadc0d6fe4d1ba0.png)

然后输入，

![输入颜色](https://spr1ng.live/file/a3451160039d3b6ef0bf2.png)

进一步回车确定，颜色会瞬间被设置为你输入的颜色，`一切`都随之变化~

![回车](https://spr1ng.live/file/04a2a67ba375d15bedca5.png)
</details>

5. 打开一篇文献，试着检索它的参考文献。

<details>
<summary>参考文献示例</summary>
首先，打开一篇文献，Shift+P打开命令行面板，

![](https://spr1ng.live/file/835068aa08605a4d32063.png)

选择参考文献，回车，

![](https://spr1ng.live/file/ad39ee7b253810adac0ce.png)

片刻，你将得到你浏览的这篇文献的参考文献，

![](https://spr1ng.live/file/e595589d1b5c6a7110171.png)

通过在这些结果中搜索，你可以快速找到你感兴趣的参考文献，选中它，回车试试，

![](https://spr1ng.live/file/a39a425b24cea8d9b1962.png)

不出意外的话，又是片刻，你将在关联文献这里看到它的身影，此时你浏览的文献和你选中的文献就被你一根红线签了起来。

![](https://spr1ng.live/file/1dbd90aecaec83765451d.png)
</details>



## 一些说明


1. Zotero Style的阅读进度数据自动同步，无需任何配置
2. 参考文献导入功能与scihub插件不兼容
3. 设置最大化时要保留的字段采用列表形式，列表内记录的是字段的英文名，可在[这里](https://github.com/zotero/zotero/blob/26847c672f62de30bd63d9434a00d6c9f8a5e76c/chrome/locale/zh-CN/zotero/zotero.properties)查看更多字段的英文名

如:
| English | Chinese |
| ----------- | ----------- |
| title | 标题 |
| publisher | 出版社 |
| libraryCatalog | 馆藏目录 |
| year | 年 |
| hasAttachment | `回形针` |


## 重要更新

1.4.0 - 仿Obsidian命令面板

## 修复BUG
1.3.4 - 存在参数为定义获取默认值失败的bug，需要手动设置一下参数，具体步骤为：
shift+p，然后依次输入以下指定并回车
  
```
Zotero.ZoteroStyle.progressOpacity=.7
Zotero.ZoteroStyle.tagSize=5
Zotero.ZoteroStyle.tagPosition=4
Zotero.ZoteroStyle.tagAlign=left
Zotero.ZoteroStyle.progressColor=#5AC1BD
Zotero.ZoteroStyle.constantFields=['hasAttachment', 'title']
Zotero.ZoteroStyle.progressColor=#FF9E9E
```

1.3.2 - "🌸🌸🌸🌸"类似这种标签会与其他标签重叠，"🌸".length=2

1.2.2 - tagSize返回0或者NaN导致宽度为0，所以不显示标签

## TODO
- [x] 阅读PDF时，悬停参考文献点击即可快速添加到Zotero
- [ ] 分区影响因子更美观的展示，现有插件是将这些信息写入条目的某些字段下
- [x] 为插件添加设置界面，比如`颜色设置`，`最大化标题保留字段设置`...
- [x] 标签指派颜色替换为更好看的颜色或者自定义
- [ ] pdf标注颜色替换或自定义
- [x] 阅读进度数据同步至Notion，与Notion联动，我特别喜欢它的Timeline（过于复杂且网络不稳定，目前已实现基于gitee的同步）
- [x] 设置界面更容易理解，分类显示，而不是现在这样有点让人费解（模仿Obsidian）
- [ ] 期待你提出的建议🌸

## 致谢
感谢@windingwind
><https://github.com/windingwind/zotero-addon-template>，
本插件参考了他的大量代码和教程,使用他的框架

感谢@volatile-static的插件`Chartore`
> <https://github.com/volatile-static/Chartero>
