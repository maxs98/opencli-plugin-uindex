# opencli-plugin-uindex

[UIndex](https://uindex.org/) 种子搜索 CLI — 在终端中搜索和浏览 UIndex 上的种子资源。

## 安装

```bash
opencli plugin install github:maxs98/opencli-plugin-uindex
```

### 更新

```bash
opencli plugin update uindex
```

### 卸载

```bash
opencli plugin uninstall uindex
```

## 前置要求

```bash
# 确保安装了 OpenCLI v1.7.8+
opencli --version
```

如果未安装：

```bash
npm install -g @jackwener/opencli
```

## 命令列表

```bash
opencli uindex --help
```

| 命令 | 功能 |
|------|------|
| `search` | 按关键词搜索种子 |
| `top` | 查看 Top 100 |
| `trending` | 查看首页热门（电影/剧集） |

## 搜索种子

### search 语法

```bash
opencli uindex search <关键词> [选项]
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | 位置参数 | **必填** | 搜索关键词 |
| `--category` | int | `0` | 分类 ID |
| `--limit` | int | `20` | 返回条数 |
| `--page` | int | `1` | 翻页 |

### 分类 ID

| ID | 分类 |
|----|------|
| 0 | 全部 (All) |
| 1 | 电影 (Movies) |
| 2 | 剧集 (TV) |
| 3 | 游戏 (Games) |
| 4 | 音乐 (Music) |
| 5 | 应用 (Apps) |
| 6 | XXX |
| 7 | 动漫 (Anime) |
| 8 | 其他 (Other) |

### 示例

```bash
# 搜索全站
opencli uindex search "the boys"

# 只搜电影
opencli uindex search "hoppers" --category 1

# 搜动漫，取前10条
opencli uindex search "one piece" --category 7 --limit 10

# 翻到第2页
opencli uindex search "test" --page 2 --limit 5
```

## 查看 Top 100

```bash
opencli uindex top [选项]
```

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--category` | `0` | 分类 ID（同上） |
| `--duration` | `7d` | 时间范围 |

### duration 可选值

| 值 | 说明 |
|----|------|
| `24h` | 24小时内 |
| `7d` | 7天内 |
| `30d` | 30天内 |
| `3m` | 3个月内 |
| `6m` | 6个月内 |
| `1y` | 1年内 |
| `all` | 全部时间 |

### 示例

```bash
# 全站 Top 100（默认7天）
opencli uindex top

# 电影类 Top 100（24h最热）
opencli uindex top --category 1 --duration 24h

# 游戏类 Top 100（全时）
opencli uindex top --category 3 --duration all
```

## 查看首页热门

```bash
opencli uindex trending [选项]
```

### 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--section` | `movies` | `movies` 或 `tv` |
| `--limit` | `15` | 返回条数 |

### 示例

```bash
# 热门电影（默认）
opencli uindex trending

# 热门剧集，取前10
opencli uindex trending --section tv --limit 10
```

## 输出格式说明

所有命令默认输出 **YAML** 格式，包含字段：

| 字段 | 说明 |
|------|------|
| `name` | 资源名称 |
| `size` | 文件大小 |
| `seeders` / `S` | 做种数 |
| `leechers` / `L` | 下载数 |
| `category` | 分类（search/top） |
| `uploaded` | 上传时间（search/top） |

## 实用技巧

### 管道过滤

```bash
# 只看做种数 > 1000 的结果
opencli uindex search "dune" | grep -A 5 "seeders: [1-9][0-9][0-9][0-9]"

# 只看电影类且做种多的
opencli uindex top --category 1 | head -20
```

### 获取磁力链接

搜索结果中不直接包含磁力链接。如需下载，在浏览器中打开 UIndex 网站搜索后点击 "Download Magnet" 获取。

## 注意事项

- 需要网络连接
- 搜索结果基于 UIndex.org 的数据
- 请遵守当地法律法规，仅下载合法内容

## 许可

MIT
