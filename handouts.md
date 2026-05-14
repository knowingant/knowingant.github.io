---
layout: default
title: Handouts
permalink: /handouts/
---

# Handouts

{% if site.handouts.size > 0 %}
{% for item in site.handouts reversed %}
- [{{ item.title }}]({{ item.url | relative_url }}){% if item.date %} - {{ item.date | date: "%Y-%m-%d" }}{% endif %}
{% endfor %}
{% else %}
No handouts published yet.
{% endif %}
