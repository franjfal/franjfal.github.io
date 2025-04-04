---
title: "MatExp"
permalink: /matexp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<ul>
  {% for post in site.MatExp %}
    {% if post.hidden != true %}
      <li>
        {% if post.feature %}
          <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}" style="float: left; margin-right: 10px; max-width: 150px;">
        {% endif %}
        <a href="{{ post.url }}">{{ post.title }}</a>
        {% if post.excerpt %}
          <p>{{ post.excerpt }}</p>
        {% endif %}
        <div style="clear: both;"></div>
      </li>
    {% endif %}
  {% endfor %}
</ul>