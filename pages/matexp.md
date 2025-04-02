---
title: "MatExp"
permalink: /matexp/
excerpt: ""
layout: default # Or your desired layout
---

<h1>Experimentos matemáticos</h1>

<ul>
  {% for post in site.MatExp %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      {% if post.excerpt %}
        <p>{{ post.excerpt }}</p>
      {% endif %}
    </li>
  {% endfor %}
</ul>