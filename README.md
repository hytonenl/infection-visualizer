# infection-visualizer
Simple tool to play with different infection parameters to visualize infection spread, recovery and death rate.

*Disclaimer*: The author of this tool is not a virologist. This tool is not intended to portray an exact, real life spread of a disease. However, this tool intended to visualize what is the effect of different parameters in spreading an infection.

## Rules
The infection an the particles in this tool follow a few simple rules:
* Each infected particle may contract the disease to any other particle within the infection range.
* The infection decays over time, and everyone who has been healed from the infection, is immune to the infection afterwards.
* The infection itself does not kill anyone with proper treatment. When the amount of infected people exceeds the hospital capacity, each sick particle outside the hospital capacity has a chance to die.

There are sliders to affect the input parameters
* `sick count` defines the amount of sick particles at the beginning of the simulation
* `stationary` defines the percentage of the particles that are stationary during the simulation
* `infection radius` defines how far the infection can be contracted by a sick particle
* `healing time` defines how quickly the infection heals
* `infectivity` defines how easily the infection is contracted upon interaction of two nearby particles
* `hospital capacity` defines the capacity of the hospitals. Particles outside the capacity may die.

## Installation
Clone the project to your local machine and open `index.html` with your selected browser. Firefox and Chorme support are tested.
