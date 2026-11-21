# Research Atlas

三页静态论文网站，可直接用 GitHub Pages 托管：

- `index.html`：研究方向简介
- `featured.html`：精选论文，来自 `source/模板 - 发表后.xlsx`
- `papers.html`：全部论文，来自 `source/模板 - 全部.xlsx`

## 更新论文

替换 `source/` 中的对应 Excel 文件，然后运行：

```bash
python scripts/build_data.py
```

脚本只使用 Python 标准库，会更新 `data/featured.json` 和 `data/all.json`。把源表和生成的 JSON 一起提交到 GitHub。表格需保留现有表头和工作表顺序。

## 本地预览

在这个目录运行：

```bash
python -m http.server 8000
```

打开 `http://localhost:8000/`。浏览器直接打开本地 `index.html` 时，部分浏览器会阻止读取 JSON，因此请使用本地服务器。

## 发布到 GitHub Pages

把本目录作为 GitHub 仓库根目录推送。进入仓库 **Settings → Pages**，选择 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存即可。网站所有路径都是相对路径，可以在项目仓库的 Pages 子路径下运行。

首页的方向介绍在 `index.html` 中；网站样式在 `styles.css` 中。原始论文链接按表格展示，缺失链接的条目不会显示“阅读原文”按钮。
