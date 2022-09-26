let pokemon;

const pokemonName = document.querySelector(".pokemon-name")
const pokemonId = document.querySelector(".pokemon-id")
const pokemonImage = document.querySelector(".pokemon-image")
const pokemonTypes = document.querySelector(".pokemon-types")
const pokemonAbilities = document.querySelector(".pokemon-abilities")
const pokemonDescription = document.querySelector(".pokemon-description")
const pokemonStats = document.querySelector(".pokemon-stats")
const pokemonWeight = document.querySelector(".pokemon-weight")
const pokemonHeight = document.querySelector(".pokemon-height")


async function main() {
    const { id } = getQueryParams(window.location.href);
    const response = await getPokemon(id)

    pokemon = await pokemonToModelDT(response);

    createPage(pokemon);
}

async function getPokemon(id) {
    const pokeApiBaseUrl = "https://pokeapi.co/api/v2/pokemon/";

    const url = `${pokeApiBaseUrl}${id}`;
    const response = await (await fetch(url)).json();

    return response;
};

async function pokemonToModelDT(pokemonResponse) {
    const { name, id, height, weight, abilities, types, stats } = pokemonResponse;
    const image = pokemonResponse.sprites.other['official-artwork'].front_default;
    const descriptionResponse = await (await fetch(pokemonResponse.species.url)).json();
    const description = descriptionResponse.flavor_text_entries[9].flavor_text;

    return {
        id,
        name,
        image,
        weight,
        height,
        types,
        abilities,
        description,
        stats: [
            {
                name: "hp",
                value: stats[0].base_stat
            }, {
                name: "atk",
                value: stats[1].base_stat
            }, {
                name: "def",
                value: stats[2].base_stat
            }, {
                name: "satk",
                value: stats[3].base_stat
            }, {
                name: "sdef",
                value: stats[4].base_stat
            }, {
                name: "spd",
                value: stats[5].base_stat
            }
        ]
    }

}

function createPage(pokemon) {
    pokemonName.innerHTML = capitalize(pokemon.name);
    pokemonId.innerHTML = formatNumber(pokemon.id).padStart(4, '#');
    pokemonImage.innerHTML = `<img alt='${pokemon.name}' src='${pokemon.image}'>`;
    pokemonWeight.innerHTML = `${(pokemon.weight * 0.1).toFixed(1)} kg`;
    pokemonHeight.innerHTML = `${(pokemon.height * 0.1).toFixed(1)} m`;
    pokemonDescription.innerHTML = pokemon.description;
    pokemon.types.forEach(t => pokemonTypes.innerHTML += `<div style="background-color: var(--${t.type.name})" class="type">${capitalize(t.type.name)}</div>`)
    pokemon.abilities.forEach(a => pokemonAbilities.innerHTML += `<span class="pokemon-ability">${capitalize(a.ability.name)}</span>`)
    pokemon.stats.forEach(stat => {
        const statPercentage = (stat.value * 100) / 255;

        pokemonStats.innerHTML += `
                <div>
                    <div class="stat-name pokemon-type-color-font">
                        ${stat.name.toUpperCase()}
                    </div>
                    <div class="stat-value">
                        ${formatNumber(stat.value)}
                    </div>
                    <div class="stat-progress-bar">
                        <div class="progress-bar-full pokemon-type-color-background" style="width: ${statPercentage}%">
                        </div>
                        <div class="progress-bar-empty pokemon-type-color-background" style="width: ${100 - statPercentage}%">
                        </div>
                    </div>
                </div>
        `
    })

    const typeColor = getTypeColor(pokemon);
    document.body.style.backgroundColor = typeColor;
    const pokemonTypeColorFont = document.body.querySelectorAll(".pokemon-type-color-font")
    const pokemonTypeColorBackground = document.body.querySelectorAll(".pokemon-type-color-background")
    pokemonTypeColorFont.forEach(div => div.style.color = typeColor)
    pokemonTypeColorBackground.forEach(div => div.style.backgroundColor = typeColor)

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

function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1)
};

function formatNumber(number) {
    return `${number}`.padStart(3, '0')
};

function getTypeColor(pokemon) {
    return `var(--${pokemon.types[0].type.name})`
};


