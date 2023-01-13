# Zotero Style
> 做一些简单的可视化，让你的Zotero面板看起来更有趣

诚恳地邀请你，在[这里](https://github.com/MuiseDestiny/zotero-style/issues/48)贴上你的配色，这对以后的主题切换很有帮助！

**这是一个重写的版本，与老版本有巨大差异，安装之前还请阅读本文，在决定是否安装**

首先，新版本去除了`Shift+P`，取而代之的是更直观的设置弹窗；没有了`>`按钮，取而代之的是`视图组`，视图组的功能包含`>`的全部功能。

新版本暂不读取老版本数据。新的一年跟着`Zotero Style`从新出发吧。（如果你需要，我可以做数据迁移功能）

## 字段
新增了一些可视化字段，style最初只可视化了标题进度条，新版本对它扩展更广阔的含义

在此感谢[@windingwind](https://github.com/MuiseDestiny/zotero-plugin-toolkit)开发的工具箱，有了工具箱style的一些奇思妙想才得以实现

![image](https://user-images.githubusercontent.com/51939531/211244957-cc6f293f-ba83-4325-bca0-47b10f461ee3.png)

![image](https://user-images.githubusercontent.com/51939531/212248506-5d89dabb-1f48-4bd7-8c95-32b0d25aab46.png)

![f51e6220a859e8fd6a42d0b1878c4ae](https://user-images.githubusercontent.com/51939531/212248788-643e086a-a5b3-427d-abd2-7dd7fdfd4646.png)


### 标题-阅读进度条

PDF每一页阅读时间，颜色越深代表时间越久

支持设置`颜色`和`透明度`，下面是默认值
```ts
zoterostyle.titleColumn.color = "#FFC6D3"
zoterostyle.titleColumn.opacity = "0.7"
```

### 标签

安装插件后，默认将`标题`前面的标签分离为新的一列。这里的标签经过优化，使得emoj和圆形对齐。（Window上完全对齐，Mac上没有测试）

支持设置`对齐方式`和`标签间距`，下面是默认值
```ts
zoterostyle.tagsColumn.align: "left" | "right" = "left"
zoterostyle.tagsColumn.margin = "0.35"
```

### 影响因子

从`easyscholar API`获取影响因子，只显示影响因子（中文还没做），并做可视化

TODO
- [ ] 优化中文期刊显示

支持设置`颜色`和`透明度`，下面是默认值
```ts
zoterostyle.IFColumn.color = "#A8D1D1"
zoterostyle.IFColumn.opacity = "0.7"
```

### 进度

进度有两种样式/风格（style），一种是平滑曲线（line），一种是柱状图（bar）

当页数过多，平滑曲线一般也就不平滑了，线看起来不是很美观，所以引入柱状图。

你可以右键单击`进度`，点击`列设置`进行设置


支持设置`颜色`、`透明度`和`是否显示曲线转折处`圆圈`，下面是默认值
```ts
zoterostyle.progressColumn.style = "bar"
zoterostyle.progressColumn.color = "#86C8BC"
zoterostyle.progressColumn.opacity = "0.7"
zoterostyle.progressColumn.circle = true
```

## 设置

`Style`插件为你新增的所有列，都可以右键列名（点击不同列对应不同列设置），点击`列设置/column settings`进行更改`颜色/color`、`透明度/opacity`等style，我觉得这样比去首选项快，所以本插件无首选项设置界面。

![image](https://user-images.githubusercontent.com/51939531/212249443-2fec94a5-a36d-40c4-b59d-2f2e6d83982d.png)


## 视图组功能
![image](https://user-images.githubusercontent.com/51939531/211489602-5081d55f-cdd2-4df1-9e26-2038a0a91b6f.png)
借助这个功能，你可以从`Zotero`众多字段中任意组合出你经常浏览的视图。

下面跟着我来新建一个视图吧：
第一步，右键任意列，勾选或取消勾选你需要显示或不需要显示的列，

![image](https://user-images.githubusercontent.com/51939531/211495084-34cf2702-72b1-41e8-a606-569177194b5e.png)

第二步，仍然是右键任意列，鼠标移动到最后一个选项`视图组`，点击最后一个按钮`新增视图`，

![image](https://user-images.githubusercontent.com/51939531/212251408-d8ca84d6-d831-460e-a1fe-4dba629ada78.png)

不出意外的话，会有一个弹窗出现，

![image](https://user-images.githubusercontent.com/51939531/212251522-e9963319-b1a2-43b8-9159-5cf24546a00e.png)

在这里你可以为当前视图起一个名字，指派它的优先排列位置，做一些备注，比如下面这样，

![image](https://user-images.githubusercontent.com/51939531/212251686-1606edce-31a2-4db1-88c1-d71cc0198f10.png)

点击添加后，这里会显示出当前所有视图按钮，并一会自动消失。

![image](https://user-images.githubusercontent.com/51939531/212252957-1c4071fd-023d-480f-a0c0-6d82acccdcd5.png)

到此，你已经成功添加了一个视图到视图组中。

你可以通过那些一闪而过的小圆点里切换它们，鼠标悬停会为你提示你刚写的名称和备注。你不找小圆点（鼠标不靠近它），小圆点不会出现（避免突兀）。

![image](https://user-images.githubusercontent.com/51939531/212253162-accfd330-8d97-42f7-b017-fb891d3f9b5e.png)


**增删改**
> 如果你当前视图没被保存，不在视图组中，就会出现`新增视图`按钮

![image](https://user-images.githubusercontent.com/51939531/212250960-6771679a-5cc0-430d-96c1-dbf8f24b255b.png)

- 你可以**左击**`视图组`下的已保存的`视图`来切换到它（建议用小圆点切换，更快捷）；

- 你可以**左击**`新增视图`来创建保存当前视图；

- 你可以**长按**一个已有的视图，更新它的的信息。

- 你也可以**右击**一个已有的视图，将它删除。


如果你喜欢本插件，可以点击右上角的星星，这是对我的鼓励。
