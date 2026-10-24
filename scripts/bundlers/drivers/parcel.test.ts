import { driverContract } from './contract.ts';
import driver from './parcel.ts';

// Parcel takes no CSS through its recipe (the package sheet stops it): the CSS imports are empty assets and `linkSheets` links the sheets.
driverContract(driver, true);
