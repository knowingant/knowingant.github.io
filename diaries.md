---
layout: default
title: Diaries
permalink: /diaries/
---

# Diaries

All diary PDFs are encrypted before publication.

{% if site.diaries.size > 0 %}
{% for item in site.diaries reversed %}
- [{{ item.title }}]({{ item.url | relative_url }}){% if item.date %} - {{ item.date | date: "%Y-%m-%d" }}{% endif %}
{% endfor %}
{% else %}
No diary entries published yet.
{% endif %}
