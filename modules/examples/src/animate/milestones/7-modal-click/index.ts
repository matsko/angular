import {AnimateAppCmp} from './app';
import {bind} from 'angular2/angular2';
import {bootstrap} from 'angular2/bootstrap';
import {routerBindings, HashLocationStrategy, LocationStrategy} from 'angular2/router';

export function main() {
  bootstrap(AnimateAppCmp,
            [routerBindings(AnimateAppCmp), bind(LocationStrategy).toClass(HashLocationStrategy)]);
}
