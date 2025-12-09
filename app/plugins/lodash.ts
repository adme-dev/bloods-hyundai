import * as _ from 'lodash-es';

/**
 * Lodash plugin - provides lodash globally as $lodash
 * Replaces: Vue.prototype.vLodash
 */
export default defineNuxtPlugin(() => {
  return {
    provide: {
      lodash: _,
    },
  };
});

