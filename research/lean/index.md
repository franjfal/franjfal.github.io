---
title: Formalizaciones en Lean
permalink: /research/lean/
layout: single
classes: wide
author_profile: true
---

Resultados de mis artículos formalizados en [Lean 4](https://lean-lang.org/) con [Mathlib](https://leanprover-community.github.io/) y comprobados por el asistente de demostración. Cada formalización tiene una página con los enunciados del artículo, el código Lean navegable con sus estados de prueba, los axiomas utilizados y el proyecto Lean completo para verificarlo localmente.

*Results of my articles formalized in Lean 4 with Mathlib and checked by the proof assistant.*

{% include lean/formalizations-list.html heading=false %}

{% assign lean_items = site.data.lean_formalizations.items %}
{% if lean_items == nil or lean_items.size == 0 %}
Todavía no hay formalizaciones publicadas.
{% endif %}
