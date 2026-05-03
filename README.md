# opencli-plugin-uindex

[UIndex](https://uindex.org/) 种子搜索 CLI — 终端中直接搜索、浏览热门资源。

## 安装

```bash
opencli plugin install github:maxs98/opencli-plugin-uindex
```

## 使用

### 搜索种子

```bash
opencli uindex search <关键词> [选项]
```

选项：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | 位置参数 | **必填** | 搜索关键词 |
| `--category` | int | `0` | 0=All, 1=Movies, 2=TV, 3=Games, 4=Music, 5=Apps, 6=XXX, 7=Anime, 8=Other |
| `--limit` | int | `20` | 返回条数 |
| `--page` | int | `1` | 翻页 |

示例：

```bash
# 搜索全站
opencli uindex search "the boys"

# 只搜电影
opencli uindex search "dune" --category 1

# 搜动漫前10条
opencli uindex search "one piece" --category 7 --limit 10
```

### 查看 Top 100

```bash
opencli uindex top [选项]
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--category` | `0` | 分类 ID |
| `--duration` | `7d` | 24h, 7d, 30d, 3m, 6m, 1y, all |

```bash
# 全站 Top 100
opencli uindex top

# 电影类 Top 100（24h最热）
opencli uindex top --category 1 --duration 24h
```

### 首页热门

```bash
opencli uindex trending [选项]
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--section` | `movies` | movies 或 tv |
| `--limit` | `15` | 返回条数 |

```bash
# 热门电影
opencli uindex trending

# 热门剧集 top 10
opencli uindex trending --section tv --limit 10
```

## 输出字段

| 字段 | 说明 |
|------|------|
| `name` | 资源名称 |
| `size` | 文件大小 |
| `seeders` | 做种数 |
| `leechers` | 下载数 |
| `category` | 分类（search/top） |
| `uploaded` | 上传时间（search/top） |

## 更新

```bash
opencli plugin update uindex
```

## 卸载

```bash
opencli plugin uninstall uindex
```

## 许可

MIT
