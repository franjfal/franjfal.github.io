---
title: "Mathematical Experiments"
permalink: /matexp/
layout: default
---

<h1>Mathematical Experiments</h1>

<style>
.matexp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
  gap: 20px;
  list-style: none;
  padding: 0;
}

.matexp-card {
  border: 1px solid #eee;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out;
}

.matexp-card:hover {
  transform: translateY(-5px); /* Slight lift on hover */
}

.matexp-image {
  max-width: 100%;
  height: auto;
  margin-bottom: 10px;
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

.matexp-card:hover .matexp-excerpt {
  max-height: 200px; /* Adjust as needed */
}
</style>

<ul class="matexp-grid">
  {% for post in site.MatExp %}
    <li class="matexp-card">
      <p>Image path: {{ post.image }}</p>
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