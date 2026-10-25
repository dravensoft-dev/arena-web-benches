// The Angular packages are partially compiled (`ɵɵngDeclare`): this transformer runs the linker over each, as `ng build` does.
const { Transformer } = require('@parcel/plugin');
const { transformSync } = require('@babel/core');
const linker = require('@angular/compiler-cli/linker/babel').default;

module.exports = new Transformer({
  async transform({ asset }) {
    const code = await asset.getCode();
    if (!code.includes('ɵɵngDeclare')) return [asset];
    const out = transformSync(code, { filename: asset.filePath, babelrc: false, configFile: false, compact: false, sourceMaps: false, plugins: [linker] });
    asset.setCode(out.code);
    return [asset];
  },
});
