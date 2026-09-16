---
type: about
title: About me
kicker: Who I am
headline: About me
summary: An astrophysicist who builds statistical and machine-learning models to learn about galaxies.
portrait: /img/portrait.jpg
role: Eric and Wendy Schmidt AI in Science / CITA Postdoctoral Fellow, University of Toronto
updated: September 2026

affiliations:
  - name: Canadian Institute for Theoretical Astrophysics
    url: https://www.cita.utoronto.ca/
  - name: Department of Statistical Sciences
    url: https://www.statistics.utoronto.ca/
  - name: The David A. Dunlap Department of Astronomy & Astrophysics
    url: https://www.astro.utoronto.ca/

# Taken from the "Scientific interests and expertise" section of the CV, so the
# site and the CV say the same thing.
interests:
  - Geometric and graph-based machine learning
  - Cosmic variance and clustering
  - Galaxy SED modelling
  - Survey calibration and instrumentation
  - Molecular spectroscopy

education:
  - year: 2026
    course: PhD in Astrophysical Sciences
    where: Princeton University
  - year: 2023
    course: MA in Astrophysical Sciences
    where: Princeton University
  - year: 2021
    course: BSc in Physics
    where: University of Copenhagen

elsewhere:
  - name: Google Scholar
    url: https://scholar.google.com/citations?user=0FjNowwAAAAJ
  - name: NASA ADS
    url: https://ui.adsabs.harvard.edu/search/fq=%7B!type%3Daqp%20v%3D%24fq_database%7D&fq_database=(database%3Aastronomy%20OR%20database%3Aphysics)&q=((author%3A%22Jespersen%2C%20Christian%20K.%22%20or%20author%3A%22Kragh%20Jespersen%2C%20Christian%22)%20AND%20year%3A2020-)&sort=date%20desc%2C%20bibcode%20desc&p_=0
  - name: ORCID
    url: https://orcid.org/0000-0002-8896-6496
  - name: GitHub
    url: https://github.com/astrockragh
  - name: LinkedIn
    url: https://www.linkedin.com/in/astrockragh
  - name: Curriculum vitae (PDF)
    url: /uploads/cv.pdf
---

I am a joint [Eric and Wendy Schmidt AI in Science](https://datasciences.utoronto.ca/schmidt-fellows/) and [Canadian Institute for Theoretical Astrophysics (CITA)](https://www.cita.utoronto.ca/) Postdoctoral Fellow at the University of Toronto, where I work primarily with [Josh Speagle](https://joshspeagle.com/), and also with [Aviad Levis](https://www.aviadlevis.info/) and, at CITA, [Pratika Dayal](https://pratika24.wixsite.com/pratika-dayal). From 2028 I will move to Montréal as a CITA National Fellow, working with [Laurence Perreault Levasseur](https://www.simonsfoundation.org/people/laurence-levasseur/) at [Université de Montréal](https://www.umontreal.ca/) and [Mila](https://mila.quebec/en). While I am in Toronto I will make at least one long-term visit to Montréal a year, plus a long-term visit to [Stockholm University](https://www.su.se/english/).

In Toronto I sit across three homes — CITA, the [Department of Statistical Sciences](https://www.statistics.utoronto.ca/), and [The David A. Dunlap Department of Astronomy & Astrophysics](https://www.astro.utoronto.ca/) — and I am a member of the [Astrostatistics Research Team (ART)](https://astrostatuoft.com/), led jointly by Josh Speagle and Gwen Eadie. If you want to visit a group where astronomy and statistics are fully married, check out the page on [how we can bring you to Toronto](/visit/).

I did my PhD in Astrophysical Sciences in 2026 at Princeton, advised by [Peter Melchior](https://pmelchior.net/) and [David N. Spergel](https://en.wikipedia.org/wiki/David_Spergel). My thesis, *Statistical Models of Galaxies: from Few to Many, from Near to Far*, is a reasonable summary of what I care about: using interesting statistical and machine learning methods informed by our knowledge of astrophysics to analyse interesting datasets, on both the theoretical and observational sides. Sometimes this means making models to analyse a single extreme object, sometimes that means millions of galaxies. Each is interesting and takes deep thought to treat well.

{{< toc >}}

## What I work on

I apply new (or overlooked) statistical methods to extragalactic astrophysics to enable us to ask new and deeper questions about our Universe. I do this with a focus on integrating physical knowledge, inductive biases, and geometric constraints into our statistical learning methods. The guiding idea is that a model should carry physics inside it, and should then be held to a standard where its uncertainties actually mean something. I really dislike overconfident and biased posteriors — [Yashar Hezaveh](https://yasharhezaveh.me/) has given these posteriors the beautiful name "asshole posteriors", a name I am quite fond of.

My main scientific interests are extragalactic, but I am interested in almost all areas of astronomy. Furthermore, I am very easy to excite about new projects, especially with new exciting datasets. That interest also extends down to the instruments themselves: I work on the optimisation of the [Prime Focus Spectrograph (PFS)](https://pfs.ipmu.jp/) by understanding and using the emission of the atmosphere itself — [airglow](http://dx.doi.org/10.1117/12.3018016) — to improve the instrument's calibration. I love integrating my science vertically, from instruments to analyses. 

To summarise, I like **modelling** and **measuring** (astronomy-related) things!

## Collaborations and surveys

I often enjoy collaborative work more than solo work. I currently participate actively in the work of the following collaborations (although this is not an exhaustive list of the collaborations I am a part of).

- **JWST** — Co-I on both of these programmes:
    - [**PANORAMIC**](https://arxiv.org/abs/2512.14212) — the NIRCam pure-parallel programme, forty independent sightlines, which is what makes it a cosmic variance experiment as much as a survey. Andrea Weibel and I used it to measure cosmic variance and thus galaxy clustering at z&nbsp;≈&nbsp;10.
    - **DeepDive** — NIRSpec, targeting extremely massive quiescent galaxies at z&nbsp;≈&nbsp;3–4.
- [**Roman eXtreme Deep Field (RXDF)**](https://roman.ipac.caltech.edu/cycle1-approved-programs/2001) — preparing for what Roman will see at the greatest depths.
- **Wide-field spectroscopy** — one instrument on sky, one still on paper:
    - [**Prime Focus Spectrograph**](https://pfs.ipmu.jp/) — sky subtraction, wavelength calibration, and the atmosphere as a calibration source, for a Subaru Strategic Program with 360 nights on the 8-metre Subaru telescope.
    - [**Wide-field Spectroscopic Telescope (WST)**](https://www.wstelescope.com/), AI Working Group — thinking about what machine learning should look like for a facility that does not exist yet.
- [**Learning the Universe**](https://www.learning-the-universe.org/) — Co-I on the Simons Collaboration, simulation-based inference for the formation of structure.

## Advising

I am currently fortunate enough to work with three students, and I enjoy this part of the job enormously:

- A first-year graduate student at Princeton, on whether large pretrained models for astronomy transfer to the early Universe.
- A fourth-year undergraduate at Toronto, on simulation-based inference for measuring clustering strength at Cosmic Dawn.
- A first-year graduate student at Toronto, on how much of what we infer about a galaxy's history from the light it emits comes from the prior rather than the data.

If any of this sounds like something you would like to work on, please see [Want to work with me?](/work-with-me/).

## Before moving to Canada

Before moving to Canada I was at the [Department of Astrophysical Sciences](https://web.astro.princeton.edu) at Princeton University, where I was a member of the [Astro Data Lab](https://astro-data-lab.github.io/), led by Peter Melchior. I was also a guest researcher at the [Center for Computational Astrophysics](https://www.simonsfoundation.org/flatiron/center-for-computational-astrophysics/) at the Flatiron Institute, in the [Cosmology × Data Science](https://www.simonsfoundation.org/flatiron/center-for-computational-astrophysics/cosmology-x-data-science/) group led by [Shirley Ho](https://users.flatironinstitute.org/~sho/index.html). Both shaped how I think about the relationship between data and physics, and I still work closely with people in both.

Originally from Denmark, I obtained my bachelor's degree from the [Niels Bohr Institute](https://nbi.ku.dk/english/) at the University of Copenhagen in 2021, with a [thesis](/projects/neutrino-ml/) on neutrino detection in IceCube, advised by Troels C. Petersen. Before that I spent two years at the Cosmic Dawn Center working with Charles Steinhardt and Sune Toft, and a summer at Caltech with David Stevenson.

## Outreach

I love showing our wonderful Universe to the public, and I find it both rewarding and motivating for my own science. At Princeton I frequently led the [public observing nights at Peyton Hall](https://www.astro.princeton.edu/observatory/publicobserving.php), and gave outreach talks at [Astronomy on Tap Trenton](https://astronomyontap.org/locations/trenton-nj/) and the [New Jersey State Museum planetarium](https://nj.gov/state/museum/). I'm currently looking forward to exploring similar opportunities in Toronto.

## Outside of academia

Outside of academia, I like all things to do with mountains, ice, snow, oceans, and gardening — at Princeton, I organized the [local community garden](https://lakesidecommittee.princeton.edu/lakeside-community-garden/), which played a major role in my high opinion of New Jersey. It's very easy to grow stuff there!
