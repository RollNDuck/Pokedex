const input = document.getElementById("search-input");
const button = document.getElementById("search-btn");

const nameText = document.getElementById("name-text");
const typeText = document.getElementById("type-text");
const heightText = document.getElementById("height-text");
const weightText = document.getElementById("weight-text");

function fetchPokemon() {
  if (!input) return;
  const name = (input as any).value.toLowerCase(); // minimal TS, but safe

  fetch("https://pokeapi.upd-dcs.work/api/v2/pokemon/" + name)
    .then((response) => response.json())
    .then((data) => {
      if (nameText) nameText.textContent = data.name;
      if (typeText) typeText.textContent = data.types[0].type.name;
      if (heightText) heightText.textContent = data.height;
      if (weightText) weightText.textContent = data.weight;
    })
    .catch(() => {
      if (nameText) nameText.textContent = "Not found!";
      if (typeText) typeText.textContent = "-";
      if (heightText) heightText.textContent = "-";
      if (weightText) weightText.textContent = "-";
    });
}

if (button) {
  button.addEventListener("click", fetchPokemon);
}
