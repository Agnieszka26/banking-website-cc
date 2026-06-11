import { createServerFn } from "@tanstack/react-start";

export const getPokemon = createServerFn({ method: "GET" }).handler(
	async () => {
		const response = await fetch("https://pokeapi.co/api/v2/pokemon/");
		const data = await response.json();
		console.log("from server", data);

		return data;
	},
);
