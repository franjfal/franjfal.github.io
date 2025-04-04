---
title: "MatExp"
permalink: /matexp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<style>
.matexp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.matexp-card {
  perspective: 1000px;
}

.matexp-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.matexp-card:hover .matexp-card-inner {
  transform: rotateY(180deg);
}

.matexp-front, .matexp-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
}

.matexp-front {
  background-color: white;
  color: black;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.matexp-back {
  background-color: #f0f0f0;
  color: black;
  transform: rotateY(180deg);
  overflow: auto;
  padding: 15px;
  box-sizing: border-box;
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
  color: #007bff;
}

.matexp-card p {
  margin-top: 10px;
}
</style>

<div class="matexp-grid">
  {% for post in site.MatExp %}
    {% if post.hidden != true %}
      <div class="matexp-card">
        <div class="matexp-card-inner">
          <div class="matexp-front">
            {% if post.feature %}
              <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}">
            {% endif %}
            <a href="{{ post.url }}">{{ post.title }}</a>
          </div>
          <div class="matexp-back">
            {% if post.excerpt %}
              <p>{{ post.excerpt }}</p>
            {% endif %}
          </div>
        </div>
      </div>
    {% endif %}
  {% endfor %}
</div>