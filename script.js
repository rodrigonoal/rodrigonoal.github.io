
import Dexie from "https://cdn.jsdelivr.net/npm/dexie@3.0.3/dist/dexie.mjs";
const generationSelect = document.querySelector(".gen-select");
const searchBox = document.querySelector(".search-box");
const section = document.querySelector("section");
const order = document.querySelector(".order");
const arrow = document.querySelector(".arrow");

let displayedPokemon = [];
let pokemonArray = [];
let crescentOrder;
let alphabetical;

const db = await new Dexie("pokemonDB");
await createDB(db);

await main();

async function main() {
    pokemonArray = await getAllPokemon(db);

    if (!pokemonArray || !pokemonArray.lenght) {
        const response = await getPokemon();
        pokemonArray = await Promise.all(response.results.map(async pokemon => {
            return await pokemonDT(await getPokemon(pokemon.name))
        }));

        await storePokemon(db, pokemonArray)
    }

    displayedPokemon = [...pokemonArray]

    displayPokemon();
}

// IndexDB
async function createDB(db) {
    await db.version(1).stores({ pokemon: "++id,name" })
}

async function storePokemon(db, array) {
    await db.pokemon.bulkPut(array)
}

async function getAllPokemon(db) {
    await db.open()
    const gen = findGeneration();
    const pokemon = await db.pokemon.where("id").between(gen.offset, (gen.offset + gen.limit)).toArray() || null;
    return pokemon;
}


// Events
order.addEventListener("click", () => {
    alphabetical = !alphabetical;

    displayPokemon();
})

arrow.addEventListener("click", () => {
    crescentOrder = !crescentOrder;

    displayPokemon();
})

searchBox.addEventListener("keydown", () => {
    setTimeout(() => {
        const searchText = searchBox.value.toUpperCase();

        if (!searchText) {
            return main();
        }

        displayedPokemon = pokemonArray.filter(pokemon => pokemon.name.toUpperCase().includes(searchText));
        displayPokemon();
    }, 550)
})

generationSelect.addEventListener("change", () => window.location.href = `index.html?gen=${generationSelect.value}`);


// Service & Service Manipulation
async function getPokemon(id) {
    const pokeApiBaseUrl = "https://pokeapi.co/api/v2/pokemon";
    let params;

    if (id) {
        params = `/${id}`;

    } else {
        const gen = findGeneration();
        params = `?limit=${gen.limit}&offset=${gen.offset}`
    }

    const url = `${pokeApiBaseUrl}${params}`;
    const response = await (await fetch(url)).json();

    return response;
};

function findGeneration() {
    let { gen } = getQueryParams(window.location.href);

    const generations = [{
        number: 1,
        offset: 0,
        limit: 151
    },
    {
        number: 2,
        offset: 151,
        limit: 100
    },
    {
        number: 3,
        offset: 251,
        limit: 135
    },
    {
        number: 4,
        offset: 386,
        limit: 107
    },
    {
        number: 5,
        offset: 493,
        limit: 156
    },
    {
        number: 6,
        offset: 649,
        limit: 72
    },
    {
        number: 7,
        offset: 721,
        limit: 88
    },
    {
        number: 8,
        offset: 809,
        limit: 96
    }];

    if (!gen) gen = localStorage.getItem('gen') || 1;

    localStorage.setItem("gen", gen)

    generationSelect.value = gen;

    return generations.find(generation => generation.number == gen);
}

async function downloadImage(url) { //not used
    const blob = await (await fetch(url)).blob();
    return blob;
    // to use:   var objectURL = URL.createObjectURL(myBlob);
}

// Dom Manipulation
function displayPokemon() {
    clearPokedex();

    if (crescentOrder) {
        arrow.alt = "crescent";
        arrow.classList.remove('down');
        arrow.classList.add('up');

    } else {
        arrow.alt = "decrescent";
        arrow.classList.remove('up');
        arrow.classList.add('down');

    }

    if (alphabetical) {
        order.alt = "alphabetical order";
        order.src = "/images/alphabetical_order.svg";

        displayedPokemon.sort((a, b) => {
            if (crescentOrder) {
                if (a.name < b.name) return 1;
                if (a.name > b.name) return -1;
            } else {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
            }
            return 0;
        })

    } else {
        order.alt = "numerical order";
        order.src = "/images/numerical_order.svg";

        displayedPokemon.sort((a, b) => {
            if (crescentOrder) return b.id - a.id
            else return a.id - b.id
        })
    }

    displayedPokemon.forEach(pokemon => section.appendChild(createCard(pokemon)));
}

function createCard(pokemon) {
    const typeColor = getTypeColor(pokemon);

    const cardWrapper = document.createElement("a");
    cardWrapper.classList.add('card-wrapper');
    cardWrapper.href = `/pages/details.html?id=${pokemon.id}`;
    cardWrapper.id = `${pokemon.id}`;

    const card = document.createElement("div");
    card.classList.add('card');
    card.style.borderColor = typeColor;

    const cardId = document.createElement("div");
    cardId.classList.add('card-id')
    cardId.innerHTML = `#${formatNumber(pokemon.id)}`;
    cardId.style.color = typeColor;

    const cardImage = document.createElement("div");
    cardImage.classList.add('card-image')
    cardImage.innerHTML = `<img alt='${pokemon.name}' src='${pokemon.sprites.other['official-artwork'].front_default}'>`;


    const cardName = document.createElement("div");
    cardName.classList.add('card-name')
    cardName.innerHTML = capitalize(pokemon.name);
    cardName.style.backgroundColor = typeColor;

    cardWrapper.appendChild(card)
    cardWrapper.appendChild(cardName)
    card.appendChild(cardId)
    card.appendChild(cardImage)


    return cardWrapper;
}


// Utils
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
};

function formatNumber(number) {
    return `${number}`.padStart(3, '0')
};

function getTypeColor(pokemon) {
    return `var(--${pokemon.types[0].type.name})`;
};

function clearPokedex() {
    section.innerHTML = "";
}

function getQueryParams(url) {
    const paramArr = url.slice(url.indexOf('?') + 1).split('&');
    const params = {};
    paramArr.map(param => {
        const [key, val] = param.split('=');
        params[key] = decodeURIComponent(val);
    })
    return params;
}

async function pokemonDT(pokemon) {
    const name = pokemon.name.split('-')[0];
    const { id, height, weight, abilities, types, stats, sprites, species } = pokemon;
    return { name, id, height, weight, abilities, types, stats, sprites, species };
}