import Dexie from "https://cdn.jsdelivr.net/npm/dexie@3.0.3/dist/dexie.mjs";

const pokemonEvolutionChain = document.querySelector(".pokemon-evolution-chain")
const pokemonDescription = document.querySelector(".pokemon-description")
const pokemonAbilities = document.querySelector(".pokemon-abilities")
const pokemonWeight = document.querySelector(".pokemon-weight")
const pokemonHeight = document.querySelector(".pokemon-height")
const pokemonImage = document.querySelector(".pokemon-image")
const pokemonTypes = document.querySelector(".pokemon-types")
const pokemonStats = document.querySelector(".pokemon-stats")
const pokemonName = document.querySelector(".pokemon-name")
const pokemonId = document.querySelector(".pokemon-id")

let pokemon;
let response;

const db = await new Dexie("pokemonDB");
await createDB(db);

await main();

async function main() {
    const { id } = getQueryParams(window.location.href);
    response = await getPokemonById(db, id)[0];

    if (!response) {
        response = await getPokemon(id);
    }

    pokemon = await pokemonToModelDT(response);

    createPage(pokemon);
}


// IndexDB
async function createDB(db) {
    await db.version(1).stores({ pokemon: "++id,name" })
}

async function getPokemonById(db, id) {
    await db.open()
    const pokemon = await db.pokemon.where("id").equals(id).toArray() || null;
    return pokemon;
}


// Service & Service Manipulation
async function getPokemon(id) {
    const pokeApiBaseUrl = "https://pokeapi.co/api/v2/pokemon";

    const url = `${pokeApiBaseUrl}/${id}`;
    const response = await (await fetch(url)).json();

    return response;
};

async function findEvolutionChain(descriptionResponse) {
    const { chain: chainResponse } = await (await fetch(descriptionResponse.evolution_chain.url)).json();



    function getChain(evolutionChain, chainResponse, phase = 0) {
        const { species } = chainResponse;
        const pokemon = species;
        pokemon.id = species.url.split("/")[6];
        evolutionChain.push([]);
        evolutionChain[phase].push(pokemon);

        const newPhase = phase + 1;
        for (let i = 0; i < chainResponse.evolves_to.length; i++) {
            if (chainResponse.evolves_to.length > 0) {
                const nextPokemon = chainResponse.evolves_to[i];
                getChain(evolutionChain, nextPokemon, newPhase);
            } else {
                return;
            }
        }
    }

    let evolutionChain = [];

    getChain(evolutionChain, chainResponse);

    let forms = [];

    evolutionChain = await Promise.all(evolutionChain.map(async (phase, phaseIndex) => {
        const newPhase = await Promise.all(phase.map(async pokemon => {
            const { id, name } = pokemon;
            response = await getPokemonById(db, id)[0];

            if (!response) {
                response = await getPokemon(id);
            }

            let newPokemon = { id, name, sprite: response.sprites.front_default };

            const { varieties } = await (await fetch(response.species.url)).json();

            for (let variety of varieties) {
                const vari = await (await fetch(variety.pokemon.url)).json();
                let variPhase = phaseIndex;

                if (vari.name.includes('-mega') || vari.name.includes('-gmax')) variPhase++;

                if (vari.sprites.other['official-artwork'].front_default === null ||
                    (vari.name.includes('rockruff') && variPhase === phaseIndex) ||
                    (vari.name.includes('pikachu') && variPhase === phaseIndex) ||
                    vari.name.includes('totem') && variPhase === phaseIndex ||
                    vari.sprites.front_default === null) continue;

                forms.push({
                    phase: variPhase,
                    id: vari.id,
                    name: vari.name,
                    sprite: vari.sprites.front_default
                });
            }


            return newPokemon;
        }))
        return newPhase;

    }))

    if (forms.length >= evolutionChain.length) {
        evolutionChain.push([])
    }

    evolutionChain = evolutionChain.map((phase, index) => {
        for (let form of forms) {
            if (phase?.find(pokemon => pokemon.id == form.id)) continue;
            if (form.phase === index) {
                phase.push(form)
            }
        }
        return phase
    })

    evolutionChain = evolutionChain.filter(phase => phase?.length > 0);

    return evolutionChain;
}

async function pokemonToModelDT(pokemonResponse) {
    const { name, id, height, weight, abilities, types, stats } = pokemonResponse;
    const image = pokemonResponse.sprites.other['official-artwork'].front_default;
    const descriptionResponse = await (await fetch(pokemonResponse.species.url)).json();
    const description = descriptionResponse.flavor_text_entries.findLast(entry => entry.language.name === "en").flavor_text;

    const evolutionChain = await findEvolutionChain(descriptionResponse);

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
        ],
        evolutionChain
    }

}

async function getAbilityText(a) { //unused
    const response = await (await fetch(a.ability.url)).json();
    const entry = response.effect_entries.find(entry => entry.language.name === "en");
    return entry.effect;
}


// DOM Manipulation 
function createPage(pokemon) {
    pokemonName.innerHTML = pokemon.name.split("-").map(s => capitalize(s)).join(' ');
    pokemonId.innerHTML = pokemon.id < 898 ? formatNumber(pokemon.id).padStart(4, '#') : '';
    pokemonImage.innerHTML = `<img alt='${pokemon.name}' src='${pokemon.image}'>`;
    pokemonWeight.innerHTML = `${(pokemon.weight * 0.1).toFixed(1)} kg`;
    pokemonHeight.innerHTML = `${(pokemon.height * 0.1).toFixed(1)} m`;
    pokemonDescription.innerHTML = pokemon.description;
    pokemon.types.forEach(t => pokemonTypes.innerHTML += `<div style="background-color: var(--${t.type.name})" class="type">${capitalize(t.type.name)}</div>`)
    pokemon.abilities.forEach(async (a, index) => index <= 1 ? pokemonAbilities.innerHTML += `<span class="pokemon-ability">${capitalize(a.ability.name)}</span>` : undefined)
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

    pokemon.evolutionChain.forEach((phase, index) => {
        const phaseId = `evo-phase-${index}`
        pokemonEvolutionChain.innerHTML += `<div class="evo-phase" id=${phaseId}></div>`

        const pokemonEvolutionPhase = document.querySelector(`#${phaseId}`)

        phase.forEach(evo => {
            const pokeName = evo.name.split("-").map(s => capitalize(s)).join(' ')
            pokemonEvolutionPhase.innerHTML += `
                <a href='details.html?id=${evo.id}'>
                <img src=${evo.sprite} alt=${pokeName}></img>
                    <div class="evo-name pokemon-type-color-font">
                        ${pokeName}
                    </div>
                <a>
                `
        })
    })

    const typeColor = getTypeColor(pokemon);
    document.body.style.backgroundColor = typeColor;
    const pokemonTypeColorFont = document.body.querySelectorAll(".pokemon-type-color-font")
    const pokemonTypeColorBackground = document.body.querySelectorAll(".pokemon-type-color-background")
    pokemonTypeColorFont.forEach(div => div.style.color = typeColor)
    pokemonTypeColorBackground.forEach(div => div.style.backgroundColor = typeColor)
}


// Utils
function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1)
};

function formatNumber(number) {
    return `${number}`.padStart(3, '0')
};

function getTypeColor(pokemon) {
    return `var(--${pokemon.types[0].type.name})`
};

function getQueryParams(url) {
    const paramArr = url.slice(url.indexOf('?') + 1).split('&');
    const params = {};
    paramArr.map(param => {
        const [key, val] = param.split('=');
        params[key] = decodeURIComponent(val);
    })
    return params;
}
