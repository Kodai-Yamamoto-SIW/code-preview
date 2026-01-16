import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';

export default {
    input: {
        index: 'src/index.ts',
        client: 'src/client.ts'
    },
    output: [
        {
            dir: 'dist',
            format: 'esm',
            sourcemap: true,
            entryFileNames: '[name].esm.js',
            banner: (chunk) => (chunk.name === 'client' ? '"use client";\n' : '')
        },
        {
            dir: 'dist',
            format: 'cjs',
            sourcemap: true,
            entryFileNames: '[name].cjs',
            banner: (chunk) => (chunk.name === 'client' ? '"use client";\n' : '')
        }
    ],
    external: ['react', 'react-dom', '@monaco-editor/react'],
    plugins: [
        resolve(),
        commonjs(),
        postcss({
            // ビルド時に CSS を別ファイルに抽出せず、JS に注入しておくことで、
            // 利用側が単にコンポーネントを import するだけでスタイルが適用されるようにします。
            // (必要に応じて再度 extract に戻すか、分離した styles.css を公開する選択肢も残せます)
            inject: true,
            modules: {
                // CSS Modulesを有効化
                generateScopedName: '[name]__[local]__[hash:base64:5]'
            },
            plugins: [autoprefixer()]
        }),
        typescript({ tsconfig: './tsconfig.json', sourceMap: true })
    ]
};
