import {Array, String, pipe, Effect, Option} from "effect"

const input = document.getElementById("search-input") as HTMLInputElement;
const app = document.getElementById("app") as HTMLDivElement;
const pokemonCache = new Map<number, PokemonData>();
const generationCache = new Map<number, PokemonGeneration>();

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

// Helper function for capitalizing (in case String.capitalize is not available)
const capitalize = (s: string): string =>
    s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;

// Function to insert entry in sorted order (for incremental display)
function insertEntryInOrder(grid: HTMLDivElement, entry: HTMLDivElement): void {
  const newId = parseInt(entry.dataset.id || "0", 10);

  // Build an effect/Array from grid.children (no native Array methods).
  const entries = pipe(
    Array.fromIterable(grid.children),
    Array.map((child) => child as HTMLDivElement)
  );

  // Find the first element whose dataset.id > newId
  const candidateOption = Array.findFirst(entries, (el) =>
    parseInt(el.dataset.id || "0", 10) > newId
  );

  // Handle Option: append if None, otherwise insert before found element
  if (Option.isNone(candidateOption)) {
    grid.appendChild(entry);
  } else {
    const beforeEl = candidateOption.value;
    grid.insertBefore(entry, beforeEl);
  }
}

function fetchPokemon(): void {
    const textInBar = input.value.toLowerCase().trim();

    // Guard against empty search to avoid fetching all Pokémon
    if (textInBar.length === 0) {
        const existing = document.querySelector(".pokedex-grid");
        if (existing) {
            existing.parentNode?.removeChild(existing);
        }
        return;
    }

    const allGens = Array.range(1, 9);
    const selectedGens = Array.filter(allGens, (gen) => {
        const checkbox = document.getElementById(`gen-${gen}`) as HTMLInputElement | null;
        return Boolean(checkbox && checkbox.checked);
    });

    // Fetch all selected generations concurrently
    const generationEffects = Array.map(selectedGens, (gen) => {
        // Use cache if available
        if (generationCache.has(gen)) {
            return Effect.succeed(generationCache.get(gen)!);
        }
        return pipe(
            Effect.tryPromise(() =>
                fetch(`https://pokeapi.upd-dcs.work/api/v2/generation/${gen}`)
            ),
            Effect.flatMap(response =>
                response.ok
                    ? Effect.tryPromise(() => response.json())
                    : Effect.fail(new Error(`HTTP ${response.status} for generation ${gen}`))
            ),
            Effect.map((data: PokemonGeneration) => {
                generationCache.set(gen, data);
                return data;
            })
        );
    });

    Effect.runPromise(Effect.all(generationEffects)).then((generations: PokemonGeneration[]) => {
        // Combine all Pokémon species from selected generations
        const allPokemonSpecies = pipe(
            generations,
            Array.flatMap((gen) => gen.pokemon_species)
        );

        // Filters all possible Pokemon whose names start with the text in the search bar
        // Limit to first 50 results to avoid overwhelming the browser with requests
        const possiblePokemon = pipe(
            Array.filter(allPokemonSpecies, pokemon =>
                pokemon.name.toLowerCase().startsWith(textInBar)
            ),
            Array.take(50)
        );

        // Clear existing display for incremental display
        const currentDisplay = document.querySelector(".pokedex-grid");
        if (currentDisplay) {
            currentDisplay.parentNode?.removeChild(currentDisplay);
        }

        // Create grid for incremental display
        const pokedexGrid = document.createElement("div");
        pokedexGrid.id = "pokedex-grid";
        pokedexGrid.className = "pokedex-grid";
        app.appendChild(pokedexGrid);

        // Gets all the possible Pokemon's details concurrently
        pipe(
            possiblePokemon,
            Array.forEach((pokemon) => {
                // Extract ID from URL using effect-compliant methods only
                const urlGrabber = Array.filter(String.split(pokemon.url, "/"), Boolean);
                // Use Array.last instead of native array access [length - 1]
                const pokemonID = pipe(
                    urlGrabber,
                    Array.last,
                    Option.map(id => parseInt(id, 10)),
                    Option.getOrElse(() => -1)
                );

                // Skip if ID extraction failed (should not happen with valid API)
                if (pokemonID === -1) return;

                // Use cache if available
                if (pokemonCache.has(pokemonID)) {
                    const cachedData = pokemonCache.get(pokemonID)!;
                    // Display immediately from cache (incremental display)
                    const entry = createPokedexEntry(cachedData);
                    insertEntryInOrder(pokedexGrid, entry);
                    return;
                }

                // Fetch and display incrementally
                const fetchEffect = pipe(
                    Effect.tryPromise(() =>
                        fetch(`https://pokeapi.upd-dcs.work/api/v2/pokemon/${pokemonID}`)
                    ),
                    Effect.flatMap(response =>
                        response.ok
                            ? Effect.tryPromise(() => response.json())
                            : Effect.fail(new Error(`HTTP ${response.status} for Pokemon ${pokemonID}`))
                    ),
                    Effect.map((data: PokemonData) => {
                        pokemonCache.set(pokemonID, data);

                        // Display immediately after fetching (incremental display)
                        const entry = createPokedexEntry(data);
                        insertEntryInOrder(pokedexGrid, entry);

                        return data;
                    })
                );

                // Fire-and-forget for incremental display (as required by lab spec)
                Effect.runPromise(fetchEffect).catch(console.error);
            })
        );
    }).catch(console.error);
}

function createPokedexEntry(pokemon: PokemonData): HTMLDivElement {
    const entry = document.createElement("div");
    entry.className = "pokedex-entry"
    // Store ID in dataset for sorting
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

    // Name - Fixed: h1 should contain text directly, not wrap a p
    const nameHeading = document.createElement("h1");
    nameHeading.className = "name-text";
    nameHeading.textContent = capitalize(pokemon.name);

    // Type/s
    const typeText = document.createElement("p");
    typeText.className = "type-text";
    const typesArray = Array.map(pokemon.types, t =>
        `<code>${capitalize(t.type.name)}</code>`
    );
    typeText.innerHTML = Array.join(typesArray, " | ");

    // Height
    const heightText = document.createElement("p");
    heightText.className = "height-text";
    heightText.textContent = `Height: ${pokemon.height / 10} m`;

    // Weight
    const weightText = document.createElement("p");
    weightText.className = "weight-text";
    weightText.textContent = `Weight: ${pokemon.weight / 10} kg`;

    infoDiv.appendChild(nameHeading);
    infoDiv.appendChild(typeText);
    infoDiv.appendChild(heightText);
    infoDiv.appendChild(weightText);

    pokedexEntryContainer.appendChild(sprite);
    pokedexEntryContainer.appendChild(infoDiv);
    entry.appendChild(pokedexEntryContainer);

    return entry;
}

// Listen for input changes (live search as user types)
if (input) {
    input.addEventListener("input", fetchPokemon);
}

// Listen for checkbox changes on all generation checkboxes
pipe(
    Array.range(1, 9),
    Array.forEach((i) => {
        const checkbox = document.getElementById(`gen-${i}`);
        if (checkbox) {
            checkbox.addEventListener("change", fetchPokemon);
        }
    })
);