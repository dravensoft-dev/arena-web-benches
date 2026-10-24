import { expect } from 'bun:test';
import { driverContract } from './contract.ts';
import driver from './vite8.ts';

driverContract(driver, false, (_layer, built) => expect(built.log).toContain('vite v8.3.5 building'));
