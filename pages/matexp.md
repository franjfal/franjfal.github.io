---
title: "MatExp"
permalink: /matexp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<style>
  .matexp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
    gap: 20px;
    padding: 20px;
  }

  .matexp-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;
  }

  .matexp-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .matexp-card img {
    max-width: 100%;
    height: auto;
    margin-bottom: 10px;
  }

  .matexp-card a {
    text-decoration: none;
    font-weight: bold;
    color: #333;
    transition: color 0.3s ease;
  }

  .matexp-card a:hover {
    color: #007bff; /* Change color on hover */
  }

  .matexp-card p {
    margin-top: 5px;
  }
</style>

<div class="matexp-grid">
  {% for post in site.MatExp %}
    {% if post.hidden != true %}
      <a href="{{ post.url }}">
        <div class="matexp-card">
          {% if post.feature %}
            <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}">
          {% endif %}
            <h3>{{ post.title }}</h3>
          {% if post.excerpt %}
            <p>{{ post.excerpt }}</p>
          {% endif %}
        </div>
      </a>
    {% endif %}
  {% endfor %}
</div>