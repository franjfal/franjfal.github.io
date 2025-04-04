---
title: "Mathematical Experiments"
permalink: /matexp/
layout: default
---

<h1>Mathematical Experiments</h1>

<style>
.matexp-list {
  list-style: none;
  padding: 0;
}

.matexp-item {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.matexp-image {
  float: left;
  margin-right: 10px;
  max-width: 150px;
}

.matexp-title {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.matexp-excerpt {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.matexp-item:hover .matexp-excerpt {
  max-height: 200px; /* Adjust as needed */
}
</style>

<ul class="matexp-list">
  {% for post in site.MatExp %}
    <li class="matexp-item">
      {% if post.image %}
        <img src="{{ post.image | relative_url }}" alt="{{ post.title }}" class="matexp-image">
      {% endif %}
      <a href="{{ post.url }}" class="matexp-title">{{ post.title }}</a>
      {% if post.excerpt %}
        <div class="matexp-excerpt">
          <p>{{ post.excerpt }}</p>
        </div>
      {% endif %}
    </li>
  {% endfor %}
</ul>