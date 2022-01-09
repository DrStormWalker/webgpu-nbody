import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
//import plainText from "vite-plugin-plain-text";

function wgslTransform() {
    return {
        name: "wgsl-tranform",

        transform(src, id) {
            if (/\.wgsl$/.test(id)) {
                return {
                    code: `export default ${JSON.stringify(src)}`,
                    map: null,
                }
            }
        }
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        wgslTransform(),
        svelte({
            preprocess: [ sveltePreprocess({ typescript: true, postcss: true }) ],
        }),
    ],
});
