## Done

- ADD player
- ADD movement
  1.  smooth increase in speed
  2.  drag when stopping movement
- ADD gun
  1. make it point to the cursor
- ADD bullets
  1. shoot it in the direction of the cursor
  2. delete the bullets when it leaves the canvas
- ADD obstacles 10m
- ADD collision 1h

- ADD HUD

  1. EXP bar
  2. lives
  3. time

- ADD world border 20m
- ADD lives 20m

# In progress

- ADD larger map and following camera ? HELP
- UI for upgrades

- ### REVIEW
  1.  review code
  2.  where its possible make code more general so it can be used in other projects or make it easier to understand
  3.  ADD more comments
- ADD enemy's - time depends on collision implementation

  1.  particles (maybe save for later to get a working prototype) instead maybe do css effects
  2.  Health that goes down on collision with bullets FROM the player to avoid future conflict with the boss monster
  3.  make use of the html element when the next level is reached increment the this.level of the player and multiply the max exp by 1.1 (dont forget to sync that with the progress element)

  ```html
  <progress min="0" max="100" id="expBar"></progress>
  ```

- ### ADD enemy's pathfinding - ?
- ADD reloading - 1h?
- ADD upgrades and exp - 4h depends on how much i add
  1. shotgun upgrade - maybe complicated
  2. Fire rate upgrade
  3. Reload rate upgrade
  4. exp modifier
  5. extra gun that shoots behind you - maybe complicated
- ## ADD boss monster - 5h
  1. make it shoot bullets
- ### REVIEW

- SHOULD ADD animated sprites - 6h

  1. player
  2. gun
  3. enemy 2 to 5 varations
  4. boss monster

- POSIBLE ADD randomly generate obstacles - ?
  1. perlin noise
  2. just use Math.Random
- Cutscenes
  - make a check for movement disabeld
- On Death
  1. Display statistics
  2. just use a card
- Cookies
  1. sessionStorage
