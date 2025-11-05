import {Array, String, pipe, Number, Order, Effect} from "effect"

const input = document.getElementById("search-input") as HTMLInputElement;
const button = document.getElementById("search-btn") as HTMLButtonElement;
const app = document.getElementById("app") as HTMLDivElement;

interface PokemonGeneration {
    pokemon_species: Array<{
        name: string;
        url: string;
    }>;
}

interface PokemonData {
    id: number // Pokedex number
    name: string;
    types: Array<{
        type: {
            name: string;
        };
    }>;
    height: number;
    weight: number;
    sprites: {
        front_default: string;
    };
}

function fetchPokemon(): void {
    const textInBar = input.value.toLowerCase().trim();

    fetch("https://pokeapi.upd-dcs.work/api/v2/generation/1")
    .then((response) => {
            return response.json();
    })
    .then((generation: PokemonGeneration) => {
        // Filters all possible Pokemon whose names start with the text in the search bar
        const possiblePokemon = generation.pokemon_species.filter(pokemon => pokemon.name.toLowerCase().startsWith(textInBar)
        );

        // Gets all the possible Pokemon's details concurrently
        const fetchingPokemon = Array.map(possiblePokemon, pokemon => {
            const urlGrabber = Array.filter(String.split(pokemon.url, "/"), Boolean);
            const pokemonID = urlGrabber[urlGrabber.length - 1];
            return fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${pokemonID}`)
                .then((response) => response.json());
        });

    return Promise.all(fetchingPokemon);
    })
    .then((allPokemonData: Array<PokemonData>) => {
    const pokedex = pipe(
      allPokemonData,
      Array.sortBy(Order.mapInput(Number.Order, (pokemon: PokemonData) => pokemon.id))
    );
    pokedexDisplay(pokedex);
    })
}

function pokedexDisplay(pokedex: Array<PokemonData>): void {
    // Removes pokemon whose letters are not part of the text in the search bar
    const currentDisplay = document.querySelector(".pokedex-grid");
    if (currentDisplay) {
    Effect.runSync(Effect.sync(() => {
        currentDisplay.parentNode?.removeChild(currentDisplay);
    }));
    }

    // Creates the area with which the created pokedex entry is placed
    const pokedexEntry = document.createElement("div");
    pokedexEntry.id = "pokedex-grid";
    pokedexEntry.className = "pokedex-grid";

    // Creates the pokedex entry
    pokedex.forEach(pokemon => {
        const entry = createPokedexEntry(pokemon);
        pokedexEntry.appendChild(entry);
    });
    app.appendChild(pokedexEntry);
}

function createPokedexEntry(pokemon: PokemonData): HTMLDivElement {
    const entry = document.createElement("div");
    entry.className = "pokedex-entry"

    // Where the info of an entry is contained
    const pokedexEntryContainer = document.createElement("div");
    pokedexEntryContainer.className = "pokemon-info";

    // Sprite
    const sprite = document.createElement("img");
    sprite.className = "sprite";
    sprite.src = pokemon.sprites.front_default;

    // Creates the div block
    const infoDiv = document.createElement("div");

    // Name
    const nameText = document.createElement("h1");
    const name = document.createElement("p");
    name.className = "name-text";
    name.textContent = String.capitalize(pokemon.name);
    nameText.appendChild(name);

    // Type/s
    const typeText = document.createElement("p");
    typeText.className = "type-text";
    typeText.innerHTML = Array.join(" | ")(
        Array.map(pokemon.types, t =>
            `<code>${String.capitalize(t.type.name)}</code>`
        )
    );

    // Height
    const heightText = document.createElement("p");
    heightText.className = "height-text";
    heightText.textContent = `Height: ${pokemon.height / 10} m`;

    // Weight
    const weightText = document.createElement("p");
    weightText.className = "weight-text";
    weightText.textContent = `Weight: ${pokemon.weight / 10} kg`;

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