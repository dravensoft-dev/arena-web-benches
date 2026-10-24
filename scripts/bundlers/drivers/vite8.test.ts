import { expect } from 'bun:test';
import { driverContract } from './contract.ts';
import driver from './vite8.ts';

driverContract(driver, false, (layer, built) => {
  expect(built.log).toContain('vite v8.3.5 building');
  if (layer === 'angular') expect(built.log).toMatch(/imports vite from \S+\/vite@8\.3\.5\+\S+\/node_modules\/vite\//);
});
