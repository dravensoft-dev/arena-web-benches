import { expect } from 'bun:test';
import { driverContract } from './contract.ts';
import driver from './vite7.ts';

// Review Focus 2: `vite7` is an alias, and Analog imports `vite` itself; the log names the Vite that ran, on both layers.
driverContract(driver, false, (_layer, built) => expect(built.log).toContain('vite v7.3.7 building'));
