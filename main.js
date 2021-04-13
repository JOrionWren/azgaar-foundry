/**
 * A Configuration menu that allows the user to specify a *.map file
 * and a *.svg to build a world off of. This FormApplication will parse
 * the map file for all relevant information, and build a new scene to
 * represent all of the data gathered. Additionally will store data in
 * Journal Entries in order to make future referencing easier.
 */
class LoadAzgaarMap extends FormApplication {
  constructor(...args) {
    super(...args);
    game.users.apps.push(this);
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "Load Azgaar's Map";
    options.id = "azgaar-foundry";
    options.template = "modules/azgaar-foundry/templates/loadAzgaarsMap.html";
    options.closeOnSubmit = true;
    options.popOut = true;
    options.width = 600;
    options.height = "auto";
    return options;
  }
  /**
   * @return {object}    Object that contains all information necessary to render template.
   */
  async getData() {
    return {};
  }

  render(force, context = {}) {
    return super.render(force, context);
  }

  /**
   * Activate all of the listener's for the form, both Foundry
   * and custom ones.
   *
   * @param  {DOM} html    DOM of the Form Application (template)
   */
  activateListeners(html) {
    super.activateListeners(html);
    html.find("#map").change((event) => this.parseMap(event));
  }

  /**
   * Load map file as text
   *
   * @param  {event} event    triggered by change of the "map" input
   * @return {Promise}        resolve once file is loaded.
   */
  loadMap(event) {
    return new Promise((resolve, reject) => {
      let input = $(event.currentTarget)[0];
      let fr = new FileReader();
      let file = input.files[0];

      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsText(file);
    });
  }

  /**
   * Adhering to the data format of FMG, extract all valuable information
   * and save it to Memory.
   *
   * @param  {event} event    triggered by change of the "map" input
   * @return {Promise}        resolve() once all parsing is done
   */
  async parseMap(event) {
    // Load the file
    let text = await this.loadMap(event);
    /* Data format as presented in v1.4 of Azgaar's Fantasy Map Generator
    const data = [params, settings, coords, biomes, notesData, svg_xml,
      gridGeneral, grid.cells.h, grid.cells.prec, grid.cells.f, grid.cells.t, grid.cells.temp,
      features, cultures, states, burgs,
      pack.cells.biome, pack.cells.burg, pack.cells.conf, pack.cells.culture, pack.cells.fl,
      pop, pack.cells.r, pack.cells.road, pack.cells.s, pack.cells.state,
      pack.cells.religion, pack.cells.province, pack.cells.crossroad, religions, provinces,
      namesData, rivers].join("\r\n");
    */

    /* We are interested in the following fields, so extract them smartly (since order may change)
    Biomes: Biomes of the world (?)
    Cultures: Cultures
    States: Countries
    Burgs: Cities
    Religions: Relgions of the world
    Provinces: Group of Burgs in States
    namesData: Real world basis (culture) for countries/cultures.
    Rivers: Rivers
    */
    // Turn file into array of lines
    const lines = text.split(/[\r\n]+/g);

    // FMG Settings
    let firstLine = lines[0].split("|");
    // Extract image size
    this.mapWidth = firstLine[4];
    this.mapHeight = firstLine[5];

    lines.forEach((line) => {
      try {
        // Only interested in JSON objects
        const obj = JSON.parse(line);

        /**
         * Each JSON object is one of the following categories
         * so here we determine which one it is, then assign
         * the proper variables to it.
         */

        // Provinces
        if ("state" in obj[1] && !("cell" in obj[1])) {
          console.log("Provinces:", obj);
          this.provinces = obj;
        }
        // These are our countries
        else if ("diplomacy" in obj[0]) {
          console.log("Countries:", obj);
          this.countries = obj;
          // Religions
        } else if (obj[0].name === "No religion") {
          console.log("Religions:", obj);
          this.religions = obj;
          // Cultures
        } else if (obj[0].name === "Wildlands") {
          console.log("Cultures:", obj);
          this.cultures = obj;
          // Burgs
        } else if ("population" in obj[1] && "citadel" in obj[1]) {
          console.log("Burgs:", obj);
          this.burgs = obj;
          // Rivers
        } else if ("mouth" in obj[0]) {
          console.log("Rivers:", obj);
          this.rivers = obj;
        }
        // Many things in the file are not JSON, we don't care about them.
      } catch (error) {}
    });
  }

  /**
   * This method takes the data from memory and creates readable Journal
   * Entries out of it.
   *
   * @return {Promise}    resolve once all Foundry creations are done.
   */
  async importData() {
    return new Promise(async (resolve, reject) => {
      /**
       * Cultures
       */
      ui.notifications.notify("UAFMGI: Creating Journals for Cultures.");
      let cultureComp = await CompendiumCollection.createCompendium({name: "Cultures", label: "Cultures", entity: "JournalEntry"})
      let cultureData = this.cultures.map((culture) => {
        if (!jQuery.isEmptyObject(culture)) {
          let content = `<div>
              <h3>${culture.name}</h3>
              <h4>Type: ${culture.type}</h4>
              <h4>Expansionism: ${culture.expansionism}</h4>
              <h4>Color: ${culture.color}</h4>
              <h4>Code: ${culture.code}</h4>
            </div>
            `;

          if (culture.name) {
            let journal = {
              name: culture.name,
              content: content,
              permission: { default: 4 }
            };
            return journal;
          }
        }
      });

      await cultureComp.createEntity(cultureData);
      this.cultureComp = cultureComp;

      let cultureLookup = this.cultures.map((culture) => {
        return {
          id: culture.i,
          name: culture.name,
          journal: this.retrieveJournalByName({type: "culture", name: culture.name})
        }
      })

      /**
       * Countries
       */
      ui.notifications.notify("UAFMGI: Creating Journals for Countries.");

      let countryComp = await CompendiumCollection.createCompendium({name: "Countries", label: "Countries", entity:"JournalEntry"});
      let countryData = this.countries.map((country) => {
        if (!(jQuery.isEmptyObject(country) || country.name === "Neutrals")) {
          // TODO: Extrapolate Provinces, add Burgs?, Neighbors, Diplomacy, Campaigns?, Military?
          // Apparently this is the template for entity linking
          // @JournalEntry[entity ID]{text}
          // 
          let culture = cultureLookup[country.culture];
          let content = `<div>
              <h3>${country.fullName}</h3>
              <h4>Type: ${country.type}</h4>
              <h4>Expansionism: ${country.expansionism}</h4>
              <h4>Color: ${country.color}</h4>
              <h4>Culture: @Compendium[world.Cultures.${culture.journal.id}]{${culture.name}}</h4>
              <h4>Urban: ${country.urban}</h4>
              <h4>Rural: ${country.rural}</h4>
              <h4># of Burgs: ${country.burgs}</h4>
              <h4>Area: ${country.area}</h4>
              <h4>Form: ${country.form}</h4>
              <h4>Government: ${country.formName}</h4>
              <h4>Provinces: ${country.provinces}</h4> 
            </div>
            `;

          if (country.name) {
            let journal = {
              name: country.name,
              content: content,
              permission: { default: 4 },
            };

            return journal;
          }
        }
      });

      countryData.shift(); // Remove first element. This is the "Neutrals" country.

      await countryComp.createEntity(countryData);
      this.countryComp = countryComp;
      let countryLookup = this.countries.map((country) => {
        return {
          id: country.i,
          name: country.name,
          journal: this.retrieveJournalByName({type: "country", name: country.name})
        }
      })

      /**
       * Burgs
       */
      ui.notifications.notify("UAFMGI: Creating Journals for Burgs.");
      let burgComp = await CompendiumCollection.createCompendium({name: "Burgs", label: "Burgs", entity: "JournalEntry"})
      let burgData = this.burgs.map((burg) => {
        if (!jQuery.isEmptyObject(burg)) {

          let culture = cultureLookup[burg.culture];
          let country = countryLookup[burg.state];
          
          let content = `<div>
              <h3>${burg.name}</h3>
              <h4>State: @Compendium[world.Countries.${country.journal?.id}]{${country.name}}</h4>
              <h4>Culture: @Compendium[world.Cultures.${culture.journal?.id}]{${culture.name}}</h4>
              <h4>Population: ${burg.population}</h4>
              <h4>Citadel: ${burg.citadel}</h4>
              <h4>Capital: ${burg.capital}</h4>
              <h4>Port: ${burg.port}</h4>
              <h4>Plaza: ${burg.plaza}</h4>
              <h4>Walls: ${burg.walls}</h4>
              <h4>Shanty: ${burg.shanty}</h4>
              <h4>Temple: ${burg.temple}</h4>
              <h4>Feature: ${burg.feature}</h4>
            </div>
            `;

          if (burg.name) {
            return {
              name: burg.name,
              content: content,
              permission: { default: 4 },
            };
          }
        }
      });

      burgData.shift(); // Remove first element. This is the empty burg.
      await burgComp.createEntity(burgData);
      this.burgComp = burgComp;

      /**
       * Provinces
       */
      ui.notifications.notify("UAFMGI: Creating Journals for Provinces.");
      let provinceComp = await CompendiumCollection.createCompendium({name: "Provinces", label: "Provinces", entity:"JournalEntry"});
      let provinceData = this.provinces.map((province) => {
        if (province !== 0) {
          let content = `<div>
              <h3>${province.name}</h3>
              <h4>Type: ${province.formName}</h4>
              <h4>Full Name: ${province.fullName}</h4>
              <h4>Color: ${province.color}</h4>
            </div>
            `;

          if (province.name) {
            let journal = {
              name: province.name,
              content: content,
              permission: { default: 4 },
            };
            return journal;
          }
        }
      });
      provinceData.shift();
      await provinceComp.createEntity(provinceData);
      this.provinceComp = provinceComp;

      resolve();

      //console.log(this.retriveJournalByName({name: "Ahadi"}));
    });
  }

  /**
   * Make a new scene with the SVG as the background
   *
   * @param  {string} svg    File path to the SVG asset
   * @return {Scene}         New Scene to work on
   */
  async makeScene(svg) {
    return new Promise(async (resolve, reject) => {
      let sceneName = svg.split("%20")[0];
      //Create The Map Scene
      let sceneData = await Scene.create({
        name: sceneName,
        width: this.mapWidth,
        height: this.mapHeight,
        padding: 0.0,
        img: svg,
        // Flags for making pinfix work immediately.
        "flags.pinfix.enable": true,
        "flags.pinfix.minScale": 1,
        "flags.pinfix.maxScale": 1,
        "flags.pinfix.zoomFloor": 0.1,
        "flags.pinfix.zoomCeil": 3,
        "flags.pinfix.hudScale": 1,
      });

      await sceneData.activate();

      resolve(sceneData);
    });
  }

  /**
   * Find an object in memory based on params
   *
   * @param  {String} type    Type of object to find
   * @param  {String} name    Name of object to find
   * @return {object}         Found Object
   */
  findObject({ type = "burg", name = "" }) {
    let searchable;
    if (type === "burg") {
      searchable = this.burgs;
    } else if (type === "country") {
      searchable = this.countries;
    } else if (type === "culture") {
      searchable = this.cultures;
    } else if (type === "any") {
      searchable = [...this.burgs, ...this.countries, ...this.cultures];
    }

    return searchable.find((elem) => elem.name === name);
  }

  /**
   * Find an object by searching through compendiums (Foundry db)
   *
   * @param  {String} type    Type of object to find
   * @param  {String} name    Name of object to find
   * @return {object}         Found Object
   */
  retrieveJournalByName({ type = "burg", name = "" }) {

    let searchable;
    if (type === "burg") {
      searchable = this.burgComp;
    } else if (type === "country") {
      searchable = this.countryComp;
    } else if (type === "culture") {
      searchable = this.cultureComp;
    } else if (type === "province") {
      searchable = this.provinceComp;
    }
    //let searchList = searchable.entities;

    let journal = searchable.find((elem) => elem.name === name);

    return journal;
  }

  /**
   * Automatically called by Foundry upon submission of FormApplication
   * Controls the process of creating everything. Scene, data, notes, etc.
   *
   * @param  {event} event        event that triggered this call, usually a click
   * @param  {String} formData    HTML of the form that was submitted
   * @return {None}               Foundry expects it to return something.
   */
  async _updateObject(event, formData) {
    // Make the scene
    let svg = this.element.find('[name="svgMap"]').val();
    let scene = await this.makeScene(svg);

    // import our data
    await this.importData();

    // Start prepping notes
    let countryData = this.countries.map((country) => {
      if (country.name === "Neutrals") return;
      let journalEntry = this.retrieveJournalByName({
        type: "country",
        name: country.name,
      });

      // Assemble data required for notes
      return {
        entryId: "6lZqJDtthRMmj3bi",
        x: country.pole[0],
        y: country.pole[1],
        icon: "icons/svg/castle.svg",
        iconSize: 32,
        iconTint: country.color,
        text: country.name,
        fontSize: 24,
        textAnchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        textColor: "#00FFFF",
        "flags.pinfix.minZoomLevel": 0.1,
        "flags.pinfix.maxZoomLevel": 2,
        "flags.azgaar-foundry.journal": {"compendium": "world.Countries", "journal": journalEntry.id}
      };
    });

    let provinceData = this.provinces.map((province) => {
      if (province === 0) return; // For some reason there's a 0 at the beginning.
      let journalEntry = this.retrieveJournalByName({
        type: "province",
        name: province.name,
      });

      // Some provinces do not have a burg... For now we skip those.
      if (province.burg === 0) return;
      let centerBurg = this.burgs.find((burg) => burg.i === province.burg);

      // Assemble data required for notes
      return {
        entryId: "6lZqJDtthRMmj3bi",
        x: centerBurg.x,
        y: centerBurg.y,
        icon: "icons/svg/tower.svg",
        iconSize: 32,
        iconTint: province.color,
        text: province.name,
        fontSize: 24,
        textAnchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        textColor: "#00FFFF",
        "flags.pinfix.minZoomLevel": 1,
        "flags.pinfix.maxZoomLevel": 2,
        "flags.azgaar-foundry.journal": {"compendium": "world.Provinces", "journal": journalEntry.id}
      };
    });

    let burgData = this.burgs.map((burg) => {
      if (jQuery.isEmptyObject(burg)) return; // For some reason there's a {} at the beginning.
      let journalEntry = this.retrieveJournalByName({ name: burg.name });

      // Assemble data required for notes
      return {
        entryId: "6lZqJDtthRMmj3bi",
        x: burg.x,
        y: burg.y,
        icon: "icons/svg/village.svg",
        iconSize: 32,
        iconTint: "#00FF000",
        text: burg.name,
        fontSize: 24,
        textAnchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        textColor: "#00FFFF",
        "flags.pinfix.minZoomLevel": 2,
        "flags.pinfix.maxZoomLevel": 3,
        "flags.azgaar-foundry.journal": {"compendium": "world.Burgs", "journal": journalEntry.id}
      };
    });

    // Remove all falsy values.
    countryData = countryData.filter(Boolean);
    provinceData = provinceData.filter(Boolean);
    burgData = burgData.filter(Boolean);

    // Make all of our notes, in one call to the db.
    await scene.createEmbeddedEntity("Note", [
      ...countryData,
      ...provinceData,
      ...burgData,
    ]);
    return;
  }
}

Hooks.once("init", () => {
  game.settings.registerMenu("azgaar-foundry", "config", {
    name: "Load Map",
    label: "Load Azgaar's Map into Foundry",
    hint: "Load Azgaar's Map into Foundry",
    icon: "fas fa-desktop",
    type: LoadAzgaarMap,
    restricted: true,
  });
});

Hooks.once("libWrapper.Ready", () => {
  libWrapper.register("azgaar-foundry", "Note.prototype._onClickLeft2", async function(wrapped, ...args) {
    const cJournal = this.document.getFlag("azgaar-foundry", "journal");
    if (cJournal) {
      const comp = game.packs.get(cJournal.compendium);
      let doc = await comp.getDocument(cJournal.journal);
      doc.sheet.render(true);
    } else {
      return wrapped(...args);
    }
  }, "MIXED");
})
