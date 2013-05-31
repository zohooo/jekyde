---
title: Permalinks
---

You can specify the permalinks for your posts and pages in `config.yml` file in template folder.

### Template Variables for Posts

| Variable | Description |
| -------- | ----------- |
| `year`   | year from the post's filename |
| `month`  | month from the post's filename |
| `day`    | day from the post's filename |
| `title`  | title from the post's front matter |
| `name`   | name from the post's front matter |

### Template Variables for Pages

| Variable | Description |
| -------- | ----------- |
| `title`  | title from the page's front matter |
| `name`   | name from the page's filename |

### Default Permalink Values

| Setting   | Permalink |
| --------- | --------- |
| post_link | `post/:year/:month/:day/:name.html` |
| page_link | `page/:name` |
