"use strict";
exports.__esModule = true;
var effect_1 = require("effect");
var input = document.getElementById("search-input");
var button = document.getElementById("search-btn");
var app = document.getElementById("app");
function fetchPokemon() {
    var textInBar = input.value.toLowerCase().trim();
    fetch("https://pokeapi.upd-dcs.work/api/v2/generation/1")
        .then(function (response) {
        return response.json();
    })
        .then(function (generation) {
        // Filters all possible Pokemon whose names start with the text in the search bar
        var possiblePokemon = generation.pokemon_species.filter(function (pokemon) { return pokemon.name.toLowerCase().startsWith(textInBar); });
        // Gets all the possible Pokemon's details concurrently
        var fetchingPokemon = effect_1.Array.map(possiblePokemon, function (pokemon) {
            var urlGrabber = effect_1.Array.filter(effect_1.String.split(pokemon.url, "/"), Boolean);
            var pokemonID = urlGrabber[urlGrabber.length - 1];
            return fetch("https://pokeapi.upd-dcs.work/api/v2/pokemon/".concat(pokemonID))
                .then(function (response) { return response.json(); });
        });
        return Promise.all(fetchingPokemon);
    })
        .then(function (allPokemonData) {
        var pokedex = (0, effect_1.pipe)(allPokemonData, effect_1.Array.sortBy(effect_1.Order.mapInput(effect_1.Number.Order, function (pokemon) { return pokemon.id; })));
        pokedexDisplay(pokedex);
    });
}
function pokedexDisplay(pokedex) {
    // Removes pokemon whose letters are not part of the text in the search bar
    var currentDisplay = document.querySelector(".pokedex-grid");
    if (currentDisplay) {
        effect_1.Effect.runSync(effect_1.Effect.sync(function () {
            var _a;
            (_a = currentDisplay.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(currentDisplay);
        }));
    }
    // Creates the area with which the created pokedex entry is placed
    var pokedexEntry = document.createElement("div");
    pokedexEntry.id = "pokedex-grid";
    pokedexEntry.className = "pokedex-grid";
    // Creates the pokedex entry
    pokedex.forEach(function (pokemon) {
        var entry = createPokedexEntry(pokemon);
        pokedexEntry.appendChild(entry);
    });
    app.appendChild(pokedexEntry);
}
function createPokedexEntry(pokemon) {
    var entry = document.createElement("div");
    entry.className = "pokedex-entry";
    // Where the info of an entry is contained
    var pokedexEntryContainer = document.createElement("div");
    pokedexEntryContainer.className = "pokemon-info";
    // Sprite
    var sprite = document.createElement("img");
    sprite.className = "sprite";
    sprite.src = pokemon.sprites.front_default;
    // Creates the div block
    var infoDiv = document.createElement("div");
    // Name
    var nameText = document.createElement("h1");
    var name = document.createElement("p");
    name.className = "name-text";
    name.textContent = effect_1.String.capitalize(pokemon.name);
    nameText.appendChild(name);
    // Type/s
    var typeText = document.createElement("p");
    typeText.className = "type-text";
    typeText.innerHTML = effect_1.Array.join(" | ")(effect_1.Array.map(pokemon.types, function (t) {
        return "<code>".concat(effect_1.String.capitalize(t.type.name), "</code>");
    }));
    // Height
    var heightText = document.createElement("p");
    heightText.className = "height-text";
    heightText.textContent = "Height: ".concat(pokemon.height / 10, " m");
    // Weight
    var weightText = document.createElement("p");
    weightText.className = "weight-text";
    weightText.textContent = "Weight: ".concat(pokemon.weight / 10, " kg");
    infoDiv.appendChild(nameText);
    infoDiv.appendChild(typeText);
    infoDiv.appendChild(heightText);
    infoDiv.appendChild(weightText);
    pokedexEntryContainer.appendChild(sprite);
    pokedexEntryContainer.appendChild(infoDiv);
    entry.appendChild(pokedexEntryContainer);
    return entry;
}
if (button) {
    button.addEventListener("click", fetchPokemon);
}
