import { driverContract } from './contract.ts';
import driver from './angular.ts';

// The `application` builder takes the sheets from `styles.css` and writes the page itself: nothing to link.
driverContract(driver, false);
