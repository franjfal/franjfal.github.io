---
title: "MatExp"
permalink: /matexp/
excerpt: ""
---

<h1>Experimentos matemáticos</h1>

<style>
  /* Base styles remain the same */
  .matexp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }

  /* Flip card container */
  .matexp-card-container { /* New container to manage grid item height */
    perspective: 1000px; /* For the 3D effect */
    height: auto; /* Let the height be determined by content */
  }

  /* Inner container for the flip effect */
  .matexp-card-inner {
    width: 100%;
    height: 100%;
    transition: transform 0.8s ease-in-out;
    transform-style: preserve-3d;
    cursor: pointer; /* Indicate it's interactive */
    position: relative; /* Needed for absolute positioning of faces */
  }

  .matexp-card-container:hover .matexp-card-inner {
    transform: rotateY(180deg);
  }

  /* Front side of the card */
  .matexp-card-front, .matexp-card-back {
    position: relative;
    width: 100%;
    height: 100%;
    backface-visibility: hidden; /* Hide the back face initially */
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .matexp-card-front {
    background-color: #f9f9f9;
  }

  .matexp-card-front img {
    max-width: 80%;
    height: auto;
    margin-bottom: 10px;
  }

  .matexp-card-front h3 {
    margin-top: 0;
    margin-bottom: 5px;
    font-size: 1.2em;
    color: #333;
  }

  /* Back side of the card (initially hidden) */
  .matexp-card-back {
    background-color: #e9ecef;
    transform: rotateY(180deg); /* Initially rotate the back face */
    overflow-y: auto; /* Enable vertical scrolling if content overflows */
    text-align: left;
  }

  .matexp-card-back p {
    margin: 10px 0;
    font-size: 0.9em;
    color: #555;
  }

  .matexp-card-back h3 {
    margin-top: 0;
    margin-bottom: 10px;
  }
</style>

<div class="matexp-grid">
  {% for post in site.MatExp %}
    {% if post.hidden != true %}
      <div class="matexp-card-container">
        <div class="matexp-card-inner">
          <div class="matexp-card-front">
            {% if post.feature %}
              <img src="{{ post.feature | relative_url }}" alt="{{ post.title }}">
            {% endif %}
            <h3>{{ post.title }}</h3>
          </div>
          <div class="matexp-card-back">
            <h3>{{ post.title }}</h3>
            {% if post.excerpt %}
              <p>{{ post.excerpt }}</p>
            {% else %}
              <p>No description available.</p>
            {% endif %}
            <a href="{{ post.url }}" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); text-decoration: none; color: #007bff; font-weight: bold;">Ver más</a>
          </div>
        </div>
      </div>
    {% endif %}
  {% endfor %}
</div>