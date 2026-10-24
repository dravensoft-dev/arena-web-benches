// A local Parcel transformer (F5, D1): links a partially compiled Angular package with the Angular linker.
// `linkPartial` is the benches' one Babel call (../angular-link.ts); `options.projectRoot` is the half whose
// `@angular/compiler-cli` runs. A file with no `ɵɵngDeclare` is returned as it is.
const { Transformer } = require('@parcel/plugin');
const { linkPartial } = require('../angular-link.ts');

module.exports = new Transformer({
  async transform({ asset, options }) {
    const code = await asset.getCode();
    const linked = linkPartial(code, asset.filePath, options.projectRoot);
    if (linked !== null) asset.setCode(linked);
    return [asset];
  },
});
