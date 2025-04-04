---
title: "MatExp"
permalink: /MatExp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<style>
/* Grid container */
.matexp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* Flip card container */
.flip-card {
  background-color: transparent;
  width: 100%;
  perspective: 1200px;
  position: relative;
}

/* Inner flip wrapper */
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 380px;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

/* Flip on hover */
.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

/* Front and back faces */
.matexp-card-front,
.matexp-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  min-height: 380px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

/* Front face */
.matexp-card-front {
  z-index: 2;
}

.matexp-card-front img {
  width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: contain;
  margin-bottom: 10px;
  border-radius: 6px;
}

.matexp-card-front h2 {
  font-size: 1.4em;
  margin: 0;
  text-align: center;
  color: #333;
  flex-shrink: 0;
}

/* Back face */
.matexp-card-back {
  transform: rotateY(180deg);
  overflow: hidden;
}

.matexp-card-back-content {
  overflow-y: auto;
  max-height: 100%;
  padding-right: 10px;
}

.matexp-card-back h2 {
  margin-top: 0;
  color: #007bff;
  font-size: 1.3em;
}

.matexp-card-back p {
  margin: 10px 0 0;
  line-height: 1.5;
}
</style>


<div class="matexp-grid">
  {% for post in site.MatExp %}
    {% unless post.hidden %}
      <a href="{{ post.url }}" class="flip-card">
        <div class="flip-card-inner">
          <!-- Front -->
          <div class="matexp-card-front">
            {% if post.feature %}
              <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}">
            {% endif %}
            <h2>{{ post.title }}</h2>
          </div>

          <!-- Back -->
          <div class="matexp-card-back">
            <div class="matexp-card-back-content">
              <h2>{{ post.title }}</h2>
              {% if post.excerpt %}
                <p>{{ post.excerpt }}</p>
              {% endif %}
            </div>
          </div>
        </div>
      </a>
    {% endunless %}
  {% endfor %}
</div>
