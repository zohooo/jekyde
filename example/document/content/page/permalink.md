---
title: Permalinks
---

You can specify the permalinks for your posts and pages in `config.yml` file in template folder.

### Template Variables for Posts

| Variable | Description |
| -------- | ----------- |
| `year`   | year from the post's front matter or filename |
| `month`  | month from the post's front matter or filename |
| `day`    | day from the post's front matter or filename |
| `title`  | the title of the post from its front matter |
| `name`   | the name of the post from its file name |

### Template Variables for Pages

| Variable | Description |
| -------- | ----------- |
| `title`  | the title of the page from its front matter |
| `name`   | the name of the page from its file name |

### Default Permalink Values

| Setting   | Permalink |
| --------- | --------- |
| post_link | `post/:year/:month/:day/:name.html` |
| page_link | `page/:name` |

For example, when the file name of some post is `some-name.md`, the `name` value of it is `some-name`; when the file name of another post is `2013-06-11-another-name.md`, the `name` value of it is `another-name`. It is better to use these `name` values in permalinks if there are Non-ASCII characters in the title of posts or pages.