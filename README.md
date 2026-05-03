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

---

## 搜索种子

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
| `--quality` | string | — | 分辨率过滤：`2160p` `1080p` `720p` `4k`，或自定义正则 |
| `--min-seeders` | int | — | 最少做种数过滤 |
| `--sort` | string | — | 排序：`seeders` `size` `name` `uploaded`（加 `-` 前缀升序） |

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
# 基本搜索
opencli uindex search "the boys"

# 只搜 2160p/4K 分辨率的电影
opencli uindex search "dune" --category 1 --quality 2160p

# 搜 1080p 以上且做种数 > 500 的剧集
opencli uindex search "the boys" --category 2 --quality "(2160p|1080p)" --min-seeders 500

# 按做种数排序（最多的排前面）
opencli uindex search "oppenheimer" --sort seeders --limit 10

# 按名称升序排序
opencli uindex search "test" --sort -name

# 翻页 + 过滤组合
opencli uindex search "one piece" --category 7 --page 2 --limit 5
```

---

## 查看 Top 100

```bash
opencli uindex top [选项]
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--category` | int | `0` | 分类 ID |
| `--duration` | string | `7d` | 时间范围 |
| `--limit` | int | `20` | 返回条数（最大 100） |
| `--quality` | string | — | 分辨率过滤 |
| `--min-seeders` | int | — | 最少做种数 |
| `--sort` | string | — | 排序方式 |

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

# 24h 最热电影，只看 2160p
opencli uindex top --category 1 --duration 24h --quality 2160p

# 游戏类全时排行，按做种数降序
opencli uindex top --category 3 --duration all --sort seeders --limit 10

# 剧集类本周最热，只看做种 > 1000 的
opencli uindex top --category 2 --duration 7d --min-seeders 1000
```

---

## 查看首页热门

```bash
opencli uindex trending [选项]
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--section` | string | `movies` | `movies` 或 `tv` |
| `--limit` | int | `15` | 返回条数 |
| `--quality` | string | — | 分辨率过滤 |
| `--min-seeders` | int | — | 最少做种数 |
| `--sort` | string | — | 排序方式 |

### 示例

```bash
# 热门电影（默认）
opencli uindex trending

# 热门剧集，只保留 2160p
opencli uindex trending --section tv --quality 2160p

# 热门电影按做种数排序，取前10
opencli uindex trending --section movies --sort seeders --limit 10
```

---

## 输出格式说明

所有命令默认输出 **YAML** 格式，包含字段：

| 字段 | 说明 |
|------|------|
| `name` | 资源名称 |
| `size` | 文件大小 |
| `seeders` | 做种数 |
| `leechers` | 下载数 |
| `category` | 分类（search/top） |
| `uploaded` | 上传时间（search/top） |

---

## 实用技巧

### 管道过滤

```bash
# 只看做种数 > 1000 的结果
opencli uindex search "dune" | grep -A 5 "seeders: [1-9][0-9][0-9][0-9]"

# 只看电影类且做种多的
opencli uindex top --category 1 | head -20
```

### 搭配字幕搜索

配合字幕搜索 CLI，可以实现资源 + 字幕一键查找：

```bash
# 搜到资源后，提取名称传给字幕搜索
opencli uindex search "dune" --quality 2160p --limit 5 | \
  grep "^  name: " | cut -d: -f2- | xargs -I{} opencli subtitle search "{}"
```

---

## 新功能（v1.1.0）

- **`--quality`** — 按分辨率过滤（2160p / 1080p / 720p / 4k 或自定义正则）
- **`--min-seeders`** — 只显示做种数达到某个值的资源
- **`--sort`** — 按种子数 / 大小 / 名称 / 上传时间排序
- **`--limit`** — top 命令也支持 limit 了

---

## 注意事项

- 需要网络连接
- 搜索结果基于 UIndex.org 的数据
- 请遵守当地法律法规，仅下载合法内容

## 许可

MIT
