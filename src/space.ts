export const SPACE = `
default attributes fill="none" stroke="grey" stroke-width="3"
text font-size="13pt" dy="15px" fill="white"  # Made hex numbers smaller
label font-size="14pt" dy="5px" fill="white"  # Made labels smaller


# Base background colors for hexes
void attributes fill="#000000"  # Pure black for empty space
occupied-space attributes fill="#1a2635"  # Navy-tinted dark blue for occupied systems
asteroid-space attributes fill="#352317"  # Warmer, more visible brown for asteroid fields
nebula-space attributes fill="#2a1b38"    # More saturated purple for nebulae
plasma-space attributes fill="#3d1f1f"    # More visible dark red for plasma storms
zone-space attributes fill="#4a6d9d" opacity="0.3"  # Semi-transparent blue for zones

# Celestial body colors
star-yellow attributes fill="#ffd700"
star-blue attributes fill="#4169e1"
star-red attributes fill="#ff4500"
planet-terran attributes fill="#4ca5af"
planet-gas attributes fill="#b39ddb"
planet-ice attributes fill="#e0ffff"
planet-rock attributes fill="#8b4513"
planet-lava attributes fill="#ff4444"


# Base Icons
<g id="Star"><circle cx="0" cy="0" r="35" fill="#ffd700" stroke="#ff8c00" stroke-width="3"/>
<path d="M-35,0 L35,0 M0,-35 L0,35 M-25,-25 L25,25 M-25,25 L25,-25" stroke="#ff8c00" stroke-width="2" opacity="0.6"/></g>

# Replace the current Planet definition with this:
<g id="Planet">
<circle cx="0" cy="0" r="30" fill="#4ca5af" stroke="white" stroke-width="3"/>
<path d="M-40,10 C-20,15 20,5 40,0" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,0 C-20,5 20,-5 40,-10" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,-10 C-20,-15 20,-25 40,-20" fill="none" stroke="white" stroke-width="2"/></g>

<g id="DeadPlanet">
<circle cx="0" cy="0" r="30" fill="#707070" stroke="white" stroke-width="3"/>
<path d="M-20,-15 C-18,-13 -15,-12 -12,-10" fill="none" stroke="white" stroke-width="2"/>
<path d="M10,-18 C12,-16 14,-15 17,-13" fill="none" stroke="white" stroke-width="2"/>
<path d="M-5,12 C-3,14 -2,15 0,17" fill="none" stroke="white" stroke-width="2"/>
</g>

<g id="IcePlanet">
<circle cx="0" cy="0" r="30" fill="#e0ffff" stroke="white" stroke-width="3"/>
<path d="M-40,10 C-20,15 20,5 40,0" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,0 C-20,5 20,-5 40,-10" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,-10 C-20,-15 20,-25 40,-20" fill="none" stroke="white" stroke-width="2"/></g>

<g id="RockyPlanet">
<circle cx="0" cy="0" r="30" fill="#8b4513" stroke="white" stroke-width="3"/>
<path d="M-40,10 C-20,15 20,5 40,0" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,0 C-20,5 20,-5 40,-10" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,-10 C-20,-15 20,-25 40,-20" fill="none" stroke="white" stroke-width="2"/></g>

# And for the actual planet color (if you want to create a LavaPlanet variant):
<g id="LavaPlanet">
<circle cx="0" cy="0" r="30" fill="#ff4400" stroke="white" stroke-width="3"/>  # Bright orange-red
<path d="M-40,10 C-20,15 20,5 40,0" fill="none" stroke="#ff8c00" stroke-width="2"/>  # Orange glow
<path d="M-40,0 C-20,5 20,-5 40,-10" fill="none" stroke="#ff8c00" stroke-width="2"/>
<path d="M-40,-10 C-20,-15 20,-25 40,-20" fill="none" stroke="#ff8c00" stroke-width="2"/></g>

# Modify GasGiant to use white strokes
<g id="GasGiant">
<circle cx="0" cy="0" r="40" fill="#b39ddb" stroke="white" stroke-width="3"/>
<path d="M-40,10 C-20,15 20,5 40,0" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,0 C-20,5 20,-5 40,-10" fill="none" stroke="white" stroke-width="2"/>
<path d="M-40,-10 C-20,-15 20,-25 40,-20" fill="none" stroke="white" stroke-width="2"/></g>

<g id="SpaceStation">
<rect x="-20" y="-5" width="40" height="10" fill="white" stroke="black" stroke-width="2"/>
<path d="M-30,0 L-20,0 M20,0 L30,0" stroke="black" stroke-width="2"/>
<rect x="-5" y="-15" width="10" height="30" fill="white" stroke="black" stroke-width="2"/></g>

# the AsteroidField 
<g id="AsteroidField">
<path d="M-30,-20 L-20,-12 L-26,-5 L-35,-10 Z" fill="#b8860b" stroke="#8b4513" stroke-width="2"/>
<path d="M-15,8 L-5,15 L-15,20 L-22,15 Z" fill="#daa520" stroke="#8b4513" stroke-width="2"/>
<path d="M8,-25 L18,-18 L12,-12 L3,-22 Z" fill="#cd853f" stroke="#8b4513" stroke-width="2"/>
<path d="M20,0 L30,8 L25,15 L15,5 Z" fill="#b8860b" stroke="#8b4513" stroke-width="2"/>
<path d="M32,-15 L40,-8 L35,0 L28,-12 Z" fill="#daa520" stroke="#8b4513" stroke-width="2"/>
<path d="M-20,22 L-12,30 L-22,33 L-28,26 Z" fill="#cd853f" stroke="#8b4513" stroke-width="2"/>
<path d="M10,20 L20,25 L15,32 L5,28 Z" fill="#b8860b" stroke="#8b4513" stroke-width="2"/>
</g>

<g id="Hazard">
<path d="M-100,86.6 L100,-86.6" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-70,86.6 L100,-40" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-40,86.6 L100,6" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-10,86.6 L100,52" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-100,-86.6 L100,86.6" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-100,-40 L70,86.6" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-100,6 L40,86.6" stroke="red" stroke-width="2" opacity="0.9"/>
<path d="M-100,52 L10,86.6" stroke="red" stroke-width="2" opacity="0.9"/>
</g>

# Scaled versions for map use
<g id="lavaplanet"><use xlink:href="#LavaPlanet" transform="scale(0.7)"/></g>
<g id="deadplanet"><use xlink:href="#DeadPlanet" transform="scale(0.7)"/></g>
<g id="star"><use xlink:href="#Star" transform="scale(0.7)"/></g>
<g id="iceplanet"><use xlink:href="#IcePlanet" transform="scale(0.7)"/></g>
<g id="rockyplanet"><use xlink:href="#RockyPlanet" transform="scale(0.7)"/></g>
<g id="planet"><use xlink:href="#Planet" transform="scale(0.7)"/></g>
<g id="gasgiant"><use xlink:href="#GasGiant" transform="scale(0.7)"/></g>
<g id="spacestation"><use xlink:href="#SpaceStation" transform="scale(0.7)"/></g>
<g id="asteroidfield"><use xlink:href="#AsteroidField" transform="scale(0.7)"/></g>
<g id="hazard"><use xlink:href="#Hazard" transform="scale(0.7)"/></g>

# Settlement types
<g id="outpost">
<circle cx="0" cy="0" r="15" fill="#ffd700" stroke="black" stroke-width="3"/>
<path d="M-10,-10 L10,10 M-10,10 L10,-10" stroke="black" stroke-width="2"/></g>

<g id="colony">
<circle cx="0" cy="0" r="20" fill="#ffd700" stroke="black" stroke-width="3"/>
<path d="M-15,0 L15,0 M0,-15 L0,15" stroke="black" stroke-width="2"/></g>

<g id="starport">
<circle cx="0" cy="0" r="25" fill="#ffd700" stroke="black" stroke-width="3"/>
<path d="M-20,0 L20,0 M0,-20 L0,20 M-15,-15 L15,15 M-15,15 L15,-15" stroke="black" stroke-width="2"/></g>
`;
