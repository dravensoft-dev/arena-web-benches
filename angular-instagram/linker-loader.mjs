import linker from '@angular/compiler-cli/linker/babel';
import { transformSync } from '@babel/core';

// The Angular packages are partially compiled (`ɵɵngDeclare`): the linker finishes them, as `ng build` does.
export default function (source, map) {
  if (!source.includes('ɵɵngDeclare')) return this.callback(null, source, map);
  const out = transformSync(source, { filename: this.resourcePath, babelrc: false, configFile: false, compact: false, sourceMaps: false, plugins: [linker] });
  return this.callback(null, out.code, map);
}
