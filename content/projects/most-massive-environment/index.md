---
direction:
- clustering-cosmic-var
title: Explaining Ultramassive Quiescent Galaxies at 3 < z < 5 in the Context of Their
  Environments
summary: The existence of ultramassive quiescent galaxies, which have already completed
  their life cycle at a mere 7% of the age of the Universe, is among the most puzzling
  of recent discoveries. We provide a statistical argument for interpreting these
  observations in the context of their **environments**, which explains their accelerated
  formation.
tags:
- Galaxies
- Observations
date: '2025-10-10T00:00:00Z'
draft: false
featured: true
links:
- icon: github
  icon_pack: fas
  name: GitHub
  url: https://github.com/astrockragh/evs_clustering
- icon: book
  icon_pack: fas
  name: NASA/ADS
  url: https://ui.adsabs.harvard.edu/abs/2025ApJ...988L..19J/abstract
- icon: quote-left
  icon_pack: fas
  name: Cite
  url: https://ui.adsabs.harvard.edu/abs/2025ApJ...988L..19J/exportcitation
url_pdf: https://arxiv.org/pdf/2507.05340
image: featured.jpg
light_figure: true
aliases:
- /project/most_massive_environment/
---

# Explaining the masses of ultra-massive "universe-breaking" galaxies

What do you do when observations break your theory?

That’s the situation galaxy physics has faced since the JWST started discovering both extremely distant galaxies, along with **ultra-massive, quiescent galaxies** at redshifts 3–5 — galaxies more massive than our Milky Way, already completely dead quenched just 1 billion years after the Big Bang. We see this in **spectra** from JWST, like the ones below from the EXCELS survey (blue lines), where we can fit models (black lines) to infer the star formation history. On a sidenote, one of the reasons that I like working with quiescent galaxies is that we have much better models for them than other galaxies, just admire how well the models fit the data! That's not always a given, which you can read about [in this other project](https://astrockragh.github.io/project/ir_optical/).

![The spectra of our galaxies from Carnall+2024](spectra.png)

We have struggled to explain how these galaxies could form stars so rapidly and shut off star formation this early. Theories have invoked extreme star formation efficiencies (close to 100%!), very exotic feedback mechanisms, or even modifications to our well-tested ΛCDM-cosmology. This has all come from statistical analyses of an idealized distribution of galaxies by total mass, the stellar mass function (SMF), using a technique called **Extreme Value Statistics (EVS)**, which is designed to ask the question:

```What is the probability distribution for the mass of the most massive galaxy I will observe in a certain volume of the Universe```

#### But what if we’ve just been asking the wrong question?

Normal EVS makes the assumption that all galaxies are independent from each other --- but this just is not true!

## The Real Question: Where Are These Galaxies Found?

Every single one of these beautiful, ultra-massive, quiescent galaxies lives in an **overdensity**, regions with significantly more galaxies than average. The overdensities reflect the fact that galaxies **cluster**, i.e., they are not randomly distributed on the sky. However, until now,theoretical predictions have treated these galaxies as if they live in average, unclustered, environments.

That’s like estimating the wealth of the richest person *in the world* by starting from the mean and spread in a random city. You're going to be surprised, because wealth, just like galaxies, clusters quite strongly, with clustered environments producing both extreme wealth and galaxies. You can see that either in the Figure at the top of this post or in the video below, where on of our galaxies of interest is marked in blue

<video controls width="100%">
  <source src="zoom_tour.mp4" type="video/mp4">
</video>

#### It is clear that our galaxy is in the middle of a very dense part of the Universe!

---

## The Insight That Changes Everything

This paper introduces an extended version of EVS that includes a galaxy’s **environment** — specifically, the overdensity it lives in — when estimating the expected maximum stellar mass. Instead of marginalizing over environments (which dilutes everything), we condition on the known fact that the galaxy is in an extreme region. How?

1. **Estimate the volume** of the overdensity using 3D redshift-space distributions.
2. **Compute how overdense** such a volume could reasonably be expected to in the full survey — i.e., the distribution of **density percentile** `u_δ` given that we can fit N subvolumes of the same size as the overdensity into our survey.
3. **Construct stellar mass functions (SMF)** that depends on `u_δ`. More overdense = more galaxies, especially at high masses.
4. Convolve the normal EVS estimates for each **overdensity-dependent SMF** with the distribution of possible overdensities given a certain volume to compute the distribution of the most massive galaxy **given that it exists in the most extreme overdensity in that survey** with a given volume.

You can see how our `P(Maximum mass)` estimates change as a function on the number of total overdensities of a given volume we sample below

<video controls width="100%">
  <source src="0_phimax.mp4" type="video/mp4">
</video>

In a way this is the compliment to [another one of my papers on massive galaxies in a clustered Universe](https://astrockragh.github.io/project/most_massive_jwst/), where we instead of **conditioning** on environment like here, marginalize out our lack of knowledge of the environment. For many galaxies, especially at ultra-high redshift, *we do not know their environments*, so there, the above conditioning steps would be inappropriate!

---

## The Result: They're Not So Impossible After All

When we apply this method to the three most extreme galaxies in the [EXCELS survey](https://ui.adsabs.harvard.edu/abs/2024MNRAS.534..325C/abstract) — including the infamous ZF-UDS-7329 galaxy — the tension with theoretical models *drops dramatically*.

* Under the standard EVS (ignoring environment and using normal star formation efficiencies), some galaxies were at a model tension of almost **6σ**, and combining all three, we get a total of **9σ**!! Alarming!
* When we **condition on overdensity**, this drops to **\~3σ** for the most extreme galaxy. So the galaxy is still extreme, but within acceptable limits. Remember that we could invoke higher star formation efficiency, but it is not that necessary now.
* You don’t need 100% star formation efficiency anymore. The pre-JWST \~10-20% values works just fine!

This is all summarized in the below Figure, where you can see the mass histories of the galaxies in dotted blue. The alleviated tension is immediately obvious!

![Main Figure from the paper](combined_updated_SBF_Finkelstein_fiducial_legend_reverse_order_referee_v2.png)

---

## So… Was This Really a Crisis? Or a Misunderstanding?

Let’s be blunt. Much of the tension arose not because the models were fundamentally wrong, but because we were comparing the rarest galaxies in the Universe to average expectations. By conditioning on where these galaxies actually live — **the most overdense regions of the sky** — we reconcile theory and observation without invoking extreme physics.

It’s a small shift in logic, but a sizable step in understanding.

In a way, [this reflects the thoughts of the original discover of the extreme ZF-UDS-7329, Karl Glazebrook](https://ui.adsabs.harvard.edu/abs/2024Natur.628..277G/abstract), who suggested that we may be missing something about halo physics that makes dark matter collapse faster early on --- a seemingly radical idea. However, this is actually exactly what happens in extreme overdensities, halos collapse earlier and grow faster than in average areas, so in a way, Prof. Glazebrook was right!

---

## 🛠 Want to Try This Yourself?

We've released the full code for environment-conditioned EVS on [GitHub](https://github.com/astrockragh/evs_clustering), including a demo notebook!

---

## 🚀 Why This Matters for Galaxy Evolution

* We now have a **physically-motivated way** to model massive galaxy formation without stretching SFE or tweaking dark matter in new ways.
* We **connect large-scale structure and galaxy masses** in a statistical framework. Clustering is **always** important. One of the important next steps is measuring the amplitude of clustering at these redshifts, but this is something that I am currently working on!

This is not the end of the mystery — but it’s the **beginning of the asking right question**.
