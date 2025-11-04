var input = document.getElementById("search-input");
var button = document.getElementById("search-btn");
var nameText = document.getElementById("name-text");
var typeText = document.getElementById("type-text");
var heightText = document.getElementById("height-text");
var weightText = document.getElementById("weight-text");
function fetchPokemon() {
    if (!input)
        return;
    var name = input.value.toLowerCase();
    fetch("https://pokeapi.upd-dcs.work/api/v2/pokemon/" + name)
        .then(function (response) {
        return response.json();
    })
        .then(function (data) {
        nameText.textContent = 'Name: ' + JSON.stringify(data.name, null, 4);
        typeText.textContent = 'Type: ' + JSON.stringify(data.types.map(t => t.type.name).join(', '), null, 4);
        heightText.textContent = 'Height: ' + JSON.stringify(data.height / 10, null, 4);
        weightText.textContent = 'Weight: ' + JSON.stringify(data.weight / 10, null, 4);
    });
}

if (button) {
    button.addEventListener("click", fetchPokemon);
}
