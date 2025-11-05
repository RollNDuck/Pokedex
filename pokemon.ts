import {Array, String, pipe, Number, Order, Effect} from "effect"

// Universal constants
const input = document.getElementById("search-input") as HTMLInputElement;
const app = document.getElementById("app") as HTMLDivElement;

// ADDED: Phase 4 - Cache to prevent refetching already fetched Pokémon
const pokemonCache = new Map<number, PokemonData>();

// ADDED: Phase 4 - Cache to prevent refetching generation data
const generationCache = new Map<number, PokemonGeneration>();

// Interfaces
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

// ADDED: Phase 4 - Function to insert entry in sorted order (for incremental display)
function insertEntryInOrder(grid: HTMLDivElement, entry: HTMLDivElement): void {
    const newId = parseInt(entry.dataset.id || "0");

    // FIX: Replaced globalThis.Array.from() with manual iteration to comply with restrictions
    const entries: HTMLDivElement[] = [];
    for (let i = 0; i < grid.children.length; i++) {
        entries[i] = grid.children[i] as HTMLDivElement;
    }

    let insertIndex = -1;
    for (let i = 0; i < entries.length; i++) {
        if (parseInt(entries[i].dataset.id || "0") > newId) {
            insertIndex = i;
            break;
        }
    }

    if (insertIndex === -1) {
        grid.appendChild(entry);
    } else {
        grid.insertBefore(entry, entries[insertIndex]);
    }
}

function fetchPokemon(): void {
    const textInBar = input.value.toLowerCase().trim();

    // ADDED: Phase 4 - Get selected generations from checkboxes
    const selectedGens: number[] = [];
    for (let i = 1; i <= 9; i++) {
        const checkbox = document.getElementById(`gen-${i}`) as HTMLInputElement;
        if (checkbox?.checked) {
            selectedGens.push(i);
        }
    }

    // ADDED: Phase 4 - Fetch all selected generations concurrently
    const generationPromises = Array.map(selectedGens, (gen) => {
        // ADDED: Use cache if available
        if (generationCache.has(gen)) {
            return Promise.resolve(generationCache.get(gen)!);
        }
        return fetch(`https://pokeapi.upd-dcs.work/api/v2/generation/${gen}`)
            .then((response) => response.json())
            .then((data: PokemonGeneration) => {
                generationCache.set(gen, data);
                return data;
            });
    });

    Promise.all(generationPromises)
    .then((generations: PokemonGeneration[]) => {
        // ADDED: Phase 4 - Combine all Pokémon species from selected generations
        const allPokemonSpecies = pipe(
            generations,
            Array.flatMap((gen) => gen.pokemon_species)
        );

        // Filters all possible Pokemon whose names start with the text in the search bar
        const possiblePokemon = Array.filter(allPokemonSpecies, pokemon =>
            pokemon.name.toLowerCase().startsWith(textInBar)
        );

        // ADDED: Phase 4 - Clear existing display for incremental display
        const currentDisplay = document.querySelector(".pokedex-grid");
        if (currentDisplay) {
            Effect.runSync(Effect.sync(() => {
                currentDisplay.parentNode?.removeChild(currentDisplay);
            }));
        }

        // ADDED: Phase 4 - Create grid for incremental display
        const pokedexGrid = document.createElement("div");
        pokedexGrid.id = "pokedex-grid";
        pokedexGrid.className = "pokedex-grid";
        app.appendChild(pokedexGrid);

        // Gets all the possible Pokemon's details concurrently
        const fetchingPokemon = Array.map(possiblePokemon, pokemon => {
            const urlGrabber = Array.filter(String.split(pokemon.url, "/"), Boolean);
            const pokemonID = parseInt(urlGrabber[urlGrabber.length - 1]);

            // ADDED: Phase 4 - Use cache if available
            if (pokemonCache.has(pokemonID)) {
                const cachedData = pokemonCache.get(pokemonID)!;
                // ADDED: Phase 4 - Display immediately from cache (incremental display)
                const entry = createPokedexEntry(cachedData);
                insertEntryInOrder(pokedexGrid, entry);
                return Promise.resolve(cachedData);
            }

            return fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${pokemonID}`)
                .then((response) => response.json())
                .then((data: PokemonData) => {
                    pokemonCache.set(pokemonID, data);

                    // ADDED: Phase 4 - Display immediately after fetching (incremental display)
                    const entry = createPokedexEntry(data);
                    insertEntryInOrder(pokedexGrid, entry);

                    return data;
                });
        });

        return Promise.all(fetchingPokemon);
    })
}

// FIX: Removed pokedexDisplay function as it's unused dead code from earlier phases

function createPokedexEntry(pokemon: PokemonData): HTMLDivElement {
    const entry = document.createElement("div");
    entry.className = "pokedex-entry"
    // ADDED: Phase 4 - Store ID in dataset for sorting
    entry.dataset.id = pokemon.id.toString();

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

// FIX: Removed button event listener since Phase 4 doesn't need submit button

// ADDED: Phase 4 - Listen for input changes (live search as user types)
if (input) {
    input.addEventListener("input", fetchPokemon);
}

// ADDED: Phase 4 - Listen for checkbox changes on all generation checkboxes
for (let i = 1; i <= 9; i++) {
    const checkbox = document.getElementById(`gen-${i}`);
    if (checkbox) {
        checkbox.addEventListener("change", fetchPokemon);
    }
}