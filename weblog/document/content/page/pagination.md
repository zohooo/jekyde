---
title: Pagination
---

To enable pagination for your posts, You need to add a line to the `config.yml` file:

    paginate: 5

The above line specifies 5 posts will be displayed per page. You could also change this number to 0 to disable pagination.

After that, just add the following code to your layout files:

```html
{% for article in articles %}
<div class="article">
    <div><a href="{{ article.url }}">{{ article.title }}</a></div>
    <div>{{ article.content }}</div>
    <div>{% if article.date %}{{ article.date | date('Y-m-d H:i') }}{% endif %}</div>
</div>
{% endfor %}

<div class="pagination">
  {% if paginator.previous %}
    <span><a href="{{ paginator.urls[paginator.previous] }}">Newer Posts</a></span>
  {% endif %}
  {% if paginator.next %}
    <span><a href="{{ paginator.urls[paginator.next] }}">Older Posts</a></span>
  {% endif %}
</div>
```

And you are done.
