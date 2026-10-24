import { expect } from 'bun:test';
import { driverContract } from './contract.ts';
import driver from './vite7.ts';

// Review Focus 2: `vite7` is an alias, and Analog imports `vite` itself. The banner names the Vite the binary is; on
// Angular the preload also names the Vite Analog's import resolved to, and that is 7.3.7 too.
driverContract(driver, false, (layer, built) => {
  expect(built.log).toContain('vite v7.3.7 building');
  if (layer === 'angular') expect(built.log).toMatch(/imports vite from \S+\/vite@7\.3\.7\+\S+\/node_modules\/vite\//);
});
