# Zotero Style
> 做一些简单的可视化

`这是一个重写的版本，与老版本有巨大差异，安装之前还请阅读本文，在决定是否安装`

## 字段
新增了一些可视化字段，style最初只可视化了标题进度条，新版本对它扩展更广阔的含义

在此感谢[@windingwind](https://github.com/MuiseDestiny/zotero-plugin-toolkit)开发的工具箱，有了工具箱style的一些奇思妙想才得以实现

![image](https://user-images.githubusercontent.com/51939531/211244957-cc6f293f-ba83-4325-bca0-47b10f461ee3.png)

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

支持设置`颜色`和`透明度`，下面是默认值
```ts
zoterostyle.IFColumn.color = "#A8D1D1"
zoterostyle.IFColumn.opacity = "0.7"
```

### 进度
从条目下面的PDF读取每一页做的标注数量，并以折线图形式呈现

支持设置`颜色`、`透明度`和`是否显示曲线转折处`圆圈`，下面是默认值
```ts
zoterostyle.progressColumn.color = "#86C8BC"
zoterostyle.progressColumn.opacity = "0.7"
zoterostyle.progressColumn.circle = true
```

## 设置
设置面板还没做出，在考虑放在首选项还是和之前一样`Shift+P`设置。
但让然可以设置，现在跟着我进行一些设置吧，
点击编辑器

![image](https://user-images.githubusercontent.com/51939531/211497544-ef54814b-5d7b-4388-85e7-8527d252a8cb.png)

搜索关键词`zoterostyle`，点击下图红框

![image](https://user-images.githubusercontent.com/51939531/211497700-2c19e778-ed92-4a8a-8d44-4d89cbe787e6.png)

小圆点就消失啦！神奇。其它设置同理。

![image](https://user-images.githubusercontent.com/51939531/211497794-83eda60c-4cbc-4fe6-8478-a8269728cc68.png)

## 视图组功能
![image](https://user-images.githubusercontent.com/51939531/211489602-5081d55f-cdd2-4df1-9e26-2038a0a91b6f.png)
借助这个功能，你可以从`Zotero`众多字段中任意组合出你经常浏览的视图。

下面跟着我来新建一个视图吧：
第一步，右键任意列，勾选或取消勾选你需要显示或不需要显示的列，

![image](https://user-images.githubusercontent.com/51939531/211495084-34cf2702-72b1-41e8-a606-569177194b5e.png)

第二步，仍然是右键任意列，鼠标移动到最后一个选项`视图组`，点击最后一个按钮`保存当前视图`，

![image](https://user-images.githubusercontent.com/51939531/211495314-eda3da8c-8fb7-4ecc-96f3-b02021df841b.png)

不出意外的话，会有一个弹窗出现，

![image](https://user-images.githubusercontent.com/51939531/211495486-f11b308e-250b-4701-9240-c7199dee865b.png)

在这里你可以为当前视图起一个名字，也可以做一些备注，比如下面这样，

![image](https://user-images.githubusercontent.com/51939531/211495613-83782172-46cf-4db8-9cbe-add86a5cce4f.png)

点击添加后，这里会显示出当前所有视图按钮，并一会自动消失。

![image](https://user-images.githubusercontent.com/51939531/211495716-98b6f4d5-0fb6-43f4-ae58-92b74b897701.png)

到此，你已经成功添加了一个视图到视图组中。

你可以通过那些一闪而过的小圆点里切换它们，鼠标悬停会为你提示你刚写的名称和备注。你不找小圆点，小圆点不会出现（避免突兀）。
![image](https://user-images.githubusercontent.com/51939531/211496616-8d796f09-de8a-4713-bf4e-92f992d94684.png)
不怕麻烦的话，也可以右键任意字段，在视图组里点击，也会切换。除此之外，右键一个已添加的视图，会**删除**它。这也是视图组存在的意义。小圆点单纯为了好看。



