import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';

export default {
    input: 'src/index.ts',
    output: [
        { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
        { file: 'dist/index.cjs', format: 'cjs', sourcemap: true }
    ],
    external: ['react', 'react-dom', '@monaco-editor/react'],
    plugins: [
        resolve(),
        commonjs(),
        postcss({
            extract: 'styles.css',
            modules: {
                // CSS Modulesを有効化
                generateScopedName: '[name]__[local]__[hash:base64:5]'
            },
            plugins: [autoprefixer()]
        }),
        typescript({ tsconfig: './tsconfig.json', sourceMap: true })
    ]
};
