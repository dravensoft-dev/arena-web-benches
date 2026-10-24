import { driverContract } from './contract.ts';
import driver from './esbuild.ts';

// esbuild takes the CSS imports itself: one `.css` for the entry, linked by the driver, so `linkSheets` has nothing to do.
driverContract(driver, false);
