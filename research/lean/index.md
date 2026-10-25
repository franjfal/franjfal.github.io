---
title: Lean formalizations
permalink: /research/lean/
layout: single
classes: wide
author_profile: true
---

Results of my articles formalized in [Lean 4](https://lean-lang.org/) with [Mathlib](https://leanprover-community.github.io/) and checked by the proof assistant. Each formalization has a page with the article's statements, the browsable Lean code with its proof states, the axioms it uses, and the complete Lean project to verify it locally.

{% include lean/formalizations-list.html heading=false %}

{% assign lean_items = site.data.lean_formalizations.items %}
{% if lean_items == nil or lean_items.size == 0 %}
No formalizations have been published yet.
{% endif %}
