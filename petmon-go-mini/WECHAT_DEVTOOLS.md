# 微信开发者工具调试

请在微信开发者工具中打开本目录：

```text
/Users/serena/Downloads/petmon-go/petmon-go-mini
```

根目录的 `project.config.json` 已将 `miniprogramRoot` 指向：

```text
dist/build/mp-weixin/
```

该目录由 uni-app 构建生成，包含微信小程序要求的 `app.json`、页面脚本、WXML、WXSS 和静态资源。源码仍位于 `src/`，修改源码后重新运行：

```sh
npm run build:mp-weixin
```

然后在微信开发者工具点击“编译”。不要把 `src/` 或 `petmon-go-mini` 的其他源码目录设置为小程序根目录，否则会出现“项目根目录未找到 app.json”。

如果开发者工具仍缓存旧配置：

1. 关闭当前项目。
2. 重新导入 `petmon-go-mini` 根目录。
3. 在“详情 → 本地设置”选择稳定基础库（建议 3.17.1 或更低的已安装版本），再点击“编译”。

本目录的 `project.private.config.json` 也已固定为 `3.17.1`；它会覆盖
`project.config.json` 的同名设置。该文件属于本机开发者工具配置，不应提交到
团队仓库。

`simulator launch failed` 通常是前一个根目录解析失败的连带错误；先确保项目配置解析到 `dist/build/mp-weixin/`，再判断是否仍有模拟器问题。
