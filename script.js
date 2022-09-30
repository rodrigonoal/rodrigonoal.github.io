let pokemonArray = [];
let displayedPokemon = [];
let crescentOrder = false;
let alphabetical = false;

const section = document.querySelector("section");
const order = document.querySelector(".order");
const arrow = document.querySelector(".arrow");
const searchBox = document.querySelector(".search-box");

order.addEventListener("click", () => {
    alphabetical = !alphabetical;

    if (alphabetical) {
        order.alt = "alphabetical order";
        order.src = "/images/alphabetical_order.svg";

    } else {
        order.alt = "numerical order";
        order.src = "/images/numerical_order.svg";

    }
    displayPokemon();
})

arrow.addEventListener("click", () => {
    crescentOrder = !crescentOrder;

    if (crescentOrder) {
        arrow.alt = "crescent";
        arrow.classList.add('flip');

    } else {
        arrow.alt = "decrescent";
        arrow.classList.remove('flip');

    }
    displayPokemon();
})

searchBox.addEventListener("keydown", () => {
    setTimeout(() => {
        const searchText = searchBox.value;

        if (!searchText) {
            return main()
        }

        displayedPokemon = pokemonArray.filter(pokemon => pokemon.name.includes(searchText));
        displayPokemon();
    }, 500)
})


async function main() {
    pokemonArray = JSON.parse(localStorage.getItem('pokemonArray'));

    if (!pokemonArray || !pokemonArray.lenght) {
        const response = await getPokemon();
        const tempPokemon = await Promise.all(response.results.map(async pokemon => await getPokemon(pokemon.name)));

        pokemonArray = tempPokemon.map(pokemon => {
            const { id, height, weight, abilities, types, stats, sprites, species } = pokemon;
            const name = pokemon.name.split('-')[0]
            return { name, id, height, weight, abilities, types, stats, sprites, species }
        })
        localStorage.setItem("pokemonArray", JSON.stringify(pokemonArray));
    }

    displayedPokemon = [...pokemonArray]

    displayPokemon();
}

async function getPokemon(name) {
    const pokeApiBaseUrl = "https://pokeapi.co/api/v2/pokemon/";
    const gen = findGeneration();

    const url = `${pokeApiBaseUrl}${name || `?limit=${gen.limit}&offset=${gen.offset}`}`;
    const response = await (await fetch(url)).json();

    return response;
};

function findGeneration() {
    const { gen } = getQueryParams(window.location.href);

    const gens = [{
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
    }]

    return gens.find(generation => generation.number == (gen ?? 1));
}

function displayPokemon() {
    clearPokedex();

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

function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1)
};

function formatNumber(number) {
    return `${number}`.padStart(3, '0')
};

function getTypeColor(pokemon) {
    return `var(--${pokemon.types[0].type.name})`
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
