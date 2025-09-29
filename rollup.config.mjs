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
