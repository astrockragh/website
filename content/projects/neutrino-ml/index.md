---
direction:
- beyond-galaxies
title: Improving event reconstrution at IceCube
summary: Using Graph Neural Networks, me and a group of friends showed that event
  reconstruction speed and precision for low-energy neutrino events can be greatly
  improved.
tags:
- Machine Learning
- Particle Physics
- Cosmology
date: '2022-01-20T00:00:00Z'
draft: false
featured: false
url_code: https://github.com/astrockragh/icecube
url_pdf: /projects/neutrino-ml/Bachelor_Project.pdf
image: featured.png
light_figure: true
aliases:
- /project/neutrino_ml/
---

This Bachelors Thesis was done in collaboration with [Jonas Vinther](https://github.com/Vinther901), [Johann Bock Severin](https://github.com/JohannSeverin) and [Jakob H. Schauser](https://github.com/JakobSchauser) during our sixth semester as physics undergraduates. Check out their GitHubs!

This project was concerned with improving the reconstruction of neutrino events at The IceCube Neutrino Observatory, an experiment located at The South Pole, which aims to detect neutrinos and other particles in the ice sheet. Currently the observatory is focused on very very high energy neutrinos (TeV-PeV range) where the entire detector lights up and it is pretty easy to see where it came from, as can be seen in the video below.

<iframe width="1280" height="720" src="https://www.youtube.com/embed/vTya9hoKsfM" title="High energy neutrino at IceCube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>.

However, IceCube actually gets many more events at lower energies (GeV range), so we wanted to help improving the reconstruction at these energies. Here, only a few dots light up, and it is hard to figure out anything about the particle. As you may also be able to see in the video, this is further complicated by the fact that the IceCube detector has a somewhat odd two-layer hexagonal-cylindrical shape, which makes traditional algorithms almost impossible to use. We therefore turned to Graph Neural Networks (GNNs), which are very powerful when learning on geometric data. It's worth noting that grids are also special cases of graphs.

We found superior performance compared to the algorithm currently used by IceCube, which about a factor of a million increase in speed. The project was so successful that a group of people at the Niels Bohr Institute are currently doing a full-scale project, which you can find on the [IceCube official Github](https://github.com/icecube/graphnet).

If anyone has any questions, feel free to steal our code, read our report or reach out to me. The four different group members constructed four different model, varying from a few thousand parameters to multiple million, so this is also a great way of looking into model differences for the same task.