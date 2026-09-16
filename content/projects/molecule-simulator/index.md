---
direction:
- spectra
title: Simulating the spectra of small ISM molecules
summary: Here is a tool to gain some familiarity with the spectra of small molecules
tags:
- Galaxies
- Observations
date: '2026-05-13T00:00:00Z'
draft: false
featured: false
image: featured.png
light_figure: true
---

In our recent DIB ISM molecular identification paper, we model the absorption profiles of Diffuse Interstellar Bands using [PGOPHER](http://pgopher.chm.bris.ac.uk/), a molecular spectral simulation code for asymmetric top molecules. The model computes ro-vibrational band contours as a function of the three principal rotational constants (A, B, C), the rotational excitation temperature, ro-vibrational coupling fractions (f<sub>A</sub>, f<sub>B</sub>, f<sub>C</sub>), and line broadening parameters, under either C<sub>2v</sub> or C<sub>s</sub> molecular symmetry. For C<sub>s</sub> molecules, two transition dipole axes contribute to the profile, mixed by a ratio r<sub>BC</sub>. The direct absorption profile is shown alongside a temperature derivative profile, which encodes how the spectrum responds to small changes in rotational temperature --- a key observable that lets us break the long-standing degeneracy between molecular geometry and excitation temperature.

### The model

For a molecule with **C₂ᵥ** symmetry, the observed DIB profile and its R(V)-derivative are related to the simulated profile p(λ) and its temperature derivative ∂p/∂T by:

$$
\frac{{d f}}{{d E}} = d + \gamma \cdot p(\lambda)
$$

$$
\frac{{d f}}{{d R(V)}} = e + \alpha \cdot p(\lambda) + \beta \cdot \frac{{\partial p(\lambda)}}{{\partial T}}
$$

For a molecule with **Cₛ** symmetry, two transition dipole axes contribute, mixed by a dipole ratio r:

$$
\frac{{d f}}{{d E}} = d + \gamma \left( p_1 + r \cdot p_2 \right)
$$

$$
\frac{{d f}}{{d R(V)}} = e + \alpha \left( p_1 + r \cdot p_2 \right) + \beta \left( \frac{{\partial p_1}}{{\partial T}} + r \cdot \frac{{\partial p_2}}{{\partial T}} \right)
$$

Here d and e are constant background offsets, γ scales the theoretical profile to the observed DIB amplitude, α captures the change in DIB column density with R(V), and β captures the change in rotational temperature with R(V). In the widget, the left panel shows the direct profile (the γ term), and the right panel shows the temperature derivative (the β term) plus a tunable leakage of the direct profile (the α term), controlled by the slider labeled α (dT direct). For the visualization, we have fixed β = 1, and d=e=0, but α and r can be tuned freely. Now, what else can be done

### Parameters

**Symmetry** — C<sub>2v</sub> or C<sub>s</sub>: toggles between a single transition dipole axis (C<sub>2v</sub>) and two axes (C<sub>s</sub>). For C<sub>s</sub>, the r<sub>BC</sub> slider becomes active.

**Rotational constants** — A, B, C (cm⁻¹): the three principal rotational constants of the asymmetric top, with A ≥ B ≥ C by convention. These set the rotational energy levels and thus the overall width and shape of the band contour. Larger constants correspond to a smaller, lighter molecule.

**Rotational temperature** — T<sub>rot</sub> (K): the excitation temperature of the rotational level populations, assumed to follow a Boltzmann distribution. Higher temperatures populate more rotational levels, broadening the profile envelope.

**Ro-vibrational coupling** — f<sub>A</sub>, f<sub>B</sub>, f<sub>C</sub>: the ratios of the excited-state to ground-state rotational constants along each axis (e.g., f<sub>A</sub> = A<sub>excited</sub> / A<sub>ground</sub>). Values less than 1 indicate that the molecule expands along that axis in the upper state, introducing asymmetry into the profile. This is the primary mechanism for producing the heavy red tail seen in asymmetric DIB profiles.

**Lorentzian broadening** — τ (cm⁻¹): the half-width at half-maximum of a Lorentzian broadening kernel, applied via online convolution. This can represent either the finite excited-state lifetime of the carrier (homogeneous line broadening) or velocity dispersion between interstellar clouds along the line of sight.

**Gaussian broadening** — σ (cm⁻¹): the standard deviation of a Gaussian broadening kernel, also applied via online convolution. This represents the instrumental line-spread function or additional Doppler broadening.

**Dipole ratio** — r<sub>BC</sub>: the ratio of the squared transition dipole moments along the two allowed axes in C<sub>s</sub> symmetry. This controls the relative contribution of the two spectral components.

**α (dT direct)**: controls the leakage of the direct profile into the temperature derivative panel. This mimics the α term in the model equations above, representing the change in DIB column density with environment. Set to 0 for a pure thermal derivative.

### The widget

The interactive widget below is built from a precomputed grid of PGOPHER spectra spanning a range of molecular parameters. It uses nearest-neighbor lookup to find the closest match in the grid, allows for online tuning of r<sub>BC</sub> and α, and then applies Lorentzian and Gaussian broadening online via direct convolution. The goal is to let all others build up the intuition we spent a long time building for how these spectra change with different physical parameters, without installing all the necessary software. See how temperature broadens the envelope, how the ratio of rotational constants controls the band shape, how ro-vibrational coupling introduces profile asymmetry, and how the temperature derivative picks up spectral structure that the direct profile alone cannot constrain.

{{< rawhtml >}}
<iframe src="/widgets/spectrum_viewer.html" width="100%" height="720"
        frameborder="0" style="border-radius:8px;"></iframe>
{{< /rawhtml >}}