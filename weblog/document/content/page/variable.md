---
title: Template Data
---

Jekyde uses [Swig](http://paularmstrong.github.io/swig/) as template engine. The following is a reference of the available data when generating website from layout files. 

### Global

| Variable | Description |
| -------- | ----------- |
| `site` | sitewide information and configuration |
| `article` | current post or page information |
| `articles` | the list of posts in current layout|
| `paginator`| paginate information |

### Site

The variable is available in all layouts.

| Variable | Description |
| -------- | ----------- |
| `site.title` | the title from `config.yml` file |
| `site.host` | the host from `config.yml` file |
| `site.baseurl` | the baseurl from `config.yml` file |
| `site.paginate` | the paginate from `config.yml` file |
| `site.posts` | a reverse chronological list of all posts |
| `site.pages` | the list of all pages |

Any other data that you specify in `config.yml` will be available under `site`.

### Article

The variable is available only in `post` and `page` layouts.

| Variable | Description |
| -------- | ----------- |
| `article.content` | the rendered content of the post/page |
| `article.title` | the title of the post/page |
| `article.url` | the url of the post/page without the domain |
| `article.date` | the date assigned to the post/page |
| `article.next`| the chronologically newer post |
| `article.previous` | the chronologically older post |

Any custom front matter that you specify will be available under `article`. The variable is the same as the element in `site.posts` or `site.pages`

### Articles

The variable in available in `index`, `archive`, `category` and `tag` layouts.

### Paginator

The variable in available in `index`, `archive`, `category` and `tag` layouts.

| Variable | Description |
| -------- | ----------- |
| `paginator.per_page` | number of posts per page |
| `paginator.total_posts` | total number of posts |
| `paginator.total_pages` | total number of pagination pages |
| `paginator.page` | the number of the current page |
| `paginator.previous_page` | the number of the previous page |
| `paginator.previous_url` | the url of the previous page |
| `paginator.next_page` | the number of the next page |
| `paginator.next_url` | the url of the next page |
