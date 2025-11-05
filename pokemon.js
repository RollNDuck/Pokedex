var input = document.getElementById("search-input");
var button = document.getElementById("search-btn");

var nameText = document.getElementById("name-text");
var typeText = document.getElementById("type-text");
var heightText = document.getElementById("height-text");
var weightText = document.getElementById("weight-text");
var sprite = document.getElementById("sprite")

function fetchPokemon() {
    if (!input)
        return;
    var name = input.value.toLowerCase();
    fetch("https://pokeapi.upd-dcs.work/api/v2/pokemon/" + name)
        .then(function (response) {
        return response.json();
    })
        .then(function (data) {
        sprite.src = data.sprites.front_default;
        nameText.textContent = JSON.stringify(data.name.charAt(0).toUpperCase() + data.name.slice(1), null, 4).replace(/"/g, '');
        typeText.textContent = JSON.stringify(data.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(' | '), null, 4).replace(/"/g, '');
        heightText.textContent = JSON.stringify("Height: " + data + ' m', null, 4).replace(/"/g, '');
        weightText.textContent = JSON.stringify("Weight: " + data.weight / 10 + ' kg', null, 4).replace(/"/g, '');
    })["catch"](function () {
        sprite.src = None;
        nameText.textContent = "Not found!";
        typeText.textContent = "";
        heightText.textContent = "";
        weightText.textContent = "";
    });
}

if (button) {
    button.addEventListener("click", fetchPokemon);
}
