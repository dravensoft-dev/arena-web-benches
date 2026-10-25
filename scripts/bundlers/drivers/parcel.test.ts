import { driverContract } from './contract.ts';
import driver from './parcel.ts';

// Parcel bundles the CSS itself (D24): its page links the sheets it wrote, so `linkSheets` has nothing to do.
driverContract(driver, false);
