import { transformAsync, TransformOptions } from '@babel/core'
import ts_preset from '@babel/preset-typescript'
import solid_preset from 'babel-preset-solid'
import { Import } from 'bun'
import { dlopen, FFIType, ptr } from 'bun:ffi'
import { mkdirSync } from 'fs'
import { parse as path_parse, resolve as path_resolve } from 'path'
import { compileStringAsync as sass_compile } from 'sass-embedded'

const {
    symbols: { watch_init, watch_check, watch_add },
} = dlopen('libwatch.so', {
    watch_init: {
        returns: FFIType.i32,
    },
    watch_close: {
        args: [FFIType.i32],
    },
    watch_check: {
        args: [FFIType.i32, FFIType.ptr],
        returns: FFIType.i32,
    },
    watch_add: {
        args: [FFIType.i32, FFIType.cstring],
        returns: FFIType.i32,
    },
    watch_remove: {
        args: [FFIType.i32, FFIType.i32],
        returns: FFIType.i32,
    },
})

function watch_file(path: string): number {
    let wd = watch_add(inotify, ptr(Buffer.from(path + '\0')))
    if (wd < 1) throw new Error('cant watch path: ' + path)
    return wd
}

function mkdir(...paths: string[]) {
    paths.forEach(p => mkdirSync(p, { recursive: true }))
}

function copy(src: string, dist: string) {
    if (!Bun.spawnSync(['cp', src, dist]).success) {
        throw new Error('cant copy ' + src + ' to ' + dist)
    }
}

const inotify = watch_init()
const hasher = new Bun.CryptoHasher('md5')

var index_hash = ''
const transpiler = new Bun.Transpiler()

const DIR_SRC = path_resolve(import.meta.dir, 'src/')
const DIR_BUNDLE = path_resolve(import.meta.dir, 'bundle/')
const DIR_DIST = path_resolve(import.meta.dir, 'dist/')
const DIR_PUBLIC = path_resolve(import.meta.dir, 'public/')
const BUNDLE_INDEX = path_resolve(DIR_BUNDLE, 'index.js')
const LT_ASSETS = path_resolve(DIR_DIST, 'latest_assets.json')

if (!Bun.spawnSync(['rm', '-rf', DIR_DIST, DIR_BUNDLE]).success)
    throw new Error('cant delete dirs')

mkdir(DIR_DIST, DIR_BUNDLE)

copy(
    path_resolve(import.meta.dir, 'bundle.tsconfig.json'),
    path_resolve(DIR_BUNDLE, 'tsconfig.json')
)

Bun.spawnSync(['cp', '-T', '-r', '-f', DIR_PUBLIC, DIR_DIST])

type Asset = {
    uid: number
    pub: string
    dir: string
    ext: string
    path: string
    base: string
    name: string
    hash: string
    dist: string
    type: 'style' | 'script'
    // output: string
    src_dir: string
    builder: () => Promise<boolean>
    dist_dir: string
    rebundle: boolean
    // source_map: string
}

// const bundle_output: { [path: string]: string } = {}
const wd_asset: Map<number, Asset> = new Map()
const pd_asset: Set<string> = new Set()

let wd = watch_file(path_resolve(DIR_PUBLIC, 'refresh.js'))
wd_asset.set(wd, {
    uid: wd_asset.size,
    path: path_resolve(DIR_PUBLIC, 'refresh.js'),
    dir: 'public',
    rebundle: true,
    ext: 'js',
    pub: '',
    base: 'refresh.js',
    dist: '',
    hash: '',
    name: '',
    type: 'script',
    async builder() {
        Bun.spawnSync(['cp', '-f', this.path, DIR_DIST])
        return true
    },
    src_dir: '',
    dist_dir: '',
})

const babel_opt: TransformOptions = {
    babelrc: false,
    configFile: false,
    root: process.cwd(),
    presets: [
        [ts_preset, {}],
        [solid_preset, { hydratable: false }],
    ],
}

async function update_lt_assets() {
    let assets = {
        scripts: ['index.' + index_hash + '.js'],
        styles: [] as [number, string][],
    }

    for (const [, asset] of wd_asset.entries()) {
        if (asset.type != 'style') continue
        assets.styles.push([asset.uid, asset.pub])
    }

    await Bun.write(LT_ASSETS, JSON.stringify(assets))
}

async function sass_builder(this: Asset) {
    let content = await Bun.file(this.path).text()

    let output = await sass_compile(content, {
        style: 'compressed',
        sourceMap: true,
        sourceMapIncludeSources: true,
    })

    hasher.update(output.css)
    let hash_sum = hasher.digest('hex')
    if (this.hash == hash_sum) return false

    let old_css_path = path_resolve(this.dist, `${this.name}.${this.hash}.css`)
    this.hash = hash_sum
    let filename = `${this.name}.${this.hash}.css`
    let css_path = path_resolve(this.dist, filename)

    Bun.spawnSync(['rm', '-rf', old_css_path, old_css_path + '.map'])

    output.css += '\n\n/*# sourceMappingURL=' + filename + '.map */'

    // this.output = output.css
    await Bun.write(css_path, output.css)

    let source_map = output.sourceMap!
    source_map.sources = ['/src/' + this.dir + '/' + this.base]

    await Bun.write(css_path + '.map', JSON.stringify(source_map, undefined, 4))

    this.pub = `style/${this.dir}/${filename}`

    return true
}

async function json_builder(this: Asset) {
    // this.output = await Bun.file(this.path).text()
    copy(this.path, this.dist)
    return true
}

async function update_imports(content: string, asset: Asset): Promise<string> {
    let imports: Import[] = transpiler.scanImports(content)

    for (let i = 0; i < imports.length; ++i) {
        let path = imports[i]!.path

        if (path.startsWith('solid-js')) continue

        let abs_path = ''
        if (path.startsWith('./')) {
            abs_path = Bun.resolveSync(path, asset.src_dir)
        } else {
            abs_path = Bun.resolveSync(path, import.meta.dir)
        }

        await check_path(abs_path)

        if (path.endsWith('.scss')) {
            let dx = content.indexOf(path)
            content =
                content.slice(0, dx + path.length + 1) +
                ' */' +
                content.slice(dx + path.length + 1)
            let before_imp_path = content.slice(0, dx - 1)
            let sx = before_imp_path.lastIndexOf('import')
            content = content.slice(0, sx) + '/* ' + content.slice(sx)
            // content =
            //     before_imp_path.slice(0, sx) +
            //     content.slice(dx + path.length + 1)
        }
    }

    return content
}

async function ts_builder(this: Asset) {
    let content = await Bun.file(this.path).text()

    try {
        content = await transpiler.transform(content, 'ts')
    } catch (error) {
        console.log(error)
        return false
    }

    content = await update_imports(content, this)

    // bundle_output[this.dist_dir] = content

    await Bun.write(path_resolve(this.dist, this.name + '.js'), content)
    return true
}

async function tsx_builder(this: Asset) {
    let content = await Bun.file(this.path).text()

    try {
        let res = await transformAsync(content, {
            ...babel_opt,
            filename: this.path,
        })

        if (!res || !res.code) {
            throw new Error('could not transform ' + this.path + 'to js')
        }

        content = res.code
    } catch (error) {
        console.log(error)
        return false
    }

    content = await update_imports(content, this)

    // bundle_output[this.dist_dir] = content

    await Bun.write(path_resolve(this.dist, this.name + '.js'), content)
    return true
}

async function bundle(): Promise<boolean> {
    // await Bun.write(
    //     BUNDLE_INDEX,
    //     bundle_output[BUNDLE_INDEX.slice(DIR_BUNDLE.length)]
    // )
    let st = performance.now()
    console.log('\x1b[32mBundling\x1b[m')
    const result = await Bun.build({
        entrypoints: [BUNDLE_INDEX],
        outdir: DIR_DIST,
        splitting: false,
        sourcemap: 'external',
        minify: false,
        naming: '[name].[hash].[ext]',
        loader: { '.js': 'js' },
        plugins: [
            // {
            //     name: 'ignore styles',
            //     async setup(build) {
            // build.onLoad({ filter: /\w/ }, ({ path }) => {
            //     let key = path.slice(DIR_BUNDLE.length)
            //     console.log(key)
            //     console.log(bundle_output[key])
            //     return { contents: bundle_output[key] }
            // })
            //     },
            // },
        ],
    })
    let tk = ~~(performance.now() - st)
    console.log(`took: \x1b[93m${tk}ms\x1b[m\n`)

    for (const artifact of result.outputs) {
        if (artifact.kind == 'entry-point' && artifact.hash) {
            if (index_hash != artifact.hash) {
                // Bun.spawnSync([
                //     'rm',
                //     path_resolve(DIR_DIST, 'index.' + index_hash + '.js'),
                //     path_resolve(DIR_DIST, 'index.' + index_hash + '.js.map'),
                // ])
                index_hash = artifact.hash
                return true
            }
        }
    }
    return false
}

async function update_html() {
    let st = performance.now()
    console.log("\x1b[32mUpdating the \x1b[93m'index.html'\x1b[m")
    let content = ''

    for (const [, asset] of wd_asset.entries()) {
        if (asset.type == 'style') {
            content += `
                <link
                    id="stylesheet_${asset.uid}"
                    rel="stylesheet"
                    href="${asset.pub}"
                />\n
`
        }
    }

    const template = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Zagros</title>
        <script id='index_script' defer src="index.${index_hash}.js"></script>
        <script defer src="refresh.js"></script>
        
        <!-- styles -->
        ${content}
        <!-- end of styles -->
    </head>
    <body>
        <div class="root" id="root"></div>
    </body>
</html>
`

    await Bun.write('dist/index.html', template)
    let tk = ~~(performance.now() - st)
    console.log(`took: \x1b[93m${tk}ms\x1b[m\n`)
}

function sass_add(path: string): Asset {
    let info = path_parse(path)
    let dir = info.dir.slice(DIR_SRC.length + 1)
    let dist = path_resolve(DIR_DIST, 'style', dir)
    mkdir(dist)

    let wd = watch_file(path)

    pd_asset.add(path)
    const asset: Asset = {
        uid: wd_asset.size,
        path: path,
        base: info.base,
        name: info.name,
        type: 'style',
        hash: '',
        dist,
        dist_dir: `${dir}/${info.name}.css`,
        ext: info.ext.slice(1),
        dir,
        src_dir: info.dir,
        pub: `style/${dir}/${info.name}.css`,
        rebundle: false,
        builder: sass_builder,
        // output: '',
        // source_map: '',
    }
    wd_asset.set(wd, asset)
    return asset
}

function tsj_add(path: string, builder: () => Promise<boolean>): Asset {
    let info = path_parse(path)
    let dir = info.dir.slice(DIR_SRC.length + 1)
    let ext = info.ext.slice(1)
    let dist_dir = `${dir}/${info.name}.${ext == 'json' ? 'json' : 'js'}`

    let dist = path_resolve(DIR_BUNDLE, dir)
    mkdir(dist)

    let wd = watch_file(path)

    pd_asset.add(path)
    const asset: Asset = {
        uid: wd_asset.size,
        path: path,
        base: info.base,
        name: info.name,
        type: 'script',
        hash: '',
        dist,
        dist_dir,
        ext,
        dir,
        src_dir: info.dir,
        pub: '',
        rebundle: true,
        builder,
        // output: '',
        // source_map: '',
    }

    wd_asset.set(wd, asset)
    return asset
}

async function check_path(path: string): Promise<boolean> {
    let asset: Asset

    if (!pd_asset.has(path)) {
        if (path.endsWith('.scss')) {
            asset = sass_add(path)
        } else if (path.endsWith('.tsx')) {
            asset = tsj_add(path, tsx_builder)
        } else if (path.endsWith('.ts')) {
            asset = tsj_add(path, ts_builder)
        } else if (path.endsWith('.json')) {
            asset = tsj_add(path, json_builder)
        } else {
            return false
        }

        console.log('found new path: ' + path)

        return await asset.builder()
    }

    return false
}

let st_indexing = performance.now()

console.log('\x1b[32mIndexing\x1b[m')
await Bun.build({
    entrypoints: ['./src/index.tsx'],
    plugins: [
        {
            name: 'extract paths',
            async setup(build) {
                build.onLoad({ filter: /\.scss$/ }, async ({ path }) => {
                    sass_add(path)
                    return { contents: '' }
                })

                build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
                    tsj_add(path, tsx_builder)
                    return {
                        contents: await Bun.file(path).text(),
                        loader: 'tsx',
                    }
                })

                build.onLoad({ filter: /\.ts$/ }, async ({ path }) => {
                    tsj_add(path, ts_builder)

                    return {
                        contents: await Bun.file(path).text(),
                        loader: 'ts',
                    }
                })

                build.onLoad({ filter: /\.json$/ }, async ({ path }) => {
                    tsj_add(path, json_builder)

                    return { contents: '' }
                })
            },
        },
    ],
})
let tk = ~~(performance.now() - st_indexing)
console.log(`indexing took: \x1b[93m${tk}ms\x1b[m\n`)

// build all the files

let st_build = performance.now()
let total_assets = Array.from(wd_asset.keys()).length
console.log(`\x1b[32mBuilding all the assets: \x1b[95m${total_assets}\x1b[m`)
for (const [, asset] of wd_asset.entries()) {
    await asset.builder()
}
tk = ~~(performance.now() - st_build)
console.log(`building took: \x1b[93m${tk}ms\x1b[m\n`)

// bundle the scripts
await bundle()

// update the html
await update_html()

await update_lt_assets()

var changed = new Uint32Array(2)

async function check_reload(): Promise<'none' | 'script' | 'style'> {
    if (!watch_check(inotify, ptr(changed))) {
        return 'none'
    }

    let [wd, mask] = changed
    let asset = wd_asset.get(wd)
    if (!asset) throw new Error('invalid wd: ' + wd)

    if (mask & 0x00008000) {
        wd_asset.delete(wd)
        wd = watch_file(asset.path)
        wd_asset.set(wd, asset)
        return 'none'
    }

    let start = performance.now()
    console.log(`asset \x1b[92m'${asset.dir}/${asset.base}'\x1b[m was changed`)
    let update = await asset.builder()
    let took = ~~(performance.now() - start)
    console.log(`build took: \x1b[93m${took}ms\x1b[m\n`)

    if (!update) return 'none'

    if (asset.rebundle) {
        if (await bundle()) {
            await update_html()
            await update_lt_assets()
            return 'script'
        }
    } else {
        await update_html()

        await update_lt_assets()
        return 'style'
    }

    return 'none'
}

console.log('watching files\n')

while (true) {
    Bun.sleepSync(200)
    await check_reload()
}
