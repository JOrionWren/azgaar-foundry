![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FEthck%2Fazgaar-foundry%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fazgaar-foundry&colorB=4aa94a)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FEthck%2Fazgaar-foundry%2Fmaster%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)

# Unofficial Azgaar's Fantasy Map Generator Import

## How to use

### Azgaar's Fantasy Map Generator (FMG)

In order to use this module you will first need to retrieve two files from Azgaar's Fantasy Map Generator (https://azgaar.github.io/Fantasy-Map-Generator).
You will need the .map file and a picture of your world. Once you have these, continue to the next step.

### Starting the Workflow

To start please navigate to the Module settings and select the "Load Azgaar's Map into Foundry" button.

![Module Settings](images/moduleSettings.png)

### The Form

First and foremost I'd like to say that this form appears a lot more daunting than it actually is, so here's a bunch a pictures to help guide you.

There are only 3 steps that you actually _have_ to do, the rest is just configuring.

#### Section 1 - Map Selection

![Map File Selection](images/mapSelection.png)

First we want to load our map file into Foundry. We can do this by selecting the "Browse..." button and giving it our map file.

Once the map file is loaded we'll want to click the giant "Link to Picture" button and feed it the picture we exported from FMG.

Those are the only mandatory steps in this section (and pretty much the whole form), but the configuration really helps make these maps yours.

##### Important note regarding pictures

In order for your map to be properly aligned you MUST export your PNG/JPEG/SVG while your browser is in FULLSCREEN mode (typically f11). Azgaar's Fantasy Map Generator will only capture what you can currently see, so make sure you see everything!

#### Section 2 - MapNote Icon Selection

![Icon Selection](images/iconSelection.png)

In this section you can change the icon(s) that are used in the map notes that are generated by this module. For example we can change Countries to show the City svg instead of the default tower.

#### Section 3 - MapNote Scaling

![MapNote Scaling](images/noteScaling.png)

This module utilizes the pin-fixer module to allow some notes to be hidden based on zoom level. For any randomly generated map from FMG there are literally a thousand plus burgs, and I don't know about you but I don't need to see them all the time (but you can if you want to!)

Like the notice says the minimum zoom level requires you to be zoomed in to that distance to see it (so a really low value like on Countries means you can see it from really far out). The maximum zoom level will hide the note when you zoom in far enough. Using the Countries example again, when you zoom in far enough to see burgs it will hide the Country note so that you can actually see the Burgs.

#### Section 4 - Import

![Import](images/import.png)

Congrats! If you've reached this far then you've done everything you need to get this to work, and now you can just slam that import button and watch the magic happen!

## How Does It Work?

So you might be asking yourself won't this cause my players to not be able to load in fast? What's the performance impact of having 1000+ map notes on a single scene?

While I can't gurantee that your players won't experience difficulties loading into the scene I have made use of every possible method in Foundry to ensure that it is the quickest it can be. To this end you'll notice that on map creation all of the Journal Entries are actually stored in Compendiums. This means that unless you've opened that Journal recently it is stored in the database and you (and your players!) don't need to load it to log in.

### Updates

Whenever a new update is published you'll need to reimport the map in order to update your journals and see the new configurations!

## Future Plans

-   Find a way to allow updating of journals via a separate window so we don't have to create another new scene.
-   Incorporate other dataset(s) from the FMG map file
-   Find better ways to display _most_ of the data.

## Contact, Issues, and Recommendations

If you have any desire to contact me feel free to send me a message on Discord (Ethck#6879). Additionally if you run into any issues with the program and/or have any recommendations for future development please do not hesitate to post an issue here on Github.

## Additional Licensing & Thanks

This work is also licensed under the

[Foundry Virtual Tabletop EULA - Limited License Agreement for Module Development.](https://foundryvtt.com/article/license/)

I want to give a special shout-out to Azgaar for making the Fanatasy Map Generator in the first place and a shout out to all those who have helped contribute to this over the last several months, especially TheSnarky who has helped clean up some of my god-awful UI designs...
