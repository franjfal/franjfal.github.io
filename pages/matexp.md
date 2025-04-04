---
title: "MatExp"
permalink: /MatExp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<style>
/* Grid layout for cards */
.matexp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
  gap: 20px;
  padding: 20px;
}

/* Container for each flip card */
.flip-card {
  background-color: transparent;
  width: 100%;
  height: 350px;                        /* Slightly taller for better layout */
  perspective: 1200px;                  /* More pronounced 3D effect */
  position: relative;
  border-radius: 12px;                  /* Softer corners */
  overflow: hidden;                     /* Ensures no content overflows */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Subtle outer shadow */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.flip-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* Deeper shadow on hover */
}


/* Inner container that will be rotated */
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

/* Flip the card on hover */
.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

/* Front and back sides of the card */
.matexp-card-front,
.matexp-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden; /* Safari */
  backface-visibility: hidden;
  border-radius: 8px;
  overflow: hidden;
}

/* Front side styling */
.matexp-card-front {
  background-color: #fff;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.matexp-card-front img {
  max-width: 100%;
  height: auto;
  margin-bottom: 10px;
  border-radius: 4px;
}

.matexp-card-front h2 {
  margin: 10px 0 0;
  font-size: 1.5em;
  color: #333;
}

/* Back side styling */
.matexp-card-back {
  background-color: #fff;
  color: #333;
  transform: rotateY(180deg);
  padding: 15px;
  overflow-y: auto; /* Makes the description scrollable if needed */
}

.matexp-card-back h2 {
  margin-top: 0;
  font-size: 1.5em;
  color: #007bff;
}

.matexp-card-back p {
  margin-top: 10px;
}
</style>

<div class="matexp-grid">
  {% for post in site.MatExp %}
    {% if post.hidden != true %}
      <a href="{{ post.url }}" class="flip-card">
        <div class="flip-card-inner">
          <!-- Front side of the card -->
          <div class="matexp-card-front">
            {% if post.feature %}
              <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}">
            {% endif %}
            <h2>{{ post.title }}</h2>
          </div>
          <!-- Back side of the card with scrollable description -->
          <div class="matexp-card-back">
            <h2>{{ post.title }}</h2>
            {% if post.excerpt %}
              <p>{{ post.excerpt }}</p>
            {% endif %}
          </div>
        </div>
      </a>
    {% endif %}
  {% endfor %}
</div>
